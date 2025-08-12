import { useState, useEffect } from 'react';
import { DocumentSnapshot } from 'firebase/firestore';
import { Character, CharacterCategory, CharacterFilters } from '@/types/character';
import { getCharacters, getCharacterSeries } from '@/lib/firebase/characters';

interface UseCharactersReturn {
  characters: Character[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useCharacters(
  category: CharacterCategory = 'all',
  filters?: CharacterFilters,
  limitCount: number = 24
): UseCharactersReturn {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | undefined>();

  const loadCharacters = async (isLoadMore = false) => {
    try {
      if (!isLoadMore) {
        setLoading(true);
        setError(null);
      }

      const result = await getCharacters(
        category,
        limitCount,
        isLoadMore ? lastDoc : undefined,
        filters
      );

      if (result.success) {
        if (isLoadMore) {
          setCharacters(prev => [...prev, ...result.characters]);
        } else {
          setCharacters(result.characters);
        }
        setLastDoc(result.lastDoc);
        setHasMore(result.hasMore);
      } else {
        setError(result.error || 'キャラクターの取得に失敗しました');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (hasMore && !loading) {
      await loadCharacters(true);
    }
  };

  const refresh = async () => {
    setLastDoc(undefined);
    await loadCharacters(false);
  };

  useEffect(() => {
    setLastDoc(undefined);
    loadCharacters(false);
  }, [category, filters?.series, filters?.status, filters?.searchQuery]);

  return {
    characters,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
  };
}

interface UseCharacterSeriesReturn {
  series: string[];
  loading: boolean;
  error: string | null;
}

export function useCharacterSeries(): UseCharacterSeriesReturn {
  const [series, setSeries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSeries = async () => {
      try {
        const result = await getCharacterSeries();
        if (result.success) {
          setSeries(result.series);
        } else {
          setError(result.error || 'シリーズ一覧の取得に失敗しました');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadSeries();
  }, []);

  return { series, loading, error };
}