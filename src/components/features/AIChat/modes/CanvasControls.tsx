'use client';

import React, { useState } from 'react';
import { Save, Download, Trash2, FileText, Type, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface CanvasControlsProps {
  title: string;
  onTitleChange: (title: string) => void;
  onSave: () => void;
  onClear: () => void;
  onExport: (format: 'txt' | 'json' | 'ssml') => void;
  wordCount: number;
  characterCount: number;
  lastSaved?: Date | null;
  isDirty?: boolean;
  isLoading?: boolean;
}

export function CanvasControls({
  title,
  onTitleChange,
  onSave,
  onClear,
  onExport,
  wordCount,
  characterCount,
  lastSaved,
  isDirty = false,
  isLoading = false
}: CanvasControlsProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const handleTitleSubmit = () => {
    onTitleChange(tempTitle.trim() || '無題のドキュメント');
    setIsEditingTitle(false);
  };

  const handleTitleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSubmit();
    } else if (e.key === 'Escape') {
      setTempTitle(title);
      setIsEditingTitle(false);
    }
  };

  const formatLastSaved = (date: Date | null) => {
    if (!date) return '未保存';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return '今保存';
    if (minutes < 60) return `${minutes}分前`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}時間前`;
    return date.toLocaleDateString('ja-JP');
  };

  return (
    <div className="border-b border-gray-200 bg-white">
      {/* タイトル行 */}
      <div className="px-4 py-3 border-b border-gray-100">
        {isEditingTitle ? (
          <input
            type="text"
            value={tempTitle}
            onChange={(e) => setTempTitle(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={handleTitleKeyPress}
            className="text-lg font-semibold text-gray-900 bg-transparent border-0 outline-none w-full focus:bg-gray-50 px-2 py-1 rounded"
            autoFocus
            maxLength={100}
          />
        ) : (
          <h2
            onClick={() => setIsEditingTitle(true)}
            className="text-lg font-semibold text-gray-900 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors duration-200"
            title="クリックで編集"
          >
            {title}
            {isDirty && <span className="text-orange-500 ml-1">●</span>}
          </h2>
        )}
      </div>

      {/* コントロールボタン */}
      <div className="px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* 保存ボタン */}
          <Button
            onClick={onSave}
            disabled={!isDirty || isLoading}
            size="sm"
            variant={isDirty ? "primary" : "secondary"}
            className="cursor-pointer hover:bg-blue-600 transition-colors duration-200 flex items-center space-x-1"
          >
            <Save size={14} />
            <span>{isLoading ? '保存中...' : '保存'}</span>
          </Button>

          {/* エクスポートボタン */}
          <div className="relative">
            <Button
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              size="sm"
              variant="secondary"
              className="cursor-pointer hover:bg-gray-100 transition-colors duration-200 flex items-center space-x-1"
              disabled={characterCount === 0}
            >
              <Download size={14} />
              <span>エクスポート</span>
            </Button>

            {/* エクスポートメニュー */}
            {exportMenuOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-32">
                <button
                  onClick={() => {
                    onExport('txt');
                    setExportMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2 cursor-pointer transition-colors duration-200"
                >
                  <FileText size={14} />
                  <span>テキスト (.txt)</span>
                </button>
                <button
                  onClick={() => {
                    onExport('ssml');
                    setExportMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2 cursor-pointer transition-colors duration-200"
                >
                  <Type size={14} />
                  <span>SSML (.xml)</span>
                </button>
                <button
                  onClick={() => {
                    onExport('json');
                    setExportMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2 cursor-pointer transition-colors duration-200"
                >
                  <FileText size={14} />
                  <span>JSON (.json)</span>
                </button>
              </div>
            )}
          </div>

          {/* クリアボタン */}
          <Button
            onClick={() => {
              if (confirm('Canvas の内容をすべて削除しますか？この操作は取り消せません。')) {
                onClear();
              }
            }}
            size="sm"
            variant="secondary"
            className="cursor-pointer hover:bg-red-50 hover:text-red-600 transition-colors duration-200 flex items-center space-x-1"
            disabled={characterCount === 0}
          >
            <Trash2 size={14} />
            <span>クリア</span>
          </Button>
        </div>

        {/* 統計情報 */}
        <div className="flex items-center space-x-4 text-xs text-gray-500">
          <span>{wordCount} 単語</span>
          <span>{characterCount} 文字</span>
          <div className="flex items-center space-x-1">
            <RotateCcw size={12} />
            <span>{formatLastSaved(lastSaved)}</span>
          </div>
        </div>
      </div>

      {/* クリック外してメニューを閉じる */}
      {exportMenuOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setExportMenuOpen(false)}
        />
      )}
    </div>
  );
}