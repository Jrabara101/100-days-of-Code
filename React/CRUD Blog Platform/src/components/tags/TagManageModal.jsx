import React, { useState, useEffect } from 'react';
import { useBlog } from '../../context/BlogContext';
import { X, Tag, Trash2, Check, Palette } from 'lucide-react';

const PRESET_PALETTES = [
  { name: 'Cobalt', color: '#2563EB', bgColor: 'rgba(37, 99, 235, 0.12)' },
  { name: 'Purple', color: '#9333EA', bgColor: 'rgba(147, 51, 234, 0.12)' },
  { name: 'Teal', color: '#0D9488', bgColor: 'rgba(13, 148, 136, 0.12)' },
  { name: 'Amber', color: '#D97706', bgColor: 'rgba(217, 119, 6, 0.12)' },
  { name: 'Crimson', color: '#E11D48', bgColor: 'rgba(225, 29, 72, 0.12)' },
  { name: 'Emerald', color: '#059669', bgColor: 'rgba(5, 150, 105, 0.12)' },
  { name: 'Indigo', color: '#4F46E5', bgColor: 'rgba(79, 70, 229, 0.12)' }
];

export const TagManageModal = () => {
  const { tagModalData, setTagModalData, saveTag, deleteTag } = useBlog();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPalette, setSelectedPalette] = useState(PRESET_PALETTES[0]);

  useEffect(() => {
    if (tagModalData.isOpen) {
      if (tagModalData.tag) {
        setName(tagModalData.tag.name || '');
        setSlug(tagModalData.tag.slug || '');
        setDescription(tagModalData.tag.description || '');
        const matched = PRESET_PALETTES.find(p => p.color === tagModalData.tag.color) || PRESET_PALETTES[0];
        setSelectedPalette(matched);
      } else {
        setName('');
        setSlug('');
        setDescription('');
        setSelectedPalette(PRESET_PALETTES[0]);
      }
    }
  }, [tagModalData]);

  if (!tagModalData.isOpen) return null;

  const isEditing = !!tagModalData.tag?.id;

  const handleNameChange = (val) => {
    setName(val);
    if (!isEditing) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    saveTag({
      id: tagModalData.tag?.id,
      name: name.trim(),
      slug: slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: description.trim(),
      color: selectedPalette.color,
      bgColor: selectedPalette.bgColor
    });

    setTagModalData({ isOpen: false, tag: null });
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete the tag #${tagModalData.tag.name}? It will be removed from all associated articles.`)) {
      deleteTag(tagModalData.tag.id);
      setTagModalData({ isOpen: false, tag: null });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-lg bg-white dark:bg-[#1B1C21] rounded-2xl shadow-2xl border border-[#E5E5DF] dark:border-[#26272C] overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#E5E5DF] dark:border-[#26272C] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-[#2563EB]" />
            <h3 className="font-serif font-bold text-lg text-[#18181B] dark:text-[#F4F4F6]">
              {isEditing ? `Edit Topic #${tagModalData.tag.name}` : 'Create Curated Taxonomy Topic'}
            </h3>
          </div>
          <button
            onClick={() => setTagModalData({ isOpen: false, tag: null })}
            className="p-1.5 text-[#71717A] hover:text-[#18181B] dark:hover:text-[#F4F4F6] rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#18181B] dark:text-[#F4F4F6] mb-1 font-mono uppercase tracking-wider">
              Topic Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Distributed Systems"
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E5DF] dark:border-[#26272C] bg-[#FAFAF8] dark:bg-[#141518] text-sm text-[#18181B] dark:text-[#F4F4F6] focus:outline-hidden focus:ring-1 focus:ring-[#2563EB]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#18181B] dark:text-[#F4F4F6] mb-1 font-mono uppercase tracking-wider">
              URL Slug
            </label>
            <div className="flex items-center rounded-lg border border-[#E5E5DF] dark:border-[#26272C] bg-[#FAFAF8] dark:bg-[#141518] px-3">
              <span className="text-xs font-mono text-[#71717A] dark:text-[#9496A1]">/tag/</span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="distributed-systems"
                className="w-full py-2.5 px-1 bg-transparent text-sm text-[#18181B] dark:text-[#F4F4F6] focus:outline-hidden font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#18181B] dark:text-[#F4F4F6] mb-1 font-mono uppercase tracking-wider">
              Curated Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the scope and technical focus of this topic..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E5DF] dark:border-[#26272C] bg-[#FAFAF8] dark:bg-[#141518] text-sm text-[#18181B] dark:text-[#F4F4F6] focus:outline-hidden focus:ring-1 focus:ring-[#2563EB]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#18181B] dark:text-[#F4F4F6] mb-2 font-mono uppercase tracking-wider">
              Taxonomy Palette
            </label>
            <div className="flex flex-wrap gap-2.5">
              {PRESET_PALETTES.map((pal) => {
                const isSelected = selectedPalette.color === pal.color;
                return (
                  <button
                    key={pal.name}
                    type="button"
                    onClick={() => setSelectedPalette(pal)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono border transition-all cursor-pointer ${
                      isSelected ? 'ring-2 ring-offset-2 ring-black dark:ring-white font-semibold' : 'opacity-80 hover:opacity-100'
                    }`}
                    style={{
                      color: pal.color,
                      backgroundColor: pal.bgColor,
                      borderColor: `${pal.color}40`
                    }}
                  >
                    <span>#{name || pal.name}</span>
                    {isSelected && <Check className="w-3 h-3" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[#E5E5DF] dark:border-[#26272C] flex items-center justify-between">
            {isEditing ? (
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#E11D48] hover:text-red-700 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Tag</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTagModalData({ isOpen: false, tag: null })}
                className="px-4 py-2 rounded-lg text-xs font-medium border border-[#E5E5DF] dark:border-[#26272C] text-[#71717A] dark:text-[#9496A1] hover:bg-[#F3F3EE] dark:hover:bg-[#141518] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg text-xs font-medium bg-[#18181B] text-white dark:bg-[#F4F4F6] dark:text-[#18181B] hover:opacity-90 cursor-pointer shadow-xs"
              >
                {isEditing ? 'Save Changes' : 'Create Tag'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
