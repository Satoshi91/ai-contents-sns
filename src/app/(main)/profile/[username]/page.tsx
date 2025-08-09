'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { getUserByUsername, getUserWorks } from '@/lib/firebase/firestore';
import { User } from '@/types/user';
import { Work } from '@/types/work';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ProfileDisplay } from '@/components/features/ProfileDisplay';
import { ProfileEditModal } from '@/components/features/ProfileEditModal';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
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
  const [worksLoading, setWorksLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);

  const isOwnProfile = userData?.username === username;

  useEffect(() => {
    loadProfile();
  }, [username]);

  useEffect(() => {
    if (profileUser) {
      loadWorks();
    }
  }, [profileUser]);

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
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('プロフィールの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const loadWorks = async (loadMore = false) => {
    if (!profileUser || worksLoading) return;
    
    setWorksLoading(true);
    try {
      const result = await getUserWorks(
        profileUser.uid,
        10,
        loadMore ? lastDoc : undefined
      );
      
      if (result.success) {
        if (loadMore) {
          setWorks(prev => [...prev, ...result.works]);
        } else {
          setWorks(result.works);
        }
        setLastDoc(result.lastDoc);
        setHasMore(result.hasMore);
      }
    } catch (error) {
      console.error('Error loading works:', error);
      toast.error('作品の読み込みに失敗しました');
    } finally {
      setWorksLoading(false);
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
                <p className="text-sm text-gray-500">
                  {works.length} 作品
                </p>
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
            
            {works.length > 0 && hasMore && !worksLoading && (
              <div className="p-4 border-t">
                <Button
                  onClick={() => loadWorks(true)}
                  variant="secondary"
                  className="w-full"
                >
                  もっと見る
                </Button>
              </div>
            )}
            
            {worksLoading && (
              <div className="p-8 flex justify-center">
                <Spinner />
              </div>
            )}
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