import { db } from './app';
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  startAfter as firestoreStartAfter,
  FieldValue
} from 'firebase/firestore';
import {
  ChatSession,
  ChatMessage,
  FirestoreChatSession,
  FirestoreChatMessage,
  CreateSessionInput,
  UpdateSessionInput,
  SaveMessageInput,
  ChatHistoryResult,
  GetSessionsOptions,
  GetMessagesOptions
} from '@/types/chat';

// コレクション名
const CHAT_SESSIONS_COLLECTION = 'chatSessions';
const CHAT_MESSAGES_COLLECTION = 'chatMessages';

// セッションタイトルを自動生成する関数
const generateSessionTitle = (firstMessage: string): string => {
  const maxLength = 30;
  if (firstMessage.length <= maxLength) {
    return firstMessage;
  }
  return firstMessage.substring(0, maxLength) + '...';
};

// FirestoreのTimestampをDateに変換
const convertTimestampToDate = (timestamp: Timestamp | FieldValue | undefined): Date => {
  if (timestamp && typeof (timestamp as Timestamp).toDate === 'function') {
    return (timestamp as Timestamp).toDate();
  }
  return new Date();
};

// FirestoreChatSessionをChatSessionに変換
const convertFirestoreSessionToSession = (
  id: string,
  data: FirestoreChatSession
): ChatSession => ({
  id,
  userId: data.userId,
  title: data.title,
  mode: data.mode || 'normal', // 既存データの互換性のため
  createdAt: convertTimestampToDate(data.createdAt),
  updatedAt: convertTimestampToDate(data.updatedAt),
  messageCount: data.messageCount,
  lastMessage: data.lastMessage,
});

// FirestoreChatMessageをChatMessageに変換
const convertFirestoreMessageToMessage = (
  id: string,
  data: FirestoreChatMessage
): ChatMessage => ({
  id,
  sessionId: data.sessionId,
  role: data.role,
  content: data.content,
  createdAt: convertTimestampToDate(data.createdAt),
  audioUrl: data.audioUrl,
  audioId: data.audioId,
  isVoiceGenerated: data.isVoiceGenerated,
});

/**
 * 新しいチャットセッションを作成
 */
export const createChatSession = async (
  userId: string,
  input: CreateSessionInput
): Promise<ChatHistoryResult> => {
  try {
    if (!userId) {
      return { success: false, error: 'ユーザーIDが必要です' };
    }

    const title = input.title.trim() || (input.firstMessage ? generateSessionTitle(input.firstMessage) : '新しいチャット');

    const sessionData: Partial<FirestoreChatSession> = {
      userId,
      title,
      mode: input.mode || 'normal',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      messageCount: 0,
    };

    // firstMessageがある場合のみlastMessageフィールドを追加
    if (input.firstMessage && input.firstMessage.trim()) {
      sessionData.lastMessage = input.firstMessage.trim();
    }

    const sessionsRef = collection(db, CHAT_SESSIONS_COLLECTION);
    const docRef = await addDoc(sessionsRef, sessionData);

    return {
      success: true,
      sessionId: docRef.id,
    };
  } catch (error) {
    console.error('チャットセッション作成エラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'セッションの作成に失敗しました',
    };
  }
};

/**
 * ユーザーのチャットセッション一覧を取得
 */
export const getChatSessions = async (
  userId: string,
  options: GetSessionsOptions = {}
): Promise<ChatSession[]> => {
  try {
    if (!userId) {
      console.error('ユーザーIDが必要です');
      return [];
    }

    const {
      limit: limitCount = 50,
      orderBy: orderByField = 'updatedAt',
      orderDirection = 'desc',
    } = options;

    const sessionsRef = collection(db, CHAT_SESSIONS_COLLECTION);
    const q = query(
      sessionsRef,
      where('userId', '==', userId),
      orderBy(orderByField, orderDirection),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const sessions: ChatSession[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data() as FirestoreChatSession;
      sessions.push(convertFirestoreSessionToSession(doc.id, data));
    });

    return sessions;
  } catch (error) {
    console.error('チャットセッション取得エラー:', error);
    return [];
  }
};

/**
 * 特定のチャットセッションを取得
 */
export const getChatSession = async (
  sessionId: string,
  userId: string
): Promise<ChatSession | null> => {
  try {
    const sessionDoc = await getDoc(doc(db, CHAT_SESSIONS_COLLECTION, sessionId));
    
    if (!sessionDoc.exists()) {
      return null;
    }

    const data = sessionDoc.data() as FirestoreChatSession;
    
    // ユーザー権限チェック
    if (data.userId !== userId) {
      console.error('セッションへのアクセス権限がありません');
      return null;
    }

    return convertFirestoreSessionToSession(sessionDoc.id, data);
  } catch (error) {
    console.error('チャットセッション取得エラー:', error);
    return null;
  }
};

/**
 * チャットセッションを更新
 */
export const updateChatSession = async (
  sessionId: string,
  userId: string,
  input: UpdateSessionInput
): Promise<ChatHistoryResult> => {
  try {
    const sessionDoc = await getDoc(doc(db, CHAT_SESSIONS_COLLECTION, sessionId));
    
    if (!sessionDoc.exists()) {
      return { success: false, error: 'セッションが見つかりません' };
    }

    const data = sessionDoc.data() as FirestoreChatSession;
    if (data.userId !== userId) {
      return { success: false, error: 'セッション更新の権限がありません' };
    }

    const updateData: Partial<FirestoreChatSession> = {
      updatedAt: serverTimestamp(),
    };

    if (input.title !== undefined) {
      updateData.title = input.title.trim();
    }

    if (input.lastMessage !== undefined) {
      updateData.lastMessage = input.lastMessage;
    }

    await updateDoc(doc(db, CHAT_SESSIONS_COLLECTION, sessionId), updateData);

    return { success: true };
  } catch (error) {
    console.error('チャットセッション更新エラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'セッションの更新に失敗しました',
    };
  }
};

/**
 * チャットセッションを削除
 */
export const deleteChatSession = async (
  sessionId: string,
  userId: string
): Promise<ChatHistoryResult> => {
  try {
    const sessionDoc = await getDoc(doc(db, CHAT_SESSIONS_COLLECTION, sessionId));
    
    if (!sessionDoc.exists()) {
      return { success: false, error: 'セッションが見つかりません' };
    }

    const data = sessionDoc.data() as FirestoreChatSession;
    if (data.userId !== userId) {
      return { success: false, error: 'セッション削除の権限がありません' };
    }

    // セッションに関連するメッセージも削除
    const messagesRef = collection(db, CHAT_MESSAGES_COLLECTION);
    const messagesQuery = query(messagesRef, where('sessionId', '==', sessionId));
    const messagesSnapshot = await getDocs(messagesQuery);

    // バッチで削除を実行（簡単な実装のため、順次削除）
    const deletePromises = messagesSnapshot.docs.map((doc) => deleteDoc(doc.ref));
    await Promise.all(deletePromises);

    // セッションを削除
    await deleteDoc(doc(db, CHAT_SESSIONS_COLLECTION, sessionId));

    return { success: true };
  } catch (error) {
    console.error('チャットセッション削除エラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'セッションの削除に失敗しました',
    };
  }
};

/**
 * チャットメッセージを保存
 */
export const saveChatMessage = async (
  input: SaveMessageInput,
  userId: string
): Promise<ChatHistoryResult> => {
  try {
    // セッションの存在確認と権限チェック
    const sessionDoc = await getDoc(doc(db, CHAT_SESSIONS_COLLECTION, input.sessionId));
    
    if (!sessionDoc.exists()) {
      return { success: false, error: 'セッションが見つかりません' };
    }

    const sessionData = sessionDoc.data() as FirestoreChatSession;
    if (sessionData.userId !== userId) {
      return { success: false, error: 'メッセージ保存の権限がありません' };
    }

    // メッセージを保存
    const messageData = {
      sessionId: input.sessionId,
      role: input.role,
      content: input.content,
      createdAt: serverTimestamp(),
      ...(input.audioUrl && input.audioId && {
        audioUrl: input.audioUrl,
        audioId: input.audioId,
        isVoiceGenerated: true,
      }),
    };

    const messagesRef = collection(db, CHAT_MESSAGES_COLLECTION);
    const docRef = await addDoc(messagesRef, messageData);

    // セッションのメッセージ数と最新メッセージを更新
    await updateDoc(doc(db, CHAT_SESSIONS_COLLECTION, input.sessionId), {
      messageCount: sessionData.messageCount + 1,
      lastMessage: input.content,
      updatedAt: serverTimestamp(),
    });

    return {
      success: true,
      messageId: docRef.id,
    };
  } catch (error) {
    console.error('チャットメッセージ保存エラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'メッセージの保存に失敗しました',
    };
  }
};

/**
 * チャットメッセージ一覧を取得
 */
export const getChatMessages = async (
  sessionId: string,
  userId: string,
  options: GetMessagesOptions = {}
): Promise<ChatMessage[]> => {
  try {
    // セッションの存在確認と権限チェック
    const sessionDoc = await getDoc(doc(db, CHAT_SESSIONS_COLLECTION, sessionId));
    
    if (!sessionDoc.exists()) {
      console.error('セッションが見つかりません');
      return [];
    }

    const sessionData = sessionDoc.data() as FirestoreChatSession;
    if (sessionData.userId !== userId) {
      console.error('メッセージ取得の権限がありません');
      return [];
    }

    const {
      limit: limitCount = 100,
      orderBy: orderByField = 'createdAt',
      orderDirection = 'asc',
      startAfter,
    } = options;

    const messagesRef = collection(db, CHAT_MESSAGES_COLLECTION);
    let q = query(
      messagesRef,
      where('sessionId', '==', sessionId),
      orderBy(orderByField, orderDirection),
      limit(limitCount)
    );

    if (startAfter) {
      q = query(q, firestoreStartAfter(Timestamp.fromDate(startAfter)));
    }

    const querySnapshot = await getDocs(q);
    const messages: ChatMessage[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data() as FirestoreChatMessage;
      messages.push(convertFirestoreMessageToMessage(doc.id, data));
    });

    return messages;
  } catch (error) {
    console.error('チャットメッセージ取得エラー:', error);
    return [];
  }
};

/**
 * メッセージに音声情報を追加更新
 */
export const updateMessageWithAudio = async (
  messageId: string,
  audioUrl: string,
  audioId: string,
  userId: string
): Promise<ChatHistoryResult> => {
  try {
    const messageDoc = await getDoc(doc(db, CHAT_MESSAGES_COLLECTION, messageId));
    
    if (!messageDoc.exists()) {
      return { success: false, error: 'メッセージが見つかりません' };
    }

    const messageData = messageDoc.data() as FirestoreChatMessage;
    
    // セッションの権限チェック
    const sessionDoc = await getDoc(doc(db, CHAT_SESSIONS_COLLECTION, messageData.sessionId));
    if (!sessionDoc.exists()) {
      return { success: false, error: 'セッションが見つかりません' };
    }

    const sessionData = sessionDoc.data() as FirestoreChatSession;
    if (sessionData.userId !== userId) {
      return { success: false, error: 'メッセージ更新の権限がありません' };
    }

    // メッセージに音声情報を追加
    await updateDoc(doc(db, CHAT_MESSAGES_COLLECTION, messageId), {
      audioUrl,
      audioId,
      isVoiceGenerated: true,
    });

    return { success: true };
  } catch (error) {
    console.error('メッセージ音声情報更新エラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'メッセージの更新に失敗しました',
    };
  }
};