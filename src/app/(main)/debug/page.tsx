'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/app';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/app';
import { validateAudioFile } from '@/lib/cloudflare/r2';
import { validateImageFile, getWorkImageURL } from '@/lib/cloudflare/images';
import { WorksCard } from '@/components/ui/WorksCard';
import { WorksSection } from '@/components/ui/WorksSection';
import { Work } from '@/types/work';
import { RealtimeAudioPlayer } from '@/components/features/RealtimeAudioPlayer';
import { createWork } from '@/lib/firebase/works';
import toast from 'react-hot-toast';
import type { User as FirebaseUser } from 'firebase/auth';

// 型定義を追加
interface TestResult {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

interface UploadedFile {
  id: string;
  url: string;
  name: string;
}

interface CssTestResults {
  missingVariables: string[];
  [key: string]: unknown;
}

export default function DebugPage() {
  const { user, userData, loading, error, isAnonymous, refreshUserData } = useAuth();
  const [authHistory, setAuthHistory] = useState<string[]>([]);
  const [firestoreTest, setFirestoreTest] = useState<Record<string, unknown> | null>(null);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);
  const [rawAuthUser, setRawAuthUser] = useState<Partial<FirebaseUser> | null>(null);
  const [creatingUser, setCreatingUser] = useState(false);
  const [createUserError, setCreateUserError] = useState<string | null>(null);
  const [createUserSuccess, setCreateUserSuccess] = useState(false);

  // R2テスト関連のstate
  const [r2TestResults, setR2TestResults] = useState<TestResult[]>([]);
  const [r2TestFile, setR2TestFile] = useState<File | null>(null);
  const [r2Testing, setR2Testing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  // Cloudflare Imagesテスト関連のstate
  const [imagesTestResults, setImagesTestResults] = useState<TestResult[]>([]);
  const [imagesTestFile, setImagesTestFile] = useState<File | null>(null);
  const [imagesTesting, setImagesTesting] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<UploadedFile[]>([]);

  // WorksCardテスト用のstate
  const [testWorks, setTestWorks] = useState<Work[]>([]);
  const [worksCardDebugLogs, setWorksCardDebugLogs] = useState<Array<{timestamp: string, message: string, type: 'info' | 'success' | 'error'}>>([]);
  
  // WorksSection テスト用のstate
  const [worksSectionDebugLogs, setWorksSectionDebugLogs] = useState<Array<{timestamp: string, message: string, type: 'info' | 'success' | 'error'}>>([]);

  // AIチャット機能テスト用のstate
  const [aiChatDebugLogs, setAiChatDebugLogs] = useState<Array<{timestamp: string, message: string, type: 'info' | 'success' | 'error'}>>([]);
  const [aiTestMessage, setAiTestMessage] = useState('');
  const [aiTestResponse, setAiTestResponse] = useState('');
  const [aiTesting, setAiTesting] = useState(false);
  const [aiStreamData, setAiStreamData] = useState<string[]>([]);

  // リアルタイム音声生成テスト用のstate
  const [realtimeTtsText, setRealtimeTtsText] = useState('');
  const [ttsSettings, setTtsSettings] = useState({
    speaking_rate: 1.0,
    pitch: 0.0,
    volume: 1.0,
    emotional_intensity: 1.0,
    tempo_dynamics: 1.0,
    output_format: 'mp3' as 'mp3' | 'wav' | 'aac' | 'opus',
  });
  const [ttsDebugLogs, setTtsDebugLogs] = useState<TestResult[]>([]);

  // CSS レイアウト検証用のstate
  const [cssDebugLogs, setCssDebugLogs] = useState<TestResult[]>([]);
  const [cssAnalyzing, setCssAnalyzing] = useState(false);
  const [cssTestResults, setCssTestResults] = useState<CssTestResults | null>(null);

  // 環境変数チェック用のstate
  const [envVarsStatus, setEnvVarsStatus] = useState<Record<string, unknown> | null>(null);
  const [envChecking, setEnvChecking] = useState(false);

  useEffect(() => {
    const timestamp = new Date().toISOString();
    setAuthHistory(prev => [...prev, `[${timestamp}] Page loaded`]);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      const ts = new Date().toISOString();
      if (currentUser) {
        setRawAuthUser({
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
          isAnonymous: currentUser.isAnonymous,
          emailVerified: currentUser.emailVerified,
          metadata: {
            creationTime: currentUser.metadata.creationTime,
            lastSignInTime: currentUser.metadata.lastSignInTime,
          }
        });
        setAuthHistory(prev => [...prev, `[${ts}] Auth state changed: User detected (${currentUser.email})`]);
      } else {
        setRawAuthUser(null);
        setAuthHistory(prev => [...prev, `[${ts}] Auth state changed: No user`]);
      }
    });

    return () => unsubscribe();
  }, []);

  // リアルタイムCSS状態更新
  useEffect(() => {
    const updateCSSStatus = () => {
      if (typeof window !== 'undefined') {
        try {
          // body要素のスタイル確認
          const bodyStyles = getComputedStyle(document.body);
          const rootStyles = getComputedStyle(document.documentElement);
          
          // DOM要素を取得して更新
          const bgElement = document.getElementById('current-body-bg');
          const colorElement = document.getElementById('current-body-color');
          const fontElement = document.getElementById('current-body-font');
          const bgVarElement = document.getElementById('current-bg-var');
          const fgVarElement = document.getElementById('current-fg-var');
          const primaryVarElement = document.getElementById('current-primary-var');
          
          if (bgElement) bgElement.textContent = bodyStyles.backgroundColor || 'undefined';
          if (colorElement) colorElement.textContent = bodyStyles.color || 'undefined';
          if (fontElement) fontElement.textContent = bodyStyles.fontFamily.split(',')[0] || 'undefined';
          if (bgVarElement) bgVarElement.textContent = rootStyles.getPropertyValue('--background') || 'undefined';
          if (fgVarElement) fgVarElement.textContent = rootStyles.getPropertyValue('--foreground') || 'undefined';
          if (primaryVarElement) primaryVarElement.textContent = rootStyles.getPropertyValue('--primary') || 'undefined';
        } catch (error) {
          console.error('CSS status update error:', error);
        }
      }
    };

    // 初回実行
    const timer = setTimeout(updateCSSStatus, 1000);
    
    // 定期更新
    const interval = setInterval(updateCSSStatus, 5000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const testFirestore = async () => {
      if (user) {
        try {
          const timestamp = new Date().toISOString();
          setAuthHistory(prev => [...prev, `[${timestamp}] Testing Firestore access for user: ${user.uid}`]);
          
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          
          if (userDoc.exists()) {
            const data = userDoc.data();
            setFirestoreTest({
              exists: true,
              data: data,
              id: userDoc.id,
            });
            setAuthHistory(prev => [...prev, `[${timestamp}] Firestore document found`]);
          } else {
            setFirestoreTest({
              exists: false,
              id: user.uid,
            });
            setAuthHistory(prev => [...prev, `[${timestamp}] Firestore document NOT found`]);
          }
        } catch (err: any) {
          const timestamp = new Date().toISOString();
          setFirestoreError(err.message);
          setAuthHistory(prev => [...prev, `[${timestamp}] Firestore error: ${err.message}`]);
        }
      }
    };

    testFirestore();
  }, [user]);

  const createUserDocument = async () => {
    if (!user) {
      setCreateUserError('ユーザーが認証されていません');
      return;
    }

    setCreatingUser(true);
    setCreateUserError(null);
    setCreateUserSuccess(false);

    try {
      const username = user.email?.split('@')[0] || `user_${user.uid.slice(0, 8)}`;
      
      const userData = {
        uid: user.uid,
        email: user.email || '',
        username,
        displayName: user.displayName || username,
        bio: '',
        photoURL: user.photoURL || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'users', user.uid), userData);
      
      await setDoc(doc(db, 'usernames', username), {
        uid: user.uid,
      });

      setCreateUserSuccess(true);
      const timestamp = new Date().toISOString();
      setAuthHistory(prev => [...prev, `[${timestamp}] User document created successfully`]);
      
      // データを再読み込み
      await refreshUserData();
      
      // Firestoreテストも再実行
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        setFirestoreTest({
          exists: true,
          data: userDoc.data(),
          id: userDoc.id,
        });
      }
    } catch (err: any) {
      setCreateUserError(err.message);
      const timestamp = new Date().toISOString();
      setAuthHistory(prev => [...prev, `[${timestamp}] Error creating user document: ${err.message}`]);
    } finally {
      setCreatingUser(false);
    }
  };

  // R2テスト関数群
  const addR2Log = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setR2TestResults(prev => [...prev, { timestamp, message, type }]);
  };

  const testR2Connection = async () => {
    if (!user) {
      toast.error('認証が必要です');
      return;
    }

    setR2Testing(true);
    addR2Log('R2接続テストを開始します...');

    try {
      const token = await user.getIdToken();
      
      // 環境変数の存在確認（フロントエンドからは実際の値は見えない）
      addR2Log('環境変数の確認...');
      
      // テスト用のAPIエンドポイントを呼び出し
      const response = await fetch('/api/works/audio/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: 'test.mp3',
          fileType: 'audio/mpeg',
          workId: 'connection_test_' + Date.now(),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        addR2Log('R2接続成功: 署名付きURLを取得できました', 'success');
        addR2Log(`AudioID: ${result.audioId}`);
      } else {
        const error = await response.text();
        addR2Log(`R2接続エラー (${response.status}): ${error}`, 'error');
      }
    } catch (error) {
      addR2Log(`接続テストでエラーが発生: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setR2Testing(false);
    }
  };

  const testR2Upload = async () => {
    if (!r2TestFile || !user) return;

    setR2Testing(true);
    addR2Log(`ファイルアップロードテストを開始: ${r2TestFile.name}`);

    try {
      // ファイル検証
      const validation = validateAudioFile(r2TestFile);
      if (!validation.valid) {
        addR2Log(`ファイル検証エラー: ${validation.error}`, 'error');
        return;
      }
      addR2Log('ファイル検証: OK');

      const token = await user.getIdToken();
      const testWorkId = `debug_test_${Date.now()}`;

      // 署名付きURLを取得
      addR2Log('署名付きアップロードURLを取得中...');
      const uploadResponse = await fetch('/api/works/audio/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: r2TestFile.name,
          fileType: r2TestFile.type,
          workId: testWorkId,
        }),
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.text();
        addR2Log(`署名付きURL取得エラー: ${error}`, 'error');
        return;
      }

      const { uploadUrl, audioId, audioUrl } = await uploadResponse.json();
      addR2Log('署名付きURL取得: OK');
      addR2Log(`AudioID: ${audioId}`);

      // R2にアップロード
      addR2Log('R2への直接アップロードを開始...');
      const xhr = new XMLHttpRequest();
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          addR2Log(`アップロード進捗: ${progress}%`);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          addR2Log('R2アップロード成功!', 'success');
          addR2Log(`公開URL: ${audioUrl}`);
          
          // アップロード済みファイルリストに追加
          setUploadedFiles(prev => [...prev, {
            id: audioId,
            url: audioUrl,
            name: r2TestFile.name
          }]);
          
          toast.success('テストアップロードが完了しました');
        } else {
          addR2Log(`R2アップロードエラー: HTTP ${xhr.status}`, 'error');
        }
        setR2Testing(false);
      };

      xhr.onerror = () => {
        addR2Log('R2アップロードでネットワークエラーが発生', 'error');
        setR2Testing(false);
      };

      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', r2TestFile.type);
      xhr.send(r2TestFile);

    } catch (error) {
      addR2Log(`アップロードテストエラー: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      setR2Testing(false);
    }
  };

  const testR2Download = async (audioId: string) => {
    if (!user) return;

    setR2Testing(true);
    addR2Log(`ファイル情報取得テスト: ${audioId}`);

    try {
      const token = await user.getIdToken();
      
      // ファイル情報取得のAPIエンドポイントを作成する必要がある
      // 今回は簡易的にログ出力のみ
      addR2Log('ファイル情報取得機能は未実装（R2から直接情報を取得）');
      addR2Log(`AudioID: ${audioId}`);
      addR2Log('実際のプロダクションでは、ファイルのメタデータやサイズ情報を取得できます', 'info');
      
    } catch (error) {
      addR2Log(`ファイル情報取得エラー: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setR2Testing(false);
    }
  };

  const testR2Delete = async (audioId: string, fileName: string) => {
    if (!user) return;

    const confirmed = window.confirm(`テストファイル "${fileName}" を削除しますか？`);
    if (!confirmed) return;

    setR2Testing(true);
    addR2Log(`ファイル削除テスト: ${fileName}`);

    try {
      // 削除のAPIエンドポイントを作成する必要がある
      // 現在は削除機能のAPIが存在しないため、ログ出力のみ
      addR2Log('ファイル削除機能は未実装');
      addR2Log(`削除対象AudioID: ${audioId}`);
      addR2Log('実際のプロダクションでは、R2からファイルを削除できます', 'info');
      
      // UIから削除（実際のファイルは残る）
      setUploadedFiles(prev => prev.filter(file => file.id !== audioId));
      addR2Log('UIからファイルを削除しました（実際のファイルは残存）', 'success');
      
    } catch (error) {
      addR2Log(`ファイル削除エラー: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setR2Testing(false);
    }
  };

  // Cloudflare Imagesテスト関数群
  const addImagesLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setImagesTestResults(prev => [...prev, { timestamp, message, type }]);
  };

  const testImagesConnection = async () => {
    if (!user) {
      toast.error('認証が必要です');
      return;
    }

    setImagesTesting(true);
    addImagesLog('Cloudflare Images接続テストを開始します...');

    try {
      const token = await user.getIdToken();
      
      addImagesLog('環境変数の確認...');
      
      const response = await fetch('/api/works/image/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workId: 'connection_test_' + Date.now(),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        addImagesLog('Cloudflare Images接続成功: アップロードURLを取得できました', 'success');
        addImagesLog(`ImageID: ${result.imageId}`);
        addImagesLog(`ImageURL: ${result.imageUrl}`);
      } else {
        const error = await response.text();
        addImagesLog(`Cloudflare Images接続エラー (${response.status}): ${error}`, 'error');
      }
    } catch (error) {
      addImagesLog(`接続テストでエラーが発生: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setImagesTesting(false);
    }
  };

  const testImagesUpload = async () => {
    if (!imagesTestFile || !user) return;

    setImagesTesting(true);
    addImagesLog(`画像アップロードテストを開始: ${imagesTestFile.name}`);

    try {
      // ファイル検証
      const validation = validateImageFile(imagesTestFile);
      if (!validation.valid) {
        addImagesLog(`ファイル検証エラー: ${validation.error}`, 'error');
        return;
      }
      addImagesLog('ファイル検証: OK');

      const token = await user.getIdToken();
      const testWorkId = `debug_test_${Date.now()}`;

      // ダイレクトアップロードURLを取得
      addImagesLog('Cloudflare ImagesアップロードURLを取得中...');
      const uploadResponse = await fetch('/api/works/image/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workId: testWorkId,
        }),
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.text();
        addImagesLog(`アップロードURL取得エラー: ${error}`, 'error');
        return;
      }

      const { uploadURL, imageId, imageUrl } = await uploadResponse.json();
      addImagesLog('アップロードURL取得: OK');
      addImagesLog(`ImageID: ${imageId}`);

      // Cloudflare Imagesにアップロード
      addImagesLog('Cloudflare Imagesへの直接アップロードを開始...');
      
      const formData = new FormData();
      formData.append('file', imagesTestFile);

      const xhr = new XMLHttpRequest();
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          addImagesLog(`アップロード進捗: ${progress}%`);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          addImagesLog('Cloudflare Imagesアップロード成功!', 'success');
          addImagesLog(`公開URL: ${imageUrl}`);
          
          // アップロード済み画像リストに追加
          setUploadedImages(prev => [...prev, {
            id: imageId,
            url: imageUrl,
            name: imagesTestFile.name
          }]);
          
          toast.success('テスト画像アップロードが完了しました');
        } else {
          addImagesLog(`Cloudflare Imagesアップロードエラー: HTTP ${xhr.status}`, 'error');
        }
        setImagesTesting(false);
      };

      xhr.onerror = () => {
        addImagesLog('Cloudflare Imagesアップロードでネットワークエラーが発生', 'error');
        setImagesTesting(false);
      };

      xhr.open('POST', uploadURL);
      xhr.send(formData);

    } catch (error) {
      addImagesLog(`アップロードテストエラー: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      setImagesTesting(false);
    }
  };

  const testImagesVariants = (imageId: string) => {
    addImagesLog(`画像バリエーションテスト: ${imageId}`);
    
    const variants: Array<{name: string, size: string}> = [
      { name: 'thumbnail', size: '200x200' },
      { name: 'preview', size: '400x400' },
      { name: 'gallery', size: '300x300' },
      { name: 'medium', size: '800x800' },
      { name: 'large', size: '1200x1200' },
      { name: 'public', size: '2048x2048' },
    ];
    
    variants.forEach(variant => {
      const url = getWorkImageURL(imageId, variant.name as any);
      addImagesLog(`${variant.name} (${variant.size}): ${url}`);
    });
  };

  const testImagesDelete = async (imageId: string, fileName: string) => {
    if (!user) return;

    const confirmed = window.confirm(`テスト画像 "${fileName}" を削除しますか？`);
    if (!confirmed) return;

    setImagesTesting(true);
    addImagesLog(`画像削除テスト: ${fileName}`);

    try {
      addImagesLog('画像削除機能は未実装（実際のプロダクションでは削除可能）');
      addImagesLog(`削除対象ImageID: ${imageId}`);
      
      // UIから削除（実際のファイルは残る）
      setUploadedImages(prev => prev.filter(image => image.id !== imageId));
      addImagesLog('UIから画像を削除しました（実際のファイルは残存）', 'success');
      
    } catch (error) {
      addImagesLog(`画像削除エラー: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setImagesTesting(false);
    }
  };

  // WorksCard用のデバッグ関数
  const addWorksCardLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setWorksCardDebugLogs(prev => [...prev, { timestamp, message, type }]);
  };

  const createTestWorks = () => {
    addWorksCardLog('テスト用Workデータを作成中...');
    
    // アップロード済み画像を使ってテストWorkを作成
    const works = uploadedImages.map((image, index) => ({
      id: `test-work-${index}`,
      title: `テスト作品${index + 1}: ${image.name}`,
      description: `デバッグ用テスト作品です。ImageID: ${image.id}`,
      imageUrl: image.url,
      imageId: image.id,
      audioUrl: uploadedFiles[0]?.url || undefined,
      audioId: uploadedFiles[0]?.id || undefined,
      userId: user?.uid || 'test-user',
      username: userData?.username || 'test-username',
      displayName: userData?.displayName || 'テストユーザー',
      userPhotoURL: user?.photoURL || null,
      tags: ['デバッグ', 'テスト'],
      tagIds: ['debug', 'test'],
      tagNames: ['デバッグ', 'テスト'],
      likeCount: Math.floor(Math.random() * 100),
      isR18Work: false,
      contentRating: 'all' as const,
      publishStatus: 'public' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    // 環境変数が正しく設定されていない場合のテストケースも追加
    if (uploadedImages.length === 0) {
      works.push({
        id: 'test-work-env-issue',
        title: 'テスト作品（環境変数問題検証用）',
        description: 'CLOUDFLARE_ACCOUNT_HASHがundefinedの場合のテスト',
        imageUrl: 'https://imagedelivery.net/undefined/dummy-image-id/gallery',
        imageId: 'dummy-image-id',
        audioUrl: undefined,
        audioId: undefined,
        userId: user?.uid || 'test-user',
        username: userData?.username || 'test-username', 
        displayName: userData?.displayName || 'テストユーザー',
        userPhotoURL: user?.photoURL || null,
        tags: ['環境変数', 'テスト'],
        tagIds: ['env', 'test'],
        tagNames: ['環境変数', 'テスト'],
        likeCount: 42,
        isR18Work: false,
        contentRating: 'all' as const,
        publishStatus: 'public' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    setTestWorks(works as unknown as Work[]);
    addWorksCardLog(`${works.length}個のテストWorkデータを作成しました`, 'success');
    
    // 各WorkのImageURLを検証
    works.forEach((work, index) => {
      if (work.imageId && work.imageUrl) {
        const expectedGalleryUrl = getWorkImageURL(work.imageId, 'gallery');
        addWorksCardLog(`Work ${index + 1}: imageUrl=${work.imageUrl}`);
        addWorksCardLog(`Work ${index + 1}: expected gallery URL=${expectedGalleryUrl}`);
        
        if (expectedGalleryUrl.includes('undefined')) {
          addWorksCardLog(`Work ${index + 1}: 環境変数CLOUDFLARE_ACCOUNT_HASHが未定義です！`, 'error');
        }
      }
    });
  };

  const testWorksCardImageLoad = (work: Work) => {
    addWorksCardLog(`画像読み込みテスト: ${work.title}`);
    addWorksCardLog(`ImageID: ${work.imageId}`);
    addWorksCardLog(`ImageURL: ${work.imageUrl}`);
    
    if (work.imageId) {
      const galleryUrl = getWorkImageURL(work.imageId, 'gallery');
      addWorksCardLog(`Gallery URL: ${galleryUrl}`);
      
      // 画像の存在確認テスト
      const img = new Image();
      img.onload = () => {
        addWorksCardLog(`✅ 画像読み込み成功: ${work.title}`, 'success');
      };
      img.onerror = (e) => {
        addWorksCardLog(`❌ 画像読み込み失敗: ${work.title}`, 'error');
        addWorksCardLog(`エラー詳細: ${JSON.stringify(e)}`, 'error');
      };
      img.src = galleryUrl;
    }
  };

  const handleWorksCardLike = (workId: string, currentLikeCount: number) => {
    addWorksCardLog(`Like clicked: workId=${workId}, count=${currentLikeCount}`);
    // 実際のいいね処理は行わず、ログ出力のみ
  };

  const handleWorksCardUserClick = (username: string) => {
    addWorksCardLog(`User clicked: ${username}`);
  };

  const handleWorksCardWorkClick = (workId: string) => {
    addWorksCardLog(`Work clicked: ${workId}`);
  };

  // WorksSection用のデバッグ関数
  const addWorksSectionLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setWorksSectionDebugLogs(prev => [...prev, { timestamp, message, type }]);
  };

  const handleWorksSectionLike = (workId: string, currentLikeCount: number) => {
    addWorksSectionLog(`Like clicked: workId=${workId}, count=${currentLikeCount}`);
    // 実際のいいね処理は行わず、ログ出力のみ
  };

  const handleWorksSectionUserClick = (username: string) => {
    addWorksSectionLog(`User clicked: ${username}`);
  };

  const handleWorksSectionWorkClick = (workId: string) => {
    addWorksSectionLog(`Work clicked: ${workId}`);
  };

  // AIチャット機能のデバッグ関数群
  const addAiChatLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setAiChatDebugLogs(prev => [...prev, { timestamp, message, type }]);
  };

  // Aivis API テスト専用のstate
  const [aivisApiLogs, setAivisApiLogs] = useState<Array<{timestamp: string, message: string, type: 'info' | 'success' | 'error'}>>([]);
  const [aivisTestText, setAivisTestText] = useState('こんにちは！これはAivis Cloud APIのテスト音声です。');
  const [aivisTestResult, setAivisTestResult] = useState<any>(null);
  const [aivisTesting, setAivisTesting] = useState(false);

  const addAivisLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setAivisApiLogs(prev => [...prev, { timestamp, message, type }]);
  };

  const testAivisConnection = async () => {
    if (!user) {
      toast.error('認証が必要です');
      return;
    }

    setAivisTesting(true);
    setAivisTestResult(null);
    addAivisLog('Aivis Cloud API接続テストを開始...');

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('ログインが必要です');
      }
      
      const token = await currentUser.getIdToken();
      addAivisLog('Firebase認証トークンを取得: OK');

      // 環境変数の確認
      addAivisLog('環境変数の確認...');

      const response = await fetch('/api/aivis/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: aivisTestText,
          outputFormat: 'mp3',
        }),
      });

      addAivisLog(`APIレスポンス: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'JSONパースエラー' }));
        throw new Error(`API Error ${response.status}: ${errorData.error || response.statusText}`);
      }

      const result = await response.json();
      setAivisTestResult(result);

      if (result.success) {
        addAivisLog('✅ Aivis API接続成功！', 'success');
        addAivisLog(`音声URL: ${result.audioUrl}`, 'success');
        addAivisLog(`音声ID: ${result.audioId}`, 'success');
      } else {
        addAivisLog(`❌ Aivis API エラー: ${result.error}`, 'error');
      }
    } catch (error) {
      addAivisLog(`❌ 接続テストエラー: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      console.error('Aivis API test error:', error);
    } finally {
      setAivisTesting(false);
    }
  };

  const testAivisEnvironment = () => {
    addAivisLog('Aivis Cloud API環境設定の確認を開始...');
    
    // クライアントサイドから直接環境変数は見えないが、設定の確認
    addAivisLog('環境変数の存在確認:');
    addAivisLog('- AIVIS_API_KEY: [サーバーサイドでのみ確認可能]');
    addAivisLog('- AIVIS_DEFAULT_MODEL_UUID: [サーバーサイドでのみ確認可能]');
    
    // APIエンドポイントの確認
    addAivisLog('APIエンドポイント: /api/aivis/generate');
    addAivisLog('デフォルトモデル: a59cb814-0083-4369-8542-f51a29e72af7');
    addAivisLog('対応フォーマット: mp3, wav, flac, aac, opus');
    
    addAivisLog('環境確認完了。実際の接続テストを実行してください。', 'success');
  };

  const testAiConnection = async () => {
    if (!user) {
      toast.error('認証が必要です');
      return;
    }

    setAiTesting(true);
    addAiChatLog('AI API接続テストを開始...');
    
    try {
      const token = await user.getIdToken();
      addAiChatLog('Firebase認証トークンを取得');
      
      // 環境変数確認
      addAiChatLog('OpenRouter API設定の確認中...');
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello, this is a connection test.' }]
        })
      });

      if (response.ok) {
        addAiChatLog('AI API接続成功', 'success');
        const reader = response.body?.getReader();
        if (reader) {
          addAiChatLog('ストリーミング応答の読み取り開始');
          const decoder = new TextDecoder();
          let result = '';
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            result += chunk;
            addAiChatLog(`ストリームチャンク受信: ${chunk.slice(0, 50)}...`);
          }
          
          addAiChatLog(`完全な応答を受信: ${result.length}文字`, 'success');
        }
      } else {
        const error = await response.text();
        addAiChatLog(`AI API接続エラー (${response.status}): ${error}`, 'error');
      }
    } catch (error) {
      addAiChatLog(`接続テストエラー: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setAiTesting(false);
    }
  };

  const testAiChatMessage = async () => {
    if (!aiTestMessage.trim() || !user) {
      addAiChatLog('テストメッセージまたはユーザー認証が不足', 'error');
      return;
    }

    setAiTesting(true);
    setAiTestResponse('');
    setAiStreamData([]);
    addAiChatLog(`メッセージテスト開始: "${aiTestMessage}"`);

    try {
      const token = await user.getIdToken();
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: aiTestMessage }]
        })
      });

      if (!response.ok) {
        const error = await response.text();
        addAiChatLog(`API エラー (${response.status}): ${error}`, 'error');
        return;
      }

      addAiChatLog('AIからのストリーミング応答を受信中...');
      const reader = response.body?.getReader();
      
      if (reader) {
        const decoder = new TextDecoder();
        let fullResponse = '';
        const chunks: string[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          chunks.push(chunk);
          fullResponse += chunk;
          
          setAiStreamData(prev => [...prev, chunk]);
          setAiTestResponse(fullResponse);
        }

        addAiChatLog(`メッセージテスト完了: ${fullResponse.length}文字の応答を受信`, 'success');
        addAiChatLog(`受信チャンク数: ${chunks.length}`);
      }
    } catch (error) {
      addAiChatLog(`メッセージテストエラー: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setAiTesting(false);
    }
  };

  const testAiChatEnvironment = async () => {
    addAiChatLog('環境変数とAPI設定の確認開始...');
    
    // クライアントサイドからは実際の環境変数の値は見えないため、APIを呼び出して確認
    if (!user) {
      addAiChatLog('ユーザー認証が必要', 'error');
      return;
    }

    try {
      const token = await user.getIdToken();
      
      // ヘルスチェック用のエンドポイント（もし存在すれば）
      // または小さなテストリクエストでAPI設定を確認
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'env check' }]
        })
      });

      if (response.ok) {
        addAiChatLog('✅ OpenRouter API設定: 正常', 'success');
        addAiChatLog('✅ Firebase認証: 正常', 'success');
        addAiChatLog('✅ API エンドポイント: アクセス可能', 'success');
      } else {
        addAiChatLog(`❌ API設定エラー: ${response.status}`, 'error');
      }
    } catch (error) {
      addAiChatLog(`環境確認エラー: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  // リアルタイム音声生成のデバッグ関数群
  const addTtsLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setTtsDebugLogs(prev => [...prev, { timestamp, message, type }]);
  };

  const testRealtimeTtsApi = async () => {
    if (!realtimeTtsText.trim()) {
      addTtsLog('テストテキストを入力してください', 'error');
      return;
    }

    addTtsLog(`リアルタイムTTS APIテスト開始: "${realtimeTtsText.substring(0, 50)}..."`, 'info');

    try {
      const response = await fetch('/api/tts/realtime-synthesize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: realtimeTtsText,
          ...ttsSettings,
        }),
      });

      if (!response.ok) {
        throw new Error(`API応答エラー: ${response.status}`);
      }

      addTtsLog('✅ API接続成功: ストリーミング開始', 'success');

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('レスポンスストリームを読み取れません');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let chunkCount = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunkCount++;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));
              
              if (data.chunkId === 'init') {
                addTtsLog(`📊 音声生成統計: ${data.totalChunks}チャンク, ${data.metadata?.characterCount}文字`, 'info');
              } else if (data.chunkId === 'complete') {
                addTtsLog('✅ 音声生成完了', 'success');
              } else if (data.audioData) {
                addTtsLog(`🎵 チャンク ${data.chunkIndex + 1}: ${data.text.substring(0, 30)}... (${data.metadata?.characterCount}文字)`, 'success');
              } else if (data.error) {
                addTtsLog(`❌ チャンクエラー ${data.chunkIndex}: ${data.error}`, 'error');
              }
            } catch (parseError) {
              addTtsLog(`解析エラー: ${parseError}`, 'error');
            }
          }
        }
      }

      addTtsLog(`📈 ストリーミング完了: 合計 ${chunkCount} データチャンク受信`, 'success');

    } catch (error) {
      addTtsLog(`❌ テストエラー: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  const loadSampleTtsText = (type: 'short' | 'long' | 'ssml') => {
    switch (type) {
      case 'short':
        setRealtimeTtsText('こんにちは！AIボイスドラマの世界へようこそ。');
        break;
      case 'long':
        setRealtimeTtsText(`AIボイスドラマ制作プラットフォームへようこそ！
このプラットフォームでは、最新のAI技術を活用して、誰でも簡単に高品質なボイスドラマを制作できます。

リアルタイム音声合成機能により、長いテキストでも即座に音声再生を開始できます。
テキストは適切な単位で分割され、並行して音声生成と再生が行われるため、待機時間を大幅に短縮できます。

さあ、あなたの想像力を形にしてみましょう！`);
        break;
      case 'ssml':
        setRealtimeTtsText(`<p>こんにちは！<break time="0.5s"/>AIボイスドラマの世界へようこそ。</p>
<p><prosody rate="110%" volume="loud">この機能では、リアルタイムで音声合成が行われます。</prosody></p>
<p>長いテキストでも、<prosody rate="90%" pitch="+0.1">即座に再生を開始</prosody>できるのが特徴です。</p>`);
        break;
    }
  };

  // CSS レイアウト検証のデバッグ関数群
  const addCssLog = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setCssDebugLogs(prev => [...prev, { timestamp, message, type }]);
  };

  const analyzeCSSVariables = () => {
    setCssAnalyzing(true);
    addCssLog('CSS変数の解析を開始...');
    
    try {
      const rootStyles = getComputedStyle(document.documentElement);
      const results: any = {
        cssVariables: {},
        tailwindClasses: {},
        conflictingStyles: [],
        missingVariables: []
      };

      // CSS変数の確認
      const cssVars = [
        'background', 'foreground', 'card', 'card-foreground', 
        'popover', 'popover-foreground', 'primary', 'primary-foreground',
        'secondary', 'secondary-foreground', 'muted', 'muted-foreground',
        'accent', 'accent-foreground', 'destructive', 'border', 'input', 'ring'
      ];

      cssVars.forEach(varName => {
        const value = rootStyles.getPropertyValue(`--${varName}`);
        results.cssVariables[varName] = value || 'undefined';
        
        if (!value) {
          results.missingVariables.push(varName);
          addCssLog(`❌ CSS変数未定義: --${varName}`, 'error');
        } else {
          addCssLog(`✅ --${varName}: ${value}`, 'success');
        }
      });

      // Tailwind基本クラスの確認
      const testElement = document.createElement('div');
      document.body.appendChild(testElement);

      const tailwindClasses = [
        'bg-white', 'text-gray-900', 'border', 'rounded', 'p-4', 
        'flex', 'items-center', 'justify-center', 'shadow'
      ];

      tailwindClasses.forEach(className => {
        testElement.className = className;
        const computedStyle = getComputedStyle(testElement);
        
        if (className === 'bg-white') {
          const bgColor = computedStyle.backgroundColor;
          results.tailwindClasses[className] = bgColor;
          if (bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent') {
            addCssLog(`⚠️ ${className} が適用されていません: ${bgColor}`, 'warning');
          } else {
            addCssLog(`✅ ${className}: ${bgColor}`, 'success');
          }
        }
        
        if (className === 'text-gray-900') {
          const textColor = computedStyle.color;
          results.tailwindClasses[className] = textColor;
          if (textColor === 'rgba(0, 0, 0, 0)' || textColor === 'transparent') {
            addCssLog(`⚠️ ${className} が適用されていません: ${textColor}`, 'warning');
          } else {
            addCssLog(`✅ ${className}: ${textColor}`, 'success');
          }
        }
      });

      document.body.removeChild(testElement);
      
      setCssTestResults(results);
      addCssLog('CSS解析完了', 'success');
      
    } catch (error) {
      addCssLog(`CSS解析エラー: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setCssAnalyzing(false);
    }
  };

  const checkGlobalCSS = () => {
    addCssLog('globals.cssの読み込み状況を確認...');
    
    try {
      // styleタグの確認
      const styleTags = document.querySelectorAll('style');
      addCssLog(`読み込まれたstyleタグ数: ${styleTags.length}`);
      
      styleTags.forEach((style, index) => {
        if (style.innerHTML.includes('--background') || style.innerHTML.includes('tailwindcss')) {
          addCssLog(`Style ${index}: globals.css関連のスタイルを確認`, 'success');
        }
      });

      // linkタグの確認
      const linkTags = document.querySelectorAll('link[rel="stylesheet"]');
      addCssLog(`読み込まれたCSSファイル数: ${linkTags.length}`);
      
      linkTags.forEach((link, index) => {
        const href = (link as HTMLLinkElement).href;
        addCssLog(`CSS ${index}: ${href}`);
      });

      // body要素のスタイル確認
      const bodyStyles = getComputedStyle(document.body);
      addCssLog(`body背景色: ${bodyStyles.backgroundColor}`);
      addCssLog(`body文字色: ${bodyStyles.color}`);
      addCssLog(`bodyフォント: ${bodyStyles.fontFamily}`);
      
    } catch (error) {
      addCssLog(`globals.css確認エラー: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  const testTailwindClasses = () => {
    addCssLog('主要なTailwindクラスの動作テスト...');
    
    try {
      // 一時的なテスト要素を作成
      const testContainer = document.createElement('div');
      testContainer.style.position = 'absolute';
      testContainer.style.top = '-9999px';
      testContainer.innerHTML = `
        <div class="bg-white text-gray-900 p-4 border rounded shadow">テスト</div>
        <div class="bg-blue-500 text-white">青背景</div>
        <div class="flex items-center justify-center">フレックス</div>
      `;
      
      document.body.appendChild(testContainer);
      
      const testElements = testContainer.querySelectorAll('div');
      testElements.forEach((element, index) => {
        const computed = getComputedStyle(element);
        addCssLog(`要素${index}: bg=${computed.backgroundColor}, color=${computed.color}`);
      });
      
      document.body.removeChild(testContainer);
      addCssLog('Tailwindクラステスト完了', 'success');
      
    } catch (error) {
      addCssLog(`Tailwindテストエラー: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  const diagnoseLayoutIssues = () => {
    addCssLog('レイアウト問題の診断を開始...');
    
    try {
      const issues: string[] = [];
      
      // 現在のページ要素のスタイル確認
      const container = document.querySelector('.container');
      if (container) {
        const containerStyles = getComputedStyle(container);
        addCssLog(`コンテナ幅: ${containerStyles.width}`);
        addCssLog(`コンテナmargin: ${containerStyles.margin}`);
        addCssLog(`コンテナpadding: ${containerStyles.padding}`);
      } else {
        addCssLog('⚠️ .container要素が見つかりません', 'warning');
        issues.push('container要素なし');
      }
      
      // セクション要素の確認
      const sections = document.querySelectorAll('section');
      addCssLog(`セクション要素数: ${sections.length}`);
      
      sections.forEach((section, index) => {
        const sectionStyles = getComputedStyle(section);
        if (sectionStyles.backgroundColor === 'rgba(0, 0, 0, 0)') {
          addCssLog(`⚠️ セクション${index}: 背景色が透明`, 'warning');
          issues.push(`section${index}背景透明`);
        }
      });
      
      // フォントの確認
      const bodyFont = getComputedStyle(document.body).fontFamily;
      if (!bodyFont.includes('system-ui') && !bodyFont.includes('Roboto')) {
        addCssLog(`⚠️ システムフォントが適用されていない: ${bodyFont}`, 'warning');
        issues.push('フォント問題');
      }
      
      addCssLog(`診断完了: ${issues.length}個の問題を検出`, issues.length > 0 ? 'warning' : 'success');
      
    } catch (error) {
      addCssLog(`レイアウト診断エラー: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  const fixCSSIssues = () => {
    addCssLog('CSS問題の自動修正を試行...');
    
    try {
      // 緊急修正用のCSSを動的に追加
      const fixStyle = document.createElement('style');
      fixStyle.id = 'debug-css-fix';
      
      // 既存の修正スタイルを削除
      const existingFix = document.getElementById('debug-css-fix');
      if (existingFix) {
        existingFix.remove();
        addCssLog('既存の修正CSSを削除');
      }
      
      fixStyle.innerHTML = `
        /* デバッグ用CSS修正 */
        body {
          background-color: #ffffff !important;
          color: #111827 !important;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
        }
        
        .container {
          max-width: 1200px !important;
          margin: 0 auto !important;
          padding: 0 1rem !important;
        }
        
        section {
          background-color: #ffffff !important;
          border: 1px solid #e5e7eb !important;
          border-radius: 0.5rem !important;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1) !important;
          padding: 1.5rem !important;
          margin-bottom: 1.5rem !important;
        }
        
        h1, h2, h3 {
          color: #111827 !important;
        }
        
        button {
          cursor: pointer !important;
          transition: all 0.2s !important;
        }
        
        input, textarea {
          border: 1px solid #d1d5db !important;
          border-radius: 0.375rem !important;
          padding: 0.5rem !important;
        }
      `;
      
      document.head.appendChild(fixStyle);
      addCssLog('緊急修正CSSを適用しました', 'success');
      addCssLog('ページをリロードして修正を確認してください', 'info');
      
    } catch (error) {
      addCssLog(`CSS修正エラー: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  const removeCSSFix = () => {
    // CSS修正を削除する処理
    addCssLog('CSS修正を削除しました', 'info');
  };

  // 環境変数の状態をチェック
  const checkEnvironmentVariables = () => {
    setEnvChecking(true);
    
    const requiredVars = {
      // Firebase
      FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? '***SET***' : undefined,
      FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
      
      // Cloudflare Images
      CLOUDFLARE_ACCOUNT_ID: process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_ID,
      CLOUDFLARE_IMAGES_API_TOKEN: process.env.CLOUDFLARE_IMAGES_API_TOKEN ? '***SET***' : undefined,
      CLOUDFLARE_IMAGES_ACCOUNT_HASH: process.env.NEXT_PUBLIC_CLOUDFLARE_IMAGES_ACCOUNT_HASH,
      
      // Cloudflare R2
      CLOUDFLARE_R2_ACCOUNT_ID: process.env.CLOUDFLARE_R2_ACCOUNT_ID ? '***SET***' : undefined,
      CLOUDFLARE_R2_ACCESS_KEY_ID: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ? '***SET***' : undefined,
      CLOUDFLARE_R2_SECRET_ACCESS_KEY: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ? '***SET***' : undefined,
      CLOUDFLARE_R2_BUCKET_NAME: process.env.CLOUDFLARE_R2_BUCKET_NAME,
      CLOUDFLARE_R2_PUBLIC_DOMAIN: process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN,
    };

    const missingVars = Object.entries(requiredVars)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    const status = {
      allSet: missingVars.length === 0,
      missingVars,
      vars: requiredVars,
      timestamp: new Date().toISOString(),
    };

    setEnvVarsStatus(status);
    setEnvChecking(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">デバッグページ</h1>
      
      <div className="space-y-6">
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">認証状態</h2>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="font-medium">Loading:</span>
              <span className={loading ? 'text-yellow-600' : 'text-green-600'}>
                {loading ? 'true (読み込み中)' : 'false (完了)'}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium">Error:</span>
              <span className={error ? 'text-red-600' : 'text-gray-600'}>
                {error || 'なし'}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium">Is Anonymous:</span>
              <span>{isAnonymous ? 'true' : 'false'}</span>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Firebase Auth ユーザー (useAuth Hook)</h2>
          {user ? (
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                emailVerified: user.emailVerified,
                isAnonymous: user.isAnonymous,
              }, null, 2)}
            </pre>
          ) : (
            <p className="text-red-600">ユーザーが見つかりません</p>
          )}
        </section>

        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Firebase Auth ユーザー (Direct)</h2>
          {rawAuthUser ? (
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(rawAuthUser, null, 2)}
            </pre>
          ) : (
            <p className="text-red-600">直接取得: ユーザーが見つかりません</p>
          )}
        </section>

        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Firestore ユーザーデータ (userData)</h2>
          {userData ? (
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(userData, null, 2)}
            </pre>
          ) : (
            <p className="text-yellow-600">ユーザーデータが見つかりません</p>
          )}
        </section>

        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Firestore 直接テスト</h2>
          {firestoreTest ? (
            <div>
              <p className="mb-2">
                ドキュメント存在: 
                <span className={firestoreTest.exists ? 'text-green-600 ml-2' : 'text-red-600 ml-2'}>
                  {firestoreTest.exists ? 'はい' : 'いいえ'}
                </span>
              </p>
              {firestoreTest?.data ? (
                <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
                  {JSON.stringify(firestoreTest.data as Record<string, unknown>, null, 2)}
                </pre>
              ) : null}
            </div>
          ) : (
            <p className="text-gray-600">テスト未実行</p>
          )}
          {firestoreError && (
            <p className="text-red-600 mt-2">エラー: {firestoreError}</p>
          )}
        </section>

        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">認証履歴</h2>
          <div className="bg-gray-100 p-4 rounded max-h-64 overflow-auto">
            {authHistory.length > 0 ? (
              <ul className="space-y-1 text-sm font-mono">
                {authHistory.map((entry, index) => (
                  <li key={index} className="text-gray-700">{entry}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600">履歴なし</p>
            )}
          </div>
        </section>

        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Firestoreユーザードキュメント作成</h2>
          {!userData && user && (
            <>
              <p className="text-amber-600 mb-4">
                認証済みユーザーにFirestoreドキュメントが存在しません。
                以下のボタンをクリックして作成してください。
              </p>
              <button
                onClick={createUserDocument}
                disabled={creatingUser}
                className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingUser ? '作成中...' : 'ユーザードキュメントを作成'}
              </button>
              {createUserSuccess && (
                <p className="mt-2 text-green-600">✅ ユーザードキュメントが正常に作成されました</p>
              )}
              {createUserError && (
                <p className="mt-2 text-red-600">エラー: {createUserError}</p>
              )}
            </>
          )}
          {userData && (
            <p className="text-green-600">✅ ユーザードキュメントは既に存在します</p>
          )}
          {!user && (
            <p className="text-gray-600">ユーザーが認証されていません</p>
          )}
        </section>

        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Cloudflare R2テスト</h2>
          <div className="space-y-4">
            {/* R2接続テスト */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-3">R2接続テスト</h3>
              <div className="flex gap-2 mb-3">
                <button
                  onClick={testR2Connection}
                  disabled={r2Testing}
                  className="cursor-pointer px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors duration-200 disabled:opacity-50"
                >
                  {r2Testing ? '接続テスト中...' : 'R2接続テスト'}
                </button>
                <button
                  onClick={() => setR2TestResults([])}
                  className="cursor-pointer px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors duration-200"
                >
                  ログクリア
                </button>
              </div>
              
              {/* テスト結果表示 */}
              <div className="bg-gray-100 p-3 rounded max-h-40 overflow-auto">
                {r2TestResults.length > 0 ? (
                  <div className="space-y-1 text-sm font-mono">
                    {r2TestResults.map((result, index) => (
                      <div key={index} className={`${result.type === 'error' ? 'text-red-600' : result.type === 'success' ? 'text-green-600' : 'text-gray-700'}`}>
                        [{result.timestamp}] {result.message}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-sm">テスト結果がここに表示されます</p>
                )}
              </div>
            </div>

            {/* 音声ファイルアップロードテスト */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-3">音声ファイルアップロードテスト</h3>
              <div className="space-y-3">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setR2TestFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                
                {r2TestFile && (
                  <div className="text-sm text-gray-600">
                    選択ファイル: {r2TestFile.name} ({(r2TestFile.size / 1024 / 1024).toFixed(2)}MB)
                  </div>
                )}
                
                <div className="flex gap-2">
                  <button
                    onClick={testR2Upload}
                    disabled={!r2TestFile || r2Testing || !user}
                    className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
                  >
                    {r2Testing ? 'アップロード中...' : 'アップロードテスト'}
                  </button>
                </div>
              </div>
            </div>

            {/* アップロード済みファイル管理 */}
            {uploadedFiles.length > 0 && (
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-3">アップロード済みファイル</h3>
                <div className="space-y-2">
                  {uploadedFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">{file.name}</span>
                        <audio controls className="h-8">
                          <source src={file.url} type="audio/mpeg" />
                        </audio>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => testR2Download(file.id)}
                          disabled={r2Testing}
                          className="cursor-pointer px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors duration-200 disabled:opacity-50"
                        >
                          情報取得
                        </button>
                        <button
                          onClick={() => testR2Delete(file.id, file.name)}
                          disabled={r2Testing}
                          className="cursor-pointer px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-200 disabled:opacity-50"
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Cloudflare Imagesテスト</h2>
          <div className="space-y-4">
            {/* Cloudflare Images接続テスト */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-3">Cloudflare Images接続テスト</h3>
              <div className="flex gap-2 mb-3">
                <button
                  onClick={testImagesConnection}
                  disabled={imagesTesting}
                  className="cursor-pointer px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors duration-200 disabled:opacity-50"
                >
                  {imagesTesting ? '接続テスト中...' : 'Cloudflare Images接続テスト'}
                </button>
                <button
                  onClick={() => setImagesTestResults([])}
                  className="cursor-pointer px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors duration-200"
                >
                  ログクリア
                </button>
              </div>
              
              {/* テスト結果表示 */}
              <div className="bg-gray-100 p-3 rounded max-h-40 overflow-auto">
                {imagesTestResults.length > 0 ? (
                  <div className="space-y-1 text-sm font-mono">
                    {imagesTestResults.map((result, index) => (
                      <div key={index} className={`${result.type === 'error' ? 'text-red-600' : result.type === 'success' ? 'text-green-600' : 'text-gray-700'}`}>
                        [{result.timestamp}] {result.message}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-sm">テスト結果がここに表示されます</p>
                )}
              </div>
            </div>

            {/* 画像アップロードテスト */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-3">画像アップロードテスト</h3>
              <div className="space-y-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImagesTestFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                
                {imagesTestFile && (
                  <div className="text-sm text-gray-600">
                    選択ファイル: {imagesTestFile.name} ({(imagesTestFile.size / 1024 / 1024).toFixed(2)}MB)
                  </div>
                )}
                
                <div className="flex gap-2">
                  <button
                    onClick={testImagesUpload}
                    disabled={!imagesTestFile || imagesTesting || !user}
                    className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
                  >
                    {imagesTesting ? 'アップロード中...' : '画像アップロードテスト'}
                  </button>
                </div>
              </div>
            </div>

            {/* アップロード済み画像管理 */}
            {uploadedImages.length > 0 && (
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-3">アップロード済み画像</h3>
                <div className="space-y-2">
                  {uploadedImages.map((image) => (
                    <div key={image.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">{image.name}</span>
                        <img 
                          src={image.url} 
                          alt={image.name}
                          className="w-16 h-16 object-cover rounded border"
                          onError={(e) => {
                            console.error('Image load error:', e);
                            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyMEgxNlYxNkg0NEwzNiAyNCIgc3Ryb2tlPSIjNkI3MjgwIiBzdHJva2Utd2lkdGg9IjIiLz4KPHN2Zz4K';
                          }}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => testImagesVariants(image.id)}
                          disabled={imagesTesting}
                          className="cursor-pointer px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors duration-200 disabled:opacity-50"
                        >
                          バリエーション
                        </button>
                        <button
                          onClick={() => testImagesDelete(image.id, image.name)}
                          disabled={imagesTesting}
                          className="cursor-pointer px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-200 disabled:opacity-50"
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">WorksCard表示テスト</h2>
          <div className="space-y-4">
            {/* WorksCardテスト制御 */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-3">WorksCardテスト制御</h3>
              <div className="flex gap-2 mb-3">
                <button
                  onClick={createTestWorks}
                  disabled={!user}
                  className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
                >
                  テストWorkデータ作成
                </button>
                <button
                  onClick={() => setWorksCardDebugLogs([])}
                  className="cursor-pointer px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors duration-200"
                >
                  ログクリア
                </button>
                <button
                  onClick={() => setTestWorks([])}
                  className="cursor-pointer px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-200"
                >
                  テストデータクリア
                </button>
              </div>
              
              {/* デバッグログ表示 */}
              <div className="bg-gray-100 p-3 rounded max-h-40 overflow-auto">
                {worksCardDebugLogs.length > 0 ? (
                  <div className="space-y-1 text-sm font-mono">
                    {worksCardDebugLogs.map((log, index) => (
                      <div key={index} className={`${log.type === 'error' ? 'text-red-600' : log.type === 'success' ? 'text-green-600' : 'text-gray-700'}`}>
                        [{log.timestamp}] {log.message}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-sm">WorksCardテストログがここに表示されます</p>
                )}
              </div>
            </div>

            {/* WorksCard表示エリア */}
            {testWorks.length > 0 && (
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-3">WorksCard表示テスト</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  {testWorks.map((work) => (
                    <div key={work.id} className="relative">
                      <WorksCard
                        work={work}
                        onLike={handleWorksCardLike}
                        onUserClick={handleWorksCardUserClick}
                        onWorkClick={handleWorksCardWorkClick}
                        isLiked={false}
                        likeCount={work.likeCount}
                        isLikeLoading={false}
                      />
                      {/* 画像テストボタン */}
                      <button
                        onClick={() => testWorksCardImageLoad(work)}
                        className="absolute top-2 right-2 cursor-pointer px-2 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors duration-200"
                      >
                        画像テスト
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800">
                    <strong>注意:</strong> 画像が表示されない場合は、環境変数「CLOUDFLARE_ACCOUNT_HASH」が正しく設定されているか確認してください。
                    上記の「バリエーション」テストでURLに「undefined」が含まれている場合は環境変数が未設定です。
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">WorksSection「みんなの新着」テスト</h2>
          <div className="space-y-4">
            {/* WorksSectionテスト制御 */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-3">WorksSection制御</h3>
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setWorksSectionDebugLogs([])}
                  className="cursor-pointer px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors duration-200"
                >
                  ログクリア
                </button>
                <button
                  onClick={() => addWorksSectionLog('WorksSection「みんなの新着」の表示を開始...')}
                  className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200"
                >
                  手動ログテスト
                </button>
              </div>
              
              {/* デバッグログ表示 */}
              <div className="bg-gray-100 p-3 rounded max-h-40 overflow-auto">
                {worksSectionDebugLogs.length > 0 ? (
                  <div className="space-y-1 text-sm font-mono">
                    {worksSectionDebugLogs.map((log, index) => (
                      <div key={index} className={`${log.type === 'error' ? 'text-red-600' : log.type === 'success' ? 'text-green-600' : 'text-gray-700'}`}>
                        [{log.timestamp}] {log.message}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-sm">WorksSectionテストログがここに表示されます</p>
                )}
              </div>
            </div>

            {/* 実際のWorksSectionを表示 */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-3">実際の「みんなの新着」セクション</h3>
              <div className="bg-gray-50 p-4 rounded">
                <WorksSection
                  title="みんなの新着（デバッグ）"
                  category="latest"
                  config={{ limit: 6 }}
                  onLike={handleWorksSectionLike}
                  onUserClick={handleWorksSectionUserClick}
                  onWorkClick={handleWorksSectionWorkClick}
                  likeStates={{}}
                />
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-blue-800">
                  <strong>説明:</strong> これはホーム画面で実際に表示される「みんなの新着」と同じWorksSectionコンポーネントです。
                  画像やデータの取得で問題がある場合、ここでエラーや空のリストが表示されます。
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Aivis Cloud API テスト</h2>
          <div className="space-y-4">
            {/* Aivis API接続テスト */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-3">Aivis Cloud API接続テスト</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    テスト音声テキスト
                  </label>
                  <textarea
                    value={aivisTestText}
                    onChange={(e) => setAivisTestText(e.target.value)}
                    placeholder="音声に変換するテキストを入力してください..."
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={testAivisConnection}
                    disabled={aivisTesting || !user}
                    className="cursor-pointer px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors duration-200 disabled:opacity-50"
                  >
                    {aivisTesting ? 'テスト実行中...' : 'Aivis API テスト実行'}
                  </button>
                  <button
                    onClick={testAivisEnvironment}
                    disabled={aivisTesting}
                    className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
                  >
                    環境設定確認
                  </button>
                  <button
                    onClick={() => setAivisApiLogs([])}
                    className="cursor-pointer px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors duration-200"
                  >
                    ログクリア
                  </button>
                </div>
                
                {/* Aivis APIテスト結果表示 */}
                <div className="bg-gray-100 p-3 rounded max-h-40 overflow-auto">
                  {aivisApiLogs.length > 0 ? (
                    <div className="space-y-1 text-sm font-mono">
                      {aivisApiLogs.map((log, index) => (
                        <div key={index} className={`${log.type === 'error' ? 'text-red-600' : log.type === 'success' ? 'text-green-600' : 'text-gray-700'}`}>
                          [{log.timestamp}] {log.message}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600 text-sm">Aivis APIテスト結果がここに表示されます</p>
                  )}
                </div>
                
                {/* 音声再生エリア */}
                {aivisTestResult?.success && aivisTestResult?.audioUrl && (
                  <div className="border rounded-lg p-4 bg-green-50">
                    <h4 className="font-medium text-green-800 mb-2">✅ 音声生成成功</h4>
                    <div className="space-y-2">
                      <p className="text-sm text-green-700">
                        AudioURL: <span className="font-mono">{aivisTestResult.audioUrl}</span>
                      </p>
                      <p className="text-sm text-green-700">
                        AudioID: <span className="font-mono">{aivisTestResult.audioId}</span>
                      </p>
                      <audio controls className="w-full mt-2">
                        <source src={aivisTestResult.audioUrl} type="audio/mpeg" />
                        お使いのブラウザは音声の再生に対応していません。
                      </audio>
                    </div>
                  </div>
                )}
                
                {/* エラー表示 */}
                {aivisTestResult && !aivisTestResult.success && (
                  <div className="border rounded-lg p-4 bg-red-50">
                    <h4 className="font-medium text-red-800 mb-2">❌ 音声生成失敗</h4>
                    <p className="text-sm text-red-700">
                      エラー: {aivisTestResult.error}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* 設定情報 */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-3">Aivis Cloud API設定情報</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">APIエンドポイント:</span>
                  <span className="text-gray-600">/api/aivis/generate</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">デフォルトモデル:</span>
                  <span className="text-gray-600">a59cb814-0083-4369-8542-f51a29e72af7</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">対応フォーマット:</span>
                  <span className="text-gray-600">mp3, wav, flac, aac, opus</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">認証状態:</span>
                  <span className={user ? 'text-green-600' : 'text-red-600'}>
                    {user ? 'Firebase Auth有効' : '未認証'}
                  </span>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800">
                  <strong>注意:</strong> Aivis Cloud APIキーが.env.localに正しく設定されていることを確認してください。
                  エラーが発生する場合は、環境変数AIVIS_API_KEYの値を確認してください。
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">AIチャット機能テスト</h2>
          <div className="space-y-4">
            {/* AI接続テスト */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-3">AI API接続テスト</h3>
              <div className="flex gap-2 mb-3">
                <button
                  onClick={testAiConnection}
                  disabled={aiTesting || !user}
                  className="cursor-pointer px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors duration-200 disabled:opacity-50"
                >
                  {aiTesting ? '接続テスト中...' : 'OpenRouter API接続テスト'}
                </button>
                <button
                  onClick={testAiChatEnvironment}
                  disabled={aiTesting || !user}
                  className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
                >
                  環境設定確認
                </button>
                <button
                  onClick={() => setAiChatDebugLogs([])}
                  className="cursor-pointer px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors duration-200"
                >
                  ログクリア
                </button>
              </div>
              
              {/* テスト結果表示 */}
              <div className="bg-gray-100 p-3 rounded max-h-40 overflow-auto">
                {aiChatDebugLogs.length > 0 ? (
                  <div className="space-y-1 text-sm font-mono">
                    {aiChatDebugLogs.map((log, index) => (
                      <div key={index} className={`${log.type === 'error' ? 'text-red-600' : log.type === 'success' ? 'text-green-600' : 'text-gray-700'}`}>
                        [{log.timestamp}] {log.message}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-sm">AIチャットテスト結果がここに表示されます</p>
                )}
              </div>
            </div>

            {/* メッセージテスト */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-3">AIメッセージテスト</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    テストメッセージ
                  </label>
                  <textarea
                    value={aiTestMessage}
                    onChange={(e) => setAiTestMessage(e.target.value)}
                    placeholder="AIに送信するテストメッセージを入力してください..."
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={testAiChatMessage}
                    disabled={!aiTestMessage.trim() || aiTesting || !user}
                    className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
                  >
                    {aiTesting ? 'メッセージテスト中...' : 'メッセージテスト実行'}
                  </button>
                  <button
                    onClick={() => {
                      setAiTestMessage('こんにちは！AIボイスドラマ制作のアイデアを教えてください。');
                    }}
                    className="cursor-pointer px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors duration-200"
                  >
                    サンプルメッセージ
                  </button>
                </div>
                
                {/* ストリーミングデータ表示 */}
                {aiStreamData.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      受信ストリームデータ（チャンク数: {aiStreamData.length}）
                    </label>
                    <div className="bg-gray-100 p-3 rounded max-h-32 overflow-auto">
                      <div className="text-sm font-mono space-y-1">
                        {aiStreamData.map((chunk, index) => (
                          <div key={index} className="text-gray-600">
                            [{index + 1}] {chunk}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* AI応答表示 */}
                {aiTestResponse && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      AI応答（{aiTestResponse.length}文字）
                    </label>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 max-h-40 overflow-auto">
                      <p className="text-sm whitespace-pre-wrap">{aiTestResponse}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* 設定情報表示 */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-3">AIチャット設定情報</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">API エンドポイント:</span>
                  <span className="text-gray-600">/api/chat</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">使用AI:</span>
                  <span className="text-gray-600">OpenRouter (openai/gpt-4o-mini)</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">ストリーミング:</span>
                  <span className="text-gray-600">有効</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">認証:</span>
                  <span className={user ? 'text-green-600' : 'text-red-600'}>
                    {user ? 'Firebase Auth有効' : '未認証'}
                  </span>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800">
                  <strong>注意:</strong> OpenRouterのAPIキーが.env.localに正しく設定されていることを確認してください。
                  エラーが発生する場合は、環境変数OPENROUTER_API_KEYとNEXT_PUBLIC_DEFAULT_AI_MODELの値を確認してください。
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">リアルタイム音声生成テスト</h2>
          <div className="space-y-6">
            {/* API接続テスト */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-3">Aivis Cloud API接続テスト</h3>
              <div className="flex gap-2 mb-3">
                <button
                  onClick={testRealtimeTtsApi}
                  disabled={!realtimeTtsText.trim()}
                  className="cursor-pointer px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors duration-200 disabled:opacity-50"
                >
                  APIテスト実行
                </button>
                <button
                  onClick={() => setTtsDebugLogs([])}
                  className="cursor-pointer px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors duration-200"
                >
                  ログクリア
                </button>
              </div>
              
              {/* テスト結果表示 */}
              <div className="bg-gray-100 p-3 rounded max-h-40 overflow-auto">
                {ttsDebugLogs.length > 0 ? (
                  <div className="space-y-1 text-sm font-mono">
                    {ttsDebugLogs.map((log, index) => (
                      <div key={index} className={`${log.type === 'error' ? 'text-red-600' : log.type === 'success' ? 'text-green-600' : 'text-gray-700'}`}>
                        [{log.timestamp}] {log.message}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-sm">TTS APIテスト結果がここに表示されます</p>
                )}
              </div>
            </div>

            {/* リアルタイム音声プレイヤー */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-3">リアルタイム音声再生</h3>
              
              {/* テキスト入力エリア */}
              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    音声生成テキスト
                  </label>
                  <textarea
                    value={realtimeTtsText}
                    onChange={(e) => setRealtimeTtsText(e.target.value)}
                    placeholder="音声生成するテキストを入力してください..."
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 mt-1">{realtimeTtsText.length} 文字</p>
                </div>

                {/* サンプルテキストボタン */}
                <div className="flex gap-2">
                  <button
                    onClick={() => loadSampleTtsText('short')}
                    className="cursor-pointer px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors duration-200"
                  >
                    短文サンプル
                  </button>
                  <button
                    onClick={() => loadSampleTtsText('long')}
                    className="cursor-pointer px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors duration-200"
                  >
                    長文サンプル
                  </button>
                  <button
                    onClick={() => loadSampleTtsText('ssml')}
                    className="cursor-pointer px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors duration-200"
                  >
                    SSMLサンプル
                  </button>
                </div>
              </div>

              {/* 音声パラメータ設定 */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    話速 ({ttsSettings.speaking_rate}x)
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={ttsSettings.speaking_rate}
                    onChange={(e) => setTtsSettings(prev => ({ ...prev, speaking_rate: parseFloat(e.target.value) }))}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    音量 ({ttsSettings.volume})
                  </label>
                  <input
                    type="range"
                    min="0.0"
                    max="2.0"
                    step="0.1"
                    value={ttsSettings.volume}
                    onChange={(e) => setTtsSettings(prev => ({ ...prev, volume: parseFloat(e.target.value) }))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    感情強度 ({ttsSettings.emotional_intensity})
                  </label>
                  <input
                    type="range"
                    min="0.0"
                    max="2.0"
                    step="0.1"
                    value={ttsSettings.emotional_intensity}
                    onChange={(e) => setTtsSettings(prev => ({ ...prev, emotional_intensity: parseFloat(e.target.value) }))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ピッチ ({ttsSettings.pitch})
                  </label>
                  <input
                    type="range"
                    min="-1.0"
                    max="1.0"
                    step="0.1"
                    value={ttsSettings.pitch}
                    onChange={(e) => setTtsSettings(prev => ({ ...prev, pitch: parseFloat(e.target.value) }))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    テンポ動的変化 ({ttsSettings.tempo_dynamics})
                  </label>
                  <input
                    type="range"
                    min="0.0"
                    max="2.0"
                    step="0.1"
                    value={ttsSettings.tempo_dynamics}
                    onChange={(e) => setTtsSettings(prev => ({ ...prev, tempo_dynamics: parseFloat(e.target.value) }))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    音声形式
                  </label>
                  <select
                    value={ttsSettings.output_format}
                    onChange={(e) => setTtsSettings(prev => ({ ...prev, output_format: e.target.value as 'mp3' | 'wav' | 'aac' | 'opus' }))}
                    className="w-full p-1 border border-gray-300 rounded"
                  >
                    <option value="mp3">MP3</option>
                    <option value="wav">WAV</option>
                    <option value="aac">AAC</option>
                    <option value="opus">Opus</option>
                  </select>
                </div>
              </div>

              {/* リアルタイム音声プレイヤー */}
              {realtimeTtsText.trim() && (
                <div className="border-t pt-4">
                  <RealtimeAudioPlayer
                    text={realtimeTtsText}
                    {...ttsSettings}
                    onPlayStart={() => addTtsLog('🎵 リアルタイム再生開始', 'success')}
                    onPlayEnd={() => addTtsLog('⏹ 再生終了', 'info')}
                    onError={(error) => addTtsLog(`❌ 再生エラー: ${error}`, 'error')}
                    onSave={async (audioUrl: string, audioId: string, title: string, script: string) => {
                      try {
                        addTtsLog(`💾 音声保存開始: "${title}"`, 'info');
                        
                        if (!user || !userData) {
                          throw new Error('ユーザー情報が取得できません');
                        }

                        const result = await createWork(
                          {
                            title,
                            caption: '(リアルタイム音声生成による作品)',
                            script,
                            audioUrl,
                            audioId,
                            audioOriginalFilename: `${title}.mp3`,
                            publishStatus: 'private', // 非公開で保存
                            tags: ['ai生成', 'リアルタイム'],
                          },
                          user.uid,
                          userData.username,
                          userData.displayName,
                          userData.photoURL
                        );

                        if (result.success) {
                          addTtsLog(`✅ 音声保存完了: 作品ID ${result.workId}`, 'success');
                          toast.success('音声を「自分の作品」に保存しました！');
                        } else {
                          throw new Error(result.error || '保存に失敗しました');
                        }
                      } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : '保存エラー';
                        addTtsLog(`❌ 保存エラー: ${errorMessage}`, 'error');
                        toast.error(`保存に失敗しました: ${errorMessage}`);
                        throw error; // RealtimeAudioPlayerにエラーを伝播
                      }
                    }}
                    className="bg-blue-50"
                  />
                </div>
              )}
            </div>

            {/* 設定情報表示 */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-3">リアルタイムTTS設定情報</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">API エンドポイント:</span>
                  <span className="text-gray-600">/api/tts/realtime-synthesize</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">使用音声合成:</span>
                  <span className="text-gray-600">Aivis Cloud API</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">ストリーミング:</span>
                  <span className="text-gray-600">有効 (MediaSource API)</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">デフォルトモデル:</span>
                  <span className="text-gray-600">a59cb814-0083-4369-8542-f51a29e72af7</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">分割方式:</span>
                  <span className="text-gray-600">改行・200文字境界</span>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800">
                  <strong>注意:</strong> AIVIS_API_KEYが.env.localに正しく設定されていることを確認してください。
                  リアルタイム音声生成を使用するには、Aivis Cloud APIのAPIキーが必要です。
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">CSSレイアウト検証</h2>
          <div className="space-y-4">
            {/* CSS診断ツール */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-3">CSS診断ツール</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                <button
                  onClick={analyzeCSSVariables}
                  disabled={cssAnalyzing}
                  className="cursor-pointer px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
                >
                  {cssAnalyzing ? '解析中...' : 'CSS変数解析'}
                </button>
                <button
                  onClick={checkGlobalCSS}
                  disabled={cssAnalyzing}
                  className="cursor-pointer px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors duration-200 disabled:opacity-50"
                >
                  globals.css確認
                </button>
                <button
                  onClick={testTailwindClasses}
                  disabled={cssAnalyzing}
                  className="cursor-pointer px-3 py-2 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors duration-200 disabled:opacity-50"
                >
                  Tailwindテスト
                </button>
                <button
                  onClick={diagnoseLayoutIssues}
                  disabled={cssAnalyzing}
                  className="cursor-pointer px-3 py-2 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors duration-200 disabled:opacity-50"
                >
                  レイアウト診断
                </button>
              </div>
              
              <div className="flex gap-2 mb-3">
                <button
                  onClick={fixCSSIssues}
                  className="cursor-pointer px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-200"
                >
                  🚨 緊急修正CSS適用
                </button>
                <button
                  onClick={removeCSSFix}
                  className="cursor-pointer px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors duration-200"
                >
                  修正CSS削除
                </button>
                <button
                  onClick={() => setCssDebugLogs([])}
                  className="cursor-pointer px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors duration-200"
                >
                  ログクリア
                </button>
              </div>
              
              {/* CSS診断結果表示 */}
              <div className="bg-gray-100 p-3 rounded max-h-48 overflow-auto">
                {cssDebugLogs.length > 0 ? (
                  <div className="space-y-1 text-sm font-mono">
                    {cssDebugLogs.map((log, index) => (
                      <div key={index} className={`${
                        log.type === 'error' ? 'text-red-600' : 
                        log.type === 'success' ? 'text-green-600' : 
                        log.type === 'warning' ? 'text-yellow-600' : 
                        'text-gray-700'
                      }`}>
                        [{log.timestamp}] {log.message}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-sm">CSS診断結果がここに表示されます</p>
                )}
              </div>
            </div>

            {/* 現在のCSS状態表示 */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-3">現在のCSS状態</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm mb-2">body要素のスタイル</h4>
                  <div className="bg-gray-50 p-2 rounded text-xs">
                    <div>背景色: <span id="current-body-bg">確認中...</span></div>
                    <div>文字色: <span id="current-body-color">確認中...</span></div>
                    <div>フォント: <span id="current-body-font">確認中...</span></div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-2">CSS変数状態</h4>
                  <div className="bg-gray-50 p-2 rounded text-xs">
                    <div>--background: <span id="current-bg-var">確認中...</span></div>
                    <div>--foreground: <span id="current-fg-var">確認中...</span></div>
                    <div>--primary: <span id="current-primary-var">確認中...</span></div>
                  </div>
                </div>
              </div>
            </div>

            {/* CSSテストサンプル */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-3">CSSテストサンプル</h3>
              <div className="space-y-3">
                <div className="p-3 bg-white border rounded shadow">
                  <p className="text-gray-900">基本スタイル: bg-white, text-gray-900</p>
                </div>
                <div className="p-3 bg-blue-500 text-white rounded">
                  <p>Tailwindカラー: bg-blue-500, text-white</p>
                </div>
                <div className="flex items-center justify-center p-3 bg-gray-100 rounded">
                  <span className="text-sm">Flexbox: flex items-center justify-center</span>
                </div>
                <button className="px-4 py-2 bg-green-600 text-white rounded cursor-pointer hover:bg-green-700 transition-colors duration-200">
                  ボタンスタイルテスト
                </button>
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-blue-800">
                  <strong>使い方:</strong> 上記のサンプルが正しく表示されない場合は、CSS診断ツールを使用して問題を特定し、
                  緊急修正CSSで一時的に修正できます。
                </p>
              </div>
            </div>

            {/* 詳細な解析結果 */}
            {cssTestResults && (
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-3">詳細解析結果</h3>
                <div className="space-y-3">
                  {cssTestResults.missingVariables?.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded p-3">
                      <h4 className="font-medium text-red-800 mb-2">未定義CSS変数</h4>
                      <div className="text-sm text-red-700">
                        {cssTestResults.missingVariables.map((varName: string, index: number) => (
                          <div key={index}>--{varName}</div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="bg-gray-50 border rounded p-3 max-h-32 overflow-auto">
                    <h4 className="font-medium mb-2">CSS変数一覧</h4>
                    <pre className="text-xs">
                      {JSON.stringify(cssTestResults.cssVariables, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">環境情報</h2>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">現在のURL:</span>
              <span className="ml-2 text-gray-600">{typeof window !== 'undefined' ? window.location.href : 'N/A'}</span>
            </div>
            <div>
              <span className="font-medium">User Agent:</span>
              <span className="ml-2 text-gray-600 break-all">{typeof window !== 'undefined' ? navigator.userAgent : 'N/A'}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}