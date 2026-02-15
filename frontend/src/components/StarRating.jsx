import { useState } from 'react';
import './StarRating.css';

export function StarRatingDisplay({ averageRating, ratingCount }) {
  const value = Number(averageRating) || 0;
  const full = Math.floor(value);
  const half = value % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;

  return (
    <div className="star-rating-display" aria-label={`Rating: ${value} out of 5`}>
      {[...Array(full)].map((_, i) => <span key={'f' + i} className="star star-full">★</span>)}
      {half ? <span className="star star-half">★</span> : null}
      {[...Array(empty)].map((_, i) => <span key={'e' + i} className="star star-empty">★</span>)}
      {ratingCount != null && ratingCount > 0 && (
        <span className="star-rating-count">({ratingCount})</span>
      )}
    </div>
  );
}

export function StarRatingInput({ value, onChange, disabled }) {
  const [hover, setHover] = useState(0);
  const current = hover || value || 0;

  return (
    <div className="star-rating-input">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`star star-input ${star <= current ? 'star-full' : 'star-empty'}`}
          onClick={() => !disabled && onChange?.(star)}
          onMouseEnter={() => !disabled && setHover(star)}
          onMouseLeave={() => setHover(0)}
          disabled={disabled}
          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
