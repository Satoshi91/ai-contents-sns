'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import { X, Play, Pause, Music } from 'lucide-react';
import { validateAudioFile } from '@/lib/cloudflare/r2';
import { auth } from '@/lib/firebase/app';
import toast from 'react-hot-toast';

interface AudioFileUploadProps {
  onAudioUpload: (audioUrl: string, audioId: string, originalFilename?: string) => void;
  onAudioDelete?: () => void;
  currentAudioUrl?: string;
  currentAudioOriginalFilename?: string;
  disabled?: boolean;
  workId?: string;
}

export function AudioFileUpload({ 
  onAudioUpload, 
  onAudioDelete,
  currentAudioUrl,
  currentAudioOriginalFilename,
  disabled = false,
  workId 
}: AudioFileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentAudioInfo, setCurrentAudioInfo] = useState<{
    duration: number | null;
    fileName: string | null;
    size: number | null;
  }>({ duration: null, fileName: null, size: null });
  const [isCurrentPlaying, setIsCurrentPlaying] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentAudioRef = useRef<HTMLAudioElement>(null);

  // 現在の音声ファイル情報を取得
  useEffect(() => {
    if (currentAudioUrl && currentAudioRef.current) {
      const audio = currentAudioRef.current;
      
      const updateInfo = () => {
        if (audio.duration && !isNaN(audio.duration)) {
          // URLから推測されるファイル名を取得
          const urlParts = currentAudioUrl.split('/');
          const fileName = urlParts[urlParts.length - 1].split('?')[0] || 'audio-file.mp3';
          
          setCurrentAudioInfo({
            duration: audio.duration,
            fileName: decodeURIComponent(fileName),
            size: null // サイズはURLからは取得できないため
          });
        }
      };

      audio.addEventListener('loadedmetadata', updateInfo);
      audio.load();

      return () => {
        audio.removeEventListener('loadedmetadata', updateInfo);
      };
    } else {
      setCurrentAudioInfo({ duration: null, fileName: null, size: null });
    }
  }, [currentAudioUrl]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, [disabled]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [disabled]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (disabled || !e.target.files || !e.target.files[0]) return;
    handleFile(e.target.files[0]);
  };

  const handleFile = (file: File) => {
    const validation = validateAudioFile(file);
    if (!validation.valid) {
      toast.error(validation.error!);
      return;
    }
    
    // ファイル登録時に自動でアップロード開始
    uploadAudio(file);
  };

  const uploadAudio = async (file: File) => {
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error('認証エラー');
      }

      // 仮のworkIdを生成（実際の投稿時に正式なIDに置き換え）
      const tempWorkId = workId || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // 署名付きアップロードURLを取得
      const uploadResponse = await fetch('/api/works/audio/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          workId: tempWorkId,
        }),
      });

      if (!uploadResponse.ok) {
        throw new Error('アップロードURLの取得に失敗しました');
      }

      const { uploadUrl, audioId, audioUrl, originalFilename } = await uploadResponse.json();

      // Cloudflare R2にアップロード
      const xhr = new XMLHttpRequest();
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          onAudioUpload(audioUrl, audioId, originalFilename);
          toast.success('音声ファイルをアップロードしました');
        } else {
          throw new Error('音声ファイルのアップロードに失敗しました');
        }
        setIsUploading(false);
      };

      xhr.onerror = () => {
        throw new Error('音声ファイルのアップロードに失敗しました');
      };

      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);

    } catch (error) {
      console.error('Audio upload error:', error);
      toast.error(error instanceof Error ? error.message : '音声ファイルのアップロードに失敗しました');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };


  const toggleCurrentPlay = () => {
    if (!currentAudioRef.current || !currentAudioUrl) return;

    if (isCurrentPlaying) {
      currentAudioRef.current.pause();
      setIsCurrentPlaying(false);
    } else {
      currentAudioRef.current.play();
      setIsCurrentPlaying(true);
    }
  };

  const handleCurrentAudioEnd = () => {
    setIsCurrentPlaying(false);
  };

  const handleDeleteAudio = () => {
    if (onAudioDelete) {
      onAudioDelete();
      setShowDeleteConfirm(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* アップロード済みファイル情報 */}
      {currentAudioUrl && !isUploading && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={toggleCurrentPlay}
                className="cursor-pointer hover:bg-green-200 transition-colors duration-200 p-2 rounded-full bg-green-100"
                disabled={isUploading}
              >
                {isCurrentPlaying ? (
                  <Pause size={20} className="text-green-600" />
                ) : (
                  <Play size={20} className="text-green-600" />
                )}
              </button>
              <div>
                <p className="text-sm font-medium text-green-900">
                  {currentAudioOriginalFilename || currentAudioInfo.fileName || 'audio-file.mp3'}
                </p>
                <div className="flex items-center space-x-2 text-xs text-green-700">
                  <span>アップロード済み</span>
                  {currentAudioInfo.duration && (
                    <>
                      <span>•</span>
                      <span>{formatDuration(currentAudioInfo.duration)}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            {onAudioDelete && (
              <Button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                size="sm"
                variant="outline"
                className="cursor-pointer hover:bg-red-100 hover:text-red-700 transition-colors duration-200 text-red-600 border-red-300"
              >
                削除
              </Button>
            )}
          </div>
        </div>
      )}

      {/* アップロードエリア */}
      {!currentAudioUrl && (
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
            ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
            ${disabled || isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400 hover:bg-gray-50'}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleChange}
            className="hidden"
            disabled={disabled || isUploading}
          />
          
          {isUploading ? (
            <div className="flex flex-col items-center">
              <Spinner size="md" />
              <p className="mt-2 text-sm text-gray-600">アップロード中...</p>
              <div className="w-full max-w-xs mt-2 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">{uploadProgress}%</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Music size={24} className="text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 mb-1">
                音声ファイルをアップロード
              </p>
              <p className="text-xs text-gray-500">
                クリックまたはドラッグ&ドロップ
              </p>
              <p className="text-xs text-gray-500 mt-1">
                MP3、WAV、M4A、AAC、OGG（最大50MB）
              </p>
            </div>
          )}
        </div>
      )}


      {/* 隠れた音声要素（現在の音声用） */}
      {currentAudioUrl && (
        <audio
          ref={currentAudioRef}
          src={currentAudioUrl}
          onEnded={handleCurrentAudioEnd}
          className="hidden"
        />
      )}

      {/* 削除確認モーダル */}
      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteAudio}
        title="音声ファイルを削除"
        message="この音声ファイルを削除しますか？この操作は取り消せません。"
        isDeleting={false}
      />
    </div>
  );
}