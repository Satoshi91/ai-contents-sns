'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { QueryDocumentSnapshot } from 'firebase/firestore';
import { ImageDocument } from '@/types/image';
import { ImagesCategory, ImagesSectionConfig } from '@/types/imageSection';
import { getImages, getImagesCount, searchImages } from '@/lib/firebase/images';

interface UseImagesSectionOptions {
  category: ImagesCategory;
  config?: Partial<ImagesSectionConfig>;
  enabled?: boolean; // 自動フェッチの有効/無効
  searchQuery?: string; // 検索クエリ
}

interface UseImagesSectionReturn {
  images: ImageDocument[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  totalCount: number;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
  search: (query: string) => Promise<void>;
}

// カテゴリから設定を生成
const getCategoryConfig = (category: ImagesCategory): Partial<ImagesSectionConfig> => {
  switch (category) {
    case 'recent':
      return {
        orderBy: 'created_at',
        orderDirection: 'desc',
        filters: { isPublic: true }
      };
    case 'popular':
      return {
        orderBy: 'views',
        orderDirection: 'desc',
        filters: { isPublic: true }
      };
    case 'favorites':
      return {
        orderBy: 'created_at',
        orderDirection: 'desc',
        filters: { isPublic: true }
        // TODO: お気に入り機能実装時にフィルタ追加
      };
    case 'all':
    default:
      return {
        orderBy: 'created_at',
        orderDirection: 'desc',
        filters: { isPublic: true }
      };
  }
};

export function useImagesSection({
  category,
  config = {},
  enabled = true,
  searchQuery
}: UseImagesSectionOptions): UseImagesSectionReturn {
  const [images, setImages] = useState<ImageDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot | null>(null);
  const [currentSearchQuery, setCurrentSearchQuery] = useState<string>('');

  // 重複取得防止のためのフラグ
  const loadingRef = useRef(false);

  // カテゴリ設定とユーザー設定をマージ
  const mergedConfig: ImagesSectionConfig = {
    limit: 20,
    ...getCategoryConfig(category),
    ...config
  };

  // データ取得関数
  const fetchImages = useCallback(async (
    reset: boolean = false,
    searchQuery?: string
  ): Promise<void> => {
    if (loadingRef.current || !enabled) return;

    try {
      loadingRef.current = true;
      setLoading(true);
      setError(null);

      const startFrom = reset ? undefined : lastVisible;
      let result;

      if (searchQuery && searchQuery.trim()) {
        result = await searchImages(searchQuery, mergedConfig, startFrom || undefined);
      } else {
        result = await getImages(mergedConfig, startFrom || undefined);
      }

      if (reset) {
        setImages(result.images);
        // 総数も更新（検索時は正確でない可能性がある）
        if (!searchQuery) {
          const count = await getImagesCount(mergedConfig.filters);
          setTotalCount(count);
        }
      } else {
        setImages(prev => [...prev, ...result.images]);
      }

      setLastVisible(result.lastVisible);
      setHasMore(result.hasMore);

    } catch (err) {
      console.error('画像取得エラー:', err);
      setError(err instanceof Error ? err.message : '画像の取得に失敗しました');
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [enabled, mergedConfig, lastVisible]);

  // 初回データ取得
  const refetch = useCallback(async () => {
    setLastVisible(null);
    await fetchImages(true, currentSearchQuery);
  }, [fetchImages, currentSearchQuery]);

  // 追加データ取得（無限スクロール用）
  const loadMore = useCallback(async () => {
    if (!hasMore || loading || loadingRef.current) return;
    await fetchImages(false, currentSearchQuery);
  }, [hasMore, loading, fetchImages, currentSearchQuery]);

  // 検索実行
  const search = useCallback(async (query: string) => {
    setCurrentSearchQuery(query);
    setLastVisible(null);
    await fetchImages(true, query);
  }, [fetchImages]);

  // 初回マウント時およびcategory/config変更時にデータ取得
  useEffect(() => {
    if (enabled) {
      refetch();
    }
  }, [category, enabled, JSON.stringify(mergedConfig)]);

  // searchQuery プロップが変更された時の検索実行
  useEffect(() => {
    if (searchQuery !== undefined && searchQuery !== currentSearchQuery) {
      search(searchQuery);
    }
  }, [searchQuery, search, currentSearchQuery]);

  return {
    images,
    loading,
    error,
    hasMore,
    totalCount,
    refetch,
    loadMore,
    search
  };
}