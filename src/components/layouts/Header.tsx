'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { signOut } from '@/lib/firebase/auth';
import { Button } from '@/components/ui/Button';
import { ProfileDropdown } from '@/components/ui/ProfileDropdown';
import { LoginModal } from '@/components/ui/LoginModal';
import { useRouter } from 'next/navigation';
import { getImageURL } from '@/lib/cloudflare/images';
import toast from 'react-hot-toast';
import { UserCircle, PenSquare, Menu } from 'lucide-react';

interface HeaderProps {
  onMenuToggle?: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { user, userData, isAnonymous } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const result = await signOut();
      if (result.success) {
        toast.success('ログアウトしました');
        router.push('/home');
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
    <header className="bg-white shadow">
      <div className="mx-4 px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            {onMenuToggle && (
              <button
                onClick={onMenuToggle}
                className="cursor-pointer hover:bg-gray-100 rounded-full p-2 transition-colors duration-200"
                aria-label="メニューを開く"
              >
                <Menu size={20} />
              </button>
            )}
            <h1
              className="text-2xl font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors duration-200 select-none"
              onClick={() => router.push('/home')}
            >
              Twitter Clone
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            {user && !isAnonymous && (
              <Button
                onClick={() => router.push('/compose')}
                size="sm"
                className="flex items-center cursor-pointer"
              >
                <PenSquare size={16} className="mr-2" />
                投稿
              </Button>
            )}
            {user && !isAnonymous ? (
              <ProfileDropdown
                user={userData || {
                  uid: user?.uid || '',
                  username: user?.email?.split('@')[0] || 'user',
                  displayName: user?.displayName || user?.email?.split('@')[0] || 'ユーザー',
                  email: user?.email || '',
                  photoURL: user?.photoURL,
                  bio: '',
                  createdAt: new Date(),
                  updatedAt: new Date(),
                }}
                profileImageUrl={profileImageUrl || user?.photoURL}
                onLogout={handleLogout}
              />
            ) : (
              <Button
                onClick={() => setIsLoginModalOpen(true)}
                variant="secondary"
                size="sm"
                className="cursor-pointer"
              >
                ログイン
              </Button>
            )}
          </div>
        </div>
      </div>
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </header>
  );
}