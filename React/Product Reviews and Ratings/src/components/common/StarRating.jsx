import React from 'react';

/**
 * StarRating
 * Precision star indicator following Hollis Trust DESIGN.md.
 * Active fill #F59E0B, inactive track #E2E8F0.
 */
export function StarRating({
  rating = 5,
  maxStars = 5,
  size = 16,
  interactive = false,
  onChange = null,
  showNumeric = false
}) {
  const stars = [];

  for (let i = 1; i <= maxStars; i++) {
    const isFull = rating >= i;
    const isHalf = !isFull && rating >= i - 0.5;

    stars.push(
      <button
        key={i}
        type="button"
        disabled={!interactive}
        onClick={() => interactive && onChange && onChange(i)}
        className={`inline-flex items-center justify-center p-0.5 ${
          interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'
        }`}
        title={`${rating} out of ${maxStars} stars`}
      >
        {isFull ? (
          <span
            className="material-symbols-outlined fill-1"
            style={{ fontSize: `${size}px`, color: '#F59E0B' }}
          >
            star
          </span>
        ) : isHalf ? (
          <span
            className="material-symbols-outlined fill-1"
            style={{ fontSize: `${size}px`, color: '#F59E0B' }}
          >
            star_half
          </span>
        ) : (
          <span
            className="material-symbols-outlined fill-1"
            style={{ fontSize: `${size}px`, color: '#E4E3DB' }}
          >
            star
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="inline-flex items-center gap-0.5 select-none">
      <div className="flex items-center">{stars}</div>
      {showNumeric && (
        <span className="font-mono text-label-code-sm font-semibold text-on-surface ml-1.5">
          {Number(rating).toFixed(1)}
        </span>
      )}
    </div>
  );
}

