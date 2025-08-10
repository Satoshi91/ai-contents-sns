'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useChat } from 'ai/react';
import { Bot, User, PanelLeftClose, PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ChatMessage } from '../ChatMessage';
import { CanvasEditor } from './CanvasEditor';
import { CanvasControls } from './CanvasControls';
import { useCanvasSync } from '@/lib/hooks/useCanvasSync';
import { CanvasResponse } from '@/types/canvas';
import toast from 'react-hot-toast';

interface CanvasModeProps {
  sessionId?: string;
  userId?: string;
  className?: string;
}

export function CanvasMode({ sessionId, userId, className = '' }: CanvasModeProps) {
  const [canvasContent, setCanvasContent] = useState('');
  const [canvasTitle, setCanvasTitle] = useState('無題のドキュメント');
  const [isCanvasCollapsed, setIsCanvasCollapsed] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'canvas'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Canvas同期
  const { 
    saveCanvas, 
    exportCanvas, 
    markDirty, 
    isLoading: isSaving,
    lastSaved,
    isDirty 
  } = useCanvasSync({ sessionId, userId });

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
  const handleCanvasResponse = useCallback(async (message: any) => {
    try {
      // JSON形式のレスポンスをパース
      let response: CanvasResponse;
      
      try {
        response = JSON.parse(message.content);
      } catch (parseError) {
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
    } catch (error) {
      console.error('Canvas response processing error:', error);
      toast.error('Canvas更新処理でエラーが発生しました');
    }
  }, [canvasContent, markDirty, isMobileView]);

  // Canvas専用チャット
  const { 
    messages, 
    input, 
    handleInputChange, 
    handleSubmit: originalHandleSubmit,
    isLoading: isChatLoading,
    error,
    stop 
  } = useChat({
    api: '/api/chat/canvas',
    body: { 
      canvasContent, 
      canvasTitle 
    },
    onError: (error) => {
      console.error('Canvas chat error:', error);
      toast.error('チャットでエラーが発生しました');
    },
    onFinish: handleCanvasResponse
  });

  // チャット送信
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      originalHandleSubmit(e);
      
      // モバイルでメッセージ送信後にチャットタブに切り替え
      if (isMobileView) {
        setActiveTab('chat');
      }
    }
  }, [originalHandleSubmit, input, isMobileView]);

  // Canvas内容変更
  const handleCanvasContentChange = useCallback((newContent: string) => {
    setCanvasContent(newContent);
    markDirty();
  }, [markDirty]);

  // Canvas保存
  const handleSave = useCallback(async () => {
    const success = await saveCanvas(canvasContent, canvasTitle);
    if (success) {
      toast.success('Canvas内容を保存しました');
    }
  }, [saveCanvas, canvasContent, canvasTitle]);

  // Canvasクリア
  const handleClear = useCallback(() => {
    setCanvasContent('');
    markDirty();
    toast.info('Canvas内容をクリアしました');
  }, [markDirty]);

  // エクスポート
  const handleExport = useCallback((format: 'txt' | 'json' | 'ssml') => {
    exportCanvas(canvasContent, canvasTitle, format);
  }, [exportCanvas, canvasContent, canvasTitle]);

  // 統計計算
  const wordCount = canvasContent.trim().split(/\s+/).filter(word => word.length > 0).length;
  const characterCount = canvasContent.length;

  // 自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // キーボードショートカット
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's':
            e.preventDefault();
            if (isDirty) handleSave();
            break;
          case 'e':
            e.preventDefault();
            handleExport('txt');
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, handleExport, isDirty]);

  // モバイル用タブUI
  if (isMobileView) {
    return (
      <div className={`flex flex-col h-full ${className}`}>
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
            チャット {messages.length > 0 && `(${messages.length})`}
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
              {messages.map((message) => (
                <div key={message.id} className="mb-4">
                  <ChatMessage 
                    message={{
                      ...message,
                      // JSON レスポンスの場合は chatContent のみ表示
                      content: (() => {
                        try {
                          const parsed = JSON.parse(message.content);
                          return parsed.chatContent || message.content;
                        } catch {
                          return message.content;
                        }
                      })()
                    }} 
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
                  disabled={isChatLoading}
                />
                <Button
                  type="submit"
                  disabled={!input.trim() || isChatLoading}
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
              onSave={handleSave}
              onClear={handleClear}
              onExport={handleExport}
              wordCount={wordCount}
              characterCount={characterCount}
              lastSaved={lastSaved}
              isDirty={isDirty}
              isLoading={isSaving}
            />
            <div className="flex-1">
              <CanvasEditor
                content={canvasContent}
                onChange={handleCanvasContentChange}
                disabled={isChatLoading}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // デスクトップ用デュアルペインUI
  return (
    <div className={`flex h-full ${className}`}>
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

          {messages.length === 0 ? (
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
              {messages.map((message) => (
                <div key={message.id}>
                  <ChatMessage 
                    message={{
                      ...message,
                      // JSON レスポンスの場合は chatContent のみ表示
                      content: (() => {
                        try {
                          const parsed = JSON.parse(message.content);
                          return parsed.chatContent || message.content;
                        } catch {
                          return message.content;
                        }
                      })()
                    }} 
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
              disabled={isChatLoading}
            />
            <div className="flex flex-col space-y-2">
              <Button
                type="submit"
                disabled={!input.trim() || isChatLoading}
                className="cursor-pointer hover:bg-blue-600 transition-colors duration-200"
              >
                {isChatLoading ? '送信中...' : '送信'}
              </Button>
              {isChatLoading && (
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
            onSave={handleSave}
            onClear={handleClear}
            onExport={handleExport}
            wordCount={wordCount}
            characterCount={characterCount}
            lastSaved={lastSaved}
            isDirty={isDirty}
            isLoading={isSaving}
          />
          <div className="flex-1 overflow-hidden">
            <CanvasEditor
              content={canvasContent}
              onChange={handleCanvasContentChange}
              disabled={isChatLoading}
            />
          </div>
        </div>
      )}
    </div>
  );
}