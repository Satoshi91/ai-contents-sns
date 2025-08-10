'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { ArrowLeft, Heart, MessageCircle, Share2, User, Play, Pause, Copy, ExternalLink, Edit } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Work } from '@/types/work';
import { getWork } from '@/lib/firebase/works';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useLikes } from '@/lib/hooks/useLikes';
import { getWorkImageURL, getImageURL } from '@/lib/cloudflare/images';
import CommentList from '@/components/ui/CommentList';
import Image from 'next/image';

export default function WorkDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workId = params.id as string;
  const [work, setWork] = useState<Work | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const shareMenuRef = useRef<HTMLDivElement>(null);
  
  const { user, isAnonymous } = useAuth();
  const { handleToggleLike, isWorkLiked, likeStates } = useLikes();

  useEffect(() => {
    const fetchWork = async () => {
      if (!workId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const workData = await getWork(workId);
        
        if (!workData) {
          setError('作品が見つかりませんでした');
          setWork(null);
        } else {
          setWork(workData);
        }
      } catch (err) {
        console.error('作品取得エラー:', err);
        setError('作品の読み込みに失敗しました');
        setWork(null);
      } finally {
        setLoading(false);
      }
    };

    fetchWork();
  }, [workId]);
  
  // 音声再生の管理
  useEffect(() => {
    if (work?.audioUrl && !audio) {
      const audioElement = new Audio(work.audioUrl);
      audioElement.addEventListener('ended', () => setIsPlaying(false));
      audioElement.addEventListener('pause', () => setIsPlaying(false));
      audioElement.addEventListener('play', () => setIsPlaying(true));
      setAudio(audioElement);
    }
    
    return () => {
      if (audio) {
        audio.pause();
        audio.src = '';
      }
    };
  }, [work?.audioUrl, audio]);

  // 外部クリック時にシェアメニューを閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
        setShowShareMenu(false);
      }
    };

    if (showShareMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showShareMenu]);

  const handleLike = async () => {
    if (!work || !user || isAnonymous) {
      alert('いいねするにはログインが必要です');
      return;
    }
    
    await handleToggleLike(work.id, work.likeCount);
  };
  
  const handlePlayPause = () => {
    if (!audio) return;
    
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  };

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  const handleShare = () => {
    setShowShareMenu(!showShareMenu);
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToastMessage('URLをクリップボードにコピーしました');
      setShowShareMenu(false);
    } catch (err) {
      console.error('URLコピーエラー:', err);
      showToastMessage('URLのコピーに失敗しました');
    }
  };

  const handleShareToX = () => {
    const text = `${work?.title} - AIボイスドラマプラットフォーム`;
    const url = window.location.href;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
    showToastMessage('Xの共有画面を開きました');
    setShowShareMenu(false);
  };

  const handleUserClick = () => {
    if (work?.username) {
      router.push(`/profile/${work.username}`);
    }
  };

  if (loading) {
    return (
      <div className="mx-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded mb-4"></div>
          <div className="bg-white rounded-lg shadow-lg overflow-hidden lg:grid lg:grid-cols-3 lg:gap-8 p-6">
            <div className="aspect-square bg-gray-300 rounded-lg mb-6 lg:mb-0"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              <div className="h-4 bg-gray-300 rounded w-2/3"></div>
            </div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-300 rounded w-1/3"></div>
              <div className="h-32 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-8 py-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{error}</h1>
        <div className="space-x-4">
          <Button onClick={() => router.back()}>戻る</Button>
          <Button onClick={() => window.location.reload()} variant="secondary">再読み込み</Button>
        </div>
      </div>
    );
  }
  
  if (!work) {
    return (
      <div className="mx-8 py-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">作品が見つかりません</h1>
        <Button onClick={() => router.back()}>戻る</Button>
      </div>
    );
  }

  return (
    <div className="mx-8 py-8">
      {/* ヘッダー */}
      <div className="mb-6 flex justify-between items-center">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => router.back()}
          className="cursor-pointer hover:bg-gray-200 transition-colors duration-200 whitespace-nowrap"
        >
          <div className="flex items-center">
            <ArrowLeft size={16} className="mr-1" />
            戻る
          </div>
        </Button>
        
        {/* 編集ボタン（自分の作品の場合のみ表示） */}
        {user && work && work.uid === user.uid && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/compose?id=${workId}`)}
            className="cursor-pointer hover:bg-gray-50 transition-colors duration-200 whitespace-nowrap"
          >
            <div className="flex items-center">
              <Edit size={16} className="mr-1" />
              編集
            </div>
          </Button>
        )}
      </div>

      {/* コンテンツエリア統一 */}
      <div className="space-y-8">
        {/* 作品詳細カード */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden lg:grid lg:grid-cols-3 lg:gap-8">
          {/* 画像・音声エリア */}
          <div className="aspect-square bg-gray-200 relative lg:col-span-1">
            {work.imageUrl && work.imageId ? (
              <Image
                src={getWorkImageURL(work.imageId, 'large')}
                alt={work.title}
                fill
                className="object-cover"
              />
            ) : work.imageUrl ? (
              <Image
                src={work.imageUrl}
                alt={work.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                <span className="text-gray-400 text-xl">画像</span>
              </div>
            )}
            
            {/* 音声再生ボタン */}
            {work.audioUrl && (
              <button
                onClick={handlePlayPause}
                className={`absolute bottom-3 right-3 w-12 h-12 rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-all duration-200 ${
                  isPlaying
                    ? 'bg-white text-blue-600' 
                    : 'bg-white text-gray-700 hover:bg-white'
                }`}
              >
                {isPlaying ? (
                  <Pause size={24} />
                ) : (
                  <Play size={24} className="ml-0.5" />
                )}
              </button>
            )}
          </div>

          {/* 情報エリア */}
          <div className="p-6 lg:col-span-1 lg:flex lg:flex-col">
            {/* タイトル */}
            <div className="mb-4">
              <h1 className="text-2xl font-bold text-gray-900">
                {work.title}
              </h1>
              {work.isR18Work && (
                <div className="mt-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    R-18
                  </span>
                </div>
              )}
            </div>

            {/* ユーザー情報 */}
            <div className="flex items-center justify-between mb-6">
              <div 
                className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity duration-200"
                onClick={handleUserClick}
              >
                <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                  {work.userPhotoURL && work.userImageId ? (
                    <Image
                      src={getImageURL(work.userImageId, 'avatar')}
                      alt={work.displayName}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  ) : work.userPhotoURL ? (
                    <Image
                      src={work.userPhotoURL}
                      alt={work.displayName}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={20} className="text-gray-500" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{work.displayName}</p>
                  <p className="text-sm text-gray-600">@{work.username}</p>
                </div>
              </div>

              <div className="text-sm text-gray-500">
                <div>{work.createdAt.toLocaleDateString('ja-JP')}</div>
                {work.updatedAt && work.updatedAt.getTime() !== work.createdAt.getTime() && (
                  <div className="text-xs text-gray-400 mt-1">
                    更新: {work.updatedAt.toLocaleDateString('ja-JP')}
                  </div>
                )}
              </div>
            </div>

            {/* アクションボタン */}
            <div className="flex items-center space-x-4 mb-6 pb-6 border-b border-gray-200">
              <button
                onClick={handleLike}
                className={`flex items-center space-x-2 cursor-pointer px-3 py-2 rounded-lg transition-all duration-200 ${
                  user && !isAnonymous && isWorkLiked(work.id) 
                    ? 'text-red-500 bg-red-50 hover:bg-red-100'
                    : 'text-gray-600 hover:text-red-500 hover:bg-red-50'
                }`}
              >
                <Heart size={20} fill={user && !isAnonymous && isWorkLiked(work.id) ? 'currentColor' : 'none'} />
                <span>{likeStates[work.id]?.likeCount ?? work.likeCount}</span>
              </button>

              <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-500 cursor-pointer hover:bg-blue-50 px-3 py-2 rounded-lg transition-all duration-200">
                <MessageCircle size={20} />
                <span>{work.commentCount || 0}</span>
              </button>

              <div className="relative" ref={shareMenuRef}>
                <button
                  onClick={handleShare}
                  className="flex items-center space-x-2 text-gray-600 hover:text-green-500 cursor-pointer hover:bg-green-50 px-3 py-2 rounded-lg transition-all duration-200"
                >
                  <Share2 size={20} />
                  <span>シェア</span>
                </button>
                
                {showShareMenu && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    <div className="py-1">
                      <button
                        onClick={handleCopyUrl}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors duration-200"
                      >
                        <Copy size={16} className="mr-3" />
                        URLをコピー
                      </button>
                      <button
                        onClick={handleShareToX}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors duration-200"
                      >
                        <ExternalLink size={16} className="mr-3" />
                        Xで共有
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 説明 */}
            {(work.caption || work.description) && (
              <div className="mb-4">
                <h3 className="text-base font-semibold text-gray-900 mb-2">説明</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {work.caption || work.description}
                </p>
              </div>
            )}
            
            {/* 音声ファイル情報 */}
            {work.audioOriginalFilename && (
              <div className="mb-4">
                <h3 className="text-base font-semibold text-gray-900 mb-2">音声ファイル</h3>
                <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                  <span className="text-xs text-gray-700 truncate mr-2">
                    {work.audioOriginalFilename}
                  </span>
                  {work.audioUrl && (
                    <button
                      onClick={handlePlayPause}
                      className="flex items-center space-x-1 bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded cursor-pointer transition-colors duration-200 flex-shrink-0"
                    >
                      {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                      <span className="text-xs">{isPlaying ? '停止' : '再生'}</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* タグ */}
            {work.tags && work.tags.length > 0 && (
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">タグ</h3>
                <div className="flex flex-wrap gap-1">
                  {work.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full cursor-pointer hover:bg-blue-200 transition-colors duration-200"
                      style={{ backgroundColor: tag.color ? `${tag.color}20` : undefined }}
                    >
                      #{tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 台本エリア */}
          <div className="p-6 lg:col-span-1 lg:flex lg:flex-col">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">台本</h3>
            {work.script ? (
              <div className="flex-1 bg-gray-50 rounded-lg p-4 overflow-y-auto max-h-96">
                <pre className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">
                  {work.script}
                </pre>
              </div>
            ) : (
              <div className="flex-1 bg-gray-50 rounded-lg p-4 flex items-center justify-center">
                <p className="text-gray-500 text-center">台本が登録されていません</p>
              </div>
            )}
          </div>
        </div>

        {/* コメントセクション */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <CommentList workId={workId} initialCommentCount={work.commentCount || 0} />
        </div>
      </div>

      {/* トースト通知 */}
      {showToast && (
        <div className="fixed bottom-4 right-4 bg-black text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-opacity duration-300">
          {toastMessage}
        </div>
      )}
    </div>
  );
}