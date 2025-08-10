'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { TagInput } from '@/components/ui/TagInput';
import { AgeRatingToggle } from '@/components/ui/AgeRatingToggle';
import { RelatedContentSelector } from '@/components/ui/RelatedContentSelector';

interface WorkContentFormProps {
  title: string;
  description: string;
  tags: string[];
  relatedContentIds: string[];
  ageRating: 'all' | '18+';
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  onTagsChange: (tags: string[]) => void;
  onRelatedContentIdsChange: (contentIds: string[]) => void;
  onAgeRatingChange: (rating: 'all' | '18+') => void;
  disabled?: boolean;
  userId?: string;
}

export function WorkContentForm({
  title,
  description,
  tags,
  relatedContentIds,
  ageRating,
  onTitleChange,
  onDescriptionChange,
  onTagsChange,
  onRelatedContentIdsChange,
  onAgeRatingChange,
  disabled = false,
  userId
}: WorkContentFormProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* 左側: メタデータ */}
      <div className="space-y-6">
        {/* タイトル */}
        <div>
          <label htmlFor="work-title" className="block text-sm font-medium text-gray-700 mb-2">
            作品タイトル <span className="text-red-500">*</span>
          </label>
          <Input
            id="work-title"
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="作品のタイトルを入力してください"
            maxLength={100}
            disabled={disabled}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            {title.length}/100文字
          </p>
        </div>

        {/* 説明 */}
        <div>
          <label htmlFor="work-description" className="block text-sm font-medium text-gray-700 mb-2">
            作品説明
          </label>
          <TextArea
            id="work-description"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="作品の概要や見どころを入力してください..."
            rows={6}
            maxLength={1000}
            disabled={disabled}
            className="w-full resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            {description.length}/1000文字
          </p>
        </div>

        {/* タグ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            タグ
          </label>
          <TagInput
            tags={tags}
            onTagsChange={onTagsChange}
            placeholder="タグを入力してEnterで追加（例：ドラマ、恋愛、コメディ）"
            maxTags={10}
            maxTagLength={20}
            disabled={disabled}
          />
          <div className="space-y-1 mt-1">
            <p className="text-xs text-gray-500">
              タグを追加すると作品の発見性が向上します
            </p>
          </div>
        </div>

        {/* 年齢制限 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            年齢制限
          </label>
          <AgeRatingToggle
            rating={ageRating}
            onRatingChange={onAgeRatingChange}
            disabled={disabled}
          />
          <p className="text-xs text-gray-500 mt-1">
            作品の年齢制限を設定してください
          </p>
        </div>
      </div>

      {/* 右側: 関連コンテンツ選択 */}
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            関連コンテンツ <span className="text-red-500">*</span>
          </label>
          <RelatedContentSelector
            selectedContentIds={relatedContentIds}
            onSelectionChange={onRelatedContentIdsChange}
            userId={userId}
            disabled={disabled}
          />
          <p className="text-xs text-gray-500 mt-2">
            この作品に含める既存のコンテンツ（ボイス、スクリプト、イラスト）を選択してください
          </p>
        </div>
      </div>
    </div>
  );
}