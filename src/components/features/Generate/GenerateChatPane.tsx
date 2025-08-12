'use client';

import React, { useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface GenerateChatPaneProps {
  messages: Message[];
  currentInput: string;
  isLoading?: boolean;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
}

export function GenerateChatPane({
  messages,
  currentInput,
  isLoading = false,
  onInputChange,
  onSendMessage
}: GenerateChatPaneProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // メッセージが追加された時に自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentInput.trim() || isLoading) return;
    onSendMessage();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* メッセージエリア */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Bot className="text-gray-300 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-600 mb-2">AIアシスタント</h3>
            <p className="text-sm text-gray-500 max-w-md">
              作品の企画や台本について質問してください。<br />
              AIが創作をサポートします。
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-[70%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* アバター */}
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      message.role === 'user' ? 'bg-blue-500 ml-3' : 'bg-gray-300 mr-3'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <User size={18} className="text-white" />
                    ) : (
                      <Bot size={18} className="text-gray-600" />
                    )}
                  </div>

                  {/* メッセージ内容 */}
                  <div className="flex flex-col">
                    <div
                      className={`px-4 py-2 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-white text-gray-900 shadow-sm'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {message.timestamp.toLocaleTimeString('ja-JP', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* ローディング表示 */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center mr-3">
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
      </div>

      {/* 入力エリア */}
      <div className="border-t bg-white p-4">
        <form onSubmit={handleSubmit} className="flex space-x-3">
          <textarea
            value={currentInput}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="作品について質問してください..."
            className="flex-1 resize-none rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={2}
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={!currentInput.trim() || isLoading}
            className="cursor-pointer hover:bg-blue-600 transition-colors duration-200"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send size={20} />
            )}
          </Button>
        </form>
        <p className="mt-2 text-xs text-gray-500">
          Shift + Enter で改行、Enter で送信
        </p>
      </div>
    </div>
  );
}