'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useChat } from '@ai-sdk/react';
import type { UIMessage } from 'ai';
import { Send, Bot, MessageCircle, Edit3, PanelLeftClose, PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ChatMessage } from '@/components/features/AIChat/ChatMessage';
import { ChatSessionSidebar } from '@/components/features/AIChat/ChatSessionSidebar';
import { CanvasEditor } from '@/components/features/AIChat/modes/CanvasEditor';
import { CanvasControls } from '@/components/features/AIChat/modes/CanvasControls';
import { useChatHistory } from '@/lib/hooks/useChatHistory';
import { useAuth } from '@/lib/hooks/useAuth';
import { useCanvasSync } from '@/lib/hooks/useCanvasSync';
import { CanvasResponse } from '@/types/canvas';
import { auth } from '@/lib/firebase/app';
import toast from 'react-hot-toast';

type ChatMode = 'normal' | 'canvas';

// UIMessageからテキストコンテンツを取得するヘルパー関数
function getMessageContent(message: UIMessage): string {
  if (!message.parts) return '';
  
  return message.parts
    .filter(part => part.type === 'text')
    .map(part => (part as any).text || '')
    .join('');
}

interface VoiceState {
  status: 'idle' | 'generating' | 'completed' | 'error';
  audioUrl?: string;
  audioId?: string;
  error?: string;
  progress?: {
    currentChunk: number;
    totalChunks: number;
    completedChunks: number;
    estimatedDuration?: number;
    elapsedTime?: number;
  };
  audioChunks?: Uint8Array[];
}

interface SaveState {
  status: 'idle' | 'saving' | 'completed' | 'error';
  error?: string;
  workId?: string;
}


export default function ChatPage() {
  const { user } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCanvasCollapsed, setIsCanvasCollapsed] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'canvas'>('chat');
  
  // Canvas状態
  const [canvasContent, setCanvasContent] = useState('');
  const [canvasTitle, setCanvasTitle] = useState('無題のドキュメント');
  const [voiceState, setVoiceState] = useState<VoiceState>({ status: 'idle' });
  const [saveState, setSaveState] = useState<SaveState>({ status: 'idle' });
  
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
  
  const currentMode: ChatMode = currentSession?.mode || 'normal';
  
  // Canvas同期
  const { 
    saveCanvas, 
    exportCanvas, 
    markDirty, 
    isLoading: isSaving,
    lastSaved,
    isDirty 
  } = useCanvasSync({ sessionId: currentSession?.id, userId: user?.uid });

  // レスポンシブ対応
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Canvas更新の処理
  const handleCanvasResponse = useCallback(async (message: UIMessage) => {
    if (currentMode !== 'canvas') return;
    
    try {
      // JSON形式のレスポンスをパース
      let response: CanvasResponse;
      
      try {
        response = JSON.parse(getMessageContent(message));
      } catch {
        // JSON形式でない場合は、chatContentとして扱う
        console.log('Non-JSON response, treating as chat content');
        return;
      }

      // Canvas内容の更新
      if (response.canvasContent !== undefined) {
        switch (response.canvasAction) {
          case 'replace':
            setCanvasContent(response.canvasContent);
            markDirty();
            toast.success('Canvas内容を更新しました');
            break;
          case 'append':
            setCanvasContent(prev => {
              const newContent = prev.trim() 
                ? prev + '\n\n' + response.canvasContent 
                : response.canvasContent!;
              markDirty();
              return newContent;
            });
            toast.success('Canvas内容を追加しました');
            break;
          case 'insert':
            const lines = canvasContent.split('\n');
            const insertPos = Math.min(response.insertPosition || 0, lines.length);
            lines.splice(insertPos, 0, response.canvasContent);
            setCanvasContent(lines.join('\n'));
            markDirty();
            toast.success('Canvas内容を挿入しました');
            break;
          default:
            // canvasActionが指定されていない場合はreplaceとして処理
            setCanvasContent(response.canvasContent);
            markDirty();
            toast.success('Canvas内容を更新しました');
        }
        
        // モバイルでCanvas更新後にCanvasタブに自動切り替え
        if (isMobileView) {
          setActiveTab('canvas');
        }
      }

      // Canvasタイトルの更新
      if (response.canvasTitle !== undefined) {
        setCanvasTitle(response.canvasTitle);
        markDirty();
      }
    } catch (error) {
      console.error('Canvas response processing error:', error);
      toast.error('Canvas更新処理でエラーが発生しました');
    }
  }, [currentMode, canvasContent, markDirty, isMobileView]);

  // 手動入力状態管理（AI SDK 5対応）
  const [input, setInput] = useState('');
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  // AI チャット機能
  const { 
    messages: aiMessages, 
    status,
    error,
    regenerate,
    stop,
    setMessages: setAiMessages,
    sendMessage
  } = useChat({
    api: currentMode === 'canvas' ? '/api/chat/canvas' : '/api/chat',
  } as any);

  // AI SDK 5対応：statusからisLoading計算
  const isLoading = status === 'submitted' || status === 'streaming';

  // ログイン済みユーザーのみセッションからメッセージを同期
  useEffect(() => {
    if (user && historyMessages.length > 0) {
      // ExtendedMessageはUIMessageを拡張しているので、そのまま使用可能
      setAiMessages(historyMessages as UIMessage[]);
    } else if (user) {
      setAiMessages([]);
    }
    // ゲストユーザーの場合はuseChatが管理するaiMessagesを使用
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

  // Canvas内容変更
  const handleCanvasContentChange = useCallback((newContent: string) => {
    setCanvasContent(newContent);
    markDirty();
  }, [markDirty]);

  // Canvas保存
  const handleCanvasSave = useCallback(async () => {
    const success = await saveCanvas(canvasContent, canvasTitle);
    if (success) {
      toast.success('Canvas内容を保存しました');
    }
  }, [saveCanvas, canvasContent, canvasTitle]);

  // Canvasクリア
  const handleCanvasClear = useCallback(() => {
    setCanvasContent('');
    markDirty();
    toast('Canvas内容をクリアしました');
  }, [markDirty]);

  // エクスポート
  const handleCanvasExport = useCallback((format: 'txt' | 'json' | 'ssml') => {
    exportCanvas(canvasContent, canvasTitle, format);
  }, [exportCanvas, canvasContent, canvasTitle]);

  // ボイス生成の状態変更ハンドラー
  const handleVoiceGenerated = useCallback((newVoiceState: VoiceState) => {
    setVoiceState(newVoiceState);
  }, []);

  // 音声作品保存
  const handleSaveWork = useCallback(async (isPublic: boolean) => {
    if (!user || !voiceState.audioUrl || !voiceState.audioId) {
      return;
    }

    setSaveState({ status: 'saving' });

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('ログインが必要です');
      }
      
      const token = await currentUser.getIdToken();

      const response = await fetch('/api/chat/save-work', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: canvasTitle || `Canvas音声: ${canvasContent.substring(0, 50)}${canvasContent.length > 50 ? '...' : ''}`,
          caption: isPublic ? `Canvasから生成された音声作品` : '',
          script: canvasContent,
          audioUrl: voiceState.audioUrl,
          audioId: voiceState.audioId,
          isPublic,
          contentType: 'mixed',
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '作品の保存に失敗しました');
      }

      setSaveState({
        status: 'completed',
        workId: result.workId,
      });

      toast.success(isPublic ? '作品を投稿しました！' : '作品を保存しました！');
    } catch (error) {
      console.error('Canvas save work error:', error);
      setSaveState({
        status: 'error',
        error: error instanceof Error ? error.message : '作品の保存中にエラーが発生しました',
      });
      toast.error('作品の保存に失敗しました');
    }
  }, [user, voiceState, canvasContent, canvasTitle]);

  // 統計計算
  const wordCount = canvasContent.trim().split(/\s+/).filter(word => word.length > 0).length;
  const characterCount = canvasContent.length;
  
  // セッション作成（ログイン済みユーザーのみ）
  const handleCreateSession = async (mode: 'normal' | 'canvas' = 'normal') => {
    if (!user?.uid) {
      toast.error('セッション機能を使用するにはログインが必要です');
      return;
    }
    
    const sessionId = await createNewSession(undefined, undefined, mode);
    if (sessionId) {
      await selectSession(sessionId);
      toast.success(`新しい${mode === 'canvas' ? 'Canvas' : ''}チャットを作成しました`);
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
    
    if (!input.trim()) return;
    
    const messageContent = input.trim();
    setInput(''); // 入力をクリア
    
    if (user) {
      // ログイン済みユーザー：Firestore保存
      if (!currentSession?.id) {
        // セッションがない場合は新規作成（デフォルトで通常モード）
        const sessionId = await createNewSession('新しいチャット', messageContent, 'normal');
        if (!sessionId) {
          toast.error('チャットセッションの作成に失敗しました');
          return;
        }
        await selectSession(sessionId);
      }
      
      // ユーザーメッセージをFirestoreに保存
      if (currentSession?.id) {
        await saveMessage('user', messageContent);
      }
    }
    
    // モバイルでメッセージ送信後にチャットタブに切り替え
    if (isMobileView && currentMode === 'canvas') {
      setActiveTab('chat');
    }
    
    // AI チャット処理を実行（UIMessage形式）
    await sendMessage({
      id: crypto.randomUUID(),
      role: 'user',
      parts: [{ type: 'text', text: messageContent }]
    } as UIMessage);
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  // キーボードショートカット（Canvasモードのみ）
  useEffect(() => {
    if (currentMode !== 'canvas') return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's':
            e.preventDefault();
            if (isDirty) handleCanvasSave();
            break;
          case 'e':
            e.preventDefault();
            handleCanvasExport('txt');
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentMode, handleCanvasSave, handleCanvasExport, isDirty]);
  

  return (
    <div className="h-[calc(100vh-128px)] flex bg-gray-50">
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
                  {currentSession?.mode === 'canvas' && <span className="text-sm text-blue-600 ml-2">(Canvas Mode)</span>}
                </h1>
                <p className="text-sm text-gray-500">
                  {user ? '作品制作をサポートします' : '作品制作をサポートします（会話は保存されません）'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              
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
          // モバイル用Canvas UI
          isMobileView ? (
            <div className="flex-1 flex flex-col">
              {/* タブ */}
              <div className="flex border-b border-gray-200 bg-white">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex-1 px-4 py-2 text-sm font-medium cursor-pointer transition-colors duration-200 ${
                    activeTab === 'chat'
                      ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  チャット {aiMessages.length > 0 && `(${aiMessages.length})`}
                </button>
                <button
                  onClick={() => setActiveTab('canvas')}
                  className={`flex-1 px-4 py-2 text-sm font-medium cursor-pointer transition-colors duration-200 ${
                    activeTab === 'canvas'
                      ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Canvas {isDirty && <span className="text-orange-500">●</span>}
                </button>
              </div>

              {/* コンテンツ */}
              {activeTab === 'chat' ? (
                <div className="flex-1 flex flex-col">
                  <div className="flex-1 overflow-y-auto p-4">
                    {aiMessages.map((message) => (
                      <div key={message.id} className="mb-4">
                        <ChatMessage 
                          message={message} 
                        />
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* 入力エリア */}
                  <div className="border-t bg-white p-4">
                    <form onSubmit={handleSubmit} className="flex space-x-3">
                      <textarea
                        value={input}
                        onChange={handleInputChange}
                        placeholder="Canvasの内容について指示してください..."
                        className="flex-1 resize-none rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={2}
                        disabled={isLoading}
                      />
                      <Button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="cursor-pointer hover:bg-blue-600 transition-colors duration-200"
                      >
                        送信
                      </Button>
                    </form>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col">
                  <CanvasControls
                    title={canvasTitle}
                    onTitleChange={setCanvasTitle}
                    onSave={handleCanvasSave}
                    onClear={handleCanvasClear}
                    onExport={handleCanvasExport}
                    wordCount={wordCount}
                    characterCount={characterCount}
                    lastSaved={lastSaved}
                    isDirty={isDirty}
                    isLoading={isSaving}
                    canvasContent={canvasContent}
                    onGenerateVoice={handleVoiceGenerated}
                    onSaveWork={handleSaveWork}
                    voiceState={voiceState}
                    saveState={saveState}
                  />
                  <div className="flex-1">
                    <CanvasEditor
                      content={canvasContent}
                      onChange={handleCanvasContentChange}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            // デスクトップ用Canvas UI
            <div className="flex-1 flex">
              {/* Chat Pane */}
              <div className={`flex flex-col border-r border-gray-200 transition-all duration-300 ${
                isCanvasCollapsed ? 'w-full' : 'w-3/5'
              }`}>
                {/* チャットヘッダー */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white">
                  <div className="flex items-center space-x-2">
                    <Bot className="text-blue-500" size={20} />
                    <h3 className="font-medium text-gray-900">AI Chat</h3>
                  </div>
                  <Button
                    onClick={() => setIsCanvasCollapsed(!isCanvasCollapsed)}
                    size="sm"
                    variant="secondary"
                    className="cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                  >
                    {isCanvasCollapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
                  </Button>
                </div>

                {/* メッセージエリア */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <p className="text-red-600 text-sm">エラー: {error.message}</p>
                    </div>
                  )}

                  {aiMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <Bot className="text-gray-300 mb-4" size={48} />
                      <h3 className="text-lg font-medium text-gray-600 mb-2">Canvas Mode</h3>
                      <p className="text-sm text-gray-500 max-w-md">
                        AIとの対話を通じて、右側のCanvasにテキストを作成・編集できます。<br />
                        「台本を書いて」「企画書を作成して」などと指示してみてください。
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {aiMessages.map((message) => (
                        <div key={message.id}>
                          <ChatMessage 
                            message={message} 
                          />
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* 入力エリア */}
                <div className="border-t bg-white p-4">
                  <form onSubmit={handleSubmit} className="flex space-x-3">
                    <textarea
                      value={input}
                      onChange={handleInputChange}
                      placeholder="Canvasの内容について指示してください..."
                      className="flex-1 resize-none rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={2}
                      disabled={isLoading}
                    />
                    <div className="flex flex-col space-y-2">
                      <Button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="cursor-pointer hover:bg-blue-600 transition-colors duration-200"
                      >
                        {isLoading ? '送信中...' : '送信'}
                      </Button>
                      {isLoading && (
                        <Button
                          type="button"
                          onClick={stop}
                          size="sm"
                          variant="secondary"
                          className="cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                        >
                          停止
                        </Button>
                      )}
                    </div>
                  </form>
                </div>
              </div>

              {/* Canvas Pane */}
              {!isCanvasCollapsed && (
                <div className="w-2/5 flex flex-col bg-white">
                  <CanvasControls
                    title={canvasTitle}
                    onTitleChange={setCanvasTitle}
                    onSave={handleCanvasSave}
                    onClear={handleCanvasClear}
                    onExport={handleCanvasExport}
                    wordCount={wordCount}
                    characterCount={characterCount}
                    lastSaved={lastSaved}
                    isDirty={isDirty}
                    isLoading={isSaving}
                    canvasContent={canvasContent}
                    onGenerateVoice={handleVoiceGenerated}
                    onSaveWork={handleSaveWork}
                    voiceState={voiceState}
                    saveState={saveState}
                  />
                  <div className="flex-1 overflow-hidden">
                    <CanvasEditor
                      content={canvasContent}
                      onChange={handleCanvasContentChange}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              )}
            </div>
          )
        ) : (
          <>
            {/* メッセージエリア */}
            <div className="flex-1 overflow-y-auto p-6" style={{ paddingBottom: '80px' }}>
              {/* エラー表示 */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-red-600 text-sm">エラーが発生しました: {error.message}</p>
                  <Button 
                    onClick={() => regenerate()} 
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
                        <div className="mt-4 flex space-x-3">
                          <Button
                            onClick={() => handleCreateSession('normal')}
                            className="flex items-center space-x-2 cursor-pointer hover:bg-blue-600 transition-colors duration-200"
                          >
                            <MessageCircle size={16} />
                            <span>通常チャット</span>
                          </Button>
                          <Button
                            onClick={() => handleCreateSession('canvas')}
                            variant="secondary"
                            className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                          >
                            <Edit3 size={16} />
                            <span>キャンバスチャット</span>
                          </Button>
                        </div>
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
                  placeholder={currentSession?.mode === 'canvas' ? "Canvasの内容について指示してください..." : "メッセージを入力してください..."}
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