import React, { useState, useEffect } from 'react';
import { MapPin, KeyRound, Camera, Check, X, Shield } from 'lucide-react';

export function AddressPinModal({ isOpen, onClose, addressInfo = {}, onSave }) {
  const [address, setAddress] = useState(addressInfo?.address || '742 Evergreen Ter, Apt 4B');
  const [neighborhood, setNeighborhood] = useState(addressInfo?.neighborhood || 'Mission District, San Francisco');
  const [gateCode, setGateCode] = useState(addressInfo?.gate_code || '1492#');
  const [instructions, setInstructions] = useState(
    addressInfo?.instructions || 'Leave at front porch door on blue wooden bench. Do not ring bell (baby sleeping).'
  );
  const [referencePhoto, setReferencePhoto] = useState(
    addressInfo?.porch_reference_photo || 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80'
  );
  const [isSavedToast, setIsSavedToast] = useState(false);

  useEffect(() => {
    if (addressInfo && isOpen) {
      if (addressInfo.address) setAddress(addressInfo.address);
      if (addressInfo.neighborhood) setNeighborhood(addressInfo.neighborhood);
      if (addressInfo.gate_code !== undefined) setGateCode(addressInfo.gate_code);
      if (addressInfo.instructions) setInstructions(addressInfo.instructions);
      if (addressInfo.porch_reference_photo) setReferencePhoto(addressInfo.porch_reference_photo);
    }
  }, [addressInfo, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      address,
      neighborhood,
      gate_code: gateCode,
      instructions,
      porch_reference_photo: referencePhoto
    });
    setIsSavedToast(true);
    setTimeout(() => {
      setIsSavedToast(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-[var(--bg-elevated)] border border-[var(--border-hairline)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-hairline)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-[var(--text-primary)]">
                Precision Drop-Off Pin & Gate Vault
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Prevents lost couriers and guarantees contactless delivery accuracy
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Address */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
              Street Address & Unit
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
              placeholder="e.g. 742 Evergreen Ter, Apt 4B"
            />
          </div>

          {/* Gate Code Vault */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                Encrypted Gate / Callbox Code
              </label>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1">
                <Shield className="w-3 h-3" /> Encrypted Vault
              </span>
            </div>
            <input
              type="text"
              value={gateCode}
              onChange={(e) => setGateCode(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] text-sm font-mono text-[var(--text-primary)] focus:outline-none focus:border-rose-500"
              placeholder="e.g. 1492# or Call Apt 4B"
            />
          </div>

          {/* Drop-off instructions */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
              Exact Drop-Off Instructions
            </label>
            <textarea
              rows={2}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-rose-500"
              placeholder="e.g. Leave at front porch door on blue wooden bench..."
            />
          </div>

          {/* Reference Photo */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                <Camera className="w-3.5 h-3.5 text-blue-500" />
                Porch / Entrance Reference Photo
              </label>
              <span className="text-[11px] text-[var(--text-muted)]">Courier sees this on arrival</span>
            </div>
            <div className="flex items-center gap-4">
              <img
                src={referencePhoto}
                alt="Porch reference"
                className="w-20 h-20 rounded-2xl object-cover border-2 border-rose-500/40 shadow-sm"
              />
              <div className="flex-1 text-xs text-[var(--text-muted)] space-y-1.5">
                <p>Having a reference photo cuts drop-off hesitation by 94%.</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setReferencePhoto('https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80')}
                    className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-[var(--bg-surface)] border border-[var(--border-hairline)] hover:border-rose-500 text-[var(--text-primary)]"
                  >
                    Porch Bench
                  </button>
                  <button
                    type="button"
                    onClick={() => setReferencePhoto('https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=600&q=80')}
                    className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-[var(--bg-surface)] border border-[var(--border-hairline)] hover:border-rose-500 text-[var(--text-primary)]"
                  >
                    Lobby Callbox
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[var(--bg-surface)] border-t border-[var(--border-hairline)] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm shadow-md transition-all active:scale-[0.98]"
          >
            <Check className="w-4 h-4" />
            {isSavedToast ? 'Saved!' : 'Save Drop-Off Pin'}
          </button>
        </div>
      </div>
    </div>
  );
}
