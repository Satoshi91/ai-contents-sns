import {
  doc,
  getDoc,
  arrayUnion,
  arrayRemove,
  increment,
  serverTimestamp,
  writeBatch,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from 'firebase/firestore';
import { db } from './app';
import { FollowersDoc, FollowingDoc, FollowResult, FollowStatus, FollowStats, FollowUser } from '@/types/follow';
import { User } from '@/types/user';
import { Work } from '@/types/work';

/**
 * ユーザーをフォローする
 */
export async function followUser(
  followerId: string,
  followingId: string
): Promise<FollowResult> {
  if (followerId === followingId) {
    return { success: false, error: '自分自身をフォローすることはできません' };
  }

  try {
    const batch = writeBatch(db);

    // 1. フォロー先のフォロワーリストに追加
    const followersRef = doc(db, 'followers', followingId);
    const followersDoc = await getDoc(followersRef);
    
    if (followersDoc.exists()) {
      const data = followersDoc.data() as FollowersDoc;
      if (data.users.includes(followerId)) {
        return { success: false, error: '既にフォローしています' };
      }
      
      batch.update(followersRef, {
        users: arrayUnion(followerId),
        count: increment(1),
        lastUpdated: serverTimestamp(),
      });
    } else {
      // 初回フォロワーの場合、新規作成
      batch.set(followersRef, {
        users: [followerId],
        count: 1,
        lastUpdated: serverTimestamp(),
      });
    }

    // 2. 自分のフォロー中リストに追加
    const followingRef = doc(db, 'following', followerId);
    const followingDoc = await getDoc(followingRef);
    
    if (followingDoc.exists()) {
      batch.update(followingRef, {
        users: arrayUnion(followingId),
        count: increment(1),
        lastUpdated: serverTimestamp(),
      });
    } else {
      // 初回フォローの場合、新規作成
      batch.set(followingRef, {
        users: [followingId],
        count: 1,
        lastUpdated: serverTimestamp(),
      });
    }

    // 3. ユーザーのカウンターを更新
    const followerUserRef = doc(db, 'users', followerId);
    batch.update(followerUserRef, {
      followingCount: increment(1),
    });

    const followingUserRef = doc(db, 'users', followingId);
    batch.update(followingUserRef, {
      followerCount: increment(1),
    });

    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error('フォローエラー:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'フォローに失敗しました' 
    };
  }
}

/**
 * ユーザーのフォローを解除する
 */
export async function unfollowUser(
  followerId: string,
  followingId: string
): Promise<FollowResult> {
  if (followerId === followingId) {
    return { success: false, error: '自分自身のフォローを解除することはできません' };
  }

  try {
    const batch = writeBatch(db);

    // 1. フォロー先のフォロワーリストから削除
    const followersRef = doc(db, 'followers', followingId);
    const followersDoc = await getDoc(followersRef);
    
    if (!followersDoc.exists()) {
      return { success: false, error: 'フォローしていません' };
    }
    
    const followersData = followersDoc.data() as FollowersDoc;
    if (!followersData.users.includes(followerId)) {
      return { success: false, error: 'フォローしていません' };
    }

    batch.update(followersRef, {
      users: arrayRemove(followerId),
      count: increment(-1),
      lastUpdated: serverTimestamp(),
    });

    // 2. 自分のフォロー中リストから削除
    const followingRef = doc(db, 'following', followerId);
    batch.update(followingRef, {
      users: arrayRemove(followingId),
      count: increment(-1),
      lastUpdated: serverTimestamp(),
    });

    // 3. ユーザーのカウンターを更新
    const followerUserRef = doc(db, 'users', followerId);
    batch.update(followerUserRef, {
      followingCount: increment(-1),
    });

    const followingUserRef = doc(db, 'users', followingId);
    batch.update(followingUserRef, {
      followerCount: increment(-1),
    });

    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error('アンフォローエラー:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'フォロー解除に失敗しました' 
    };
  }
}

/**
 * フォロー状態を確認する
 */
export async function getFollowStatus(
  currentUserId: string,
  targetUserId: string
): Promise<FollowStatus> {
  try {
    // 自分がターゲットをフォローしているか
    const followingRef = doc(db, 'following', currentUserId);
    const followingDoc = await getDoc(followingRef);
    const isFollowing = followingDoc.exists() 
      ? (followingDoc.data() as FollowingDoc).users.includes(targetUserId)
      : false;

    // ターゲットが自分をフォローしているか
    const followersRef = doc(db, 'followers', currentUserId);
    const followersDoc = await getDoc(followersRef);
    const isFollower = followersDoc.exists()
      ? (followersDoc.data() as FollowersDoc).users.includes(targetUserId)
      : false;

    return {
      isFollowing,
      isFollower,
      isMutual: isFollowing && isFollower,
    };
  } catch (error) {
    console.error('フォロー状態取得エラー:', error);
    return {
      isFollowing: false,
      isFollower: false,
      isMutual: false,
    };
  }
}

/**
 * フォロー統計を取得する
 */
export async function getFollowStats(userId: string): Promise<FollowStats> {
  try {
    const [followersDoc, followingDoc] = await Promise.all([
      getDoc(doc(db, 'followers', userId)),
      getDoc(doc(db, 'following', userId)),
    ]);

    const followerCount = followersDoc.exists() 
      ? (followersDoc.data() as FollowersDoc).count 
      : 0;
    
    const followingCount = followingDoc.exists()
      ? (followingDoc.data() as FollowingDoc).count
      : 0;

    return { followerCount, followingCount };
  } catch (error) {
    console.error('フォロー統計取得エラー:', error);
    return { followerCount: 0, followingCount: 0 };
  }
}

/**
 * フォロワー一覧を取得する
 */
export async function getFollowers(
  userId: string,
  limit: number = 50
): Promise<FollowUser[]> {
  try {
    const followersRef = doc(db, 'followers', userId);
    const followersDoc = await getDoc(followersRef);
    
    if (!followersDoc.exists()) {
      return [];
    }

    const followersData = followersDoc.data() as FollowersDoc;
    const followerIds = followersData.users.slice(0, limit);
    
    // 各フォロワーのユーザー情報を取得
    const followers: FollowUser[] = [];
    for (const followerId of followerIds) {
      const userDoc = await getDoc(doc(db, 'users', followerId));
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        followers.push({
          uid: followerId,
          username: userData.username,
          displayName: userData.displayName,
          photoURL: userData.photoURL,
          bio: userData.bio,
        });
      }
    }

    return followers;
  } catch (error) {
    console.error('フォロワー一覧取得エラー:', error);
    return [];
  }
}

/**
 * フォロー中一覧を取得する
 */
export async function getFollowing(
  userId: string,
  limit: number = 50
): Promise<FollowUser[]> {
  try {
    const followingRef = doc(db, 'following', userId);
    const followingDoc = await getDoc(followingRef);
    
    if (!followingDoc.exists()) {
      return [];
    }

    const followingData = followingDoc.data() as FollowingDoc;
    const followingIds = followingData.users.slice(0, limit);
    
    // 各フォロー中ユーザーの情報を取得
    const following: FollowUser[] = [];
    for (const followingId of followingIds) {
      const userDoc = await getDoc(doc(db, 'users', followingId));
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        following.push({
          uid: followingId,
          username: userData.username,
          displayName: userData.displayName,
          photoURL: userData.photoURL,
          bio: userData.bio,
        });
      }
    }

    return following;
  } catch (error) {
    console.error('フォロー中一覧取得エラー:', error);
    return [];
  }
}

/**
 * フォローしているユーザーの作品フィードを取得する
 * Pull Model: リクエスト時にフォロー先の作品を動的に取得
 */
export async function getFollowFeed(
  userId: string,
  limitPerUser: number = 5,
  totalLimit: number = 20
): Promise<Work[]> {
  try {
    // 1. フォロー中のユーザー一覧を取得
    const followingRef = doc(db, 'following', userId);
    const followingDoc = await getDoc(followingRef);
    
    if (!followingDoc.exists()) {
      return [];
    }

    const followingData = followingDoc.data() as FollowingDoc;
    const followingIds = followingData.users;

    if (followingIds.length === 0) {
      return [];
    }

    // 2. 各フォロー中ユーザーの最新作品を取得
    const allWorks: Work[] = [];
    
    // バッチサイズを制限してパフォーマンスを向上
    const batchSize = 10;
    for (let i = 0; i < followingIds.length && i < batchSize; i++) {
      const followingId = followingIds[i];
      
      try {
        const worksQuery = query(
          collection(db, 'works'),
          where('uid', '==', followingId),
          orderBy('createdAt', 'desc'),
          limit(limitPerUser)
        );
        
        const worksSnapshot = await getDocs(worksQuery);
        const userWorks: Work[] = worksSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            uid: data.uid,
            username: data.username,
            displayName: data.displayName,
            userPhotoURL: data.userPhotoURL,
            title: data.title,
            caption: data.caption || '',
            imageUrl: data.imageUrl,
            imageId: data.imageId,
            audioUrl: data.audioUrl,
            audioId: data.audioId,
            audioOriginalFilename: data.audioOriginalFilename,
            likeCount: data.likeCount || 0,
            replyCount: data.replyCount || 0,
            retweetCount: data.retweetCount || 0,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as Work;
        });
        
        allWorks.push(...userWorks);
      } catch (error) {
        console.error(`フォローユーザー ${followingId} の作品取得エラー:`, error);
        // 個別のユーザーでエラーが発生しても処理を継続
        continue;
      }
    }

    // 3. 時系列でソートして制限数まで返す
    const sortedWorks = allWorks
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, totalLimit);

    return sortedWorks;
  } catch (error) {
    console.error('フォローフィード取得エラー:', error);
    return [];
  }
}

/**
 * フォローフィードが存在するかチェック
 */
export async function hasFollowFeed(userId: string): Promise<boolean> {
  try {
    const followingRef = doc(db, 'following', userId);
    const followingDoc = await getDoc(followingRef);
    
    if (!followingDoc.exists()) {
      return false;
    }

    const followingData = followingDoc.data() as FollowingDoc;
    return followingData.users.length > 0;
  } catch (error) {
    console.error('フォローフィード存在チェックエラー:', error);
    return false;
  }
}