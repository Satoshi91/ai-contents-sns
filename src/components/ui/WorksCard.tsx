'use client';

import { Work } from '@/types/work';
import { Heart, User } from 'lucide-react';
import { AudioPlayer } from './AudioPlayer';
import Image from 'next/image';

interface WorksCardProps {
  work: Work;
  onLike?: (workId: string, currentLikeCount: number) => void;
  onUserClick?: (username: string) => void;
  onWorkClick?: (workId: string) => void;
  isLiked?: boolean;
  likeCount?: number;
  isLikeLoading?: boolean;
}

export function WorksCard({ 
  work, 
  onLike, 
  onUserClick, 
  onWorkClick, 
  isLiked = false, 
  likeCount, 
  isLikeLoading = false 
}: WorksCardProps) {
  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLikeLoading) {
      const currentCount = likeCount !== undefined ? likeCount : work.likeCount;
      onLike?.(work.id, currentCount);
    }
  };

  const displayLikeCount = likeCount !== undefined ? likeCount : work.likeCount;

  const handleUserClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUserClick?.(work.username);
  };

  const handleWorkClick = () => {
    onWorkClick?.(work.id);
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200"
      onClick={handleWorkClick}
    >
      {/* サムネイル画像 */}
      <div className="aspect-square bg-gray-200 relative">
        {/* TODO: 実際の画像URLが追加されたら置き換え */}
        <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
          <span className="text-gray-400 text-sm">画像</span>
        </div>
      </div>

      {/* コンテンツ */}
      <div className="p-4">
        {/* タイトル */}
        <h3 className="font-medium text-gray-900 mb-3 line-clamp-2">
          {work.title}
        </h3>

        {/* 音声プレーヤー */}
        {work.audioUrl && (
          <div className="mb-3" onClick={(e) => e.stopPropagation()}>
            <AudioPlayer 
              audioUrl={work.audioUrl}
              title={work.title}
              showTitle={false}
              className="bg-gray-100"
            />
          </div>
        )}

        {/* ユーザー情報といいね */}
        <div className="flex items-center justify-between">
          <div 
            className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity duration-200"
            onClick={handleUserClick}
          >
            {/* ユーザーアイコン */}
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
              {work.userPhotoURL ? (
                <Image
                  src={work.userPhotoURL}
                  alt={work.displayName}
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={16} className="text-gray-500" />
              )}
            </div>

            {/* ユーザー名 */}
            <span className="text-sm text-gray-600 font-medium">
              {work.displayName}
            </span>
          </div>

          {/* いいねボタン */}
          <button
            onClick={handleLikeClick}
            disabled={isLikeLoading}
            className={`flex items-center space-x-1 transition-colors duration-200 ${
              isLikeLoading 
                ? 'text-gray-400 cursor-not-allowed' 
                : isLiked 
                ? 'text-red-500 hover:text-red-600' 
                : 'text-gray-500 hover:text-red-500'
            }`}
          >
            <Heart 
              size={16} 
              className={`transition-all duration-200 ${
                isLikeLoading 
                  ? 'cursor-not-allowed' 
                  : 'cursor-pointer hover:scale-110'
              } ${isLiked ? 'fill-current' : ''}`}
            />
            <span className="text-sm">{displayLikeCount}</span>
          </button>
        </div>
      </div>
    </div>
  );
}