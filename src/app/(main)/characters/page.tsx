'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Search, Filter, Heart, Plus } from 'lucide-react';
import { useCharacters, useCharacterSeries } from '@/lib/hooks/useCharacters';
import { CharacterCategory, CharacterFilters } from '@/types/character';

const CATEGORIES = [
  { id: 'all', label: '全て', icon: '👥' },
  { id: 'recent', label: '最新', icon: '🆕' },
  { id: 'popular', label: '人気', icon: '🔥' },
  { id: 'by_series', label: 'シリーズ別', icon: '📚' }
] as const;

export default function CharactersPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<CharacterCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeries, setSelectedSeries] = useState('');
  const [filters, setFilters] = useState<CharacterFilters>({});

  const { series: seriesList } = useCharacterSeries();
  const { characters, loading, error, hasMore, loadMore } = useCharacters(
    activeCategory,
    filters,
    24
  );

  const handleCategoryChange = (category: CharacterCategory) => {
    setActiveCategory(category);
    setFilters(prev => ({
      ...prev,
      ...(category === 'by_series' ? { series: selectedSeries } : {}),
    }));
  };

  const handleSeriesChange = (series: string) => {
    setSelectedSeries(series);
    if (activeCategory === 'by_series') {
      setFilters(prev => ({ ...prev, series }));
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, searchQuery }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Users className="w-8 h-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">キャラクター一覧</h1>
              </div>
              <button
                onClick={() => router.push('/characters/compose')}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 cursor-pointer"
              >
                <Plus size={20} />
                <span>投稿</span>
              </button>
            </div>

            {/* カテゴリタブ */}
            <div className="flex flex-wrap gap-2 mb-4">
              {CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.id)}
                  className={`
                    flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium
                    transition-all duration-200 cursor-pointer
                    ${activeCategory === category.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  <span>{category.icon}</span>
                  <span>{category.label}</span>
                </button>
              ))}
            </div>

            {/* シリーズフィルタ（シリーズ別カテゴリの場合） */}
            {activeCategory === 'by_series' && (
              <div className="mb-4">
                <select
                  value={selectedSeries}
                  onChange={(e) => handleSeriesChange(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                >
                  <option value="">シリーズを選択</option>
                  {seriesList.map((series) => (
                    <option key={series} value={series}>
                      {series}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 検索バー */}
            <form onSubmit={handleSearch} className="relative max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="キャラクター名やシリーズで検索..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                />
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {loading && characters.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* キャラクター一覧 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {characters.map((character) => (
                <div
                  key={character.id}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden"
                  onClick={() => {
                    router.push(`/characters/${character.id}`);
                  }}
                >
                  {/* 画像表示エリア */}
                  <div className="aspect-square bg-gray-100 relative">
                    {character.imageUrl ? (
                      <img
                        src={character.imageUrl}
                        alt={character.character_name || 'キャラクター画像'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Users size={32} />
                      </div>
                    )}
                  </div>
                  
                  {/* キャラクター情報 */}
                  <div className="p-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-gray-900 text-sm truncate">
                        {character.character_name || '名前未設定'}
                      </h3>
                      
                      {character.series_ja && (
                        <p className="text-xs text-gray-600 truncate">
                          {character.series_ja}
                        </p>
                      )}
                      
                      {character.status && (
                        <span className={`
                          inline-block px-2 py-1 rounded-full text-xs font-medium
                          ${character.status === '確認済み' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                          }
                        `}>
                          {character.status}
                        </span>
                      )}

                      {character.tags && character.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {character.tags.slice(0, 3).map((tag, index) => (
                            <span key={index} className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                          {character.tags.length > 3 && (
                            <span className="text-xs text-gray-400">
                              +{character.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* アクションボタン */}
                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // 将来的にお気に入り機能を実装
                          console.log('お気に入りに追加:', character.id);
                        }}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors duration-200 cursor-pointer"
                        title="お気に入りに追加"
                      >
                        <Heart size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 空の状態 */}
            {!loading && characters.length === 0 && (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  キャラクターが見つかりませんでした
                </h3>
                <p className="text-gray-500">
                  検索条件を変更して再度お試しください。
                </p>
              </div>
            )}

            {/* もっと読み込むボタン */}
            {hasMore && characters.length > 0 && (
              <div className="mt-8 text-center">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
                >
                  {loading ? '読み込み中...' : 'もっと見る'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}