'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { signUpSchema, SignUpFormData } from '@/lib/validations/auth';
import { signUp, checkUsernameAvailability } from '@/lib/firebase/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function SignUpPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  const username = watch('username');

  React.useEffect(() => {
    const checkUsername = async () => {
      if (username && username.length >= 3) {
        setIsCheckingUsername(true);
        const isAvailable = await checkUsernameAvailability(username);
        if (!isAvailable) {
          setError('username', { message: 'このユーザー名は既に使用されています' });
        }
        setIsCheckingUsername(false);
      }
    };

    const debounce = setTimeout(checkUsername, 500);
    return () => clearTimeout(debounce);
  }, [username, setError]);

  const onSubmit = async (data: SignUpFormData) => {
    setIsLoading(true);
    try {
      const result = await signUp(data.email, data.password, data.username, data.displayName);
      
      if (result.success) {
        toast.success('アカウントを作成しました！');
        router.push('/home');
      } else {
        toast.error(result.error || '登録に失敗しました');
      }
    } catch (error) {
      toast.error('予期しないエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            アカウントを作成
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            既にアカウントをお持ちですか？{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              ログイン
            </Link>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <Input
              {...register('email')}
              type="email"
              label="メールアドレス"
              placeholder="example@email.com"
              error={errors.email?.message}
              fullWidth
            />

            <Input
              {...register('username')}
              label="ユーザー名"
              placeholder="username"
              error={errors.username?.message}
              fullWidth
              disabled={isCheckingUsername}
            />

            <Input
              {...register('displayName')}
              label="表示名"
              placeholder="表示名"
              error={errors.displayName?.message}
              fullWidth
            />

            <Input
              {...register('password')}
              type="password"
              label="パスワード"
              placeholder="8文字以上、大文字・小文字・数字を含む"
              error={errors.password?.message}
              fullWidth
            />

            <Input
              {...register('confirmPassword')}
              type="password"
              label="パスワード（確認）"
              placeholder="パスワードを再入力"
              error={errors.confirmPassword?.message}
              fullWidth
            />
          </div>

          <Button
            type="submit"
            fullWidth
            isLoading={isLoading}
            disabled={isLoading || isCheckingUsername}
          >
            アカウントを作成
          </Button>
        </form>
      </div>
    </div>
  );
}