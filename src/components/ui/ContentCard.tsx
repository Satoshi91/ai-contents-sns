'use client';

import { Content } from '@/types/content';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Heart, MessageCircle, Share, Play, FileText, Image, Mic } from 'lucide-react';
import { useState } from 'react';

interface ContentCardProps {
  content: Content;
  onLike?: (contentId: string) => void;
  onComment?: (contentId: string) => void;
  onShare?: (contentId: string) => void;
  onPlay?: (contentId: string) => void;
  isLiked?: boolean;
  className?: string;
}

const ContentTypeIcon = ({ type }: { type: Content['type'] }) => {
  const iconProps = { size: 16, className: 'text-gray-500' };
  
  switch (type) {
    case 'voice':
      return <Mic {...iconProps} />;
    case 'script':
      return <FileText {...iconProps} />;
    case 'image':
      return <Image {...iconProps} />;
    case 'work':
      return <Play {...iconProps} />;
    default:
      return null;
  }
};

const getContentTypeLabel = (type: Content['type']) => {
  switch (type) {
    case 'voice':
      return 'ボイス';
    case 'script':
      return 'スクリプト';
    case 'image':
      return 'イラスト';
    case 'work':
      return '作品';
    default:
      return type;
  }
};

export function ContentCard({
  content,
  onLike,
  onComment,
  onShare,
  onPlay,
  isLiked = false,
  className = ''
}: ContentCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  
  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return '今';
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}分`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)}時間`;
    } else if (diffInSeconds < 2592000) {
      return `${Math.floor(diffInSeconds / 86400)}日`;
    } else {
      return date.toLocaleDateString('ja-JP');
    }
  };

  const handlePlay = () => {
    if (content.type === 'voice' && content.audioUrl) {
      setIsPlaying(!isPlaying);
      onPlay?.(content.id);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200 ${className}`}>
      {/* ヘッダー */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <Avatar
            photoURL={content.userPhotoURL}
            displayName={content.displayName}
            size="sm"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {content.displayName}
              </h3>
              <span className="text-sm text-gray-500">@{content.username}</span>
              <span className="text-sm text-gray-400">·</span>
              <span className="text-sm text-gray-500">{formatDate(content.createdAt)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          <ContentTypeIcon type={content.type} />
          <span>{getContentTypeLabel(content.type)}</span>
        </div>
      </div>

      {/* コンテンツタイトル */}
      <h2 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
        {content.title}
      </h2>

      {/* コンテンツ説明 */}
      {content.description && (
        <p className="text-gray-700 mb-3 line-clamp-3">
          {content.description}
        </p>
      )}

      {/* コンテンツタイプ別表示 */}
      <div className="mb-4">
        {content.type === 'voice' && content.audioUrl && (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button
                  onClick={handlePlay}
                  size="sm"
                  className={`rounded-full w-8 h-8 p-0 ${isPlaying ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} cursor-pointer transition-colors duration-200`}
                >
                  <Play size={14} className="text-white ml-0.5" />
                </Button>
                <span className="text-sm text-gray-700">
                  {content.audioOriginalFilename || 'audio.mp3'}
                </span>
              </div>
              {content.contentRating === '18+' && (
                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                  R-18
                </span>
              )}
            </div>
          </div>
        )}

        {content.type === 'script' && content.scriptText && (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-700 line-clamp-3">
              {content.scriptText}
            </div>
            {content.scriptText.length > 150 && (
              <button className="text-blue-600 text-sm mt-2 cursor-pointer hover:text-blue-700 transition-colors duration-200">
                続きを読む
              </button>
            )}
          </div>
        )}

        {content.type === 'image' && content.imageUrl && (
          <div className="bg-gray-50 rounded-lg overflow-hidden">
            <img
              src={content.imageUrl}
              alt={content.title}
              className="w-full h-48 object-cover cursor-pointer hover:opacity-95 transition-opacity duration-200"
            />
            {content.contentRating === '18+' && (
              <div className="p-2">
                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                  R-18
                </span>
              </div>
            )}
          </div>
        )}

        {content.type === 'work' && (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Play size={16} className="text-gray-600" />
                <span className="text-sm text-gray-700">
                  {content.relatedContentIds?.length || 0} つのコンテンツを含む作品
                </span>
              </div>
              {content.contentRating === '18+' && (
                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                  R-18
                </span>
              )}
            </div>
            
            {/* 関連コンテンツプレビュー */}
            {content.relatedContents && content.relatedContents.length > 0 && (
              <div className="space-y-2">
                {content.relatedContents.slice(0, 3).map((relatedContent) => (
                  <div key={relatedContent.id} className="flex items-center space-x-2 bg-white rounded p-2 border border-gray-200">
                    <ContentTypeIcon type={relatedContent.type} />
                    <span className="text-xs text-gray-600 truncate flex-1">
                      {relatedContent.title}
                    </span>
                    <span className="text-xs text-gray-500">
                      {getContentTypeLabel(relatedContent.type)}
                    </span>
                  </div>
                ))}
                {content.relatedContents.length > 3 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{content.relatedContents.length - 3} more
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* タグ */}
      {content.tags && content.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {content.tags.slice(0, 3).map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded cursor-pointer hover:bg-blue-200 transition-colors duration-200"
            >
              #{tag.name}
            </span>
          ))}
          {content.tags.length > 3 && (
            <span className="text-xs text-gray-500">
              +{content.tags.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* アクションボタン */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => onLike?.(content.id)}
            className={`flex items-center space-x-1 text-sm cursor-pointer transition-colors duration-200 ${
              isLiked
                ? 'text-red-500 hover:text-red-600'
                : 'text-gray-500 hover:text-red-500'
            }`}
          >
            <Heart size={16} className={isLiked ? 'fill-current' : ''} />
            <span>{content.likeCount}</span>
          </button>
          
          <button
            onClick={() => onComment?.(content.id)}
            className="flex items-center space-x-1 text-sm text-gray-500 cursor-pointer hover:text-blue-500 transition-colors duration-200"
          >
            <MessageCircle size={16} />
            <span>{content.commentCount || 0}</span>
          </button>
        </div>
        
        <button
          onClick={() => onShare?.(content.id)}
          className="flex items-center space-x-1 text-sm text-gray-500 cursor-pointer hover:text-green-500 transition-colors duration-200"
        >
          <Share size={16} />
          <span>共有</span>
        </button>
      </div>
    </div>
  );
}