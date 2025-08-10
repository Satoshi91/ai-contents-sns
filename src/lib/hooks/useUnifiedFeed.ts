import { useState, useEffect } from 'react';
import { Work } from '@/types/work';
import { Content, ContentType } from '@/types/content';
import { getAllWorks } from '@/lib/firebase/works';
import { getAllContents, getAllContentsWithRelated } from '@/lib/firebase/contents';
import { convertContentToWork, convertContentsToWorks } from '@/lib/utils/contentWorkConverter';

export interface UseUnifiedFeedProps {
  contentTypeFilter?: ContentType | 'all';
  limit?: number;
}

export interface UseUnifiedFeedReturn {
  works: Work[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useUnifiedFeed({
  contentTypeFilter = 'all',
  limit = 10
}: UseUnifiedFeedProps = {}): UseUnifiedFeedReturn {
  const [works, setWorks] = useState<Work[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const loadData = async (isInitial: boolean = false) => {
    try {
      if (isInitial) {
        setIsLoading(true);
        setError(null);
      }

      // Fetch both legacy works and new contents in parallel
      const [legacyWorks, newContents] = await Promise.all([
        getAllWorks(limit),
        contentTypeFilter === 'all' 
          ? getAllContentsWithRelated(undefined, limit, undefined, true)
          : getAllContentsWithRelated(contentTypeFilter, limit, undefined, true)
      ]);

      // Convert contents to works format
      const convertedWorks = convertContentsToWorks(newContents);

      // Mark legacy works as such
      const markedLegacyWorks = legacyWorks.map(work => ({
        ...work,
        contentType: 'legacy' as const
      }));

      // Combine and sort by creation date
      const combinedWorks = [...markedLegacyWorks, ...convertedWorks]
        .sort((a, b) => {
          const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
          const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, limit);

      if (isInitial) {
        setWorks(combinedWorks);
      } else {
        setWorks(prev => [...prev, ...combinedWorks]);
      }

      // Simple hasMore logic - could be improved with proper pagination
      setHasMore(combinedWorks.length === limit);

    } catch (error) {
      console.error('統合フィード取得エラー:', error);
      setError('フィードの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMore = async () => {
    if (!hasMore || isLoading) return;
    await loadData(false);
  };

  const refresh = async () => {
    await loadData(true);
  };

  useEffect(() => {
    loadData(true);
  }, [contentTypeFilter, limit]);

  return {
    works,
    isLoading,
    error,
    hasMore,
    loadMore,
    refresh
  };
}