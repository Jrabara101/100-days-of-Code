-- ==============================================================================
-- HIGH-RETENTION E-LEARNING PLATFORM: CORE POSTGRESQL & SUPABASE SCHEMA
-- Features: Active Split-Screen Classroom, FSRS/SM-2 Memory Vault, 
--           Metacognitive Confidence Calibration, Ebbinghaus Retention Decay
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum Types
CREATE TYPE difficulty_level AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE lesson_type AS ENUM ('video_lecture', 'interactive_reading', 'hands_on_lab');
CREATE TYPE quiz_mode AS ENUM ('in_video_checkpoint', 'module_mastery', 'diagnostic_test_out', 'final_certification');
CREATE TYPE question_type AS ENUM ('multiple_choice', 'multi_select', 'cloze_fill', 'drag_order', 'diagram_hotspot');
CREATE TYPE confidence_level AS ENUM ('guessing', 'fairly_sure', 'high_confidence');

-- 1. COURSES TABLE
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    difficulty difficulty_level NOT NULL DEFAULT 'intermediate',
    category TEXT NOT NULL,
    skill_axes_json JSONB NOT NULL DEFAULT '[]'::jsonb, -- e.g. ["System Design", "SQL", "Consensus"]
    total_duration_minutes INT NOT NULL DEFAULT 0,
    author_name TEXT NOT NULL,
    author_role TEXT,
    author_avatar TEXT,
    thumbnail_url TEXT,
    published_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. MODULES TABLE (DAG Skill Tree Dependencies)
CREATE TABLE modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    sort_order INT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    prerequisite_module_ids UUID[] DEFAULT '{}',
    allow_test_out BOOLEAN DEFAULT true,
    test_out_quiz_id UUID,
    estimated_minutes INT DEFAULT 45,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. LESSONS TABLE (Video stream, chapters, synchronized transcript segments)
CREATE TABLE lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    sort_order INT NOT NULL,
    title TEXT NOT NULL,
    lesson_type lesson_type NOT NULL DEFAULT 'video_lecture',
    video_stream_url TEXT,
    duration_seconds INT NOT NULL DEFAULT 0,
    chapters_json JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{id, title, timestampSec}]
    transcript_segments_json JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{startMs, endMs, text, speaker}]
    resources_json JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{name, size, language, downloadUrl}]
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. QUIZZES TABLE
CREATE TABLE quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    module_id UUID REFERENCES modules(id) ON DELETE SET NULL,
    lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    quiz_mode quiz_mode NOT NULL DEFAULT 'module_mastery',
    passing_score_percent SMALLINT DEFAULT 80,
    time_limit_seconds INT,
    shuffle_questions BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. QUIZ QUESTIONS TABLE (Polymorphic interactive question types)
CREATE TABLE quiz_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    question_type question_type NOT NULL DEFAULT 'multiple_choice',
    video_cue_timestamp_sec INT, -- For in-video checkpoints
    prompt_markdown TEXT NOT NULL,
    options_payload JSONB DEFAULT '[]'::jsonb,
    correct_answer_payload JSONB NOT NULL, -- Kept safe from active test payload
    explanation_markdown TEXT NOT NULL,
    remediation_lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
    remediation_start_sec INT,
    remediation_end_sec INT,
    skill_axis_tag TEXT NOT NULL,
    points INT DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ENROLLMENTS & HABIT TRACKING (Pacing & Streak Freezes)
CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    weekly_target_minutes INT DEFAULT 120,
    preferred_study_days SMALLINT[] DEFAULT '{1,3,5}', -- 1=Mon, 3=Wed, 5=Fri
    projected_completion_date DATE,
    current_streak_days INT DEFAULT 0,
    streak_freezes_available SMALLINT DEFAULT 2,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    last_studied_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, course_id)
);

-- 7. LESSON PROGRESS (Watched segments tracking to prevent scrubbing)
CREATE TABLE lesson_progress (
    user_id UUID NOT NULL,
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    last_position_sec INT DEFAULT 0,
    watched_ranges_json JSONB DEFAULT '[]'::jsonb, -- [[0,60], [120, 240]]
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    PRIMARY KEY (user_id, lesson_id)
);

-- 8. STUDY LOGS (365-Day Activity Heatmap & Velocity Telemetry)
CREATE TABLE study_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    study_date DATE NOT NULL,
    minutes_studied INT DEFAULT 0,
    lessons_completed_count INT DEFAULT 0,
    quizzes_passed_count INT DEFAULT 0,
    cards_reviewed_count INT DEFAULT 0,
    streak_frozen BOOLEAN DEFAULT false,
    UNIQUE(user_id, study_date)
);

-- 9. QUIZ ATTEMPTS (Confidence calibration & conceptual blindspot scoring)
CREATE TABLE quiz_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    score_percent NUMERIC(5,2) NOT NULL,
    passed BOOLEAN NOT NULL,
    confidence_calibration_score NUMERIC(5,2) DEFAULT 0, -- % of high confidence answers that were right
    blindspots_count INT DEFAULT 0, -- High confidence + wrong
    answers_breakdown_json JSONB NOT NULL,
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ NOT NULL
);

-- 10. SPACED REPETITION CARDS (FSRS / SM-2 Memory Vault Engine)
CREATE TABLE spaced_repetition_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    easiness_factor FLOAT DEFAULT 2.5,
    interval_days INT DEFAULT 1,
    repetitions INT DEFAULT 0,
    last_reviewed_at TIMESTAMPTZ DEFAULT NOW(),
    next_review_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 day',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, question_id)
);

-- 11. TIMESTAMPED STUDY NOTES (Snapshots with millisecond video seek pills)
CREATE TABLE timestamped_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    timestamp_sec INT NOT NULL,
    frame_snapshot_url TEXT,
    content_markdown TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. TIMED LESSON Q&A (Millisecond-anchored community questions & verified answers)
CREATE TABLE timed_lesson_qa (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    author_name TEXT NOT NULL,
    author_avatar TEXT,
    timestamp_sec INT NOT NULL,
    question TEXT NOT NULL,
    upvotes INT DEFAULT 0,
    has_instructor_answer BOOLEAN DEFAULT false,
    instructor_answer_text TEXT,
    instructor_answered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. VERIFIABLE CERTIFICATES TABLE
CREATE TABLE verifiable_certificates (
    certificate_id TEXT PRIMARY KEY, -- e.g. 'CERT-2026-8841'
    user_id UUID NOT NULL,
    student_name TEXT NOT NULL,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    course_title TEXT NOT NULL,
    issue_date DATE DEFAULT CURRENT_DATE,
    total_hours_studied NUMERIC(5,1) NOT NULL,
    capstone_score_percent NUMERIC(5,2) NOT NULL,
    verification_hash TEXT NOT NULL,
    skill_breakdown_json JSONB NOT NULL,
    verified_by TEXT DEFAULT 'Academic Verification Authority'
);

-- ==============================================================================
-- REAL-TIME RETENTION DECAY & MASTERY VIEW (Ebbinghaus Forgetting Curve)
-- Calculates retention health percent: R = e^(-t / S) where S is stability (days)
-- ==============================================================================
CREATE OR REPLACE VIEW view_module_retention_health AS
WITH module_activity AS (
    SELECT 
        m.id AS module_id,
        m.course_id,
        m.title AS module_title,
        e.user_id,
        COUNT(DISTINCT l.id) AS total_lessons,
        COUNT(DISTINCT lp.lesson_id) FILTER (WHERE lp.is_completed = true) AS completed_lessons,
        COALESCE(MAX(COALESCE(src.last_reviewed_at, lp.completed_at, e.enrolled_at)), NOW() - INTERVAL '30 days') AS last_interaction,
        COALESCE(AVG(src.easiness_factor), 2.2) AS avg_stability_factor,
        COUNT(DISTINCT src.id) FILTER (WHERE src.next_review_at <= NOW()) AS fading_cards_count
    FROM modules m
    CROSS JOIN enrollments e
    LEFT JOIN lessons l ON l.module_id = m.id
    LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = e.user_id
    LEFT JOIN spaced_repetition_cards src ON src.course_id = m.course_id AND src.user_id = e.user_id
    GROUP BY m.id, m.course_id, m.title, e.user_id
)
SELECT 
    module_id,
    course_id,
    user_id,
    module_title,
    total_lessons,
    completed_lessons,
    CASE WHEN total_lessons > 0 
         THEN ROUND((completed_lessons::numeric / total_lessons::numeric) * 100, 1) 
         ELSE 0 END AS completion_percent,
    EXTRACT(DAY FROM (NOW() - last_interaction))::int AS days_since_review,
    fading_cards_count,
    -- Ebbinghaus decay formula: R = 100 * EXP(-elapsed_days / (avg_stability * 7))
    GREATEST(40, LEAST(100, ROUND(
        100.0 * EXP(
            - (GREATEST(0, EXTRACT(DAY FROM (NOW() - last_interaction)))) / 
              (GREATEST(1.0, avg_stability_factor * 8.0))
        )::numeric, 1
    ))) AS retention_health_percent
FROM module_activity;

-- ==============================================================================
-- ATOMIC QUIZ SUBMISSION & BLINDSPOT DETECTION PROCEDURE
-- ==============================================================================
CREATE OR REPLACE FUNCTION submit_quiz_answer(
    p_user_id UUID,
    p_quiz_id UUID,
    p_question_id UUID,
    p_submitted_answer JSONB,
    p_confidence confidence_level,
    p_time_spent_ms INT
) RETURNS JSONB AS $$
DECLARE
    v_correct_answer JSONB;
    v_explanation TEXT;
    v_rem_lesson UUID;
    v_rem_start INT;
    v_rem_end INT;
    v_skill_tag TEXT;
    v_course_id UUID;
    v_is_correct BOOLEAN := false;
    v_is_blindspot BOOLEAN := false;
BEGIN
    -- 1. Fetch question record
    SELECT 
        q.correct_answer_payload,
        q.explanation_markdown,
        q.remediation_lesson_id,
        q.remediation_start_sec,
        q.remediation_end_sec,
        q.skill_axis_tag,
        qz.course_id
    INTO 
        v_correct_answer,
        v_explanation,
        v_rem_lesson,
        v_rem_start,
        v_rem_end,
        v_skill_tag,
        v_course_id
    FROM quiz_questions q
    JOIN quizzes qz ON qz.id = q.quiz_id
    WHERE q.id = p_question_id;

    -- 2. Validate answer equality
    IF p_submitted_answer = v_correct_answer THEN
        v_is_correct := true;
    ELSE
        v_is_correct := false;
    END IF;

    -- 3. Detect Metacognitive Blindspot (High Confidence + Wrong)
    IF (NOT v_is_correct) AND (p_confidence = 'high_confidence') THEN
        v_is_blindspot := true;
    END IF;

    -- 4. If wrong or guessed correctly, auto-enroll into Spaced Repetition Memory Vault
    IF (NOT v_is_correct) OR (p_confidence = 'guessing') THEN
        INSERT INTO spaced_repetition_cards (
            user_id, question_id, course_id, easiness_factor, interval_days, repetitions, last_reviewed_at, next_review_at
        ) VALUES (
            p_user_id, p_question_id, v_course_id, 2.1, 1, 0, NOW(), NOW() + INTERVAL '1 day'
        )
        ON CONFLICT (user_id, question_id) DO UPDATE SET
            easiness_factor = GREATEST(1.3, spaced_repetition_cards.easiness_factor - 0.2),
            interval_days = 1,
            next_review_at = NOW() + INTERVAL '1 day',
            last_reviewed_at = NOW();
    END IF;

    -- 5. Return safe result payload
    RETURN jsonb_build_object(
        'is_correct', v_is_correct,
        'is_blindspot', v_is_blindspot,
        'correct_answer', v_correct_answer,
        'explanation_markdown', v_explanation,
        'remediation_lesson_id', v_rem_lesson,
        'remediation_start_sec', v_rem_start,
        'remediation_end_sec', v_rem_end,
        'skill_axis_tag', v_skill_tag
    );
END;
$$ LANGUAGE plpgsql;

