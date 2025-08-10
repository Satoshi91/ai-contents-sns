import { useState, useEffect, useCallback } from 'react';
import { 
  followUser, 
  unfollowUser, 
  getFollowStatus, 
  getFollowStats,
  getFollowers,
  getFollowing,
  getFollowFeed,
  hasFollowFeed
} from '@/lib/firebase/follow';
import { FollowStatus, FollowStats, FollowUser } from '@/types/follow';
import { Work } from '@/types/work';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useAgeRating, AgeFilter } from '@/lib/contexts/AgeRatingContext';
import toast from 'react-hot-toast';

/**
 * フォロー状態を管理するフック
 */
export function useFollowStatus(targetUserId: string) {
  const { user } = useAuth();
  const [followStatus, setFollowStatus] = useState<FollowStatus>({
    isFollowing: false,
    isFollower: false,
    isMutual: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid || !targetUserId) {
      setLoading(false);
      return;
    }

    const fetchFollowStatus = async () => {
      try {
        const status = await getFollowStatus(user.uid, targetUserId);
        setFollowStatus(status);
      } catch (error) {
        console.error('フォロー状態の取得に失敗しました:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFollowStatus();
  }, [user?.uid, targetUserId]);

  const toggleFollow = useCallback(async () => {
    if (!user?.uid) {
      toast.error('ログインが必要です');
      return;
    }

    if (user.uid === targetUserId) {
      toast.error('自分自身をフォローすることはできません');
      return;
    }

    setLoading(true);
    try {
      const result = followStatus.isFollowing
        ? await unfollowUser(user.uid, targetUserId)
        : await followUser(user.uid, targetUserId);

      if (result.success) {
        setFollowStatus(prev => ({
          ...prev,
          isFollowing: !prev.isFollowing,
          isMutual: prev.isFollower && !prev.isFollowing,
        }));
        toast.success(followStatus.isFollowing ? 'フォローを解除しました' : 'フォローしました');
      } else {
        toast.error(result.error || '操作に失敗しました');
      }
    } catch (error) {
      console.error('フォロー操作エラー:', error);
      toast.error('操作に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [user?.uid, targetUserId, followStatus.isFollowing, followStatus.isFollower]);

  return {
    ...followStatus,
    loading,
    toggleFollow,
  };
}

/**
 * フォロー統計を取得するフック
 */
export function useFollowStats(userId: string) {
  const [stats, setStats] = useState<FollowStats>({
    followerCount: 0,
    followingCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        const fetchedStats = await getFollowStats(userId);
        setStats(fetchedStats);
      } catch (error) {
        console.error('フォロー統計の取得に失敗しました:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId]);

  return { ...stats, loading };
}

/**
 * フォロワー一覧を取得するフック
 */
export function useFollowers(userId: string, limit: number = 50) {
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchFollowers = async () => {
      try {
        const fetchedFollowers = await getFollowers(userId, limit);
        setFollowers(fetchedFollowers);
      } catch (error) {
        console.error('フォロワー一覧の取得に失敗しました:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFollowers();
  }, [userId, limit]);

  return { followers, loading };
}

/**
 * フォロー中一覧を取得するフック
 */
export function useFollowing(userId: string, limit: number = 50) {
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchFollowing = async () => {
      try {
        const fetchedFollowing = await getFollowing(userId, limit);
        setFollowing(fetchedFollowing);
      } catch (error) {
        console.error('フォロー中一覧の取得に失敗しました:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFollowing();
  }, [userId, limit]);

  return { following, loading };
}

/**
 * フォローフィードを取得するフック
 */
export function useFollowFeed(userId: string, totalLimit: number = 20) {
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasFeeds, setHasFeeds] = useState(false);
  const { ageFilter } = useAgeRating();

  // 年齢制限フィルタリング関数
  const applyAgeFilter = (works: Work[], filter: AgeFilter): Work[] => {
    switch (filter) {
      case 'all':
        return works.filter(work => work.contentRating !== '18+');
      case 'r18-only':
        return works.filter(work => work.contentRating === '18+');
      case 'r18-allowed':
      default:
        return works; // フィルタリングなし
    }
  };

  const fetchFeed = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // フォローフィードが存在するかチェック
      const feedExists = await hasFollowFeed(userId);
      setHasFeeds(feedExists);

      if (!feedExists) {
        setWorks([]);
        return;
      }

      // フォローフィードを取得
      let feedWorks = await getFollowFeed(userId, 5, totalLimit);
      
      // 年齢制限フィルタリング適用
      feedWorks = applyAgeFilter(feedWorks, ageFilter);
      
      setWorks(feedWorks);
    } catch (err) {
      console.error('フォローフィード取得エラー:', err);
      setError('フィードの取得に失敗しました');
      setWorks([]);
    } finally {
      setLoading(false);
    }
  }, [userId, totalLimit, ageFilter]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  return { 
    works, 
    loading, 
    error, 
    hasFeeds,
    refetch: fetchFeed 
  };
}

/**
 * フォローフィードの存在を確認するフック
 */
export function useHasFollowFeed(userId: string) {
  const [hasFeeds, setHasFeeds] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const checkFeed = async () => {
      try {
        const feedExists = await hasFollowFeed(userId);
        setHasFeeds(feedExists);
      } catch (error) {
        console.error('フォローフィード確認エラー:', error);
        setHasFeeds(false);
      } finally {
        setLoading(false);
      }
    };

    checkFeed();
  }, [userId]);

  return { hasFeeds, loading };
}