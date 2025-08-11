import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// 環境変数の型安全性を確保する関数
function getRequiredEnvVar(name: string, fallback?: string): string {
  const value = process.env[name] || fallback;
  if (!value || typeof value !== 'string') {
    throw new Error(`Environment variable ${name} is required and must be a string`);
  }
  return value;
}

// Firebase App Hostingかどうかを判定
function isFirebaseAppHosting(): boolean {
  return !!(process.env.K_SERVICE || process.env.GAE_SERVICE || process.env.FIREBASE_APP_HOSTING);
}

// Firebase Admin SDK初期化用の設定を安全に取得
function getFirebaseAdminConfig() {
  try {
    // Firebase App Hostingの場合は、環境変数が自動的に設定されることがある
    let projectId: string;
    let clientEmail: string;
    let privateKey: string;

    if (isFirebaseAppHosting()) {
      // Firebase App Hosting環境では、デフォルトの資格情報を使用
      projectId = process.env.GOOGLE_CLOUD_PROJECT || 
                  process.env.FIREBASE_ADMIN_PROJECT_ID || 
                  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '';
      
      // App Hosting環境では、資格情報が自動的に提供される場合がある
      clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL || '';
      privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY || '';

      // Firebase App Hostingでは、明示的な資格情報がなくても動作する可能性がある
      if (!projectId) {
        console.warn('Project ID is not set in Firebase App Hosting environment');
        return null;
      }

      // Firebase App Hostingでの自動認証を試す
      if (!clientEmail || !privateKey) {
        console.log('Using Firebase App Hosting default credentials');
        return {
          projectId,
          clientEmail: undefined,
          privateKey: undefined,
        };
      }
    } else {
      // 通常の環境では必須環境変数をチェック
      projectId = getRequiredEnvVar('FIREBASE_ADMIN_PROJECT_ID', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
      clientEmail = getRequiredEnvVar('FIREBASE_ADMIN_CLIENT_EMAIL');
      privateKey = getRequiredEnvVar('FIREBASE_ADMIN_PRIVATE_KEY');
    }
    
    // private keyの改行文字を正規化
    if (privateKey) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }
    
    return {
      projectId,
      clientEmail,
      privateKey,
    };
  } catch (error) {
    console.error('Firebase Admin configuration error:', error);
    
    // ビルド時エラーを避けるため、特定の環境でのみ例外をスロー
    const shouldThrow = process.env.NODE_ENV === 'development' && 
                        !process.env.VERCEL &&
                        !isFirebaseAppHosting();
    
    if (shouldThrow) {
      throw error;
    }
    
    // 本番環境やホスティング環境では警告のみで続行
    console.warn('Firebase Admin SDK configuration failed, some features may not work');
    return null;
  }
}

let app: App | null = null;

// Firebase Admin SDK初期化
function initializeFirebaseAdmin() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const config = getFirebaseAdminConfig();
  if (!config) {
    console.warn('Firebase Admin SDK configuration is missing. Some features may not work.');
    return null;
  }

  try {
    // Firebase App Hosting環境で資格情報がない場合は、デフォルト資格情報を使用
    if (isFirebaseAppHosting() && (!config.clientEmail || !config.privateKey)) {
      console.log('Initializing Firebase Admin with default credentials for App Hosting');
      return initializeApp({
        projectId: config.projectId,
      });
    }

    // 通常の初期化
    return initializeApp({
      credential: cert({
        projectId: config.projectId,
        clientEmail: config.clientEmail,
        privateKey: config.privateKey,
      }),
    });
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
    
    // Firebase App Hosting環境では、フォールバック初期化を試す
    if (isFirebaseAppHosting() && config.projectId) {
      try {
        console.log('Attempting fallback initialization for Firebase App Hosting');
        return initializeApp({
          projectId: config.projectId,
        });
      } catch (fallbackError) {
        console.error('Fallback initialization also failed:', fallbackError);
      }
    }
    
    return null;
  }
}

// 初期化実行
app = initializeFirebaseAdmin();

// エクスポート用のヘルパー関数
function getFirebaseAdmin() {
  if (!app) {
    throw new Error('Firebase Admin SDK is not initialized. Please check your configuration.');
  }
  return app;
}

// 安全なエクスポート
export const adminAuth = app ? getAuth(app) : null;
export const adminDb = app ? getFirestore(app) : null;

// 初期化状態をチェックする関数
export function isFirebaseAdminInitialized(): boolean {
  return app !== null;
}

// ランタイム時にFirebase Admin SDKが必要な場合のヘルパー
export function requireFirebaseAdmin() {
  if (!isFirebaseAdminInitialized()) {
    throw new Error('Firebase Admin SDK is required but not initialized');
  }
  return {
    adminAuth: getAuth(getFirebaseAdmin()),
    adminDb: getFirestore(getFirebaseAdmin()),
  };
}