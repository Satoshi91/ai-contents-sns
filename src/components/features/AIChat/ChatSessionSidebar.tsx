'use client';

import React, { useState } from 'react';
import { ChatSession } from '@/types/chat';
import { ChatSessionItem } from './ChatSessionItem';
import { Plus, Search, RefreshCw, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ChatSessionSidebarProps {
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  isLoading: boolean;
  onCreateSession: () => Promise<void>;
  onSelectSession: (sessionId: string) => void;
  onUpdateSessionTitle: (sessionId: string, title: string) => Promise<boolean>;
  onDeleteSession: (sessionId: string) => Promise<boolean>;
  onRefresh: () => Promise<void>;
  
  // モバイル対応
  isMobileOpen?: boolean;
  onMobileToggle?: () => void;
}

export function ChatSessionSidebar({
  sessions,
  currentSession,
  isLoading,
  onCreateSession,
  onSelectSession,
  onUpdateSessionTitle,
  onDeleteSession,
  onRefresh,
  isMobileOpen = false,
  onMobileToggle
}: ChatSessionSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 検索フィルタリング
  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (session.lastMessage && session.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setIsRefreshing(false);
  };

  const sidebarContent = (
    <div className="h-full flex flex-col">
      {/* ヘッダー */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">チャット履歴</h2>
          
          {/* モバイル用の閉じるボタン */}
          {onMobileToggle && (
            <button
              onClick={onMobileToggle}
              className="lg:hidden p-1 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <X size={20} className="text-gray-500" />
            </button>
          )}
        </div>
        
        {/* 新規チャットボタン */}
        <Button
          onClick={() => onCreateSession()}
          className="w-full mb-3 flex items-center space-x-2 cursor-pointer hover:bg-blue-600 transition-colors duration-200"
          size="sm"
        >
          <Plus size={16} />
          新しいチャット
        </Button>
        
        {/* 検索バー */}
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="チャットを検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        {/* 更新ボタン */}
        <div className="mt-2 flex justify-end">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors duration-200 disabled:opacity-50"
            title="リストを更新"
          >
            <RefreshCw
              size={14}
              className={`text-gray-500 ${isRefreshing ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
      </div>
      
      {/* セッションリスト */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, index) => (
              <div
                key={index}
                className="animate-pulse p-3 rounded-lg bg-gray-50"
              >
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="p-4 text-center">
            {searchQuery ? (
              <div className="text-gray-500">
                <Search size={24} className="mx-auto mb-2 text-gray-400" />
                <p className="text-sm">「{searchQuery}」に一致するチャットが見つかりません</p>
              </div>
            ) : (
              <div className="text-gray-500">
                <Plus size={24} className="mx-auto mb-2 text-gray-400" />
                <p className="text-sm">まだチャットがありません</p>
                <p className="text-xs mt-1">「新しいチャット」ボタンで開始しましょう</p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredSessions.map((session) => (
              <ChatSessionItem
                key={session.id}
                session={session}
                isSelected={currentSession?.id === session.id}
                onSelect={onSelectSession}
                onUpdateTitle={onUpdateSessionTitle}
                onDelete={onDeleteSession}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* フッター情報 */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500 text-center">
          {sessions.length > 0 && (
            <span>{sessions.length}件のチャット</span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* デスクトップ版サイドバー */}
      <div className="hidden lg:block w-80 bg-white border-r border-gray-200 h-full">
        {sidebarContent}
      </div>
      
      {/* モバイル版オーバーレイ */}
      {isMobileOpen && (
        <>
          {/* 背景オーバーレイ */}
          <div
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={onMobileToggle}
          />
          
          {/* サイドバー */}
          <div className="lg:hidden fixed left-0 top-0 w-80 h-full bg-white z-50 transform transition-transform duration-300">
            {sidebarContent}
          </div>
        </>
      )}
      
      {/* モバイル版メニューボタン */}
      {onMobileToggle && (
        <button
          onClick={onMobileToggle}
          className="lg:hidden fixed top-4 left-4 z-30 p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
        >
          <Menu size={20} className="text-gray-600" />
        </button>
      )}
    </>
  );
}