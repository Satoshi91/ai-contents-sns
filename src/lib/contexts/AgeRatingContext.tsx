'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type AgeFilter = 'all' | 'r18-allowed' | 'r18-only';

interface AgeRatingContextType {
  ageFilter: AgeFilter;
  setAgeFilter: (value: AgeFilter) => void;
}

const AgeRatingContext = createContext<AgeRatingContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'ageFilter';

export function AgeRatingProvider({ children }: { children: ReactNode }) {
  const [ageFilter, setAgeFilterState] = useState<AgeFilter>('all');
  const [isInitialized, setIsInitialized] = useState(false);

  // localStorageから初期値を読み込み
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored !== null && (stored === 'all' || stored === 'r18-allowed' || stored === 'r18-only')) {
        setAgeFilterState(stored as AgeFilter);
      }
    } catch (error) {
      console.error('Failed to load age filter setting from localStorage:', error);
    }
    setIsInitialized(true);
  }, []);

  // 値が変更されたらlocalStorageに保存
  const setAgeFilter = (value: AgeFilter) => {
    setAgeFilterState(value);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, value);
    } catch (error) {
      console.error('Failed to save age filter setting to localStorage:', error);
    }
  };

  // 初期化が完了するまで、デフォルト値（全年齢モード）を使用
  if (!isInitialized) {
    return (
      <AgeRatingContext.Provider value={{
        ageFilter: 'all',
        setAgeFilter: () => {}
      }}>
        {children}
      </AgeRatingContext.Provider>
    );
  }

  return (
    <AgeRatingContext.Provider value={{
      ageFilter,
      setAgeFilter
    }}>
      {children}
    </AgeRatingContext.Provider>
  );
}

export function useAgeRating() {
  const context = useContext(AgeRatingContext);
  if (context === undefined) {
    throw new Error('useAgeRating must be used within an AgeRatingProvider');
  }
  return context;
}