'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Search } from 'lucide-react';

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // 検索機能は今後実装
    console.log('検索クエリ:', searchQuery);
  };

  // 仮の検索結果データ
  const mockSearchResults = [
    {
      id: '1',
      username: 'user1',
      displayName: '太郎',
      content: 'これは検索結果のサンプルです。実際の検索機能は今後実装されます。',
      timestamp: '2時間前'
    },
    {
      id: '2',
      username: 'user2', 
      displayName: '花子',
      content: 'サンプル投稿その2です。検索機能のテスト用データです。',
      timestamp: '4時間前'
    },
    {
      id: '3',
      username: 'user3',
      displayName: '次郎',
      content: '検索結果表示のプレビューです。今後、実際の検索アルゴリズムを実装します。',
      timestamp: '6時間前'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                検索
              </h2>
              
              {/* 検索フォーム */}
              <form onSubmit={handleSearch} className="mb-8">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Input
                      type="text"
                      placeholder="キーワードを入力してください..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="cursor-pointer flex items-center"
                  >
                    <Search size={16} className="mr-2" />
                    検索
                  </Button>
                </div>
              </form>

              {/* 検索結果 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  検索結果 (サンプル)
                </h3>
                
                {mockSearchResults.map((result) => (
                  <div 
                    key={result.id} 
                    className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 font-medium">
                          {result.displayName.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-semibold text-gray-900">
                            {result.displayName}
                          </span>
                          <span className="text-gray-500 text-sm">
                            @{result.username}
                          </span>
                          <span className="text-gray-500 text-sm">
                            •
                          </span>
                          <span className="text-gray-500 text-sm">
                            {result.timestamp}
                          </span>
                        </div>
                        <p className="text-gray-900">
                          {result.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 text-center">
                <p className="text-gray-500 text-sm">
                  🔍 実際の検索機能は今後実装予定です
                </p>
              </div>
      </div>
    </div>
  );
}