import { useState, useEffect, useCallback } from 'react';
import { getUserLikedWorksWithDetails } from '@/lib/firebase/likes';
import { Work } from '@/types/work';
import { useAuth } from '@/lib/contexts/AuthContext';

interface UseLikedWorksReturn {
  likedWorks: Work[];
  loading: boolean;
  error: string | null;
  refreshLikedWorks: () => Promise<void>;
}

export function useLikedWorks(): UseLikedWorksReturn {
  const { user } = useAuth();
  const [likedWorks, setLikedWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshLikedWorks = useCallback(async () => {
    if (!user?.uid) {
      setLikedWorks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const works = await getUserLikedWorksWithDetails(user.uid);
      setLikedWorks(works);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'いいね作品の取得に失敗しました';
      setError(errorMessage);
      console.error('いいね作品取得エラー:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  // 初回読み込み
  useEffect(() => {
    refreshLikedWorks();
  }, [refreshLikedWorks]);

  return {
    likedWorks,
    loading,
    error,
    refreshLikedWorks
  };
}