import { db } from './app';
import { collection, addDoc, serverTimestamp, doc, getDoc, getDocs, query, where, orderBy, limit, startAfter, DocumentSnapshot, updateDoc, deleteDoc } from 'firebase/firestore';
import { Work, CreateWorkInput } from '@/types/work';
import { WorkTag, TagCategory } from '@/types/tag';

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

// タグを正規化する関数
const normalizeTag = (tag: string): string => {
  return tag.trim().toLowerCase();
};

// タグからWorkTagオブジェクトを作成する関数
const createWorkTags = (tags: string[]): WorkTag[] => {
  return tags.map(tag => {
    const normalizedTag = normalizeTag(tag);
    return {
      id: `tag_${normalizedTag}`,
      name: normalizedTag,
      category: 'other' as TagCategory,
      isR18: false,
      color: '#3B82F6'
    };
  });
};

// コンテンツタイプの自動判定
const determineContentType = (input: CreateWorkInput): 'voice' | 'script' | 'image' | 'mixed' => {
  // ユーザーが明示的に指定した場合はそれを優先
  if (input.contentType) {
    return input.contentType;
  }

  const hasAudio = !!(input.audioUrl && input.audioId);
  const hasImage = !!(input.imageUrl && input.imageId);
  const hasScript = !!(input.script && input.script.trim());

  // 単体コンテンツの判定
  if (hasAudio && !hasImage && !hasScript) return 'voice';
  if (!hasAudio && hasImage && !hasScript) return 'image';
  if (!hasAudio && !hasImage && hasScript) return 'script';
  
  // 複合コンテンツまたはデフォルト
  return 'mixed';
};

// R18判定と年齢制限の計算
const calculateContentRating = (tags: WorkTag[], userSelectedRating?: 'all' | '18+'): { isR18Work: boolean; contentRating: 'all' | '12+' | '15+' | '18+' } => {
  // ユーザーが明示的に選択した年齢制限を優先
  if (userSelectedRating) {
    return {
      isR18Work: userSelectedRating === '18+',
      contentRating: userSelectedRating
    };
  }
  
  // フォールバック: タグベース判定
  const hasR18Tag = tags.some(tag => tag.isR18);
  return {
    isR18Work: hasR18Tag,
    contentRating: hasR18Tag ? '18+' : 'all'
  };
};

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

    // コンテンツタイプに基づくバリデーション
    const contentType = determineContentType(input);
    
    // 最低限1つのコンテンツが必要
    const hasAudio = !!(input.audioUrl && input.audioId);
    const hasImage = !!(input.imageUrl && input.imageId);
    const hasScript = !!(input.script && input.script.trim());
    
    if (!hasAudio && !hasImage && !hasScript) {
      return { success: false, error: '音声、画像、スクリプトのいずれかを設定してください' };
    }

    // タグ処理
    const workTags = input.tags ? createWorkTags(input.tags) : [];
    const tagIds = workTags.map(tag => tag.id);
    const tagNames = workTags.map(tag => tag.name);
    const { isR18Work, contentRating } = calculateContentRating(workTags, input.ageRating);

    const workData = {
      uid: userId,
      username,
      displayName,
      userPhotoURL: userPhotoURL || null,
      title: input.title.trim(),
      caption: input.caption?.trim() || '',
      script: input.script?.trim() || '',
      contentType: contentType,
      tags: workTags,
      tagIds,
      tagNames,
      isR18Work,
      contentRating,
      publishStatus: input.publishStatus || 'public', // デフォルトは公開
      imageUrl: input.imageUrl || null,
      imageId: input.imageId || null,
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

export const getWork = async (workId: string, currentUserId?: string): Promise<Work | null> => {
  try {
    const workDoc = await getDoc(doc(db, 'works', workId));
    
    if (!workDoc.exists()) {
      return null;
    }

    const data = workDoc.data();
    const publishStatus = data.publishStatus || 'public'; // 既存データはpublicとして扱う
    
    // 非公開作品の場合、作品の所有者のみアクセス可能
    if (publishStatus === 'private') {
      const isOwnWork = currentUserId && currentUserId === data.uid;
      if (!isOwnWork) {
        return null; // 非公開作品で所有者でない場合はnullを返す
      }
    }
    
    return {
      id: workDoc.id,
      uid: data.uid,
      username: data.username,
      displayName: data.displayName,
      userPhotoURL: data.userPhotoURL,
      title: data.title,
      caption: data.caption,
      script: data.script || undefined,
      contentType: data.contentType || 'legacy', // 既存データはlegacyとして扱う
      tags: data.tags || [],
      tagIds: data.tagIds || [],
      tagNames: data.tagNames || [],
      isR18Work: data.isR18Work || false,
      contentRating: data.contentRating || 'all',
      publishStatus: publishStatus,
      imageUrl: data.imageUrl || undefined,
      imageId: data.imageId || undefined,
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
  lastDoc?: DocumentSnapshot,
  currentUserId?: string // 現在ログイン中のユーザーID（自分の作品を見る場合）
): Promise<Work[]> => {
  try {
    console.log('=== getUserWorks 開始 ===');
    console.log('userId:', userId);
    console.log('currentUserId:', currentUserId);
    console.log('limitCount:', limitCount);
    
    const worksCollection = collection(db, 'works');
    
    // 自分の作品を見る場合は全て表示、他人の作品は公開のみ
    const isOwnProfile = currentUserId && currentUserId === userId;
    console.log('isOwnProfile:', isOwnProfile);
    
    let q;
    
    if (isOwnProfile) {
      // 自分の作品を見る場合は公開設定に関係なく全て表示
      console.log('自分のプロフィール: 全作品を取得');
      q = query(
        worksCollection,
        where('uid', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
    } else {
      // 他人の作品を見る場合は公開のみ表示（既存データ対応で条件を緩和）
      console.log('他人のプロフィール: 公開作品のみ取得');
      q = query(
        worksCollection,
        where('uid', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      // 注意: 他人のプライベート作品のフィルタリングは一旦アプリケーション層で処理
    }

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    console.log('Firestoreクエリ実行中...');
    const querySnapshot = await getDocs(q);
    console.log('クエリ結果件数:', querySnapshot.size);
    
    const works: Work[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const publishStatus = data.publishStatus || 'public'; // 既存データはpublicとして扱う
      
      console.log(`作品ID: ${doc.id}, タイトル: ${data.title}, 公開状態: ${publishStatus}`);
      
      // 他人の作品の場合はプライベート作品を除外
      if (!isOwnProfile && publishStatus === 'private') {
        console.log(`スキップ: 他人の非公開作品 (${doc.id})`);
        return; // スキップ
      }
      
      console.log(`追加: 作品 (${doc.id})`);
      works.push({
        id: doc.id,
        uid: data.uid,
        username: data.username,
        displayName: data.displayName,
        userPhotoURL: data.userPhotoURL,
        title: data.title,
        caption: data.caption,
        script: data.script || undefined,
        contentType: data.contentType || 'legacy',
        tags: data.tags || [],
        tagIds: data.tagIds || [],
        tagNames: data.tagNames || [],
        isR18Work: data.isR18Work || false,
        contentRating: data.contentRating || 'all',
        publishStatus: publishStatus,
        imageUrl: data.imageUrl || undefined,
        imageId: data.imageId || undefined,
        audioUrl: data.audioUrl || undefined,
        audioId: data.audioId || undefined,
        audioOriginalFilename: data.audioOriginalFilename || undefined,
        likeCount: data.likeCount || 0,
        replyCount: data.replyCount || 0,
        commentCount: data.commentCount || 0,
        retweetCount: data.retweetCount || 0,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      });
    });

    console.log('最終的な作品数:', works.length);
    console.log('=== getUserWorks 完了 ===');
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
    
    // publishStatusフィールドの有無に関係なく全データを取得し、アプリケーション層でフィルタリング
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
      const publishStatus = data.publishStatus || 'public'; // 既存データはpublicとして扱う
      
      // プライベート作品は除外
      if (publishStatus === 'private') {
        return; // スキップ
      }
      
      works.push({
        id: doc.id,
        uid: data.uid,
        username: data.username,
        displayName: data.displayName,
        userPhotoURL: data.userPhotoURL,
        title: data.title,
        caption: data.caption,
        script: data.script || undefined,
        contentType: data.contentType || 'legacy',
        tags: data.tags || [],
        tagIds: data.tagIds || [],
        tagNames: data.tagNames || [],
        isR18Work: data.isR18Work || false,
        contentRating: data.contentRating || 'all',
        publishStatus: publishStatus,
        imageUrl: data.imageUrl || undefined,
        imageId: data.imageId || undefined,
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

    // コンテンツタイプに基づくバリデーション
    const contentType = determineContentType(input);
    
    // 最低限1つのコンテンツが必要
    const hasAudio = !!(input.audioUrl && input.audioId);
    const hasImage = !!(input.imageUrl && input.imageId);
    const hasScript = !!(input.script && input.script.trim());
    
    if (!hasAudio && !hasImage && !hasScript) {
      return { success: false, error: '音声、画像、スクリプトのいずれかを設定してください' };
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

    // タグ処理
    const workTags = input.tags ? createWorkTags(input.tags) : [];
    const tagIds = workTags.map(tag => tag.id);
    const tagNames = workTags.map(tag => tag.name);
    const { isR18Work, contentRating } = calculateContentRating(workTags, input.ageRating);

    // 更新データ
    const updateData = {
      title: input.title.trim(),
      caption: input.caption?.trim() || '',
      script: input.script?.trim() || '',
      contentType: contentType,
      tags: workTags,
      tagIds,
      tagNames,
      isR18Work,
      contentRating,
      publishStatus: input.publishStatus || 'public', // デフォルトは公開
      imageUrl: input.imageUrl || null,
      imageId: input.imageId || null,
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