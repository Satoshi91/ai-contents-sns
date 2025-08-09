'use client';

import { useState, useEffect } from 'react';
import { Work } from '@/types/work';
import { getAllWorks } from '@/lib/firebase/works';

export function useWorks() {
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWorks = async () => {
    try {
      setLoading(true);
      setError(null);
      const worksData = await getAllWorks(20); // 20件取得
      setWorks(worksData);
    } catch (err) {
      console.error('作品データ取得エラー:', err);
      setError('作品データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorks();
  }, []);

  return {
    works,
    loading,
    error,
    refetch: loadWorks
  };
}