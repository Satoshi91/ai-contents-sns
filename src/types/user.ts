export type UserRole = 'admin' | 'user';

export interface User {
  uid: string;
  email: string | null;
  username: string;
  displayName: string;
  photoURL?: string | null;
  bio?: string;
  role?: UserRole;  // デフォルトは'user'、管理者は'admin'
  isAnonymous?: boolean;
  followerCount?: number;     // フォロワー数
  followingCount?: number;    // フォロー中の数
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  uid: string;
  username: string;
  displayName: string;
  bio: string;
  photoURL?: string | null;
  postCount: number;
  followerCount: number;
  followingCount: number;
  createdAt: Date;
}