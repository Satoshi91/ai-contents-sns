'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { resetPasswordSchema, ResetPasswordFormData } from '@/lib/validations/auth';
import { resetPassword } from '@/lib/firebase/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowLeft } from 'lucide-react';

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    try {
      const result = await resetPassword(data.email);
      
      if (result.success) {
        setIsEmailSent(true);
        toast.success('パスワードリセットメールを送信しました');
      } else {
        toast.error(result.error || 'メールの送信に失敗しました');
      }
    } catch (error) {
      toast.error('予期しないエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  if (isEmailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              メールを送信しました
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              パスワードリセットの手順を記載したメールを送信しました。
              メールボックスをご確認ください。
            </p>
            <Link
              href="/home"
              className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-500 cursor-pointer transition-colors duration-200"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              ホームに戻る
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            パスワードをリセット
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            登録したメールアドレスを入力してください
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <Input
            {...register('email')}
            type="email"
            label="メールアドレス"
            placeholder="example@email.com"
            error={errors.email?.message}
            fullWidth
          />

          <Button
            type="submit"
            fullWidth
            isLoading={isLoading}
            disabled={isLoading}
          >
            リセットメールを送信
          </Button>

          <div className="text-center">
            <Link
              href="/home"
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500 cursor-pointer transition-colors duration-200"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              ホームに戻る
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}