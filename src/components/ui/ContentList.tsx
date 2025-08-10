'use client';

import { useState, useEffect } from 'react';
import { Content, ContentType } from '@/types/content';
import { ContentCard } from '@/components/ui/ContentCard';
import { Button } from '@/components/ui/Button';
import { getAllContents, getUserContents } from '@/lib/firebase/contents';
import { DocumentSnapshot } from 'firebase/firestore';

interface ContentListProps {
  contentType?: ContentType;
  userId?: string;
  className?: string;
}

export function ContentList({ contentType, userId, className = '' }: ContentListProps) {
  const [contents, setContents] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | undefined>();
  const [error, setError] = useState<string | null>(null);

  const loadContents = async (isInitial: boolean = false) => {
    try {
      if (isInitial) {
        setIsLoading(true);
        setError(null);
      } else {
        setIsLoadingMore(true);
      }

      const newContents = userId
        ? await getUserContents(userId, contentType, 10, isInitial ? undefined : lastDoc)
        : await getAllContents(contentType, 10, isInitial ? undefined : lastDoc);

      if (isInitial) {
        setContents(newContents);
      } else {
        setContents(prev => [...prev, ...newContents]);
      }

      // Check if there are more contents to load
      setHasMore(newContents.length === 10);
      
      // TODO: Get lastDoc from Firebase query
      // This is a simplified implementation - you would need to modify the Firebase functions
      // to return the DocumentSnapshot for pagination
      
    } catch (error) {
      console.error('コンテンツ取得エラー:', error);
      setError('コンテンツの取得に失敗しました');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    loadContents(true);
  }, [contentType, userId]);

  const handleLike = async (contentId: string) => {
    // TODO: Implement like functionality
    console.log('Like content:', contentId);
  };

  const handleComment = async (contentId: string) => {
    // TODO: Implement comment functionality
    console.log('Comment on content:', contentId);
  };

  const handleShare = async (contentId: string) => {
    // TODO: Implement share functionality
    console.log('Share content:', contentId);
  };

  const handlePlay = async (contentId: string) => {
    // TODO: Implement global audio player functionality
    console.log('Play content:', contentId);
  };

  const loadMore = () => {
    if (!isLoadingMore && hasMore) {
      loadContents(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(3)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse">
            <div className="flex items-start space-x-3 mb-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-red-600 mb-4">{error}</p>
        <Button
          onClick={() => loadContents(true)}
          variant="outline"
          className="cursor-pointer"
        >
          再試行
        </Button>
      </div>
    );
  }

  if (contents.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <p>コンテンツがありません</p>
        {userId && (
          <p className="text-sm mt-2">まだコンテンツが投稿されていません</p>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-4">
        {contents.map((content) => (
          <ContentCard
            key={content.id}
            content={content}
            onLike={handleLike}
            onComment={handleComment}
            onShare={handleShare}
            onPlay={handlePlay}
            isLiked={false} // TODO: Implement like status check
          />
        ))}
      </div>

      {/* Load more button */}
      {hasMore && (
        <div className="text-center mt-6">
          <Button
            onClick={loadMore}
            disabled={isLoadingMore}
            variant="outline"
            className="cursor-pointer"
          >
            {isLoadingMore ? '読み込み中...' : 'さらに読み込む'}
          </Button>
        </div>
      )}
    </div>
  );
}