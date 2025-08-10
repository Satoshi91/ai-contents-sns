'use client';

import { useState, useCallback, useEffect } from 'react';
import { collection, doc, setDoc, getDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/app';
import { CanvasDocument } from '@/types/canvas';
import toast from 'react-hot-toast';

interface UseCanvasSyncProps {
  sessionId?: string;
  userId?: string;
  autoSaveInterval?: number; // milliseconds
}

export function useCanvasSync({ 
  sessionId, 
  userId, 
  autoSaveInterval = 5000 // 5秒間隔
}: UseCanvasSyncProps = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [canvasId, setCanvasId] = useState<string | null>(null);

  // Canvas保存
  const saveCanvas = useCallback(async (
    content: string, 
    title: string = '無題のドキュメント',
    contentType: 'plain' | 'ssml' | 'script' = 'plain'
  ): Promise<boolean> => {
    if (!userId) {
      toast.error('保存にはログインが必要です');
      return false;
    }

    setIsLoading(true);
    
    try {
      const canvasCollectionRef = collection(db, 'canvasContents');
      const documentId = canvasId || `${sessionId || userId}_${Date.now()}`;
      const canvasDocRef = doc(canvasCollectionRef, documentId);

      // 既存ドキュメントの取得（バージョン管理用）
      let version = 1;
      if (canvasId) {
        const existingDoc = await getDoc(canvasDocRef);
        if (existingDoc.exists()) {
          version = (existingDoc.data().version || 0) + 1;
        }
      }

      const canvasData: Omit<CanvasDocument, 'id' | 'createdAt' | 'updatedAt'> & {
        createdAt: Timestamp | Date;
        updatedAt: Timestamp | Date;
      } = {
        sessionId,
        userId,
        title: title.trim() || '無題のドキュメント',
        content: content,
        contentType,
        createdAt: canvasId ? (await getDoc(canvasDocRef)).data()?.createdAt || serverTimestamp() : serverTimestamp(),
        updatedAt: serverTimestamp(),
        version,
        isPublic: false,
        tags: []
      };

      await setDoc(canvasDocRef, canvasData);
      
      if (!canvasId) {
        setCanvasId(documentId);
      }
      
      setLastSaved(new Date());
      setIsDirty(false);
      
      return true;
    } catch (error) {
      console.error('Canvas save error:', error);
      toast.error('保存に失敗しました');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userId, sessionId, canvasId]);

  // Canvas読み込み
  const loadCanvas = useCallback(async (documentId: string): Promise<CanvasDocument | null> => {
    if (!userId) {
      toast.error('読み込みにはログインが必要です');
      return null;
    }

    setIsLoading(true);
    
    try {
      const canvasDocRef = doc(db, 'canvasContents', documentId);
      const docSnap = await getDoc(canvasDocRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const canvasDoc: CanvasDocument = {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate()
        } as CanvasDocument;
        
        setCanvasId(documentId);
        setLastSaved(canvasDoc.updatedAt);
        setIsDirty(false);
        
        return canvasDoc;
      } else {
        toast.error('ドキュメントが見つかりません');
        return null;
      }
    } catch (error) {
      console.error('Canvas load error:', error);
      toast.error('読み込みに失敗しました');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // 変更状態の追跡
  const markDirty = useCallback(() => {
    setIsDirty(true);
  }, []);

  // 自動保存のセットアップ
  useEffect(() => {
    if (!autoSaveInterval || !isDirty || !userId) return;

    const autoSaveTimer = setTimeout(async () => {
      // 自動保存のロジックは呼び出し元で実装
      // ここでは isDirty フラグをリセットしない
    }, autoSaveInterval);

    return () => clearTimeout(autoSaveTimer);
  }, [autoSaveInterval, isDirty, userId]);

  // エクスポート機能
  const exportCanvas = useCallback((
    content: string, 
    title: string, 
    format: 'txt' | 'json' | 'ssml'
  ) => {
    let exportContent: string;
    let mimeType: string;
    let fileExtension: string;

    switch (format) {
      case 'txt':
        exportContent = content;
        mimeType = 'text/plain';
        fileExtension = 'txt';
        break;
      case 'json':
        exportContent = JSON.stringify({
          title,
          content,
          createdAt: new Date().toISOString(),
          version: 1
        }, null, 2);
        mimeType = 'application/json';
        fileExtension = 'json';
        break;
      case 'ssml':
        exportContent = `<?xml version="1.0" encoding="UTF-8"?>
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ja-JP">
${content.split('\n').map(line => 
  line.trim() ? `  <p>${line.trim()}</p>` : ''
).filter(line => line).join('\n')}
</speak>`;
        mimeType = 'application/xml';
        fileExtension = 'xml';
        break;
      default:
        return;
    }

    const blob = new Blob([exportContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.${fileExtension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(`${format.toUpperCase()} ファイルをダウンロードしました`);
  }, []);

  return {
    saveCanvas,
    loadCanvas,
    exportCanvas,
    markDirty,
    isLoading,
    lastSaved,
    isDirty,
    canvasId
  };
}