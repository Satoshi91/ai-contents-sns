import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './app';
import { Post } from '@/types/post';
import { User } from '@/types/user';

export async function createPost(uid: string, content: string, userData: Partial<User>) {
  try {
    const postRef = doc(collection(db, 'posts'));
    const postData = {
      id: postRef.id,
      uid,
      username: userData.username || '',
      displayName: userData.displayName || '',
      content,
      likeCount: 0,
      replyCount: 0,
      retweetCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // userPhotoURLがnullでない場合のみ追加
    if (userData.photoURL) {
      (postData as any).userPhotoURL = userData.photoURL;
    }

    await setDoc(postRef, postData);
    return { success: true, postId: postRef.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deletePost(postId: string, uid: string) {
  try {
    const postRef = doc(db, 'posts', postId);
    const postDoc = await getDoc(postRef);

    if (!postDoc.exists()) {
      return { success: false, error: 'Post not found' };
    }

    if (postDoc.data().uid !== uid) {
      return { success: false, error: 'Unauthorized' };
    }

    await deleteDoc(postRef);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getPosts(limitCount: number = 20, lastDoc?: DocumentSnapshot) {
  try {
    let q = query(
      collection(db, 'posts'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    if (lastDoc) {
      q = query(
        collection(db, 'posts'),
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(limitCount)
      );
    }

    const snapshot = await getDocs(q);
    const posts = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Post[];

    const lastVisible = snapshot.docs[snapshot.docs.length - 1];

    return {
      success: true,
      posts,
      lastDoc: lastVisible,
      hasMore: snapshot.docs.length === limitCount,
    };
  } catch (error: any) {
    return { success: false, error: error.message, posts: [], hasMore: false };
  }
}

export async function getUserPosts(uid: string, limitCount: number = 20, lastDoc?: DocumentSnapshot) {
  try {
    let q = query(
      collection(db, 'posts'),
      where('uid', '==', uid),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    if (lastDoc) {
      q = query(
        collection(db, 'posts'),
        where('uid', '==', uid),
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(limitCount)
      );
    }

    const snapshot = await getDocs(q);
    const posts = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Post[];

    const lastVisible = snapshot.docs[snapshot.docs.length - 1];

    return {
      success: true,
      posts,
      lastDoc: lastVisible,
      hasMore: snapshot.docs.length === limitCount,
    };
  } catch (error: any) {
    return { success: false, error: error.message, posts: [], hasMore: false };
  }
}

export function subscribeToLatestPosts(callback: (posts: Post[]) => void): Unsubscribe {
  const q = query(
    collection(db, 'posts'),
    orderBy('createdAt', 'desc'),
    limit(20)
  );

  return onSnapshot(q, (snapshot) => {
    const posts = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Post[];
    
    callback(posts);
  });
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