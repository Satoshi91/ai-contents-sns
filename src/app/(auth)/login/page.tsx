'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { signInSchema, SignInFormData } from '@/lib/validations/auth';
import { signIn, signInWithGoogle, signInAnonymous } from '@/lib/firebase/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAnonymousLoading, setIsAnonymousLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = async (data: SignInFormData) => {
    setIsLoading(true);
    try {
      const result = await signIn(data.email, data.password);
      
      if (result.success) {
        toast.success('ログインしました！');
        router.push('/home');
      } else {
        toast.error(result.error || 'ログインに失敗しました');
      }
    } catch (error) {
      toast.error('予期しないエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      
      if (result.success) {
        toast.success('ログインしました！');
        router.push('/home');
      } else {
        toast.error(result.error || 'ログインに失敗しました');
      }
    } catch (error) {
      toast.error('予期しないエラーが発生しました');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleAnonymousSignIn = async () => {
    setIsAnonymousLoading(true);
    try {
      const result = await signInAnonymous();
      
      if (result.success) {
        toast.success('ゲストとしてログインしました！');
        router.push('/home');
      } else {
        toast.error(result.error || 'ゲストログインに失敗しました');
      }
    } catch (error) {
      toast.error('予期しないエラーが発生しました');
    } finally {
      setIsAnonymousLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            ログイン
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            アカウントをお持ちでない方は{' '}
            <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
              新規登録
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
              {...register('password')}
              type="password"
              label="パスワード"
              placeholder="パスワード"
              error={errors.password?.message}
              fullWidth
            />
          </div>

          <div className="flex items-center justify-between">
            <Link href="/reset-password" className="text-sm text-blue-600 hover:text-blue-500">
              パスワードを忘れた方
            </Link>
          </div>

          <div className="space-y-3">
            <Button
              type="submit"
              fullWidth
              isLoading={isLoading}
              disabled={isLoading || isGoogleLoading || isAnonymousLoading}
            >
              ログイン
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">または</span>
              </div>
            </div>

            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={handleGoogleSignIn}
              isLoading={isGoogleLoading}
              disabled={isLoading || isGoogleLoading || isAnonymousLoading}
            >
              <span className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Googleでログイン
              </span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              fullWidth
              onClick={handleAnonymousSignIn}
              isLoading={isAnonymousLoading}
              disabled={isLoading || isGoogleLoading || isAnonymousLoading}
            >
              <span className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                </svg>
                ゲストとして続ける
              </span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}