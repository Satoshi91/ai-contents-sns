'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/app';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/app';
import { validateAudioFile } from '@/lib/cloudflare/r2';
import toast from 'react-hot-toast';

export default function DebugPage() {
  const { user, userData, loading, error, isAnonymous, refreshUserData } = useAuth();
  const [authHistory, setAuthHistory] = useState<string[]>([]);
  const [firestoreTest, setFirestoreTest] = useState<any>(null);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);
  const [rawAuthUser, setRawAuthUser] = useState<any>(null);
  const [creatingUser, setCreatingUser] = useState(false);
  const [createUserError, setCreateUserError] = useState<string | null>(null);
  const [createUserSuccess, setCreateUserSuccess] = useState(false);

  // R2テスト関連のstate
  const [r2TestResults, setR2TestResults] = useState<any[]>([]);
  const [r2TestFile, setR2TestFile] = useState<File | null>(null);
  const [r2Testing, setR2Testing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{id: string, url: string, name: string}>>([]);

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
              {firestoreTest.data && (
                <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
                  {JSON.stringify(firestoreTest.data, null, 2)}
                </pre>
              )}
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