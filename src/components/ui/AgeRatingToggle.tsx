'use client';

import { useState, useEffect } from 'react';

interface AgeRatingToggleProps {
  value?: boolean;
  onChange?: (showR18: boolean) => void;
  className?: string;
}

export function AgeRatingToggle({ 
  value = false, 
  onChange,
  className = ''
}: AgeRatingToggleProps) {
  const [showR18, setShowR18] = useState(value);

  useEffect(() => {
    setShowR18(value);
  }, [value]);

  const handleToggle = () => {
    const newValue = !showR18;
    setShowR18(newValue);
    onChange?.(newValue);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`
        relative inline-flex items-center h-7 rounded-full w-20 
        transition-colors duration-200 focus:outline-none focus:ring-2 
        focus:ring-blue-500 focus:ring-offset-2 cursor-pointer
        ${showR18 ? 'bg-pink-400' : 'bg-gray-300'}
        ${className}
      `}
      aria-label={showR18 ? 'R-18モード' : '全年齢モード'}
    >
      <span className="sr-only">年齢制限切り替え</span>
      
      {/* スライドする円 */}
      <span
        className={`
          inline-block w-5 h-5 transform transition-transform duration-200 
          bg-white rounded-full shadow-md
          ${showR18 ? 'translate-x-12' : 'translate-x-1'}
        `}
      />
      
      {/* ラベルテキスト */}
      <span className={`
        absolute text-xs font-medium pointer-events-none
        ${showR18 ? 'left-2 text-white' : 'right-2 text-gray-700'}
      `}>
        {showR18 ? 'R-18' : '全年齢'}
      </span>
    </button>
  );
}