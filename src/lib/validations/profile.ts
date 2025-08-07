import { z } from 'zod';

export const updateProfileSchema = z.object({
  displayName: z.string()
    .min(1, '表示名を入力してください')
    .max(50, '表示名は50文字以下である必要があります'),
  bio: z.string()
    .max(160, '自己紹介は160文字以内である必要があります')
    .optional(),
  username: z.string()
    .min(3, 'ユーザー名は3文字以上である必要があります')
    .max(20, 'ユーザー名は20文字以下である必要があります')
    .regex(/^[a-zA-Z0-9_]+$/, 'ユーザー名は英数字とアンダースコアのみ使用できます')
    .optional(),
});

export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;