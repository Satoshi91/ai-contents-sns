'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { getUserByUsername } from '@/lib/firebase/firestore';
import { getUserWorks } from '@/lib/firebase/works';
import { User } from '@/types/user';
import { Work } from '@/types/work';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ProfileDisplay } from '@/components/features/ProfileDisplay';
import { ProfileEditModal } from '@/components/features/ProfileEditModal';
import { Spinner } from '@/components/ui/Spinner';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { userData } = useAuth();
  const username = params.username as string;
  
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const isOwnProfile = userData?.username === username;

  useEffect(() => {
    loadProfile();
  }, [username]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const user = await getUserByUsername(username);
      if (!user) {
        toast.error('ユーザーが見つかりません');
        router.push('/home');
        return;
      }
      setProfileUser(user);

      // 作品データを取得
      console.log('=== 作品データ取得開始 ===');
      console.log('対象ユーザーID:', user.uid);
      console.log('現在のユーザーID:', userData?.uid);
      console.log('自分のプロフィールか:', isOwnProfile);
      
      const userWorks = await getUserWorks(user.uid, 20, undefined, userData?.uid);
      console.log('取得された作品数:', userWorks.length);
      console.log('作品データ:', userWorks.map(work => ({
        id: work.id,
        title: work.title,
        publishStatus: work.publishStatus,
        createdAt: work.createdAt
      })));
      
      setWorks(userWorks);
      console.log('=== 作品データ取得完了 ===');
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('プロフィールの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = (updatedUser: User) => {
    setProfileUser(updatedUser);
    if (isOwnProfile && userData) {
      window.location.reload();
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      </ProtectedRoute>
    );
  }

  if (!profileUser) {
    return null;
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {profileUser.displayName}
                </h1>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-lg shadow">
            <ProfileDisplay
              user={profileUser}
              works={works}
              isOwnProfile={isOwnProfile}
              onEditClick={() => setIsEditModalOpen(true)}
            />
          </div>
        </main>

        {isOwnProfile && (
          <ProfileEditModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            user={profileUser}
            onUpdate={handleProfileUpdate}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}