'use client';

import React, { useState, useEffect } from 'react';
import type { UIMessage } from 'ai';
import { Bot, User, Volume2, Loader, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AudioPlayer } from '@/components/ui/AudioPlayer';
import { useAuthContext } from '@/lib/contexts/AuthContext';
import { auth } from '@/lib/firebase/app';

interface ChatMessageProps {
  message: UIMessage;
}

// UIMessageからテキストコンテンツを取得するヘルパー関数
function getMessageContent(message: UIMessage): string {
  if (!message.parts) return '';
  
  const content = message.parts
    .filter(part => part.type === 'text')
    .map(part => (part as any).text || '')
    .join('');
  
  // CanvasモードのJSONレスポンスの場合、chatContentのみを表示
  try {
    const parsed = JSON.parse(content);
    if (parsed.chatContent) {
      return parsed.chatContent;
    }
  } catch {
    // JSONではない場合はそのまま返す
  }
  
  return content;
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

export function ChatMessage({ message }: ChatMessageProps) {
  const { user } = useAuthContext();
  const [voiceState, setVoiceState] = useState<VoiceState>({ status: 'idle' });
  const [saveState, setSaveState] = useState<SaveState>({ status: 'idle' });
  const [showSaveOptions, setShowSaveOptions] = useState(false);

  // クリーンアップ: コンポーネントがアンマウントされる際にオブジェクトURLを解放
  useEffect(() => {
    return () => {
      if (voiceState.audioUrl && voiceState.audioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(voiceState.audioUrl);
      }
    };
  }, [voiceState.audioUrl]);

  const handleGenerateVoice = async () => {
    if (!user) {
      alert('ログインしてください');
      return;
    }

    setVoiceState({ 
      status: 'generating',
      progress: { currentChunk: 0, totalChunks: 0, completedChunks: 0 },
      audioChunks: []
    });
    
    const startTime = Date.now();
    
    try {
      const response = await fetch('/api/tts/realtime-synthesize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: getMessageContent(message),
          output_format: 'mp3',
          use_ssml: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: 音声生成サービスでエラーが発生しました`);
      }

      if (!response.body) {
        throw new Error('レスポンスストリームが利用できません');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const audioChunks: Uint8Array[] = [];
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // 行ごとに分割（完全な行のみ処理）
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // 最後の不完全な行をバッファに保持

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;

            try {
              const data = JSON.parse(jsonStr);
              
              // 初期化データ
              if (data.chunkId === 'init') {
                setVoiceState(prev => ({
                  ...prev,
                  progress: {
                    currentChunk: 0,
                    totalChunks: data.totalChunks,
                    completedChunks: 0,
                    estimatedDuration: data.metadata?.estimatedDuration,
                    elapsedTime: 0
                  }
                }));
                continue;
              }

              // 完了通知
              if (data.chunkId === 'complete') {
                // 全ての音声チャンクを結合してBlobを作成
                if (audioChunks.length > 0) {
                  const totalLength = audioChunks.reduce((acc, chunk) => acc + chunk.length, 0);
                  const combined = new Uint8Array(totalLength);
                  let offset = 0;
                  
                  for (const chunk of audioChunks) {
                    combined.set(chunk, offset);
                    offset += chunk.length;
                  }

                  const blob = new Blob([combined], { type: 'audio/mpeg' });
                  const audioUrl = URL.createObjectURL(blob);
                  
                  setVoiceState({
                    status: 'completed',
                    audioUrl: audioUrl,
                    audioId: `realtime_${Date.now()}`,
                    audioChunks: audioChunks,
                    progress: {
                      currentChunk: data.totalChunks,
                      totalChunks: data.totalChunks,
                      completedChunks: data.totalChunks,
                      elapsedTime: Date.now() - startTime
                    }
                  });
                  setShowSaveOptions(true);
                } else {
                  throw new Error('音声データが生成されませんでした');
                }
                break;
              }

              // エラー処理
              if (data.error) {
                throw new Error(data.error);
              }

              // 音声チャンクデータ
              if (data.audioData && Array.isArray(data.audioData)) {
                const chunkData = new Uint8Array(data.audioData);
                audioChunks.push(chunkData);

                setVoiceState(prev => ({
                  ...prev,
                  progress: {
                    ...prev.progress!,
                    currentChunk: data.chunkIndex + 1,
                    completedChunks: data.chunkIndex + 1,
                    elapsedTime: Date.now() - startTime
                  }
                }));
              }

            } catch (parseError) {
              console.error('JSONパースエラー:', parseError);
              console.error('問題のあるJSON:', jsonStr);
              console.error('行全体:', line);
              
              // パースエラーは無視して処理を続行
              continue;
            }
          }
        }
      }

      // 最後にバッファに残ったデータを処理
      if (buffer.trim()) {
        if (buffer.startsWith('data: ')) {
          const jsonStr = buffer.slice(6).trim();
          if (jsonStr) {
            try {
              const data = JSON.parse(jsonStr);
              console.log('最後のバッファデータ:', data);
            } catch (parseError) {
              console.error('最後のバッファのパースエラー:', parseError);
              console.error('バッファ内容:', buffer);
            }
          }
        }
      }

    } catch (error) {
      console.error('Realtime voice generation error:', error);
      setVoiceState({
        status: 'error',
        error: error instanceof Error ? error.message : 'リアルタイム音声生成中にエラーが発生しました',
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
          title: `AI音声: ${getMessageContent(message).substring(0, 50)}${getMessageContent(message).length > 50 ? '...' : ''}`,
          caption: isPublic ? `AIチャットから生成された音声作品` : '',
          script: getMessageContent(message), // AIチャットのメッセージ内容をスクリプトとして保存
          audioUrl: voiceState.audioUrl,
          audioId: voiceState.audioId,
          isPublic,
          contentType: 'mixed', // 音声とスクリプト両方を含む作品として保存
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
            <p className="whitespace-pre-wrap">{getMessageContent(message)}</p>
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
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2 text-blue-700 text-sm mb-2">
                    <Loader size={16} className="animate-spin" />
                    <span>音声を生成しています...</span>
                  </div>
                  
                  {voiceState.progress && (
                    <div className="space-y-2">
                      {/* 進捗バー */}
                      {voiceState.progress.totalChunks > 0 && (
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${(voiceState.progress.completedChunks / voiceState.progress.totalChunks) * 100}%` 
                            }}
                          />
                        </div>
                      )}
                      
                      {/* 進捗詳細 */}
                      <div className="flex justify-between text-xs text-blue-600">
                        <span>
                          {voiceState.progress.totalChunks > 0 
                            ? `${voiceState.progress.completedChunks}/${voiceState.progress.totalChunks} チャンク`
                            : '初期化中...'
                          }
                        </span>
                        
                        <span>
                          {voiceState.progress.elapsedTime 
                            ? `${Math.round(voiceState.progress.elapsedTime / 1000)}秒経過`
                            : ''
                          }
                        </span>
                      </div>
                      
                      {/* 推定残り時間 */}
                      {voiceState.progress.estimatedDuration && voiceState.progress.elapsedTime && voiceState.progress.completedChunks > 0 && (
                        <div className="text-xs text-blue-500">
                          推定残り時間: {Math.max(0, Math.round(
                            (voiceState.progress.estimatedDuration * 1000 - voiceState.progress.elapsedTime) / 1000
                          ))}秒
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* エラー */}
              {voiceState.status === 'error' && (
                <div className="bg-red-50 p-3 rounded-lg">
                  <div className="text-red-700 text-sm font-medium mb-2">
                    音声生成エラー
                  </div>
                  <div className="text-red-600 text-sm mb-3">
                    {voiceState.error}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={handleGenerateVoice}
                      variant="secondary"
                      size="sm"
                      className="cursor-pointer hover:bg-red-100 transition-colors duration-200"
                    >
                      <Loader size={14} className="mr-1" />
                      再試行
                    </Button>
                    <div className="text-xs text-red-500">
                      エラーが続く場合は時間をおいて再度お試しください
                    </div>
                  </div>
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