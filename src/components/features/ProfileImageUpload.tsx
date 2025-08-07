'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Upload, X, Camera } from 'lucide-react';
import { getImageURL } from '@/lib/cloudflare/images';
import { auth } from '@/lib/firebase/app';
import toast from 'react-hot-toast';

interface ProfileImageUploadProps {
  currentImageId: string | null;
  userId: string;
  onImageUpdate: (imageId: string) => void;
}

export function ProfileImageUpload({ currentImageId, userId, onImageUpdate }: ProfileImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentImageUrl = currentImageId?.includes('profile-')
    ? getImageURL(currentImageId, 'profile')
    : currentImageId;

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('画像ファイルを選択してください');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('ファイルサイズは10MB以下にしてください');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    uploadImage(file);
  };

  const uploadImage = async (file: File) => {
    setIsUploading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error('認証エラー');
      }

      const uploadResponse = await fetch('/api/profile/image/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('アップロードURLの取得に失敗しました');
      }

      const { uploadURL, imageId } = await uploadResponse.json();

      const formData = new FormData();
      formData.append('file', file);

      const cloudflareResponse = await fetch(uploadURL, {
        method: 'POST',
        body: formData,
      });

      if (!cloudflareResponse.ok) {
        throw new Error('画像のアップロードに失敗しました');
      }

      onImageUpdate(imageId);
      toast.success('画像をアップロードしました');
      setPreview(null);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('画像のアップロードに失敗しました');
      setPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePreview = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <Avatar
          src={preview || currentImageUrl}
          alt="プロフィール画像"
          size="xl"
        />
        
        <div className="flex-1">
          <div
            className={`
              relative border-2 border-dashed rounded-lg p-4 text-center
              ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
              ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'}
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleChange}
              className="hidden"
              disabled={isUploading}
            />
            
            {isUploading ? (
              <div className="flex flex-col items-center">
                <Spinner size="md" />
                <p className="mt-2 text-sm text-gray-600">アップロード中...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload size={24} className="text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">
                  クリックまたはドラッグ&ドロップ
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  JPG、PNG、WebP（最大10MB）
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {preview && !isUploading && (
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            新しい画像がプレビューされています
          </p>
          <button
            type="button"
            onClick={handleRemovePreview}
            className="text-blue-700 hover:text-blue-900"
          >
            <X size={18} />
          </button>
        </div>
      )}
    </div>
  );
}