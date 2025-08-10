'use client';

import React from 'react';
import { Work } from '@/types/work';
import { WorksGridConfig, WorksCategory } from '@/types/worksSection';
import { WorksCard } from '@/components/ui/WorksCard';
import { Loader2 } from 'lucide-react';
import Masonry from 'react-masonry-css';

interface WorksListProps {
  works: Work[];
  loading?: boolean;
  error?: string | null;
  layout?: 'grid' | 'list' | 'masonry';
  gridCols?: WorksGridConfig;
  showEmpty?: boolean;
  emptyMessage?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  
  // プレイリスト情報
  playlistTitle?: string;
  playlistCategory?: WorksCategory;
  playlistUserId?: string;
  
  // 編集機能
  currentUserId?: string;
  onEditClick?: (workId: string) => void;
  
  // WorksCard 関連の Props
  onLike?: (workId: string, currentLikeCount: number) => void;
  onUserClick?: (username: string) => void;
  onWorkClick?: (workId: string) => void;
  onTagClick?: (tagName: string) => void;
  likeStates?: Record<string, { isLiked: boolean; likeCount?: number; isLoading?: boolean }>;
  isWorkLiked?: (workId: string) => boolean;
}

const DEFAULT_GRID_COLS: WorksGridConfig = {
  sm: 2,
  md: 3,
  lg: 4,
  xl: 4
};

const DEFAULT_MASONRY_BREAKPOINTS = {
  default: 4,
  1024: 3,
  768: 2,
  640: 1
};

function getGridClasses(gridCols: WorksGridConfig = DEFAULT_GRID_COLS): string {
  const classes = ['grid', 'grid-cols-1'];
  
  if (gridCols.sm) classes.push(`sm:grid-cols-${gridCols.sm}`);
  if (gridCols.md) classes.push(`md:grid-cols-${gridCols.md}`);
  if (gridCols.lg) classes.push(`lg:grid-cols-${gridCols.lg}`);
  if (gridCols.xl) classes.push(`xl:grid-cols-${gridCols.xl}`);
  
  classes.push('gap-6');
  
  return classes.join(' ');
}

export const WorksList = React.memo<WorksListProps>(({
  works,
  loading = false,
  error = null,
  layout = 'grid',
  gridCols = DEFAULT_GRID_COLS,
  showEmpty = true,
  emptyMessage = 'まだ作品がありません',
  emptyActionLabel,
  onEmptyAction,
  playlistTitle,
  playlistCategory,
  playlistUserId,
  currentUserId,
  onEditClick,
  onLike,
  onUserClick,
  onWorkClick,
  onTagClick,
  likeStates = {},
  isWorkLiked
}) => {
  // ローディング状態
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">作品を読み込み中...</span>
      </div>
    );
  }

  // エラー状態
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  // 空状態
  if (works.length === 0 && showEmpty) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-600">{emptyMessage}</p>
        {emptyActionLabel && onEmptyAction && (
          <button
            onClick={onEmptyAction}
            className="mt-4 cursor-pointer px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
          >
            {emptyActionLabel}
          </button>
        )}
      </div>
    );
  }

  // レイアウトに応じた表示
  if (layout === 'grid') {
    return (
      <div className={getGridClasses(gridCols)}>
        {works.map((work) => {
          const likeState = likeStates[work.id];
          // likeStateがある場合はそれを優先、ない場合はisWorkLikedを使用
          const isLiked = likeState?.isLiked ?? (isWorkLiked ? isWorkLiked(work.id) : false);
          
          return (
            <WorksCard
              key={work.id}
              work={work}
              layout={layout}
              works={works}
              playlistTitle={playlistTitle}
              playlistCategory={playlistCategory}
              playlistUserId={playlistUserId}
              currentUserId={currentUserId}
              onEditClick={onEditClick}
              onLike={onLike}
              onUserClick={onUserClick}
              onWorkClick={onWorkClick}
              onTagClick={onTagClick}
              isLiked={isLiked}
              likeCount={likeState?.likeCount}
              isLikeLoading={likeState?.isLoading || false}
            />
          );
        })}
      </div>
    );
  }

  // リスト表示（将来の拡張用）
  if (layout === 'list') {
    return (
      <div className="space-y-6">
        {works.map((work) => {
          const likeState = likeStates[work.id];
          // likeStateがある場合はそれを優先、ない場合はisWorkLikedを使用
          const isLiked = likeState?.isLiked ?? (isWorkLiked ? isWorkLiked(work.id) : false);
          
          return (
            <WorksCard
              key={work.id}
              work={work}
              layout={layout}
              works={works}
              playlistTitle={playlistTitle}
              playlistCategory={playlistCategory}
              playlistUserId={playlistUserId}
              currentUserId={currentUserId}
              onEditClick={onEditClick}
              onLike={onLike}
              onUserClick={onUserClick}
              onWorkClick={onWorkClick}
              onTagClick={onTagClick}
              isLiked={isLiked}
              likeCount={likeState?.likeCount}
              isLikeLoading={likeState?.isLoading || false}
            />
          );
        })}
      </div>
    );
  }

  // マサリー表示
  if (layout === 'masonry') {
    return (
      <Masonry
        breakpointCols={DEFAULT_MASONRY_BREAKPOINTS}
        className="masonry-grid"
        columnClassName="masonry-grid_column"
      >
        {works.map((work) => {
          const likeState = likeStates[work.id];
          // likeStateがある場合はそれを優先、ない場合はisWorkLikedを使用
          const isLiked = likeState?.isLiked ?? (isWorkLiked ? isWorkLiked(work.id) : false);
          
          return (
            <div key={work.id}>
              <WorksCard
                work={work}
                layout={layout}
                works={works}
                playlistTitle={playlistTitle}
                playlistCategory={playlistCategory}
                playlistUserId={playlistUserId}
                currentUserId={currentUserId}
                onEditClick={onEditClick}
                onLike={onLike}
                onUserClick={onUserClick}
                onWorkClick={onWorkClick}
                onTagClick={onTagClick}
                isLiked={isLiked}
                likeCount={likeState?.likeCount}
                isLikeLoading={likeState?.isLoading || false}
              />
            </div>
          );
        })}
      </Masonry>
    );
  }

  return null;
});

WorksList.displayName = 'WorksList';