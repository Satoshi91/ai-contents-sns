'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Grid, LayoutDashboard, Search, SlidersHorizontal } from 'lucide-react';
import { ImagesCategory, ImagesSectionConfig, ImagesGridConfig } from '@/types/imageSection';
import { MemoizedImagesList as ImagesList } from '@/components/ui/ImagesList';
import { useImagesSection } from '@/lib/hooks/useImagesSection';

interface ImagesSectionProps {
  title: string;
  category: ImagesCategory;
  config?: Partial<ImagesSectionConfig>;
  
  // 表示制御
  layout?: 'grid' | 'masonry';
  showHeader?: boolean;
  showMoreHref?: string;
  showMoreLabel?: string;
  showViewToggle?: boolean;
  showSearch?: boolean;
  showFilters?: boolean;
  
  // レイアウトカスタマイズ
  gridCols?: ImagesGridConfig;
  className?: string;
  
  // 表示オプション
  showPrompt?: boolean;
  showMetadata?: boolean;
  showStats?: boolean;
  showActions?: boolean;
  
  // イベントハンドラ
  onMoreClick?: () => void;
  onImageClick?: (imageId: string) => void;
  onAddVoice?: (imageId: string) => void;
  onFavorite?: (imageId: string) => void;
}

export const ImagesSection = React.memo(function ImagesSection({
  title,
  category,
  config = {},
  layout = 'masonry',
  showHeader = true,
  showMoreHref,
  showMoreLabel = 'もっと見る',
  showViewToggle = true,
  showSearch = false,
  showFilters = false,
  gridCols,
  className = '',
  showPrompt = false,
  showMetadata = false,
  showStats = true,
  showActions = true,
  onMoreClick,
  onImageClick,
  onAddVoice,
  onFavorite
}: ImagesSectionProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'masonry'>(layout);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  const {
    images,
    loading,
    error,
    hasMore,
    totalCount,
    refetch,
    loadMore,
    search
  } = useImagesSection({
    category,
    config,
    enabled: true,
    searchQuery
  });

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await search(searchQuery);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const renderHeader = () => {
    if (!showHeader) return null;
    
    return (
      <div className="space-y-4 mb-6">
        {/* タイトル行 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-semibold text-gray-900">
              {title}
            </h2>
            {totalCount > 0 && (
              <span className="text-sm text-gray-500">
                ({totalCount.toLocaleString()}件)
              </span>
            )}
          </div>
          
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
                  onClick={() => setViewMode('masonry')}
                  className={`p-2 rounded-md transition-all duration-200 cursor-pointer ${
                    viewMode === 'masonry'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                  title="マサリー表示"
                >
                  <LayoutDashboard size={16} />
                </button>
              </div>
            )}

            {/* フィルタボタン */}
            {showFilters && (
              <button
                onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                className={`p-2 rounded-md transition-all duration-200 cursor-pointer ${
                  showFiltersPanel
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
                title="フィルタ"
              >
                <SlidersHorizontal size={16} />
              </button>
            )}

            {/* もっと見るリンク */}
            {(showMoreHref || onMoreClick) && images.length > 0 && (
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

        {/* 検索バー */}
        {showSearch && (
          <form onSubmit={handleSearchSubmit} className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="プロンプトやファイル名で検索..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
              />
            </div>
          </form>
        )}

        {/* フィルタパネル */}
        {showFilters && showFiltersPanel && (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="text-sm text-gray-600 mb-2">フィルタオプション</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* ここに具体的なフィルタオプションを追加 */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  レーティング
                </label>
                <select className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                  <option value="">すべて</option>
                  <option value="5">★★★★★</option>
                  <option value="4">★★★★☆</option>
                  <option value="3">★★★☆☆</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  公開設定
                </label>
                <select className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                  <option value="">すべて</option>
                  <option value="true">公開</option>
                  <option value="false">非公開</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  プロンプト
                </label>
                <select className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                  <option value="">すべて</option>
                  <option value="true">あり</option>
                  <option value="false">なし</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`${className}`}>
      {renderHeader()}
      
      <ImagesList
        images={images}
        loading={loading}
        error={error}
        hasMore={hasMore}
        layout={viewMode}
        gridCols={gridCols}
        showPrompt={showPrompt}
        showMetadata={showMetadata}
        showStats={showStats}
        showActions={showActions}
        onImageClick={onImageClick}
        onAddVoice={onAddVoice}
        onFavorite={onFavorite}
        onLoadMore={loadMore}
        emptyMessage={`${title}はまだありません`}
      />
    </div>
  );
});