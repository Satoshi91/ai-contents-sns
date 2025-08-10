'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useChat } from 'ai/react';
import { Send, Bot } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ChatMessage } from '@/components/features/AIChat/ChatMessage';
import { ChatSessionSidebar } from '@/components/features/AIChat/ChatSessionSidebar';
import { useChatHistory } from '@/lib/hooks/useChatHistory';
import { useAuth } from '@/lib/hooks/useAuth';
import toast from 'react-hot-toast';

export default function ChatPage() {
  const { user } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // チャット履歴管理
  const {
    sessions,
    currentSession,
    isLoadingSessions,
    isLoadingMessages,
    messages: historyMessages,
    createNewSession,
    selectSession,
    updateSessionTitle,
    removeSession,
    saveMessage,
    refreshSessions,
    clearCurrentSession
  } = useChatHistory();
  
  // AI チャット機能
  const { 
    messages: aiMessages, 
    input, 
    handleInputChange, 
    handleSubmit: originalHandleSubmit, 
    isLoading,
    error,
    reload,
    stop,
    setMessages: setAiMessages
  } = useChat({
    api: '/api/chat',
    initialMessages: [],
    onError: (error) => {
      console.error('Chat error:', error);
      toast.error('チャットでエラーが発生しました');
    },
    onFinish: async (message) => {
      // AIの返答をFirestoreに保存
      if (currentSession?.id) {
        await saveMessage('assistant', message.content);
      }
    }
  });

  // セッションが変更された時にAIチャットのメッセージを同期
  useEffect(() => {
    if (historyMessages.length > 0) {
      // チャット履歴からAIチャット用のメッセージ形式に変換
      const aiFormattedMessages = historyMessages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: msg.createdAt
      }));
      setAiMessages(aiFormattedMessages);
    } else {
      setAiMessages([]);
    }
  }, [historyMessages, setAiMessages]);
  
  // メッセージが追加された時に自動スクロール
  useEffect(() => {
    scrollToBottom();
  }, [aiMessages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // セッション作成
  const handleCreateSession = async () => {
    if (!user?.uid) {
      toast.error('ログインが必要です');
      return;
    }
    
    const sessionId = await createNewSession();
    if (sessionId) {
      await selectSession(sessionId);
      toast.success('新しいチャットを作成しました');
    } else {
      toast.error('チャットの作成に失敗しました');
    }
  };
  
  // セッション選択
  const handleSelectSession = async (sessionId: string) => {
    await selectSession(sessionId);
    setIsMobileSidebarOpen(false); // モバイルでは選択後にサイドバーを閉じる
  };
  
  // セッションタイトル更新
  const handleUpdateSessionTitle = async (sessionId: string, title: string): Promise<boolean> => {
    const success = await updateSessionTitle(sessionId, title);
    if (success) {
      toast.success('タイトルを更新しました');
    } else {
      toast.error('タイトルの更新に失敗しました');
    }
    return success;
  };
  
  // セッション削除
  const handleDeleteSession = async (sessionId: string): Promise<boolean> => {
    const success = await removeSession(sessionId);
    if (success) {
      toast.success('チャットを削除しました');
    } else {
      toast.error('チャットの削除に失敗しました');
    }
    return success;
  };
  
  // カスタムハンドルサブミット（メッセージをFirestoreに保存）
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentSession?.id) {
      // セッションがない場合は新規作成
      const sessionId = await createNewSession('新しいチャット', input.trim());
      if (!sessionId) {
        toast.error('チャットセッションの作成に失敗しました');
        return;
      }
      await selectSession(sessionId);
    }
    
    // ユーザーメッセージをFirestoreに保存
    if (currentSession?.id) {
      await saveMessage('user', input.trim());
    }
    
    // AI チャット処理を実行
    originalHandleSubmit(e);
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  
  // ローディング中の表示
  if (!user) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-2rem)]">
        <div className="text-center">
          <Bot className="text-gray-300 mb-4 mx-auto" size={64} />
          <p className="text-gray-500">ログインが必要です</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-2rem)] flex bg-gray-50">
      {/* サイドバー */}
      <ChatSessionSidebar
        sessions={sessions}
        currentSession={currentSession}
        isLoading={isLoadingSessions}
        onCreateSession={handleCreateSession}
        onSelectSession={handleSelectSession}
        onUpdateSessionTitle={handleUpdateSessionTitle}
        onDeleteSession={handleDeleteSession}
        onRefresh={refreshSessions}
        isMobileOpen={isMobileSidebarOpen}
        onMobileToggle={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      />
      
      {/* メインチャットエリア */}
      <div className="flex-1 flex flex-col">
        {/* ヘッダー */}
        <div className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bot className="text-blue-500" size={28} />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {currentSession?.title || 'AIチャット'}
                </h1>
                <p className="text-sm text-gray-500">作品制作をサポートします</p>
              </div>
            </div>
            
            {/* セッション情報 */}
            {currentSession && (
              <div className="text-right">
                <p className="text-xs text-gray-500">
                  {currentSession.messageCount}件のメッセージ
                </p>
                <p className="text-xs text-gray-400">
                  {currentSession.updatedAt.toLocaleDateString('ja-JP')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* メッセージエリア */}
        <div className="flex-1 overflow-y-auto p-6" style={{ paddingBottom: '80px' }}>
          {/* エラー表示 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-600 text-sm">エラーが発生しました: {error.message}</p>
              <Button 
                onClick={reload} 
                variant="secondary" 
                size="sm" 
                className="mt-2 cursor-pointer hover:bg-red-100 transition-colors duration-200"
              >
                再試行
              </Button>
            </div>
          )}

          {/* ローディング表示 */}
          {isLoadingMessages && (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          )}

          {/* メッセージ表示 */}
          {!isLoadingMessages && (
            <>
              {aiMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Bot className="text-gray-300 mb-4" size={64} />
                  <h2 className="text-lg font-medium text-gray-600 mb-2">
                    {currentSession ? currentSession.title : 'AIチャットへようこそ'}
                  </h2>
                  <p className="text-sm text-gray-500 max-w-md">
                    作品のアイデア出しや、台本の改善案など、創作活動に関する質問をお気軽にどうぞ。
                  </p>
                  {!currentSession && (
                    <Button
                      onClick={handleCreateSession}
                      className="mt-4 cursor-pointer hover:bg-blue-600 transition-colors duration-200"
                    >
                      新しいチャットを開始
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {aiMessages.map((message) => (
                    <ChatMessage key={message.id} message={message} />
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                          <Bot size={18} className="text-gray-600" />
                        </div>
                        <div className="bg-white px-4 py-2 rounded-lg shadow-sm">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </>
          )}
        </div>

        {/* 入力エリア */}
        <div className="bg-white border-t px-6 py-4">
          <form onSubmit={handleSubmit} className="flex space-x-3">
            <textarea
              value={input}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="メッセージを入力してください..."
              className="flex-1 resize-none rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              disabled={isLoading}
            />
            <Button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="cursor-pointer hover:bg-blue-600 transition-colors duration-200"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send size={20} />
              )}
            </Button>
            {isLoading && (
              <Button
                type="button"
                onClick={stop}
                variant="secondary"
                className="cursor-pointer hover:bg-gray-100 transition-colors duration-200"
              >
                停止
              </Button>
            )}
          </form>
          <p className="mt-2 text-xs text-gray-500">
            Shift + Enter で改行、Enter で送信
          </p>
        </div>
      </div>
    </div>
  );
}