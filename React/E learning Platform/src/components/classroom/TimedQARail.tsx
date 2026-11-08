import React, { useState } from 'react';
import { TimedQuestionItem } from '../../types';
import { ThumbsUp, CheckCircle, MessageSquare, Send, Clock, Play } from 'lucide-react';
import { sounds } from '../../services/audioEffects';

interface TimedQARailProps {
  questions: TimedQuestionItem[];
  currentTime: number;
  onSeekTo: (seconds: number) => void;
  onUpvote: (questionId: string) => void;
  onAskQuestion: (question: string) => void;
  formatTimecode: (seconds: number) => string;
}

export const TimedQARail: React.FC<TimedQARailProps> = ({
  questions,
  currentTime,
  onSeekTo,
  onUpvote,
  onAskQuestion,
  formatTimecode
}) => {
  const [newQuestionText, setNewQuestionText] = useState('');

  const handlePost = () => {
    if (!newQuestionText.trim()) return;
    sounds.playClick();
    onAskQuestion(newQuestionText.trim());
    setNewQuestionText('');
  };

  return (
    <div className="flex flex-col h-full bg-[#11141C] text-slate-200">
      {/* Questions List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-white/10 text-[11px] font-mono text-slate-400">
          <span>TIMED QUESTIONS & VERIFIED ANSWERS</span>
          <span>{questions.length} Discussions</span>
        </div>

        {questions.map(q => (
          <div
            key={q.id}
            className="p-3.5 rounded-2xl bg-[#171B26] border border-white/10 space-y-3 transition-colors hover:border-white/20"
          >
            {/* Header: Author & Timestamp pill */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src={q.avatar}
                  alt={q.author}
                  className="w-5 h-5 rounded-full object-cover"
                />
                <span className="text-xs font-semibold text-slate-200">{q.author}</span>
                <span className="text-[10px] text-slate-500 font-mono">{q.createdAt}</span>
              </div>

              <button
                onClick={() => {
                  sounds.playClick();
                  onSeekTo(q.timestampSec);
                }}
                className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 flex items-center gap-1 hover:bg-indigo-500/20 transition-colors"
                title="Seek video to question timestamp"
              >
                <Play className="w-2.5 h-2.5 fill-indigo-400" />
                <span>@{formatTimecode(q.timestampSec)}</span>
              </button>
            </div>

            {/* Question Text */}
            <p className="text-xs text-slate-200 leading-relaxed font-sans">
              {q.question}
            </p>

            {/* Upvote Button */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => {
                  sounds.playClick();
                  onUpvote(q.id);
                }}
                className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-[11px] font-mono flex items-center gap-1.5 transition-colors"
              >
                <ThumbsUp className="w-3 h-3" />
                <span>{q.upvotes}</span>
              </button>

              {q.hasInstructorAnswer && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                  <span>Instructor Verified</span>
                </span>
              )}
            </div>

            {/* Instructor Reply Box */}
            {q.instructorAnswer && (
              <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400 font-semibold">
                  <span>{q.instructorAnswer.author} (Instructor)</span>
                  <span className="text-slate-500">{q.instructorAnswer.timestamp}</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  {q.instructorAnswer.text}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Question Composer Form */}
      <div className="p-3 bg-[#0B0D13] border-t border-white/10 space-y-2">
        <span className="text-[11px] font-mono text-cyan-400 flex items-center gap-1">
          <Clock className="w-3 h-3" /> Anchoring question to @ {formatTimecode(currentTime)}
        </span>

        <div className="flex gap-2">
          <input
            type="text"
            value={newQuestionText}
            onChange={e => setNewQuestionText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handlePost();
            }}
            placeholder="Ask a question about this timestamp..."
            className="flex-1 bg-[#171B26] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
          />
          <button
            onClick={handlePost}
            disabled={!newQuestionText.trim()}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition-all disabled:opacity-40"
          >
            <Send className="w-3 h-3" />
            <span>Ask</span>
          </button>
        </div>
      </div>
    </div>
  );
};

