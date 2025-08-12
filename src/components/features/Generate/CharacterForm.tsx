'use client';

import React from 'react';
import { X } from 'lucide-react';

interface Character {
  id: string;
  name: string;
  age?: string;
  occupation?: string;
  personality?: string;
  description?: string;
}

interface CharacterFormProps {
  character: Character;
  onCharacterChange: (character: Character) => void;
  onRemove: () => void;
  canRemove: boolean;
  index: number;
}

export function CharacterForm({
  character,
  onCharacterChange,
  onRemove,
  canRemove,
  index
}: CharacterFormProps) {
  const handleFieldChange = (field: keyof Character, value: string) => {
    onCharacterChange({
      ...character,
      [field]: value
    });
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-4 bg-gray-50">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">
          キャラクター {index + 1}
        </h4>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="cursor-pointer p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors duration-200"
            title="このキャラクターを削除"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* キャラクター名 */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">
          名前 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={character.name}
          onChange={(e) => handleFieldChange('name', e.target.value)}
          placeholder="キャラクター名を入力"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          maxLength={50}
        />
      </div>

      {/* 年齢・職業を横並び */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            年齢
          </label>
          <input
            type="text"
            value={character.age || ''}
            onChange={(e) => handleFieldChange('age', e.target.value)}
            placeholder="例：28歳"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={20}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            職業
          </label>
          <input
            type="text"
            value={character.occupation || ''}
            onChange={(e) => handleFieldChange('occupation', e.target.value)}
            placeholder="例：会社員"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={50}
          />
        </div>
      </div>

      {/* 性格 */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">
          性格・特徴
        </label>
        <input
          type="text"
          value={character.personality || ''}
          onChange={(e) => handleFieldChange('personality', e.target.value)}
          placeholder="例：明るく積極的、責任感が強い"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          maxLength={100}
        />
      </div>

      {/* 詳細説明 */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">
          詳細説明
        </label>
        <textarea
          value={character.description || ''}
          onChange={(e) => handleFieldChange('description', e.target.value)}
          placeholder="その他の詳細情報や背景設定を入力..."
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows={3}
          maxLength={500}
        />
        <div className="text-xs text-gray-500 mt-1">
          {(character.description || '').length}/500文字
        </div>
      </div>
    </div>
  );
}