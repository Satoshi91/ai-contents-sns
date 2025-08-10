import { Timestamp } from 'firebase/firestore';

/**
 * フォロワーコレクションのドキュメント構造
 * followers/{userId} に保存
 */
export interface FollowersDoc {
  users: string[];           // フォロワーのUID配列
  count: number;            // フォロワー数
  lastUpdated: Timestamp;   // 最終更新日時
}

/**
 * フォロー中コレクションのドキュメント構造
 * following/{userId} に保存
 */
export interface FollowingDoc {
  users: string[];          // フォロー中のUID配列
  count: number;           // フォロー数
  lastUpdated: Timestamp;  // 最終更新日時
}

/**
 * フォロー関係の状態
 */
export interface FollowStatus {
  isFollowing: boolean;     // フォロー中かどうか
  isFollower: boolean;      // フォロワーかどうか
  isMutual: boolean;       // 相互フォローかどうか
}

/**
 * フォロー統計情報
 */
export interface FollowStats {
  followerCount: number;    // フォロワー数
  followingCount: number;   // フォロー数
}

/**
 * フォロー操作の結果
 */
export interface FollowResult {
  success: boolean;
  error?: string;
}

/**
 * ユーザーリスト用の型（フォロワー/フォロー中一覧表示用）
 */
export interface FollowUser {
  uid: string;
  username: string;
  displayName: string;
  photoURL?: string | null;
  bio?: string;
  isFollowing?: boolean;    // 自分がフォローしているか
  followedAt?: Date;        // フォローした日時
}