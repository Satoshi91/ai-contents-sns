import { z } from 'zod';

export const signUpSchema = z.object({
  email: z.string().email('メールアドレスの形式が正しくありません'),
  password: z.string()
    .min(8, 'パスワードは8文字以上である必要があります')
    .regex(/[A-Z]/, 'パスワードには大文字を含める必要があります')
    .regex(/[a-z]/, 'パスワードには小文字を含める必要があります')
    .regex(/[0-9]/, 'パスワードには数字を含める必要があります'),
  confirmPassword: z.string(),
  username: z.string()
    .min(3, 'ユーザー名は3文字以上である必要があります')
    .max(20, 'ユーザー名は20文字以下である必要があります')
    .regex(/^[a-zA-Z0-9_]+$/, 'ユーザー名は英数字とアンダースコアのみ使用できます'),
  displayName: z.string()
    .min(1, '表示名を入力してください')
    .max(50, '表示名は50文字以下である必要があります'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'パスワードが一致しません',
  path: ['confirmPassword'],
});

export const signInSchema = z.object({
  email: z.string().email('メールアドレスの形式が正しくありません'),
  password: z.string().min(1, 'パスワードを入力してください'),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('メールアドレスの形式が正しくありません'),
});

export type SignUpFormData = z.infer<typeof signUpSchema>;
export type SignInFormData = z.infer<typeof signInSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;