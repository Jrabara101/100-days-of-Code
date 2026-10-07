// Generate RSS 2.0 XML for articles
export const generateRssFeedXml = (posts = [], baseUrl = 'https://chronicle-codex.org') => {
  const publishedPosts = posts.filter(p => p.status === 'published');
  const now = new Date().toUTCString();

  const itemsXml = publishedPosts.map(post => {
    const pubDate = post.publishedAt ? new Date(post.publishedAt).toUTCString() : now;
    const link = `${baseUrl}/story/${post.slug}`;
    const cleanContent = (post.content || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const cleanExcerpt = (post.excerpt || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    return `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <author>${post.author?.name || 'Elena Rostova'}</author>
      <description><![CDATA[${cleanExcerpt}]]></description>
      <content:encoded><![CDATA[${cleanContent}]]></content:encoded>
    </item>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Chronicle &amp; Codex | Editorial Publishing Engine</title>
    <link>${baseUrl}</link>
    <description>An intentional, distraction-free publishing and discourse platform combining literary warmth with developer precision.</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml" />
${itemsXml}
  </channel>
</rss>`;
};
