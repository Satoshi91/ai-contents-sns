'use client';

import { useFollowStatus } from '@/lib/hooks/useFollow';
import { Button } from './Button';

interface FollowButtonProps {
  targetUserId: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function FollowButton({ targetUserId, className = '', size = 'md' }: FollowButtonProps) {
  const { isFollowing, isMutual, loading, toggleFollow } = useFollowStatus(targetUserId);

  // ボタンのテキストを決定
  const getButtonText = () => {
    if (loading) return '...';
    if (isMutual) return 'フォロー中（相互）';
    if (isFollowing) return 'フォロー中';
    return 'フォロー';
  };

  // ボタンのスタイルを決定
  const getButtonVariant = () => {
    if (isFollowing) return 'secondary';
    return 'primary';
  };

  // サイズに応じたクラス
  const sizeClasses = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <Button
      onClick={toggleFollow}
      disabled={loading}
      variant={getButtonVariant()}
      className={`${sizeClasses[size]} min-w-[100px] transition-all duration-200 ${
        isFollowing 
          ? 'hover:bg-red-500 hover:text-white hover:border-red-500' 
          : ''
      } ${className}`}
      onMouseEnter={(e) => {
        if (isFollowing && !loading) {
          e.currentTarget.textContent = 'フォロー解除';
        }
      }}
      onMouseLeave={(e) => {
        if (isFollowing && !loading) {
          e.currentTarget.textContent = getButtonText();
        }
      }}
    >
      {getButtonText()}
    </Button>
  );
}