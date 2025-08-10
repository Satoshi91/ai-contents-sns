'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { useLikes } from '@/lib/hooks/useLikes';
import { useLikedWorks } from '@/lib/hooks/useLikedWorks';
import { WorksCard } from '@/components/ui/WorksCard';
import { useRouter } from 'next/navigation';
import { Loader2, Heart } from 'lucide-react';
import { useEffect } from 'react';

export default function LikesPage() {
  const { user, userData, isAnonymous } = useAuth();
  const { likedWorks, loading, error, refreshLikedWorks } = useLikedWorks();
  const { likeStates, handleToggleLike, isWorkLiked } = useLikes();
  const router = useRouter();

  // いいね状態が更新されたらいいね一覧を再取得
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      refreshLikedWorks();
    }, 500); // 楽観的更新後に少し遅延して再取得

    return () => clearTimeout(timeoutId);
  }, [likeStates, refreshLikedWorks]);

  const handleLike = async (workId: string, currentLikeCount: number) => {
    if (!user || isAnonymous) {
      alert('いいねするにはログインが必要です');
      return;
    }

    await handleToggleLike(workId, currentLikeCount);
  };

  const handleUserClick = (username: string) => {
    router.push(`/profile/${username}`);
  };

  const handleWorkClick = (workId: string) => {
    router.push(`/works/${workId}`);
  };

  // 認証チェック
  if (!user || isAnonymous) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Heart size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            ログインが必要です
          </h2>
          <p className="text-gray-600 mb-6">
            いいね一覧を表示するにはログインしてください
          </p>
          <button
            onClick={() => router.push('/home')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ヘッダー */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-center space-x-3">
          <Heart size={24} className="text-red-500" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">いいね一覧</h1>
            <p className="text-gray-600 text-sm mt-1">
              あなたがいいねした作品一覧です
            </p>
          </div>
        </div>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* いいね作品一覧 */}
      <div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-600">いいね作品を読み込み中...</span>
          </div>
        ) : likedWorks.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <Heart size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              まだいいねした作品がありません
            </h3>
            <p className="text-gray-600 mb-6">
              気に入った作品にいいねして、ここで確認しましょう
            </p>
            <button
              onClick={() => router.push('/home')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              作品を見る
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                {likedWorks.length}件の作品にいいねしています
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {likedWorks.map((work) => {
                const likeState = likeStates[work.id];
                const workIsLiked = isWorkLiked(work.id);
                const workLikeCount = likeState?.likeCount;
                
                return (
                  <WorksCard
                    key={work.id}
                    work={work}
                    onLike={handleLike}
                    onUserClick={handleUserClick}
                    onWorkClick={handleWorkClick}
                    isLiked={workIsLiked}
                    likeCount={workLikeCount}
                    isLikeLoading={false}
                  />
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}