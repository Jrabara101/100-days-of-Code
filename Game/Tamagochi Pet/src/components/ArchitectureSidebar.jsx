import React from 'react';

export function ArchitectureSidebar({ tickRate, uptime }) {
  return (
    <aside class="md:col-span-4 flex flex-col gap-4 w-full h-full justify-center order-2 md:order-1">
      {/* Architecture Specs */}
      <div class="bg-surface-container-high p-6 rounded-xl border border-outline-variant shadow-sm relative overflow-hidden">
        <div class="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
        <h2 class="font-headline-md text-headline-md text-primary mb-4 flex items-center gap-2">
          <span
            class="material-symbols-outlined text-primary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            architecture
          </span>
          Staff Architecture
        </h2>
        <div class="space-y-4">
          <div class="border-l-2 border-primary-container pl-4 py-1">
            <h3 class="font-label-caps text-label-caps text-on-surface mb-1">1. Probabilistic Misbehavior</h3>
            <p class="font-body-sm text-body-sm text-on-surface-variant opacity-80">
              Discipline-driven attention matrix.
              <code class="bg-surface-variant px-1 rounded text-[10px] block mt-1">
                P_misbehave = λ * (1 - Discipline/100) * Δt
              </code>
            </p>
          </div>
          <div class="border-l-2 border-secondary-container pl-4 py-1">
            <h3 class="font-label-caps text-label-caps text-on-surface mb-1">2. Minigame Sub-FSM</h3>
            <p class="font-body-sm text-body-sm text-on-surface-variant opacity-80">
              Left/Right guessing game (5 rounds). Grants
              <code class="bg-surface-variant px-1 rounded text-[10px] ml-1">
                ΔHappiness = Wins * 8
              </code>
            </p>
          </div>
          <div class="border-l-2 border-tertiary-container pl-4 py-1">
            <h3 class="font-label-caps text-label-caps text-on-surface mb-1">3. Scolding & Care Lifecycle</h3>
            <p class="font-body-sm text-body-sm text-on-surface-variant opacity-80">
              Justified scolding adds +20 Discipline; unjustified scolding penalizes Happiness & Discipline.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Module */}
      <div class="bg-surface-container p-6 rounded-xl border border-outline-variant shadow-sm">
        <h2 class="font-label-caps text-label-caps text-secondary mb-3 flex items-center gap-2">
          <span
            class="material-symbols-outlined text-secondary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            monitor_heart
          </span>
          Engine Metrics
        </h2>
        <div class="grid grid-cols-2 gap-4">
          <div class="bg-surface p-3 rounded shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)]">
            <div class="font-label-caps text-[10px] text-outline mb-1">TICK RATE</div>
            <div class="font-headline-md text-lg text-on-surface font-bold" id="tick-rate-display">
              {tickRate}
            </div>
          </div>
          <div class="bg-surface p-3 rounded shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)]">
            <div class="font-label-caps text-[10px] text-outline mb-1">UPTIME</div>
            <div class="font-headline-md text-lg text-on-surface font-bold" id="uptime-display">
              {uptime}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
