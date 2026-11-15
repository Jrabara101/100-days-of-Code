import { useState } from 'react';
import { BarChart3, Plus, X } from 'lucide-react';
import { useChatWorkspaceStore } from '../../stores/useChatWorkspaceStore';
import { useMessageMutations } from '../../hooks/useMessages';
import { generateUuid } from '../../lib/utils';

export function PollCreatorModal() {
  const isOpen = useChatWorkspaceStore((s) => s.isPollModalOpen);
  const setOpen = useChatWorkspaceStore((s) => s.setPollModalOpen);
  const activeConversationId = useChatWorkspaceStore((s) => s.activeConversationId);
  const { dispatchMessage } = useMessageMutations(activeConversationId);

  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [allowMultiple, setAllowMultiple] = useState(false);

  if (!isOpen || !activeConversationId) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validOpts = options.map((o) => o.trim()).filter(Boolean);
    if (!question.trim() || validOpts.length < 2) return;

    dispatchMessage({
      conversationId: activeConversationId,
      content: `📊 Quick Poll: ${question.trim()}`,
      attachments: [
        {
          id: generateUuid(),
          kind: 'poll',
          question: question.trim(),
          allowMultiple,
          options: validOpts.map((label) => ({
            id: generateUuid(),
            label,
            voterIds: [],
          })),
        },
      ],
    });
    setQuestion('');
    setOptions(['', '']);
    setOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={() => setOpen(false)}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border border-divider bg-surface-elevated shadow-2xl overflow-hidden animate-bubble-in"
      >
        <div className="px-5 py-4 border-b border-divider flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-bold text-txt-primary">Create Decision Poll</h3>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="p-1 rounded-lg hover:bg-surface-tertiary text-txt-muted"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <div>
            <label className="block text-xs font-medium text-txt-muted mb-1">Question</label>
            <input
              type="text"
              autoFocus
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. Ship v2.4 today or wait for QA?"
              className="w-full rounded-xl bg-surface-tertiary border border-divider px-3 py-2 text-xs text-txt-primary focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-txt-muted">Options</label>
            {options.map((opt, idx) => (
              <input
                key={idx}
                type="text"
                value={opt}
                onChange={(e) => {
                  const next = [...options];
                  next[idx] = e.target.value;
                  setOptions(next);
                }}
                placeholder={`Option ${idx + 1}`}
                className="w-full rounded-xl bg-surface-tertiary border border-divider px-3 py-2 text-xs text-txt-primary focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            ))}
            {options.length < 4 && (
              <button
                type="button"
                onClick={() => setOptions([...options, ''])}
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-500 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" /> Add option
              </button>
            )}
          </div>

          <label className="inline-flex items-center gap-2 text-xs text-txt-muted cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={allowMultiple}
              onChange={(e) => setAllowMultiple(e.target.checked)}
              className="rounded border-divider text-blue-600"
            />
            Allow selecting multiple options
          </label>
        </div>

        <div className="px-5 py-3 border-t border-divider bg-surface-secondary flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="px-3 py-1.5 rounded-xl text-xs text-txt-muted"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!question.trim() || options.filter((o) => o.trim()).length < 2}
            className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-45 text-white text-xs font-semibold"
          >
            Post Poll
          </button>
        </div>
      </form>
    </div>
  );
}

