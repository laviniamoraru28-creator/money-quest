"use client";

import { useState } from "react";

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
}

/**
 * A simple 1-5 star picker. Deliberately large touch targets (the
 * whole star, not just its glyph) since this is meant to work well on
 * a tablet, per the redesign brief's emphasis on tablet use. Keyboard-
 * operable via native radio inputs rather than click-only divs, so a
 * parent using keyboard navigation isn't excluded from leaving
 * feedback.
 */
export function StarRating({ value, onChange, label }: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const displayValue = hoverValue ?? value;

  return (
    <fieldset>
      <legend className="text-base font-medium">{label}</legend>
      <div className="mt-2xs flex gap-2xs" onMouseLeave={() => setHoverValue(null)}>
        {[1, 2, 3, 4, 5].map((star) => (
          <label
            key={star}
            className="grid h-touch-min-child w-touch-min-child cursor-pointer place-items-center rounded-md text-3xl hover:bg-gold/10"
            onMouseEnter={() => setHoverValue(star)}
          >
            <input
              type="radio"
              name="star-rating"
              value={star}
              checked={value === star}
              onChange={() => onChange(star)}
              className="sr-only"
            />
            <span aria-hidden="true">{star <= displayValue ? "★" : "☆"}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
