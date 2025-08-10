'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Palette, Search, Filter, SlidersHorizontal } from 'lucide-react';
import { ImagesSection } from '@/components/ui/ImagesSection';
import { ImagesCategory } from '@/types/imageSection';

const CATEGORIES = [
  { id: 'all', label: '全て', icon: '📁' },
  { id: 'recent', label: '最新', icon: '🆕' },
  { id: 'popular', label: '人気', icon: '🔥' },
  { id: 'favorites', label: 'お気に入り', icon: '❤️' }
] as const;

export default function IllustrationsPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<ImagesCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleImageClick = (imageId: string) => {
    router.push(`/illustrations/${imageId}`);
  };

  const handleAddVoice = (imageId: string) => {
    // AIチャット画面にイラスト情報を渡してボイス生成
    router.push(`/chat?imageId=${imageId}&mode=voice`);
  };

  const handleFavorite = (imageId: string) => {
    // お気に入り機能（将来実装）
    console.log('お気に入りに追加:', imageId);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // 検索機能は ImagesSection 内で処理される
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center space-x-3 mb-6">
              <Palette className="w-8 h-8 text-purple-600" />
              <h1 className="text-2xl font-bold text-gray-900">イラストギャラリー</h1>
            </div>

            {/* カテゴリタブ */}
            <div className="flex flex-wrap gap-2 mb-4">
              {CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`
                    flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium
                    transition-all duration-200 cursor-pointer
                    ${activeCategory === category.id
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  <span>{category.icon}</span>
                  <span>{category.label}</span>
                </button>
              ))}
            </div>

            {/* 検索バー */}
            <form onSubmit={handleSearch} className="relative max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="プロンプトやファイル名で検索..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200"
                />
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ImagesSection
          title={`${CATEGORIES.find(c => c.id === activeCategory)?.label}イラスト`}
          category={activeCategory}
          config={{
            limit: 24 // ページあたりの表示数
          }}
          layout="masonry"
          showHeader={false} // ページレベルでヘッダーを管理するため無効
          showViewToggle={true}
          showSearch={false} // ページレベルで検索を管理するため無効
          showFilters={true}
          showPrompt={true}
          showMetadata={false}
          showStats={true}
          showActions={true}
          onImageClick={handleImageClick}
          onAddVoice={handleAddVoice}
          onFavorite={handleFavorite}
          className="min-h-96"
        />
      </div>

      {/* フローティングアクションボタン（将来の拡張用） */}
      <div className="fixed bottom-6 right-6">
        <button
          onClick={() => router.push('/generate')}
          className="
            bg-purple-600 hover:bg-purple-700 text-white 
            w-14 h-14 rounded-full shadow-lg hover:shadow-xl
            flex items-center justify-center
            transition-all duration-200 cursor-pointer
          "
          title="新しいイラストを生成"
        >
          <Palette size={24} />
        </button>
      </div>
    </div>
  );
}