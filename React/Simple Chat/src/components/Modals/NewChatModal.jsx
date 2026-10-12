import React, { useState } from 'react';
import { X, Users, User, Check } from 'lucide-react';

export default function NewChatModal({
  contacts = [],
  onClose,
  onCreateDirect,
  onCreateGroup,
}) {
  const [mode, setMode] = useState('direct'); // 'direct' | 'group'
  const [groupTitle, setGroupTitle] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  const toggleSelectUser = (id) => {
    if (mode === 'direct') {
      onCreateDirect(id);
      onClose();
    } else {
      setSelectedUserIds((prev) =>
        prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]
      );
    }
  };

  const handleCreateGroup = () => {
    if (!groupTitle.trim() || selectedUserIds.length === 0) return;
    onCreateGroup(groupTitle.trim(), selectedUserIds);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-pop-in">
      <div className="w-full max-w-md bg-white dark:bg-[#181A20] rounded-2xl border border-slate-200 dark:border-[#23262D] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-[#23262D] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-sm text-slate-900 dark:text-white">
              {mode === 'direct' ? 'New Direct Message' : 'Create Group Channel'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex p-2 bg-slate-50 dark:bg-[#121316] border-b border-slate-200 dark:border-[#23262D] text-xs">
          <button
            onClick={() => setMode('direct')}
            className={`flex-1 py-1.5 rounded-lg font-medium flex items-center justify-center space-x-1.5 transition ${
              mode === 'direct'
                ? 'bg-white dark:bg-[#181A20] text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-500 dark:text-[#8F9CAE]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Direct Message</span>
          </button>
          <button
            onClick={() => setMode('group')}
            className={`flex-1 py-1.5 rounded-lg font-medium flex items-center justify-center space-x-1.5 transition ${
              mode === 'group'
                ? 'bg-white dark:bg-[#181A20] text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-500 dark:text-[#8F9CAE]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Group Thread</span>
          </button>
        </div>

        {/* Group Title Input if in group mode */}
        {mode === 'group' && (
          <div className="p-4 pb-0">
            <label className="block text-xs font-medium text-slate-500 dark:text-[#8F9CAE] mb-1">
              Channel Name
            </label>
            <input
              type="text"
              value={groupTitle}
              onChange={(e) => setGroupTitle(e.target.value)}
              placeholder="e.g. # sprint-release-sync"
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#121316] border border-slate-200 dark:border-[#23262D] text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        )}

        {/* Contacts Roster */}
        <div className="p-4 max-h-72 overflow-y-auto space-y-2">
          <div className="text-[11px] font-semibold text-slate-400 dark:text-[#8F9CAE] uppercase tracking-wider mb-2">
            {mode === 'direct' ? 'Select Contact' : 'Select Participants'}
          </div>

          {contacts.map((contact) => {
            const isSelected = selectedUserIds.includes(contact.id);
            return (
              <div
                key={contact.id}
                onClick={() => toggleSelectUser(contact.id)}
                className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition border ${
                  isSelected
                    ? 'bg-blue-500/10 border-blue-500/80 text-blue-600 dark:text-blue-400'
                    : 'bg-slate-50 dark:bg-[#121316] border-slate-200/80 dark:border-[#23262D] hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <img
                      src={contact.avatar}
                      alt={contact.name}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                    <span
                      className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-white dark:border-[#121316] ${
                        contact.status === 'online'
                          ? 'bg-emerald-500'
                          : contact.status === 'idle'
                          ? 'bg-amber-500'
                          : 'bg-slate-400'
                      }`}
                    />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-white">
                      {contact.name}
                    </div>
                    <div className="text-[10.5px] text-slate-400 dark:text-[#8F9CAE]">
                      {contact.title}
                    </div>
                  </div>
                </div>

                {mode === 'group' && (
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition ${
                      isSelected
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-3" />}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer for group mode */}
        {mode === 'group' && (
          <div className="p-4 border-t border-slate-200 dark:border-[#23262D] bg-slate-50 dark:bg-[#121316] flex justify-end space-x-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-[#181A20] transition"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateGroup}
              disabled={!groupTitle.trim() || selectedUserIds.length === 0}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition shadow-sm"
            >
              Create Group ({selectedUserIds.length})
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
