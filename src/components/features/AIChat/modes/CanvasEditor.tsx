'use client';

import React, { useEffect, useRef } from 'react';

interface CanvasEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  disabled?: boolean;
  fontSize?: number;
}

export function CanvasEditor({ 
  content, 
  onChange, 
  placeholder = 'AIとの会話でここにテキストが生成されます...',
  disabled = false,
  fontSize = 14
}: CanvasEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 自動高さ調整
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [content]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  // 行数とカーソル位置の取得
  const getCurrentLineNumber = () => {
    const textarea = textareaRef.current;
    if (!textarea) return 1;
    
    const cursorPosition = textarea.selectionStart;
    const textBeforeCursor = textarea.value.substring(0, cursorPosition);
    return textBeforeCursor.split('\n').length;
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* エディタヘッダー */}
      <div className="border-b border-gray-200 p-2 bg-gray-50 text-xs text-gray-500 flex justify-between">
        <span>Canvas Editor</span>
        <div className="flex space-x-4">
          <span>行: {getCurrentLineNumber()}</span>
          <span>文字数: {content.length}</span>
          <span>単語数: {content.trim().split(/\s+/).filter(word => word.length > 0).length}</span>
        </div>
      </div>

      {/* メインエディタ */}
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full h-full p-4 border-0 resize-none outline-none
            font-mono leading-relaxed
            ${disabled ? 'bg-gray-50 text-gray-500' : 'bg-white text-gray-900'}
            scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100
          `}
          style={{ 
            fontSize: `${fontSize}px`,
            minHeight: '100%',
            lineHeight: 1.6
          }}
          spellCheck={false}
        />
        
        {/* 更新インジケータ */}
        {disabled && (
          <div className="absolute top-2 right-2">
            <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse" title="AIが更新中..." />
          </div>
        )}
      </div>

      {/* フッター（統計情報） */}
      <div className="border-t border-gray-200 p-2 bg-gray-50 text-xs text-gray-500">
        <div className="flex justify-between items-center">
          <div className="flex space-x-4">
            <span>改行: {content.split('\n').length}行</span>
            <span>段落: {content.split('\n\n').filter(p => p.trim().length > 0).length}</span>
          </div>
          <div>
            {content.length > 0 ? (
              <span className="text-green-600">編集中</span>
            ) : (
              <span className="text-gray-400">空</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}