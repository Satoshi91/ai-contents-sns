'use client';

import React, { useState } from 'react';
import { ChatSession } from '@/types/chat';
import { MessageCircle, Edit2, Trash2, Check, X } from 'lucide-react';

interface ChatSessionItemProps {
  session: ChatSession;
  isSelected: boolean;
  onSelect: (sessionId: string) => void;
  onUpdateTitle: (sessionId: string, title: string) => Promise<boolean>;
  onDelete: (sessionId: string) => Promise<boolean>;
}

export function ChatSessionItem({
  session,
  isSelected,
  onSelect,
  onUpdateTitle,
  onDelete
}: ChatSessionItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(session.title);
  const [isDeleting, setIsDeleting] = useState(false);

  // 日時フォーマット関数
  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return '今';
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}分前`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)}時間前`;
    } else if (diffInSeconds < 2592000) {
      return `${Math.floor(diffInSeconds / 86400)}日前`;
    } else {
      return date.toLocaleDateString('ja-JP', {
        month: 'numeric',
        day: 'numeric'
      });
    }
  };

  const handleSaveTitle = async () => {
    const trimmedTitle = editTitle.trim();
    if (!trimmedTitle || trimmedTitle === session.title) {
      setIsEditing(false);
      setEditTitle(session.title);
      return;
    }

    const success = await onUpdateTitle(session.id, trimmedTitle);
    if (success) {
      setIsEditing(false);
    } else {
      setEditTitle(session.title);
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditTitle(session.title);
  };

  const handleDelete = async () => {
    if (window.confirm('このチャットセッションを削除しますか？この操作は取り消せません。')) {
      setIsDeleting(true);
      const success = await onDelete(session.id);
      setIsDeleting(false);
      
      if (!success) {
        alert('セッションの削除に失敗しました。');
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  return (
    <div
      className={`group relative p-3 rounded-lg cursor-pointer transition-all duration-200 ${
        isSelected
          ? 'bg-blue-50 border border-blue-200'
          : 'hover:bg-gray-50 border border-transparent'
      } ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
      onClick={() => !isEditing && !isDeleting && onSelect(session.id)}
    >
      {/* メインコンテンツ */}
      <div className="flex items-start space-x-3">
        {/* アイコン */}
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
            isSelected ? 'bg-blue-100' : 'bg-gray-100'
          }`}
        >
          <MessageCircle
            size={16}
            className={isSelected ? 'text-blue-600' : 'text-gray-500'}
          />
        </div>

        {/* コンテンツエリア */}
        <div className="flex-1 min-w-0">
          {/* タイトル編集 */}
          {isEditing ? (
            <div className="mb-1">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyPress={handleKeyPress}
                onBlur={handleSaveTitle}
                className="w-full text-sm font-medium bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={50}
                autoFocus
              />
            </div>
          ) : (
            <h4
              className={`text-sm font-medium truncate mb-1 ${
                isSelected ? 'text-blue-900' : 'text-gray-900'
              }`}
            >
              {session.title}
            </h4>
          )}

          {/* 最終メッセージとメタ情報 */}
          <div className="space-y-1">
            {session.lastMessage && (
              <p className="text-xs text-gray-500 truncate">
                {session.lastMessage}
              </p>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">
                {formatDate(session.updatedAt)}
              </span>
              <span className="text-xs text-gray-400">
                {session.messageCount}件
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 編集・削除ボタン */}
      {!isEditing && (
        <div
          className={`absolute top-2 right-2 flex space-x-1 ${
            isSelected ? 'opacity-70' : 'opacity-0 group-hover:opacity-70'
          } transition-opacity duration-200`}
        >
          {/* 編集中の操作ボタン */}
          {isEditing ? (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSaveTitle();
                }}
                className="w-6 h-6 rounded flex items-center justify-center bg-green-100 hover:bg-green-200 text-green-600 transition-colors duration-200"
                title="保存"
              >
                <Check size={12} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCancelEdit();
                }}
                className="w-6 h-6 rounded flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors duration-200"
                title="キャンセル"
              >
                <X size={12} />
              </button>
            </>
          ) : (
            <>
              {/* 編集ボタン */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                className="w-6 h-6 rounded flex items-center justify-center bg-white hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors duration-200 shadow-sm"
                title="タイトルを編集"
              >
                <Edit2 size={12} />
              </button>
              
              {/* 削除ボタン */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                className="w-6 h-6 rounded flex items-center justify-center bg-white hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors duration-200 shadow-sm"
                title="セッションを削除"
                disabled={isDeleting}
              >
                <Trash2 size={12} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}