import { z } from 'zod';

export const createWorkSchema = z.object({
  title: z.string()
    .min(1, 'タイトルを入力してください')
    .max(100, 'タイトルは100文字以内である必要があります'),
  caption: z.string()
    .min(1, 'キャプションを入力してください')
    .max(500, 'キャプションは500文字以内である必要があります'),
  audioUrl: z.string().url().optional(),
  audioId: z.string().optional(),
});

export const editWorkSchema = z.object({
  title: z.string()
    .min(1, 'タイトルを入力してください')
    .max(100, 'タイトルは100文字以内である必要があります'),
  caption: z.string()
    .min(1, 'キャプションを入力してください')
    .max(500, 'キャプションは500文字以内である必要があります'),
  audioUrl: z.string().url().optional(),
  audioId: z.string().optional(),
});

export type CreateWorkFormData = z.infer<typeof createWorkSchema>;
export type EditWorkFormData = z.infer<typeof editWorkSchema>;