import React, { useState } from 'react';
import { X, UserPlus, Check } from 'lucide-react';

export default function AddParticipantModal({
  existingParticipantIds = [],
  allContacts = [],
  onClose,
  onAddParticipants,
}) {
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  // Filter out contacts already in the conversation
  const eligibleContacts = allContacts.filter(
    (c) => !existingParticipantIds.includes(c.id)
  );

  const toggleSelect = (id) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]
    );
  };

  const handleAdd = () => {
    if (selectedUserIds.length === 0) return;
    onAddParticipants(selectedUserIds);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-pop-in">
      <div className="w-full max-w-sm bg-white dark:bg-[#181A20] rounded-2xl border border-slate-200 dark:border-[#23262D] shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-[#23262D] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <UserPlus className="w-4 h-4 text-blue-500" />
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
              Add to Conversation
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 max-h-72 overflow-y-auto space-y-2">
          {eligibleContacts.length === 0 ? (
            <p className="text-center text-xs text-slate-400 dark:text-[#8F9CAE] py-6">
              All contacts are already participating in this thread!
            </p>
          ) : (
            eligibleContacts.map((contact) => {
              const isSelected = selectedUserIds.includes(contact.id);
              return (
                <div
                  key={contact.id}
                  onClick={() => toggleSelect(contact.id)}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition border ${
                    isSelected
                      ? 'bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'bg-slate-50 dark:bg-[#121316] border-slate-200/80 dark:border-[#23262D] hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={contact.avatar}
                      alt={contact.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-white">
                        {contact.name}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-[#8F9CAE]">
                        {contact.title}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition ${
                      isSelected
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-3" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-[#23262D] bg-slate-50 dark:bg-[#121316] flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-[#181A20] transition"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={selectedUserIds.length === 0}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition shadow-sm"
          >
            Add ({selectedUserIds.length})
          </button>
        </div>
      </div>
    </div>
  );
}
