import React from 'react';
import { useTrustStore } from '../../context/TrustStoreContext';

export function PeopleLikeMeFilter({
  isOpen,
  onClose,
  personaFilters,
  setPersonaFilters,
  onClearFilters
}) {
  const { activeProduct } = useTrustStore();
  if (!isOpen) return null;

  const isApparel = activeProduct.category === 'apparel';

  const updateFilter = (key, value) => {
    setPersonaFilters(prev => {
      if (prev[key] === value) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: value };
    });
  };

  const activeCount = Object.keys(personaFilters).length;

  return (
    <div className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-5 shadow-md mb-6 animate-fadeIn">
      <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-fixed text-on-primary-fixed flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">person_search</span>
          </div>
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
              "People Like Me" Contextual Filter
            </h3>
            <p className="font-body-sm text-body-sm text-outline">
              Match reviews with buyers sharing your exact profile, variant, or brewing preferences
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <button
              onClick={onClearFilters}
              className="font-mono text-label-code-sm text-primary hover:underline px-2 py-1 font-semibold"
            >
              Reset ({activeCount})
            </button>
          )}
          <button
            onClick={onClose}
            className="w-7 h-7 rounded hover:bg-surface-container flex items-center justify-center text-outline hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Filter 1: Purchased SKU / Variant */}
        <div className="flex flex-col gap-2">
          <span className="font-mono text-label-code-sm text-outline uppercase tracking-wider font-semibold">
            Purchased Variant
          </span>
          <div className="flex flex-wrap gap-2">
            {activeProduct.variants?.map(v => {
              const isSelected = personaFilters.variant === v.name;
              return (
                <button
                  key={v.id}
                  onClick={() => updateFilter('variant', v.name)}
                  className={`px-3 py-1.5 rounded-lg text-body-sm transition-all border ${
                    isSelected
                      ? 'bg-primary text-white border-primary font-semibold shadow-xs'
                      : 'bg-surface-container-low text-on-surface hover:bg-surface-container border-outline-variant/30'
                  }`}
                >
                  {v.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter 2: Apparel (Height / Size) OR Coffee (Setup) */}
        {isApparel ? (
          <>
            <div className="flex flex-col gap-2">
              <span className="font-mono text-label-code-sm text-outline uppercase tracking-wider font-semibold">
                Reviewer Height
              </span>
              <div className="flex flex-wrap gap-2">
                {["< 5'6\"", "5'7\"–5'10\"", "5'11\"–6'2\"", "6'3\"+"].map(h => {
                  const isSelected = personaFilters.height === h;
                  return (
                    <button
                      key={h}
                      onClick={() => updateFilter('height', h)}
                      className={`px-3 py-1.5 rounded-lg text-body-sm transition-all border ${
                        isSelected
                          ? 'bg-primary text-white border-primary font-semibold shadow-xs'
                          : 'bg-surface-container-low text-on-surface hover:bg-surface-container border-outline-variant/30'
                      }`}
                    >
                      {h}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-mono text-label-code-sm text-outline uppercase tracking-wider font-semibold">
                Usual Size Ordered
              </span>
              <div className="flex flex-wrap gap-2">
                {['Small', 'Medium', 'Large', 'X-Large'].map(sz => {
                  const isSelected = personaFilters.usualSize === sz;
                  return (
                    <button
                      key={sz}
                      onClick={() => updateFilter('usualSize', sz)}
                      className={`px-3 py-1.5 rounded-lg text-body-sm transition-all border ${
                        isSelected
                          ? 'bg-primary text-white border-primary font-semibold shadow-xs'
                          : 'bg-surface-container-low text-on-surface hover:bg-surface-container border-outline-variant/30'
                      }`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <span className="font-mono text-label-code-sm text-outline uppercase tracking-wider font-semibold">
                Brewing Setup
              </span>
              <div className="flex flex-wrap gap-2">
                {['Daily Chemex Brewer', 'V60 Enthusiast', 'Aeropress', 'Ode Gen 2'].map(setup => {
                  const isSelected = personaFilters.experienceLevel === setup;
                  return (
                    <button
                      key={setup}
                      onClick={() => updateFilter('experienceLevel', setup)}
                      className={`px-3 py-1.5 rounded-lg text-body-sm transition-all border ${
                        isSelected
                          ? 'bg-primary text-white border-primary font-semibold shadow-xs'
                          : 'bg-surface-container-low text-on-surface hover:bg-surface-container border-outline-variant/30'
                      }`}
                    >
                      {setup}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-mono text-label-code-sm text-outline uppercase tracking-wider font-semibold">
                Buyer Location
              </span>
              <div className="flex flex-wrap gap-2">
                {['Austin, TX', 'Seattle, WA', 'Brooklyn, NY', 'Chicago, IL'].map(loc => {
                  const isSelected = personaFilters.location === loc;
                  return (
                    <button
                      key={loc}
                      onClick={() => updateFilter('location', loc)}
                      className={`px-3 py-1.5 rounded-lg text-body-sm transition-all border ${
                        isSelected
                          ? 'bg-primary text-white border-primary font-semibold shadow-xs'
                          : 'bg-surface-container-low text-on-surface hover:bg-surface-container border-outline-variant/30'
                      }`}
                    >
                      {loc}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

