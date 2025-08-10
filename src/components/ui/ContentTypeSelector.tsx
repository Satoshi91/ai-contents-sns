'use client';

import { ContentType } from '@/types/content';

interface ContentTypeSelectorProps {
  selectedType: ContentType | 'mixed';
  onTypeChange: (type: ContentType | 'mixed') => void;
  disabled?: boolean;
}

const contentTypeOptions = [
  { value: 'voice' as const, label: 'ボイス', description: '音声ファイル単体の投稿' },
  { value: 'script' as const, label: 'スクリプト', description: 'テキスト台本の投稿' },
  { value: 'image' as const, label: 'イラスト', description: '画像単体の投稿' },
  { value: 'mixed' as const, label: '複合作品', description: '音声・画像・台本を組み合わせた作品' },
];

export function ContentTypeSelector({ selectedType, onTypeChange, disabled = false }: ContentTypeSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        コンテンツタイプ <span className="text-red-500">*</span>
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {contentTypeOptions.map(({ value, label, description }) => (
          <label
            key={value}
            className={`
              flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all duration-200
              ${selectedType === value 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-25'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <div className="flex items-center mb-2">
              <input
                type="radio"
                name="contentType"
                value={value}
                checked={selectedType === value}
                onChange={(e) => onTypeChange(e.target.value as ContentType)}
                disabled={disabled}
                className="mr-3 text-blue-600 focus:ring-blue-500"
              />
              <span className="font-medium text-gray-900">{label}</span>
            </div>
            <p className="text-sm text-gray-600 ml-6">{description}</p>
          </label>
        ))}
      </div>
    </div>
  );
}