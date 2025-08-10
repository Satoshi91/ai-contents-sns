import { z } from 'zod';
import { tagsArraySchema } from './tag';

export const createWorkSchema = z.object({
  title: z.string()
    .min(1, 'タイトルを入力してください')
    .max(100, 'タイトルは100文字以内である必要があります'),
  caption: z.string()
    .max(500, 'キャプションは500文字以内である必要があります')
    .optional()
    .or(z.literal('')),
  script: z.string()
    .max(50000, '台本は50000文字以内である必要があります')
    .optional()
    .or(z.literal('')),
  imageUrl: z.string().url().optional(),
  imageId: z.string().optional(),
  audioUrl: z.string().url('音声ファイルをアップロードしてください'),
  audioId: z.string().optional(),
  audioOriginalFilename: z.string().optional(),
  tags: tagsArraySchema.optional(),
  ageRating: z.enum(['all', '18+']).default('all'),
});

export const editWorkSchema = z.object({
  title: z.string()
    .min(1, 'タイトルを入力してください')
    .max(100, 'タイトルは100文字以内である必要があります'),
  caption: z.string()
    .max(500, 'キャプションは500文字以内である必要があります')
    .optional()
    .or(z.literal('')),
  script: z.string()
    .max(50000, '台本は50000文字以内である必要があります')
    .optional()
    .or(z.literal('')),
  imageUrl: z.string().url().optional(),
  imageId: z.string().optional(),
  audioUrl: z.string().url('音声ファイルをアップロードしてください'),
  audioId: z.string().optional(),
  audioOriginalFilename: z.string().optional(),
  tags: tagsArraySchema.optional(),
  ageRating: z.enum(['all', '18+']).default('all'),
});

export type CreateWorkFormData = z.infer<typeof createWorkSchema>;
export type EditWorkFormData = z.infer<typeof editWorkSchema>;