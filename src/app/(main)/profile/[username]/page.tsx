'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { getUserByUsername, getUserPosts } from '@/lib/firebase/firestore';
import { User } from '@/types/user';
import { Post } from '@/types/post';
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
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);

  const isOwnProfile = userData?.username === username;

  useEffect(() => {
    loadProfile();
  }, [username]);

  useEffect(() => {
    if (profileUser) {
      loadPosts();
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

  const loadPosts = async (loadMore = false) => {
    if (!profileUser || postsLoading) return;
    
    setPostsLoading(true);
    try {
      const result = await getUserPosts(
        profileUser.uid,
        10,
        loadMore ? lastDoc : undefined
      );
      
      if (result.success) {
        if (loadMore) {
          setPosts(prev => [...prev, ...result.posts]);
        } else {
          setPosts(result.posts);
        }
        setLastDoc(result.lastDoc);
        setHasMore(result.hasMore);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
      toast.error('投稿の読み込みに失敗しました');
    } finally {
      setPostsLoading(false);
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
                  {posts.length} 投稿
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-lg shadow">
            <ProfileDisplay
              user={profileUser}
              posts={posts}
              isOwnProfile={isOwnProfile}
              onEditClick={() => setIsEditModalOpen(true)}
            />
            
            {posts.length > 0 && hasMore && !postsLoading && (
              <div className="p-4 border-t">
                <Button
                  onClick={() => loadPosts(true)}
                  variant="secondary"
                  className="w-full"
                >
                  もっと見る
                </Button>
              </div>
            )}
            
            {postsLoading && (
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