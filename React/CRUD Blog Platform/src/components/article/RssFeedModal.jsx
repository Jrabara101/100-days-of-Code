import React, { useState } from 'react';
import { useBlog } from '../../context/BlogContext';
import { generateRssFeedXml } from '../../services/rssGenerator';
import { useToast } from '../../context/ToastContext';
import { X, Copy, Check, Download, Rss } from 'lucide-react';

export const RssFeedModal = () => {
  const { isRssModalOpen, setIsRssModalOpen, posts } = useBlog();
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  if (!isRssModalOpen) return null;

  const xmlContent = generateRssFeedXml(posts);

  const handleCopy = () => {
    navigator.clipboard.writeText(xmlContent);
    setCopied(true);
    showToast('RSS 2.0 XML copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([xmlContent], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'feed.xml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Downloaded /feed.xml', 'info');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-[#1B1C21] rounded-2xl shadow-2xl border border-[#E5E5DF] dark:border-[#26272C] overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#E5E5DF] dark:border-[#26272C] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#D97706]/10 text-[#D97706]">
              <Rss className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-[#18181B] dark:text-[#F4F4F6]">
                RSS 2.0 Syndication Feed
              </h3>
              <p className="text-xs text-[#71717A] dark:text-[#9496A1]">
                Full-fidelity syndication feed for NetNewsWire, Feedly, and RSS readers.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsRssModalOpen(false)}
            className="p-1.5 text-[#71717A] hover:text-[#18181B] dark:hover:text-[#F4F4F6] rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* XML Preview Code Window */}
        <div className="p-5 flex-1 overflow-y-auto bg-[#FAFAF8] dark:bg-[#141518]">
          <pre className="font-mono text-xs text-[#18181B] dark:text-[#F4F4F6] leading-relaxed p-4 rounded-xl bg-white dark:bg-[#0C0D0E] border border-[#E5E5DF] dark:border-[#26272C] overflow-x-auto select-all">
            {xmlContent}
          </pre>
        </div>

        {/* Actions Footer */}
        <div className="p-4 border-t border-[#E5E5DF] dark:border-[#26272C] bg-white dark:bg-[#1B1C21] flex items-center justify-between">
          <span className="text-xs font-mono text-[#71717A] dark:text-[#9496A1]">
            Valid RSS 2.0 with &lt;content:encoded&gt; support
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-lg border border-[#E5E5DF] dark:border-[#26272C] hover:bg-[#F3F3EE] dark:hover:bg-[#141518] text-[#18181B] dark:text-[#F4F4F6] transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Feed XML'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-lg bg-[#18181B] text-white dark:bg-[#F4F4F6] dark:text-[#18181B] hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download feed.xml</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
