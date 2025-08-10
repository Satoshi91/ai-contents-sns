'use client';

import React, { useState } from 'react';
import { Message } from 'ai/react';
import { Bot, User, Volume2, Loader, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AudioPlayer } from '@/components/ui/AudioPlayer';
import { useAuthContext } from '@/lib/contexts/AuthContext';
import { auth } from '@/lib/firebase/app';

interface ChatMessageProps {
  message: Message;
}

interface VoiceState {
  status: 'idle' | 'generating' | 'completed' | 'error';
  audioUrl?: string;
  audioId?: string;
  error?: string;
}

interface SaveState {
  status: 'idle' | 'saving' | 'completed' | 'error';
  error?: string;
  workId?: string;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const { user } = useAuthContext();
  const [voiceState, setVoiceState] = useState<VoiceState>({ status: 'idle' });
  const [saveState, setSaveState] = useState<SaveState>({ status: 'idle' });
  const [showSaveOptions, setShowSaveOptions] = useState(false);

  const handleGenerateVoice = async () => {
    if (!user) {
      alert('ログインしてください');
      return;
    }

    setVoiceState({ status: 'generating' });
    
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('ログインが必要です');
      }
      
      const token = await currentUser.getIdToken();

      const response = await fetch('/api/aivis/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: message.content,
          outputFormat: 'mp3',
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '音声生成に失敗しました');
      }

      setVoiceState({
        status: 'completed',
        audioUrl: result.audioUrl,
        audioId: result.audioId,
      });
      setShowSaveOptions(true);
    } catch (error) {
      console.error('Voice generation error:', error);
      setVoiceState({
        status: 'error',
        error: error instanceof Error ? error.message : '音声生成中にエラーが発生しました',
      });
    }
  };

  const handleSaveWork = async (isPublic: boolean) => {
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
          title: `AI音声: ${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}`,
          caption: isPublic ? `AIチャットから生成された音声作品` : '',
          script: message.content,
          audioUrl: voiceState.audioUrl,
          audioId: voiceState.audioId,
          isPublic,
          contentType: 'voice',
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

      setShowSaveOptions(false);
    } catch (error) {
      console.error('Save work error:', error);
      setSaveState({
        status: 'error',
        error: error instanceof Error ? error.message : '作品の保存中にエラーが発生しました',
      });
    }
  };

  const isAIMessage = message.role === 'assistant';

  return (
    <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
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
        <div className="flex flex-col space-y-2">
          <div
            className={`px-4 py-2 rounded-lg ${
              message.role === 'user'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-900 shadow-sm'
            }`}
          >
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>

          {/* AI メッセージの場合のみ音声生成機能を表示 */}
          {isAIMessage && (
            <div className="flex flex-col space-y-2">
              {/* ボイス生成ボタン */}
              {voiceState.status === 'idle' && (
                <Button
                  onClick={handleGenerateVoice}
                  variant="secondary"
                  size="sm"
                  className="flex items-center space-x-2 self-start cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                >
                  <Volume2 size={16} />
                  <span>ボイス</span>
                </Button>
              )}

              {/* 生成中 */}
              {voiceState.status === 'generating' && (
                <div className="flex items-center space-x-2 text-gray-600 text-sm">
                  <Loader size={16} className="animate-spin" />
                  <span>音声を生成しています...</span>
                </div>
              )}

              {/* エラー */}
              {voiceState.status === 'error' && (
                <div className="text-red-600 text-sm">
                  {voiceState.error}
                  <Button
                    onClick={handleGenerateVoice}
                    variant="secondary"
                    size="sm"
                    className="ml-2 cursor-pointer hover:bg-red-50 transition-colors duration-200"
                  >
                    再試行
                  </Button>
                </div>
              )}

              {/* 生成完了 - 音声プレイヤー */}
              {voiceState.status === 'completed' && voiceState.audioUrl && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  {/* 音声プレイヤーとボタンを横並びに配置 */}
                  <div className="flex items-center gap-3">
                    <div className="flex-grow">
                      <AudioPlayer audioUrl={voiceState.audioUrl} />
                    </div>
                    
                    {/* 保存オプション */}
                    {showSaveOptions && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          onClick={() => handleSaveWork(true)}
                          variant="primary"
                          size="sm"
                          disabled={saveState.status === 'saving'}
                          className="cursor-pointer hover:bg-blue-600 transition-colors duration-200 flex items-center gap-1 whitespace-nowrap"
                        >
                          {saveState.status === 'saving' ? (
                            <Loader size={14} className="animate-spin" />
                          ) : (
                            <>
                              <Upload size={14} />
                              <span>投稿</span>
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => handleSaveWork(false)}
                          variant="secondary"
                          size="sm"
                          disabled={saveState.status === 'saving'}
                          className="cursor-pointer hover:bg-gray-100 transition-colors duration-200 flex items-center gap-1 whitespace-nowrap"
                        >
                          {saveState.status === 'saving' ? (
                            <Loader size={14} className="animate-spin" />
                          ) : (
                            <>
                              <Download size={14} />
                              <span>保存</span>
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* 保存状態表示 */}
                  {saveState.status === 'completed' && (
                    <div className="mt-2 text-green-600 text-sm">
                      作品が保存されました！
                    </div>
                  )}

                  {saveState.status === 'error' && (
                    <div className="mt-2 text-red-600 text-sm">
                      {saveState.error}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}