import React, { useState } from 'react';
import { marked } from 'marked';
import katex from 'katex';
import { Copy, Check, Info, AlertTriangle, Lightbulb } from 'lucide-react';

interface ArticleRendererProps {
  content: string;
}

export const ArticleRenderer: React.FC<ArticleRendererProps> = ({ content }) => {
  // Pre-process LaTeX equations before passing to markdown
  const processMathAndMarkdown = (rawText: string) => {
    // 1. Process block math $$ ... $$
    let text = rawText.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
      try {
        const rendered = katex.renderToString(math.trim(), {
          displayMode: true,
          throwOnError: false,
        });
        return `<div class="my-6 overflow-x-auto text-center py-3 bg-surface-secondary-light/60 dark:bg-surface-secondary-dark/60 rounded-lg border border-border-subtle-light dark:border-border-subtle-dark">${rendered}</div>`;
      } catch (err) {
        return `<pre class="text-red-500">${math}</pre>`;
      }
    });

    // 2. Process inline math $ ... $
    text = text.replace(/\$([^\$\n]+?)\$/g, (_, math) => {
      try {
        return katex.renderToString(math.trim(), {
          displayMode: false,
          throwOnError: false,
        });
      } catch (err) {
        return `<code>${math}</code>`;
      }
    });

    return text;
  };

  const parsedHtml = marked.parse(processMathAndMarkdown(content), {
    gfm: true,
    breaks: false,
  }) as string;

  return (
    <div className="relative">
      <div 
        className="editorial-prose text-primary-light dark:text-primary-dark max-w-none"
        dangerouslySetInnerHTML={{ __html: parsedHtml }}
      />
    </div>
  );
};

// Standalone interactive Code Block with copy action
export const CodeSnippetContainer: React.FC<{ code: string; language: string; filename?: string }> = ({
  code,
  language,
  filename,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="my-6 rounded-xl overflow-hidden border border-border-subtle-light dark:border-border-subtle-dark bg-[#111115] text-[#F4F4F6] shadow-sm font-mono text-xs">
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#18181F] border-b border-[#24242A]">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#3F3F46]"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-[#3F3F46]"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-[#3F3F46]"></span>
          <span className="text-[#A1A1AA] text-[11px] ml-2 tracking-wider uppercase font-semibold">
            {filename || language || 'code'}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#24242A] hover:bg-[#32323A] text-[#A1A1AA] hover:text-white transition-colors duration-150 text-[11px]"
          title="Copy snippet"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-accent-emerald" />
              <span className="text-accent-emerald font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="p-4 overflow-x-auto text-[13px] leading-relaxed">
        <pre>
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};
