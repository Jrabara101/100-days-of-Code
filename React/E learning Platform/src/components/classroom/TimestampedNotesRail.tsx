import React, { useState } from 'react';
import { TimestampedNote } from '../../types';
import { Camera, Trash2, Clock, Send, Play, Sparkles, Pin } from 'lucide-react';
import { sounds } from '../../services/audioEffects';

interface TimestampedNotesRailProps {
  notes: TimestampedNote[];
  currentTime: number;
  onSeekTo: (seconds: number) => void;
  onSaveNote: (content: string, attachSnapshot: boolean) => void;
  onDeleteNote: (noteId: string) => void;
  formatTimecode: (seconds: number) => string;
}

export const TimestampedNotesRail: React.FC<TimestampedNotesRailProps> = ({
  notes,
  currentTime,
  onSeekTo,
  onSaveNote,
  onDeleteNote,
  formatTimecode
}) => {
  const [noteContent, setNoteContent] = useState('');
  const [attachSnapshot, setAttachSnapshot] = useState(true);

  const handleSave = () => {
    if (!noteContent.trim()) return;
    sounds.playClick();
    onSaveNote(noteContent.trim(), attachSnapshot);
    setNoteContent('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#11141C] text-slate-200">
      {/* Scrollable Notes List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {notes.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-white/5 text-slate-400 flex items-center justify-center mx-auto">
              <Camera className="w-5 h-5" />
            </div>
            <p className="text-xs text-slate-400">No notes captured yet for this lecture.</p>
            <p className="text-[11px] text-slate-500 font-mono">
              Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white">⌘+B</kbd> while watching to snap a slide diagram!
            </p>
          </div>
        ) : (
          notes.map(note => (
            <div
              key={note.id}
              className="p-3.5 rounded-2xl bg-[#171B26] border border-white/10 space-y-2.5 transition-colors hover:border-indigo-500/40 group"
            >
              {/* Header: Timestamp Pill & Delete */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    sounds.playClick();
                    onSeekTo(note.timestampSec);
                  }}
                  className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/20 flex items-center gap-1.5 transition-colors"
                  title="Jump video to this exact moment"
                >
                  <Play className="w-3 h-3 fill-indigo-400" />
                  <span>{formatTimecode(note.timestampSec)}</span>
                </button>

                <button
                  onClick={() => {
                    sounds.playClick();
                    onDeleteNote(note.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-opacity"
                  title="Delete note"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Slide Snapshot thumbnail if present */}
              {note.frameSnapshotUrl && (
                <div 
                  onClick={() => {
                    sounds.playClick();
                    onSeekTo(note.timestampSec);
                  }}
                  className="w-full h-28 rounded-xl overflow-hidden border border-white/10 cursor-pointer relative group/img bg-black/40"
                >
                  <img
                    src={note.frameSnapshotUrl}
                    alt="Captured diagram snapshot"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center text-[10px] font-mono text-white transition-opacity">
                    Click to seek @ {formatTimecode(note.timestampSec)}
                  </div>
                </div>
              )}

              {/* Note Content Markdown */}
              <p className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-line">
                {note.contentMarkdown}
              </p>
            </div>
          ))
        )}
      </div>

      {/* =========================================================================
          BOTTOM PINNED NOTE COMPOSER
          ========================================================================= */}
      <div className="p-3 bg-[#0B0D13] border-t border-white/10 space-y-2.5">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
            <Pin className="w-3 h-3 text-cyan-400" />
            Locking note to @ {formatTimecode(currentTime)}
          </span>

          <label className="flex items-center gap-1.5 text-slate-400 hover:text-white cursor-pointer select-none">
            <input
              type="checkbox"
              checked={attachSnapshot}
              onChange={e => setAttachSnapshot(e.target.checked)}
              className="accent-indigo-500 rounded"
            />
            <span className="text-[10px]">Attach Frame Diagram</span>
          </label>
        </div>

        <textarea
          rows={2}
          value={noteContent}
          onChange={e => setNoteContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Capture concept takeaway or code insight... (⌘Enter to save)"
          className="w-full bg-[#171B26] border border-white/10 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 resize-none"
        />

        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-500 font-mono">
            Supports Markdown • Press <kbd className="px-1 py-0.2 rounded bg-white/10 text-white">⌘Enter</kbd>
          </span>

          <button
            onClick={handleSave}
            disabled={!noteContent.trim()}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              noteContent.trim()
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                : 'bg-white/10 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Send className="w-3 h-3" />
            <span>Save Note</span>
          </button>
        </div>
      </div>
    </div>
  );
};

