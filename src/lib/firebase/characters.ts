import {
  collection,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  DocumentSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './app';
import { Character, CharacterCategory, CharacterFilters } from '@/types/character';

export async function getCharacters(
  category: CharacterCategory = 'all',
  limitCount: number = 24,
  lastDoc?: DocumentSnapshot,
  filters?: CharacterFilters
) {
  try {
    let q = query(collection(db, 'characters'));

    // カテゴリ別フィルタリング
    if (category === 'recent') {
      q = query(q, orderBy('created_at', 'desc'));
    } else if (category === 'popular') {
      // 人気順は将来的にビュー数やいいね数で実装
      q = query(q, orderBy('created_at', 'desc'));
    } else if (category === 'by_series' && filters?.series) {
      q = query(q, where('series', '==', filters.series), orderBy('created_at', 'desc'));
    } else {
      // 全て
      q = query(q, orderBy('created_at', 'desc'));
    }

    // 追加フィルタ
    if (filters?.status) {
      q = query(q, where('status', '==', filters.status));
    }

    // ページネーション
    q = query(q, limit(limitCount));
    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const snapshot = await getDocs(q);
    
    const characters = snapshot.docs
      .map(doc => {
        const data = doc.data();
        // オプショナルチェイニングでcharacter_nameが存在しない場合は除外
        if (!data.character_name) {
          return null;
        }
        
        return {
          id: doc.id,
          character_name: data.character_name,
          series: data.series,
          series_ja: data.series_ja,
          status: data.status,
          tags: data.tags,
          imageUrl: data.imageUrl,
          imageId: data.imageId,
          userId: data.userId,
          created_at: data.created_at?.toDate(),
          updated_at: data.updated_at?.toDate(),
        } as Character;
      })
      .filter((character): character is Character => character !== null);

    const lastVisible = snapshot.docs[snapshot.docs.length - 1];

    return {
      success: true,
      characters,
      lastDoc: lastVisible,
      hasMore: snapshot.docs.length === limitCount,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return { 
      success: false, 
      error: errorMessage, 
      characters: [], 
      hasMore: false 
    };
  }
}

export async function getCharacterSeries() {
  try {
    const snapshot = await getDocs(collection(db, 'characters'));
    const seriesSet = new Set<string>();
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.character_name && data.series) {
        seriesSet.add(data.series);
      }
    });

    return {
      success: true,
      series: Array.from(seriesSet).sort(),
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return { 
      success: false, 
      error: errorMessage, 
      series: [] 
    };
  }
}

// キャラクター作成
export async function createCharacter(
  characterData: {
    character_name: string;
    series?: string;
    series_ja?: string;
    status?: string;
    tags?: string[];
    imageUrl?: string;
    imageId?: string;
  },
  userId: string
) {
  try {
    // undefinedフィールドを除去してからFirestoreに保存
    const cleanData = Object.entries(characterData).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as any);

    const docRef = await addDoc(collection(db, 'characters'), {
      ...cleanData,
      userId,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });

    return {
      success: true,
      id: docRef.id,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      success: false,
      error: errorMessage,
    };
  }
}

// キャラクター更新
export async function updateCharacter(
  characterId: string,
  characterData: {
    character_name?: string;
    series?: string;
    series_ja?: string;
    status?: string;
    tags?: string[];
    imageUrl?: string;
    imageId?: string;
  },
  userId: string
) {
  try {
    const characterRef = doc(db, 'characters', characterId);
    const characterDoc = await getDoc(characterRef);

    if (!characterDoc.exists()) {
      return {
        success: false,
        error: 'キャラクターが見つかりません',
      };
    }

    const data = characterDoc.data();
    if (data.userId !== userId) {
      return {
        success: false,
        error: 'このキャラクターを編集する権限がありません',
      };
    }

    // undefinedフィールドを除去してからFirestoreに保存
    const cleanData = Object.entries(characterData).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as any);

    await updateDoc(characterRef, {
      ...cleanData,
      updated_at: serverTimestamp(),
    });

    return {
      success: true,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      success: false,
      error: errorMessage,
    };
  }
}

// キャラクター削除
export async function deleteCharacter(characterId: string, userId: string) {
  try {
    const characterRef = doc(db, 'characters', characterId);
    const characterDoc = await getDoc(characterRef);

    if (!characterDoc.exists()) {
      return {
        success: false,
        error: 'キャラクターが見つかりません',
      };
    }

    const data = characterDoc.data();
    if (data.userId !== userId) {
      return {
        success: false,
        error: 'このキャラクターを削除する権限がありません',
      };
    }

    await deleteDoc(characterRef);

    return {
      success: true,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      success: false,
      error: errorMessage,
    };
  }
}

// 単一キャラクター取得
export async function getCharacter(characterId: string, userId?: string) {
  try {
    const characterRef = doc(db, 'characters', characterId);
    const characterDoc = await getDoc(characterRef);

    if (!characterDoc.exists()) {
      return {
        success: false,
        error: 'キャラクターが見つかりません',
        character: null,
      };
    }

    const data = characterDoc.data();
    
    // 編集権限チェック（userIdが指定されている場合）
    if (userId && data.userId !== userId) {
      return {
        success: false,
        error: 'このキャラクターにアクセスする権限がありません',
        character: null,
      };
    }

    const character: Character = {
      id: characterDoc.id,
      character_name: data.character_name,
      series: data.series,
      series_ja: data.series_ja,
      status: data.status,
      tags: data.tags,
      imageUrl: data.imageUrl,
      imageId: data.imageId,
      userId: data.userId,
      created_at: data.created_at?.toDate(),
      updated_at: data.updated_at?.toDate(),
    };

    return {
      success: true,
      character,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      success: false,
      error: errorMessage,
      character: null,
    };
  }
}