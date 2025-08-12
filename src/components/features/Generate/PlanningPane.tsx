'use client';

import React from 'react';
import { TagInput } from '@/components/ui/TagInput';
import { CharacterManager } from './CharacterManager';

interface Character {
  id: string;
  name: string;
  age?: string;
  occupation?: string;
  personality?: string;
  description?: string;
}

interface PlanningPaneProps {
  title: string;
  tags: string[];
  summary: string;
  characters: Character[];
  notes: string;
  onTitleChange: (value: string) => void;
  onTagsChange: (value: string[]) => void;
  onSummaryChange: (value: string) => void;
  onCharactersChange: (value: Character[]) => void;
  onNotesChange: (value: string) => void;
}

export function PlanningPane({
  title,
  tags,
  summary,
  characters,
  notes,
  onTitleChange,
  onTagsChange,
  onSummaryChange,
  onCharactersChange,
  onNotesChange
}: PlanningPaneProps) {
  return (
    <div className="h-full flex flex-col">
      {/* 企画フォーム */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* 作品タイトル */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            作品タイトル
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="作品のタイトルを入力してください"
          />
        </div>

        {/* タグ入力 */}
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
          />
          <p className="text-xs text-gray-500 mt-1">
            タグを追加すると作品の発見性が向上します
          </p>
        </div>

        {/* あらすじ・概要 */}
        <div>
          <label htmlFor="summary" className="block text-sm font-medium text-gray-700 mb-2">
            あらすじ・概要
          </label>
          <textarea
            id="summary"
            value={summary}
            onChange={(e) => onSummaryChange(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="作品のあらすじや概要を入力してください"
          />
          <div className="text-xs text-gray-500 mt-1">
            {summary.length} 文字
          </div>
        </div>

        {/* キャラクター設定 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            キャラクター設定
          </label>
          <CharacterManager
            characters={characters}
            onCharactersChange={onCharactersChange}
          />
        </div>

        {/* 企画メモ */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
            企画メモ
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="制作メモやアイデアを自由に記入してください"
          />
          <div className="text-xs text-gray-500 mt-1">
            {notes.length} 文字
          </div>
        </div>
      </div>

      {/* 統計情報 */}
      <div className="border-t bg-gray-50 p-3">
        <div className="grid grid-cols-4 gap-3 text-center text-sm">
          <div>
            <div className="text-xs text-gray-500">タグ</div>
            <div className="font-medium text-gray-700">{tags.length}個</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">概要</div>
            <div className="font-medium text-gray-700">{summary.length}字</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">キャラ</div>
            <div className="font-medium text-gray-700">{characters.length}人</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">メモ</div>
            <div className="font-medium text-gray-700">{notes.length}字</div>
          </div>
        </div>
      </div>
    </div>
  );
}