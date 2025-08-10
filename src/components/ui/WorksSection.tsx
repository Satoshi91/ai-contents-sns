'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Grid, List } from 'lucide-react';
import { WorksCategory, WorksSectionConfig, WorksGridConfig } from '@/types/worksSection';
import { WorksList } from '@/components/ui/WorksList';
import { useWorksSection } from '@/lib/hooks/useWorksSection';

interface WorksSectionProps {
  title: string;
  category: WorksCategory;
  config?: Partial<WorksSectionConfig>;
  
  // 表示制御
  layout?: 'grid' | 'list';
  showHeader?: boolean;
  showMoreHref?: string;
  showMoreLabel?: string;
  showViewToggle?: boolean;
  skipR18Filter?: boolean; // R-18フィルタを無効にする
  
  // レイアウトカスタマイズ
  gridCols?: WorksGridConfig;
  className?: string;
  
  // 編集機能
  currentUserId?: string;
  onEditClick?: (workId: string) => void;
  
  // イベントハンドラ
  onMoreClick?: () => void;
  onLike?: (workId: string, currentLikeCount: number) => void;
  onUserClick?: (username: string) => void;
  onWorkClick?: (workId: string) => void;
  onTagClick?: (tagName: string) => void;
  likeStates?: Record<string, { isLiked: boolean; likeCount?: number; isLoading?: boolean }>;
  isWorkLiked?: (workId: string) => boolean;
}

export const WorksSection = React.memo(function WorksSection({
  title,
  category,
  config = {},
  layout = 'grid',
  showHeader = true,
  showMoreHref,
  showMoreLabel = 'もっと見る',
  showViewToggle = true,
  skipR18Filter = false,
  gridCols,
  className = '',
  currentUserId,
  onEditClick,
  onMoreClick,
  onLike,
  onUserClick,
  onWorkClick,
  onTagClick,
  likeStates = {},
  isWorkLiked
}: WorksSectionProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(layout);

  const {
    works,
    loading,
    error,
    refetch
  } = useWorksSection({
    category,
    config,
    enabled: true,
    skipR18Filter
  });

  const renderHeader = () => {
    if (!showHeader) return null;
    
    return (
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          {title}
        </h2>
        
        <div className="flex items-center space-x-4">
          {/* ビュー切り替えボタン */}
          {showViewToggle && (
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-all duration-200 cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
                title="グリッド表示"
              >
                <Grid size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-all duration-200 cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
                title="リスト表示"
              >
                <List size={16} />
              </button>
            </div>
          )}

          {/* もっと見るリンク */}
          {(showMoreHref || onMoreClick) && works.length > 0 && (
            showMoreHref ? (
              <Link 
                href={showMoreHref} 
                className="text-blue-600 hover:text-blue-700 text-sm font-medium cursor-pointer hover:underline transition-colors duration-200"
              >
                {showMoreLabel}
              </Link>
            ) : (
              <button 
                onClick={onMoreClick}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium cursor-pointer hover:underline transition-colors duration-200"
              >
                {showMoreLabel}
              </button>
            )
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`${className}`}>
      {renderHeader()}
      
      <WorksList
        works={works}
        loading={loading}
        error={error}
        layout={viewMode}
        gridCols={gridCols}
        playlistTitle={title}
        playlistCategory={category}
        playlistUserId={config.userId}
        currentUserId={currentUserId}
        onEditClick={onEditClick}
        onLike={onLike}
        onUserClick={onUserClick}
        onWorkClick={onWorkClick}
        onTagClick={onTagClick}
        likeStates={likeStates}
        isWorkLiked={isWorkLiked}
        emptyMessage={`${title}はまだありません`}
      />
    </div>
  );
});