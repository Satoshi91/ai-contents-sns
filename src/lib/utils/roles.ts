import { User, UserRole } from '@/types/user';

/**
 * ユーザーが管理者かどうかを判定
 */
export function isUserAdmin(user: User | null): boolean {
  return user?.role === 'admin';
}

/**
 * ユーザーが指定したロールを持っているかを判定
 */
export function hasRole(user: User | null, role: UserRole): boolean {
  return user?.role === role;
}

/**
 * ユーザーが認証済みかつ指定したロールを持っているかを判定
 */
export function isAuthenticatedWithRole(user: User | null, role: UserRole): boolean {
  return !!user && !user.isAnonymous && user.role === role;
}