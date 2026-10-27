import React, { useState } from 'react';
import { Sliders, Award, Image, Settings2, Check, Sparkles } from 'lucide-react';

export default function BlockInspector({
  question,
  onUpdateQuestion,
  isQuiz = false
}) {
  const [activeTab, setActiveTab] = useState('settings'); // 'settings' | 'quiz' | 'media'

  if (!question) {
    return (
      <aside className="w-80 shrink-0 border-l border-white/10 bg-[#0E1014] p-4 text-xs text-slate-500 font-mono">
        No block selected
      </aside>
    );
  }

  const choices = question.properties?.choices || [];

  return (
    <aside className="w-80 shrink-0 border-l border-white/10 bg-[#0E1014] flex flex-col h-full">
      {/* Inspector Tab Switcher */}
      <div className="flex border-b border-white/10 p-2 gap-1 bg-white/[0.02]">
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'settings'
              ? 'bg-brand/20 text-brand-light border border-brand/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span>Settings</span>
        </button>

        {isQuiz && (
          <button
            type="button"
            onClick={() => setActiveTab('quiz')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'quiz'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Quiz</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('media')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'media'
              ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Image className="w-3.5 h-3.5" />
          <span>Media</span>
        </button>
      </div>

      {/* Tab 1: General Settings */}
      {activeTab === 'settings' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs text-slate-300">
          {/* Question Type */}
          <div>
            <label className="block text-slate-400 font-mono text-[11px] mb-1.5 uppercase tracking-wider">
              Question Format
            </label>
            <select
              value={question.type}
              onChange={(e) => onUpdateQuestion({ ...question, type: e.target.value })}
              className="w-full bg-[#161820] border border-white/10 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-brand"
            >
              <option value="short_text">Short Text</option>
              <option value="long_text">Long Text</option>
              <option value="multiple_choice">Multiple Choice</option>
              <option value="picture_choice">Picture Choice</option>
              <option value="opinion_scale">Opinion Scale (0-10)</option>
              <option value="rating">Star Rating (1-5)</option>
              <option value="email">Email Intake</option>
              <option value="file_upload">File Attachment</option>
              <option value="date_picker">Date Picker</option>
              <option value="phone">Phone Number</option>
            </select>
          </div>

          {/* Required Field Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/[0.02]">
            <div>
              <div className="font-semibold text-white">Required Response</div>
              <div className="text-[11px] text-slate-400">Respondent must answer before continuing</div>
            </div>
            <button
              type="button"
              onClick={() => onUpdateQuestion({ ...question, is_required: !question.is_required })}
              className={`w-10 h-6 rounded-full transition-colors relative ${
                question.is_required ? 'bg-brand' : 'bg-white/10'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  question.is_required ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Contextual Variable Name (For Piping) */}
          <div>
            <label className="block text-slate-400 font-mono text-[11px] mb-1 uppercase tracking-wider">
              Variable Piping Tag
            </label>
            <div className="flex items-center">
              <span className="bg-[#121418] border border-r-0 border-white/10 px-2.5 py-2 text-slate-400 font-mono rounded-l-lg text-xs">
                {'{{'}
              </span>
              <input
                type="text"
                value={question.properties?.variable_name || ''}
                onChange={(e) =>
                  onUpdateQuestion({
                    ...question,
                    properties: { ...question.properties, variable_name: e.target.value.trim() }
                  })
                }
                placeholder="e.g. name, role, email"
                className="w-full bg-[#161820] border border-l-0 border-r-0 border-white/10 py-2 text-white font-mono text-xs outline-none focus:border-brand"
              />
              <span className="bg-[#121418] border border-l-0 border-white/10 px-2.5 py-2 text-slate-400 font-mono rounded-r-lg text-xs">
                {'}}'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Pipe this respondent's answer into later questions using this tag.
            </p>
          </div>

          {/* Placeholder for text types */}
          {['short_text', 'long_text', 'email', 'phone'].includes(question.type) && (
            <div>
              <label className="block text-slate-400 font-mono text-[11px] mb-1 uppercase tracking-wider">
                Placeholder Text
              </label>
              <input
                type="text"
                value={question.properties?.placeholder || ''}
                onChange={(e) =>
                  onUpdateQuestion({
                    ...question,
                    properties: { ...question.properties, placeholder: e.target.value }
                  })
                }
                placeholder="e.g. Type your answer..."
                className="w-full bg-[#161820] border border-white/10 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-brand"
              />
            </div>
          )}

          {/* Opinion Scale Properties */}
          {question.type === 'opinion_scale' && (
            <div className="space-y-3 border-t border-white/10 pt-3">
              <div>
                <label className="block text-slate-400 font-mono text-[11px] mb-1">Scale Minimum</label>
                <select
                  value={question.properties?.min_value ?? 0}
                  onChange={(e) =>
                    onUpdateQuestion({
                      ...question,
                      properties: { ...question.properties, min_value: parseInt(e.target.value, 10) }
                    })
                  }
                  className="w-full bg-[#161820] border border-white/10 rounded-lg p-2 text-white text-xs"
                >
                  <option value={0}>0</option>
                  <option value={1}>1</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 font-mono text-[11px] mb-1">Scale Maximum</label>
                <select
                  value={question.properties?.max_value ?? 10}
                  onChange={(e) =>
                    onUpdateQuestion({
                      ...question,
                      properties: { ...question.properties, max_value: parseInt(e.target.value, 10) }
                    })
                  }
                  className="w-full bg-[#161820] border border-white/10 rounded-lg p-2 text-white text-xs"
                >
                  <option value={5}>5</option>
                  <option value={7}>7</option>
                  <option value={10}>10</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 font-mono text-[11px] mb-1">Min Label</label>
                <input
                  type="text"
                  value={question.properties?.min_label || ''}
                  onChange={(e) =>
                    onUpdateQuestion({
                      ...question,
                      properties: { ...question.properties, min_label: e.target.value }
                    })
                  }
                  placeholder="Not at all likely"
                  className="w-full bg-[#161820] border border-white/10 rounded-lg p-2 text-white text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-mono text-[11px] mb-1">Max Label</label>
                <input
                  type="text"
                  value={question.properties?.max_label || ''}
                  onChange={(e) =>
                    onUpdateQuestion({
                      ...question,
                      properties: { ...question.properties, max_label: e.target.value }
                    })
                  }
                  placeholder="Extremely likely"
                  className="w-full bg-[#161820] border border-white/10 rounded-lg p-2 text-white text-xs"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Scored Quiz Settings */}
      {activeTab === 'quiz' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs text-slate-300">
          <div>
            <label className="block text-slate-400 font-mono text-[11px] mb-1.5 uppercase tracking-wider">
              Points Awarded
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={question.properties?.points ?? 25}
              onChange={(e) =>
                onUpdateQuestion({
                  ...question,
                  properties: { ...question.properties, points: parseInt(e.target.value, 10) || 0 }
                })
              }
              className="w-full bg-[#161820] border border-white/10 rounded-lg px-3 py-2 text-white font-mono text-sm outline-none focus:border-brand"
            />
          </div>

          {choices.length > 0 && (
            <div>
              <label className="block text-slate-400 font-mono text-[11px] mb-1.5 uppercase tracking-wider">
                Correct Answer
              </label>
              <select
                value={question.properties?.correct_answer || ''}
                onChange={(e) =>
                  onUpdateQuestion({
                    ...question,
                    properties: { ...question.properties, correct_answer: e.target.value }
                  })
                }
                className="w-full bg-[#161820] border border-white/10 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-emerald-500"
              >
                <option value="">-- Select Correct Option --</option>
                {choices.map((c) => (
                  <option key={c.id} value={c.label}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-slate-400 font-mono text-[11px] mb-1.5 uppercase tracking-wider">
              Answer Explanation
            </label>
            <textarea
              rows={4}
              value={question.properties?.explanation || ''}
              onChange={(e) =>
                onUpdateQuestion({
                  ...question,
                  properties: { ...question.properties, explanation: e.target.value }
                })
              }
              placeholder="Explain why this option is correct or incorrect..."
              className="w-full bg-[#161820] border border-white/10 rounded-lg p-3 text-white text-xs outline-none focus:border-brand"
            />
          </div>
        </div>
      )}

      {/* Tab 3: Media & Aesthetics */}
      {activeTab === 'media' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs text-slate-300">
          <div>
            <label className="block text-slate-400 font-mono text-[11px] mb-1.5 uppercase tracking-wider">
              Header Cover Image URL
            </label>
            <input
              type="text"
              value={question.media_url || ''}
              onChange={(e) => onUpdateQuestion({ ...question, media_url: e.target.value })}
              placeholder="https://images.unsplash.com/..."
              className="w-full bg-[#161820] border border-white/10 rounded-lg px-3 py-2 text-white font-mono text-xs outline-none focus:border-brand"
            />
          </div>

          {question.media_url && (
            <div className="rounded-xl overflow-hidden border border-white/10 h-36">
              <img src={question.media_url} alt="Cover preview" className="w-full h-full object-cover" />
            </div>
          )}

          <div className="p-3 rounded-xl border border-white/5 bg-white/[0.02] text-slate-400 text-[11px] leading-relaxed">
            <Sparkles className="w-4 h-4 text-brand-light mb-1" />
            Header media will be displayed gracefully above the question title in fullscreen runner mode.
          </div>
        </div>
      )}
    </aside>
  );
}
