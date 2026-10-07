import React, { useState, useEffect } from 'react';
import { 
  Heading2, 
  Heading3, 
  Quote, 
  Code, 
  List, 
  Minus, 
  Image, 
  AlertCircle 
} from 'lucide-react';

const SLASH_COMMANDS = [
  {
    id: 'h2',
    label: 'Heading 2',
    description: 'Large section heading',
    icon: Heading2,
    snippet: '\n## Section Heading\n\n'
  },
  {
    id: 'h3',
    label: 'Heading 3',
    description: 'Sub-section header',
    icon: Heading3,
    snippet: '\n### Subsection Title\n\n'
  },
  {
    id: 'quote',
    label: 'Blockquote',
    description: 'Editorial quotation with left accent',
    icon: Quote,
    snippet: '\n> "Insert illuminating quotation here"\n\n'
  },
  {
    id: 'code',
    label: 'Code Fence',
    description: 'Syntax-highlighted monospace block',
    icon: Code,
    snippet: '\n```javascript\n// Write your code logic here\nconst result = compute();\n```\n\n'
  },
  {
    id: 'callout',
    label: 'Callout Note',
    description: 'Highlighted thematic note box',
    icon: AlertCircle,
    snippet: '\n> **Key Takeaway:** An intentional architectural decision.\n\n'
  },
  {
    id: 'list',
    label: 'Bullet List',
    description: 'Unordered point list',
    icon: List,
    snippet: '\n* Point one\n* Point two\n* Point three\n\n'
  },
  {
    id: 'divider',
    label: 'Divider Line',
    description: 'Horizontal thematic break',
    icon: Minus,
    snippet: '\n---\n\n'
  },
  {
    id: 'image',
    label: 'Image Embed',
    description: 'Embedded photography with caption',
    icon: Image,
    snippet: '\n![Editorial Photography](https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=1200&q=80)\n\n'
  }
];

export const SlashMenu = ({ filter = '', onSelect, onClose }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredCommands = SLASH_COMMANDS.filter(cmd =>
    cmd.label.toLowerCase().includes(filter.toLowerCase()) ||
    cmd.description.toLowerCase().includes(filter.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [filter]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % (filteredCommands.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % (filteredCommands.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          onSelect(filteredCommands[selectedIndex].snippet);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredCommands, selectedIndex, onSelect, onClose]);

  if (filteredCommands.length === 0) return null;

  return (
    <div className="absolute z-50 mt-1 w-64 p-1.5 bg-white dark:bg-[#1B1C21] rounded-2xl shadow-2xl border border-[#E5E5DF] dark:border-[#26272C] text-xs animate-in fade-in zoom-in-95 duration-100">
      <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-[#71717A] dark:text-[#9496A1] font-semibold border-b border-[#E5E5DF]/60 dark:border-[#26272C]/60 mb-1">
        Insert Block (/)
      </div>

      <div className="max-h-56 overflow-y-auto space-y-0.5">
        {filteredCommands.map((cmd, idx) => {
          const Icon = cmd.icon;
          const isSelected = idx === selectedIndex;

          return (
            <button
              key={cmd.id}
              type="button"
              onClick={() => onSelect(cmd.snippet)}
              onMouseEnter={() => setSelectedIndex(idx)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-[#18181B] text-white dark:bg-[#F4F4F6] dark:text-[#18181B]'
                  : 'text-[#18181B] dark:text-[#F4F4F6] hover:bg-[#F3F3EE] dark:hover:bg-[#141518]'
              }`}
            >
              <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-white/20 dark:bg-black/10' : 'bg-[#F3F3EE] dark:bg-[#141518]'}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-xs leading-none truncate">
                  {cmd.label}
                </p>
                <p className={`text-[10px] mt-0.5 truncate ${isSelected ? 'opacity-80' : 'text-[#71717A] dark:text-[#9496A1]'}`}>
                  {cmd.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
