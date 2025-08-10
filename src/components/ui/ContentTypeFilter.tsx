'use client';

import { ContentType } from '@/types/content';
import { Mic, FileText, Image, Play, Grid3X3 } from 'lucide-react';

interface ContentTypeFilterProps {
  selectedType?: ContentType | 'all';
  onTypeChange: (type: ContentType | 'all') => void;
  className?: string;
}

const filterOptions = [
  { 
    value: 'all' as const, 
    label: 'すべて', 
    icon: Grid3X3,
    description: '全てのコンテンツ' 
  },
  { 
    value: 'voice' as const, 
    label: 'ボイス', 
    icon: Mic,
    description: '音声コンテンツ' 
  },
  { 
    value: 'script' as const, 
    label: 'スクリプト', 
    icon: FileText,
    description: 'テキストコンテンツ' 
  },
  { 
    value: 'image' as const, 
    label: 'イラスト', 
    icon: Image,
    description: '画像コンテンツ' 
  },
  { 
    value: 'work' as const, 
    label: '作品', 
    icon: Play,
    description: '複合コンテンツ' 
  },
];

export function ContentTypeFilter({ 
  selectedType = 'all', 
  onTypeChange, 
  className = '' 
}: ContentTypeFilterProps) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
      <h3 className="text-sm font-medium text-gray-900 mb-3">コンテンツタイプ</h3>
      
      <div className="space-y-1">
        {filterOptions.map(({ value, label, icon: Icon, description }) => (
          <button
            key={value}
            onClick={() => onTypeChange(value)}
            className={`
              w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left
              transition-all duration-200 cursor-pointer
              ${selectedType === value
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }
            `}
          >
            <Icon 
              size={18} 
              className={`
                flex-shrink-0
                ${selectedType === value ? 'text-blue-600' : 'text-gray-500'}
              `} 
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">{label}</div>
              <div className="text-xs text-gray-500 truncate">
                {description}
              </div>
            </div>
            {selectedType === value && (
              <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}