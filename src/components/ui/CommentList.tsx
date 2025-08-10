'use client';

import { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { Comment } from '@/types/comment';
import { getWorkComments } from '@/lib/firebase/comments';
import CommentItem from '@/components/ui/CommentItem';
import CommentForm from '@/components/ui/CommentForm';

interface CommentListProps {
  workId: string;
  initialCommentCount?: number;
}

export default function CommentList({ workId, initialCommentCount = 0 }: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentCount, setCommentCount] = useState(initialCommentCount);

  const fetchComments = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedComments = await getWorkComments(workId);
      setComments(fetchedComments);
      setCommentCount(fetchedComments.length);
    } catch (err) {
      console.error('コメント取得エラー:', err);
      setError('コメントの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workId) {
      fetchComments();
    }
  }, [workId]);

  const handleCommentCreated = () => {
    fetchComments();
  };

  const handleCommentDeleted = () => {
    fetchComments();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2 mb-4">
          <MessageCircle size={20} />
          <h3 className="text-lg font-semibold text-gray-900">コメント</h3>
          <span className="text-sm text-gray-500">読み込み中...</span>
        </div>
        
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="flex space-x-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2 mb-4">
          <MessageCircle size={20} />
          <h3 className="text-lg font-semibold text-gray-900">コメント</h3>
        </div>
        
        <div className="text-center py-8">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={fetchComments}
            className="text-blue-500 hover:text-blue-700 cursor-pointer transition-colors duration-200"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* コメントヘッダー */}
      <div className="flex items-center space-x-2">
        <MessageCircle size={20} />
        <h3 className="text-lg font-semibold text-gray-900">コメント</h3>
        <span className="text-sm text-gray-500">
          ({commentCount}件)
        </span>
      </div>

      {/* コメント投稿フォーム */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <CommentForm workId={workId} onCommentCreated={handleCommentCreated} />
      </div>

      {/* コメント一覧 */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
            <p>まだコメントがありません</p>
            <p className="text-sm">最初のコメントを投稿してみましょう！</p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onDelete={handleCommentDeleted}
            />
          ))
        )}
      </div>
    </div>
  );
}