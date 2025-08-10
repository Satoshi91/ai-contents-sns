'use client';

import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { TagInput } from '@/components/ui/TagInput';
import { AgeRatingToggle } from '@/components/ui/AgeRatingToggle';
import { Button } from '@/components/ui/Button';

interface ScriptContentFormProps {
  title: string;
  description: string;
  scriptText: string;
  tags: string[];
  ageRating: 'all' | '18+';
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  onScriptTextChange: (scriptText: string) => void;
  onTagsChange: (tags: string[]) => void;
  onAgeRatingChange: (rating: 'all' | '18+') => void;
  disabled?: boolean;
}

export function ScriptContentForm({
  title,
  description,
  scriptText,
  tags,
  ageRating,
  onTitleChange,
  onDescriptionChange,
  onScriptTextChange,
  onTagsChange,
  onAgeRatingChange,
  disabled = false
}: ScriptContentFormProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* 左側: メタデータ */}
      <div className="space-y-6">
        {/* タイトル */}
        <div>
          <label htmlFor="script-title" className="block text-sm font-medium text-gray-700 mb-2">
            タイトル <span className="text-red-500">*</span>
          </label>
          <Input
            id="script-title"
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="スクリプトのタイトルを入力してください"
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
          <label htmlFor="script-description" className="block text-sm font-medium text-gray-700 mb-2">
            説明
          </label>
          <TextArea
            id="script-description"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="スクリプトの内容やあらすじを入力してください..."
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
            placeholder="タグを入力してEnterで追加（例：恋愛、SF、コメディ）"
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

      {/* 右側: スクリプトテキスト */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label htmlFor="script-text" className="block text-sm font-medium text-gray-700">
            スクリプト <span className="text-red-500">*</span>
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onScriptTextChange('')}
            disabled={!scriptText || disabled}
            className="text-xs px-2 py-1"
          >
            クリア
          </Button>
        </div>
        <TextArea
          id="script-text"
          value={scriptText}
          onChange={(e) => onScriptTextChange(e.target.value)}
          placeholder="スクリプトの内容を入力してください..."
          rows={18}
          maxLength={50000}
          disabled={disabled}
          className="w-full resize-y"
        />
        <p className="text-xs text-gray-500 mt-1">
          {scriptText.length}/50000文字
        </p>
      </div>
    </div>
  );
}