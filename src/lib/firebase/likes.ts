import { db } from './app';
import { doc, getDoc, updateDoc, serverTimestamp, runTransaction, arrayUnion, arrayRemove, getDocs, query, where, documentId } from 'firebase/firestore';
import { collection } from 'firebase/firestore';
import { Work } from '@/types/work';

export interface LikeResult {
  success: boolean;
  isLiked: boolean;
  newLikeCount: number;
  error?: string;
}

export interface UserLikes {
  likedWorkIds: string[];
  updatedAt: Date;
}

export const toggleLike = async (
  workId: string,
  userId: string
): Promise<LikeResult> => {
  try {
    if (!userId || !workId) {
      return {
        success: false,
        isLiked: false,
        newLikeCount: 0,
        error: 'ユーザーIDまたは作品IDが無効です'
      };
    }

    const result = await runTransaction(db, async (transaction) => {
      const likesRef = doc(db, 'likes', userId);
      const workRef = doc(db, 'works', workId);

      const [likesDoc, workDoc] = await Promise.all([
        transaction.get(likesRef),
        transaction.get(workRef)
      ]);

      if (!workDoc.exists()) {
        throw new Error('作品が見つかりません');
      }

      const currentLikedIds = likesDoc.exists() ? (likesDoc.data().likedWorkIds || []) : [];
      const currentLikeCount = workDoc.data().likeCount || 0;
      const isCurrentlyLiked = currentLikedIds.includes(workId);

      let newLikeCount: number;
      let isLiked: boolean;

      if (isCurrentlyLiked) {
        // いいねを削除
        transaction.update(likesRef, {
          likedWorkIds: arrayRemove(workId),
          updatedAt: serverTimestamp()
        });
        newLikeCount = Math.max(0, currentLikeCount - 1);
        isLiked = false;
      } else {
        // いいねを追加
        if (likesDoc.exists()) {
          transaction.update(likesRef, {
            likedWorkIds: arrayUnion(workId),
            updatedAt: serverTimestamp()
          });
        } else {
          transaction.set(likesRef, {
            likedWorkIds: [workId],
            updatedAt: serverTimestamp()
          });
        }
        newLikeCount = currentLikeCount + 1;
        isLiked = true;
      }

      // 作品のいいね数を更新
      transaction.update(workRef, {
        likeCount: newLikeCount
      });

      return { isLiked, newLikeCount };
    });

    return {
      success: true,
      isLiked: result.isLiked,
      newLikeCount: result.newLikeCount
    };
  } catch (error) {
    console.error('いいね切り替えエラー:', error);
    return {
      success: false,
      isLiked: false,
      newLikeCount: 0,
      error: error instanceof Error ? error.message : 'いいねの処理に失敗しました'
    };
  }
};

export const getUserLikes = async (userId: string): Promise<UserLikes | null> => {
  try {
    if (!userId) {
      return null;
    }

    const likesDoc = await getDoc(doc(db, 'likes', userId));
    
    if (!likesDoc.exists()) {
      return {
        likedWorkIds: [],
        updatedAt: new Date()
      };
    }

    const data = likesDoc.data();
    return {
      likedWorkIds: data.likedWorkIds || [],
      updatedAt: data.updatedAt?.toDate() || new Date()
    };
  } catch (error) {
    console.error('ユーザーいいね取得エラー:', error);
    return null;
  }
};

export const isWorkLiked = async (workId: string, userId: string): Promise<boolean> => {
  try {
    if (!userId || !workId) {
      return false;
    }

    const userLikes = await getUserLikes(userId);
    return userLikes ? userLikes.likedWorkIds.includes(workId) : false;
  } catch (error) {
    console.error('いいね状態確認エラー:', error);
    return false;
  }
};

export const getUserLikedWorks = async (userId: string): Promise<string[]> => {
  try {
    const userLikes = await getUserLikes(userId);
    return userLikes ? userLikes.likedWorkIds : [];
  } catch (error) {
    console.error('ユーザーいいね作品取得エラー:', error);
    return [];
  }
};

export const getWorksByIds = async (workIds: string[]): Promise<Work[]> => {
  try {
    if (!workIds || workIds.length === 0) {
      return [];
    }

    // Firestoreは一度に最大10個のIDでクエリ可能
    const batchSize = 10;
    const allWorks: Work[] = [];

    for (let i = 0; i < workIds.length; i += batchSize) {
      const batch = workIds.slice(i, i + batchSize);
      
      const worksQuery = query(
        collection(db, 'works'),
        where(documentId(), 'in', batch)
      );

      const querySnapshot = await getDocs(worksQuery);
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        allWorks.push({
          id: doc.id,
          uid: data.uid,
          username: data.username,
          displayName: data.displayName,
          userPhotoURL: data.userPhotoURL,
          title: data.title,
          caption: data.caption,
          description: data.description,
          prompt: data.prompt,
          imageUrl: data.imageUrl,
          imageId: data.imageId,
          audioUrl: data.audioUrl || undefined,
          audioId: data.audioId || undefined,
          audioOriginalFilename: data.audioOriginalFilename || undefined,
          likeCount: data.likeCount || 0,
          replyCount: data.replyCount || 0,
          commentCount: data.commentCount || 0,
          retweetCount: data.retweetCount || 0,
          tags: data.tags || [],
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        });
      });
    }

    // 元のworkIdsの順序を保持する
    const orderedWorks = workIds
      .map(id => allWorks.find(work => work.id === id))
      .filter((work): work is Work => work !== undefined);

    return orderedWorks;
  } catch (error) {
    console.error('作品一括取得エラー:', error);
    return [];
  }
};

export const getUserLikedWorksWithDetails = async (userId: string): Promise<Work[]> => {
  try {
    const likedWorkIds = await getUserLikedWorks(userId);
    if (likedWorkIds.length === 0) {
      return [];
    }

    // 最新のいいねを先頭に表示するため配列を逆順にする
    const reversedWorkIds = likedWorkIds.reverse();
    const works = await getWorksByIds(reversedWorkIds);
    return works;
  } catch (error) {
    console.error('ユーザーいいね作品詳細取得エラー:', error);
    return [];
  }
};