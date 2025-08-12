'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { TagInput } from '@/components/ui/TagInput';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import { CharacterImageUpload } from '@/components/features/CharacterImageUpload';
import { useAuth } from '@/lib/hooks/useAuth';
import { createCharacter, updateCharacter, getCharacter, deleteCharacter } from '@/lib/firebase/characters';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Users } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: '確認済み', label: '確認済み' },
  { value: '未確認', label: '未確認' },
  { value: '保留', label: '保留' },
];

export default function CharacterComposePage() {
  const [characterName, setCharacterName] = useState('');
  const [series, setSeries] = useState('');
  const [seriesJa, setSeriesJa] = useState('');
  const [status, setStatus] = useState('未確認');
  const [tags, setTags] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState('');
  const [imageId, setImageId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const characterId = searchParams.get('id');
  const isEditMode = !!characterId;

  // フォームをリセットする関数
  const resetForm = () => {
    setCharacterName('');
    setSeries('');
    setSeriesJa('');
    setStatus('未確認');
    setTags([]);
    setImageUrl('');
    setImageId('');
  };

  // 新規投稿モードに変わったときのフォームリセット
  useEffect(() => {
    if (!isEditMode) {
      resetForm();
    }
  }, [isEditMode]);

  // 編集モードの場合、キャラクターデータを取得
  useEffect(() => {
    const loadCharacter = async () => {
      if (!isEditMode || !characterId) return;
      
      setIsLoading(true);
      try {
        const result = await getCharacter(characterId, user?.uid);
        if (result.success && result.character) {
          // 権限チェック
          if (user && result.character.userId !== user.uid) {
            toast.error('このキャラクターを編集する権限がありません');
            router.push('/characters');
            return;
          }
          
          setCharacterName(result.character.character_name || '');
          setSeries(result.character.series || '');
          setSeriesJa(result.character.series_ja || '');
          setStatus(result.character.status || '未確認');
          setTags(result.character.tags || []);
          setImageUrl(result.character.imageUrl || '');
          setImageId(result.character.imageId || '');
        } else {
          toast.error(result.error || 'キャラクターが見つかりません');
          router.push('/characters');
        }
      } catch (error) {
        console.error('キャラクター取得エラー:', error);
        toast.error('キャラクターの取得に失敗しました');
        router.push('/characters');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadCharacter();
    }
  }, [isEditMode, characterId, user, router]);

  const handleSubmit = async () => {
    if (!user) {
      toast.error('認証が必要です');
      return;
    }

    setIsSubmitting(true);

    try {
      // 必須項目チェック
      if (!characterName.trim()) {
        toast.error('キャラクター名を入力してください');
        return;
      }

      const characterData = {
        character_name: characterName.trim(),
        series: series.trim() || undefined,
        series_ja: seriesJa.trim() || undefined,
        status: status,
        tags: tags.length > 0 ? tags : undefined,
        imageUrl: imageUrl || undefined,
        imageId: imageId || undefined,
      };

      // Firestore処理（作成または更新）
      let result;
      if (isEditMode && characterId) {
        result = await updateCharacter(characterId, characterData, user.uid);
        if (result.success) {
          toast.success('キャラクターが更新されました！');
          router.push('/characters');
        } else {
          toast.error(result.error || 'キャラクターの更新に失敗しました');
        }
      } else {
        result = await createCharacter(characterData, user.uid);
        if (result.success) {
          toast.success('キャラクターが作成されました！');
          // フォームリセット
          resetForm();
          router.push('/characters');
        } else {
          toast.error(result.error || 'キャラクターの作成に失敗しました');
        }
      }
    } catch (error) {
      console.error('投稿エラー:', error);
      toast.error(isEditMode ? 'キャラクターの更新中にエラーが発生しました' : 'キャラクターの作成中にエラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/characters');
  };

  const handleDelete = async () => {
    if (!user || !characterId) return;

    setIsDeleting(true);
    try {
      const result = await deleteCharacter(characterId, user.uid);
      if (result.success) {
        toast.success('キャラクターが削除されました');
        router.push('/characters');
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
        {/* ヘッダー */}
        <div className="flex items-center space-x-3 mb-6">
          <Users className="w-6 h-6 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditMode ? 'キャラクターを編集' : '新しいキャラクター'}
          </h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左側: 画像アップロード */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              キャラクター画像
            </label>
            <CharacterImageUpload
              onImageUpload={(url, id) => {
                setImageUrl(url);
                setImageId(id);
              }}
              onImageDelete={handleImageDelete}
              currentImageUrl={imageUrl}
              disabled={isSubmitting}
              characterId={characterId || undefined}
            />
          </div>

          {/* 右側: フォーム入力 */}
          <div className="space-y-6">
            {/* キャラクター名入力 */}
          <div>
            <label htmlFor="characterName" className="block text-sm font-medium text-gray-700 mb-2">
              キャラクター名 <span className="text-red-500">*</span>
            </label>
            <Input
              id="characterName"
              type="text"
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
              placeholder="キャラクター名を入力してください"
              maxLength={100}
              className="w-full"
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 mt-1">
              {characterName.length}/100文字
            </p>
          </div>

          {/* シリーズ名入力 */}
          <div>
            <label htmlFor="series" className="block text-sm font-medium text-gray-700 mb-2">
              シリーズ名（英語）
            </label>
            <Input
              id="series"
              type="text"
              value={series}
              onChange={(e) => setSeries(e.target.value)}
              placeholder="例：Attack on Titan"
              maxLength={200}
              className="w-full"
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 mt-1">
              {series.length}/200文字
            </p>
          </div>

          {/* 日本語シリーズ名入力 */}
          <div>
            <label htmlFor="seriesJa" className="block text-sm font-medium text-gray-700 mb-2">
              シリーズ名（日本語）
            </label>
            <Input
              id="seriesJa"
              type="text"
              value={seriesJa}
              onChange={(e) => setSeriesJa(e.target.value)}
              placeholder="例：進撃の巨人"
              maxLength={200}
              className="w-full"
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 mt-1">
              {seriesJa.length}/200文字
            </p>
          </div>

          {/* ステータス選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ステータス
            </label>
            <div className="flex gap-4">
              {STATUS_OPTIONS.map((option) => (
                <label key={option.value} className="flex items-center cursor-pointer hover:bg-gray-50 transition-colors duration-200 p-2 rounded">
                  <input
                    type="radio"
                    name="status"
                    value={option.value}
                    checked={status === option.value}
                    onChange={(e) => setStatus(e.target.value)}
                    disabled={isSubmitting}
                    className="mr-2 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* タグ入力 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              タグ
            </label>
            <TagInput
              tags={tags}
              onTagsChange={setTags}
              placeholder="タグを入力してEnterで追加（例：主人公、ヒロイン、敵役）"
              maxTags={10}
              maxTagLength={20}
            />
            <div className="space-y-1 mt-1">
              <p className="text-xs text-gray-500">
                キャラクターの役割や特徴をタグで追加してください
              </p>
            </div>
          </div>
          </div>
        </div>

        {/* ボタン */}
        <div className="pt-6">
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
              disabled={!characterName.trim() || isSubmitting}
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
        title="キャラクターを削除"
        message="このキャラクターを削除しますか？この操作は取り消せません。"
        isDeleting={isDeleting}
      />
    </div>
  );
}