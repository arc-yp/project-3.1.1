import React from "react";
import { Check, Sparkles } from "lucide-react";

interface ServiceSelectorProps {
  services: string[];
  selectedServices: string[];
  onSelectionChange: (services: string[]) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ServiceSelector: React.FC<ServiceSelectorProps> = ({
  services,
  selectedServices,
  onSelectionChange,
  className = "",
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',      // smaller padding and font
    md: 'px-3 py-1.5 text-xs',    // moderate padding and font
    lg: 'px-4 py-2 text-xs'     // keep large as is
  };

  const handleServiceToggle = (service: string) => {
    if (selectedServices.includes(service)) {
      onSelectionChange([]);
    } else {
      onSelectionChange([service]);
    }
  };

  const isSelected = (service: string) => selectedServices.includes(service);

  if (services.length === 0) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700 flex items-center">
          <Sparkles className="w-4 h-4 mr-2 text-purple-600" />
          Select Services to Highlight
        </label>
        {selectedServices.length > 0 && (
          <div className="flex items-center text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
            <Check className="w-3 h-3 mr-1" />
            {selectedServices.length} selected
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {services.map((service, index) => (
          <button
            key={service}
            type="button"
            onClick={() => handleServiceToggle(service)}
            className={`
              ${sizeClasses[size]}
              rounded-full font-medium transition-all duration-200
              border-2 whitespace-nowrap
              ${isSelected(service)
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-transparent shadow-lg transform scale-105'
                : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
              }
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              active:transform active:scale-95
            `}
            aria-pressed={isSelected(service)}
            role="radio"
          >
            {service}
          </button>
        ))}
      </div>
    </div>
  );
};
