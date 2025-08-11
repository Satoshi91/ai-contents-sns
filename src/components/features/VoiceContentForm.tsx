'use client';

import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { TagInput } from '@/components/ui/TagInput';
import { AudioFileUpload } from '@/components/features/AudioFileUpload';
import { AgeRatingToggle } from '@/components/ui/AgeRatingToggle';
import { PublishStatus } from '@/types/work';

interface VoiceContentFormProps {
  title: string;
  description: string;
  tags: string[];
  audioUrl: string;
  audioId: string;
  audioOriginalFilename: string;
  ageRating: 'all' | '18+';
  publishStatus: PublishStatus;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  onTagsChange: (tags: string[]) => void;
  onAudioUpload: (url: string, id: string, filename?: string) => void;
  onAudioDelete: () => void;
  onAgeRatingChange: (rating: 'all' | '18+') => void;
  onPublishStatusChange: (status: PublishStatus) => void;
  disabled?: boolean;
  workId?: string;
}

export function VoiceContentForm({
  title,
  description,
  tags,
  audioUrl,
  audioId,
  audioOriginalFilename,
  ageRating,
  publishStatus,
  onTitleChange,
  onDescriptionChange,
  onTagsChange,
  onAudioUpload,
  onAudioDelete,
  onAgeRatingChange,
  onPublishStatusChange,
  disabled = false,
  workId
}: VoiceContentFormProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* 左側: 音声ファイル */}
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            音声ファイル <span className="text-red-500">*</span>
          </label>
          <AudioFileUpload
            onAudioUpload={onAudioUpload}
            onAudioDelete={onAudioDelete}
            currentAudioUrl={audioUrl}
            currentAudioOriginalFilename={audioOriginalFilename}
            disabled={disabled}
            workId={workId}
          />
        </div>
      </div>

      {/* 右側: メタデータ */}
      <div className="space-y-6">
        {/* タイトル */}
        <div>
          <label htmlFor="voice-title" className="block text-sm font-medium text-gray-700 mb-2">
            タイトル <span className="text-red-500">*</span>
          </label>
          <Input
            id="voice-title"
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="ボイスのタイトルを入力してください"
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
          <label htmlFor="voice-description" className="block text-sm font-medium text-gray-700 mb-2">
            説明
          </label>
          <TextArea
            id="voice-description"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="ボイスの内容や背景を入力してください..."
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
            placeholder="タグを入力してEnterで追加（例：ASMR、癒し、朗読）"
            maxTags={10}
            maxTagLength={20}
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
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => onAgeRatingChange('all')}
              className={`px-3 py-1 rounded-md text-sm ${ageRating === 'all' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700'
              }`}
              disabled={disabled}
            >
              全年齢
            </button>
            <button
              type="button"
              onClick={() => onAgeRatingChange('18+')}
              className={`px-3 py-1 rounded-md text-sm ${ageRating === '18+' 
                ? 'bg-red-500 text-white' 
                : 'bg-gray-200 text-gray-700'
              }`}
              disabled={disabled}
            >
              18+
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            コンテンツの年齢制限を設定してください
          </p>
        </div>

        {/* 公開設定 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            公開設定
          </label>
          <div className="flex gap-6">
            <label className="flex items-center cursor-pointer hover:bg-gray-50 transition-colors duration-200 p-2 rounded">
              <input
                type="radio"
                name="publishStatus"
                value="public"
                checked={publishStatus === 'public'}
                onChange={(e) => onPublishStatusChange(e.target.value as PublishStatus)}
                disabled={disabled}
                className="mr-2 text-blue-600"
              />
              <span className="text-sm text-gray-700">公開</span>
            </label>
            <label className="flex items-center cursor-pointer hover:bg-gray-50 transition-colors duration-200 p-2 rounded">
              <input
                type="radio"
                name="publishStatus"
                value="private"
                checked={publishStatus === 'private'}
                onChange={(e) => onPublishStatusChange(e.target.value as PublishStatus)}
                disabled={disabled}
                className="mr-2 text-blue-600"
              />
              <span className="text-sm text-gray-700">非公開</span>
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            公開: みんなに表示されます / 非公開: 自分だけが確認できます
          </p>
        </div>
      </div>
    </div>
  );
}