import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, Send, X, Smile, Code, Image as ImageIcon, CornerUpLeft } from 'lucide-react';

const EMOJIS = ['👍', '❤️', '🔥', '🚀', '😂', '👏', '✨', '🎉', '💡', '⚡', '👀', '🙌'];

export default function ChatComposer({
  onSendMessage,
  activeQuoteReply,
  onClearQuoteReply,
  onTyping,
}) {
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const textareaRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const attachMenuRef = useRef(null);

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [text]);

  // Handle outside clicks for flyouts
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target)) {
        setShowAttachMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleChange = (e) => {
    setText(e.target.value);
    onTyping?.();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed && pendingAttachments.length === 0) return;

    onSendMessage({
      content: trimmed,
      attachments: pendingAttachments,
      replyTo: activeQuoteReply,
    });

    setText('');
    setPendingAttachments([]);
    onClearQuoteReply?.();
    setShowEmojiPicker(false);
    setShowAttachMenu(false);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const addSampleImage = () => {
    setPendingAttachments((prev) => [
      ...prev,
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
        caption: 'Terminal & Code Architecture Screenshot',
      },
    ]);
    setShowAttachMenu(false);
  };

  const addSampleSnippet = () => {
    setPendingAttachments((prev) => [
      ...prev,
      {
        type: 'code',
        language: 'typescript',
        code: `// Pusher presence client state
const presence = echo.join('chat.room-101');
presence.here((members) => {
  console.log('Active members:', members.length);
});`,
      },
    ]);
    setShowAttachMenu(false);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvt) => {
      setPendingAttachments((prev) => [
        ...prev,
        {
          type: 'image',
          url: uploadEvt.target.result,
          caption: file.name,
        },
      ]);
    };
    reader.readAsDataURL(file);
    setShowAttachMenu(false);
  };

  const removeAttachment = (index) => {
    setPendingAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="p-3 md:p-4 bg-white dark:bg-[#0B0C0E] border-t border-slate-200 dark:border-[#23262D]">
      {/* Quote Reply Preview Strip */}
      {activeQuoteReply && (
        <div className="mb-2 p-2.5 rounded-xl bg-slate-100 dark:bg-[#181A20] border-l-4 border-blue-500 flex items-center justify-between text-xs animate-pop-in">
          <div className="flex items-center space-x-2 truncate">
            <CornerUpLeft className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
            <div className="truncate">
              <span className="font-semibold text-slate-900 dark:text-slate-100 mr-2">
                Replying to {activeQuoteReply.userName || 'message'}:
              </span>
              <span className="text-slate-500 dark:text-[#8F9CAE] truncate italic">
                {activeQuoteReply.content}
              </span>
            </div>
          </div>
          <button
            onClick={onClearQuoteReply}
            className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-[#23262D] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Pending Attachments Strip */}
      {pendingAttachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2 animate-pop-in">
          {pendingAttachments.map((att, idx) => (
            <div
              key={idx}
              className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-[#23262D] bg-slate-100 dark:bg-[#181A20] p-1.5 flex items-center space-x-2 pr-6"
            >
              {att.type === 'image' ? (
                <img src={att.url} alt="Thumbnail" className="w-8 h-8 rounded object-cover" />
              ) : (
                <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-white">
                  <Code className="w-4 h-4" />
                </div>
              )}
              <span className="text-xs truncate max-w-[140px] font-medium text-slate-700 dark:text-slate-200">
                {att.caption || (att.type === 'code' ? 'Code Snippet' : 'Image')}
              </span>
              <button
                onClick={() => removeAttachment(idx)}
                className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Composer Box */}
      <div className="relative rounded-2xl border border-slate-200 dark:border-[#23262D] bg-slate-50 dark:bg-[#121316] p-2 md:p-3 shadow-xs focus-within:border-blue-500/80 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all duration-150">
        <div className="flex items-end space-x-2">
          {/* Attachment button & menu */}
          <div className="relative" ref={attachMenuRef}>
            <button
              type="button"
              onClick={() => setShowAttachMenu(!showAttachMenu)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-[#181A20] transition duration-150"
              title="Attach media or code snippet"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Attach menu dropdown */}
            {showAttachMenu && (
              <div className="absolute bottom-12 left-0 w-48 bg-white dark:bg-[#181A20] border border-slate-200 dark:border-[#23262D] rounded-xl shadow-xl py-1.5 z-30 animate-pop-in text-xs font-medium text-slate-700 dark:text-slate-200">
                <label className="flex items-center space-x-2.5 px-3 py-2 hover:bg-slate-100 dark:hover:bg-[#23262D] cursor-pointer transition">
                  <ImageIcon className="w-4 h-4 text-blue-500" />
                  <span>Upload Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={addSampleImage}
                  className="w-full flex items-center space-x-2.5 px-3 py-2 hover:bg-slate-100 dark:hover:bg-[#23262D] text-left transition"
                >
                  <ImageIcon className="w-4 h-4 text-indigo-500" />
                  <span>Sample Mock Image</span>
                </button>
                <button
                  onClick={addSampleSnippet}
                  className="w-full flex items-center space-x-2.5 px-3 py-2 hover:bg-slate-100 dark:hover:bg-[#23262D] text-left transition"
                >
                  <Code className="w-4 h-4 text-emerald-500" />
                  <span>Insert Code Block</span>
                </button>
              </div>
            )}
          </div>

          {/* Auto-expanding textarea */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Write a message... (Enter to send, Shift+Enter for newline)"
            className="flex-grow bg-transparent text-[14.5px] leading-relaxed text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-[#8F9CAE] resize-none max-h-36 py-1.5 px-1 focus:outline-none"
          />

          {/* Emoji Picker Button & Flyout */}
          <div className="relative" ref={emojiPickerRef}>
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-[#181A20] transition duration-150"
              title="Add emoji"
            >
              <Smile className="w-4 h-4" />
            </button>

            {showEmojiPicker && (
              <div className="absolute bottom-12 right-0 bg-white dark:bg-[#181A20] border border-slate-200 dark:border-[#23262D] rounded-xl shadow-xl p-2 z-30 animate-pop-in grid grid-cols-4 gap-1 w-44">
                {EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      setText((prev) => prev + emoji);
                      setShowEmojiPicker(false);
                      textareaRef.current?.focus();
                    }}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-[#23262D] rounded-lg text-lg text-center hover:scale-110 transition"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Circular High-Contrast Send Button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!text.trim() && pendingAttachments.length === 0}
            className={`p-2.5 rounded-full flex-shrink-0 transition-all duration-150 active:scale-95 ${
              text.trim() || pendingAttachments.length > 0
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-blue-500/25'
                : 'bg-slate-200 dark:bg-[#23262D] text-slate-400 dark:text-slate-600 cursor-not-allowed'
            }`}
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
