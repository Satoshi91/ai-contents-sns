'use client';

import { useState } from 'react';
import { Search, Hash, TrendingUp, Grid3X3, Filter } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

type TagCategory = 'all' | 'genre' | 'mood' | 'usage' | 'target' | 'length' | 'style' | 'other';

interface TagData {
  id: string;
  name: string;
  category: TagCategory;
  usageCount: number;
  isR18: boolean;
  color: string;
}

const CATEGORY_LABELS: Record<TagCategory, string> = {
  all: '全て',
  genre: 'ジャンル',
  mood: '雰囲気',
  usage: '用途',
  target: '対象',
  length: '長さ',
  style: 'スタイル',
  other: 'その他'
};

// サンプルデータ（後でFirebaseから取得）
const SAMPLE_TAGS: TagData[] = [
  { id: '1', name: '恋愛', category: 'genre', usageCount: 25, isR18: false, color: '#FF6B9D' },
  { id: '2', name: 'SF', category: 'genre', usageCount: 18, isR18: false, color: '#4DABF7' },
  { id: '3', name: 'ホラー', category: 'genre', usageCount: 12, isR18: false, color: '#868E96' },
  { id: '4', name: '感動', category: 'mood', usageCount: 32, isR18: false, color: '#51CF66' },
  { id: '5', name: 'コメディ', category: 'mood', usageCount: 28, isR18: false, color: '#FFD43B' },
  { id: '6', name: '作業用', category: 'usage', usageCount: 45, isR18: false, color: '#8CE99A' },
  { id: '7', name: '睡眠用', category: 'usage', usageCount: 38, isR18: false, color: '#A5B4FC' },
  { id: '8', name: '短編', category: 'length', usageCount: 55, isR18: false, color: '#FFA8A8' },
  { id: '9', name: '長編', category: 'length', usageCount: 22, isR18: false, color: '#74C0FC' },
  { id: '10', name: 'ASMR', category: 'style', usageCount: 15, isR18: false, color: '#D0BFFF' },
];

export default function TagsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TagCategory>('all');
  const [sortBy, setSortBy] = useState<'name' | 'usage'>('usage');

  // タグフィルタリング
  const filteredTags = SAMPLE_TAGS.filter(tag => {
    const matchesSearch = tag.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || tag.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    if (sortBy === 'usage') {
      return b.usageCount - a.usageCount;
    }
    return a.name.localeCompare(b.name, 'ja');
  });

  const handleTagClick = (tag: TagData) => {
    // TODO: タグクリック時に関連作品を表示
    console.log('タグクリック:', tag.name);
  };

  const handleCategoryClick = (category: TagCategory) => {
    setSelectedCategory(category);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* ヘッダー */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Hash className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">タグ</h1>
        </div>
        <p className="text-gray-600">
          タグから作品を発見しよう。カテゴリー別に整理されたタグから、あなたの興味に合った作品を見つけることができます。
        </p>
      </div>

      {/* 検索・フィルター */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* 検索バー */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="タグを検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* ソート */}
          <div className="flex gap-2">
            <Button
              onClick={() => setSortBy('usage')}
              variant={sortBy === 'usage' ? 'primary' : 'outline'}
              className="cursor-pointer hover:scale-105 transition-transform duration-200"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              人気順
            </Button>
            <Button
              onClick={() => setSortBy('name')}
              variant={sortBy === 'name' ? 'primary' : 'outline'}
              className="cursor-pointer hover:scale-105 transition-transform duration-200"
            >
              <Grid3X3 className="w-4 h-4 mr-2" />
              名前順
            </Button>
          </div>
        </div>
      </div>

      {/* カテゴリーフィルター */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">カテゴリー</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(CATEGORY_LABELS) as TagCategory[]).map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryClick(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-all duration-200 hover:scale-105 ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {CATEGORY_LABELS[category]}
              {category !== 'all' && (
                <span className="ml-2 text-xs opacity-70">
                  {SAMPLE_TAGS.filter(tag => tag.category === category).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* タグ一覧 */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            {selectedCategory === 'all' ? '全てのタグ' : CATEGORY_LABELS[selectedCategory]}
          </h2>
          <span className="text-sm text-gray-500">
            {filteredTags.length} 件のタグ
          </span>
        </div>

        {filteredTags.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filteredTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => handleTagClick(tag)}
                className="group p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md cursor-pointer transition-all duration-200 hover:scale-105"
                style={{
                  backgroundColor: `${tag.color}10`,
                  borderColor: `${tag.color}30`
                }}
              >
                <div className="text-center">
                  <div
                    className="text-lg font-semibold mb-1"
                    style={{ color: tag.color }}
                  >
                    #{tag.name}
                  </div>
                  <div className="text-sm text-gray-500 mb-1">
                    {CATEGORY_LABELS[tag.category]}
                  </div>
                  <div className="text-xs text-gray-400">
                    {tag.usageCount} 作品
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Hash className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">タグが見つかりません</p>
            <p className="text-gray-400 text-sm">
              検索条件を変更してお試しください
            </p>
          </div>
        )}
      </div>

      {/* 統計情報（将来の拡張用） */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {SAMPLE_TAGS.length}
          </div>
          <div className="text-sm text-gray-600">登録タグ数</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">
            {SAMPLE_TAGS.reduce((sum, tag) => sum + tag.usageCount, 0)}
          </div>
          <div className="text-sm text-gray-600">総使用回数</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
          <div className="text-3xl font-bold text-purple-600 mb-2">
            {new Set(SAMPLE_TAGS.map(tag => tag.category)).size}
          </div>
          <div className="text-sm text-gray-600">カテゴリー数</div>
        </div>
      </div>
    </div>
  );
}