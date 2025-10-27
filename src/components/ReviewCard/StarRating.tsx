import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
}

export const StarRating: React.FC<StarRatingProps> = ({ 
  rating, 
  onRatingChange, 
  size = 'md',
  interactive = true 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const isSelectable = star === 1 || star === 2 || star === 3 || star === 4 || star === 5;
        return (
          <button
            key={star}
            type="button"
            onClick={() => interactive && isSelectable && onRatingChange(star)}
            disabled={!interactive || !isSelectable}
            className={`${sizeClasses[size]} transition-all duration-200 ${
              interactive && isSelectable ? 'hover:scale-110 cursor-pointer' : 'cursor-default opacity-60'
            }`}
            aria-label={isSelectable ? `Select ${star} star` : `Not selectable`}
          >
            <Star
              className={`w-full h-full transition-colors duration-200 ${
                star <= rating
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-400'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
};