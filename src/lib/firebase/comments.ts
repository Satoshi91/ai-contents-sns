import { db } from './app';
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  deleteDoc,
  updateDoc,
  increment,
  runTransaction,
  Timestamp
} from 'firebase/firestore';
import { Comment, CreateCommentInput } from '@/types/comment';

export interface CreateCommentResult {
  success: boolean;
  commentId?: string;
  error?: string;
}

export interface DeleteCommentResult {
  success: boolean;
  error?: string;
}

// コメント作成
export const createComment = async (
  workId: string,
  input: CreateCommentInput,
  userId: string,
  username: string,
  displayName: string,
  userPhotoURL?: string | null,
  userImageId?: string
): Promise<CreateCommentResult> => {
  try {
    if (!userId) {
      return { success: false, error: 'ユーザーIDが必要です' };
    }

    if (!input.content.trim()) {
      return { success: false, error: 'コメント内容を入力してください' };
    }

    // トランザクションでコメント作成と作品のコメント数更新を同時実行
    const result = await runTransaction(db, async (transaction) => {
      // 作品の存在確認
      const workRef = doc(db, 'works', workId);
      const workDoc = await transaction.get(workRef);
      
      if (!workDoc.exists()) {
        throw new Error('作品が見つかりません');
      }

      // コメントデータ準備
      const commentData = {
        workId,
        uid: userId,
        username,
        displayName,
        userPhotoURL: userPhotoURL || null,
        userImageId: userImageId || null,
        content: input.content.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // コメント作成
      const commentsCollection = collection(db, 'comments');
      const commentRef = await addDoc(commentsCollection, commentData);

      // 作品のコメント数をインクリメント
      transaction.update(workRef, {
        commentCount: increment(1),
        updatedAt: serverTimestamp(),
      });

      return commentRef.id;
    });

    return {
      success: true,
      commentId: result,
    };
  } catch (error) {
    console.error('コメント作成エラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'コメントの作成に失敗しました',
    };
  }
};

// 作品のコメント一覧取得
export const getWorkComments = async (
  workId: string,
  limitCount: number = 20
): Promise<Comment[]> => {
  try {
    const commentsCollection = collection(db, 'comments');
    const q = query(
      commentsCollection,
      where('workId', '==', workId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const comments: Comment[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      comments.push({
        id: doc.id,
        workId: data.workId,
        uid: data.uid,
        username: data.username,
        displayName: data.displayName,
        userPhotoURL: data.userPhotoURL,
        userImageId: data.userImageId,
        content: data.content,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : undefined,
      });
    });

    return comments;
  } catch (error) {
    console.error('コメント取得エラー:', error);
    return [];
  }
};

// コメント削除
export const deleteComment = async (
  commentId: string,
  userId: string
): Promise<DeleteCommentResult> => {
  try {
    if (!userId) {
      return { success: false, error: 'ユーザーIDが必要です' };
    }

    // コメントの存在確認と権限チェック
    const commentDoc = await getDoc(doc(db, 'comments', commentId));
    if (!commentDoc.exists()) {
      return { success: false, error: 'コメントが見つかりません' };
    }

    const commentData = commentDoc.data();
    if (commentData.uid !== userId) {
      return { success: false, error: '削除権限がありません' };
    }

    // トランザクションでコメント削除と作品のコメント数更新を同時実行
    await runTransaction(db, async (transaction) => {
      // コメント削除
      const commentRef = doc(db, 'comments', commentId);
      transaction.delete(commentRef);

      // 作品のコメント数をデクリメント
      const workRef = doc(db, 'works', commentData.workId);
      transaction.update(workRef, {
        commentCount: increment(-1),
        updatedAt: serverTimestamp(),
      });
    });

    return { success: true };
  } catch (error) {
    console.error('コメント削除エラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'コメントの削除に失敗しました',
    };
  }
};

// ユーザーのコメント一覧取得
export const getUserComments = async (
  userId: string,
  limitCount: number = 20
): Promise<Comment[]> => {
  try {
    const commentsCollection = collection(db, 'comments');
    const q = query(
      commentsCollection,
      where('uid', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const comments: Comment[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      comments.push({
        id: doc.id,
        workId: data.workId,
        uid: data.uid,
        username: data.username,
        displayName: data.displayName,
        userPhotoURL: data.userPhotoURL,
        userImageId: data.userImageId,
        content: data.content,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : undefined,
      });
    });

    return comments;
  } catch (error) {
    console.error('ユーザーコメント取得エラー:', error);
    return [];
  }
};