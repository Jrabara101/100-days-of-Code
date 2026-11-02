import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { useTrustStore } from '../../context/TrustStoreContext';
import { StarRating } from '../common/StarRating';
import { useExifStripper } from '../../hooks/useExifStripper';
import { scanTextEntities } from '../../lib/trustEngine';

export function ReviewSubmissionModal({ isOpen, onClose }) {
  const { activeProduct, submitReview } = useTrustStore();
  const { sanitizeAndCompress, isProcessing: isScrubbingMedia } = useExifStripper();

  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const [reviewerLocation, setReviewerLocation] = useState('');
  const [selectedVariant, setSelectedVariant] = useState(
    activeProduct.variants ? activeProduct.variants[0]?.name : 'Standard'
  );

  // Dynamic dimensional slider scores
  const [dimensions, setDimensions] = useState({
    dim1: 5,
    dim2: 5,
    dim3: 5,
    sizingSlider: 0 // -2: Runs Small, 0: True to Size, +2: Runs Large
  });

  // Persona attributes
  const [persona, setPersona] = useState({
    height: "5'9\"",
    usualSize: 'M',
    experienceLevel: 'Daily Chemex Brewer'
  });

  // Uploaded media files
  const [sanitizedMedia, setSanitizedMedia] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const isApparel = activeProduct.category === 'apparel';

  // Smart Prompt Chips (Anti-Blank-Page Composer)
  const guidedTopics = useMemo(() => {
    if (isApparel) {
      return [
        { id: 'fit', label: 'How was the sizing and fit?', keywords: ['fit', 'size', 'sizing', 'small', 'large', 'true to size'] },
        { id: 'fabric', label: 'How does the fabric feel?', keywords: ['fabric', 'material', 'wool', 'soft', 'weight', 'gsm'] },
        { id: 'wash', label: 'Durability after wear?', keywords: ['wash', 'wear', 'stitch', 'seam', 'durable', 'tear'] },
        { id: 'color', label: 'Does the color match photos?', keywords: ['color', 'photos', 'shade', 'charcoal', 'navy'] }
      ];
    }
    return [
      { id: 'pour', label: 'How is the pour control?', keywords: ['pour', 'gooseneck', 'flow', 'spout', 'control', 'stream'] },
      { id: 'heat', label: 'Temperature hold & speed?', keywords: ['temp', 'temperature', 'heat', 'heats', 'hold', 'pid', 'fast'] },
      { id: 'craft', label: 'Build & ergonomic balance?', keywords: ['build', 'handle', 'balance', 'weight', 'finish', 'matte', 'craft'] },
      { id: 'unboxing', label: 'Unboxing condition & delivery?', keywords: ['box', 'unboxing', 'packaging', 'cardboard', 'delivery', 'arrived'] }
    ];
  }, [isApparel]);

  // Check which topics user has addressed in body
  const bodyLower = (body || '').toLowerCase();
  const addressedTopics = useMemo(() => {
    const addressed = {};
    guidedTopics.forEach(topic => {
      addressed[topic.id] = topic.keywords.some(kw => bodyLower.includes(kw));
    });
    return addressed;
  }, [guidedTopics, bodyLower]);

  // Live PII Detection warning
  const detectedEntities = useMemo(() => {
    return scanTextEntities(`${title} ${body}`);
  }, [title, body]);

  // Handle Photo Drop / Selection
  const handlePhotoSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    for (const file of files) {
      try {
        const info = await sanitizeAndCompress(file);
        setSanitizedMedia(prev => [...prev, info]);
      } catch (err) {
        console.error('Failed to process image:', err);
      }
    }
  };

  const removeMedia = (index) => {
    setSanitizedMedia(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      alert('Please provide a review title and comment.');
      return;
    }

    setIsSubmitting(true);

    const newReview = submitReview({
      productId: activeProduct.id,
      rating,
      title: title.trim(),
      body: body.trim(),
      variantTitle: selectedVariant,
      reviewerName: reviewerName.trim() || 'Dana K.',
      reviewerLocation: reviewerLocation.trim() || 'Austin, TX',
      reviewerAttributes: {
        ...persona,
        sizingScore: dimensions.sizingSlider
      },
      mediaFiles: sanitizedMedia
    });

    setIsSubmitting(false);

    // Fire celebration confetti!
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#006948', '#85f8c4', '#F59E0B', '#316bf3']
      });
    } catch {
      // Ignore if unavailable
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-surface-container-lowest rounded-2xl max-w-2xl w-full my-8 p-6 sm:p-8 shadow-2xl border border-outline-variant/40 relative flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-outline-variant/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[22px]">verified</span>
            </div>
            <div>
              <h2 className="font-headline-md text-headline-md font-bold text-on-surface">
                Submit a Verified Review
              </h2>
              <p className="font-body-sm text-outline">
                {activeProduct.title} · Cryptographic Delivery Audit #MKT-9042
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-outline hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* 1. Overall Star Rating */}
          <div className="flex flex-col gap-1.5 bg-surface-container-low p-4 rounded-xl border border-outline-variant/30">
            <span className="font-mono text-label-code-sm text-outline uppercase tracking-wider font-semibold">
              Overall Product Rating
            </span>
            <div className="flex items-center gap-4">
              <StarRating
                rating={rating}
                interactive={true}
                size={28}
                onChange={(newRating) => setRating(newRating)}
              />
              <span className="font-mono text-headline-md text-on-surface font-bold">
                {rating}.0 / 5.0
              </span>
            </div>
          </div>

          {/* 2. Category-Adaptive Dimensional Sliders */}
          <div className="flex flex-col gap-3 bg-surface-container-low p-4 rounded-xl border border-outline-variant/30">
            <span className="font-mono text-label-code-sm text-outline uppercase tracking-wider font-semibold">
              Dimensional Performance Vectors
            </span>

            {isApparel ? (
              <div className="flex flex-col gap-2">
                <div className="flex justify-between font-mono text-xs">
                  <span className="text-outline">Runs Small</span>
                  <span className="text-primary font-bold">
                    {dimensions.sizingSlider === 0
                      ? 'True to Size'
                      : dimensions.sizingSlider < 0
                      ? `Runs Small (${dimensions.sizingSlider})`
                      : `Runs Large (+${dimensions.sizingSlider})`}
                  </span>
                  <span className="text-outline">Runs Large</span>
                </div>
                <input
                  type="range"
                  min="-2"
                  max="2"
                  step="1"
                  value={dimensions.sizingSlider}
                  onChange={(e) =>
                    setDimensions({ ...dimensions, sizingSlider: parseInt(e.target.value) })
                  }
                  className="w-full accent-primary cursor-pointer"
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between font-mono text-xs">
                    <span>Pour Precision</span>
                    <span className="font-bold text-primary">{dimensions.dim1} / 5</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={dimensions.dim1}
                    onChange={(e) =>
                      setDimensions({ ...dimensions, dim1: parseInt(e.target.value) })
                    }
                    className="w-full accent-primary cursor-pointer"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between font-mono text-xs">
                    <span>Heat Retention</span>
                    <span className="font-bold text-primary">{dimensions.dim2} / 5</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={dimensions.dim2}
                    onChange={(e) =>
                      setDimensions({ ...dimensions, dim2: parseInt(e.target.value) })
                    }
                    className="w-full accent-primary cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 3. Review Title */}
          <div className="flex flex-col gap-1.5">
            <label className="font-headline-sm text-sm font-semibold text-on-surface">
              Review Title
            </label>
            <input
              type="text"
              placeholder="e.g. Pours like a dream, essential morning ritual"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-body-md focus:outline-none focus:border-primary shadow-xs"
              required
            />
          </div>

          {/* 4. Guided Smart Prompts (Anti-Blank-Page Composer) */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="font-headline-sm text-sm font-semibold text-on-surface">
                Detailed Experience
              </label>
              <span className="font-mono text-[11px] text-outline">
                Mention key points to illuminate chips
              </span>
            </div>

            {/* Smart Prompt Chips */}
            <div className="flex flex-wrap gap-2 mb-1">
              {guidedTopics.map((topic) => {
                const isAddressed = addressedTopics[topic.id];
                return (
                  <span
                    key={topic.id}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono transition-all border ${
                      isAddressed
                        ? 'bg-primary-fixed text-on-primary-fixed border-primary font-bold shadow-xs'
                        : 'bg-surface-container text-outline border-outline-variant/30'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {isAddressed ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                    <span>{topic.label}</span>
                  </span>
                );
              })}
            </div>

            <textarea
              rows={4}
              placeholder="Share honest feedback about build quality, performance, and everyday use..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full p-3 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-body-md focus:outline-none focus:border-primary shadow-xs resize-none"
              required
            />

            {/* Live PII / Privacy Shield Warning */}
            {detectedEntities.length > 0 && (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2 text-xs text-amber-900">
                <span className="material-symbols-outlined text-[16px] text-amber-700 mt-0.5">
                  privacy_tip
                </span>
                <div>
                  <strong className="font-semibold">Privacy auto-shield: </strong>
                  We detected sensitive contact or health tokens ({detectedEntities.map(e => e.label).join(', ')}). Our moderation engine will mask them to protect your identity while preserving your feedback!
                </div>
              </div>
            )}
          </div>

          {/* 5. Client-Side EXIF GPS Stripping Dropzone */}
          <div className="flex flex-col gap-2">
            <label className="font-headline-sm text-sm font-semibold text-on-surface flex items-center justify-between">
              <span>Customer Photos (Privacy Protected)</span>
              <span className="font-mono text-[11px] text-primary font-medium flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">shield</span>
                <span>Automatic GPS &amp; EXIF Stripping</span>
              </span>
            </label>

            <div className="border-2 border-dashed border-outline-variant/50 hover:border-primary rounded-xl p-4 text-center bg-surface-container-low transition-colors relative cursor-pointer">
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoSelect}
                className="absolute inset-0 opacity-0 cursor-pointer"
                disabled={isScrubbingMedia}
              />
              <div className="flex flex-col items-center justify-center gap-1.5 pointer-events-none">
                <span className="material-symbols-outlined text-[28px] text-outline">
                  add_photo_alternate
                </span>
                <span className="font-headline-sm text-sm font-medium text-on-surface">
                  {isScrubbingMedia ? 'Scrubbing GPS metadata & compressing...' : 'Drop customer photos or click to browse'}
                </span>
                <span className="font-mono text-xs text-outline">
                  EXIF GPS coordinates removed in browser before WebP conversion
                </span>
              </div>
            </div>

            {/* Uploaded Thumbnails Preview */}
            {sanitizedMedia.length > 0 && (
              <div className="flex flex-wrap gap-3 pt-2">
                {sanitizedMedia.map((m, idx) => (
                  <div
                    key={idx}
                    className="relative w-20 h-20 rounded-lg overflow-hidden bg-surface-container border border-outline-variant/30 group shadow-xs"
                  >
                    <img src={m.previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeMedia(idx)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-error"
                    >
                      <span className="material-symbols-outlined text-[12px]">close</span>
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[8px] font-mono text-white text-center py-0.5 truncate px-1">
                      -{m.reductionPercent}% (Clean)
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 6. Reviewer Identity Context */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-mono text-xs text-outline font-semibold">Your Name or Alias</label>
              <input
                type="text"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                placeholder="e.g. Dana K."
                className="px-3 py-1.5 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-body-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-mono text-xs text-outline font-semibold">Location</label>
              <input
                type="text"
                value={reviewerLocation}
                onChange={(e) => setReviewerLocation(e.target.value)}
                placeholder="e.g. Austin, TX"
                className="px-3 py-1.5 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-body-sm focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/20">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg font-headline-sm text-sm text-on-surface-variant hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-primary hover:bg-primary-container text-white font-headline-sm text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">verified</span>
              <span>Publish Verified Review</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

