'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { TagInput } from '@/components/ui/TagInput';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import { AudioFileUpload } from '@/components/features/AudioFileUpload';
import { ImageFileUpload } from '@/components/features/ImageFileUpload';
import { ContentTypeSelector } from '@/components/ui/ContentTypeSelector';
import { VoiceContentForm } from '@/components/features/VoiceContentForm';
import { ScriptContentForm } from '@/components/features/ScriptContentForm';
import { ImageContentForm } from '@/components/features/ImageContentForm';
import { useAuth } from '@/lib/hooks/useAuth';
import { createWork, updateWork, getWork, deleteWork } from '@/lib/firebase/works';
import { createWorkSchema } from '@/lib/validations/work';
import { useRouter, useSearchParams } from 'next/navigation';
import { ContentType } from '@/types/content';
import toast from 'react-hot-toast';

export default function ComposePage() {
  // コンテンツタイプ選択
  const [contentType, setContentType] = useState<ContentType | 'mixed'>('mixed');
  
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [script, setScript] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState('');
  const [imageId, setImageId] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [audioId, setAudioId] = useState('');
  const [audioOriginalFilename, setAudioOriginalFilename] = useState('');
  const [ageRating, setAgeRating] = useState<'all' | '18+'>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user, userData } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const workId = searchParams.get('id');
  const isEditMode = !!workId;

  // フォームをリセットする関数
  const resetForm = () => {
    setTitle('');
    setCaption('');
    setScript('');
    setTags([]);
    setImageUrl('');
    setImageId('');
    setAudioUrl('');
    setAudioId('');
    setAudioOriginalFilename('');
    setAgeRating('all');
  };

  // 新規投稿モードに変わったときのフォームリセット
  useEffect(() => {
    if (!isEditMode) {
      resetForm();
    }
  }, [isEditMode]);

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
          setCaption(work.caption || '');
          setScript(work.script || '');
          setTags(work.tagNames || []);
          setImageUrl(work.imageUrl || '');
          setImageId(work.imageId || '');
          setAudioUrl(work.audioUrl || '');
          setAudioId(work.audioId || '');
          setAudioOriginalFilename(work.audioOriginalFilename || '');
          setAgeRating(work.contentRating === '18+' ? '18+' : 'all');
          
          // contentTypeの設定
          if (work.contentType && work.contentType !== 'legacy') {
            setContentType(work.contentType);
          } else {
            // 既存データからcontentTypeを推定
            const hasAudio = !!(work.audioUrl && work.audioId);
            const hasImage = !!(work.imageUrl && work.imageId);
            const hasScript = !!(work.script && work.script.trim());
            
            if (hasAudio && !hasImage && !hasScript) {
              setContentType('voice');
            } else if (!hasAudio && hasImage && !hasScript) {
              setContentType('image');
            } else if (!hasAudio && !hasImage && hasScript) {
              setContentType('script');
            } else {
              setContentType('mixed');
            }
          }
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
      // 必須項目チェック
      if (!title.trim()) {
        toast.error('タイトルを入力してください');
        return;
      }
      
      // コンテンツタイプに基づく必須項目チェック
      if (contentType === 'voice' && !audioUrl) {
        toast.error('音声ファイルをアップロードしてください');
        return;
      }
      
      if (contentType === 'image' && !imageUrl) {
        toast.error('画像をアップロードしてください');
        return;
      }
      
      if (contentType === 'script' && !script.trim()) {
        toast.error('スクリプトを入力してください');
        return;
      }
      
      if (contentType === 'mixed') {
        const hasAudio = !!(audioUrl && audioId);
        const hasImage = !!(imageUrl && imageId);
        const hasScript = !!(script && script.trim());
        
        if (!hasAudio && !hasImage && !hasScript) {
          toast.error('音声、画像、スクリプトのいずれかを設定してください');
          return;
        }
      }

      // バリデーション
      const validationResult = createWorkSchema.safeParse({ 
        title, 
        caption, 
        script,
        tags: tags.length > 0 ? tags : undefined,
        imageUrl: imageUrl || undefined,
        imageId: imageId || undefined,
        audioUrl: audioUrl || undefined,
        audioId: audioId || undefined,
        audioOriginalFilename: audioOriginalFilename || undefined,
        ageRating
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
          script,
          tags: tags.length > 0 ? tags : undefined,
          imageUrl: imageUrl || undefined, 
          imageId: imageId || undefined,
          audioUrl: audioUrl || undefined, 
          audioId: audioId || undefined,
          audioOriginalFilename: audioOriginalFilename || undefined,
          contentType: contentType === 'mixed' ? undefined : contentType, // mixedの場合は自動判定させる
          ageRating
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
            script,
            tags: tags.length > 0 ? tags : undefined,
            imageUrl: imageUrl || undefined, 
            imageId: imageId || undefined,
            audioUrl: audioUrl || undefined, 
            audioId: audioId || undefined,
            audioOriginalFilename: audioOriginalFilename || undefined,
            contentType: contentType === 'mixed' ? undefined : contentType, // mixedの場合は自動判定させる
            ageRating
          },
          user.uid,
          userData.username,
          userData.displayName,
          userData.photoURL
        );
        if (result.success) {
          toast.success('作品が作成されました！');
          // フォームリセット
          resetForm();
          router.push('/works');
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
    router.push('/works');
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

  const handleImageDelete = () => {
    setImageUrl('');
    setImageId('');
    toast.success('画像を削除しました');
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
      <div className="mx-8 py-8">
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
    <div className="mx-8 py-8">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          {isEditMode ? '作品を編集' : '新しい作品'}
        </h2>
        
        {/* コンテンツタイプセレクタ（新規作成時のみ） */}
        {!isEditMode && (
          <div className="mb-8">
            <ContentTypeSelector
              selectedType={contentType}
              onTypeChange={setContentType}
              disabled={isSubmitting}
            />
          </div>
        )}
            
        {/* メインコンテンツ - タイプ別表示 */}
        <div className="mb-6">
          {contentType === 'voice' && (
            <VoiceContentForm
              title={title}
              description={caption}
              tags={tags}
              audioUrl={audioUrl}
              audioId={audioId}
              audioOriginalFilename={audioOriginalFilename}
              ageRating={ageRating}
              onTitleChange={setTitle}
              onDescriptionChange={setCaption}
              onTagsChange={setTags}
              onAudioUpload={(url, id, filename) => {
                setAudioUrl(url);
                setAudioId(id);
                setAudioOriginalFilename(filename || '');
              }}
              onAudioDelete={() => {
                setAudioUrl('');
                setAudioId('');
                setAudioOriginalFilename('');
              }}
              onAgeRatingChange={setAgeRating}
              disabled={isSubmitting}
              workId={workId || undefined}
            />
          )}

          {contentType === 'script' && (
            <ScriptContentForm
              title={title}
              description={caption}
              scriptText={script}
              tags={tags}
              ageRating={ageRating}
              onTitleChange={setTitle}
              onDescriptionChange={setCaption}
              onScriptTextChange={setScript}
              onTagsChange={setTags}
              onAgeRatingChange={setAgeRating}
              disabled={isSubmitting}
            />
          )}

          {contentType === 'image' && (
            <ImageContentForm
              title={title}
              description={caption}
              tags={tags}
              imageUrl={imageUrl}
              imageId={imageId}
              ageRating={ageRating}
              onTitleChange={setTitle}
              onDescriptionChange={setCaption}
              onTagsChange={setTags}
              onImageUpload={(url, id) => {
                setImageUrl(url);
                setImageId(id);
              }}
              onImageDelete={() => {
                setImageUrl('');
                setImageId('');
              }}
              onAgeRatingChange={setAgeRating}
              disabled={isSubmitting}
              workId={workId || undefined}
            />
          )}

          {contentType === 'mixed' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* 領域1: サムネイル画像・音声ファイル */}
              <div className="space-y-6">
                {/* サムネイル画像アップロード */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    サムネイル画像
                  </label>
                  <ImageFileUpload
                    onImageUpload={(url, id) => {
                      setImageUrl(url);
                      setImageId(id);
                    }}
                    onImageDelete={handleImageDelete}
                    currentImageUrl={imageUrl}
                    disabled={isSubmitting}
                    workId={workId || undefined}
                  />
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
              </div>

              {/* 領域2: タイトル・キャプション・タグ・年齢制限 */}
              <div className="space-y-6">
                {/* タイトル入力 */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    タイトル <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="作品のタイトルを入力してください"
                    maxLength={100}
                    className="w-full"
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
                    className="w-full resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {caption.length}/500文字
                  </p>
                </div>

                {/* タグ入力 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    タグ
                  </label>
                  <TagInput
                    tags={tags}
                    onTagsChange={setTags}
                    placeholder="タグを入力してEnterで追加（例：恋愛、SF、コメディ）"
                    maxTags={10}
                    maxTagLength={20}
                    disabled={isSubmitting}
                  />
                  <div className="space-y-1 mt-1">
                    <p className="text-xs text-gray-500">
                      タグを追加すると作品の発見性が向上します
                    </p>
                  </div>
                </div>

                {/* 年齢制限 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    年齢制限
                  </label>
                  <div className="flex gap-6">
                    <label className="flex items-center cursor-pointer hover:bg-gray-50 transition-colors duration-200 p-2 rounded">
                      <input
                        type="radio"
                        name="ageRating"
                        value="all"
                        checked={ageRating === 'all'}
                        onChange={(e) => setAgeRating(e.target.value as 'all' | '18+')}
                        disabled={isSubmitting}
                        className="mr-2 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">全年齢</span>
                    </label>
                    <label className="flex items-center cursor-pointer hover:bg-gray-50 transition-colors duration-200 p-2 rounded">
                      <input
                        type="radio"
                        name="ageRating"
                        value="18+"
                        checked={ageRating === '18+'}
                        onChange={(e) => setAgeRating(e.target.value as 'all' | '18+')}
                        disabled={isSubmitting}
                        className="mr-2 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">R-18</span>
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    作品の年齢制限を設定してください
                  </p>
                </div>
              </div>

              {/* 領域3: 台本 */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="script" className="block text-sm font-medium text-gray-700">
                    台本
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setScript('')}
                    disabled={!script || isSubmitting}
                    className="text-xs px-2 py-1"
                  >
                    クリア
                  </Button>
                </div>
                <TextArea
                  id="script"
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  placeholder="作品の台本を入力してください..."
                  rows={18}
                  maxLength={50000}
                  disabled={isSubmitting}
                  className="w-full resize-y"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {script.length}/50000文字
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ボタン */}
        <div className="pt-4">
          <div className="flex justify-end gap-3">
            <Button
              onClick={handleCancel}
              disabled={isSubmitting}
              variant="outline"
              size="lg"
              className="min-w-[120px]"
            >
              キャンセル
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!title.trim() || isSubmitting || !(() => {
                switch (contentType) {
                  case 'voice':
                    return !!(audioUrl && audioId);
                  case 'script':
                    return !!(script && script.trim());
                  case 'image':
                    return !!(imageUrl && imageId);
                  case 'mixed':
                    const hasAudio = !!(audioUrl && audioId);
                    const hasImage = !!(imageUrl && imageId);
                    const hasScript = !!(script && script.trim());
                    return hasAudio || hasImage || hasScript;
                  default:
                    return false;
                }
              })()}
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