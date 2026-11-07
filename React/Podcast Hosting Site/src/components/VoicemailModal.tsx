import React, { useState, useEffect } from 'react';
import { 
  X, 
  Mic, 
  Square, 
  Play, 
  Pause, 
  RotateCcw, 
  Send, 
  Check, 
  Radio,
  MessageSquare,
  HelpCircle
} from 'lucide-react';
import { usePodcast } from '../context/PodcastContext';

export const VoicemailModal: React.FC = () => {
  const { 
    isVoicemailModalOpen, 
    setIsVoicemailModalOpen, 
    currentEpisode, 
    submitVoicemail,
    voicemails 
  } = usePodcast();

  const [activeTab, setActiveTab] = useState<'record' | 'queue'>('record');
  const [isRecording, setIsRecording] = useState(false);
  const [recordedSec, setRecordedSec] = useState(0);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [textPrompt, setTextPrompt] = useState('');
  const [topicTag, setTopicTag] = useState(currentEpisode.tags[0] || 'Episode Topic');
  const [submittedToast, setSubmittedToast] = useState(false);

  // Timer while recording
  useEffect(() => {
    let interval: number | null = null;
    if (isRecording) {
      interval = window.setInterval(() => {
        setRecordedSec(prev => {
          if (prev >= 60) {
            setIsRecording(false);
            setHasRecorded(true);
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  if (!isVoicemailModalOpen) return null;

  const handleStartRecord = () => {
    setRecordedSec(0);
    setHasRecorded(false);
    setIsRecording(true);
  };

  const handleStopRecord = () => {
    setIsRecording(false);
    setHasRecorded(true);
  };

  const handleResetRecord = () => {
    setIsRecording(false);
    setHasRecorded(false);
    setRecordedSec(0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitVoicemail({
      authorName: authorName.trim() || 'Anonymous Builder',
      durationSec: recordedSec || 45,
      textPrompt: textPrompt.trim() || 'Audio question submitted via Resonance Studio microphone.',
      topicTag
    });

    setSubmittedToast(true);
    setTimeout(() => {
      setSubmittedToast(false);
      handleResetRecord();
      setTextPrompt('');
      setActiveTab('queue');
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg glass-modal rounded-3xl border border-[var(--border-hairline-strong)] p-6 md:p-8 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-hairline)]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/30">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
                Listener Voicemail Mailbag
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Leave a 60-second audio question for Marcus & Maya for next week.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsVoicemailModalOpen(false)}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-2 p-1 rounded-xl bg-[var(--canvas-stage)] border border-[var(--border-hairline)]">
          <button
            onClick={() => setActiveTab('record')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'record'
                ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-white'
            }`}
          >
            🎙️ Record Question
          </button>
          <button
            onClick={() => setActiveTab('queue')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'queue'
                ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-white'
            }`}
          >
            📬 Mailbag Queue ({voicemails.length})
          </button>
        </div>

        {/* Toast */}
        {submittedToast && (
          <div className="p-3 rounded-xl bg-emerald-500 text-neutral-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg animate-fadeIn">
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Voicemail submitted to the Studio Producer!</span>
          </div>
        )}

        {/* TAB 1: Record Mode */}
        {activeTab === 'record' && (
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Tactile Audio Recording Module */}
            <div className="p-6 rounded-2xl bg-[var(--canvas-stage)] border border-[var(--border-hairline)] text-center space-y-4">
              
              {/* VU Meter & Waveform Pulse */}
              <div className="flex items-center justify-center gap-1.5 h-12">
                {Array.from({ length: 18 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      height: isRecording 
                        ? `${20 + Math.sin(i * 0.9 + Date.now()) * 70}%` 
                        : hasRecorded 
                          ? '50%' 
                          : '15%'
                    }}
                    className={`w-1.5 rounded-full transition-all duration-100 ${
                      isRecording 
                        ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]' 
                        : hasRecorded 
                          ? 'bg-emerald-400' 
                          : 'bg-neutral-700'
                    }`}
                  />
                ))}
              </div>

              {/* Time Counter */}
              <div className="font-mono-tabular text-sm font-bold text-[var(--text-primary)]">
                00:{recordedSec.toString().padStart(2, '0')} / 01:00
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-center gap-3 pt-2">
                {!isRecording && !hasRecorded && (
                  <button
                    type="button"
                    onClick={handleStartRecord}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs shadow-lg shadow-rose-500/25 transition-transform hover:scale-105 active:scale-95"
                  >
                    <Mic className="w-4 h-4 fill-current" />
                    <span>Start Recording (60s Max)</span>
                  </button>
                )}

                {isRecording && (
                  <button
                    type="button"
                    onClick={handleStopRecord}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-lg shadow-amber-500/25 transition-transform hover:scale-105 active:scale-95 animate-pulse"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    <span>Stop Recording</span>
                  </button>
                )}

                {hasRecorded && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPlayingPreview(!isPlayingPreview)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-[var(--text-primary)] transition-colors"
                    >
                      {isPlayingPreview ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      <span>{isPlayingPreview ? 'Pause' : 'Review Audio'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleResetRecord}
                      className="p-2 rounded-xl text-[var(--text-muted)] hover:text-rose-400 hover:bg-white/5 transition-colors"
                      title="Re-record"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Inputs: Author Name & Text Note */}
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono-tabular uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  Your Name / Handle:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Mercer (@alexbuilds)"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[var(--canvas-stage)] border border-[var(--border-hairline)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono-tabular uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  Question Summary / Text Prompt:
                </label>
                <textarea
                  rows={2}
                  placeholder="Briefly state your core dilemma or context for the host..."
                  value={textPrompt}
                  onChange={(e) => setTextPrompt(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[var(--canvas-stage)] border border-[var(--border-hairline)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Submit Voicemail to Host</span>
            </button>
          </form>
        )}

        {/* TAB 2: Queue Mode */}
        {activeTab === 'queue' && (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {voicemails.map((vm) => (
              <div 
                key={vm.id}
                className="p-3.5 rounded-2xl bg-[var(--canvas-stage)] border border-[var(--border-hairline)] space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img 
                      src={vm.avatar} 
                      alt={vm.authorName} 
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <span className="font-semibold text-xs text-[var(--text-primary)]">
                      {vm.authorName}
                    </span>
                  </div>

                  <span className={`text-[10px] uppercase font-mono-tabular font-bold px-2 py-0.5 rounded-full ${
                    vm.status === 'answered'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  }`}>
                    {vm.status === 'answered' ? '🎙️ Answered on Show' : '⏳ In Queue'}
                  </span>
                </div>

                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  "{vm.textPrompt}"
                </p>

                <div className="flex items-center justify-between text-[11px] font-mono-tabular text-[var(--text-muted)] pt-1 border-t border-[var(--border-hairline)]">
                  <span>{vm.topicTag}</span>
                  <span>{vm.durationSec}s Voice Clip</span>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
