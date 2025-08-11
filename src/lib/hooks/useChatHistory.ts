'use client';

import { useState, useEffect, useCallback } from 'react';
import { Message } from 'ai/react';
import { useAuth } from '@/lib/contexts/AuthContext';
import {
  ChatSession,
  ChatMessage,
  ExtendedMessage,
  CreateSessionInput,
  SaveMessageInput,
  UpdateSessionInput
} from '@/types/chat';
import {
  createChatSession,
  getChatSessions,
  getChatSession,
  updateChatSession,
  deleteChatSession,
  saveChatMessage,
  getChatMessages,
  updateMessageWithAudio
} from '@/lib/firebase/chat';

interface UseChatHistoryReturn {
  // セッション管理
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  isLoadingSessions: boolean;
  isLoadingMessages: boolean;
  
  // メッセージ管理
  messages: ExtendedMessage[];
  
  // セッション操作
  createNewSession: (title?: string, firstMessage?: string, mode?: 'normal' | 'canvas') => Promise<string | null>;
  selectSession: (sessionId: string) => Promise<void>;
  updateSessionTitle: (sessionId: string, title: string) => Promise<boolean>;
  removeSession: (sessionId: string) => Promise<boolean>;
  
  // メッセージ操作
  saveMessage: (role: 'user' | 'assistant', content: string) => Promise<boolean>;
  saveMessageWithAudio: (messageId: string, audioUrl: string, audioId: string) => Promise<boolean>;
  loadMoreMessages: () => Promise<void>;
  
  // ユーティリティ
  refreshSessions: () => Promise<void>;
  clearCurrentSession: () => void;
}

export function useChatHistory(): UseChatHistoryReturn {
  const { user } = useAuth();
  
  // セッション関連の状態
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  
  // メッセージ関連の状態
  const [messages, setMessages] = useState<ExtendedMessage[]>([]);

  // セッション一覧を取得
  const loadSessions = useCallback(async () => {
    if (!user?.uid) return;

    setIsLoadingSessions(true);
    try {
      const sessionsData = await getChatSessions(user.uid, {
        limit: 50,
        orderBy: 'updatedAt',
        orderDirection: 'desc'
      });
      setSessions(sessionsData);
    } catch (error) {
      console.error('セッション一覧取得エラー:', error);
    } finally {
      setIsLoadingSessions(false);
    }
  }, [user?.uid]);

  // 特定セッションのメッセージを取得
  const loadMessages = useCallback(async (sessionId: string) => {
    if (!user?.uid || !sessionId) return;

    setIsLoadingMessages(true);
    try {
      const messagesData = await getChatMessages(sessionId, user.uid, {
        limit: 100,
        orderBy: 'createdAt',
        orderDirection: 'asc'
      });

      // ChatMessageをExtendedMessageに変換
      const extendedMessages: ExtendedMessage[] = messagesData.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: msg.createdAt,
        audioUrl: msg.audioUrl,
        audioId: msg.audioId,
        isVoiceGenerated: msg.isVoiceGenerated,
      }));

      setMessages(extendedMessages);
    } catch (error) {
      console.error('メッセージ取得エラー:', error);
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [user?.uid]);

  // 新しいセッションを作成
  const createNewSession = useCallback(async (
    title?: string,
    firstMessage?: string,
    mode: 'normal' | 'canvas' = 'normal'
  ): Promise<string | null> => {
    if (!user?.uid) return null;

    try {
      const input: CreateSessionInput = {
        title: title || (mode === 'canvas' ? '新しいCanvas' : '新しいチャット'),
        mode,
        firstMessage: firstMessage,
      };

      const result = await createChatSession(user.uid, input);
      
      if (result.success && result.sessionId) {
        await loadSessions(); // セッション一覧を更新
        return result.sessionId;
      } else {
        console.error('セッション作成エラー:', result.error);
        return null;
      }
    } catch (error) {
      console.error('セッション作成エラー:', error);
      return null;
    }
  }, [user?.uid, loadSessions]);

  // セッションを選択
  const selectSession = useCallback(async (sessionId: string) => {
    if (!user?.uid) return;

    try {
      const session = await getChatSession(sessionId, user.uid);
      if (session) {
        setCurrentSession(session);
        await loadMessages(sessionId);
      }
    } catch (error) {
      console.error('セッション選択エラー:', error);
    }
  }, [user?.uid, loadMessages]);

  // セッションタイトルを更新
  const updateSessionTitle = useCallback(async (
    sessionId: string,
    title: string
  ): Promise<boolean> => {
    if (!user?.uid) return false;

    try {
      const input: UpdateSessionInput = { title };
      const result = await updateChatSession(sessionId, user.uid, input);
      
      if (result.success) {
        // ローカルセッション情報を更新
        setSessions(prev => prev.map(session => 
          session.id === sessionId 
            ? { ...session, title: title.trim() }
            : session
        ));
        
        // 現在のセッションも更新
        if (currentSession?.id === sessionId) {
          setCurrentSession(prev => prev ? { ...prev, title: title.trim() } : null);
        }
        
        return true;
      } else {
        console.error('セッションタイトル更新エラー:', result.error);
        return false;
      }
    } catch (error) {
      console.error('セッションタイトル更新エラー:', error);
      return false;
    }
  }, [user?.uid, currentSession]);

  // セッションを削除
  const removeSession = useCallback(async (sessionId: string): Promise<boolean> => {
    if (!user?.uid) return false;

    try {
      const result = await deleteChatSession(sessionId, user.uid);
      
      if (result.success) {
        // ローカルセッション一覧から削除
        setSessions(prev => prev.filter(session => session.id !== sessionId));
        
        // 削除されたセッションが現在のセッションの場合はクリア
        if (currentSession?.id === sessionId) {
          setCurrentSession(null);
          setMessages([]);
        }
        
        return true;
      } else {
        console.error('セッション削除エラー:', result.error);
        return false;
      }
    } catch (error) {
      console.error('セッション削除エラー:', error);
      return false;
    }
  }, [user?.uid, currentSession]);

  // メッセージを保存
  const saveMessage = useCallback(async (
    role: 'user' | 'assistant',
    content: string
  ): Promise<boolean> => {
    if (!user?.uid || !currentSession?.id) return false;

    try {
      const input: SaveMessageInput = {
        sessionId: currentSession.id,
        role,
        content,
      };

      const result = await saveChatMessage(input, user.uid);
      
      if (result.success) {
        // ローカルメッセージ一覧を更新（オプティミスティックアップデート）
        const newMessage: ExtendedMessage = {
          id: result.messageId || Date.now().toString(),
          role,
          content,
          createdAt: new Date(),
        };
        
        setMessages(prev => [...prev, newMessage]);
        
        // セッション一覧の最終メッセージを更新
        setSessions(prev => prev.map(session => 
          session.id === currentSession.id
            ? { 
                ...session, 
                lastMessage: content,
                updatedAt: new Date(),
                messageCount: session.messageCount + 1
              }
            : session
        ));
        
        return true;
      } else {
        console.error('メッセージ保存エラー:', result.error);
        return false;
      }
    } catch (error) {
      console.error('メッセージ保存エラー:', error);
      return false;
    }
  }, [user?.uid, currentSession]);

  // メッセージに音声情報を追加
  const saveMessageWithAudio = useCallback(async (
    messageId: string,
    audioUrl: string,
    audioId: string
  ): Promise<boolean> => {
    if (!user?.uid) return false;

    try {
      const result = await updateMessageWithAudio(messageId, audioUrl, audioId, user.uid);
      
      if (result.success) {
        // ローカルメッセージを更新
        setMessages(prev => prev.map(message => 
          message.id === messageId
            ? { 
                ...message, 
                audioUrl, 
                audioId, 
                isVoiceGenerated: true 
              }
            : message
        ));
        
        return true;
      } else {
        console.error('メッセージ音声情報保存エラー:', result.error);
        return false;
      }
    } catch (error) {
      console.error('メッセージ音声情報保存エラー:', error);
      return false;
    }
  }, [user?.uid]);

  // 過去のメッセージをさらに読み込み（ページネーション）
  const loadMoreMessages = useCallback(async () => {
    if (!user?.uid || !currentSession?.id || messages.length === 0) return;

    try {
      const oldestMessage = messages[0];
      const messagesData = await getChatMessages(currentSession.id, user.uid, {
        limit: 50,
        orderBy: 'createdAt',
        orderDirection: 'asc',
        startAfter: oldestMessage.createdAt,
      });

      if (messagesData.length > 0) {
        const extendedMessages: ExtendedMessage[] = messagesData.map((msg) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          createdAt: msg.createdAt,
          audioUrl: msg.audioUrl,
          audioId: msg.audioId,
          isVoiceGenerated: msg.isVoiceGenerated,
        }));

        setMessages(prev => [...extendedMessages, ...prev]);
      }
    } catch (error) {
      console.error('過去メッセージ取得エラー:', error);
    }
  }, [user?.uid, currentSession?.id, messages]);

  // セッション一覧を再取得
  const refreshSessions = useCallback(async () => {
    await loadSessions();
  }, [loadSessions]);

  // 現在のセッションをクリア
  const clearCurrentSession = useCallback(() => {
    setCurrentSession(null);
    setMessages([]);
  }, []);

  // 初期化時にセッション一覧を取得
  useEffect(() => {
    if (user?.uid) {
      loadSessions();
    } else {
      setSessions([]);
      setCurrentSession(null);
      setMessages([]);
    }
  }, [user?.uid, loadSessions]);

  return {
    // セッション管理
    sessions,
    currentSession,
    isLoadingSessions,
    isLoadingMessages,
    
    // メッセージ管理
    messages,
    
    // セッション操作
    createNewSession,
    selectSession,
    updateSessionTitle,
    removeSession,
    
    // メッセージ操作
    saveMessage,
    saveMessageWithAudio,
    loadMoreMessages,
    
    // ユーティリティ
    refreshSessions,
    clearCurrentSession,
  };
}