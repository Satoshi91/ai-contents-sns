'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { signOut } from '@/lib/firebase/auth';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { ProfileDropdown } from '@/components/ui/ProfileDropdown';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useRouter } from 'next/navigation';
import { getImageURL } from '@/lib/cloudflare/images';
import toast from 'react-hot-toast';
import { User, UserCircle } from 'lucide-react';

export default function HomePage() {
  const { user, userData, isAnonymous } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const result = await signOut();
      if (result.success) {
        toast.success('ログアウトしました');
        router.push('/login');
      } else {
        toast.error('ログアウトに失敗しました');
      }
    } catch (error) {
      toast.error('エラーが発生しました');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const profileImageUrl = userData?.photoURL?.includes('profile-')
    ? getImageURL(userData.photoURL, 'avatar')
    : userData?.photoURL;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">Twitter Clone</h1>
              <div className="flex items-center">
                {userData && !isAnonymous ? (
                  <ProfileDropdown
                    user={userData}
                    profileImageUrl={profileImageUrl}
                    onLogout={handleLogout}
                  />
                ) : (
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200">
                    <UserCircle
                      size={24}
                      className="text-gray-400"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">
              {isAnonymous ? 'ゲストとしてログイン中' : 'ようこそ！'}
            </h2>
            
            {isAnonymous ? (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 text-sm">
                    <span className="font-medium">ゲストモード:</span> 
                    現在ゲストとしてアプリを体験中です。すべての機能を利用するには、アカウントを作成してください。
                  </p>
                </div>
                <div className="flex space-x-3">
                  <Button
                    onClick={() => router.push('/signup')}
                    size="sm"
                  >
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
            ) : (
              <div className="space-y-2">
                <p className="text-gray-900">
                  <span className="font-medium">メールアドレス:</span> {user?.email || 'なし'}
                </p>
                {userData && (
                  <>
                    <p className="text-gray-900">
                      <span className="font-medium">ユーザー名:</span> @{userData.username}
                    </p>
                    <p className="text-gray-900">
                      <span className="font-medium">表示名:</span> {userData.displayName}
                    </p>
                    {!isAnonymous && (
                      <Button
                        onClick={() => router.push(`/profile/${userData.username}`)}
                        size="sm"
                        className="mt-3"
                      >
                        <User size={16} className="mr-1" />
                        プロフィールを見る
                      </Button>
                    )}
                  </>
                )}
              </div>
            )}
            
            <p className="mt-4 text-gray-600">
              これはホームページです。今後、タイムラインと投稿機能を実装していきます。
            </p>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}