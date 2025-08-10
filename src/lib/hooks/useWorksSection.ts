'use client';

import { useState, useEffect, useCallback } from 'react';
import { Work } from '@/types/work';
import { WorksCategory, WorksSectionConfig } from '@/types/worksSection';
import { getAllWorks, getUserWorks } from '@/lib/firebase/works';
import { useLikedWorks } from '@/lib/hooks/useLikedWorks';
import { useAgeRating, AgeFilter } from '@/lib/contexts/AgeRatingContext';

interface UseWorksSectionOptions {
  category: WorksCategory;
  config?: Partial<WorksSectionConfig>;
  enabled?: boolean; // 自動フェッチの有効/無効
  skipR18Filter?: boolean; // R-18フィルタを無効にする（自分の作品表示時など）
  currentUserId?: string; // 現在のユーザーID（自分の作品表示時など）
}

interface UseWorksSectionReturn {
  works: Work[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  loadMore?: () => Promise<void>; // 無限スクロール用
  hasMore?: boolean;
}

export function useWorksSection({ 
  category, 
  config = {}, 
  enabled = true,
  skipR18Filter = false,
  currentUserId
}: UseWorksSectionOptions): UseWorksSectionReturn {
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { ageFilter } = useAgeRating();

  // 年齢制限フィルタリング関数
  const applyAgeFilter = (works: Work[], filter: AgeFilter): Work[] => {
    switch (filter) {
      case 'all':
        return works.filter(work => work.contentRating !== '18+');
      case 'r18-only':
        return works.filter(work => work.contentRating === '18+');
      case 'r18-allowed':
      default:
        return works; // フィルタリングなし
    }
  };

  // likes カテゴリの場合は既存のuseLikedWorksを使用
  const { 
    likedWorks, 
    loading: likedLoading, 
    error: likedError, 
    refreshLikedWorks 
  } = useLikedWorks();

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    
    try {
      setLoading(true);
      setError(null);
      
      let worksData: Work[] = [];
      
      switch (category) {
        case 'latest':
          worksData = await getAllWorks(config.limit || 8);
          break;
          
        case 'following':
          // フォロー機能が未実装のため、暫定的に全作品を返す
          console.warn('フォロー機能未実装のため、全作品を返却します');
          worksData = await getAllWorks(config.limit || 6);
          break;
          
        case 'trending':
          // 急上昇機能が未実装のため、暫定的に全作品を返す（いいね数順）
          console.warn('急上昇機能未実装のため、全作品を返却します');
          worksData = await getAllWorks(config.limit || 4);
          // 将来的にはいいね数でソートする処理を追加
          worksData = worksData.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
          break;
          
        case 'user':
          if (config.userId) {
            console.log('=== useWorksSection user category ===');
            console.log('config.userId:', config.userId);
            console.log('currentUserId:', currentUserId);
            worksData = await getUserWorks(config.userId, config.limit || 10, undefined, currentUserId);
          } else {
            throw new Error('userId is required for user category');
          }
          break;
          
        case 'liked':
          // useLikedWorksの結果を使用するため、ここでは何もしない
          return;
          
        case 'recommended':
          // 推薦機能は将来実装
          console.warn('推薦機能は未実装です');
          worksData = [];
          break;
          
        case 'genre':
          // ジャンル機能は将来実装
          console.warn('ジャンル機能は未実装です');
          worksData = [];
          break;
          
        default:
          throw new Error(`Unsupported category: ${category}`);
      }
      
      // 年齢制限フィルタリング適用（skipR18Filterが無効の場合のみ）
      if (!skipR18Filter) {
        worksData = applyAgeFilter(worksData, ageFilter);
      }
      
      setWorks(worksData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'データの取得に失敗しました');
      console.error('useWorksSection fetchData error:', err);
    } finally {
      setLoading(false);
    }
  }, [category, config.limit, config.userId, ageFilter, skipR18Filter, currentUserId]);

  useEffect(() => {
    if (category === 'liked') {
      // likedカテゴリの場合はuseLikedWorksの結果をそのまま使用
      return;
    }
    
    fetchData();
  }, [fetchData, category]);

  // liked カテゴリの場合はuseLikedWorksの値を返す
  if (category === 'liked') {
    // 年齢制限フィルタリング適用（skipR18Filterが無効の場合のみ）
    const filteredLikedWorks = !skipR18Filter
      ? applyAgeFilter(likedWorks, ageFilter)
      : likedWorks;
      
    return {
      works: filteredLikedWorks,
      loading: likedLoading,
      error: likedError,
      refetch: refreshLikedWorks
    };
  }

  return {
    works,
    loading,
    error,
    refetch: fetchData
  };
}