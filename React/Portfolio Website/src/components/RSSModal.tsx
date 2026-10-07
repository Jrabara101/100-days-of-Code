import React, { useState } from 'react';
import { X, Copy, Check, Download, Rss } from 'lucide-react';
import { Post } from '../types';

interface RSSModalProps {
  isOpen: boolean;
  onClose: () => void;
  posts: Post[];
}

export const RSSModal: React.FC<RSSModalProps> = ({ isOpen, onClose, posts }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const publishedPosts = posts.filter(p => p.status === 'published');

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Julian Vance — Digital Garden & Essays</title>
    <link>https://julianvance.design</link>
    <description>Essays on local-first state, design systems, and software ergonomics.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="https://julianvance.design/rss.xml" rel="self" type="application/rss+xml"/>
${publishedPosts.map(p => `    <item>
      <title><![CDATA[${p.title}]]></title>
      <link>https://julianvance.design/essays/${p.slug}</link>
      <guid isPermaLink="true">https://julianvance.design/essays/${p.slug}</guid>
      <pubDate>${new Date(p.published_at || p.updated_at || Date.now()).toUTCString()}</pubDate>
      <description><![CDATA[${p.excerpt}]]></description>
      <category>${p.stage}</category>
    </item>`).join('\n')}
  </channel>
</rss>`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(rssXml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([rssXml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rss.xml';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-surface-elevated-light dark:bg-surface-elevated-dark border border-border-subtle-light dark:border-border-subtle-dark rounded-2xl shadow-2xl p-6 z-10 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle-light dark:border-border-subtle-dark">
          <div className="flex items-center space-x-2">
            <Rss className="w-4 h-4 text-amber-500" />
            <h3 className="font-mono text-sm font-semibold text-primary-light dark:text-primary-dark">
              RSS Feed Syndication (/rss.xml)
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-muted-light dark:text-muted-dark hover:text-primary-light dark:hover:text-primary-dark">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-muted-light dark:text-muted-dark font-sans leading-relaxed">
          Standard RSS 2.0 endpoint syndicating all published garden essays. Readers can subscribe via NetNewsWire, Feedly, or any RSS reader.
        </p>

        <div className="relative rounded-xl overflow-hidden border border-border-subtle-light dark:border-border-subtle-dark bg-zinc-950 text-zinc-200 p-4 font-mono text-[11px] max-h-60 overflow-y-auto">
          <pre>{rssXml}</pre>
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            onClick={handleDownload}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-border-subtle-light dark:border-border-subtle-dark bg-surface-secondary-light dark:bg-surface-secondary-dark text-xs font-mono"
          >
            <Download className="w-3.5 h-3.5 text-accent-emerald" />
            <span>Download rss.xml</span>
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-primary-light dark:bg-primary-dark text-white dark:text-zinc-900 text-xs font-mono font-semibold"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-accent-emerald" />
                <span>Copied XML!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy to Clipboard</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
