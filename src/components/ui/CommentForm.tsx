'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/Button';
import { TextArea } from '@/components/ui/TextArea';
import { createCommentSchema, CreateCommentFormData } from '@/lib/validations/comment';
import { createComment } from '@/lib/firebase/comments';
import { useAuth } from '@/lib/contexts/AuthContext';

interface CommentFormProps {
  workId: string;
  onCommentCreated?: () => void;
}

export default function CommentForm({ workId, onCommentCreated }: CommentFormProps) {
  const { user, userData, isAnonymous } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCommentFormData>({
    resolver: zodResolver(createCommentSchema),
  });

  const onSubmit = async (data: CreateCommentFormData) => {
    if (!user || !userData || isAnonymous) {
      alert('コメントするにはログインが必要です');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createComment(
        workId,
        data,
        user.uid,
        userData.username,
        userData.displayName,
        userData.photoURL
      );

      if (result.success) {
        reset();
        onCommentCreated?.();
      } else {
        alert(result.error || 'コメントの投稿に失敗しました');
      }
    } catch (error) {
      console.error('コメント投稿エラー:', error);
      alert('コメントの投稿に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user || isAnonymous) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg text-center">
        <p className="text-gray-600 text-sm">
          コメントを投稿するにはログインが必要です
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
      <div className="flex gap-3 items-center">
        <div className="flex-1">
          <TextArea
            {...register('content')}
            placeholder="コメントを入力してください..."
            rows={3}
            disabled={isSubmitting}
            className={`w-full ${errors.content ? 'border-red-500' : ''}`}
          />
        </div>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="cursor-pointer hover:bg-blue-600 transition-colors duration-200 flex-shrink-0 whitespace-nowrap"
        >
          {isSubmitting ? (
            <div className="flex items-center">
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
              投稿中...
            </div>
          ) : (
            <div className="flex items-center">
              <Send size={16} className="mr-2" />
              コメントする
            </div>
          )}
        </Button>
      </div>
      
      {errors.content && (
        <p className="text-red-500 text-sm">{errors.content.message}</p>
      )}
    </form>
  );
}