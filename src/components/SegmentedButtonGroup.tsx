import React from 'react';

interface SegmentedButtonGroupProps {
  options: string[];
  selected: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const SegmentedButtonGroup: React.FC<SegmentedButtonGroupProps> = ({
  options,
  selected,
  onChange,
  multiple = false,
  className = '',
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-3.5 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base'
  };

  const handleClick = (option: string) => {
    if (multiple) {
      const selectedArray = Array.isArray(selected) ? selected : [];
      if (selectedArray.includes(option)) {
        onChange(selectedArray.filter(item => item !== option));
      } else {
        onChange([...selectedArray, option]);
      }
    } else {
      onChange(selected === option ? '' : option);
    }
  };

  const isSelected = (option: string) => {
    if (multiple) {
      return Array.isArray(selected) && selected.includes(option);
    }
    return selected === option;
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => handleClick(option)}
          className={`
            ${sizeClasses[size]}
            rounded-full font-medium transition-colors duration-150
            border whitespace-nowrap select-none
            ${isSelected(option)
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-white text-neutral-700 border-neutral-300 hover:border-blue-400 hover:bg-blue-50'
            }
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
            active:bg-blue-600/90
          `}
          aria-pressed={isSelected(option)}
          role={multiple ? 'checkbox' : 'radio'}
        >
          {option}
        </button>
      ))}
    </div>
  );
};