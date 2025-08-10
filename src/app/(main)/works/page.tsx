'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { useLikes } from '@/lib/hooks/useLikes';
import { WorksSection } from '@/components/ui/WorksSection';
import { useRouter } from 'next/navigation';
import { FileText } from 'lucide-react';

export default function MyWorksPage() {
  const { user, userData, loading, isAnonymous } = useAuth();
  const { likeStates, handleToggleLike, isWorkLiked, error: likeError } = useLikes();
  const router = useRouter();

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

  const handleEditClick = (workId: string) => {
    router.push(`/compose?id=${workId}`);
  };

  // いいね状態をWorksSection用の形式に変換
  const getLikeStates = () => {
    const states: Record<string, { isLiked: boolean; likeCount?: number; isLoading?: boolean }> = {};
    
    Object.keys(likeStates).forEach(workId => {
      const likeState = likeStates[workId];
      states[workId] = {
        isLiked: user && !isAnonymous ? isWorkLiked(workId) : false,
        likeCount: likeState?.likeCount,
        isLoading: false
      };
    });
    
    return states;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || isAnonymous) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-600">ログインが必要です</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ヘッダー */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">自分の作品</h1>
            <p className="text-gray-600">
              あなたが投稿したAIボイスドラマ作品の一覧です
            </p>
          </div>
          <button
            onClick={() => router.push('/compose')}
            className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
          >
            新しい作品を投稿
          </button>
        </div>
      </div>

      {/* いいねエラー表示 */}
      {likeError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600 text-sm">{likeError}</p>
        </div>
      )}

      {/* ユーザーの作品一覧 */}
      <WorksSection
        title="投稿した作品"
        category="user"
        config={{ userId: user.uid, limit: 50 }}
        currentUserId={user.uid}
        onEditClick={handleEditClick}
        onLike={handleLike}
        onUserClick={handleUserClick}
        onWorkClick={handleWorkClick}
        likeStates={getLikeStates()}
        isWorkLiked={isWorkLiked}
        showHeader={false}
        skipR18Filter={true}
      />
    </div>
  );
}