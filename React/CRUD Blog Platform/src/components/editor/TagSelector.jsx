import React, { useState, useRef, useEffect } from 'react';
import { useBlog } from '../../context/BlogContext';
import { Tag, Plus, X, Check } from 'lucide-react';

export const TagSelector = ({ selectedTagIds = [], onChange }) => {
  const { tags, setTagModalData } = useBlog();
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedTags = tags.filter(t => selectedTagIds.includes(t.id));

  const availableTags = tags.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(inputValue.toLowerCase()) ||
                          t.slug.toLowerCase().includes(inputValue.toLowerCase());
    return matchesSearch && !selectedTagIds.includes(t.id);
  });

  const handleSelectTag = (tagId) => {
    if (!selectedTagIds.includes(tagId)) {
      onChange([...selectedTagIds, tagId]);
    }
    setInputValue('');
    setIsOpen(false);
  };

  const handleRemoveTag = (tagId) => {
    onChange(selectedTagIds.filter(id => id !== tagId));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (availableTags.length > 0) {
        handleSelectTag(availableTags[0].id);
      } else if (inputValue.trim()) {
        // Open modal to create this tag
        setTagModalData({
          isOpen: true,
          tag: { name: inputValue.trim() }
        });
        setInputValue('');
        setIsOpen(false);
      }
    } else if (e.key === 'Backspace' && !inputValue && selectedTagIds.length > 0) {
      handleRemoveTag(selectedTagIds[selectedTagIds.length - 1]);
    }
  };

  return (
    <div ref={containerRef} className="relative py-2">
      <div className="flex flex-wrap items-center gap-1.5 min-h-[38px] p-1.5 rounded-xl border border-[#E5E5DF] dark:border-[#26272C] bg-white dark:bg-[#141518] focus-within:ring-1 focus-within:ring-[#18181B] dark:focus-within:ring-white transition-all">
        
        {/* Selected Tag Chips */}
        {selectedTags.map(tag => (
          <span
            key={tag.id}
            style={{
              color: tag.color || '#2563EB',
              backgroundColor: tag.bgColor || 'rgba(37, 99, 235, 0.1)',
              borderColor: `${tag.color || '#2563EB'}40`
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono border"
          >
            <span>#{tag.name}</span>
            <button
              type="button"
              onClick={() => handleRemoveTag(tag.id)}
              className="hover:opacity-70 cursor-pointer p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        {/* Tag Input */}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={selectedTags.length === 0 ? "Add tags (e.g. #react, #architecture)..." : "Add more tags..."}
          className="flex-1 min-w-[140px] px-2 py-1 text-xs font-mono bg-transparent border-none outline-hidden text-[#18181B] dark:text-[#F4F4F6] placeholder:text-[#71717A]/60"
        />

        {/* New Tag CTA */}
        <button
          type="button"
          onClick={() => setTagModalData({ isOpen: true, tag: null })}
          className="p-1 text-[#71717A] hover:text-[#18181B] dark:hover:text-[#F4F4F6] rounded-md transition-colors"
          title="Create New Taxonomy Tag"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Auto-complete Dropdown Menu */}
      {isOpen && (availableTags.length > 0 || inputValue.trim()) && (
        <div className="absolute z-50 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white dark:bg-[#1B1C21] rounded-xl shadow-xl border border-[#E5E5DF] dark:border-[#26272C] p-1.5 animate-in fade-in duration-100">
          {availableTags.map(tag => (
            <button
              key={tag.id}
              type="button"
              onClick={() => handleSelectTag(tag.id)}
              className="w-full flex items-center justify-between p-2 rounded-lg text-left text-xs hover:bg-[#F3F3EE] dark:hover:bg-[#141518] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                <span className="font-mono font-semibold text-[#18181B] dark:text-[#F4F4F6]">
                  #{tag.name}
                </span>
                <span className="text-[11px] text-[#71717A] dark:text-[#9496A1]">
                  ({tag.postsCount || 0} stories)
                </span>
              </div>
              <span className="text-[10px] text-[#71717A] dark:text-[#9496A1] font-mono">
                Click to add
              </span>
            </button>
          ))}

          {/* If no exact match, allow inline tag creation */}
          {inputValue.trim() && !tags.some(t => t.name.toLowerCase() === inputValue.trim().toLowerCase()) && (
            <button
              type="button"
              onClick={() => {
                setTagModalData({ isOpen: true, tag: { name: inputValue.trim() } });
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 p-2 rounded-lg text-left text-xs font-mono text-[#4F46E5] hover:bg-[#F3F3EE] dark:hover:bg-[#141518] transition-colors border-t border-[#E5E5DF]/60 dark:border-[#26272C]/60 mt-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create new topic: #{inputValue.trim()}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
