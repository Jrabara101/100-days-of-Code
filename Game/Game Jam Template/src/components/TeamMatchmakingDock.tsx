import { useState } from 'react';
import type { JammerProfile, JammerRole, JammerEngine } from '../types/jam';
import { soundFx } from '../lib/soundFx';
import { 
  Users, 
  Play, 
  Square, 
  Plus, 
  MessageSquare, 
  Code2, 
  Palette, 
  Music, 
  BookOpen, 
  Gamepad2, 
  Check, 
  Radio 
} from 'lucide-react';

interface TeamMatchmakingDockProps {
  jammers: JammerProfile[];
  onCreateBeacon: (beacon: Partial<JammerProfile>) => void;
}

export const TeamMatchmakingDock = ({
  jammers,
  onCreateBeacon
}: TeamMatchmakingDockProps) => {
  const [selectedRole, setSelectedRole] = useState<'ALL' | JammerRole>('ALL');
  const [playingSampleId, setPlayingSampleId] = useState<string | null>(null);
  const [stopSampleFn, setStopSampleFn] = useState<(() => void) | null>(null);
  const [showBeaconModal, setShowBeaconModal] = useState<boolean>(false);
  const [inviteSentId, setInviteSentId] = useState<string | null>(null);

  // New beacon form state
  const [formHandle, setFormHandle] = useState<string>('');
  const [formDiscord, setFormDiscord] = useState<string>('');
  const [formBio, setFormBio] = useState<string>('');
  const [formRoles, setFormRoles] = useState<JammerRole[]>(['Code']);
  const [formEngines, setFormEngines] = useState<JammerEngine[]>(['Godot']);
  const [formSynthType, setFormSynthType] = useState<'synthwave' | 'chiptune' | 'cyberpunk' | 'ambient'>('synthwave');

  const filteredJammers = jammers.filter(j => {
    if (selectedRole === 'ALL') return true;
    return j.roles.includes(selectedRole);
  });

  const handlePlaySample = (jammerId: string, synthType?: 'synthwave' | 'chiptune' | 'cyberpunk' | 'ambient') => {
    if (playingSampleId === jammerId) {
      if (stopSampleFn) stopSampleFn();
      setPlayingSampleId(null);
      setStopSampleFn(null);
      return;
    }

    if (stopSampleFn) {
      stopSampleFn();
    }

    soundFx.playUiClick(850);
    const stop = soundFx.playComposerSample(synthType || 'synthwave');
    setPlayingSampleId(jammerId);
    setStopSampleFn(() => stop);
  };

  const handleSendInvite = (jammer: JammerProfile) => {
    soundFx.playUiClick(950);
    navigator.clipboard.writeText(jammer.discord);
    setInviteSentId(jammer.id);
    setTimeout(() => setInviteSentId(null), 3000);
  };

  const handleCreateBeaconSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formHandle.trim()) return;

    onCreateBeacon({
      handle: formHandle.trim(),
      discord: formDiscord.trim() || `${formHandle.toLowerCase()}#0001`,
      bio: formBio.trim() || 'Ready to craft something extraordinary!',
      roles: formRoles,
      engines: formEngines,
      sampleSynthType: formRoles.includes('Audio/OST') ? formSynthType : undefined,
      lookingForTeam: true,
      timezone: 'UTC'
    });

    setShowBeaconModal(false);
    setFormHandle('');
    setFormBio('');
    soundFx.playRadarPing();
  };

  const toggleRoleSelection = (role: JammerRole) => {
    if (formRoles.includes(role)) {
      if (formRoles.length > 1) {
        setFormRoles(formRoles.filter(r => r !== role));
      }
    } else {
      setFormRoles([...formRoles, role]);
    }
  };

  const toggleEngineSelection = (eng: JammerEngine) => {
    if (formEngines.includes(eng)) {
      if (formEngines.length > 1) {
        setFormEngines(formEngines.filter(e => e !== eng));
      }
    } else {
      setFormEngines([...formEngines, eng]);
    }
  };

  const getRoleIcon = (role: JammerRole) => {
    switch (role) {
      case 'Code': return <Code2 className="w-3 h-3 text-cyan-400" />;
      case '2D Art':
      case '3D Art': return <Palette className="w-3 h-3 text-rose-400" />;
      case 'Audio/OST': return <Music className="w-3 h-3 text-amber-400" />;
      case 'Narrative': return <BookOpen className="w-3 h-3 text-purple-400" />;
      default: return <Gamepad2 className="w-3 h-3 text-emerald-400" />;
    }
  };

  return (
    <div id="jammer-radar" className="bg-[#0F121C] border border-[#222B42] rounded-xl p-6 shadow-2xl space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#222B42] pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-lg text-white tracking-wide">
                JAMMER RADAR // FORMATION MATRIX
              </h3>
              <span className="px-2 py-0.5 text-xs font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded">
                {jammers.filter(j => j.lookingForTeam).length} FREE AGENTS
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans">
              Connect with programmers, artists, audio synthesists, and narrative designers before zero-hour.
            </p>
          </div>
        </div>

        {/* Broadcast Beacon Button */}
        <button
          onClick={() => {
            soundFx.playUiClick(800);
            setShowBeaconModal(true);
          }}
          className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-transform active:scale-95 shadow-md shadow-cyan-950/40"
        >
          <Plus className="w-3.5 h-3.5" /> BROADCAST BEACON
        </button>
      </div>

      {/* Role Filter Pills */}
      <div className="flex flex-wrap items-center gap-1.5 pb-1">
        {(['ALL', 'Code', '2D Art', '3D Art', 'Audio/OST', 'Narrative', 'Game Design'] as const).map(role => (
          <button
            key={role}
            onClick={() => {
              soundFx.playUiClick(700);
              setSelectedRole(role);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors flex items-center gap-1.5 ${
              selectedRole === role
                ? 'bg-[#171D2F] text-cyan-400 border border-cyan-500/50 shadow-sm'
                : 'bg-[#08090D] text-slate-400 hover:text-white border border-[#222B42]'
            }`}
          >
            {role !== 'ALL' && getRoleIcon(role as JammerRole)}
            <span>{role}</span>
          </button>
        ))}
      </div>

      {/* Jammer Cards Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredJammers.map(jammer => {
          const isPlaying = playingSampleId === jammer.id;

          return (
            <div
              key={jammer.id}
              className="bg-[#171D2F] border border-[#222B42] hover:border-slate-600 rounded-xl p-4 space-y-3 transition-all hover:shadow-xl flex flex-col justify-between"
            >
              <div>
                {/* User Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-cyan-900 to-rose-900 border border-[#222B42] flex items-center justify-center font-display font-black text-sm text-cyan-300">
                      {jammer.handle.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-display font-bold text-sm text-white flex items-center gap-1.5">
                        {jammer.handle}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {jammer.timezone}
                      </div>
                    </div>
                  </div>

                  {jammer.lookingForTeam ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      AVAILABLE
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-slate-800 border border-slate-700">
                      IN SQUAD
                    </span>
                  )}
                </div>

                {/* Role and Engine Badges */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {jammer.roles.map(r => (
                    <span key={r} className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#0F121C] border border-[#222B42] text-slate-300 flex items-center gap-1">
                      {getRoleIcon(r)} {r}
                    </span>
                  ))}
                  {jammer.engines.map(e => (
                    <span key={e} className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-950/30 border border-cyan-800/40 text-cyan-300">
                      {e}
                    </span>
                  ))}
                </div>

                {/* Bio */}
                <p className="text-xs text-slate-300 font-sans leading-relaxed line-clamp-3">
                  {jammer.bio}
                </p>
              </div>

              {/* Action Bottom Bar */}
              <div className="pt-2 border-t border-[#222B42] flex items-center justify-between gap-2">
                {/* Audio Composer Sample Preview Player */}
                {jammer.sampleSynthType ? (
                  <button
                    onClick={() => handlePlaySample(jammer.id, jammer.sampleSynthType)}
                    className={`px-2.5 py-1 rounded text-xs font-mono font-bold flex items-center gap-1 transition-all ${
                      isPlaying 
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/40 animate-pulse' 
                        : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30'
                    }`}
                    title={`Audition procedural ${jammer.sampleSynthType} track`}
                  >
                    {isPlaying ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                    <span>{isPlaying ? 'PLAYING' : 'OST SAMPLE'}</span>
                  </button>
                ) : (
                  <div className="text-[11px] font-mono text-slate-500">
                    Discord: {jammer.discord}
                  </div>
                )}

                {/* Team Invite / Contact Button */}
                <button
                  onClick={() => handleSendInvite(jammer)}
                  className={`px-3 py-1 rounded text-xs font-mono font-semibold flex items-center gap-1 transition-colors ${
                    inviteSentId === jammer.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#0F121C] hover:bg-[#222B42] text-slate-200 border border-[#222B42]'
                  }`}
                  title="Copy Discord handle and send invite"
                >
                  {inviteSentId === jammer.id ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-300" /> COPIED!
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-3 h-3 text-cyan-400" /> INVITE
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Broadcast Beacon Modal */}
      {showBeaconModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0F121C] border border-[#222B42] rounded-xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#222B42] pb-3">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-cyan-400" />
                <h3 className="font-display font-bold text-lg text-white">BROADCAST JAMMER BEACON</h3>
              </div>
              <button
                onClick={() => setShowBeaconModal(false)}
                className="text-slate-400 hover:text-white font-mono text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBeaconSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">HANDLE / CALLSIGN</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CyberSamurai_42"
                  value={formHandle}
                  onChange={(e) => setFormHandle(e.target.value)}
                  className="w-full bg-[#171D2F] border border-[#222B42] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">DISCORD HANDLE</label>
                <input
                  type="text"
                  placeholder="e.g. samurai#1337"
                  value={formDiscord}
                  onChange={(e) => setFormDiscord(e.target.value)}
                  className="w-full bg-[#171D2F] border border-[#222B42] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">ROLES OFFERED</label>
                <div className="flex flex-wrap gap-1.5">
                  {(['Code', '2D Art', '3D Art', 'Audio/OST', 'Narrative', 'Game Design'] as JammerRole[]).map(r => (
                    <button
                      type="button"
                      key={r}
                      onClick={() => toggleRoleSelection(r)}
                      className={`px-2.5 py-1 rounded text-xs font-mono border transition-colors ${
                        formRoles.includes(r)
                          ? 'bg-cyan-950/40 text-cyan-300 border-cyan-500'
                          : 'bg-[#171D2F] text-slate-400 border-[#222B42]'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">PRIMARY ENGINES</label>
                <div className="flex flex-wrap gap-1.5">
                  {(['Godot', 'Unity', 'Bevy', 'Unreal', 'WebGL', 'PICO-8'] as JammerEngine[]).map(e => (
                    <button
                      type="button"
                      key={e}
                      onClick={() => toggleEngineSelection(e)}
                      className={`px-2.5 py-1 rounded text-xs font-mono border transition-colors ${
                        formEngines.includes(e)
                          ? 'bg-rose-950/40 text-rose-300 border-rose-500'
                          : 'bg-[#171D2F] text-slate-400 border-[#222B42]'
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {formRoles.includes('Audio/OST') && (
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">OST SYNTH SAMPLE STYLE</label>
                  <select
                    value={formSynthType}
                    onChange={(e) => setFormSynthType(e.target.value as any)}
                    className="w-full bg-[#171D2F] border border-[#222B42] rounded-lg px-3 py-2 text-sm text-amber-300 font-mono focus:outline-none focus:border-amber-500"
                  >
                    <option value="synthwave">Retro Synthwave (Analog Chords)</option>
                    <option value="chiptune">8-Bit Chiptune (Square Arpeggios)</option>
                    <option value="cyberpunk">Cyberpunk Bass (Distorted Sub)</option>
                    <option value="ambient">Ethereal Ambient (Floating Pads)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">BIO & JAM GOALS</label>
                <textarea
                  rows={2}
                  placeholder="Share your strengths, portfolio, or the game vibe you want to make..."
                  value={formBio}
                  onChange={(e) => setFormBio(e.target.value)}
                  className="w-full bg-[#171D2F] border border-[#222B42] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-sans"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBeaconModal(false)}
                  className="px-4 py-2 bg-[#171D2F] text-slate-400 rounded-lg text-xs font-mono"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-rose-500 to-cyan-500 text-white rounded-lg text-xs font-mono font-bold tracking-wider"
                >
                  BROADCAST BEACON
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
