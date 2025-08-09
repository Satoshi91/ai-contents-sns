'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import { AudioFileUpload } from '@/components/features/AudioFileUpload';
import { useAuth } from '@/lib/hooks/useAuth';
import { createWork, updateWork, getWork, deleteWork } from '@/lib/firebase/works';
import { createWorkSchema } from '@/lib/validations/work';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

export default function ComposePage() {
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [audioId, setAudioId] = useState('');
  const [audioOriginalFilename, setAudioOriginalFilename] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user, userData } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const workId = searchParams.get('id');
  const isEditMode = !!workId;

  // 編集モードの場合、作品データを取得
  useEffect(() => {
    const loadWork = async () => {
      if (!isEditMode || !workId) return;
      
      setIsLoading(true);
      try {
        const work = await getWork(workId);
        if (work) {
          // 権限チェック
          if (user && work.uid !== user.uid) {
            toast.error('この作品を編集する権限がありません');
            router.push('/home');
            return;
          }
          
          setTitle(work.title);
          setCaption(work.caption);
          setAudioUrl(work.audioUrl || '');
          setAudioId(work.audioId || '');
          setAudioOriginalFilename(work.audioOriginalFilename || '');
        } else {
          toast.error('作品が見つかりません');
          router.push('/home');
        }
      } catch (error) {
        console.error('作品取得エラー:', error);
        toast.error('作品の取得に失敗しました');
        router.push('/home');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadWork();
    }
  }, [isEditMode, workId, user, router]);

  const handleSubmit = async () => {
    if (!user || !userData) {
      toast.error('認証が必要です');
      return;
    }

    setIsSubmitting(true);

    try {
      // バリデーション
      const validationResult = createWorkSchema.safeParse({ 
        title, 
        caption, 
        audioUrl: audioUrl || undefined,
        audioId: audioId || undefined,
        audioOriginalFilename: audioOriginalFilename || undefined 
      });
      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        toast.error(firstError.message);
        return;
      }

      // Firestore処理（作成または更新）
      let result;
      if (isEditMode && workId) {
        result = await updateWork(workId, { 
          title, 
          caption, 
          audioUrl: audioUrl || undefined, 
          audioId: audioId || undefined 
        }, user.uid);
        if (result.success) {
          toast.success('作品が更新されました！');
          router.push('/works');
        } else {
          toast.error(result.error || '作品の更新に失敗しました');
        }
      } else {
        result = await createWork(
          { 
            title, 
            caption, 
            audioUrl: audioUrl || undefined, 
            audioId: audioId || undefined 
          },
          user.uid,
          userData.username,
          userData.displayName,
          userData.photoURL
        );
        if (result.success) {
          toast.success('作品が作成されました！');
          // フォームリセット
          setTitle('');
          setCaption('');
          setAudioUrl('');
          setAudioId('');
          setAudioOriginalFilename('');
          router.push('/home');
        } else {
          toast.error(result.error || '作品の作成に失敗しました');
        }
      }
    } catch (error) {
      console.error('投稿エラー:', error);
      toast.error(isEditMode ? '作品の更新中にエラーが発生しました' : '作品の作成中にエラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isEditMode) {
      router.push('/works');
    } else {
      router.push('/home');
    }
  };

  const handleDelete = async () => {
    if (!user || !workId) return;

    setIsDeleting(true);
    try {
      const result = await deleteWork(workId, user.uid);
      if (result.success) {
        toast.success('作品が削除されました');
        router.push('/works');
      } else {
        toast.error(result.error || '削除に失敗しました');
      }
    } catch (error) {
      console.error('削除エラー:', error);
      toast.error('削除中にエラーが発生しました');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleAudioDelete = () => {
    setAudioUrl('');
    setAudioId('');
    setAudioOriginalFilename('');
    toast.success('音声ファイルを削除しました');
  };

  // ローディング中の表示
  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/6"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-1/6"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          {isEditMode ? '作品を編集' : '新しい作品'}
        </h2>
            
            <div className="space-y-6">
              {/* タイトル入力 */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  タイトル
                </label>
                <Input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="作品のタイトルを入力してください"
                  maxLength={100}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {title.length}/100文字
                </p>
              </div>

              {/* キャプション入力 */}
              <div>
                <label htmlFor="caption" className="block text-sm font-medium text-gray-700 mb-2">
                  キャプション
                </label>
                <TextArea
                  id="caption"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="作品の内容を入力してください..."
                  rows={6}
                  maxLength={500}
                  className="w-full resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {caption.length}/500文字
                </p>
              </div>

              {/* 音声ファイルアップロード */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  音声ファイル
                </label>
                <AudioFileUpload
                  onAudioUpload={(url, id, originalFilename) => {
                    setAudioUrl(url);
                    setAudioId(id);
                    setAudioOriginalFilename(originalFilename || '');
                  }}
                  onAudioDelete={handleAudioDelete}
                  currentAudioUrl={audioUrl}
                  currentAudioOriginalFilename={audioOriginalFilename}
                  disabled={isSubmitting}
                  workId={workId || undefined}
                />
              </div>

              {/* ボタン */}
              <div className="pt-4 border-t">
                <div className="flex justify-end gap-3">
                  {isEditMode && (
                    <Button
                      onClick={handleCancel}
                      disabled={isSubmitting}
                      variant="outline"
                      size="lg"
                      className="min-w-[120px]"
                    >
                      キャンセル
                    </Button>
                  )}
                  <Button
                    onClick={handleSubmit}
                    disabled={!title.trim() || !caption.trim() || isSubmitting}
                    size="lg"
                    className="min-w-[120px]"
                  >
                    {isSubmitting 
                      ? (isEditMode ? '更新中...' : '投稿中...') 
                      : (isEditMode ? '更新' : '投稿')
                    }
                  </Button>
                </div>
                
                {/* 削除ボタン（編集モード時のみ） */}
                {isEditMode && (
                  <div className="mt-3 flex justify-end">
                    <Button
                      onClick={() => setShowDeleteModal(true)}
                      disabled={isSubmitting || isDeleting}
                      size="lg"
                      className="min-w-[120px] bg-red-200 text-red-800 hover:bg-red-300 focus:ring-red-400 cursor-pointer transition-colors duration-200"
                    >
                      削除
                    </Button>
                  </div>
                )}
              </div>
        </div>
      </div>
      
      {/* 削除確認モーダル */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="作品を削除"
        message="この作品を削除しますか？この操作は取り消せません。"
        isDeleting={isDeleting}
      />
    </div>
  );
}