import React, { useState } from 'react';
import { Camera, Image as ImageIcon, Heart, MessageSquare, Sparkles, Upload, Send, Pin } from 'lucide-react';

export function PolaroidToastWall({
  event,
  currentGuest,
  polaroids,
  toasts,
  onAddPolaroid,
  onAddToast,
  onCheersToast
}) {
  const [activeTab, setActiveTab] = useState('polaroids');
  const [newToastText, setNewToastText] = useState('');
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadChapter, setUploadChapter] = useState('Ceremony');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const eventPolaroids = polaroids.filter(p => !p.archetype || p.archetype === event.id);
  const eventToasts = toasts.filter(t => !t.archetype || t.archetype === event.id);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadPolaroid = (e) => {
    e.preventDefault();
    if (!previewImage) return;

    onAddPolaroid({
      imageUrl: previewImage,
      caption: uploadCaption || 'Celebration candid snapshot',
      chapter: uploadChapter,
      author: currentGuest.primaryName,
      timeAgo: 'Just now',
      rotation: `${(Math.random() * 6 - 3).toFixed(1)}deg`,
      likes: 1
    });

    setPreviewImage(null);
    setUploadCaption('');
    setShowUploadModal(false);
  };

  const handleSendToast = (e) => {
    e.preventDefault();
    if (!newToastText.trim()) return;

    onAddToast({
      author: currentGuest.primaryName,
      avatar: currentGuest.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      message: newToastText.trim(),
      timestamp: 'Just now',
      cheers: 1
    });

    setNewToastText('');
  };

  return (
    <section id="memory-vault" className="w-full mt-14 pt-8 border-t border-theme-border">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-theme-gold font-semibold mb-1">
            <Camera className="w-3.5 h-3.5" />
            <span>Digital Disposable Camera & Toast Wall</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif text-theme-primary font-normal">
            Candid Keepsake Roll & Loving Words
          </h2>
          <p className="text-xs sm:text-sm text-theme-secondary max-w-xl mt-1">
            No polished corporate filters—just raw, joyful snapshots and warm toasts pinned in real time as the evening unfolds.
          </p>
        </div>

        {/* Tab & Action Controls */}
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-full border border-theme-border bg-theme-inset flex items-center">
            <button
              onClick={() => setActiveTab('polaroids')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                activeTab === 'polaroids'
                  ? 'bg-theme-card text-theme-primary shadow-sm font-semibold'
                  : 'text-theme-muted hover:text-theme-primary'
              }`}
            >
              Polaroid Roll ({eventPolaroids.length})
            </button>
            <button
              onClick={() => setActiveTab('toasts')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                activeTab === 'toasts'
                  ? 'bg-theme-card text-theme-primary shadow-sm font-semibold'
                  : 'text-theme-muted hover:text-theme-primary'
              }`}
            >
              Toast Wall ({eventToasts.length})
            </button>
          </div>

          {activeTab === 'polaroids' ? (
            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-theme-accent text-white text-xs font-medium hover:brightness-110 transition shadow-sm"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Drop Photo</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* POLAROID CORKBOARD VIEW */}
      {activeTab === 'polaroids' ? (
        <div className="p-6 sm:p-10 rounded-3xl bg-[#E8DFC8] dark:bg-[#1E1924] border-2 border-[#D8CBB2] dark:border-white/10 shadow-inner grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 relative overflow-hidden">
          
          {eventPolaroids.map((item, idx) => (
            <div
              key={item.id || idx}
              style={{ transform: `rotate(${item.rotation || '0deg'})` }}
              className="group relative bg-[#FAF7F2] text-neutral-900 p-3 pb-5 rounded shadow-xl border border-neutral-300 transition-all duration-300 hover:scale-105 hover:z-20 hover:shadow-2xl"
            >
              {/* Decorative Thumbtack / Pin */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-600 shadow-md border border-white flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-red-200"></div>
              </div>

              {/* Photo Box */}
              <div className="w-full aspect-square bg-neutral-900 overflow-hidden rounded-sm relative">
                <img
                  src={item.imageUrl}
                  alt={item.caption}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Chapter Tag Badge */}
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-md text-white text-[9px] font-mono tracking-wider uppercase">
                  {item.chapter}
                </div>
              </div>

              {/* Handwritten Style Caption */}
              <div className="mt-3 px-1 text-center font-serif text-sm text-neutral-800 leading-snug">
                "{item.caption}"
              </div>

              {/* Polaroids Meta: Author & Time */}
              <div className="mt-2 pt-2 border-t border-neutral-200 flex items-center justify-between text-[10px] font-mono text-neutral-500">
                <span>By {item.author}</span>
                <span>{item.timeAgo}</span>
              </div>
            </div>
          ))}

        </div>
      ) : (
        /* TOAST WALL VIEW */
        <div className="space-y-4">
          
          {/* Quick Toast Composer */}
          <form onSubmit={handleSendToast} className="p-4 rounded-2xl bg-theme-card border border-theme-border shadow-sm flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              required
              placeholder="Write a warm toast, memory, or congratulatory message..."
              value={newToastText}
              onChange={(e) => setNewToastText(e.target.value)}
              className="flex-1 px-4 py-2 rounded-xl border border-theme-border bg-theme-inset text-xs text-theme-primary focus:outline-none focus:ring-1 focus:ring-theme-foil"
            />
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-theme-accent text-white text-xs font-semibold hover:brightness-110 transition flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Raise Toast</span>
            </button>
          </form>

          {/* Toast Feed */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {eventToasts.map((toast, tIdx) => (
              <div
                key={toast.id || tIdx}
                className="p-5 rounded-2xl bg-theme-card border border-theme-border shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src={toast.avatar}
                      alt={toast.author}
                      className="w-10 h-10 rounded-full object-cover border border-theme-border"
                    />
                    <div>
                      <div className="font-serif font-semibold text-theme-primary text-sm">
                        {toast.author}
                      </div>
                      <div className="text-[10px] text-theme-muted font-mono">
                        {toast.timestamp}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-theme-secondary font-serif italic leading-relaxed">
                    "{toast.message}"
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-theme-border flex items-center justify-end">
                  <button
                    onClick={() => onCheersToast(toast.id)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-theme-border bg-theme-inset hover:bg-theme-card text-xs text-theme-primary transition active:scale-95"
                  >
                    <span>🥂 Cheers</span>
                    <span className="font-mono font-bold text-theme-accent">{toast.cheers || 1}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* Upload Polaroid Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-theme-card border border-theme-foil p-6 sm:p-8 shadow-2xl relative">
            <h3 className="text-xl font-serif font-bold text-theme-primary mb-2">
              Drop a Candid Memory
            </h3>
            <p className="text-xs text-theme-secondary mb-4">
              Select any photo from your device to pin it to our live celebration corkboard!
            </p>

            <form onSubmit={handleUploadPolaroid} className="space-y-4">
              {/* File input */}
              <div className="p-4 rounded-2xl border-2 border-dashed border-theme-border bg-theme-inset flex flex-col items-center justify-center text-center cursor-pointer">
                {previewImage ? (
                  <img src={previewImage} alt="Preview" className="w-40 h-40 object-cover rounded-xl mb-2 shadow" />
                ) : (
                  <ImageIcon className="w-10 h-10 text-theme-muted mb-2" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  required
                  onChange={handleImageSelect}
                  className="text-xs text-theme-muted file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-theme-accent file:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-theme-muted uppercase mb-1">
                  Caption / Moment Note:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Toasting the sunset with the best crew!"
                  value={uploadCaption}
                  onChange={(e) => setUploadCaption(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-theme-border bg-theme-inset text-theme-primary text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-theme-muted uppercase mb-1">
                  Timeline Chapter Tag:
                </label>
                <select
                  value={uploadChapter}
                  onChange={(e) => setUploadChapter(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-theme-border bg-theme-inset text-theme-primary text-xs"
                >
                  <option value="Arrival Champagne">Arrival Champagne</option>
                  <option value="Ceremony">Ceremony Vows</option>
                  <option value="Sunset Cocktails">Sunset Cocktails</option>
                  <option value="Courtyard Dinner">Courtyard Dinner</option>
                  <option value="Dancefloor & Afterparty">Dancefloor & Afterparty</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-theme-border">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl border border-theme-border text-xs text-theme-muted hover:text-theme-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!previewImage}
                  className="px-5 py-2 rounded-xl bg-theme-accent disabled:opacity-50 text-white font-medium text-xs hover:brightness-110"
                >
                  Pin to Board
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </section>
  );
}

