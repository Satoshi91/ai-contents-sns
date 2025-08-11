'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Eye, Heart, Star, Download, Plus } from 'lucide-react';
import { ImageDocument } from '@/types/image';
import { ImageEventHandlers } from '@/types/imageSection';

interface ImageCardProps {
  image: ImageDocument;
  layout?: 'grid' | 'masonry';
  showPrompt?: boolean;
  showMetadata?: boolean;
  showStats?: boolean;
  showActions?: boolean;
  onImageClick?: (imageId: string) => void;
  onAddVoice?: (imageId: string) => void;
  onFavorite?: (imageId: string) => void;
  className?: string;
}

export function ImageCard({
  image,
  layout = 'masonry',
  showPrompt = false,
  showMetadata = false,
  showStats = true,
  showActions = true,
  onImageClick,
  onAddVoice,
  onFavorite,
  className = ''
}: ImageCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [useOptimized, setUseOptimized] = useState(true);

  const handleImageClick = () => {
    if (onImageClick) {
      onImageClick(image.id || '');
    }
  };

  const handleAddVoice = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddVoice && image.id) {
      onAddVoice(image.id);
    }
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onFavorite && image.id) {
      onFavorite(image.id);
    }
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    // 最適化URLでエラーが発生した場合、元のURLを試行
    if (useOptimized && imageUrl && imageUrl !== optimizedImageUrl) {
      setUseOptimized(false);
      setIsLoading(true);
      return; // エラー状態にはしない、フォールバックを試行
    }
    
    // 元のURLでもエラーの場合、完全にエラー状態にする
    setImageError(true);
    setIsLoading(false);
  };

  // 画像URLが有効かチェック
  const imageUrl = image.image_data.storage_url;
  const isValidUrl = imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'));


  // Cloudflare Images URLの場合は最適化
  const optimizedImageUrl = isValidUrl && imageUrl.includes('imagedelivery.net') 
    ? `${imageUrl}/w=400,h=600,fit=cover,quality=85`
    : imageUrl;
  
  // 使用するURLを決定（フォールバック考慮）
  const finalImageUrl = useOptimized ? optimizedImageUrl : imageUrl;


  return (
    <div 
      className={`
        group relative bg-white rounded-lg overflow-hidden shadow-md 
        cursor-pointer hover:shadow-lg hover:scale-105 
        transition-all duration-200 border border-gray-100
        ${className}
      `}
      onClick={handleImageClick}
    >
      {/* メイン画像 */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        {!imageError && isValidUrl ? (
          <Image
            src={finalImageUrl}
            alt={image.image_data.original_filename || 'Generated image'}
            width={400}
            height={layout === 'masonry' ? 600 : 300}
            className={`
              w-full object-cover transition-opacity duration-200
              ${layout === 'masonry' ? 'h-auto' : 'h-48'}
              ${isLoading ? 'opacity-0' : 'opacity-100'}
            `}
            onLoad={handleImageLoad}
            onError={handleImageError}
            unoptimized={!useOptimized || !imageUrl?.includes('imagedelivery.net')}
            key={`${image.id}-${useOptimized}`}
          />
        ) : (
          <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
            <span className="text-gray-500 text-sm">画像なし</span>
          </div>
        )}

        {/* オーバーレイアクション */}
        {showActions && (
          <div className="absolute bottom-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
            <button
              onClick={handleAddVoice}
              className="w-12 h-12 bg-white text-blue-600 rounded-full shadow-lg cursor-pointer hover:scale-110 hover:bg-white transition-all duration-200 flex items-center justify-center"
              title="ボイスを追加"
            >
              <Plus size={20} />
            </button>
            <button
              onClick={handleFavorite}
              className="w-12 h-12 bg-white text-red-600 rounded-full shadow-lg cursor-pointer hover:scale-110 hover:bg-white transition-all duration-200 flex items-center justify-center"
              title="お気に入りに追加"
            >
              <Heart size={20} />
            </button>
          </div>
        )}

        {/* レーティング表示 */}
        {image.image_data.rating && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-black bg-opacity-70 text-white text-xs rounded-full">
            <Star size={12} className="inline mr-1" />
            {image.image_data.rating}
          </div>
        )}
      </div>

      {/* カード情報 */}
      <div className="p-3">
        {/* プロンプト表示 */}
        {showPrompt && image.image_data.prompt && (
          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
            {image.image_data.prompt}
          </p>
        )}

        {/* ファイル名 */}
        {image.image_data.original_filename && (
          <p className="text-sm font-medium text-gray-800 truncate mb-1">
            {image.image_data.original_filename.replace(/\.[^/.]+$/, '')}
          </p>
        )}

        {/* 統計情報 */}
        {showStats && (
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-3">
              {image.image_data.views && (
                <div className="flex items-center">
                  <Eye size={12} className="mr-1" />
                  {image.image_data.views.toLocaleString()}
                </div>
              )}
            </div>
            
            {/* 作成日時 */}
            {image.image_data.created_at && (
              <div className="text-gray-400">
                {new Date(image.image_data.created_at).toLocaleDateString('ja-JP', {
                  month: 'short',
                  day: 'numeric'
                })}
              </div>
            )}
          </div>
        )}

        {/* メタデータ表示 */}
        {showMetadata && image.image_data.edit_parameters && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="text-xs text-gray-500 space-y-1">
              {image.image_data.edit_parameters.brightness !== undefined && (
                <div>明度: {image.image_data.edit_parameters.brightness}</div>
              )}
              {image.image_data.edit_parameters.saturation !== undefined && (
                <div>彩度: {image.image_data.edit_parameters.saturation}</div>
              )}
              {image.image_data.edit_parameters.upscale_factor !== undefined && (
                <div>拡大率: {image.image_data.edit_parameters.upscale_factor}x</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// メモ化されたコンポーネント
export const MemoizedImageCard = React.memo(ImageCard);