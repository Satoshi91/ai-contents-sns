'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { FollowButton } from '@/components/ui/FollowButton';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useFollowing } from '@/lib/hooks/useFollow';
import { getUserByUsername } from '@/lib/firebase/firestore';
import { User } from '@/types/user';

export default function FollowingPage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const username = params.username as string;

  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ターゲットユーザー情報を取得
  useEffect(() => {
    const fetchUser = async () => {
      if (!username) return;
      
      try {
        const user = await getUserByUsername(username);
        if (user) {
          setTargetUser(user);
        } else {
          setError('ユーザーが見つかりません');
        }
      } catch (err) {
        console.error('ユーザー取得エラー:', err);
        setError('ユーザー情報の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [username]);

  // フォロー中一覧を取得
  const { 
    following, 
    loading: followingLoading 
  } = useFollowing(targetUser?.uid || '', 100);

  const handleUserClick = (username: string) => {
    router.push(`/profile/${username}`);
  };

  const isOwnProfile = currentUser?.uid === targetUser?.uid;

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex justify-center">
          <div className="text-gray-500">読み込んでいます...</div>
        </div>
      </div>
    );
  }

  if (error || !targetUser) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600">{error || 'ユーザーが見つかりません'}</p>
          <Button
            onClick={() => router.back()}
            variant="secondary"
            className="mt-4"
          >
            戻る
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* ヘッダー */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center mb-4">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            size="sm"
            className="mr-3"
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {isOwnProfile ? 'フォロー中' : `${targetUser.displayName}さんのフォロー中`}
            </h1>
            <p className="text-sm text-gray-500">@{targetUser.username}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Avatar
            src={targetUser.photoURL}
            alt={targetUser.displayName}
            size="md"
          />
          <div>
            <h2 className="font-semibold text-gray-900">{targetUser.displayName}</h2>
            <p className="text-sm text-gray-600">
              {following.length} フォロー中
            </p>
          </div>
        </div>
      </div>

      {/* フォロー中一覧 */}
      <div className="bg-white rounded-lg shadow">
        {followingLoading ? (
          <div className="p-8 text-center">
            <div className="text-gray-500">フォロー中を読み込んでいます...</div>
          </div>
        ) : following.length === 0 ? (
          <div className="p-12 text-center">
            <UserPlus size={48} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {isOwnProfile ? 'まだ誰もフォローしていません' : 'フォロー中のユーザーがいません'}
            </h3>
            <p className="text-gray-600">
              {isOwnProfile 
                ? '興味のあるクリエイターをフォローして、最新の作品をチェックしましょう。'
                : `${targetUser.displayName}さんはまだ誰もフォローしていません。`
              }
            </p>
            {isOwnProfile && (
              <Button
                onClick={() => router.push('/home')}
                variant="secondary"
                className="mt-4"
              >
                クリエイターを探す
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y">
            {following.map((followingUser, index) => (
              <div key={followingUser.uid} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div 
                    className="flex items-center space-x-3 flex-1 cursor-pointer"
                    onClick={() => handleUserClick(followingUser.username)}
                  >
                    <Avatar
                      src={followingUser.photoURL}
                      alt={followingUser.displayName}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {followingUser.displayName}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">
                        @{followingUser.username}
                      </p>
                      {followingUser.bio && (
                        <p className="text-sm text-gray-700 mt-1 line-clamp-2">
                          {followingUser.bio}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* 自分以外にはフォローボタン表示 */}
                  {currentUser && currentUser.uid !== followingUser.uid && (
                    <div className="ml-3 flex-shrink-0">
                      <FollowButton
                        targetUserId={followingUser.uid}
                        size="sm"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}