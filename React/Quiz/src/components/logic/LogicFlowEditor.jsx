import React, { useState } from 'react';
import { GitBranch, Plus, Trash2, ArrowRight, CornerDownRight, CheckCircle2, Split } from 'lucide-react';

export default function LogicFlowEditor({ survey, onUpdateSurvey }) {
  const [isAddRuleOpen, setIsAddRuleOpen] = useState(false);
  const [sourceQId, setSourceQId] = useState(survey.questions[0]?.id || '');
  const [condition, setCondition] = useState('equals');
  const [conditionValue, setConditionValue] = useState('');
  const [targetQId, setTargetQId] = useState(survey.questions[1]?.id || '');

  const rules = survey.logic_rules || [];

  const handleAddRule = (e) => {
    e.preventDefault();
    if (!sourceQId || !targetQId) return;

    const newRule = {
      id: 'rule_' + Math.random().toString(36).substr(2, 7),
      source_question_id: sourceQId,
      condition: condition,
      value: conditionValue,
      action: 'jump_to',
      target_question_id: targetQId
    };

    onUpdateSurvey({
      ...survey,
      logic_rules: [...rules, newRule]
    });

    setIsAddRuleOpen(false);
    setConditionValue('');
  };

  const handleDeleteRule = (ruleId) => {
    const updated = rules.filter(r => r.id !== ruleId);
    onUpdateSurvey({
      ...survey,
      logic_rules: updated
    });
  };

  return (
    <div className="flex-1 bg-[#0A0B0E] p-6 sm:p-10 overflow-y-auto h-[calc(100vh-65px)]">
      <div className="max-w-4xl mx-auto">
        {/* Header Ribbon */}
        <div className="flex items-center justify-between pb-6 border-b border-white/10 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-violet-500/20 text-violet-400 border border-violet-500/30 flex items-center justify-center">
                <GitBranch className="w-4 h-4" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">Visual Logic & Branching Engine</h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              Configure dynamic question flow, conditional skip rules, and personalized respondent pathways.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddRuleOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs shadow-lg shadow-violet-600/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Branching Rule</span>
          </button>
        </div>

        {/* Add Rule Dialog Form */}
        {isAddRuleOpen && (
          <form
            onSubmit={handleAddRule}
            className="p-6 rounded-2xl border border-violet-500/40 bg-violet-950/20 mb-8 animate-fade-slide-up space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <Split className="w-4 h-4 text-violet-400" />
                <span>Define Conditional Skip Rule</span>
              </span>
              <button
                type="button"
                onClick={() => setIsAddRuleOpen(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {/* Source Question */}
              <div>
                <label className="block text-slate-400 mb-1 font-mono uppercase text-[11px]">
                  IF Respondent is on:
                </label>
                <select
                  value={sourceQId}
                  onChange={(e) => setSourceQId(e.target.value)}
                  className="w-full bg-[#121418] border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-violet-500"
                >
                  {survey.questions.map((q, idx) => (
                    <option key={q.id} value={q.id}>
                      Q{idx + 1}: {q.title.substring(0, 32)}...
                    </option>
                  ))}
                </select>
              </div>

              {/* Condition & Value */}
              <div>
                <label className="block text-slate-400 mb-1 font-mono uppercase text-[11px]">
                  Condition Operator:
                </label>
                <div className="flex gap-2">
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    className="w-1/2 bg-[#121418] border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-violet-500"
                  >
                    <option value="equals">Equals (==)</option>
                    <option value="not_equals">Does not equal</option>
                    <option value="greater_than">Greater than (&gt;)</option>
                    <option value="less_than">Less than (&lt;)</option>
                    <option value="always">Always Jump</option>
                  </select>
                  {condition !== 'always' && (
                    <input
                      type="text"
                      value={conditionValue}
                      onChange={(e) => setConditionValue(e.target.value)}
                      placeholder="e.g. 9 or Enterprise"
                      className="w-1/2 bg-[#121418] border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-violet-500"
                    />
                  )}
                </div>
              </div>

              {/* Target Question */}
              <div>
                <label className="block text-slate-400 mb-1 font-mono uppercase text-[11px]">
                  THEN Jump To Question:
                </label>
                <select
                  value={targetQId}
                  onChange={(e) => setTargetQId(e.target.value)}
                  className="w-full bg-[#121418] border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-violet-500"
                >
                  {survey.questions.map((q, idx) => (
                    <option key={q.id} value={q.id}>
                      Q{idx + 1}: {q.title.substring(0, 32)}...
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs shadow-md transition-all"
              >
                Create Branching Logic
              </button>
            </div>
          </form>
        )}

        {/* Existing Rules List */}
        {rules.length === 0 ? (
          <div className="border border-dashed border-white/15 rounded-2xl p-12 text-center text-slate-400">
            <GitBranch className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-white mb-1">No Branching Rules Configured</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
              All questions currently flow in sequential order. Create conditional rules to route promoters, detractors, or specific choices down custom paths.
            </p>
            <button
              type="button"
              onClick={() => setIsAddRuleOpen(true)}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-semibold"
            >
              Add First Branch Rule
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {rules.map((rule, idx) => {
              const sourceIdx = survey.questions.findIndex(q => q.id === rule.source_question_id);
              const sourceQ = survey.questions[sourceIdx];
              const targetIdx = survey.questions.findIndex(q => q.id === rule.target_question_id);
              const targetQ = survey.questions[targetIdx];

              return (
                <div
                  key={rule.id || idx}
                  className="relative p-5 rounded-2xl border border-white/10 bg-[#121418] hover:border-violet-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  {/* Visual Node Connectors */}
                  <div className="flex items-center gap-3 flex-wrap flex-1 text-sm">
                    {/* Condition Pill */}
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-2 rounded-xl font-mono text-xs">
                      <span className="text-violet-400 font-bold">IF</span>
                      <span className="text-white font-semibold">
                        Q{sourceIdx + 1}
                      </span>
                      <span className="text-slate-400">
                        {rule.condition === 'always'
                          ? 'always'
                          : `${rule.condition.replace('_', ' ')} "${rule.value}"`}
                      </span>
                    </div>

                    <ArrowRight className="w-4 h-4 text-violet-400 shrink-0" />

                    {/* Action Pill */}
                    <div className="flex items-center gap-2 bg-violet-950/30 border border-violet-500/30 px-3 py-2 rounded-xl font-mono text-xs text-violet-200">
                      <span className="text-violet-400 font-bold">THEN JUMP TO</span>
                      <span className="text-white font-semibold">
                        Q{targetIdx + 1}: {targetQ ? targetQ.title.substring(0, 24) : 'Next'}...
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDeleteRule(rule.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete rule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
