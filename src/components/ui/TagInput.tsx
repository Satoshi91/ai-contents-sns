'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { X, Plus } from 'lucide-react';

interface TagInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  maxTagLength?: number;
  className?: string;
}

export function TagInput({
  tags,
  onTagsChange,
  placeholder = 'タグを入力してEnterで追加',
  maxTags = 10,
  maxTagLength = 20,
  className = ''
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  const normalizeTag = (tag: string): string => {
    return tag.trim().toLowerCase();
  };

  const validateTag = (tag: string): string | null => {
    if (tag.length === 0) {
      return 'タグは1文字以上である必要があります';
    }
    if (tag.length > maxTagLength) {
      return `タグは${maxTagLength}文字以内である必要があります`;
    }
    if (!/^[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u3005\u3006\u30FC\uFF21-\uFF3A\uFF41-\uFF5Aa-zA-Z0-9！？。、・（）「」【】〜～\s_-]+$/.test(tag)) {
      return '使用できない文字が含まれています（#@<>など特殊記号は使用不可）';
    }
    return null;
  };

  const addTag = (tagInput: string) => {
    const normalizedTag = normalizeTag(tagInput);
    
    if (!normalizedTag) {
      setError('タグを入力してください');
      return;
    }

    if (tags.length >= maxTags) {
      setError(`タグは最大${maxTags}個まで設定できます`);
      return;
    }

    const validationError = validateTag(normalizedTag);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (tags.includes(normalizedTag)) {
      setError('重複するタグは設定できません');
      return;
    }

    onTagsChange([...tags, normalizedTag]);
    setInputValue('');
    setError('');
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
    setError('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    if (error) setError('');
  };

  const handleAddClick = () => {
    addTag(inputValue);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* タグリスト */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag) => (
            <div
              key={tag}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm border border-blue-200"
            >
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="cursor-pointer hover:bg-blue-200 rounded-full p-0.5 transition-colors duration-200"
                aria-label={`タグ「${tag}」を削除`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 入力フィールド */}
      <div className="flex gap-2">
        <div className="flex-1">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            maxLength={maxTagLength}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={tags.length >= maxTags}
          />
        </div>
        <button
          type="button"
          onClick={handleAddClick}
          disabled={!inputValue.trim() || tags.length >= maxTags}
          className="cursor-pointer px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          追加
        </button>
      </div>

      {/* 情報表示 */}
      <div className="flex justify-between text-sm text-gray-500">
        <span>{tags.length} / {maxTags} タグ</span>
        <span>{inputValue.length} / {maxTagLength} 文字</span>
      </div>

      {/* エラーメッセージ */}
      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
}