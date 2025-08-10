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
  startAfter, 
  DocumentSnapshot, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { Content, CreateContentInput, ContentType } from '@/types/content';
import { WorkTag, TagCategory } from '@/types/tag';

export interface CreateContentResult {
  success: boolean;
  contentId?: string;
  error?: string;
}

export interface UpdateContentResult {
  success: boolean;
  error?: string;
}

export interface DeleteContentResult {
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

// R18判定と年齢制限の計算
const calculateContentRating = (tags: WorkTag[], userSelectedRating?: 'all' | '18+'): { isR18Content: boolean; contentRating: 'all' | '12+' | '15+' | '18+' } => {
  // ユーザーが明示的に選択した年齢制限を優先
  if (userSelectedRating) {
    return {
      isR18Content: userSelectedRating === '18+',
      contentRating: userSelectedRating
    };
  }
  
  // フォールバック: タグベース判定
  const hasR18Tag = tags.some(tag => tag.isR18);
  return {
    isR18Content: hasR18Tag,
    contentRating: hasR18Tag ? '18+' : 'all'
  };
};

// Content type validation
const validateContentInputByType = (input: CreateContentInput): boolean => {
  switch (input.type) {
    case 'voice':
      return !!(input.audioUrl && input.audioId);
    case 'script':
      return !!(input.scriptText && input.scriptText.trim());
    case 'image':
      return !!(input.imageUrl && input.imageId);
    case 'work':
      return !!(input.relatedContentIds && input.relatedContentIds.length > 0);
    default:
      return false;
  }
};

export const createContent = async (
  input: CreateContentInput,
  userId: string,
  username: string,
  displayName: string,
  userPhotoURL?: string | null
): Promise<CreateContentResult> => {
  try {
    if (!userId) {
      return { success: false, error: 'ユーザーIDが必要です' };
    }

    if (!input.title.trim()) {
      return { success: false, error: 'タイトルを入力してください' };
    }

    // Type-specific validation
    if (!validateContentInputByType(input)) {
      const errorMessages = {
        voice: '音声ファイルをアップロードしてください',
        script: 'スクリプトを入力してください',
        image: '画像をアップロードしてください',
        work: '関連コンテンツを選択してください'
      };
      return { success: false, error: errorMessages[input.type] };
    }

    // タグ処理
    const workTags = input.tags ? createWorkTags(input.tags) : [];
    const tagIds = workTags.map(tag => tag.id);
    const tagNames = workTags.map(tag => tag.name);
    const { isR18Content, contentRating } = calculateContentRating(workTags, input.ageRating);

    const contentData = {
      type: input.type,
      uid: userId,
      username,
      displayName,
      userPhotoURL: userPhotoURL || null,
      title: input.title.trim(),
      description: input.description?.trim() || '',
      
      // Type-specific fields
      audioUrl: input.audioUrl || null,
      audioId: input.audioId || null,
      audioOriginalFilename: input.audioOriginalFilename || null,
      scriptText: input.scriptText?.trim() || null,
      imageUrl: input.imageUrl || null,
      imageId: input.imageId || null,
      relatedContentIds: input.relatedContentIds || null,
      
      // Common fields
      tags: workTags,
      tagIds,
      tagNames,
      isR18Content,
      contentRating,
      likeCount: 0,
      commentCount: 0,
      replyCount: 0,
      retweetCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const contentsCollection = collection(db, 'contents');
    const docRef = await addDoc(contentsCollection, contentData);

    return {
      success: true,
      contentId: docRef.id,
    };
  } catch (error) {
    console.error('コンテンツ作成エラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'コンテンツの作成に失敗しました',
    };
  }
};

// 関連コンテンツを展開して取得する関数
export const getContentWithRelated = async (contentId: string): Promise<Content | null> => {
  try {
    const content = await getContent(contentId);
    if (!content || content.type !== 'work' || !content.relatedContentIds) {
      return content;
    }

    // 関連コンテンツを並行取得
    const relatedContents = await Promise.all(
      content.relatedContentIds.map(async (relatedId) => {
        try {
          return await getContent(relatedId);
        } catch (error) {
          console.warn(`関連コンテンツ取得エラー (ID: ${relatedId}):`, error);
          return null;
        }
      })
    );

    // nullを除外
    const validRelatedContents = relatedContents.filter((c): c is Content => c !== null);

    return {
      ...content,
      relatedContents: validRelatedContents
    };
  } catch (error) {
    console.error('関連コンテンツ付きの取得エラー:', error);
    return null;
  }
};

export const getContent = async (contentId: string): Promise<Content | null> => {
  try {
    const contentDoc = await getDoc(doc(db, 'contents', contentId));
    
    if (!contentDoc.exists()) {
      return null;
    }

    const data = contentDoc.data();
    return {
      id: contentDoc.id,
      type: data.type,
      uid: data.uid,
      username: data.username,
      displayName: data.displayName,
      userPhotoURL: data.userPhotoURL,
      title: data.title,
      description: data.description || undefined,
      
      // Type-specific fields
      audioUrl: data.audioUrl || undefined,
      audioId: data.audioId || undefined,
      audioOriginalFilename: data.audioOriginalFilename || undefined,
      scriptText: data.scriptText || undefined,
      imageUrl: data.imageUrl || undefined,
      imageId: data.imageId || undefined,
      relatedContentIds: data.relatedContentIds || undefined,
      
      // Common fields
      tags: data.tags || [],
      tagIds: data.tagIds || [],
      tagNames: data.tagNames || [],
      isR18Content: data.isR18Content || false,
      contentRating: data.contentRating || 'all',
      likeCount: data.likeCount || 0,
      commentCount: data.commentCount || 0,
      replyCount: data.replyCount || 0,
      retweetCount: data.retweetCount || 0,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  } catch (error) {
    console.error('コンテンツ取得エラー:', error);
    return null;
  }
};

export const getUserContents = async (
  userId: string,
  contentType?: ContentType,
  limitCount: number = 10,
  lastDoc?: DocumentSnapshot
): Promise<Content[]> => {
  try {
    const contentsCollection = collection(db, 'contents');
    let constraints: any[] = [
      where('uid', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    ];

    // Add content type filter if specified
    if (contentType) {
      constraints.unshift(where('type', '==', contentType));
    }

    let q = query(contentsCollection, ...constraints);

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const querySnapshot = await getDocs(q);
    const contents: Content[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      contents.push({
        id: doc.id,
        type: data.type,
        uid: data.uid,
        username: data.username,
        displayName: data.displayName,
        userPhotoURL: data.userPhotoURL,
        title: data.title,
        description: data.description || undefined,
        
        // Type-specific fields
        audioUrl: data.audioUrl || undefined,
        audioId: data.audioId || undefined,
        audioOriginalFilename: data.audioOriginalFilename || undefined,
        scriptText: data.scriptText || undefined,
        imageUrl: data.imageUrl || undefined,
        imageId: data.imageId || undefined,
        relatedContentIds: data.relatedContentIds || undefined,
        
        // Common fields
        tags: data.tags || [],
        tagIds: data.tagIds || [],
        tagNames: data.tagNames || [],
        isR18Content: data.isR18Content || false,
        contentRating: data.contentRating || 'all',
        likeCount: data.likeCount || 0,
        commentCount: data.commentCount || 0,
        replyCount: data.replyCount || 0,
        retweetCount: data.retweetCount || 0,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      });
    });

    return contents;
  } catch (error) {
    console.error('ユーザーコンテンツ取得エラー:', error);
    return [];
  }
};

// 関連コンテンツを展開してリスト取得する関数
export const getAllContentsWithRelated = async (
  contentType?: ContentType,
  limitCount: number = 10,
  lastDoc?: DocumentSnapshot,
  expandRelated: boolean = false
): Promise<Content[]> => {
  const contents = await getAllContents(contentType, limitCount, lastDoc);
  
  if (!expandRelated) {
    return contents;
  }

  // 関連コンテンツが必要なworkタイプのコンテンツを特定
  const workContents = contents.filter(c => c.type === 'work' && c.relatedContentIds?.length);
  
  if (workContents.length === 0) {
    return contents;
  }

  // workコンテンツの関連コンテンツを並行取得
  const expandedWorkContents = await Promise.all(
    workContents.map(async (workContent) => {
      try {
        const relatedContents = await Promise.all(
          (workContent.relatedContentIds || []).map(async (relatedId) => {
            try {
              return await getContent(relatedId);
            } catch (error) {
              console.warn(`関連コンテンツ取得エラー (ID: ${relatedId}):`, error);
              return null;
            }
          })
        );

        const validRelatedContents = relatedContents.filter((c): c is Content => c !== null);

        return {
          ...workContent,
          relatedContents: validRelatedContents
        };
      } catch (error) {
        console.warn(`work関連コンテンツ展開エラー (ID: ${workContent.id}):`, error);
        return workContent;
      }
    })
  );

  // 元の配列で該当するworkコンテンツを展開済みのものに置き換え
  const expandedContents = contents.map(content => {
    if (content.type === 'work') {
      const expanded = expandedWorkContents.find(exp => exp.id === content.id);
      return expanded || content;
    }
    return content;
  });

  return expandedContents;
};

export const getAllContents = async (
  contentType?: ContentType,
  limitCount: number = 10,
  lastDoc?: DocumentSnapshot
): Promise<Content[]> => {
  try {
    const contentsCollection = collection(db, 'contents');
    let constraints: any[] = [
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    ];

    // Add content type filter if specified
    if (contentType) {
      constraints.unshift(where('type', '==', contentType));
    }

    let q = query(contentsCollection, ...constraints);

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const querySnapshot = await getDocs(q);
    const contents: Content[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      contents.push({
        id: doc.id,
        type: data.type,
        uid: data.uid,
        username: data.username,
        displayName: data.displayName,
        userPhotoURL: data.userPhotoURL,
        title: data.title,
        description: data.description || undefined,
        
        // Type-specific fields
        audioUrl: data.audioUrl || undefined,
        audioId: data.audioId || undefined,
        audioOriginalFilename: data.audioOriginalFilename || undefined,
        scriptText: data.scriptText || undefined,
        imageUrl: data.imageUrl || undefined,
        imageId: data.imageId || undefined,
        relatedContentIds: data.relatedContentIds || undefined,
        
        // Common fields
        tags: data.tags || [],
        tagIds: data.tagIds || [],
        tagNames: data.tagNames || [],
        isR18Content: data.isR18Content || false,
        contentRating: data.contentRating || 'all',
        likeCount: data.likeCount || 0,
        commentCount: data.commentCount || 0,
        replyCount: data.replyCount || 0,
        retweetCount: data.retweetCount || 0,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      });
    });

    return contents;
  } catch (error) {
    console.error('全コンテンツ取得エラー:', error);
    return [];
  }
};

export const updateContent = async (
  contentId: string,
  input: CreateContentInput,
  userId: string
): Promise<UpdateContentResult> => {
  try {
    if (!userId) {
      return { success: false, error: 'ユーザーIDが必要です' };
    }

    if (!input.title.trim()) {
      return { success: false, error: 'タイトルを入力してください' };
    }

    // Content existence and permission check
    const contentDoc = await getDoc(doc(db, 'contents', contentId));
    if (!contentDoc.exists()) {
      return { success: false, error: 'コンテンツが見つかりません' };
    }

    const contentData = contentDoc.data();
    if (contentData.uid !== userId) {
      return { success: false, error: '編集権限がありません' };
    }

    // Type validation
    if (!validateContentInputByType(input)) {
      const errorMessages = {
        voice: '音声ファイルをアップロードしてください',
        script: 'スクリプトを入力してください',
        image: '画像をアップロードしてください',
        work: '関連コンテンツを選択してください'
      };
      return { success: false, error: errorMessages[input.type] };
    }

    // タグ処理
    const workTags = input.tags ? createWorkTags(input.tags) : [];
    const tagIds = workTags.map(tag => tag.id);
    const tagNames = workTags.map(tag => tag.name);
    const { isR18Content, contentRating } = calculateContentRating(workTags, input.ageRating);

    // 更新データ
    const updateData = {
      title: input.title.trim(),
      description: input.description?.trim() || '',
      
      // Type-specific fields
      audioUrl: input.audioUrl || null,
      audioId: input.audioId || null,
      audioOriginalFilename: input.audioOriginalFilename || null,
      scriptText: input.scriptText?.trim() || null,
      imageUrl: input.imageUrl || null,
      imageId: input.imageId || null,
      relatedContentIds: input.relatedContentIds || null,
      
      // Common fields
      tags: workTags,
      tagIds,
      tagNames,
      isR18Content,
      contentRating,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(doc(db, 'contents', contentId), updateData);

    return { success: true };
  } catch (error) {
    console.error('コンテンツ更新エラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'コンテンツの更新に失敗しました',
    };
  }
};

export const deleteContent = async (
  contentId: string,
  userId: string
): Promise<DeleteContentResult> => {
  try {
    if (!userId) {
      return { success: false, error: 'ユーザーIDが必要です' };
    }

    // Content existence and permission check
    const contentDoc = await getDoc(doc(db, 'contents', contentId));
    if (!contentDoc.exists()) {
      return { success: false, error: 'コンテンツが見つかりません' };
    }

    const contentData = contentDoc.data();
    if (contentData.uid !== userId) {
      return { success: false, error: '削除権限がありません' };
    }

    await deleteDoc(doc(db, 'contents', contentId));

    return { success: true };
  } catch (error) {
    console.error('コンテンツ削除エラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'コンテンツの削除に失敗しました',
    };
  }
};