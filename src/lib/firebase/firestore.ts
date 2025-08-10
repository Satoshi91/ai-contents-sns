import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  updateDoc,
  serverTimestamp,
  DocumentSnapshot,
} from 'firebase/firestore';
import { db } from './app';
import { Work } from '@/types/work';
import { User } from '@/types/user';


export async function getUserWorks(uid: string, limitCount: number = 20, lastDoc?: DocumentSnapshot, currentUserId?: string) {
  try {
    // 自分の作品を見る場合は全て表示、他人の作品は公開のみ
    const isOwnProfile = currentUserId && currentUserId === uid;
    
    let q = query(
      collection(db, 'works'),
      where('uid', '==', uid),
      ...(isOwnProfile ? [] : [where('publishStatus', 'in', ['public', null])]), // 他人の場合は公開のみ
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    if (lastDoc) {
      q = query(
        collection(db, 'works'),
        where('uid', '==', uid),
        ...(isOwnProfile ? [] : [where('publishStatus', 'in', ['public', null])]), // 他人の場合は公開のみ
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(limitCount)
      );
    }

    const snapshot = await getDocs(q);
    const works = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      publishStatus: doc.data().publishStatus || 'public', // 既存データはpublicとして扱う
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Work[];

    const lastVisible = snapshot.docs[snapshot.docs.length - 1];

    return {
      success: true,
      works,
      lastDoc: lastVisible,
      hasMore: snapshot.docs.length === limitCount,
    };
  } catch (error: any) {
    return { success: false, error: error.message, works: [], hasMore: false };
  }
}


export async function getUserByUsername(username: string): Promise<User | null> {
  try {
    const usernameDoc = await getDoc(doc(db, 'usernames', username));
    if (!usernameDoc.exists()) {
      return null;
    }

    const uid = usernameDoc.data().uid;
    const userDoc = await getDoc(doc(db, 'users', uid));
    
    if (!userDoc.exists()) {
      return null;
    }

    return {
      ...userDoc.data(),
      createdAt: userDoc.data().createdAt?.toDate() || new Date(),
      updatedAt: userDoc.data().updatedAt?.toDate() || new Date(),
    } as User;
  } catch (error) {
    console.error('Error getting user by username:', error);
    return null;
  }
}

export async function updateUserProfile(uid: string, updates: Partial<User>) {
  try {
    const userRef = doc(db, 'users', uid);
    
    // undefinedフィールドを除去
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    
    await updateDoc(userRef, {
      ...cleanUpdates,
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}