'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, Heart, MessageCircle, Share2, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Work } from '@/types/work';
import Image from 'next/image';

export default function WorkDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workId = params.id as string;
  const [work, setWork] = useState<Work | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: 実際のAPI呼び出しに置き換える
    const fetchWork = async () => {
      setLoading(true);
      // 仮データ
      const mockWork: Work = {
        id: workId,
        title: '美しい夕日の風景',
        description: 'AIで生成した美しい夕日の風景画です。海辺に沈む夕日と雲の表現にこだわりました。',
        prompt: 'beautiful sunset over ocean, dramatic clouds, golden light, peaceful atmosphere, high quality',
        imageUrl: '',
        userId: 'user123',
        username: 'artist_user',
        displayName: 'アーティストユーザー',
        userPhotoURL: '',
        createdAt: new Date('2024-01-15T10:30:00Z'),
        likeCount: 42,
        commentCount: 8,
        tags: ['夕日', '海', '風景', 'AI Art']
      };
      
      setTimeout(() => {
        setWork(mockWork);
        setLoading(false);
      }, 500);
    };

    if (workId) {
      fetchWork();
    }
  }, [workId]);

  const handleLike = () => {
    if (!work) return;
    // TODO: いいね機能の実装
    setWork(prev => prev ? { ...prev, likeCount: prev.likeCount + 1 } : null);
  };

  const handleShare = () => {
    // TODO: シェア機能の実装
    if (navigator.share) {
      navigator.share({
        title: work?.title,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('URLをクリップボードにコピーしました');
    }
  };

  const handleUserClick = () => {
    if (work?.username) {
      router.push(`/profile/${work.username}`);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded mb-4"></div>
          <div className="aspect-square bg-gray-300 rounded-lg mb-6"></div>
          <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!work) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">作品が見つかりません</h1>
        <Button onClick={() => router.back()}>戻る</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ヘッダー */}
      <div className="mb-6">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => router.back()}
          className="cursor-pointer hover:bg-gray-200 transition-colors duration-200"
        >
          <ArrowLeft size={16} className="mr-1" />
          戻る
        </Button>
      </div>

      {/* メインコンテンツ */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* 画像エリア */}
        <div className="aspect-square bg-gray-200 relative">
          {work.imageUrl ? (
            <Image
              src={work.imageUrl}
              alt={work.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
              <span className="text-gray-400 text-xl">画像</span>
            </div>
          )}
        </div>

        {/* 情報エリア */}
        <div className="p-6">
          {/* タイトル */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {work.title}
          </h1>

          {/* ユーザー情報 */}
          <div className="flex items-center justify-between mb-6">
            <div 
              className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity duration-200"
              onClick={handleUserClick}
            >
              <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                {work.userPhotoURL ? (
                  <Image
                    src={work.userPhotoURL}
                    alt={work.displayName}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={20} className="text-gray-500" />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">{work.displayName}</p>
                <p className="text-sm text-gray-600">@{work.username}</p>
              </div>
            </div>

            <div className="text-sm text-gray-500">
              {work.createdAt.toLocaleDateString('ja-JP')}
            </div>
          </div>

          {/* アクションボタン */}
          <div className="flex items-center space-x-4 mb-6 pb-6 border-b border-gray-200">
            <button
              onClick={handleLike}
              className="flex items-center space-x-2 text-gray-600 hover:text-red-500 cursor-pointer hover:bg-red-50 px-3 py-2 rounded-lg transition-all duration-200"
            >
              <Heart size={20} />
              <span>{work.likeCount}</span>
            </button>

            <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-500 cursor-pointer hover:bg-blue-50 px-3 py-2 rounded-lg transition-all duration-200">
              <MessageCircle size={20} />
              <span>{work.commentCount}</span>
            </button>

            <button
              onClick={handleShare}
              className="flex items-center space-x-2 text-gray-600 hover:text-green-500 cursor-pointer hover:bg-green-50 px-3 py-2 rounded-lg transition-all duration-200"
            >
              <Share2 size={20} />
              <span>シェア</span>
            </button>
          </div>

          {/* 説明 */}
          {work.description && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">説明</h3>
              <p className="text-gray-700 leading-relaxed">
                {work.description}
              </p>
            </div>
          )}

          {/* プロンプト */}
          {work.prompt && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">プロンプト</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <code className="text-sm text-gray-700">
                  {work.prompt}
                </code>
              </div>
            </div>
          )}

          {/* タグ */}
          {work.tags && work.tags.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">タグ</h3>
              <div className="flex flex-wrap gap-2">
                {work.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full cursor-pointer hover:bg-blue-200 transition-colors duration-200"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}