'use client';

import { useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useLikes } from '@/lib/hooks/useLikes';
import { useFollowFeed, useHasFollowFeed } from '@/lib/hooks/useFollow';
import { Button } from '@/components/ui/Button';
import { WorksSection } from '@/components/ui/WorksSection';
import { WorksCard } from '@/components/ui/WorksCard';
import { AuthModal } from '@/components/ui/AuthModal';
import { useRouter } from 'next/navigation';
import { User, Home, Users } from 'lucide-react';

type FeedTab = 'all' | 'following';

export default function HomePage() {
  const { user, userData, isAnonymous } = useAuth();
  const { likeStates, handleToggleLike, isWorkLiked, error: likeError } = useLikes();
  const router = useRouter();
  
  // タブ状態管理
  const [activeTab, setActiveTab] = useState<FeedTab>('all');
  
  
  // 認証モーダル状態
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  
  // フォローフィード関連
  const { works: followFeedWorks, loading: followFeedLoading, error: followFeedError, hasFeeds } = useFollowFeed(
    user?.uid || '', 
    20
  );

  const handleLike = useCallback(async (workId: string, currentLikeCount: number) => {
    if (!user || isAnonymous) {
      alert('いいねするにはログインが必要です');
      return;
    }

    await handleToggleLike(workId, currentLikeCount);
  }, [user, isAnonymous, handleToggleLike]);

  const handleUserClick = useCallback((username: string) => {
    router.push(`/profile/${username}`);
  }, [router]);

  const handleWorkClick = useCallback((workId: string) => {
    router.push(`/works/${workId}`);
  }, [router]);

  // configオブジェクトをメモ化
  const latestWorksConfig = useMemo(() => ({ limit: 8 }), []);
  const trendingWorksConfig = useMemo(() => ({ limit: 4 }), []);

  // いいね状態をWorksSection用の形式に変換
  const getLikeStates = useCallback((works?: any[]) => {
    const states: Record<string, { isLiked: boolean; likeCount?: number; isLoading?: boolean }> = {};
    
    // likeStatesに含まれる作品を処理
    Object.keys(likeStates).forEach(workId => {
      const likeState = likeStates[workId];
      states[workId] = {
        isLiked: user && !isAnonymous ? isWorkLiked(workId) : false,
        likeCount: likeState?.likeCount,
        isLoading: false
      };
    });
    
    // 指定された作品リストがあれば、likeStatesに含まれていない作品も処理
    if (works) {
      works.forEach(work => {
        if (!states[work.id]) {
          states[work.id] = {
            isLiked: user && !isAnonymous ? isWorkLiked(work.id) : false,
            likeCount: undefined, // 元の作品のlikeCountを使用
            isLoading: false
          };
        }
      });
    }
    
    return states;
  }, [likeStates, user, isAnonymous, isWorkLiked]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 未ログインユーザー向けのヘッダー */}
      {(!user || isAnonymous) && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            VOICARISME へようこそ
          </h2>
          <div className="space-y-4">
            <p className="text-gray-600">
              みんなの素晴らしい作品をチェックしましょう。
              アカウントを作成すると、投稿やいいねなどの機能をご利用いただけます。
            </p>
            <div className="flex space-x-3">
              <Button 
                onClick={() => {
                  setAuthModalMode('signup');
                  setIsAuthModalOpen(true);
                }} 
                size="sm"
                className="cursor-pointer hover:bg-blue-600 transition-colors duration-200"
              >
                アカウント作成
              </Button>
              <Button
                onClick={() => {
                  setAuthModalMode('signin');
                  setIsAuthModalOpen(true);
                }}
                variant="secondary"
                size="sm"
                className="cursor-pointer hover:bg-gray-100 transition-colors duration-200"
              >
                ログイン
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* いいねエラー表示 */}
      {likeError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600 text-sm">{likeError}</p>
        </div>
      )}

      {/* タブ機能（ログイン済みユーザーのみ） */}
      {user && !isAnonymous && (
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 flex items-center justify-center px-4 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Home size={18} className="mr-2" />
              すべて
            </button>
            <button
              onClick={() => setActiveTab('following')}
              className={`flex-1 flex items-center justify-center px-4 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                activeTab === 'following'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Users size={18} className="mr-2" />
              フォロー中
              {hasFeeds && (
                <span className="ml-1 text-xs bg-blue-500 text-white rounded-full px-1.5 py-0.5">
                  {followFeedWorks.length}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* フィードコンテンツ */}
      {user && !isAnonymous && activeTab === 'following' ? (
        // フォローフィード
        <div className="space-y-6">
          {followFeedLoading ? (
            <div className="flex justify-center py-12">
              <div className="text-gray-500">フィードを読み込んでいます...</div>
            </div>
          ) : followFeedError ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-600">{followFeedError}</p>
            </div>
          ) : !hasFeeds ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
              <Users size={48} className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">まだフォロー中のユーザーがいません</h3>
              <p className="text-gray-600 mb-4">
                興味のあるクリエイターをフォローして、最新の作品をチェックしましょう。
              </p>
              <Button
                onClick={() => setActiveTab('all')}
                variant="secondary"
              >
                みんなの作品を見る
              </Button>
            </div>
          ) : followFeedWorks.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
              <Users size={48} className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">新しい作品がありません</h3>
              <p className="text-gray-600">
                フォロー中のユーザーの新着作品がここに表示されます。
              </p>
            </div>
          ) : (
            // フォローフィードの作品一覧
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {followFeedWorks.map(work => {
                const isLiked = user && !isAnonymous ? isWorkLiked(work.id) : false;
                const likeState = likeStates[work.id];
                const displayLikeCount = likeState?.likeCount ?? work.likeCount;
                
                return (
                  <WorksCard
                    key={work.id}
                    work={work}
                    isLiked={isLiked}
                    likeCount={displayLikeCount}
                    onLike={(workId, currentLikeCount) => handleLike(workId, currentLikeCount)}
                    onUserClick={(username) => handleUserClick(username)}
                    onWorkClick={(workId) => handleWorkClick(workId)}
                  />
                );
              })}
            </div>
          )}
        </div>
      ) : (
        // 全体フィード（デフォルト）
        <div className="max-w-5xl mx-auto space-y-8">
            {/* みんなの新着作品 */}
            <WorksSection
              title="みんなの新着作品"
              category="latest"
              config={latestWorksConfig}
              onLike={handleLike}
              onUserClick={handleUserClick}
              onWorkClick={handleWorkClick}
              likeStates={getLikeStates()}
              isWorkLiked={isWorkLiked}
            />

            {/* 急上昇作品 */}
            <WorksSection
              title="急上昇作品"
              category="trending"
              config={trendingWorksConfig}
              onLike={handleLike}
              onUserClick={handleUserClick}
              onWorkClick={handleWorkClick}
              likeStates={getLikeStates()}
              isWorkLiked={isWorkLiked}
            />
        </div>
      )}

      {/* 認証モーダル */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
      />
    </div>
  );
}