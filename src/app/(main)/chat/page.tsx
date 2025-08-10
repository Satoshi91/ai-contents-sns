'use client';

import { useChat } from 'ai/react';
import { Send, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function ChatPage() {
  const { 
    messages, 
    input, 
    handleInputChange, 
    handleSubmit, 
    isLoading,
    error,
    reload,
    stop 
  } = useChat({
    api: '/api/chat',
    initialMessages: [],
    onError: (error) => {
      console.error('Chat error:', error);
    }
  });

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-2rem)] flex flex-col">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center space-x-3">
          <Bot className="text-blue-500" size={28} />
          <div>
            <h1 className="text-xl font-semibold text-gray-900">AIアシスタント</h1>
            <p className="text-sm text-gray-500">作品制作をサポートします</p>
          </div>
        </div>
      </div>

      {/* メッセージエリア */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
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

        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Bot className="text-gray-300 mb-4" size={64} />
            <h2 className="text-lg font-medium text-gray-600 mb-2">
              AIアシスタントへようこそ
            </h2>
            <p className="text-sm text-gray-500 max-w-md">
              作品のアイデア出しや、台本の改善案など、創作活動に関する質問をお気軽にどうぞ。
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`flex max-w-[70%] ${
                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      message.role === 'user'
                        ? 'bg-blue-500 ml-3'
                        : 'bg-gray-300 mr-3'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <User size={18} className="text-white" />
                    ) : (
                      <Bot size={18} className="text-gray-600" />
                    )}
                  </div>
                  <div
                    className={`px-4 py-2 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-900 shadow-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              </div>
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
          </div>
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
  );
}