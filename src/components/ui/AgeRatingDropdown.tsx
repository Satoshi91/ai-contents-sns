'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { AgeFilter } from '@/lib/contexts/AgeRatingContext';

interface AgeRatingOption {
  value: AgeFilter;
  label: string;
  description: string;
}

const AGE_RATING_OPTIONS: AgeRatingOption[] = [
  {
    value: 'all',
    label: '全年齢',
    description: 'R-18作品を非表示'
  },
  {
    value: 'r18-allowed',
    label: 'R-18可',
    description: '全ての作品を表示'
  },
  {
    value: 'r18-only',
    label: 'R-18のみ',
    description: 'R-18作品のみ表示'
  }
];

interface AgeRatingDropdownProps {
  value: AgeFilter;
  onChange: (value: AgeFilter) => void;
  className?: string;
}

export function AgeRatingDropdown({ 
  value, 
  onChange, 
  className = '' 
}: AgeRatingDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const selectedOption = AGE_RATING_OPTIONS.find(option => option.value === value) || AGE_RATING_OPTIONS[0];

  // 外側クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option: AgeRatingOption) => {
    onChange(option.value);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* ドロップダウンボタン */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center justify-between px-3 py-2 text-sm font-medium
          bg-white border border-gray-300 rounded-lg shadow-sm
          hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          transition-colors duration-200 cursor-pointer min-w-[100px]
          ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}
        `}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="text-gray-700">
          {selectedOption.label}
        </span>
        <ChevronDown 
          size={16} 
          className={`ml-2 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'transform rotate-180' : ''
          }`} 
        />
      </button>

      {/* ドロップダウンメニュー */}
      {isOpen && (
        <div className="absolute top-full mt-1 w-full min-w-[180px] bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <ul className="py-1" role="listbox">
            {AGE_RATING_OPTIONS.map((option) => (
              <li key={option.value} role="option">
                <button
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={`
                    w-full text-left px-4 py-2 text-sm hover:bg-gray-100 
                    transition-colors duration-200 cursor-pointer
                    ${option.value === value ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}
                  `}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{option.label}</span>
                    <span className="text-xs text-gray-500 mt-0.5">
                      {option.description}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}