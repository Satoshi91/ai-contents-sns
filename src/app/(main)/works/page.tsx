'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { getUserWorks } from '@/lib/firebase/works';
import { Work } from '@/types/work';
import { FileText, Calendar, Heart, MessageCircle, Share } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function MyWorksPage() {
  const { user, userData, loading } = useAuth();
  const [works, setWorks] = useState<Work[]>([]);
  const [loadingWorks, setLoadingWorks] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserWorks = async () => {
      if (!user) return;
      
      setLoadingWorks(true);
      setError(null);
      
      try {
        const userWorks = await getUserWorks(user.uid);
        setWorks(userWorks);
      } catch (err) {
        setError('作品の取得に失敗しました');
        console.error('Error fetching user works:', err);
      } finally {
        setLoadingWorks(false);
      }
    };

    fetchUserWorks();
  }, [user]);

  const handleEdit = (workId: string) => {
    router.push(`/compose?id=${workId}`);
  };


  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-600">ログインが必要です</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">自分の作品</h1>
        <p className="text-gray-600">
          あなたが投稿したAIボイスドラマ作品の一覧です
        </p>
      </div>

      {loadingWorks && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {!loadingWorks && works.length === 0 && !error && (
        <div className="text-center py-12">
          <FileText size={64} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-500 mb-2">
            まだ作品がありません
          </h3>
          <p className="text-gray-400 mb-6">
            最初のAIボイスドラマ作品を投稿してみましょう！
          </p>
          <button
            onClick={() => window.location.href = '/compose'}
            className="cursor-pointer px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
          >
            作品を投稿する
          </button>
        </div>
      )}

      {!loadingWorks && works.length > 0 && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-gray-600">
              {works.length} 件の作品
            </p>
            <button
              onClick={() => window.location.href = '/compose'}
              className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
            >
              新しい作品を投稿
            </button>
          </div>

          <div className="space-y-6">
            {works.map((work) => (
              <div key={work.id} className="bg-white rounded-lg shadow border p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {work.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed mb-4">
                      {work.caption}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <Calendar size={16} className="mr-1" />
                      {new Date(work.createdAt).toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <Heart size={16} className="mr-1" />
                      {work.likeCount}
                    </div>
                    <div className="flex items-center">
                      <MessageCircle size={16} className="mr-1" />
                      {work.replyCount}
                    </div>
                    <div className="flex items-center">
                      <Share size={16} className="mr-1" />
                      {work.retweetCount}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => router.push(`/works/${work.id}`)}
                      className="cursor-pointer px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors duration-200"
                    >
                      詳細を見る
                    </button>
                    <button 
                      onClick={() => handleEdit(work.id)}
                      className="cursor-pointer px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded transition-colors duration-200"
                    >
                      編集
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}