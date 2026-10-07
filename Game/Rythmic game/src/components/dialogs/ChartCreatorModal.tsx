import React, { useState, useRef } from 'react';
import { Beatmap, BeatmapNote, NoteType } from '../../types/game';
import { Dialog } from '../ui/dialog';
import { Button } from '../ui/button';
import { Plus, Trash2, Play, Download, Upload, Copy, Check, Music } from 'lucide-react';
import { globalAudioEngine } from '../../audio/RhythmAudioEngine';

interface ChartCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayCustomChart: (chart: Beatmap) => void;
}

export const ChartCreatorModal: React.FC<ChartCreatorModalProps> = ({
  isOpen,
  onClose,
  onPlayCustomChart,
}) => {
  const [title, setTitle] = useState<string>('MY CUSTOM BEATMAP');
  const [bpm, setBpm] = useState<number>(140);
  const [difficulty, setDifficulty] = useState<Beatmap['difficulty']>('Normal');
  const [notes, setNotes] = useState<BeatmapNote[]>([
    { id: 'c1', lane: 0, targetTimeMs: 1000, type: 'tap' },
    { id: 'c2', lane: 1, targetTimeMs: 1500, type: 'tap' },
    { id: 'c3', lane: 2, targetTimeMs: 2000, type: 'tap' },
    { id: 'c4', lane: 3, targetTimeMs: 2500, type: 'tap' },
    { id: 'c5', lane: 1, targetTimeMs: 3500, durationMs: 1000, type: 'hold' },
    { id: 'c6', lane: 2, targetTimeMs: 5000, type: 'tap', isFever: true },
  ]);

  const [selectedLane, setSelectedLane] = useState<0 | 1 | 2 | 3>(0);
  const [selectedNoteType, setSelectedNoteType] = useState<NoteType>('tap');
  const [isFever, setIsFever] = useState<boolean>(false);
  const [noteTimeSec, setNoteTimeSec] = useState<number>(6.0);
  const [holdDurationSec, setHoldDurationSec] = useState<number>(1.2);
  const [importJsonText, setImportJsonText] = useState<string>('');
  const [copiedHash, setCopiedHash] = useState<boolean>(false);

  // Add new note to beatmap
  const handleAddNote = () => {
    const targetTimeMs = Math.round(noteTimeSec * 1000);
    const newNote: BeatmapNote = {
      id: `n_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 5)}`,
      lane: selectedLane,
      targetTimeMs,
      type: selectedNoteType,
      durationMs: selectedNoteType === 'hold' ? Math.round(holdDurationSec * 1000) : undefined,
      isFever,
    };

    setNotes(prev => [...prev, newNote].sort((a, b) => a.targetTimeMs - b.targetTimeMs));
    setNoteTimeSec(prev => Number((prev + (60 / bpm)).toFixed(2))); // advance 1 beat
  };

  const handleDeleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const buildBeatmapObject = (): Beatmap => {
    const maxTime = notes.length > 0
      ? Math.max(...notes.map(n => n.targetTimeMs + (n.durationMs || 0))) + 3000
      : 30000;

    return {
      id: `custom-${Date.now()}`,
      title,
      artist: 'Custom Composer',
      bpm,
      difficulty,
      starRating: difficulty === 'Easy' ? 2 : difficulty === 'Normal' ? 5 : difficulty === 'Hard' ? 7 : 9,
      synthTheme: 'synthwave',
      offsetMs: 30,
      durationMs: maxTime,
      notes,
    };
  };

  // Export to lightweight compressed base64 hash or JSON
  const handleExportJson = () => {
    const map = buildBeatmapObject();
    const str = JSON.stringify(map, null, 2);
    navigator.clipboard.writeText(str);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  // Import custom chart from string
  const handleImport = () => {
    try {
      const parsed = JSON.parse(importJsonText);
      if (parsed.notes && Array.isArray(parsed.notes)) {
        setTitle(parsed.title || 'IMPORTED TRACK');
        setBpm(parsed.bpm || 140);
        setDifficulty(parsed.difficulty || 'Normal');
        setNotes(parsed.notes);
        alert('Custom chart imported successfully!');
      }
    } catch (e) {
      alert('Invalid chart JSON');
    }
  };

  const handleLaunch = () => {
    const map = buildBeatmapObject();
    onPlayCustomChart(map);
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Web Beatmap Studio & Chart Creator"
      description="Design custom 4-lane choreography and share lightweight JSON or URL hashes"
      className="max-w-2xl"
    >
      <div className="flex flex-col gap-5 py-2">
        {/* Track Config */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-mono text-gray-400">TRACK TITLE</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-surface-mid border border-white/10 px-3 py-1.5 rounded-lg text-sm font-mono text-white focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-mono text-gray-400">TEMPO (BPM)</label>
            <input
              type="number"
              min="60"
              max="240"
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="bg-surface-mid border border-white/10 px-3 py-1.5 rounded-lg text-sm font-mono text-white focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-mono text-gray-400">DIFFICULTY</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as any)}
              className="bg-surface-mid border border-white/10 px-3 py-1.5 rounded-lg text-sm font-mono text-white focus:outline-none focus:border-primary"
            >
              <option value="Easy">Easy (★2)</option>
              <option value="Normal">Normal (★5)</option>
              <option value="Hard">Hard (★7)</option>
              <option value="Expert">Expert (★9)</option>
            </select>
          </div>
        </div>

        {/* Note Placement Bar */}
        <div className="flex flex-col gap-3 p-4 rounded-xl bg-surface-mid/60 border border-white/10">
          <div className="text-xs font-mono text-gray-300 font-bold uppercase tracking-wider">
            STEP 2: DROP NOTES ONTO TIMELINE
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Lane */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-mono text-gray-400">LANE (D/F/J/K)</label>
              <div className="grid grid-cols-4 gap-1">
                {([0, 1, 2, 3] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => setSelectedLane(l)}
                    className={`py-1 rounded font-mono font-bold text-xs transition-colors ${
                      selectedLane === l ? 'bg-primary text-black' : 'bg-surface-high text-gray-400'
                    }`}
                  >
                    {['D', 'F', 'J', 'K'][l]}
                  </button>
                ))}
              </div>
            </div>

            {/* Note Type */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-mono text-gray-400">TYPE</label>
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={() => setSelectedNoteType('tap')}
                  className={`py-1 rounded font-mono text-xs font-bold ${
                    selectedNoteType === 'tap' ? 'bg-primary text-black' : 'bg-surface-high text-gray-400'
                  }`}
                >
                  TAP
                </button>
                <button
                  onClick={() => setSelectedNoteType('hold')}
                  className={`py-1 rounded font-mono text-xs font-bold ${
                    selectedNoteType === 'hold' ? 'bg-primary text-black' : 'bg-surface-high text-gray-400'
                  }`}
                >
                  HOLD
                </button>
              </div>
            </div>

            {/* Target Time */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-mono text-gray-400">TIMESTAMP (SEC)</label>
              <input
                type="number"
                step="0.1"
                min="0.5"
                value={noteTimeSec}
                onChange={(e) => setNoteTimeSec(Number(e.target.value))}
                className="bg-surface-high border border-white/10 px-2 py-1 rounded text-xs font-mono text-white"
              />
            </div>

            {/* Fever Note Toggle */}
            <div className="flex flex-col justify-end">
              <button
                onClick={() => setIsFever(!isFever)}
                className={`w-full py-1.5 rounded font-mono text-xs font-bold transition-all ${
                  isFever
                    ? 'bg-amber-400 text-black shadow-neon-gold'
                    : 'bg-surface-high text-gray-400 hover:text-white'
                }`}
              >
                {isFever ? '★ GOLD FEVER' : 'STANDARD'}
              </button>
            </div>
          </div>

          <Button variant="primary" size="sm" onClick={handleAddNote} className="w-full mt-1">
            <Plus className="w-4 h-4 mr-1.5" /> ADD NOTE TO CHART
          </Button>
        </div>

        {/* Notes Timeline List */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-mono text-gray-400">
            <span>CHARTED NOTES ({notes.length})</span>
            <span>SORTED CHRONOLOGICALLY</span>
          </div>

          <div className="max-h-36 overflow-y-auto flex flex-col gap-1.5 p-2 rounded-xl bg-surface-mid/40 border border-white/10">
            {notes.map((n, i) => (
              <div
                key={n.id}
                className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-surface-low border border-white/5 text-xs font-mono"
              >
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">#{i + 1}</span>
                  <span className="font-bold text-primary">
                    LANE {['D', 'F', 'J', 'K'][n.lane]}
                  </span>
                  <span className="text-gray-300">{(n.targetTimeMs / 1000).toFixed(2)}s</span>
                  {n.type === 'hold' && (
                    <span className="text-accent-gold">HOLD ({n.durationMs}ms)</span>
                  )}
                  {n.isFever && <span className="text-amber-400 font-bold">★ FEVER</span>}
                </div>

                <button
                  onClick={() => handleDeleteNote(n.id)}
                  className="text-gray-400 hover:text-red-400 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Import / Export & Play Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
          <div className="flex items-center gap-2">
            <Button size="sm" variant="glass" onClick={handleExportJson}>
              {copiedHash ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
              {copiedHash ? 'Copied JSON!' : 'Copy JSON'}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleLaunch}>
              <Play className="w-4 h-4 mr-1.5" /> Play Chart Now
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
};
