import { z } from 'zod';

export const createPostSchema = z.object({
  content: z.string()
    .min(1, '投稿内容を入力してください')
    .max(280, '投稿は280文字以内である必要があります'),
});

export const editPostSchema = z.object({
  content: z.string()
    .min(1, '投稿内容を入力してください')
    .max(280, '投稿は280文字以内である必要があります'),
});

export type CreatePostFormData = z.infer<typeof createPostSchema>;
export type EditPostFormData = z.infer<typeof editPostSchema>;