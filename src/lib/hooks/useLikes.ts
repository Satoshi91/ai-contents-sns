import { useState, useEffect, useCallback } from 'react';
import { toggleLike, getUserLikes, UserLikes } from '@/lib/firebase/likes';
import { useAuth } from '@/lib/contexts/AuthContext';

interface LikeState {
  isLiked: boolean;
  likeCount: number;
}

interface UseLikesReturn {
  likeStates: Record<string, LikeState>;
  userLikes: UserLikes | null;
  loading: boolean;
  error: string | null;
  handleToggleLike: (workId: string, currentLikeCount: number) => Promise<void>;
  refreshUserLikes: () => Promise<void>;
  isWorkLiked: (workId: string) => boolean;
}

export function useLikes(): UseLikesReturn {
  const { user } = useAuth();
  const [likeStates, setLikeStates] = useState<Record<string, LikeState>>({});
  const [userLikes, setUserLikes] = useState<UserLikes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ユーザーのいいね情報を取得
  const refreshUserLikes = useCallback(async () => {
    if (!user?.uid) {
      setUserLikes(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const likes = await getUserLikes(user.uid);
      setUserLikes(likes);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'いいね情報の取得に失敗しました');
      console.error('ユーザーいいね取得エラー:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  // 初回読み込み
  useEffect(() => {
    refreshUserLikes();
  }, [refreshUserLikes]);

  // 特定の作品がいいねされているかチェック
  const isWorkLiked = useCallback((workId: string): boolean => {
    if (!userLikes) return false;
    return userLikes.likedWorkIds.includes(workId);
  }, [userLikes]);

  // いいねの切り替え処理
  const handleToggleLike = useCallback(async (
    workId: string,
    currentLikeCount: number
  ): Promise<void> => {
    if (!user?.uid) {
      setError('ログインが必要です');
      return;
    }

    const isCurrentlyLiked = isWorkLiked(workId);
    
    // 楽観的更新: UIを即座に更新
    setLikeStates(prev => ({
      ...prev,
      [workId]: {
        isLiked: !isCurrentlyLiked,
        likeCount: isCurrentlyLiked ? currentLikeCount - 1 : currentLikeCount + 1
      }
    }));

    // ユーザーのいいね情報も楽観的更新
    if (userLikes) {
      setUserLikes(prev => {
        if (!prev) return prev;
        
        const newLikedWorkIds = isCurrentlyLiked
          ? prev.likedWorkIds.filter(id => id !== workId)
          : [...prev.likedWorkIds, workId];
        
        return {
          ...prev,
          likedWorkIds: newLikedWorkIds
        };
      });
    }

    try {
      // Firebase側の処理
      const result = await toggleLike(workId, user.uid);
      
      if (!result.success) {
        // エラー時はロールバック
        setLikeStates(prev => ({
          ...prev,
          [workId]: {
            isLiked: isCurrentlyLiked,
            likeCount: currentLikeCount
          }
        }));
        
        // ユーザーのいいね情報もロールバック
        if (userLikes) {
          setUserLikes(prev => {
            if (!prev) return prev;
            
            return {
              ...prev,
              likedWorkIds: isCurrentlyLiked
                ? [...prev.likedWorkIds, workId]
                : prev.likedWorkIds.filter(id => id !== workId)
            };
          });
        }
        
        setError(result.error || 'いいねの処理に失敗しました');
        return;
      }

      // 成功時は正確な値で更新
      setLikeStates(prev => ({
        ...prev,
        [workId]: {
          isLiked: result.isLiked,
          likeCount: result.newLikeCount
        }
      }));

      setError(null);
    } catch (err) {
      // エラー時はロールバック
      setLikeStates(prev => ({
        ...prev,
        [workId]: {
          isLiked: isCurrentlyLiked,
          likeCount: currentLikeCount
        }
      }));
      
      if (userLikes) {
        setUserLikes(prev => {
          if (!prev) return prev;
          
          return {
            ...prev,
            likedWorkIds: isCurrentlyLiked
              ? [...prev.likedWorkIds, workId]
              : prev.likedWorkIds.filter(id => id !== workId)
          };
        });
      }
      
      const errorMessage = err instanceof Error ? err.message : 'いいねの処理に失敗しました';
      setError(errorMessage);
      console.error('いいね切り替えエラー:', err);
    }
  }, [user?.uid, userLikes, isWorkLiked]);

  return {
    likeStates,
    userLikes,
    loading,
    error,
    handleToggleLike,
    refreshUserLikes,
    isWorkLiked
  };
}