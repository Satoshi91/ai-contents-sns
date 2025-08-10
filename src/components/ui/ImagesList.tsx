'use client';

import React, { useCallback, useRef, useEffect } from 'react';
import Masonry from 'react-masonry-css';
import { Loader2, ImageIcon } from 'lucide-react';
import { ImageDocument } from '@/types/image';
import { ImagesGridConfig, MasonryBreakpoints, ImageEventHandlers } from '@/types/imageSection';
import { MemoizedImageCard as ImageCard } from '@/components/ui/ImageCard';

interface ImagesListProps {
  images: ImageDocument[];
  loading?: boolean;
  error?: string | null;
  hasMore?: boolean;
  layout?: 'grid' | 'masonry';
  gridCols?: ImagesGridConfig;
  masonryBreakpoints?: MasonryBreakpoints;
  
  // 表示オプション
  showPrompt?: boolean;
  showMetadata?: boolean;
  showStats?: boolean;
  showActions?: boolean;
  
  // 空状態
  showEmpty?: boolean;
  emptyMessage?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  
  // イベントハンドラ
  onImageClick?: (imageId: string) => void;
  onAddVoice?: (imageId: string) => void;
  onFavorite?: (imageId: string) => void;
  onLoadMore?: () => void;
  
  className?: string;
}

const DEFAULT_GRID_COLS: ImagesGridConfig = {
  sm: 1,
  md: 2,
  lg: 3,
  xl: 4
};

const DEFAULT_MASONRY_BREAKPOINTS: MasonryBreakpoints = {
  default: 4,
  1280: 4, // xl
  1024: 3, // lg  
  768: 2,  // md
  640: 1   // sm
};

// グリッドレイアウト用のTailwindクラスを生成
function getGridClasses(gridCols: ImagesGridConfig = DEFAULT_GRID_COLS): string {
  const classes = ['grid', 'grid-cols-1'];
  
  if (gridCols.sm) classes.push(`sm:grid-cols-${gridCols.sm}`);
  if (gridCols.md) classes.push(`md:grid-cols-${gridCols.md}`);
  if (gridCols.lg) classes.push(`lg:grid-cols-${gridCols.lg}`);
  if (gridCols.xl) classes.push(`xl:grid-cols-${gridCols.xl}`);
  
  classes.push('gap-6');
  
  return classes.join(' ');
}

export function ImagesList({
  images,
  loading = false,
  error = null,
  hasMore = false,
  layout = 'masonry',
  gridCols = DEFAULT_GRID_COLS,
  masonryBreakpoints = DEFAULT_MASONRY_BREAKPOINTS,
  showPrompt = false,
  showMetadata = false,
  showStats = true,
  showActions = true,
  showEmpty = true,
  emptyMessage = 'まだイラストがありません',
  emptyActionLabel,
  onEmptyAction,
  onImageClick,
  onAddVoice,
  onFavorite,
  onLoadMore,
  className = ''
}: ImagesListProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Intersection Observer で無限スクロール
  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target.isIntersecting && hasMore && !loading && onLoadMore) {
        onLoadMore();
      }
    },
    [hasMore, loading, onLoadMore]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleIntersection, {
      threshold: 0.1,
      rootMargin: '100px'
    });

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [handleIntersection]);

  // ローディング状態（初回読み込み）
  if (loading && images.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">イラストを読み込み中...</span>
      </div>
    );
  }

  // エラー状態
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-2">エラーが発生しました</div>
        <div className="text-gray-600 text-sm">{error}</div>
      </div>
    );
  }

  // 空状態
  if (!loading && images.length === 0 && showEmpty) {
    return (
      <div className="text-center py-12">
        <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <div className="text-gray-600 mb-4">{emptyMessage}</div>
        {emptyActionLabel && onEmptyAction && (
          <button
            onClick={onEmptyAction}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 cursor-pointer"
          >
            {emptyActionLabel}
          </button>
        )}
      </div>
    );
  }

  // 画像リストの描画
  const renderImageCards = () => {
    return images.map((image) => (
      <ImageCard
        key={image.id || `image-${Math.random()}`}
        image={image}
        layout={layout}
        showPrompt={showPrompt}
        showMetadata={showMetadata}
        showStats={showStats}
        showActions={showActions}
        onImageClick={onImageClick}
        onAddVoice={onAddVoice}
        onFavorite={onFavorite}
      />
    ));
  };

  return (
    <div className={`${className}`}>
      {/* イメージリスト */}
      {layout === 'masonry' ? (
        <Masonry
          breakpointCols={masonryBreakpoints}
          className="masonry-grid"
          columnClassName="masonry-grid-column"
        >
          {renderImageCards()}
        </Masonry>
      ) : (
        <div className={getGridClasses(gridCols)}>
          {renderImageCards()}
        </div>
      )}

      {/* 無限スクロール用のトリガー要素 */}
      {hasMore && (
        <div ref={loadMoreRef} className="py-8 text-center">
          {loading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-600">さらに読み込み中...</span>
            </div>
          ) : (
            <div className="text-gray-400 text-sm">スクロールして続きを読み込み</div>
          )}
        </div>
      )}

      {/* 読み込み完了メッセージ */}
      {!hasMore && images.length > 0 && (
        <div className="py-8 text-center text-gray-400 text-sm">
          全てのイラストを表示しました
        </div>
      )}

      {/* MasonryのCSS */}
      <style jsx global>{`
        .masonry-grid {
          display: flex;
          margin-left: -1.5rem; /* gap-6の半分 */
          width: auto;
        }
        .masonry-grid-column {
          padding-left: 1.5rem; /* gap-6の半分 */
          background-clip: padding-box;
        }
        .masonry-grid-column > * {
          margin-bottom: 1.5rem; /* gap-6 */
        }
      `}</style>
    </div>
  );
}

// メモ化されたコンポーネント
export const MemoizedImagesList = React.memo(ImagesList);