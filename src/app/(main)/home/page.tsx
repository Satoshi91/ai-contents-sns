'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { useWorks } from '@/lib/hooks/useWorks';
import { useLikes } from '@/lib/hooks/useLikes';
import { Button } from '@/components/ui/Button';
import { WorksCard } from '@/components/ui/WorksCard';
import { useRouter } from 'next/navigation';
import { User, Loader2 } from 'lucide-react';

export default function HomePage() {
  const { user, userData, isAnonymous } = useAuth();
  const { works, loading, error } = useWorks();
  const { likeStates, handleToggleLike, isWorkLiked, error: likeError } = useLikes();
  const router = useRouter();

  const handleLike = async (workId: string, currentLikeCount: number) => {
    if (!user || isAnonymous) {
      // 未ログインユーザーにはログインを促す
      alert('いいねするにはログインが必要です');
      router.push('/login');
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ヘッダー */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        {user && !isAnonymous ? (
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                ようこそ、{userData?.displayName}さん！
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                みんなの作品をチェックしてみましょう
              </p>
            </div>
            <Button
              onClick={() => router.push(`/profile/${userData?.username}`)}
              size="sm"
            >
              <User size={16} className="mr-1" />
              プロフィール
            </Button>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-semibold mb-4 text-gray-900">
              AI Contents SNS へようこそ
            </h2>
            <div className="space-y-4">
              <p className="text-gray-600">
                みんなの素晴らしい作品をチェックしましょう。
                アカウントを作成すると、投稿やいいねなどの機能をご利用いただけます。
              </p>
              <div className="flex space-x-3">
                <Button onClick={() => router.push('/signup')} size="sm">
                  アカウント作成
                </Button>
                <Button
                  onClick={() => router.push('/login')}
                  variant="secondary"
                  size="sm"
                >
                  ログイン
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* いいねエラー表示 */}
      {likeError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600 text-sm">{likeError}</p>
        </div>
      )}

      {/* 作品フィード */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          みんなの作品
        </h3>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-600">作品を読み込み中...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        ) : works.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <p className="text-gray-600">まだ作品が投稿されていません</p>
            <p className="text-sm text-gray-500 mt-1">
              最初の作品を投稿してみませんか？
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {works.map((work) => {
              const likeState = likeStates[work.id];
              const workIsLiked = user && !isAnonymous ? isWorkLiked(work.id) : false;
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
        )}
      </div>
    </div>
  );
}