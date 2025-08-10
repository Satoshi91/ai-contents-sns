'use client';

import { Work } from '@/types/work';
import { WorksCategory } from '@/types/worksSection';
import { Heart, User, Play, Pause, Edit } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { useAudioPlayer } from '@/components/features/GlobalAudioPlayer/hooks/useAudioPlayer';
import { getWorkImageURL, getImageURL } from '@/lib/cloudflare/images';
import { TagDisplay } from './TagDisplay';

interface WorksCardProps {
  work: Work;
  
  // レイアウト
  layout?: 'grid' | 'list';
  
  // プレイリスト情報（新機能）
  works?: Work[];              // 同じセクション内の全作品リスト
  playlistTitle?: string;      // プレイリストタイトル
  playlistCategory?: WorksCategory; // カテゴリ
  playlistUserId?: string;     // ユーザーID（user/followingカテゴリ用）
  
  // 編集機能
  currentUserId?: string;      // 現在のユーザーID
  onEditClick?: (workId: string) => void;
  
  onLike?: (workId: string, currentLikeCount: number) => void;
  onUserClick?: (username: string) => void;
  onWorkClick?: (workId: string) => void;
  onTagClick?: (tagName: string) => void;
  isLiked?: boolean;
  likeCount?: number;
  isLikeLoading?: boolean;
}

export function WorksCard({ 
  work, 
  layout = 'grid',
  works,
  playlistTitle,
  playlistCategory,
  playlistUserId,
  currentUserId,
  onEditClick,
  onLike, 
  onUserClick, 
  onWorkClick,
  onTagClick,
  isLiked = false, 
  likeCount, 
  isLikeLoading = false 
}: WorksCardProps) {
  const { 
    startPlay, 
    startPlayWithPlaylist, 
    isTrackPlaying, 
    isTrackCurrent, 
    togglePlay 
  } = useAudioPlayer();
  const [imageError, setImageError] = useState(false);
  const [userImageError, setUserImageError] = useState(false);
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

  // コンテンツタイプに応じた表示情報を取得
  const getContentTypeInfo = () => {
    const contentType = work.contentType || 'legacy';
    
    switch (contentType) {
      case 'voice':
        return {
          label: 'ボイス',
          icon: '🎤',
          primaryContent: 'audio'
        };
      case 'script':
        return {
          label: 'スクリプト',
          icon: '📝',
          primaryContent: 'script'
        };
      case 'image':
        return {
          label: 'イラスト',
          icon: '🎨',
          primaryContent: 'image'
        };
      case 'mixed':
        return {
          label: '複合作品',
          icon: '🎭',
          primaryContent: 'mixed'
        };
      case 'legacy':
      default:
        return {
          label: '作品',
          icon: '🎭',
          primaryContent: 'mixed'
        };
    }
  };

  const contentTypeInfo = getContentTypeInfo();

  const handleWorkClick = () => {
    onWorkClick?.(work.id);
  };
  
  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEditClick?.(work.id);
  };
  
  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isTrackCurrent(work.id)) {
      togglePlay();
    } else {
      // プレイリスト情報がある場合はプレイリスト再生、ない場合は単曲再生
      if (works && playlistCategory && playlistTitle) {
        startPlayWithPlaylist(
          work,
          works,
          playlistTitle,
          playlistCategory,
          playlistUserId
        );
      } else {
        startPlay(work);
      }
    }
  };

  if (layout === 'list') {
    // リスト表示レイアウト
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200" onClick={handleWorkClick}>
        <div className="flex">
          {/* サムネイル画像 */}
          <div className="w-32 h-32 bg-gray-200 relative group flex-shrink-0">
            {work.imageUrl && work.imageId && !imageError ? (
              <Image
                src={getWorkImageURL(work.imageId, 'gallery')}
                alt={work.title}
                width={128}
                height={128}
                className="w-full h-full object-cover group-hover:brightness-75 transition-all duration-200"
                onError={() => setImageError(true)}
              />
            ) : work.imageUrl && !imageError ? (
              <Image
                src={work.imageUrl}
                alt={work.title}
                width={128}
                height={128}
                className="w-full h-full object-cover group-hover:brightness-75 transition-all duration-200"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className={`w-full h-full flex items-center justify-center group-hover:brightness-75 transition-all duration-200 ${
                contentTypeInfo.primaryContent === 'script' 
                  ? 'bg-gradient-to-br from-green-100 to-teal-100' 
                  : contentTypeInfo.primaryContent === 'audio'
                  ? 'bg-gradient-to-br from-purple-100 to-pink-100'
                  : 'bg-gradient-to-br from-blue-100 to-purple-100'
              }`}>
                <div className="text-center">
                  <div className="text-lg mb-1">{contentTypeInfo.icon}</div>
                  <span className="text-gray-500 text-xs">{contentTypeInfo.label}</span>
                </div>
              </div>
            )}
            
            {/* 再生ボタン */}
            {work.audioUrl && (
              <button
                onClick={handlePlayClick}
                className={`absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-all duration-200 opacity-0 group-hover:opacity-70 ${
                  isTrackCurrent(work.id) && isTrackPlaying(work.id) 
                    ? 'bg-white text-blue-600' 
                    : 'bg-white text-gray-700 hover:bg-white'
                }`}
              >
                {isTrackCurrent(work.id) && isTrackPlaying(work.id) ? (
                  <Pause size={16} />
                ) : (
                  <Play size={16} className="ml-0.5" />
                )}
              </button>
            )}
            
            {/* 再生中インジケーター */}
            {isTrackCurrent(work.id) && (
              <div className="absolute top-2 right-2">
                {isTrackPlaying(work.id) ? (
                  <div className="flex items-center space-x-0.5">
                    <div className="w-1 h-2 bg-green-500 rounded-sm animate-pulse"></div>
                    <div className="w-1 h-3 bg-green-500 rounded-sm animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-1 h-2 bg-green-500 rounded-sm animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                ) : (
                  <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                )}
              </div>
            )}
          </div>

          {/* コンテンツ */}
          <div className="flex-1 p-4 min-w-0">
            <div className="flex flex-col h-full">
              {/* タイトル */}
              <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
                {work.title}
              </h3>

              {/* バッジとタグ */}
              {(work.contentRating === '18+' || contentTypeInfo.label !== '作品' || (work.tags && work.tags.length > 0)) && (
                <div className="mb-3">
                  <div className="flex flex-wrap gap-1.5">
                    {/* コンテンツタイプバッジ */}
                    {contentTypeInfo.label !== '作品' && (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full cursor-default">
                        {contentTypeInfo.icon} {contentTypeInfo.label}
                      </span>
                    )}
                    
                    {/* R-18バッジ */}
                    {work.contentRating === '18+' && (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-bold text-white bg-pink-300 rounded-full cursor-default">
                        R-18
                      </span>
                    )}
                    
                    {/* 通常のタグ */}
                    {work.tags && work.tags.length > 0 && (
                      <>
                        {work.tags.slice(0, 2).map((tag) => (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onTagClick?.(tag.name);
                            }}
                            className={`
                              px-2 py-1 text-xs
                              inline-flex items-center rounded-full
                              bg-blue-50 text-blue-700 border border-blue-200
                              ${onTagClick ? 'cursor-pointer hover:bg-blue-100 hover:border-blue-300 transition-colors duration-200' : 'cursor-default'}
                              font-medium
                            `}
                            style={{ backgroundColor: `${tag.color}20`, borderColor: `${tag.color}40`, color: tag.color }}
                            disabled={!onTagClick}
                          >
                            #{tag.name}
                          </button>
                        ))}
                        {work.tags.length > 2 && (
                          <span className="px-2 py-1 text-xs text-gray-500">
                            +{work.tags.length - 2}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* ユーザー情報といいね */}
              <div className="flex items-center justify-between mt-auto">
                {/* 自分の作品の場合は編集ボタン、他人の作品の場合はユーザー情報を表示 */}
                {currentUserId && work.uid === currentUserId ? (
                  <button
                    onClick={handleEditClick}
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 cursor-pointer hover:bg-blue-50 px-2 py-1 rounded transition-all duration-200"
                  >
                    <Edit size={16} />
                    <span className="text-sm font-medium">編集</span>
                  </button>
                ) : (
                  <div 
                    className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity duration-200"
                    onClick={handleUserClick}
                  >
                    {/* ユーザーアイコン */}
                    <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                      {work.userPhotoURL && !userImageError ? (
                        <Image
                          src={work.userPhotoURL}
                          alt={work.displayName}
                          width={24}
                          height={24}
                          className="w-full h-full object-cover"
                          onError={() => setUserImageError(true)}
                        />
                      ) : (
                        <User size={14} className="text-gray-500" />
                      )}
                    </div>

                    {/* ユーザー名 */}
                    <span className="text-sm text-gray-600 font-medium">
                      {work.displayName}
                    </span>
                  </div>
                )}

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
        </div>
      </div>
    );
  }

  // グリッド表示レイアウト（デフォルト）
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* サムネイル画像 */}
      <div 
        className="aspect-square bg-gray-200 relative cursor-pointer hover:shadow-lg group transition-all duration-200"
        onClick={handleWorkClick}
      >
        {work.imageUrl && work.imageId && !imageError ? (
          <Image
            src={getWorkImageURL(work.imageId, 'gallery')}
            alt={work.title}
            width={300}
            height={300}
            className="w-full h-full object-cover group-hover:brightness-75 transition-all duration-200"
            onError={() => setImageError(true)}
          />
        ) : work.imageUrl && !imageError ? (
          <Image
            src={work.imageUrl}
            alt={work.title}
            width={400}
            height={400}
            className="w-full h-full object-cover group-hover:brightness-75 transition-all duration-200"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center group-hover:brightness-75 transition-all duration-200 ${
            contentTypeInfo.primaryContent === 'script' 
              ? 'bg-gradient-to-br from-green-100 to-teal-100' 
              : contentTypeInfo.primaryContent === 'audio'
              ? 'bg-gradient-to-br from-purple-100 to-pink-100'
              : 'bg-gradient-to-br from-blue-100 to-purple-100'
          }`}>
            <div className="text-center">
              <div className="text-2xl mb-1">{contentTypeInfo.icon}</div>
              <span className="text-gray-500 text-sm">{contentTypeInfo.label}</span>
            </div>
          </div>
        )}
        
        {/* 左上のコンテンツタイプバッジ */}
        {contentTypeInfo.label !== '作品' && (
          <div className="absolute top-2 left-2">
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-white bg-black bg-opacity-60 rounded-full">
              {contentTypeInfo.icon} {contentTypeInfo.label}
            </span>
          </div>
        )}
        
        {/* 右下の再生ボタン */}
        {work.audioUrl && (
          <button
            onClick={handlePlayClick}
            className={`absolute bottom-3 right-3 w-15 h-15 rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-all duration-200 opacity-0 group-hover:opacity-70 ${
              isTrackCurrent(work.id) && isTrackPlaying(work.id) 
                ? 'bg-white text-blue-600' 
                : 'bg-white text-gray-700 hover:bg-white'
            }`}
          >
            {isTrackCurrent(work.id) && isTrackPlaying(work.id) ? (
              <Pause size={24} />
            ) : (
              <Play size={24} className="ml-0.5" />
            )}
          </button>
        )}
        
        {/* 再生中インジケーター */}
        {isTrackCurrent(work.id) && (
          <div className="absolute top-3 right-3">
            {isTrackPlaying(work.id) ? (
              <div className="flex items-center space-x-0.5">
                <div className="w-1 h-2 bg-green-500 rounded-sm animate-pulse"></div>
                <div className="w-1 h-3 bg-green-500 rounded-sm animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-1 h-2 bg-green-500 rounded-sm animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              </div>
            ) : (
              <div className="w-3 h-3 rounded-full bg-gray-400"></div>
            )}
          </div>
        )}
      </div>

      {/* コンテンツ */}
      <div className="p-4">
        {/* タイトル */}
        <h3 className="font-medium text-gray-900 mb-3 line-clamp-2">
          {work.title}
        </h3>

        {/* タグ（R-18表示含む） */}
        {(work.contentRating === '18+' || (work.tags && work.tags.length > 0)) && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1.5">
              {/* R-18バッジ */}
              {work.contentRating === '18+' && (
                <span className="inline-flex items-center px-2 py-1 text-xs font-bold text-white bg-pink-300 rounded-full cursor-default">
                  R-18
                </span>
              )}
              
              {/* 通常のタグ */}
              {work.tags && work.tags.length > 0 && (
                <>
                  {work.tags.slice(0, 3).map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTagClick?.(tag.name);
                      }}
                      className={`
                        px-2 py-1 text-xs
                        inline-flex items-center rounded-full
                        bg-blue-50 text-blue-700 border border-blue-200
                        ${onTagClick ? 'cursor-pointer hover:bg-blue-100 hover:border-blue-300 transition-colors duration-200' : 'cursor-default'}
                        font-medium
                      `}
                      style={{ backgroundColor: `${tag.color}20`, borderColor: `${tag.color}40`, color: tag.color }}
                      disabled={!onTagClick}
                    >
                      #{tag.name}
                    </button>
                  ))}
                  {work.tags.length > 3 && (
                    <span className="px-2 py-1 text-xs text-gray-500">
                      +{work.tags.length - 3}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        )}


        {/* ユーザー情報といいね */}
        <div className="flex items-center justify-between">
          {/* 自分の作品の場合は編集ボタン、他人の作品の場合はユーザー情報を表示 */}
          {currentUserId && work.uid === currentUserId ? (
            <button
              onClick={handleEditClick}
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 cursor-pointer hover:bg-blue-50 px-2 py-1 rounded transition-all duration-200"
            >
              <Edit size={16} />
              <span className="text-sm font-medium">編集</span>
            </button>
          ) : (
            <div 
              className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity duration-200"
              onClick={handleUserClick}
            >
              {/* ユーザーアイコン */}
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                {work.userPhotoURL && !userImageError ? (
                  <Image
                    src={work.userPhotoURL}
                    alt={work.displayName}
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                    onError={() => setUserImageError(true)}
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
          )}

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