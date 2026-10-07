-- ==============================================================================
-- ATELIER PORTFOLIO SUITE: SUPABASE & POSTGRESQL SCHEMA SPECIFICATION
-- ==============================================================================
-- Enables full Row Level Security (RLS), atomic RPC counters, and edge webhooks.

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. POSTS TABLE
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    excerpt TEXT NOT NULL,
    content TEXT NOT NULL,
    stage TEXT NOT NULL CHECK (stage IN ('seedling', 'budding', 'evergreen')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    view_count INT DEFAULT 0,
    claps_count INT DEFAULT 0,
    read_time_minutes INT DEFAULT 5,
    cover_image TEXT,
    featured BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TAGS & NORMALIZED RELATIONSHIPS
CREATE TABLE IF NOT EXISTS public.tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.post_tags (
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
);

-- 4. INQUIRIES TABLE (CONTACT CRM)
CREATE TABLE IF NOT EXISTS public.inquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_name TEXT NOT NULL,
    sender_email TEXT NOT NULL,
    intent TEXT NOT NULL CHECK (intent IN ('project_engagement', 'design_systems', 'advisory_speaking', 'coffee_chat')),
    budget_tier TEXT CHECK (budget_tier IN ('under_10k', '10k_25k', '25k_plus')),
    message TEXT NOT NULL,
    timeline TEXT,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'replied', 'archived')),
    ip_hash TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. NEWSLETTER SUBSCRIBERS
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    source_slug TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CLAPS LOG (FOR RATE LIMITING & AUDITING)
CREATE TABLE IF NOT EXISTS public.claps_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    amount INT DEFAULT 1,
    ip_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 7. ATOMIC COUNTER FUNCTIONS (RPC)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.increment_post_claps(post_id UUID, amount INT DEFAULT 1)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_count INT;
BEGIN
    UPDATE public.posts
    SET claps_count = COALESCE(claps_count, 0) + amount,
        updated_at = NOW()
    WHERE id = post_id
    RETURNING claps_count INTO new_count;

    RETURN new_count;
END;
$$;

-- Auto-update updated_at timestamp trigger
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER set_timestamp_posts
BEFORE UPDATE ON public.posts
FOR EACH ROW
EXECUTE PROCEDURE public.trigger_set_timestamp();

CREATE OR REPLACE TRIGGER set_timestamp_inquiries
BEFORE UPDATE ON public.inquiries
FOR EACH ROW
EXECUTE PROCEDURE public.trigger_set_timestamp();

-- ==============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claps_log ENABLE ROW LEVEL SECURITY;

-- Posts: Public can read published posts; only authenticated admins can manage
CREATE POLICY "Public can view published posts"
ON public.posts FOR SELECT
USING (status = 'published');

CREATE POLICY "Admin full access to posts"
ON public.posts FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Tags: Public can view tags; Admin can manage
CREATE POLICY "Public can view tags"
ON public.tags FOR SELECT
USING (true);

CREATE POLICY "Admin full access to tags"
ON public.tags FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Public can view post_tags"
ON public.post_tags FOR SELECT
USING (true);

CREATE POLICY "Admin full access to post_tags"
ON public.post_tags FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Inquiries: Public can insert their own inquiries; only authenticated admin can view/update
CREATE POLICY "Public can submit inquiries"
ON public.inquiries FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admin can view and update inquiries"
ON public.inquiries FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Newsletter Subscribers: Public can subscribe; Admin can view list
CREATE POLICY "Public can subscribe to newsletter"
ON public.newsletter_subscribers FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admin can view subscribers"
ON public.newsletter_subscribers FOR SELECT
TO authenticated
USING (true);

-- Claps: Public can insert claps;
CREATE POLICY "Public can log claps"
ON public.claps_log FOR INSERT
WITH CHECK (true);

-- ==============================================================================
-- 9. AUTOMATION & EDGE WEBHOOK CONFIGURATION NOTE
-- ==============================================================================
-- To notify Telegram or Discord on incoming inquiries:
-- In Supabase Dashboard -> Database -> Webhooks -> Add Webhook:
-- Name: on_inquiry_created
-- Table: inquiries
-- Events: INSERT
-- HTTP Request: POST to Edge Function or Discord/Telegram Webhook URL
-- Example Edge Function Body:
--   curl -X POST https://api.resend.com/emails \
--     -H "Authorization: Bearer $RESEND_API_KEY" \
--     -d '{"from": "contact@yourdomain.com", "to": "admin@yourdomain.com", "subject": "New Portfolio Inquiry"}'
