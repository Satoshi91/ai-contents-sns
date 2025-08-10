'use client';

import { useState } from 'react';
import { Trash2, User } from 'lucide-react';
import { Comment } from '@/types/comment';
import { useAuth } from '@/lib/contexts/AuthContext';
import { deleteComment } from '@/lib/firebase/comments';
import { getImageURL } from '@/lib/cloudflare/images';
import Image from 'next/image';

interface CommentItemProps {
  comment: Comment;
  onDelete?: () => void;
}

export default function CommentItem({ comment, onDelete }: CommentItemProps) {
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  // URLが有効かどうかをチェックする関数
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  };

  const handleDelete = async () => {
    if (!user || comment.uid !== user.uid) return;
    
    if (!confirm('このコメントを削除しますか？')) return;

    setIsDeleting(true);
    try {
      const result = await deleteComment(comment.id, user.uid);
      if (result.success) {
        onDelete?.();
      } else {
        alert(result.error || 'コメントの削除に失敗しました');
      }
    } catch (error) {
      console.error('コメント削除エラー:', error);
      alert('コメントの削除に失敗しました');
    } finally {
      setIsDeleting(false);
    }
  };

  const canDelete = user && comment.uid === user.uid;

  return (
    <div className="border-b border-gray-100 last:border-b-0 pb-4 last:pb-0">
      <div className="flex items-start space-x-3">
        {/* ユーザーアバター */}
        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden flex-shrink-0">
          {comment.userPhotoURL && comment.userImageId ? (
            <Image
              src={getImageURL(comment.userImageId, 'avatar')}
              alt={comment.displayName}
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          ) : comment.userPhotoURL && isValidUrl(comment.userPhotoURL) ? (
            <Image
              src={comment.userPhotoURL}
              alt={comment.displayName}
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          ) : (
            <User size={16} className="text-gray-500" />
          )}
        </div>

        {/* コメント内容 */}
        <div className="flex-1 min-w-0">
          {/* ユーザー情報 */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900 text-sm">
                {comment.displayName}
              </span>
              <span className="text-gray-500 text-xs">
                @{comment.username}
              </span>
              <span className="text-gray-400 text-xs">
                {comment.createdAt.toLocaleDateString('ja-JP')}
              </span>
            </div>
            
            {/* 削除ボタン */}
            {canDelete && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-1 text-gray-400 hover:text-red-500 cursor-pointer hover:bg-red-50 rounded transition-all duration-200 disabled:opacity-50"
                title="コメントを削除"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>

          {/* コメントテキスト */}
          <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
            {comment.content}
          </p>
        </div>
      </div>
    </div>
  );
}