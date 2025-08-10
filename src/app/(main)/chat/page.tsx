'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useChat } from 'ai/react';
import { Send, Bot, MessageCircle, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ChatMessage } from '@/components/features/AIChat/ChatMessage';
import { ChatSessionSidebar } from '@/components/features/AIChat/ChatSessionSidebar';
import { CanvasMode } from '@/components/features/AIChat/modes/CanvasMode';
import { useChatHistory } from '@/lib/hooks/useChatHistory';
import { useAuth } from '@/lib/hooks/useAuth';
import toast from 'react-hot-toast';

type ChatMode = 'normal' | 'canvas';

export default function ChatPage() {
  const { user } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [currentMode, setCurrentMode] = useState<ChatMode>('normal');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // チャット履歴管理（ログイン済みユーザーのみ）
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
    refreshSessions
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
      // ログイン済みユーザーのみFirestoreに保存
      if (user && currentSession?.id) {
        await saveMessage('assistant', message.content);
      }
    }
  });

  // ログイン済みユーザーのみセッションからメッセージを同期
  useEffect(() => {
    if (user) {
      if (historyMessages.length > 0) {
        // ログイン済みユーザー：チャット履歴からAIチャット用のメッセージ形式に変換
        const aiFormattedMessages = historyMessages.map(msg => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content,
          createdAt: msg.createdAt
        }));
        setAiMessages(aiFormattedMessages);
      } else {
        setAiMessages([]);
      }
    }
    // ゲストユーザーの場合はuseChatが管理するaiMessages（内部状態）をそのまま使用
  }, [user, historyMessages, setAiMessages]);
  
  // 表示用メッセージ配列はaiMessagesを統一使用
  const displayMessages = aiMessages;

  // メッセージが追加された時に自動スクロール
  useEffect(() => {
    scrollToBottom();
  }, [displayMessages]);

  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // セッション作成（ログイン済みユーザーのみ）
  const handleCreateSession = async () => {
    if (!user?.uid) {
      toast.error('セッション機能を使用するにはログインが必要です');
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
  
  // カスタムハンドルサブミット（メッセージ保存処理）
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (user) {
      // ログイン済みユーザー：Firestore保存
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
    }
    // ゲストユーザーはuseChat内部で自動的にメッセージが管理される
    
    // AI チャット処理を実行
    originalHandleSubmit(e);
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  

  return (
    <div className="h-[calc(100vh-2rem)] flex bg-gray-50">
      {/* サイドバー（ログイン済みユーザーのみ） */}
      {user && (
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
      )}
      
      {/* メインチャットエリア */}
      <div className="flex-1 flex flex-col">
        {/* ヘッダー */}
        <div className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bot className="text-blue-500" size={28} />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {user ? (currentSession?.title || 'AIチャット') : 'AIチャット（ゲストモード）'}
                  {currentMode === 'canvas' && <span className="text-sm text-blue-600 ml-2">(Canvas Mode)</span>}
                </h1>
                <p className="text-sm text-gray-500">
                  {user ? '作品制作をサポートします' : '作品制作をサポートします（会話は保存されません）'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* モード切り替えボタン */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setCurrentMode('normal')}
                  className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer ${
                    currentMode === 'normal'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <MessageCircle size={16} />
                  <span>通常</span>
                </button>
                <button
                  onClick={() => setCurrentMode('canvas')}
                  className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer ${
                    currentMode === 'canvas'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Edit3 size={16} />
                  <span>Canvas</span>
                </button>
              </div>
              
              {/* セッション情報（ログイン済みユーザーのみ） */}
              {user && currentSession && (
                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    {currentSession.messageCount}件のメッセージ
                  </p>
                  <p className="text-xs text-gray-400">
                    {currentSession.updatedAt.toLocaleDateString('ja-JP')}
                  </p>
                </div>
              )}
              
              {/* ゲストモード情報 */}
              {!user && (
                <div className="text-right">
                  <p className="text-xs text-blue-600">ゲストモード</p>
                  <p className="text-xs text-gray-400">履歴は保存されません</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* メインコンテンツ - モードに応じて切り替え */}
        {currentMode === 'canvas' ? (
          <div className="flex-1 overflow-hidden">
            <CanvasMode 
              sessionId={currentSession?.id}
              userId={user?.uid}
              className="h-full"
            />
          </div>
        ) : (
          <>
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
                  {displayMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <Bot className="text-gray-300 mb-4" size={64} />
                      <h2 className="text-lg font-medium text-gray-600 mb-2">
                        {user 
                          ? (currentSession ? currentSession.title : 'AIチャットへようこそ')
                          : 'AIチャットへようこそ（ゲストモード）'
                        }
                      </h2>
                      <p className="text-sm text-gray-500 max-w-md">
                        作品のアイデア出しや、台本の改善案など、創作活動に関する質問をお気軽にどうぞ。
                      </p>
                      {!user && (
                        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-md">
                          <p className="text-sm text-blue-700 mb-2">
                            ⚠️ ゲストモードでは会話履歴は保存されません
                          </p>
                          <p className="text-xs text-blue-600">
                            ログインすると会話を保存して後で見直すことができます
                          </p>
                        </div>
                      )}
                      {user && !currentSession && (
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
                      {displayMessages.map((message) => (
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
          </>
        )}
      </div>
    </div>
  );
}