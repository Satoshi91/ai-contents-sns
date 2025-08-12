'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/hooks/useAuth';
import { getCharacter } from '@/lib/firebase/characters';
import { getWorkImageURL } from '@/lib/cloudflare/images';
import { Character } from '@/types/character';
import { Users, Edit, Calendar, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CharacterDetailPage() {
  const [character, setCharacter] = useState<Character | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const characterId = params.id as string;

  useEffect(() => {
    const loadCharacter = async () => {
      if (!characterId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const result = await getCharacter(characterId);
        if (result.success && result.character) {
          setCharacter(result.character);
        } else {
          setError('キャラクターが見つかりません');
        }
      } catch (error) {
        console.error('キャラクター取得エラー:', error);
        setError('キャラクターの取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    loadCharacter();
  }, [characterId]);

  const handleEdit = () => {
    router.push(`/characters/compose?id=${characterId}`);
  };

  const handleBack = () => {
    router.push('/characters');
  };

  // 大きな画像URLを生成する関数
  const getLargeImageUrl = (character: Character) => {
    if (!character.imageUrl || !character.imageId) return null;
    return getWorkImageURL(character.imageId, 'large');
  };

  // ローディング中の表示
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="animate-pulse">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="aspect-square bg-gray-200 rounded-lg"></div>
                <div className="space-y-4">
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // エラー表示
  if (error || !character) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {error || 'キャラクターが見つかりません'}
              </h3>
              <Button
                onClick={handleBack}
                variant="outline"
                className="mt-4"
              >
                一覧に戻る
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handleBack}
            className="text-gray-600 hover:text-gray-900 transition-colors duration-200 cursor-pointer"
          >
            ← 一覧に戻る
          </button>
          
          {/* 編集ボタン（投稿者のみ） */}
          {user && character.userId === user.uid && (
            <Button
              onClick={handleEdit}
              className="flex items-center space-x-2 cursor-pointer"
            >
              <Edit size={16} />
              <span>編集</span>
            </Button>
          )}
        </div>

        {/* メインコンテンツ */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* 左側: 画像 */}
            <div className="bg-gray-100 flex items-center justify-center p-8">
              {getLargeImageUrl(character) ? (
                <img
                  src={getLargeImageUrl(character)!}
                  alt={character.character_name || 'キャラクター画像'}
                  className="max-w-full object-contain rounded-lg shadow-md"
                />
              ) : (
                <div className="text-center text-gray-400">
                  <Users size={64} className="mx-auto mb-4" />
                  <p>画像が登録されていません</p>
                </div>
              )}
            </div>

            {/* 右側: 情報 */}
            <div className="p-8">
              <div className="space-y-6">
                {/* キャラクター名 */}
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {character.character_name || '名前未設定'}
                  </h1>
                </div>

                {/* シリーズ情報 */}
                {(character.series || character.series_ja) && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">シリーズ</h3>
                    <div className="space-y-1">
                      {character.series_ja && (
                        <p className="text-lg text-gray-900">{character.series_ja}</p>
                      )}
                      {character.series && (
                        <p className="text-sm text-gray-600">{character.series}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* ステータス */}
                {character.status && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">ステータス</h3>
                    <span className={`
                      inline-block px-3 py-1 rounded-full text-sm font-medium
                      ${character.status === '確認済み' 
                        ? 'bg-green-100 text-green-800' 
                        : character.status === '未確認'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                      }
                    `}>
                      {character.status}
                    </span>
                  </div>
                )}

                {/* タグ */}
                {character.tags && character.tags.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">タグ</h3>
                    <div className="flex flex-wrap gap-2">
                      {character.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-block px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm border border-blue-200"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* メタ情報 */}
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">作成情報</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    {character.created_at && (
                      <div className="flex items-center space-x-2">
                        <Calendar size={16} />
                        <span>作成日: {character.created_at.toLocaleDateString('ja-JP')}</span>
                      </div>
                    )}
                    {character.updated_at && character.updated_at.getTime() !== character.created_at?.getTime() && (
                      <div className="flex items-center space-x-2">
                        <Clock size={16} />
                        <span>更新日: {character.updated_at.toLocaleDateString('ja-JP')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}