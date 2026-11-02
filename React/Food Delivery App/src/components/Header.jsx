import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Search,
  Sun,
  Moon,
  Bike,
  Sparkles,
  ChevronDown,
  X
} from 'lucide-react';
import { formatCents } from '../services/priceCalculator';

export function Header({
  addressInfo,
  onOpenAddressModal,
  showTrueCost,
  onToggleTrueCost,
  theme,
  onToggleTheme,
  cartTotals,
  cartItems,
  onOpenCartDrawer,
  hasActiveOrder,
  onOpenTracking,
  allRestaurants,
  allDishes,
  onSelectRestaurant,
  onSelectDish
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef(null);

  // Keyboard shortcut: ⌘K or Ctrl+K to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter search results
  const filteredRestaurants = searchQuery.trim()
    ? allRestaurants.filter((r) =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.cuisine_tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  const filteredDishes = searchQuery.trim()
    ? allDishes.filter((d) =>
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const totalCartCount = cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);

  // Unique participant count
  const participantCount = new Set(cartItems.map((i) => i.participant_name)).size || 1;

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-[var(--bg-canvas)]/90 border-b border-[var(--border-hairline)] px-4 sm:px-6 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-4">
        {/* Left: Brand & Address Cluster */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onSelectRestaurant(null)}>
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20 font-black text-lg tracking-tighter">
              G
            </div>
            <span className="font-display font-extrabold text-lg tracking-tight hidden sm:inline text-[var(--text-primary)]">
              Gourmet<span className="text-rose-600">Drop</span>
            </span>
          </div>

          {/* Location Pin Pill */}
          <button
            type="button"
            onClick={onOpenAddressModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--bg-surface)] hover:bg-stone-200 dark:hover:bg-stone-800 border border-[var(--border-hairline)] text-xs text-[var(--text-primary)] font-medium transition-colors"
          >
            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span className="max-w-[130px] sm:max-w-[180px] truncate">{addressInfo.address}</span>
            <ChevronDown className="w-3 h-3 text-[var(--text-muted)]" />
          </button>
        </div>

        {/* Center: Omnisearch Bar */}
        <div className="relative flex-1 max-w-md hidden md:block">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-[var(--text-muted)]" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              placeholder="Search tacos, rigatoni, or ramen..."
              className="w-full pl-9 pr-12 py-2 rounded-full bg-[var(--bg-surface)] border border-[var(--border-hairline)] text-xs sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
            />
            <kbd className="absolute right-3 px-1.5 py-0.5 text-[10px] font-mono rounded bg-[var(--bg-elevated)] border border-[var(--border-hairline)] text-[var(--text-muted)] shadow-xs">
              ⌘K
            </kbd>
          </div>

          {/* Omnisearch Dropdown */}
          {isSearchOpen && searchQuery.trim() && (
            <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-hairline)] shadow-2xl p-3 space-y-3 z-50 max-h-96 overflow-y-auto animate-fadeIn">
              <div className="flex items-center justify-between pb-1 border-b border-[var(--border-hairline)]">
                <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  Matches for "{searchQuery}"
                </span>
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {filteredRestaurants.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                    Restaurants
                  </h4>
                  <div className="space-y-1">
                    {filteredRestaurants.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          onSelectRestaurant(r);
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="w-full text-left p-2 rounded-xl hover:bg-[var(--bg-surface)] flex items-center justify-between transition-colors"
                      >
                        <div>
                          <div className="text-xs font-bold text-[var(--text-primary)]">{r.name}</div>
                          <div className="text-[11px] text-[var(--text-muted)]">{r.cuisine_tags.join(', ')}</div>
                        </div>
                        <span className="text-xs font-mono font-medium text-rose-500">{r.rating_avg} ★</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {filteredDishes.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                    Dishes
                  </h4>
                  <div className="space-y-1">
                    {filteredDishes.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => {
                          const rest = allRestaurants.find((r) => r.id === d.restaurant_id);
                          if (rest) onSelectRestaurant(rest);
                          onSelectDish(d);
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="w-full text-left p-2 rounded-xl hover:bg-[var(--bg-surface)] flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <img src={d.image_url} alt={d.title} className="w-8 h-8 rounded-lg object-cover" />
                          <div>
                            <div className="text-xs font-bold text-[var(--text-primary)]">{d.title}</div>
                            <div className="text-[10px] text-[var(--text-muted)]">{d.category}</div>
                          </div>
                        </div>
                        <span className="text-xs font-mono font-bold text-[var(--text-primary)]">
                          {formatCents(d.base_price_cents)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {filteredRestaurants.length === 0 && filteredDishes.length === 0 && (
                <div className="p-4 text-center text-xs text-[var(--text-muted)]">
                  No matching restaurants or dishes found.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Controls & Cart Cluster */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* "True-Cost" Toggle Switch */}
          <button
            type="button"
            onClick={onToggleTrueCost}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
              showTrueCost
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 shadow-sm'
                : 'bg-[var(--bg-surface)] border-[var(--border-hairline)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
            title="Toggle upfront all-in fee estimation"
          >
            <Sparkles className={`w-3.5 h-3.5 ${showTrueCost ? 'text-emerald-500' : 'text-stone-400'}`} />
            <span className="hidden lg:inline">
              {showTrueCost ? 'All-In True Cost: ON' : 'Show All-In Prices'}
            </span>
            <span className="lg:hidden">True Cost</span>
          </button>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="p-2 rounded-full bg-[var(--bg-surface)] hover:bg-stone-200 dark:hover:bg-stone-800 border border-[var(--border-hairline)] text-[var(--text-primary)] transition-colors"
            title="Toggle Daylight / Midnight Mode"
          >
            {theme === 'daylight' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>

          {/* Live Order Tracking Trigger */}
          {hasActiveOrder && (
            <button
              type="button"
              onClick={onOpenTracking}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 animate-pulse transition-all"
            >
              <Bike className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Track Courier</span>
            </button>
          )}

          {/* Multiplayer Cart Trigger Pill */}
          <button
            type="button"
            onClick={onOpenCartDrawer}
            className="relative flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-rose-600/25 active:scale-95 transition-all"
          >
            {/* Overlapping avatars representation */}
            <div className="flex -space-x-1.5 items-center">
              <span className="w-5 h-5 rounded-full bg-purple-500 ring-2 ring-rose-600 flex items-center justify-center text-[10px] font-bold">
                Y
              </span>
              {participantCount > 1 && (
                <span className="w-5 h-5 rounded-full bg-emerald-500 ring-2 ring-rose-600 flex items-center justify-center text-[10px] font-bold">
                  M
                </span>
              )}
            </div>

            <span className="hidden sm:inline">Group Bag</span>
            <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[11px] font-mono">
              {totalCartCount}
            </span>
            <span className="font-mono font-bold">
              {formatCents(cartTotals.totalChargedCents)}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
