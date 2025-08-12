'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import { X, Image } from 'lucide-react';
import { validateImageFile } from '@/lib/cloudflare/images';
import { auth } from '@/lib/firebase/app';
import toast from 'react-hot-toast';

interface CharacterImageUploadProps {
  onImageUpload: (imageUrl: string, imageId: string) => void;
  onImageDelete?: () => void;
  currentImageUrl?: string;
  disabled?: boolean;
  characterId?: string;
}

export function CharacterImageUpload({ 
  onImageUpload, 
  onImageDelete,
  currentImageUrl,
  disabled = false,
  characterId 
}: CharacterImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error!);
      return;
    }
    
    uploadImage(file);
  };

  const uploadImage = async (file: File) => {
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error('認証エラー');
      }

      const tempCharacterId = characterId || `temp_character_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Cloudflare ImagesのダイレクトアップロードURLを取得
      const uploadResponse = await fetch('/api/characters/image/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          characterId: tempCharacterId,
        }),
      });

      if (!uploadResponse.ok) {
        throw new Error('アップロードURLの取得に失敗しました');
      }

      const { uploadURL, imageId, imageUrl } = await uploadResponse.json();

      // Cloudflare Imagesにフォームデータとして直接アップロード
      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          onImageUpload(imageUrl, imageId);
          toast.success('画像をアップロードしました');
        } else {
          throw new Error('画像のアップロードに失敗しました');
        }
        setIsUploading(false);
      };

      xhr.onerror = () => {
        throw new Error('画像のアップロードに失敗しました');
      };

      xhr.open('POST', uploadURL);
      xhr.send(formData);

    } catch (error) {
      console.error('Image upload error:', error);
      toast.error(error instanceof Error ? error.message : '画像のアップロードに失敗しました');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteImage = () => {
    if (onImageDelete) {
      onImageDelete();
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* アップロード済み画像プレビュー（大きなサイズ） */}
      {currentImageUrl && !isUploading && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex flex-col space-y-4">
            {/* 画像表示エリア */}
            <div className="flex justify-center">
              <div className="relative">
                <img
                  src={currentImageUrl}
                  alt="キャラクター画像"
                  className="max-w-full object-contain rounded-lg shadow-md"
                />
              </div>
            </div>
            
            {/* 画像情報とボタン */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-900">
                  キャラクター画像
                </p>
                <p className="text-xs text-green-700">
                  アップロード済み
                </p>
              </div>
              {onImageDelete && (
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
        </div>
      )}

      {/* アップロードエリア */}
      {!currentImageUrl && (
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-12 text-center transition-colors
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
            accept="image/*"
            onChange={handleChange}
            className="hidden"
            disabled={disabled || isUploading}
          />
          
          {isUploading ? (
            <div className="flex flex-col items-center">
              <Spinner size="lg" />
              <p className="mt-4 text-base text-gray-600">画像をアップロード中...</p>
              <div className="w-full max-w-sm mt-4 bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 mt-2">{uploadProgress}%</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Image size={48} className="text-gray-400 mb-4" />
              <p className="text-lg text-gray-600 mb-2">
                キャラクター画像をアップロード
              </p>
              <p className="text-sm text-gray-500 mb-2">
                クリックまたはドラッグ&ドロップ
              </p>
              <p className="text-xs text-gray-500">
                JPEG、PNG、GIF、WebP（最大10MB）
              </p>
              <p className="text-xs text-gray-400 mt-2">
                ※ 画像は原寸大で表示されます
              </p>
            </div>
          )}
        </div>
      )}

      {/* 削除確認モーダル */}
      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteImage}
        title="キャラクター画像を削除"
        message="この画像を削除しますか？この操作は取り消せません。"
        isDeleting={false}
      />
    </div>
  );
}