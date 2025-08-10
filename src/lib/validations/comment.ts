import { z } from 'zod';

// コメント作成のバリデーションスキーマ
export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'コメントを入力してください')
    .max(500, 'コメントは500文字以内で入力してください')
    .trim(),
});

// コメント作成入力型
export type CreateCommentFormData = z.infer<typeof createCommentSchema>;