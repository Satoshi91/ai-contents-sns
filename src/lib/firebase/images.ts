import { db } from './app';
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  QueryDocumentSnapshot,
  DocumentData,
  Query
} from 'firebase/firestore';
import { 
  ImageDocument, 
  ImagesPaginationResult, 
  ImageFilters, 
 
} from '@/types/image';
import { ImagesSectionConfig } from '@/types/imageSection';

// Firestore DocumentSnapshotをImageDocumentに変換
const convertToImageDocument = (doc: QueryDocumentSnapshot<DocumentData>): ImageDocument => {
  const data = doc.data();
  return {
    id: doc.id,
    image_data: data.image_data,
    created_at: data.created_at,
    updated_at: data.updated_at
  };
};

// クエリを構築する関数
const buildImagesQuery = (
  config: ImagesSectionConfig, 
  lastVisible?: QueryDocumentSnapshot
): Query<DocumentData> => {
  const imagesRef = collection(db, 'images');
  let q = query(imagesRef);

  // フィルタを適用
  if (config.filters) {
    if (config.filters.isPublic !== undefined) {
      q = query(q, where('image_data.is_public', '==', config.filters.isPublic));
    }
    if (config.filters.hasPrompt) {
      q = query(q, where('image_data.prompt', '!=', null));
    }
    if (config.filters.rating && config.filters.rating.length > 0) {
      q = query(q, where('image_data.rating', 'in', config.filters.rating));
    }
  }

  // ソートを適用
  const orderByField = config.orderBy === 'views' ? 'image_data.views' :
                      config.orderBy === 'rating' ? 'image_data.rating' :
                      'created_at';
  const direction = config.orderDirection || 'desc';
  
  q = query(q, orderBy(orderByField, direction));

  // ページネーション
  if (lastVisible) {
    q = query(q, startAfter(lastVisible));
  }

  // 取得件数制限
  const limitCount = config.limit || 20;
  q = query(q, limit(limitCount));

  return q;
};

// 画像一覧を取得（ページネーション対応）
export const getImages = async (
  config: ImagesSectionConfig = {},
  lastVisible?: QueryDocumentSnapshot
): Promise<ImagesPaginationResult> => {
  try {
    const q = buildImagesQuery(config, lastVisible);
    const querySnapshot = await getDocs(q);
    
    const images: ImageDocument[] = [];
    let newLastVisible: QueryDocumentSnapshot | null = null;

    querySnapshot.forEach((doc) => {
      images.push(convertToImageDocument(doc));
      newLastVisible = doc;
    });

    // さらに画像があるかチェック
    let hasMore = false;
    if (images.length === (config.limit || 20)) {
      // 次のページがあるかチェック
      const nextQuery = buildImagesQuery(config, newLastVisible || undefined);
      const nextQuerySnapshot = await getDocs(query(nextQuery, limit(1)));
      hasMore = !nextQuerySnapshot.empty;
    }

    return {
      images,
      lastVisible: newLastVisible,
      hasMore
    };
  } catch (error) {
    console.error('画像取得エラー:', error);
    throw error;
  }
};

// 単一画像を取得
export const getImageById = async (imageId: string): Promise<ImageDocument | null> => {
  try {
    const imageDoc = await getDoc(doc(db, 'images', imageId));
    
    if (!imageDoc.exists()) {
      return null;
    }

    return convertToImageDocument(imageDoc as QueryDocumentSnapshot<DocumentData>);
  } catch (error) {
    console.error('画像取得エラー:', error);
    throw error;
  }
};

// 全画像数を取得（統計用）
export const getImagesCount = async (filters?: ImageFilters): Promise<number> => {
  try {
    const imagesRef = collection(db, 'images');
    let q = query(imagesRef);

    // フィルタを適用
    if (filters) {
      if (filters.isPublic !== undefined) {
        q = query(q, where('image_data.is_public', '==', filters.isPublic));
      }
      if (filters.hasPrompt) {
        q = query(q, where('image_data.prompt', '!=', null));
      }
      if (filters.rating && filters.rating.length > 0) {
        q = query(q, where('image_data.rating', 'in', filters.rating));
      }
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error('画像数取得エラー:', error);
    throw error;
  }
};

// 検索機能（プロンプトテキスト検索）
export const searchImages = async (
  searchQuery: string,
  config: ImagesSectionConfig = {},
  lastVisible?: QueryDocumentSnapshot
): Promise<ImagesPaginationResult> => {
  try {
    // Firestoreの制限により、フルテキスト検索は簡易実装
    // 本格的な検索にはAlgoliaやElasticsearchが推奨
    const imagesConfig = {
      ...config,
      filters: {
        ...config.filters,
        search: searchQuery
      }
    };

    // とりあえず全ての画像を取得してクライアント側でフィルタ
    // 本番環境では検索サービスの導入を推奨
    const result = await getImages(imagesConfig, lastVisible);
    
    if (!searchQuery.trim()) {
      return result;
    }

    const filteredImages = result.images.filter(image => {
      const prompt = image.image_data.prompt?.toLowerCase() || '';
      const filename = image.image_data.original_filename?.toLowerCase() || '';
      const query = searchQuery.toLowerCase();
      
      return prompt.includes(query) || filename.includes(query);
    });

    return {
      ...result,
      images: filteredImages
    };
  } catch (error) {
    console.error('画像検索エラー:', error);
    throw error;
  }
};

// 関連画像を取得（同じリクエストIDの画像など）
export const getRelatedImages = async (
  imageId: string, 
  requestId?: string
): Promise<ImageDocument[]> => {
  try {
    if (!requestId) {
      // まず対象画像のrequest_idを取得
      const targetImage = await getImageById(imageId);
      if (!targetImage?.image_data.request_id) {
        return [];
      }
      requestId = targetImage.image_data.request_id;
    }

    const imagesRef = collection(db, 'images');
    const q = query(
      imagesRef,
      where('image_data.request_id', '==', requestId),
      where('image_data.is_public', '==', true),
      orderBy('created_at', 'desc'),
      limit(10)
    );

    const querySnapshot = await getDocs(q);
    const relatedImages: ImageDocument[] = [];

    querySnapshot.forEach((doc) => {
      // 自分自身は除外
      if (doc.id !== imageId) {
        relatedImages.push(convertToImageDocument(doc));
      }
    });

    return relatedImages;
  } catch (error) {
    console.error('関連画像取得エラー:', error);
    throw error;
  }
};