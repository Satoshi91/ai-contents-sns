'use client';

import React, { useState } from 'react';
import { Save, Download, Trash2, FileText, Type, RotateCcw, Volume2, Loader, Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AudioPlayer } from '@/components/ui/AudioPlayer';

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


interface CanvasControlsProps {
  title: string;
  onTitleChange: (title: string) => void;
  onSave: () => void;
  onClear: () => void;
  onExport: (format: 'txt' | 'json' | 'ssml') => void;
  wordCount: number;
  characterCount: number;
  lastSaved?: Date | null;
  isDirty?: boolean;
  isLoading?: boolean;
  canvasContent: string;
  onGenerateVoice: (voiceState: VoiceState) => void;
  onSaveWork?: (isPublic: boolean) => void;
  voiceState?: VoiceState;
  saveState?: SaveState;
}

export function CanvasControls({
  title,
  onTitleChange,
  onSave,
  onClear,
  onExport,
  wordCount,
  characterCount,
  lastSaved,
  isDirty = false,
  isLoading = false,
  canvasContent,
  onGenerateVoice,
  onSaveWork,
  voiceState = { status: 'idle' },
  saveState = { status: 'idle' }
}: CanvasControlsProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [showSaveOptions, setShowSaveOptions] = useState(false);

  const handleTitleSubmit = () => {
    onTitleChange(tempTitle.trim() || '無題のドキュメント');
    setIsEditingTitle(false);
  };

  const handleTitleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSubmit();
    } else if (e.key === 'Escape') {
      setTempTitle(title);
      setIsEditingTitle(false);
    }
  };

  const formatLastSaved = (date: Date | null) => {
    if (!date) return '未保存';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return '今保存';
    if (minutes < 60) return `${minutes}分前`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}時間前`;
    return date.toLocaleDateString('ja-JP');
  };

  const handleGenerateVoice = async () => {
    if (!canvasContent.trim()) {
      return;
    }

    onGenerateVoice({ 
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
          text: canvasContent,
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

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;

            try {
              const data = JSON.parse(jsonStr);
              
              if (data.chunkId === 'init') {
                onGenerateVoice({
                  ...voiceState,
                  progress: {
                    currentChunk: 0,
                    totalChunks: data.totalChunks,
                    completedChunks: 0,
                    estimatedDuration: data.metadata?.estimatedDuration,
                    elapsedTime: 0
                  }
                });
                continue;
              }

              if (data.chunkId === 'complete') {
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
                  
                  const newVoiceState = {
                    status: 'completed' as const,
                    audioUrl: audioUrl,
                    audioId: `canvas_${Date.now()}`,
                    audioChunks: audioChunks,
                    progress: {
                      currentChunk: data.totalChunks,
                      totalChunks: data.totalChunks,
                      completedChunks: data.totalChunks,
                      elapsedTime: Date.now() - startTime
                    }
                  };
                  
                  setShowSaveOptions(true);
                  onGenerateVoice(newVoiceState);
                } else {
                  throw new Error('音声データが生成されませんでした');
                }
                break;
              }

              if (data.error) {
                throw new Error(data.error);
              }

              if (data.audioData && Array.isArray(data.audioData)) {
                const chunkData = new Uint8Array(data.audioData);
                audioChunks.push(chunkData);

                onGenerateVoice({
                  ...voiceState,
                  progress: {
                    ...voiceState.progress!,
                    currentChunk: data.chunkIndex + 1,
                    completedChunks: data.chunkIndex + 1,
                    elapsedTime: Date.now() - startTime
                  }
                });
              }

            } catch (parseError) {
              continue;
            }
          }
        }
      }

    } catch (error) {
      console.error('Canvas voice generation error:', error);
      const errorState = {
        status: 'error' as const,
        error: error instanceof Error ? error.message : 'リアルタイム音声生成中にエラーが発生しました',
      };
      onGenerateVoice(errorState);
    }
  };

  return (
    <div className="border-b border-gray-200 bg-white">
      {/* タイトル行 */}
      <div className="px-4 py-3 border-b border-gray-100">
        {isEditingTitle ? (
          <input
            type="text"
            value={tempTitle}
            onChange={(e) => setTempTitle(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={handleTitleKeyPress}
            className="text-lg font-semibold text-gray-900 bg-transparent border-0 outline-none w-full focus:bg-gray-50 px-2 py-1 rounded"
            autoFocus
            maxLength={100}
          />
        ) : (
          <h2
            onClick={() => setIsEditingTitle(true)}
            className="text-lg font-semibold text-gray-900 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors duration-200"
            title="クリックで編集"
          >
            {title}
            {isDirty && <span className="text-orange-500 ml-1">●</span>}
          </h2>
        )}
      </div>

      {/* コントロールボタン */}
      <div className="px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* ボイス生成ボタン */}
          {voiceState.status === 'idle' && (
            <Button
              onClick={handleGenerateVoice}
              disabled={!canvasContent.trim() || isLoading}
              size="sm"
              variant="secondary"
              className="cursor-pointer hover:bg-gray-100 transition-colors duration-200 flex items-center space-x-1"
            >
              <Volume2 size={14} />
              <span>ボイス</span>
            </Button>
          )}

          {/* ボイス生成中 */}
          {voiceState.status === 'generating' && (
            <div className="flex items-center space-x-2 text-blue-700 text-sm">
              <Loader size={14} className="animate-spin" />
              <span>音声生成中...</span>
              {voiceState.progress && voiceState.progress.totalChunks > 0 && (
                <span className="text-xs">
                  {voiceState.progress.completedChunks}/{voiceState.progress.totalChunks}
                </span>
              )}
            </div>
          )}

          {/* ボイス生成エラー */}
          {voiceState.status === 'error' && (
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleGenerateVoice}
                size="sm"
                variant="secondary"
                className="cursor-pointer hover:bg-red-100 hover:text-red-600 transition-colors duration-200 flex items-center space-x-1"
              >
                <Volume2 size={14} />
                <span>再試行</span>
              </Button>
            </div>
          )}

          {/* 保存ボタン */}
          <Button
            onClick={onSave}
            disabled={!isDirty || isLoading}
            size="sm"
            variant={isDirty ? "primary" : "secondary"}
            className="cursor-pointer hover:bg-blue-600 transition-colors duration-200 flex items-center space-x-1"
          >
            <Save size={14} />
            <span>{isLoading ? '保存中...' : '保存'}</span>
          </Button>

          {/* エクスポートボタン */}
          <div className="relative">
            <Button
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              size="sm"
              variant="secondary"
              className="cursor-pointer hover:bg-gray-100 transition-colors duration-200 flex items-center space-x-1"
              disabled={characterCount === 0}
            >
              <Download size={14} />
              <span>エクスポート</span>
            </Button>

            {/* エクスポートメニュー */}
            {exportMenuOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-32">
                <button
                  onClick={() => {
                    onExport('txt');
                    setExportMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2 cursor-pointer transition-colors duration-200"
                >
                  <FileText size={14} />
                  <span>テキスト (.txt)</span>
                </button>
                <button
                  onClick={() => {
                    onExport('ssml');
                    setExportMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2 cursor-pointer transition-colors duration-200"
                >
                  <Type size={14} />
                  <span>SSML (.xml)</span>
                </button>
                <button
                  onClick={() => {
                    onExport('json');
                    setExportMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2 cursor-pointer transition-colors duration-200"
                >
                  <FileText size={14} />
                  <span>JSON (.json)</span>
                </button>
              </div>
            )}
          </div>

          {/* クリアボタン */}
          <Button
            onClick={() => {
              if (confirm('Canvas の内容をすべて削除しますか？この操作は取り消せません。')) {
                onClear();
              }
            }}
            size="sm"
            variant="secondary"
            className="cursor-pointer hover:bg-red-50 hover:text-red-600 transition-colors duration-200 flex items-center space-x-1"
            disabled={characterCount === 0}
          >
            <Trash2 size={14} />
            <span>クリア</span>
          </Button>
        </div>
      </div>

      {/* 音声生成完了 - プレイヤーと保存オプション */}
      {voiceState.status === 'completed' && voiceState.audioUrl && (
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="flex-grow">
              <AudioPlayer audioUrl={voiceState.audioUrl} />
            </div>
            
            {showSaveOptions && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  onClick={() => onSaveWork?.(true)}
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
                  onClick={() => onSaveWork?.(false)}
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

          {voiceState.error && (
            <div className="mt-2 text-red-600 text-sm">
              {voiceState.error}
            </div>
          )}
        </div>
      )}

      {/* クリック外してメニューを閉じる */}
      {exportMenuOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setExportMenuOpen(false)}
        />
      )}
    </div>
  );
}