'use client';

import { useState } from 'react';
import { TrendingUp, Heart, MessageCircle, Repeat2 } from 'lucide-react';

export default function RankingPage() {
  const [selectedCategory, setSelectedCategory] = useState('popular');

  const categories = [
    { id: 'popular', label: '人気', icon: <TrendingUp size={16} /> },
    { id: 'likes', label: 'いいね数', icon: <Heart size={16} /> },
    { id: 'replies', label: 'リプライ数', icon: <MessageCircle size={16} /> },
    { id: 'retweets', label: 'リツイート数', icon: <Repeat2 size={16} /> }
  ];

  // 仮のランキングデータ
  const mockRankingData = [
    {
      id: '1',
      rank: 1,
      username: 'trendy_user',
      displayName: 'トレンドマスター',
      content: '今日のトレンド話題について詳しく解説します。これは人気投稿のサンプルです。',
      likes: 1250,
      replies: 89,
      retweets: 234,
      timestamp: '3時間前'
    },
    {
      id: '2', 
      rank: 2,
      username: 'viral_post',
      displayName: 'バイラル投稿者',
      content: 'バズった投稿のサンプルです。実際のランキング機能は今後実装されます。',
      likes: 980,
      replies: 67,
      retweets: 156,
      timestamp: '5時間前'
    },
    {
      id: '3',
      rank: 3,
      username: 'popular_account',
      displayName: '人気アカウント',
      content: 'ランキング3位の投稿例です。エンゲージメントが高い投稿を表示します。',
      likes: 756,
      replies: 45,
      retweets: 123,
      timestamp: '7時間前'
    },
    {
      id: '4',
      rank: 4,
      username: 'rising_star',
      displayName: 'ライジングスター',
      content: '急上昇中の投稿です。今後、実際のデータを基にランキングを表示します。',
      likes: 623,
      replies: 34,
      retweets: 89,
      timestamp: '9時間前'
    },
    {
      id: '5',
      rank: 5,
      username: 'hot_topic',
      displayName: 'ホットトピック',
      content: '注目の話題を提供しています。ランキングアルゴリズムは今後改善していきます。',
      likes: 512,
      replies: 28,
      retweets: 67,
      timestamp: '12時間前'
    }
  ];

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-yellow-500';
      case 2: return 'bg-gray-400';
      case 3: return 'bg-amber-600';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                ランキング
              </h2>
              
              {/* カテゴリ選択 */}
              <div className="mb-8">
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`
                        cursor-pointer flex items-center space-x-2 px-4 py-2 rounded-full 
                        transition-colors duration-200 text-sm font-medium
                        ${selectedCategory === category.id
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }
                      `}
                    >
                      {category.icon}
                      <span>{category.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ランキングリスト */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  {categories.find(c => c.id === selectedCategory)?.label}ランキング (サンプル)
                </h3>
                
                {mockRankingData.map((item) => (
                  <div 
                    key={item.id} 
                    className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="flex items-start space-x-4">
                      {/* ランク表示 */}
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm
                        ${getRankBadgeColor(item.rank)}
                      `}>
                        {item.rank}
                      </div>
                      
                      {/* ユーザーアバター */}
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 font-medium">
                          {item.displayName.charAt(0)}
                        </span>
                      </div>
                      
                      {/* 投稿内容 */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-semibold text-gray-900">
                            {item.displayName}
                          </span>
                          <span className="text-gray-500 text-sm">
                            @{item.username}
                          </span>
                          <span className="text-gray-500 text-sm">
                            •
                          </span>
                          <span className="text-gray-500 text-sm">
                            {item.timestamp}
                          </span>
                        </div>
                        <p className="text-gray-900 mb-3">
                          {item.content}
                        </p>
                        
                        {/* エンゲージメント統計 */}
                        <div className="flex items-center space-x-6 text-gray-500 text-sm">
                          <div className="flex items-center space-x-1">
                            <Heart size={14} />
                            <span>{item.likes.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MessageCircle size={14} />
                            <span>{item.replies}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Repeat2 size={14} />
                            <span>{item.retweets}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 text-center">
                <p className="text-gray-500 text-sm">
                  📈 実際のランキング機能は今後実装予定です
                </p>
              </div>
      </div>
    </div>
  );
}