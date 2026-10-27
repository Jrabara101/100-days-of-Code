import React from 'react';
import {
  Type,
  AlignLeft,
  ListOrdered,
  Image,
  Sliders,
  Star,
  Calendar,
  UploadCloud,
  Mail,
  Phone,
  X
} from 'lucide-react';

const QUESTION_TYPES = [
  {
    type: 'multiple_choice',
    label: 'Multiple Choice',
    desc: 'Select one option from a list with keycaps (A, B, C)',
    icon: ListOrdered,
    color: 'text-brand'
  },
  {
    type: 'short_text',
    label: 'Short Text',
    desc: 'Single-line text input for names, titles, or quick input',
    icon: Type,
    color: 'text-cyan-400'
  },
  {
    type: 'long_text',
    label: 'Long Text',
    desc: 'Multi-line paragraph area for open-ended feedback',
    icon: AlignLeft,
    color: 'text-indigo-400'
  },
  {
    type: 'opinion_scale',
    label: 'Opinion Scale',
    desc: 'Linear 0-10 or 1-10 numerical scale for NPS and ratings',
    icon: Sliders,
    color: 'text-emerald-400'
  },
  {
    type: 'rating',
    label: 'Star Rating',
    desc: '1 to 5 glowing star rating for satisfaction and reviews',
    icon: Star,
    color: 'text-amber-400'
  },
  {
    type: 'picture_choice',
    label: 'Picture Choice',
    desc: 'Visual card choices with photography and badges',
    icon: Image,
    color: 'text-rose-400'
  },
  {
    type: 'email',
    label: 'Email Capture',
    desc: 'Validated email input for leads and follow-ups',
    icon: Mail,
    color: 'text-blue-400'
  },
  {
    type: 'file_upload',
    label: 'File Upload',
    desc: 'Drag & drop zone for resumes, images, and attachments',
    icon: UploadCloud,
    color: 'text-violet-400'
  },
  {
    type: 'date_picker',
    label: 'Date Picker',
    desc: 'Calendar selection for deadlines, birthdays, and schedules',
    icon: Calendar,
    color: 'text-emerald-300'
  },
  {
    type: 'phone',
    label: 'Phone Number',
    desc: 'Contact intake for SMS alerts or phone screenings',
    icon: Phone,
    color: 'text-orange-400'
  }
];

export default function AddQuestionModal({ isOpen, onClose, onSelectType }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-slide-up">
      <div className="relative w-full max-w-2xl bg-[#121418] border border-white/15 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div>
            <h2 className="text-lg font-bold text-white">Add New Question Block</h2>
            <p className="text-xs text-slate-400">Select a polymorphic question format for your survey</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Types Grid */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto">
          {QUESTION_TYPES.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.type}
                type="button"
                onClick={() => {
                  onSelectType(item.type);
                  onClose();
                }}
                className="flex items-start gap-3.5 p-3.5 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] hover:border-brand/60 text-left transition-all duration-150 group cursor-pointer"
              >
                <div className={`w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 ${item.color} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white group-hover:text-brand-light transition-colors">
                    {item.label}
                  </div>
                  <div className="text-xs text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                    {item.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
