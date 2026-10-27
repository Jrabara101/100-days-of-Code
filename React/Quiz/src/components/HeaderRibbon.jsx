import React, { useState } from 'react';
import {
  Sparkles,
  Layers,
  GitBranch,
  Share2,
  BarChart3,
  Monitor,
  Smartphone,
  Play,
  Volume2,
  VolumeX,
  ChevronDown,
  Plus,
  Check,
  Edit2
} from 'lucide-react';
import { sound } from '../utils/audio';

export default function HeaderRibbon({
  surveys = [],
  activeSurvey,
  onSelectSurvey,
  onCreateSurvey,
  onUpdateSurvey,
  activeMode, // 'build' | 'logic' | 'share' | 'results'
  onChangeMode,
  viewportMode, // 'desktop' | 'mobile'
  onChangeViewport,
  onLaunchRunner,
  onPublish
}) {
  const [isSurveyDropdownOpen, setIsSurveyDropdownOpen] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(activeSurvey?.title || '');

  const toggleAudio = () => {
    const newState = sound.toggle();
    setIsAudioMuted(!newState);
  };

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (tempTitle.trim() && tempTitle !== activeSurvey.title) {
      onUpdateSurvey({ ...activeSurvey, title: tempTitle.trim() });
    }
  };

  const toggleStatus = () => {
    const newStatus = activeSurvey.status === 'published' ? 'draft' : 'published';
    onUpdateSurvey({ ...activeSurvey, status: newStatus });
  };

  return (
    <header className="h-[65px] border-b border-white/10 bg-[#0E1014] px-4 flex items-center justify-between select-none z-30">
      {/* 1. Left: Brand & Survey Switcher & Editable Title */}
      <div className="flex items-center gap-3">
        {/* Brand Icon */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-brand text-white flex items-center justify-center font-bold text-sm shadow-glow-brand">
            PF
          </div>
          <span className="font-bold text-sm text-white hidden md:inline tracking-tight">
            PulseFlow
          </span>
        </div>

        <div className="w-[1px] h-5 bg-white/10 hidden sm:block" />

        {/* Survey Switcher Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsSurveyDropdownOpen(!isSurveyDropdownOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors text-left"
          >
            {isEditingTitle ? (
              <input
                type="text"
                value={tempTitle}
                autoFocus
                onChange={(e) => setTempTitle(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                className="bg-black/50 border border-brand rounded px-2 py-0.5 text-xs font-semibold text-white outline-none"
              />
            ) : (
              <span className="text-xs font-semibold text-white max-w-[140px] sm:max-w-[200px] truncate">
                {activeSurvey?.title}
              </span>
            )}
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>

          {/* Dropdown Menu */}
          {isSurveyDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-72 bg-[#121418] border border-white/15 rounded-xl shadow-2xl p-2 z-50 animate-fade-slide-down">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 px-2 py-1">
                Preset Assessments & Surveys
              </div>
              <div className="space-y-1 my-1 max-h-60 overflow-y-auto">
                {surveys.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      onSelectSurvey(s.id);
                      setTempTitle(s.title);
                      setIsSurveyDropdownOpen(false);
                    }}
                    className={`w-full p-2 rounded-lg text-left text-xs transition-colors flex items-center justify-between ${
                      s.id === activeSurvey.id
                        ? 'bg-brand/20 text-brand-light font-semibold'
                        : 'text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <span className="truncate">{s.title}</span>
                    <span className="text-[10px] font-mono text-slate-500 uppercase ml-2">
                      {s.type === 'scored_quiz' ? 'Quiz' : s.type === 'personality_assessment' ? 'Archetype' : 'Survey'}
                    </span>
                  </button>
                ))}
              </div>

              <div className="border-t border-white/10 pt-1 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    onCreateSurvey();
                    setIsSurveyDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded-lg text-left text-xs text-brand-light hover:bg-brand/10 transition-colors font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Blank Survey</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Status Badge Toggle (Draft / Published) */}
        <button
          type="button"
          onClick={toggleStatus}
          className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold transition-all"
          style={{
            backgroundColor: activeSurvey.status === 'published' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
            borderColor: activeSurvey.status === 'published' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)',
            color: activeSurvey.status === 'published' ? '#10B981' : '#F59E0B',
            borderWidth: 1
          }}
          title="Click to toggle status"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${activeSurvey.status === 'published' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          <span className="capitalize">{activeSurvey.status}</span>
        </button>
      </div>

      {/* 2. Center: Mode Navigation Tabs */}
      <nav className="flex items-center gap-1 bg-white/5 border border-white/10 p-1 rounded-xl">
        {[
          { id: 'build', label: 'Build', icon: Layers },
          { id: 'logic', label: 'Logic', icon: GitBranch },
          { id: 'share', label: 'Share', icon: Share2 },
          { id: 'results', label: 'Results', icon: BarChart3 }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeMode === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChangeMode(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-brand text-white shadow-glow-brand'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* 3. Right: Viewport Simulator & Runner Launch */}
      <div className="flex items-center gap-3">
        {/* Audio FX Toggle */}
        <button
          type="button"
          onClick={toggleAudio}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors hidden sm:flex"
          title={isAudioMuted ? 'Unmute Audio Feedback' : 'Mute Audio Feedback'}
        >
          {isAudioMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-brand-light" />}
        </button>

        {/* Viewport Toggle (Desktop / Mobile) */}
        {activeMode === 'build' && (
          <div className="hidden lg:flex items-center bg-white/5 border border-white/10 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => onChangeViewport('desktop')}
              className={`p-1.5 rounded text-xs transition-colors ${
                viewportMode === 'desktop' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Desktop View"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onChangeViewport('mobile')}
              className={`p-1.5 rounded text-xs transition-colors ${
                viewportMode === 'mobile' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Mobile View"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Preview Run CTA */}
        <button
          type="button"
          onClick={onLaunchRunner}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/15 transition-all active:scale-[0.98]"
        >
          <Play className="w-3.5 h-3.5 text-brand-light fill-brand-light" />
          <span className="hidden sm:inline">Preview Run</span>
        </button>

        {/* Publish CTA */}
        <button
          type="button"
          onClick={onPublish}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-brand hover:bg-brand-light text-white text-xs font-semibold shadow-glow-brand transition-all active:scale-[0.98]"
        >
          <span>Publish</span>
        </button>
      </div>
    </header>
  );
}
