import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  signInWithPopup,
  signInAnonymously,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './app';
import { User } from '@/types/user';

const googleProvider = new GoogleAuthProvider();

export async function signUp(email: string, password: string, username: string, displayName: string) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await updateProfile(user, { displayName });

    const userData = {
      uid: user.uid,
      email: user.email!,
      username,
      displayName,
      bio: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // photoURLがnullでない場合のみ追加
    if (user.photoURL) {
      (userData as any).photoURL = user.photoURL;
    }

    await setDoc(doc(db, 'users', user.uid), userData);

    await setDoc(doc(db, 'usernames', username), {
      uid: user.uid,
    });

    return { success: true, user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function signIn(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
      const username = user.email?.split('@')[0] || `user_${user.uid.slice(0, 8)}`;
      
      const userData = {
        uid: user.uid,
        email: user.email!,
        username,
        displayName: user.displayName || username,
        bio: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // photoURLがnullでない場合のみ追加
      if (user.photoURL) {
        (userData as any).photoURL = user.photoURL;
      }

      await setDoc(doc(db, 'users', user.uid), userData);

      await setDoc(doc(db, 'usernames', username), {
        uid: user.uid,
      });
    }

    return { success: true, user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function signInAnonymous() {
  try {
    console.log('Signing in anonymously...');
    const result = await signInAnonymously(auth);
    const user = result.user;

    // 匿名ユーザーの基本情報をFirestoreに保存（オプション）
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
      const userData = {
        uid: user.uid,
        email: null,
        username: `guest_${user.uid.slice(0, 8)}`,
        displayName: 'ゲストユーザー',
        bio: '',
        isAnonymous: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'users', user.uid), userData);
    }

    console.log('Anonymous sign-in successful');
    return { success: true, user };
  } catch (error: any) {
    console.error('Error signing in anonymously:', error);
    return { success: false, error: error.message };
  }
}

export async function signOut() {
  try {
    await firebaseSignOut(auth);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function resetPassword(email: string) {
  try {
    console.log('Sending password reset email to:', email);
    await sendPasswordResetEmail(auth, email);
    console.log('Password reset email sent successfully');
    return { success: true };
  } catch (error: any) {
    console.error('Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
}

export async function checkUsernameAvailability(username: string): Promise<boolean> {
  try {
    const usernameDoc = await getDoc(doc(db, 'usernames', username));
    return !usernameDoc.exists();
  } catch (error) {
    console.error('Error checking username availability:', error);
    return false;
  }
}