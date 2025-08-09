import { db } from './app';
import { collection, addDoc, serverTimestamp, doc, getDoc, getDocs, query, where, orderBy, limit, startAfter, DocumentSnapshot, updateDoc, deleteDoc } from 'firebase/firestore';
import { Work, CreateWorkInput } from '@/types/work';

export interface CreateWorkResult {
  success: boolean;
  workId?: string;
  error?: string;
}

export interface UpdateWorkResult {
  success: boolean;
  error?: string;
}

export interface DeleteWorkResult {
  success: boolean;
  error?: string;
}

export const createWork = async (
  input: CreateWorkInput,
  userId: string,
  username: string,
  displayName: string,
  userPhotoURL?: string | null
): Promise<CreateWorkResult> => {
  try {
    if (!userId) {
      return { success: false, error: 'ユーザーIDが必要です' };
    }

    if (!input.title.trim()) {
      return { success: false, error: 'タイトルを入力してください' };
    }

    if (!input.caption.trim()) {
      return { success: false, error: 'キャプションを入力してください' };
    }

    const workData = {
      uid: userId,
      username,
      displayName,
      userPhotoURL: userPhotoURL || null,
      title: input.title.trim(),
      caption: input.caption.trim(),
      audioUrl: input.audioUrl || null,
      audioId: input.audioId || null,
      audioOriginalFilename: input.audioOriginalFilename || null,
      likeCount: 0,
      replyCount: 0,
      retweetCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const worksCollection = collection(db, 'works');
    const docRef = await addDoc(worksCollection, workData);

    return {
      success: true,
      workId: docRef.id,
    };
  } catch (error) {
    console.error('作品作成エラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '作品の作成に失敗しました',
    };
  }
};

export const getWork = async (workId: string): Promise<Work | null> => {
  try {
    const workDoc = await getDoc(doc(db, 'works', workId));
    
    if (!workDoc.exists()) {
      return null;
    }

    const data = workDoc.data();
    return {
      id: workDoc.id,
      uid: data.uid,
      username: data.username,
      displayName: data.displayName,
      userPhotoURL: data.userPhotoURL,
      title: data.title,
      caption: data.caption,
      audioUrl: data.audioUrl || undefined,
      audioId: data.audioId || undefined,
      audioOriginalFilename: data.audioOriginalFilename || undefined,
      likeCount: data.likeCount || 0,
      replyCount: data.replyCount || 0,
      retweetCount: data.retweetCount || 0,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  } catch (error) {
    console.error('作品取得エラー:', error);
    return null;
  }
};

export const getUserWorks = async (
  userId: string,
  limitCount: number = 10,
  lastDoc?: DocumentSnapshot
): Promise<Work[]> => {
  try {
    const worksCollection = collection(db, 'works');
    let q = query(
      worksCollection,
      where('uid', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const querySnapshot = await getDocs(q);
    const works: Work[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      works.push({
        id: doc.id,
        uid: data.uid,
        username: data.username,
        displayName: data.displayName,
        userPhotoURL: data.userPhotoURL,
        title: data.title,
        caption: data.caption,
        audioUrl: data.audioUrl || undefined,
        audioId: data.audioId || undefined,
        likeCount: data.likeCount || 0,
        replyCount: data.replyCount || 0,
        retweetCount: data.retweetCount || 0,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      });
    });

    return works;
  } catch (error) {
    console.error('ユーザー作品取得エラー:', error);
    return [];
  }
};

export const getAllWorks = async (
  limitCount: number = 10,
  lastDoc?: DocumentSnapshot
): Promise<Work[]> => {
  try {
    const worksCollection = collection(db, 'works');
    let q = query(
      worksCollection,
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const querySnapshot = await getDocs(q);
    const works: Work[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      works.push({
        id: doc.id,
        uid: data.uid,
        username: data.username,
        displayName: data.displayName,
        userPhotoURL: data.userPhotoURL,
        title: data.title,
        caption: data.caption,
        audioUrl: data.audioUrl || undefined,
        audioId: data.audioId || undefined,
        likeCount: data.likeCount || 0,
        replyCount: data.replyCount || 0,
        retweetCount: data.retweetCount || 0,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      });
    });

    return works;
  } catch (error) {
    console.error('全作品取得エラー:', error);
    return [];
  }
};

export const updateWork = async (
  workId: string,
  input: CreateWorkInput,
  userId: string
): Promise<UpdateWorkResult> => {
  try {
    if (!userId) {
      return { success: false, error: 'ユーザーIDが必要です' };
    }

    if (!input.title.trim()) {
      return { success: false, error: 'タイトルを入力してください' };
    }

    if (!input.caption.trim()) {
      return { success: false, error: 'キャプションを入力してください' };
    }

    // 作品の存在確認と権限チェック
    const workDoc = await getDoc(doc(db, 'works', workId));
    if (!workDoc.exists()) {
      return { success: false, error: '作品が見つかりません' };
    }

    const workData = workDoc.data();
    if (workData.uid !== userId) {
      return { success: false, error: '編集権限がありません' };
    }

    // 更新データ
    const updateData = {
      title: input.title.trim(),
      caption: input.caption.trim(),
      audioUrl: input.audioUrl || null,
      audioId: input.audioId || null,
      audioOriginalFilename: input.audioOriginalFilename || null,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(doc(db, 'works', workId), updateData);

    return { success: true };
  } catch (error) {
    console.error('作品更新エラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '作品の更新に失敗しました',
    };
  }
};

export const deleteWork = async (
  workId: string,
  userId: string
): Promise<DeleteWorkResult> => {
  try {
    if (!userId) {
      return { success: false, error: 'ユーザーIDが必要です' };
    }

    // 作品の存在確認と権限チェック
    const workDoc = await getDoc(doc(db, 'works', workId));
    if (!workDoc.exists()) {
      return { success: false, error: '作品が見つかりません' };
    }

    const workData = workDoc.data();
    if (workData.uid !== userId) {
      return { success: false, error: '削除権限がありません' };
    }

    await deleteDoc(doc(db, 'works', workId));

    return { success: true };
  } catch (error) {
    console.error('作品削除エラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '作品の削除に失敗しました',
    };
  }
};