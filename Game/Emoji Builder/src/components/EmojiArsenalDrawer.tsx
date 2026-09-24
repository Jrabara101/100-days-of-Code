import React, { useState, useMemo } from 'react';
import { Search, Sparkles, ChefHat, Flame, HelpCircle } from 'lucide-react';
import { EMOJI_CATALOG, COMPANION_EMOJIS, BAKED_PROP_RECIPES, EmojiItem } from '../data/emojiCatalog';
import { ThemeConfig } from '../types';
import { sound } from '../utils/soundEngine';

interface EmojiArsenalDrawerProps {
  theme: ThemeConfig;
  selectedStickerChar?: string;
  onAddSticker: (char: string, name?: string) => void;
}

export const EmojiArsenalDrawer: React.FC<EmojiArsenalDrawerProps> = ({
  theme,
  selectedStickerChar,
  onAddSticker,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('bakery');
  const isDark = theme.isDark;

  // Filter emojis with fast search
  const filteredEmojis = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) {
      return EMOJI_CATALOG.filter((item) => item.category === activeCategory);
    }
    return EMOJI_CATALOG.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.char.includes(q) ||
        item.keywords.some((k) => k.toLowerCase().includes(q))
    );
  }, [searchTerm, activeCategory]);

  // Companion suggestions based on selected sticker
  const companionChars = useMemo(() => {
    if (selectedStickerChar && COMPANION_EMOJIS[selectedStickerChar]) {
      return COMPANION_EMOJIS[selectedStickerChar];
    }
    return ['🍓', '🎂', '🐻', '🪄', '🍯', '✨'];
  }, [selectedStickerChar]);

  // "Bake Sweet AI Prop" procedural generator
  const handleBakeAIProp = () => {
    const randomRecipe = BAKED_PROP_RECIPES[Math.floor(Math.random() * BAKED_PROP_RECIPES.length)];
    sound.playDing();
    randomRecipe.combo.forEach((char, idx) => {
      setTimeout(() => {
        onAddSticker(char, randomRecipe.name);
        sound.playPop();
      }, idx * 100);
    });
  };

  const categories = [
    { id: 'bakery', label: 'Bakery', icon: '🍓' },
    { id: 'friends', label: 'Friends', icon: '🐻' },
    { id: 'fantasy', label: 'Magic', icon: '🪄' },
    { id: 'adventure', label: 'Action', icon: '🤠' },
    { id: 'emotes', label: 'Emotes', icon: '🥰' },
    { id: 'objects', label: 'Props', icon: '🔔' },
  ];

  return (
    <aside
      className={`w-[290px] lg:w-[310px] shrink-0 rounded-3xl border flex flex-col justify-between overflow-hidden p-3.5 my-1 transition-all ${
        isDark
          ? 'bg-[#10131a]/95 border-[#374151] text-stone-200 shadow-brutal-hard'
          : 'bg-white/85 backdrop-blur-md border-white shadow-marshmallow text-stone-800'
      }`}
    >
      <div className="flex flex-col gap-2.5">
        {/* Search Input */}
        <div className="relative flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-berry-red" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search stickers, props, emojis..."
            className={`w-full font-quicksand text-xs pl-9 pr-14 py-2.5 rounded-2xl border outline-none shadow-inner transition-colors ${
              isDark
                ? 'bg-[#191b23] border-[#374151] text-white focus:border-amber-400 placeholder:text-stone-500'
                : 'bg-rose-50/50 border-rose-100 text-stone-800 focus:ring-2 focus:ring-berry-red/30 placeholder:text-stone-400'
            }`}
          />
          <span
            className="absolute right-2 px-1.5 py-0.5 rounded-lg text-[9px] font-fredoka font-bold uppercase shadow-sm"
            style={{ backgroundColor: theme.primaryLight, color: theme.primaryColor }}
          >
            CATALOG
          </span>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const active = activeCategory === cat.id && !searchTerm;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  setSearchTerm('');
                  sound.playPop();
                }}
                className={`px-2.5 py-1 rounded-2xl font-fredoka text-xs font-semibold shrink-0 clay-puffy flex items-center gap-1 transition-all ${
                  active
                    ? isDark
                      ? 'bg-amber-500 text-stone-950 font-bold shadow-brutal-hard'
                      : 'bg-berry-red text-white font-bold shadow-clay-sm'
                    : isDark
                    ? 'bg-[#191b23] text-stone-300 hover:bg-stone-800'
                    : 'bg-rose-50/70 text-stone-700 hover:bg-rose-100'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Theme Swatch & Mood Banner */}
        <div
          className={`p-2 rounded-2xl border flex flex-col gap-1 shadow-sm ${
            isDark
              ? 'bg-[#191b23] border-[#374151]'
              : 'bg-gradient-to-r from-rose-50 via-pink-50 to-amber-50 border-rose-200/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-fredoka text-xs font-bold flex items-center gap-1 truncate">
              <span>{theme.icon}</span> {theme.name}
            </span>
            <span
              className="text-[9px] font-fredoka font-bold px-2 py-0.5 rounded-full shadow-sm"
              style={{ backgroundColor: theme.primaryColor, color: '#ffffff' }}
            >
              ACTIVE REALM
            </span>
          </div>
          {/* Swatch bars */}
          <div className="flex items-center gap-1.5 pt-0.5">
            <div
              className="flex-1 h-3 rounded-lg shadow-sm"
              style={{ backgroundColor: theme.primaryColor }}
              title="Primary Pigment"
            />
            <div
              className="flex-1 h-3 rounded-lg shadow-sm"
              style={{ backgroundColor: theme.accentColor }}
              title="Accent Flare"
            />
            <div
              className="flex-1 h-3 rounded-lg shadow-sm"
              style={{ backgroundColor: theme.primaryLight }}
              title="Soft Tint"
            />
          </div>
        </div>

        {/* Semantic Companions Row */}
        <div className="flex items-center justify-between px-1 pt-1">
          <span className="font-fredoka text-[10px] uppercase font-bold text-stone-400">
            Suggested Companions:
          </span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none px-1">
          {companionChars.map((c, i) => (
            <button
              key={i}
              onClick={() => {
                onAddSticker(c);
                sound.playPop();
              }}
              className={`w-8 h-8 rounded-xl flex items-center justify-center text-lg border transition-transform hover:scale-125 clay-puffy ${
                isDark ? 'bg-[#191b23] border-[#374151]' : 'bg-white border-rose-100 shadow-sm'
              }`}
              title={`Add ${c}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Main Sticker Grid */}
      <div className="flex-1 overflow-y-auto px-1 py-1 my-1">
        <div className="flex items-center justify-between mb-1.5 px-1">
          <span className="font-fredoka text-[10px] uppercase tracking-wider text-stone-400 font-bold">
            Sticker Vault
          </span>
          <span
            className="font-fredoka text-[9px] px-2 py-0.5 rounded-full font-bold"
            style={{ backgroundColor: theme.primaryLight, color: theme.primaryColor }}
          >
            {filteredEmojis.length} Available
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {filteredEmojis.map((item) => (
            <div
              key={item.name}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', item.char);
                sound.playPop();
              }}
              onClick={() => {
                onAddSticker(item.char, item.name);
                sound.playPop();
              }}
              className={`group relative flex flex-col items-center justify-center h-[62px] rounded-2xl border cursor-grab active:cursor-grabbing transition-transform clay-puffy shadow-sm ${
                isDark
                  ? 'bg-[#191b23] hover:bg-stone-800 border-[#374151]'
                  : 'bg-white hover:bg-rose-50/80 border-stone-100 hover:border-rose-200'
              }`}
              title={`Click or drag ${item.name}`}
            >
              <span className="text-2xl group-hover:scale-125 transition-transform select-none">
                {item.char}
              </span>
              <span className="font-fredoka text-[8px] text-stone-500 font-semibold mt-0.5 truncate w-full text-center px-0.5">
                {item.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Bake AI Prop Action */}
      <div className="pt-2 flex flex-col gap-1.5 shrink-0">
        <button
          onClick={handleBakeAIProp}
          className={`w-full py-2.5 px-3 rounded-2xl font-fredoka text-xs font-bold transition-all clay-puffy flex items-center justify-between shadow-clay-btn ${
            isDark
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 border border-amber-300'
              : 'bg-gradient-to-r from-berry-red via-rose-400 to-cream-pink text-white border-t border-rose-200'
          }`}
          title="Bake a procedural themed combo prop onto the stage!"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg animate-spin" style={{ animationDuration: '6s' }}>
              🧁
            </span>
            <span>Bake Sweet AI Prop</span>
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase shadow-sm ${
              isDark ? 'bg-stone-900 text-amber-400' : 'bg-white text-berry-red'
            }`}
          >
            WHIP!
          </span>
        </button>
      </div>
    </aside>
  );
};
