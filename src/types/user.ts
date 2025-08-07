export interface User {
  uid: string;
  email: string | null;
  username: string;
  displayName: string;
  photoURL?: string | null;
  bio?: string;
  isAnonymous?: boolean;
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