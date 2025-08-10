import React from 'react';
import { User } from '@/types/user';
import { Work } from '@/types/work';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FollowButton } from '@/components/ui/FollowButton';
import { WorksCard } from '@/components/ui/WorksCard';
import { Calendar, Edit2, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { getImageURL } from '@/lib/cloudflare/images';
import { useFollowStats } from '@/lib/hooks/useFollow';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface ProfileDisplayProps {
  user: User;
  works: Work[];
  isOwnProfile: boolean;
  onEditClick: () => void;
}

export function ProfileDisplay({ user, works, isOwnProfile, onEditClick }: ProfileDisplayProps) {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const { followerCount, followingCount, loading: statsLoading } = useFollowStats(user.uid);
  
  // デバッグ用: 作品データの表示状況を確認
  console.log('=== ProfileDisplay レンダリング ===');
  console.log('ユーザー:', user.displayName);
  console.log('作品数:', works.length);
  console.log('自分のプロフィールか:', isOwnProfile);
  console.log('作品データ:', works.map(work => ({
    id: work.id,
    title: work.title,
    publishStatus: work.publishStatus
  })));
  
  const profileImageUrl = user.photoURL?.includes('profile-') 
    ? getImageURL(user.photoURL, 'profile')
    : user.photoURL;

  const handleFollowersClick = () => {
    router.push(`/profile/${user.username}/followers`);
  };

  const handleFollowingClick = () => {
    router.push(`/profile/${user.username}/following`);
  };

  const handleWorkClick = (workId: string) => {
    router.push(`/works/${workId}`);
  };

  return (
    <div>
      <div className="px-6 pt-6 pb-6">
        <div className="flex justify-between items-start mb-4">
          <Avatar
            src={profileImageUrl}
            alt={user.displayName}
            size="2xl"
            className="border-4 border-white"
          />
          
          <div className="mt-4">
            {isOwnProfile ? (
              <Button
                onClick={onEditClick}
                variant="secondary"
                size="sm"
                className="flex items-center"
              >
                <Edit2 size={16} className="mr-1" />
                プロフィール編集
              </Button>
            ) : currentUser && (
              <FollowButton targetUserId={user.uid} />
            )}
          </div>
        </div>

        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900">{user.displayName}</h2>
          <p className="text-gray-500">@{user.username}</p>
        </div>

        {user.bio && (
          <p className="text-gray-700 mb-4 whitespace-pre-wrap">{user.bio}</p>
        )}

        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-6">
          <div className="flex items-center">
            <Calendar size={16} className="mr-1" />
            <span>
              {format(user.createdAt, 'yyyy年M月', { locale: ja })}から利用
            </span>
          </div>
        </div>

        <div className="flex space-x-6 border-t pt-4">
          <button 
            onClick={handleFollowersClick}
            className="text-center cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors"
          >
            <div className="text-2xl font-bold text-gray-900">
              {statsLoading ? '...' : followerCount}
            </div>
            <div className="text-sm text-gray-500">フォロワー</div>
          </button>
          
          <button 
            onClick={handleFollowingClick}
            className="text-center cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors"
          >
            <div className="text-2xl font-bold text-gray-900">
              {statsLoading ? '...' : followingCount}
            </div>
            <div className="text-sm text-gray-500">フォロー中</div>
          </button>
        </div>
      </div>

      {/* 作品リスト */}
      <div className="border-t">
        <div className="px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            作品 ({works.length})
          </h3>
          
          {works.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>まだ作品がありません</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {works.map((work) => (
                <WorksCard
                  key={work.id}
                  work={work}
                  onWorkClick={() => handleWorkClick(work.id)}
                  currentUserId={currentUser?.uid}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}