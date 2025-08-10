'use client';

import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { TagInput } from '@/components/ui/TagInput';
import { ImageFileUpload } from '@/components/features/ImageFileUpload';
import { AgeRatingToggle } from '@/components/ui/AgeRatingToggle';

interface ImageContentFormProps {
  title: string;
  description: string;
  tags: string[];
  imageUrl: string;
  imageId: string;
  ageRating: 'all' | '18+';
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  onTagsChange: (tags: string[]) => void;
  onImageUpload: (url: string, id: string) => void;
  onImageDelete: () => void;
  onAgeRatingChange: (rating: 'all' | '18+') => void;
  disabled?: boolean;
  workId?: string;
}

export function ImageContentForm({
  title,
  description,
  tags,
  imageUrl,
  imageId,
  ageRating,
  onTitleChange,
  onDescriptionChange,
  onTagsChange,
  onImageUpload,
  onImageDelete,
  onAgeRatingChange,
  disabled = false,
  workId
}: ImageContentFormProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* 左側: 画像 */}
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            画像 <span className="text-red-500">*</span>
          </label>
          <ImageFileUpload
            onImageUpload={onImageUpload}
            onImageDelete={onImageDelete}
            currentImageUrl={imageUrl}
            disabled={disabled}
            workId={workId}
          />
        </div>
      </div>

      {/* 右側: メタデータ */}
      <div className="space-y-6">
        {/* タイトル */}
        <div>
          <label htmlFor="image-title" className="block text-sm font-medium text-gray-700 mb-2">
            タイトル <span className="text-red-500">*</span>
          </label>
          <Input
            id="image-title"
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="イラストのタイトルを入力してください"
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
          <label htmlFor="image-description" className="block text-sm font-medium text-gray-700 mb-2">
            説明
          </label>
          <TextArea
            id="image-description"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="イラストの内容や制作背景を入力してください..."
            rows={8}
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
            placeholder="タグを入力してEnterで追加（例：オリジナル、風景、キャラクター）"
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
            コンテンツの年齢制限を設定してください
          </p>
        </div>
      </div>
    </div>
  );
}