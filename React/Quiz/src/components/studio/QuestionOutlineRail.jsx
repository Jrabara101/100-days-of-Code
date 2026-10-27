import React from 'react';
import {
  Plus,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Copy,
  Trash2,
  GitBranch,
  Star,
  ListOrdered,
  Type,
  AlignLeft,
  Sliders,
  Calendar,
  UploadCloud,
  Mail,
  Phone,
  Image
} from 'lucide-react';

const TYPE_ICONS = {
  short_text: Type,
  long_text: AlignLeft,
  multiple_choice: ListOrdered,
  picture_choice: Image,
  opinion_scale: Sliders,
  rating: Star,
  date_picker: Calendar,
  file_upload: UploadCloud,
  email: Mail,
  phone: Phone
};

export default function QuestionOutlineRail({
  questions = [],
  activeQuestionId,
  onSelectQuestion,
  onAddClick,
  onReorderQuestion,
  onDuplicateQuestion,
  onDeleteQuestion,
  logicRules = [],
  isQuiz = false
}) {
  return (
    <aside className="w-72 shrink-0 border-r border-white/10 bg-[#0E1014] flex flex-col h-full">
      {/* Top Header & Add Button */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div>
          <span className="text-xs font-mono font-bold tracking-wider uppercase text-slate-400">
            Questions ({questions.length})
          </span>
        </div>
        <button
          type="button"
          onClick={onAddClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand hover:bg-brand-light text-white text-xs font-semibold shadow-sm transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add</span>
        </button>
      </div>

      {/* Question Cards List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {questions.map((q, index) => {
          const Icon = TYPE_ICONS[q.type] || Type;
          const isActive = q.id === activeQuestionId;
          const hasLogic = logicRules.some(
            r => r.source_question_id === q.id || r.target_question_id === q.id
          );
          const points = q.properties?.points;

          return (
            <div
              key={q.id}
              onClick={() => onSelectQuestion(q.id)}
              className={`group relative p-3 rounded-xl border text-left cursor-pointer transition-all duration-150 ${
                isActive
                  ? 'border-brand bg-brand/10 shadow-glow-brand ring-1 ring-brand/40'
                  : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/15'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                {/* Index & Type Icon */}
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-400">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className={`w-5 h-5 rounded flex items-center justify-center text-xs ${isActive ? 'text-brand-light' : 'text-slate-400'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                {/* Quick actions (Reorder, Duplicate, Delete) */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onReorderQuestion(index, index - 1);
                    }}
                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-20"
                    title="Move up"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={index === questions.length - 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      onReorderQuestion(index, index + 1);
                    }}
                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-20"
                    title="Move down"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateQuestion(q.id);
                    }}
                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10"
                    title="Duplicate"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteQuestion(q.id);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Title preview */}
              <div className="mt-2 text-xs font-medium text-slate-200 line-clamp-2 leading-relaxed">
                {q.title || 'Untitled question'}
              </div>

              {/* Badges footer */}
              <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                {q.is_required && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    Required
                  </span>
                )}
                {hasLogic && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-300 border border-violet-500/30 flex items-center gap-1">
                    <GitBranch className="w-2.5 h-2.5" /> Logic
                  </span>
                )}
                {isQuiz && points !== undefined && points > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    {points} pts
                  </span>
                )}
                {q.properties?.variable_name && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30">
                    {`{{${q.properties.variable_name}}}`}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
