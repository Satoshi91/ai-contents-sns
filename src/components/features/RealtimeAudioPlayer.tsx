'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause, Square, Volume2, Loader, AlertCircle, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { uploadAudioToR2 } from '@/lib/cloudflare/r2';

export interface RealtimeAudioPlayerProps {
  text: string;
  model_uuid?: string;
  speaker_uuid?: string;
  style_id?: number;
  style_name?: string;
  speaking_rate?: number;
  pitch?: number;
  volume?: number;
  emotional_intensity?: number;
  tempo_dynamics?: number;
  output_format?: 'mp3' | 'wav' | 'aac' | 'opus';
  onPlayStart?: () => void;
  onPlayEnd?: () => void;
  onError?: (error: string) => void;
  onSave?: (audioUrl: string, audioId: string, title: string, script: string) => Promise<void>;
  className?: string;
}

export interface ChunkStatus {
  chunkId: string;
  chunkIndex: number;
  text: string;
  status: 'pending' | 'generating' | 'ready' | 'playing' | 'played' | 'error';
  error?: string;
}

export function RealtimeAudioPlayer({
  text,
  model_uuid,
  speaker_uuid,
  style_id,
  style_name,
  speaking_rate = 1.0,
  pitch = 0.0,
  volume = 1.0,
  emotional_intensity = 1.0,
  tempo_dynamics = 1.0,
  output_format = 'mp3',
  onPlayStart,
  onPlayEnd,
  onError,
  onSave,
  className = ''
}: RealtimeAudioPlayerProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [chunks, setChunks] = useState<ChunkStatus[]>([]);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(-1);
  const [totalChunks, setTotalChunks] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [generatedAudioId, setGeneratedAudioId] = useState<string | null>(null);
  const [savedAudioBlob, setSavedAudioBlob] = useState<Blob | null>(null);

  // MediaSource関連のref
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaSourceRef = useRef<MediaSource | null>(null);
  const sourceBufferRef = useRef<SourceBuffer | null>(null);
  const audioChunksRef = useRef<Uint8Array[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const allAudioChunksRef = useRef<Uint8Array[]>([]);

  // 音声再生のクリーンアップ
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      if (audioRef.current.src) {
        URL.revokeObjectURL(audioRef.current.src);
      }
    }

    if (mediaSourceRef.current) {
      if (mediaSourceRef.current.readyState === 'open') {
        // SourceBufferの更新が完了するまで待機（同期的に処理）
        const sourceBuffer = sourceBufferRef.current;
        if (sourceBuffer && sourceBuffer.updating) {
          // 非同期処理を同期的に処理するため、即座にendOfStreamを試行
          // エラーが発生した場合は無視
          try {
            mediaSourceRef.current.endOfStream();
          } catch (e) {
            // SourceBufferが更新中の場合は、updateendイベントで後処理
            sourceBuffer.addEventListener('updateend', () => {
              try {
                if (mediaSourceRef.current?.readyState === 'open') {
                  mediaSourceRef.current.endOfStream();
                }
              } catch (endError) {
                console.warn('MediaSource endOfStream failed:', endError);
              }
            }, { once: true });
          }
        } else {
          try {
            mediaSourceRef.current.endOfStream();
          } catch (e) {
            // MediaSourceが既に閉じられている場合のエラーを無視
            console.warn('MediaSource endOfStream failed:', e);
          }
        }
      }
    }

    audioChunksRef.current = [];
    // 保存用データはクリアしない（保存が完了するまで保持）
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentChunkIndex(-1);
  }, []);

  // コンポーネントアンマウント時のクリーンアップ
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // MediaSource の初期化
  const initializeMediaSource = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      try {
        // ブラウザ対応チェック
        const MediaSourceConstructor = window.MediaSource || (window as any).ManagedMediaSource;
        if (!MediaSourceConstructor) {
          setError('お使いのブラウザではリアルタイム再生がサポートされていません。Chrome または Safari の最新版をご利用ください。');
          resolve(false);
          return;
        }

        // 音声形式の対応チェック
        const mimeType = getMimeType(output_format);
        if (!MediaSourceConstructor.isTypeSupported(mimeType)) {
          console.warn(`Format ${output_format} not supported, falling back to mp3`);
          const fallbackMimeType = 'audio/mpeg';
          if (!MediaSourceConstructor.isTypeSupported(fallbackMimeType)) {
            setError('お使いのブラウザでは音声再生がサポートされていません');
            resolve(false);
            return;
          }
        }

        mediaSourceRef.current = new MediaSourceConstructor();
        const audio = new Audio();
        audioRef.current = audio;

        const objectURL = URL.createObjectURL(mediaSourceRef.current);
        audio.src = objectURL;
        audio.disableRemotePlayback = true; // ManagedMediaSource で必要

        // タイムアウトを設定
        const timeoutId = setTimeout(() => {
          setError('音声システムの初期化がタイムアウトしました');
          resolve(false);
        }, 10000);

        mediaSourceRef.current.addEventListener('sourceopen', () => {
          clearTimeout(timeoutId);
          try {
            if (!mediaSourceRef.current) {
              resolve(false);
              return;
            }

            sourceBufferRef.current = mediaSourceRef.current.addSourceBuffer(mimeType);
            
            // SourceBufferエラーハンドリング
            sourceBufferRef.current.addEventListener('error', (e) => {
              console.error('SourceBuffer error:', e);
              setError('音声バッファでエラーが発生しました');
            });

            resolve(true);
          } catch (err) {
            console.error('SourceBuffer creation failed:', err);
            setError('音声バッファの初期化に失敗しました');
            resolve(false);
          }
        });

        mediaSourceRef.current.addEventListener('error', (e) => {
          clearTimeout(timeoutId);
          console.error('MediaSource error:', e);
          setError('音声ストリームでエラーが発生しました');
          resolve(false);
        });

      } catch (err) {
        console.error('MediaSource initialization failed:', err);
        setError('音声機能の初期化に失敗しました');
        resolve(false);
      }
    });
  }, [output_format]);

  // MIME タイプを取得
  const getMimeType = useCallback((format: string) => {
    switch (format) {
      case 'mp3': return 'audio/mpeg';
      case 'wav': return 'audio/wav';
      case 'aac': return 'audio/aac';
      case 'opus': return 'audio/ogg; codecs=opus';
      default: return 'audio/mpeg';
    }
  }, []);

  // 全チャンクを結合してBlobを作成
  const createCombinedAudioBlob = useCallback(() => {
    if (allAudioChunksRef.current.length === 0) {
      console.warn('No audio chunks to combine');
      return;
    }

    try {
      // 全チャンクのサイズを計算
      const totalSize = allAudioChunksRef.current.reduce((acc, chunk) => acc + chunk.length, 0);
      
      // 結合用の新しいUint8Array
      const combinedArray = new Uint8Array(totalSize);
      let offset = 0;
      
      // 全チャンクを順序通りに結合
      for (const chunk of allAudioChunksRef.current) {
        combinedArray.set(chunk, offset);
        offset += chunk.length;
      }
      
      // Blobとして保存
      const audioBlob = new Blob([combinedArray], { type: 'audio/mpeg' });
      setSavedAudioBlob(audioBlob);
      
      console.log(`Combined audio created: ${audioBlob.size} bytes`);
    } catch (error) {
      console.error('Failed to create combined audio blob:', error);
    }
  }, []);

  // 保存処理
  const handleSave = useCallback(async () => {
    if (!savedAudioBlob || !onSave) {
      console.warn('No audio blob or save handler available');
      return;
    }

    if (!saveTitle.trim()) {
      alert('タイトルを入力してください');
      return;
    }

    setIsSaving(true);
    
    try {
      // Cloudflare R2にアップロード
      const fileName = `realtime_audio_${Date.now()}.mp3`;
      const uploadResult = await uploadAudioToR2(savedAudioBlob, fileName);
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'アップロードに失敗しました');
      }

      // 保存完了をコールバック
      await onSave(
        uploadResult.url!,
        uploadResult.fileId!,
        saveTitle.trim(),
        text
      );

      // 保存成功後の処理
      setGeneratedAudioUrl(uploadResult.url!);
      setGeneratedAudioId(uploadResult.fileId!);
      setShowSaveDialog(false);
      setSaveTitle('');
      
      alert('作品を保存しました！');
      
    } catch (error) {
      console.error('Save failed:', error);
      alert(error instanceof Error ? error.message : '保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  }, [savedAudioBlob, saveTitle, text, onSave]);

  // 保存ダイアログを開く
  const openSaveDialog = useCallback(() => {
    if (!savedAudioBlob) {
      alert('まず音声を生成してください');
      return;
    }
    setShowSaveDialog(true);
  }, [savedAudioBlob]);

  // SourceBufferにデータを追加
  const appendAudioData = useCallback(async (data: Uint8Array): Promise<boolean> => {
    return new Promise((resolve) => {
      const sourceBuffer = sourceBufferRef.current;
      if (!sourceBuffer) {
        resolve(false);
        return;
      }

      const appendBuffer = () => {
        try {
          sourceBuffer.appendBuffer(data as any);
          resolve(true);
        } catch (err) {
          console.error('Failed to append audio data:', err);
          resolve(false);
        }
      };

      if (sourceBuffer.updating) {
        const handleUpdateEnd = () => {
          sourceBuffer.removeEventListener('updateend', handleUpdateEnd);
          appendBuffer();
        };
        sourceBuffer.addEventListener('updateend', handleUpdateEnd);
      } else {
        appendBuffer();
      }
    });
  }, []);

  // リアルタイム音声生成開始
  const startRealtimeGeneration = useCallback(async () => {
    if (!text.trim()) {
      setError('テキストが入力されていません');
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);
      setChunks([]);
      setCurrentChunkIndex(-1);
      setTotalChunks(0);
      setProgress(0);
      
      // 新しい生成を開始する前に保存用データをクリア
      allAudioChunksRef.current = [];
      setSavedAudioBlob(null);

      // MediaSourceを初期化
      const initialized = await initializeMediaSource();
      if (!initialized) return;

      // AbortControllerを設定
      abortControllerRef.current = new AbortController();

      const requestBody = {
        text,
        model_uuid,
        speaker_uuid,
        style_id,
        style_name,
        speaking_rate,
        pitch,
        volume,
        emotional_intensity,
        tempo_dynamics,
        output_format,
        use_ssml: true,
        leading_silence_seconds: 0.1,
        trailing_silence_seconds: 0.1,
        line_break_silence_seconds: 0.4,
      };

      const response = await fetch('/api/tts/realtime-synthesize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`サーバーエラー: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('レスポンスストリームを読み取れません');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let hasStartedPlaying = false;

      onPlayStart?.();

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.substring(6));
                
                // 初期化データ
                if (data.chunkId === 'init') {
                  setTotalChunks(data.totalChunks);
                  continue;
                }

                // 完了データ
                if (data.chunkId === 'complete') {
                  // SourceBufferの更新が完了するまで待機
                  const sourceBuffer = sourceBufferRef.current;
                  if (sourceBuffer && sourceBuffer.updating) {
                    await new Promise<void>((resolve) => {
                      const handleUpdateEnd = () => {
                        sourceBuffer.removeEventListener('updateend', handleUpdateEnd);
                        resolve();
                      };
                      sourceBuffer.addEventListener('updateend', handleUpdateEnd);
                    });
                  }
                  
                  // MediaSourceが開いている状態でendOfStreamを呼び出し
                  if (mediaSourceRef.current?.readyState === 'open') {
                    try {
                      mediaSourceRef.current.endOfStream();
                    } catch (error) {
                      console.warn('Failed to end stream:', error);
                    }
                  }
                  
                  // 全てのチャンクが揃ったらBlobを作成
                  if (allAudioChunksRef.current.length > 0) {
                    createCombinedAudioBlob();
                  }
                  continue;
                }

                // チャンクデータ
                if (data.audioData && Array.isArray(data.audioData)) {
                  const audioData = new Uint8Array(data.audioData);
                  
                  // 保存用にチャンクを蓄積
                  allAudioChunksRef.current.push(audioData);
                  
                  // SourceBufferにデータを追加
                  await appendAudioData(audioData);
                  
                  // チャンクステータスを更新
                  setChunks(prev => {
                    const newChunks = [...prev];
                    const existingIndex = newChunks.findIndex(c => c.chunkId === data.chunkId);
                    
                    if (existingIndex >= 0) {
                      newChunks[existingIndex] = {
                        ...newChunks[existingIndex],
                        status: 'ready'
                      };
                    } else {
                      newChunks.push({
                        chunkId: data.chunkId,
                        chunkIndex: data.chunkIndex,
                        text: data.text,
                        status: 'ready'
                      });
                    }
                    return newChunks.sort((a, b) => a.chunkIndex - b.chunkIndex);
                  });

                  // 最初のチャンクが準備できたら再生開始
                  if (!hasStartedPlaying && audioRef.current) {
                    hasStartedPlaying = true;
                    setIsPlaying(true);
                    await audioRef.current.play();
                  }
                }

                // エラーデータ
                if (data.error) {
                  setChunks(prev => {
                    const newChunks = [...prev];
                    const existingIndex = newChunks.findIndex(c => c.chunkId === data.chunkId);
                    
                    if (existingIndex >= 0) {
                      newChunks[existingIndex] = {
                        ...newChunks[existingIndex],
                        status: 'error',
                        error: data.error
                      };
                    } else {
                      newChunks.push({
                        chunkId: data.chunkId,
                        chunkIndex: data.chunkIndex,
                        text: data.text,
                        status: 'error',
                        error: data.error
                      });
                    }
                    return newChunks.sort((a, b) => a.chunkIndex - b.chunkIndex);
                  });
                }

                // プログレスを更新
                if (data.chunkIndex >= 0 && data.totalChunks > 0) {
                  setProgress(Math.round((data.chunkIndex + 1) / data.totalChunks * 100));
                }

              } catch (parseError) {
                console.error('Failed to parse chunk data:', parseError);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

    } catch (err) {
      console.error('Realtime generation error:', err);
      
      let errorMessage = 'リアルタイム音声生成でエラーが発生しました';
      
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          errorMessage = '音声生成が中断されました';
        } else if (err.name === 'InvalidStateError' && err.message.includes('endOfStream')) {
          errorMessage = '音声ストリームの終了処理でエラーが発生しました。再試行してください';
          console.warn('MediaSource endOfStream error - this may be due to SourceBuffer state');
        } else if (err.message.includes('Failed to fetch')) {
          errorMessage = 'ネットワーク接続エラーが発生しました';
        } else if (err.message.includes('timeout')) {
          errorMessage = 'リクエストがタイムアウトしました';
        } else if (err.message.includes('401') || err.message.includes('APIキー')) {
          errorMessage = 'APIキーが無効です。設定を確認してください';
        } else if (err.message.includes('402') || err.message.includes('クレジット')) {
          errorMessage = 'クレジット残高が不足しています';
        } else if (err.message.includes('429') || err.message.includes('制限')) {
          errorMessage = 'API使用制限に達しました。しばらく待ってから再試行してください';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  }, [
    text, model_uuid, speaker_uuid, style_id, style_name, 
    speaking_rate, pitch, volume, emotional_intensity, tempo_dynamics, 
    output_format, initializeMediaSource, appendAudioData, onPlayStart, onError
  ]);

  // 停止
  const stop = useCallback(() => {
    cleanup();
    onPlayEnd?.();
  }, [cleanup, onPlayEnd]);

  // 一時停止/再開
  const togglePause = useCallback(() => {
    if (!audioRef.current) return;

    if (isPaused) {
      audioRef.current.play();
      setIsPaused(false);
    } else {
      audioRef.current.pause();
      setIsPaused(true);
    }
  }, [isPaused]);

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      {/* コントロール部分 */}
      <div className="flex items-center gap-3 mb-4">
        <Button
          onClick={startRealtimeGeneration}
          disabled={isGenerating || isPlaying || !text.trim()}
          className="cursor-pointer hover:bg-blue-600 transition-colors duration-200"
          size="sm"
        >
          {isGenerating ? (
            <>
              <Loader size={16} className="mr-2 animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <Play size={16} className="mr-2" />
              リアルタイム再生
            </>
          )}
        </Button>

        {isPlaying && (
          <>
            <Button
              onClick={togglePause}
              variant="secondary"
              size="sm"
              className="cursor-pointer hover:bg-gray-100 transition-colors duration-200"
            >
              {isPaused ? <Play size={16} /> : <Pause size={16} />}
            </Button>

            <Button
              onClick={stop}
              variant="secondary"
              size="sm"
              className="cursor-pointer hover:bg-gray-100 transition-colors duration-200"
            >
              <Square size={16} />
            </Button>
          </>
        )}

        {savedAudioBlob && (
          <Button
            onClick={openSaveDialog}
            variant="secondary"
            size="sm"
            disabled={isSaving}
            className="cursor-pointer hover:bg-green-100 hover:text-green-700 transition-colors duration-200"
          >
            {isSaving ? (
              <>
                <Loader size={16} className="mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save size={16} className="mr-2" />
                保存
              </>
            )}
          </Button>
        )}

        <Volume2 size={16} className="text-gray-400" />
      </div>

      {/* プログレス表示 */}
      {(isGenerating || isPlaying) && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>進行状況: {chunks.filter(c => c.status === 'ready' || c.status === 'played').length} / {totalChunks} チャンク</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* エラー表示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
          <div className="flex items-center">
            <AlertCircle size={16} className="text-red-500 mr-2" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* チャンク状況表示（デバッグ用） */}
      {chunks.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">チャンク状況:</h4>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {chunks.map((chunk) => (
              <div 
                key={chunk.chunkId}
                className={`text-xs p-2 rounded ${
                  chunk.status === 'ready' ? 'bg-green-100 text-green-800' :
                  chunk.status === 'generating' ? 'bg-yellow-100 text-yellow-800' :
                  chunk.status === 'error' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-600'
                }`}
              >
                <div className="flex justify-between">
                  <span>#{chunk.chunkIndex}: {chunk.status}</span>
                  <span className="text-gray-500">{chunk.text.length}文字</span>
                </div>
                {chunk.error && (
                  <div className="text-red-600 mt-1">{chunk.error}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 保存ダイアログ */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">音声を保存</h3>
              <Button
                onClick={() => setShowSaveDialog(false)}
                variant="ghost"
                size="sm"
                className="cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                disabled={isSaving}
              >
                <X size={16} />
              </Button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                作品タイトル
              </label>
              <input
                type="text"
                value={saveTitle}
                onChange={(e) => setSaveTitle(e.target.value)}
                placeholder="生成された音声のタイトル"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSaving}
              />
            </div>
            
            <div className="mb-4 p-3 bg-gray-50 rounded text-sm">
              <p className="font-medium text-gray-700 mb-1">元テキスト（先頭100文字）:</p>
              <p className="text-gray-600">
                {text.length > 100 ? `${text.slice(0, 100)}...` : text}
              </p>
            </div>
            
            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => setShowSaveDialog(false)}
                variant="secondary"
                disabled={isSaving}
                className="cursor-pointer hover:bg-gray-100 transition-colors duration-200"
              >
                キャンセル
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || !saveTitle.trim()}
                className="cursor-pointer hover:bg-blue-600 transition-colors duration-200"
              >
                {isSaving ? (
                  <>
                    <Loader size={16} className="mr-2 animate-spin" />
                    保存中...
                  </>
                ) : (
                  '保存'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 非表示の音声要素 */}
      <audio ref={audioRef} style={{ display: 'none' }} />
    </div>
  );
}