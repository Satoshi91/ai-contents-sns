'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';
import { signInSchema, signUpSchema, SignInFormData, SignUpFormData } from '@/lib/validations/auth';
import { signIn, signUp, signInWithGoogle, signInWithTwitter, checkUsernameAvailability } from '@/lib/firebase/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/lib/contexts/AuthContext';

type AuthMode = 'signin' | 'signup';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
}

export function AuthModal({ isOpen, onClose, initialMode = 'signin' }: AuthModalProps) {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isTwitterLoading, setIsTwitterLoading] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);

  // フォーム管理 - サインイン
  const signinForm = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
  });

  // フォーム管理 - サインアップ
  const signupForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  const username = signupForm.watch('username');

  // ユーザー名重複チェック
  useEffect(() => {
    const checkUsername = async () => {
      if (mode === 'signup' && username && username.length >= 3) {
        setIsCheckingUsername(true);
        const isAvailable = await checkUsernameAvailability(username);
        if (!isAvailable) {
          signupForm.setError('username', { message: 'このユーザー名は既に使用されています' });
        }
        setIsCheckingUsername(false);
      }
    };

    const debounce = setTimeout(checkUsername, 500);
    return () => clearTimeout(debounce);
  }, [username, signupForm, mode]);

  // サインイン処理
  const onSigninSubmit = async (data: SignInFormData) => {
    setIsLoading(true);
    try {
      const result = await signIn(data.email, data.password);
      
      if (result.success) {
        toast.success('ログインしました！');
        onClose();
        signinForm.reset();
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

  // サインアップ処理
  const onSignupSubmit = async (data: SignUpFormData) => {
    setIsLoading(true);
    try {
      const result = await signUp(data.email, data.password, data.username, data.displayName);
      
      if (result.success) {
        toast.success('アカウントを作成しました！');
        onClose();
        signupForm.reset();
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

  // Google認証処理
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      
      if (result.success) {
        toast.success('ログインしました！');
        onClose();
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

  // Twitter認証処理
  const handleTwitterSignIn = async () => {
    setIsTwitterLoading(true);
    try {
      const result = await signInWithTwitter();
      
      if (result.success) {
        toast.success('ログインしました！');
        onClose();
        router.push('/home');
      } else {
        toast.error(result.error || 'ログインに失敗しました');
      }
    } catch (error) {
      toast.error('予期しないエラーが発生しました');
    } finally {
      setIsTwitterLoading(false);
    }
  };

  // ログインせずに見る処理
  const handleViewWithoutLogin = () => {
    onClose();
    router.push('/home');
  };

  // モーダル閉じる処理
  const handleClose = () => {
    onClose();
    signinForm.reset();
    signupForm.reset();
    setMode('signin');
  };

  // モード切り替え処理
  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    signinForm.reset();
    signupForm.reset();
  };

  if (!isOpen) return null;

  const currentForm = mode === 'signin' ? signinForm : signupForm;
  const isFormLoading = isLoading || (mode === 'signup' && isCheckingUsername);
  const isAnyLoading = isLoading || isGoogleLoading || isTwitterLoading || (mode === 'signup' && isCheckingUsername);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div 
        className="fixed inset-0 bg-black bg-opacity-50" 
        onClick={handleClose}
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      />
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors duration-200"
          >
            <X size={24} />
          </button>

          <div className="space-y-6">
            <div>
              <h2 className="text-center text-3xl font-extrabold text-gray-900">
                {mode === 'signin' ? 'ログイン' : 'アカウントを作成'}
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                {mode === 'signin' ? (
                  <>
                    アカウントをお持ちでない方は{' '}
                    <button 
                      onClick={() => switchMode('signup')}
                      className="font-medium text-blue-600 hover:text-blue-500 cursor-pointer transition-colors duration-200"
                    >
                      新規登録
                    </button>
                  </>
                ) : (
                  <>
                    既にアカウントをお持ちですか？{' '}
                    <button 
                      onClick={() => switchMode('signin')}
                      className="font-medium text-blue-600 hover:text-blue-500 cursor-pointer transition-colors duration-200"
                    >
                      ログイン
                    </button>
                  </>
                )}
              </p>
            </div>
            
            {mode === 'signin' ? (
              <form className="space-y-6" onSubmit={signinForm.handleSubmit(onSigninSubmit)}>
                <div className="space-y-4">
                  <Input
                    {...signinForm.register('email')}
                    type="email"
                    label="メールアドレス"
                    placeholder="example@email.com"
                    error={signinForm.formState.errors.email?.message}
                    fullWidth
                  />

                  <Input
                    {...signinForm.register('password')}
                    type="password"
                    label="パスワード"
                    placeholder="パスワード"
                    error={signinForm.formState.errors.password?.message}
                    fullWidth
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Link href="/reset-password" className="text-sm text-blue-600 hover:text-blue-500 cursor-pointer transition-colors duration-200">
                    パスワードを忘れた方
                  </Link>
                </div>

                <div className="space-y-3">
                  <Button
                    type="submit"
                    fullWidth
                    isLoading={isLoading}
                    disabled={isAnyLoading}
                  >
                    ログイン
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">または</span>
                    </div>
                  </div>

                  {isAdmin && (
                    <>
                      <Button
                        type="button"
                        variant="secondary"
                        fullWidth
                        onClick={handleGoogleSignIn}
                        isLoading={isGoogleLoading}
                        disabled={isAnyLoading}
                      >
                        <span className="flex items-center justify-center">
                          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          {mode === 'signin' ? 'Googleでログイン（開発中）' : 'Googleでサインアップ（開発中）'}
                        </span>
                      </Button>

                      <Button
                        type="button"
                        variant="secondary"
                        fullWidth
                        onClick={handleTwitterSignIn}
                        isLoading={isTwitterLoading}
                        disabled={isAnyLoading}
                      >
                        <span className="flex items-center justify-center">
                          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                          </svg>
                          {mode === 'signin' ? 'Twitterでログイン' : 'Twitterでサインアップ'}
                        </span>
                      </Button>
                    </>
                  )}

                  <Button
                    type="button"
                    variant="ghost"
                    fullWidth
                    onClick={handleViewWithoutLogin}
                  >
                    ログインせずに見る
                  </Button>
                </div>
              </form>
            ) : (
              <form className="space-y-6" onSubmit={signupForm.handleSubmit(onSignupSubmit)}>
                <div className="space-y-4">
                  <Input
                    {...signupForm.register('email')}
                    type="email"
                    label="メールアドレス"
                    placeholder="example@email.com"
                    error={signupForm.formState.errors.email?.message}
                    fullWidth
                  />

                  <Input
                    {...signupForm.register('username')}
                    label="ユーザー名"
                    placeholder="username"
                    error={signupForm.formState.errors.username?.message}
                    fullWidth
                    disabled={isCheckingUsername}
                  />

                  <Input
                    {...signupForm.register('displayName')}
                    label="表示名"
                    placeholder="表示名"
                    error={signupForm.formState.errors.displayName?.message}
                    fullWidth
                  />

                  <Input
                    {...signupForm.register('password')}
                    type="password"
                    label="パスワード"
                    placeholder="8文字以上、大文字・小文字・数字を含む"
                    error={signupForm.formState.errors.password?.message}
                    fullWidth
                  />

                  <Input
                    {...signupForm.register('confirmPassword')}
                    type="password"
                    label="パスワード（確認）"
                    placeholder="パスワードを再入力"
                    error={signupForm.formState.errors.confirmPassword?.message}
                    fullWidth
                  />
                </div>

                <div className="space-y-3">
                  <Button
                    type="submit"
                    fullWidth
                    isLoading={isLoading}
                    disabled={isAnyLoading}
                  >
                    アカウントを作成
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">または</span>
                    </div>
                  </div>

                  {isAdmin && (
                    <>
                      <Button
                        type="button"
                        variant="secondary"
                        fullWidth
                        onClick={handleGoogleSignIn}
                        isLoading={isGoogleLoading}
                        disabled={isAnyLoading}
                      >
                        <span className="flex items-center justify-center">
                          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          Googleでサインアップ（開発中）
                        </span>
                      </Button>

                      <Button
                        type="button"
                        variant="secondary"
                        fullWidth
                        onClick={handleTwitterSignIn}
                        isLoading={isTwitterLoading}
                        disabled={isAnyLoading}
                      >
                        <span className="flex items-center justify-center">
                          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                          </svg>
                          Twitterでサインアップ
                        </span>
                      </Button>
                    </>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}