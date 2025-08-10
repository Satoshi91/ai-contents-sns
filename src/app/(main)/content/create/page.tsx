'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { ContentTypeSelector } from '@/components/ui/ContentTypeSelector';
import { VoiceContentForm } from '@/components/features/VoiceContentForm';
import { ScriptContentForm } from '@/components/features/ScriptContentForm';
import { ImageContentForm } from '@/components/features/ImageContentForm';
import { WorkContentForm } from '@/components/features/WorkContentForm';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import { useAuth } from '@/lib/hooks/useAuth';
import { createContent, updateContent, getContent, deleteContent } from '@/lib/firebase/contents';
import { validateContentByType, validateUpdateContentByType } from '@/lib/validations/content';
import { ContentType } from '@/types/content';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

export default function CreateContentPage() {
  // Content type and form states
  const [contentType, setContentType] = useState<ContentType>('voice');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [ageRating, setAgeRating] = useState<'all' | '18+'>('all');

  // Type-specific states
  const [audioUrl, setAudioUrl] = useState('');
  const [audioId, setAudioId] = useState('');
  const [audioOriginalFilename, setAudioOriginalFilename] = useState('');
  const [scriptText, setScriptText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageId, setImageId] = useState('');
  const [relatedContentIds, setRelatedContentIds] = useState<string[]>([]);

  // UI states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { user, userData } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const contentId = searchParams.get('id');
  const isEditMode = !!contentId;

  // フォームをリセットする関数
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setTags([]);
    setAgeRating('all');
    setAudioUrl('');
    setAudioId('');
    setAudioOriginalFilename('');
    setScriptText('');
    setImageUrl('');
    setImageId('');
    setRelatedContentIds([]);
  };

  // 新規投稿モードに変わったときのフォームリセット
  useEffect(() => {
    if (!isEditMode) {
      resetForm();
    }
  }, [isEditMode]);

  // 編集モードの場合、コンテンツデータを取得
  useEffect(() => {
    const loadContent = async () => {
      if (!isEditMode || !contentId) return;
      
      setIsLoading(true);
      try {
        const content = await getContent(contentId);
        if (content) {
          // 権限チェック
          if (user && content.uid !== user.uid) {
            toast.error('このコンテンツを編集する権限がありません');
            router.push('/home');
            return;
          }
          
          setContentType(content.type);
          setTitle(content.title);
          setDescription(content.description || '');
          setTags(content.tagNames || []);
          setAgeRating(content.contentRating === '18+' ? '18+' : 'all');
          
          // Type-specific data
          setAudioUrl(content.audioUrl || '');
          setAudioId(content.audioId || '');
          setAudioOriginalFilename(content.audioOriginalFilename || '');
          setScriptText(content.scriptText || '');
          setImageUrl(content.imageUrl || '');
          setImageId(content.imageId || '');
          setRelatedContentIds(content.relatedContentIds || []);
        } else {
          toast.error('コンテンツが見つかりません');
          router.push('/home');
        }
      } catch (error) {
        console.error('コンテンツ取得エラー:', error);
        toast.error('コンテンツの取得に失敗しました');
        router.push('/home');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadContent();
    }
  }, [isEditMode, contentId, user, router]);

  const handleSubmit = async () => {
    if (!user || !userData) {
      toast.error('認証が必要です');
      return;
    }

    setIsSubmitting(true);

    try {
      // 基本バリデーション
      if (!title.trim()) {
        toast.error('タイトルを入力してください');
        return;
      }

      // 型別のバリデーションデータ準備
      const validationData: any = {
        title,
        description,
        tags: tags.length > 0 ? tags : undefined,
        ageRating
      };

      // Type-specific validation data
      switch (contentType) {
        case 'voice':
          validationData.audioUrl = audioUrl;
          validationData.audioId = audioId;
          validationData.audioOriginalFilename = audioOriginalFilename;
          break;
        case 'script':
          validationData.scriptText = scriptText;
          break;
        case 'image':
          validationData.imageUrl = imageUrl;
          validationData.imageId = imageId;
          break;
        case 'work':
          validationData.relatedContentIds = relatedContentIds;
          break;
      }

      // バリデーション
      const validationResult = isEditMode
        ? validateUpdateContentByType(contentType, validationData)
        : validateContentByType(contentType, validationData);
      
      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        toast.error(firstError.message);
        return;
      }

      // Firebase処理（作成または更新）
      let result;
      if (isEditMode && contentId) {
        result = await updateContent(contentId, {
          type: contentType,
          title,
          description,
          tags: tags.length > 0 ? tags : undefined,
          audioUrl: audioUrl || undefined,
          audioId: audioId || undefined,
          audioOriginalFilename: audioOriginalFilename || undefined,
          scriptText: scriptText || undefined,
          imageUrl: imageUrl || undefined,
          imageId: imageId || undefined,
          relatedContentIds: relatedContentIds.length > 0 ? relatedContentIds : undefined,
          ageRating
        }, user.uid);
        
        if (result.success) {
          toast.success('コンテンツが更新されました！');
          router.push('/home');
        } else {
          toast.error(result.error || 'コンテンツの更新に失敗しました');
        }
      } else {
        result = await createContent(
          {
            type: contentType,
            title,
            description,
            tags: tags.length > 0 ? tags : undefined,
            audioUrl: audioUrl || undefined,
            audioId: audioId || undefined,
            audioOriginalFilename: audioOriginalFilename || undefined,
            scriptText: scriptText || undefined,
            imageUrl: imageUrl || undefined,
            imageId: imageId || undefined,
            relatedContentIds: relatedContentIds.length > 0 ? relatedContentIds : undefined,
            ageRating
          },
          user.uid,
          userData.username,
          userData.displayName,
          userData.photoURL
        );
        
        if (result.success) {
          toast.success('コンテンツが作成されました！');
          resetForm();
          router.push('/home');
        } else {
          toast.error(result.error || 'コンテンツの作成に失敗しました');
        }
      }
    } catch (error) {
      console.error('投稿エラー:', error);
      toast.error(isEditMode ? 'コンテンツの更新中にエラーが発生しました' : 'コンテンツの作成中にエラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/home');
  };

  const handleDelete = async () => {
    if (!user || !contentId) return;

    setIsDeleting(true);
    try {
      const result = await deleteContent(contentId, user.uid);
      if (result.success) {
        toast.success('コンテンツが削除されました');
        router.push('/home');
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

  // バリデーション用のヘルパー関数
  const isFormValid = () => {
    if (!title.trim()) return false;
    
    switch (contentType) {
      case 'voice':
        return !!(audioUrl && audioId);
      case 'script':
        return !!(scriptText && scriptText.trim());
      case 'image':
        return !!(imageUrl && imageId);
      case 'work':
        return relatedContentIds.length > 0;
      default:
        return false;
    }
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
          {isEditMode ? 'コンテンツを編集' : '新しいコンテンツ'}
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

        {/* タイプ別フォーム */}
        <div className="mb-6">
          {contentType === 'voice' && (
            <VoiceContentForm
              title={title}
              description={description}
              tags={tags}
              audioUrl={audioUrl}
              audioId={audioId}
              audioOriginalFilename={audioOriginalFilename}
              ageRating={ageRating}
              onTitleChange={setTitle}
              onDescriptionChange={setDescription}
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
              workId={contentId || undefined}
            />
          )}
          
          {contentType === 'script' && (
            <ScriptContentForm
              title={title}
              description={description}
              scriptText={scriptText}
              tags={tags}
              ageRating={ageRating}
              onTitleChange={setTitle}
              onDescriptionChange={setDescription}
              onScriptTextChange={setScriptText}
              onTagsChange={setTags}
              onAgeRatingChange={setAgeRating}
              disabled={isSubmitting}
            />
          )}
          
          {contentType === 'image' && (
            <ImageContentForm
              title={title}
              description={description}
              tags={tags}
              imageUrl={imageUrl}
              imageId={imageId}
              ageRating={ageRating}
              onTitleChange={setTitle}
              onDescriptionChange={setDescription}
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
              workId={contentId || undefined}
            />
          )}
          
          {contentType === 'work' && (
            <WorkContentForm
              title={title}
              description={description}
              tags={tags}
              relatedContentIds={relatedContentIds}
              ageRating={ageRating}
              onTitleChange={setTitle}
              onDescriptionChange={setDescription}
              onTagsChange={setTags}
              onRelatedContentIdsChange={setRelatedContentIds}
              onAgeRatingChange={setAgeRating}
              disabled={isSubmitting}
              userId={user?.uid}
            />
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
              disabled={!isFormValid() || isSubmitting}
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
        title="コンテンツを削除"
        message="このコンテンツを削除しますか？この操作は取り消せません。"
        isDeleting={isDeleting}
      />
    </div>
  );
}