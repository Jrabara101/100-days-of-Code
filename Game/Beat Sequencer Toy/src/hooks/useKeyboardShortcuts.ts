import { useEffect } from 'react';
import { useSequencerStore } from '../store/useSequencerStore';
import { triggerTrackSound } from '../audio/synthesizer';
import { audioEngine } from '../audio/audioGraph';

export function useKeyboardShortcuts() {
  const isPlaying = useSequencerStore((s) => s.isPlaying);
  const setIsPlaying = useSequencerStore((s) => s.setIsPlaying);
  const clearGrid = useSequencerStore((s) => s.clearGrid);
  const rollChaosDice = useSequencerStore((s) => s.rollChaosDice);
  const tracks = useSequencerStore((s) => s.tracks);
  const activeKit = useSequencerStore((s) => s.activeKit);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore keystrokes inside input fields or textareas
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying(!isPlaying);
      } else if (e.key >= '1' && e.key <= '6') {
        const trackIdx = parseInt(e.key, 10) - 1;
        const track = tracks[trackIdx];
        if (track) {
          audioEngine.init();
          triggerTrackSound(track.id, audioEngine.ctx?.currentTime || 0, activeKit, track.pitchOffset);
        }
      } else if (e.key.toLowerCase() === 'c') {
        clearGrid();
      } else if (e.key.toLowerCase() === 'r') {
        rollChaosDice();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, setIsPlaying, clearGrid, rollChaosDice, tracks, activeKit]);
}
