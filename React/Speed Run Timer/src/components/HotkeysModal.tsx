import React from 'react';
import { Modal, Button } from './ui/primitives';
import { Keyboard } from 'lucide-react';

interface HotkeysModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HotkeysModal: React.FC<HotkeysModalProps> = ({ isOpen, onClose }) => {
  const hotkeysList = [
    { action: 'Trigger Split', keys: ['SPACE', 'NUMPAD 1', 'Z'], desc: 'Records the current segment and advances to the next split' },
    { action: 'Undo Last Split', keys: ['NUMPAD 8', 'BACKSPACE', 'U'], desc: 'Reverts the latest split record in case of misclick' },
    { action: 'Skip Segment', keys: ['NUMPAD 2', 'S'], desc: 'Bypasses current segment gate without recording a time' },
    { action: 'Reset Run', keys: ['NUMPAD 3', 'R'], desc: 'Resets the timer and segments back to sector 0' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="GLOBAL HOTKEY SHORTCUTS"
      subtitle="Low-latency passive keyboard listener with input field immunity"
      maxWidth="max-w-md"
    >
      <div className="space-y-4 font-mono text-xs text-slate-100">
        <div className="divide-y divide-obsidian-border border border-obsidian-border rounded overflow-hidden">
          {hotkeysList.map((item) => (
            <div key={item.action} className="p-3 bg-obsidian-surface flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-100 block">{item.action}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">{item.desc}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                {item.keys.map((k) => (
                  <kbd
                    key={k}
                    className="px-2 py-1 rounded bg-obsidian-void border border-obsidian-border text-[10px] font-bold text-neon-cyan shadow-sm"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 rounded bg-obsidian-void border border-obsidian-border text-[11px] text-slate-400 leading-relaxed">
          💡 <span className="text-slate-200 font-semibold">Pro-tip:</span> Hotkeys are active in all viewports (Runner HUD, Caster Broadcast, and Split Board) and automatically pause when typing inside modal text inputs to prevent accidental splits.
        </div>

        <div className="pt-2 text-right border-t border-obsidian-border">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Got it
          </Button>
        </div>
      </div>
    </Modal>
  );
};
