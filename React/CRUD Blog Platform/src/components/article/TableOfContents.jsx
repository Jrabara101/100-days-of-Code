import React, { useState, useEffect } from 'react';
import { List, ChevronRight } from 'lucide-react';

export const TableOfContents = ({ content = '' }) => {
  const [headings, setHeadings] = useState([]);
  const [activeId, setActiveId] = useState('');

  // Extract headings from markdown content
  useEffect(() => {
    const lines = content.split('\n');
    const items = [];

    lines.forEach((line) => {
      const match = line.match(/^(#{2,3})\s+(.+)$/);
      if (match) {
        const level = match[1].length; // 2 or 3
        const title = match[2].trim();
        const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        items.push({ id, title, level });
      }
    });

    setHeadings(items);
  }, [content]);

  // Track active heading on scroll
  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-80px 0px -60% 0px' }
    );

    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 2) return null;

  const scrollToHeading = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  return (
    <nav className="p-4 rounded-2xl border border-[#E5E5DF] dark:border-[#26272C] bg-[#FAFAF8]/90 dark:bg-[#141518]/90 backdrop-blur-xs mb-8 text-xs font-mono">
      <div className="flex items-center gap-2 mb-3 text-[#18181B] dark:text-[#F4F4F6] font-semibold">
        <List className="w-3.5 h-3.5 text-[#E11D48]" />
        <span className="uppercase tracking-wider text-[10px]">Table of Contents</span>
      </div>

      <ul className="space-y-1.5 border-l border-[#E5E5DF] dark:border-[#26272C] ml-1.5 pl-2.5">
        {headings.map(({ id, title, level }) => {
          const isActive = activeId === id;
          return (
            <li
              key={id}
              className={`${level === 3 ? 'ml-3' : ''}`}
            >
              <button
                onClick={() => scrollToHeading(id)}
                className={`text-left block w-full truncate py-0.5 transition-colors cursor-pointer ${
                  isActive
                    ? 'text-[#E11D48] font-bold underline'
                    : 'text-[#71717A] dark:text-[#9496A1] hover:text-[#18181B] dark:hover:text-[#F4F4F6]'
                }`}
              >
                {title}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
