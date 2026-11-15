import { useEffect, useState } from 'react';
import { Mic, MicOff, PhoneOff, Video, VideoOff, Volume2 } from 'lucide-react';
import { useChatWorkspaceStore } from '../../stores/useChatWorkspaceStore';
import { formatDuration } from '../../lib/utils';
import { Avatar } from '../ui/Avatar';

export function CallOverlayModal() {
  const activeCall = useChatWorkspaceStore((s) => s.activeCall);
  const setActiveCall = useChatWorkspaceStore((s) => s.setActiveCall);

  const [elapsedSec, setElapsedSec] = useState(0);
  const [muted, setMuted] = useState(false);
  const [videoOn, setVideoOn] = useState(true);

  useEffect(() => {
    if (!activeCall) return;
    setElapsedSec(0);
    setMuted(false);
    setVideoOn(activeCall.mode === 'video');
    const id = window.setInterval(() => setElapsedSec((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [activeCall]);

  if (!activeCall) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-white/15 bg-[#111318] p-6 text-center text-white shadow-2xl space-y-6 animate-bubble-in">
        <div className="flex flex-col items-center gap-3">
          <Avatar
            user={activeCall.participants[0]}
            users={activeCall.participants}
            isGroup={activeCall.participants.length > 1}
            title={activeCall.title}
            size={80}
            showPresence
            ringClass="ring-4 ring-[#111318]"
          />
          <div>
            <h3 className="text-lg font-bold">{activeCall.title}</h3>
            <p className="tabular-nums-meta text-xs text-emerald-400 mt-1">
              {elapsedSec < 2
                ? `Connecting ${activeCall.mode} call...`
                : `Connected • ${formatDuration(elapsedSec)}`}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => setMuted((v) => !v)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              muted ? 'bg-amber-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
            title={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <button
            type="button"
            onClick={() => setVideoOn((v) => !v)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              videoOn ? 'bg-blue-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
            title="Toggle Video"
          >
            {videoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          <button
            type="button"
            className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
            title="Speaker"
          >
            <Volume2 className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => setActiveCall(null)}
            className="w-12 h-12 rounded-full bg-rose-600 hover:bg-rose-500 flex items-center justify-center shadow-lg shadow-rose-600/30"
            title="End Call"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

