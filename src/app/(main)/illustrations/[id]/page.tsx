'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  ArrowLeft, Heart, Share2, Download, Plus, Eye, Star,
  Copy, ExternalLink, Palette, Clock, Settings
} from 'lucide-react';
import { ImageDocument } from '@/types/image';
import { getImageById, getRelatedImages } from '@/lib/firebase/images';
import { MemoizedImageCard as ImageCard } from '@/components/ui/ImageCard';

export default function IllustrationDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [image, setImage] = useState<ImageDocument | null>(null);
  const [relatedImages, setRelatedImages] = useState<ImageDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  const imageId = Array.isArray(id) ? id[0] : id;

  useEffect(() => {
    const fetchImageData = async () => {
      if (!imageId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // メイン画像を取得
        const imageData = await getImageById(imageId);
        
        if (!imageData) {
          setError('イラストが見つかりませんでした');
          setImage(null);
          return;
        }

        setImage(imageData);
        
        // 関連画像を取得
        const related = await getRelatedImages(imageId, imageData.image_data.request_id);
        setRelatedImages(related);
        
      } catch (err) {
        console.error('イラスト取得エラー:', err);
        setError('イラストの読み込みに失敗しました');
        setImage(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchImageData();
  }, [imageId]);

  const handleBack = () => {
    router.back();
  };

  const handleAddVoice = () => {
    if (image?.id) {
      router.push(`/chat?imageId=${image.id}&mode=voice`);
    }
  };

  const handleFavorite = () => {
    // お気に入り機能（将来実装）
    console.log('お気に入りに追加:', image?.id);
  };

  const handleShare = async () => {
    if (navigator.share && image) {
      try {
        await navigator.share({
          title: image.image_data.original_filename || 'イラスト',
          text: image.image_data.prompt || 'AI生成イラスト',
          url: window.location.href
        });
      } catch (err) {
        console.log('共有がキャンセルされました');
      }
    } else {
      // フォールバック: URLをクリップボードにコピー
      await navigator.clipboard.writeText(window.location.href);
      alert('URLがクリップボードにコピーされました');
    }
  };

  const handleDownload = () => {
    if (image?.image_data.storage_url) {
      const link = document.createElement('a');
      link.href = image.image_data.storage_url;
      link.download = image.image_data.original_filename || 'illustration.jpg';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-gray-600">イラストを読み込み中...</div>
        </div>
      </div>
    );
  }

  if (error || !image) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-2">エラーが発生しました</div>
          <div className="text-gray-600 text-sm mb-4">{error}</div>
          <button 
            onClick={handleBack}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 cursor-pointer"
          >
            戻る
          </button>
        </div>
      </div>
    );
  }

  const imageUrl = image.image_data.storage_url;
  const isValidUrl = imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <button
              onClick={handleBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors duration-200 cursor-pointer"
            >
              <ArrowLeft size={20} />
              <span>戻る</span>
            </button>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleShare}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 cursor-pointer"
                title="共有"
              >
                <Share2 size={20} />
              </button>
              <button
                onClick={handleDownload}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 cursor-pointer"
                title="ダウンロード"
              >
                <Download size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* メイン画像 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {!imageError && isValidUrl ? (
                <Image
                  src={imageUrl}
                  alt={image.image_data.original_filename || 'Generated illustration'}
                  width={800}
                  height={1200}
                  className="w-full h-auto object-contain max-h-screen"
                  onError={() => setImageError(true)}
                  unoptimized={!imageUrl.includes('imagedelivery.net')}
                />
              ) : (
                <div className="w-full h-96 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500">画像を読み込めませんでした</span>
                </div>
              )}
            </div>
          </div>

          {/* サイドバー情報 */}
          <div className="space-y-6">
            {/* 基本情報 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h1 className="text-xl font-bold text-gray-900 mb-4">
                {image.image_data.original_filename?.replace(/\.[^/.]+$/, '') || 'イラスト'}
              </h1>

              {/* 統計情報 */}
              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                {image.image_data.views && (
                  <div className="flex items-center">
                    <Eye size={16} className="mr-1" />
                    {image.image_data.views.toLocaleString()}
                  </div>
                )}
                {image.image_data.rating && (
                  <div className="flex items-center">
                    <Star size={16} className="mr-1" />
                    {image.image_data.rating}
                  </div>
                )}
                {image.image_data.created_at && (
                  <div className="flex items-center">
                    <Clock size={16} className="mr-1" />
                    {new Date(image.image_data.created_at).toLocaleDateString('ja-JP')}
                  </div>
                )}
              </div>

              {/* アクションボタン */}
              <div className="space-y-3">
                <button
                  onClick={handleAddVoice}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 cursor-pointer flex items-center justify-center space-x-2"
                >
                  <Plus size={20} />
                  <span>ボイスを追加</span>
                </button>
                
                <button
                  onClick={handleFavorite}
                  className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors duration-200 cursor-pointer flex items-center justify-center space-x-2"
                >
                  <Heart size={20} />
                  <span>お気に入りに追加</span>
                </button>
              </div>
            </div>

            {/* プロンプト情報 */}
            {image.image_data.prompt && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">プロンプト</h2>
                <div className="bg-gray-50 rounded p-3 text-sm text-gray-700">
                  {image.image_data.prompt}
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(image.image_data.prompt || '')}
                  className="mt-2 text-blue-600 hover:text-blue-700 text-sm flex items-center cursor-pointer"
                >
                  <Copy size={14} className="mr-1" />
                  コピー
                </button>
              </div>
            )}

            {/* 生成パラメータ */}
            {image.image_data.edit_parameters && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">編集パラメータ</h2>
                <div className="space-y-2 text-sm">
                  {image.image_data.edit_parameters.brightness !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">明度:</span>
                      <span className="font-medium">{image.image_data.edit_parameters.brightness}</span>
                    </div>
                  )}
                  {image.image_data.edit_parameters.saturation !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">彩度:</span>
                      <span className="font-medium">{image.image_data.edit_parameters.saturation}</span>
                    </div>
                  )}
                  {image.image_data.edit_parameters.contrast !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">コントラスト:</span>
                      <span className="font-medium">{image.image_data.edit_parameters.contrast}</span>
                    </div>
                  )}
                  {image.image_data.edit_parameters.upscale_factor !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">拡大率:</span>
                      <span className="font-medium">{image.image_data.edit_parameters.upscale_factor}x</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 関連イラスト */}
        {relatedImages.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">関連イラスト</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {relatedImages.map((relatedImage) => (
                <ImageCard
                  key={relatedImage.id}
                  image={relatedImage}
                  layout="grid"
                  showStats={true}
                  showActions={true}
                  onImageClick={(id) => router.push(`/illustrations/${id}`)}
                  onAddVoice={handleAddVoice}
                  onFavorite={handleFavorite}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}