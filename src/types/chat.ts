import { Timestamp } from 'firebase/firestore';
import { Message } from 'ai/react';

// チャットセッション
export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
  lastMessage?: string;
}

// Firestore用のチャットセッション（Timestampを使用）
export interface FirestoreChatSession {
  id: string;
  userId: string;
  title: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  messageCount: number;
  lastMessage?: string;
}

// チャットメッセージ
export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
  // AI音声生成関連の追加フィールド
  audioUrl?: string;
  audioId?: string;
  isVoiceGenerated?: boolean;
}

// Firestore用のチャットメッセージ
export interface FirestoreChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Timestamp;
  audioUrl?: string;
  audioId?: string;
  isVoiceGenerated?: boolean;
}

// セッション作成用の入力型
export interface CreateSessionInput {
  title: string;
  firstMessage?: string;
}

// セッション更新用の入力型
export interface UpdateSessionInput {
  title?: string;
  lastMessage?: string;
}

// メッセージ保存用の入力型
export interface SaveMessageInput {
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  audioUrl?: string;
  audioId?: string;
}

// チャット履歴管理のレスポンス型
export interface ChatHistoryResult {
  success: boolean;
  error?: string;
  sessionId?: string;
  messageId?: string;
}

// セッション一覧取得のオプション
export interface GetSessionsOptions {
  limit?: number;
  orderBy?: 'updatedAt' | 'createdAt';
  orderDirection?: 'asc' | 'desc';
}

// メッセージ一覧取得のオプション
export interface GetMessagesOptions {
  limit?: number;
  orderBy?: 'createdAt';
  orderDirection?: 'asc' | 'desc';
  startAfter?: Date;
}

// ai/reactのMessage型を拡張
export interface ExtendedMessage extends Message {
  audioUrl?: string;
  audioId?: string;
  isVoiceGenerated?: boolean;
  createdAt?: Date;
}