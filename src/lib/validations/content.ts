import { z } from 'zod';

// Common validation rules
const titleSchema = z.string()
  .min(1, 'タイトルを入力してください')
  .max(100, 'タイトルは100文字以内で入力してください')
  .trim();

const descriptionSchema = z.string()
  .max(1000, '説明は1000文字以内で入力してください')
  .trim()
  .optional();

const tagsSchema = z.array(z.string().min(1).max(20))
  .max(10, 'タグは10個まで設定できます')
  .optional();

const ageRatingSchema = z.enum(['all', '18+'], {
  errorMap: () => ({ message: '年齢制限を選択してください' })
});

// Base content schema
const baseContentSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  tags: tagsSchema,
  ageRating: ageRatingSchema.optional(),
});

// Voice content schema
export const createVoiceContentSchema = baseContentSchema.extend({
  type: z.literal('voice'),
  audioUrl: z.string().min(1, '音声ファイルをアップロードしてください'),
  audioId: z.string().min(1, '音声IDが必要です'),
  audioOriginalFilename: z.string().optional(),
});

// Script content schema
export const createScriptContentSchema = baseContentSchema.extend({
  type: z.literal('script'),
  scriptText: z.string()
    .min(1, 'スクリプトを入力してください')
    .max(50000, 'スクリプトは50000文字以内で入力してください')
    .trim(),
});

// Image content schema
export const createImageContentSchema = baseContentSchema.extend({
  type: z.literal('image'),
  imageUrl: z.string().min(1, '画像をアップロードしてください'),
  imageId: z.string().min(1, '画像IDが必要です'),
});

// Work content schema
export const createWorkContentSchema = baseContentSchema.extend({
  type: z.literal('work'),
  relatedContentIds: z.array(z.string()).min(1, '関連コンテンツを1つ以上選択してください'),
});

// Union schema for all content types
export const createContentSchema = z.discriminatedUnion('type', [
  createVoiceContentSchema,
  createScriptContentSchema,
  createImageContentSchema,
  createWorkContentSchema,
]);

// Update content schema (without type field)
export const updateVoiceContentSchema = createVoiceContentSchema.omit({ type: true });
export const updateScriptContentSchema = createScriptContentSchema.omit({ type: true });
export const updateImageContentSchema = createImageContentSchema.omit({ type: true });
export const updateWorkContentSchema = createWorkContentSchema.omit({ type: true });

// Content type validation
export const contentTypeSchema = z.enum(['voice', 'script', 'image', 'work'], {
  errorMap: () => ({ message: 'コンテンツタイプを選択してください' })
});

// Utility functions for validation
export const validateContentByType = (type: string, data: any) => {
  switch (type) {
    case 'voice':
      return createVoiceContentSchema.safeParse({ ...data, type });
    case 'script':
      return createScriptContentSchema.safeParse({ ...data, type });
    case 'image':
      return createImageContentSchema.safeParse({ ...data, type });
    case 'work':
      return createWorkContentSchema.safeParse({ ...data, type });
    default:
      return { success: false, error: { errors: [{ message: '無効なコンテンツタイプです' }] } };
  }
};

export const validateUpdateContentByType = (type: string, data: any) => {
  switch (type) {
    case 'voice':
      return updateVoiceContentSchema.safeParse(data);
    case 'script':
      return updateScriptContentSchema.safeParse(data);
    case 'image':
      return updateImageContentSchema.safeParse(data);
    case 'work':
      return updateWorkContentSchema.safeParse(data);
    default:
      return { success: false, error: { errors: [{ message: '無効なコンテンツタイプです' }] } };
  }
};