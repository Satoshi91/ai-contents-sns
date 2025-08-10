import { z } from 'zod';

export const tagSchema = z.string()
  .min(1, 'タグは1文字以上である必要があります')
  .max(20, 'タグは20文字以内である必要があります')
  .regex(/^[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u3005\u3006\u30FC\uFF21-\uFF3A\uFF41-\uFF5Aa-zA-Z0-9！？。、・（）「」【】〜～\s_-]+$/, '使用できない文字が含まれています（#@<>など特殊記号は使用不可）')
  .transform(str => str.toLowerCase().trim());

export const tagsArraySchema = z.array(tagSchema)
  .max(10, 'タグは最大10個まで設定できます')
  .refine(tags => new Set(tags).size === tags.length, {
    message: '重複するタグは設定できません'
  });

export const tagCategorySchema = z.enum([
  'genre',
  'mood', 
  'usage',
  'target',
  'length',
  'style',
  'other'
]);

export const ageRatingSchema = z.enum(['all', '12+', '15+', '18+']);

export const createTagSchema = z.object({
  name: tagSchema,
  category: tagCategorySchema,
  metadata: z.object({
    isR18: z.boolean().default(false),
    ageRating: ageRatingSchema.default('all'),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/, '有効な色コードを入力してください').default('#3B82F6'),
    icon: z.string().optional(),
    description: z.string().max(100, '説明は100文字以内である必要があります').optional()
  }).default(() => ({
    isR18: false,
    ageRating: 'all' as const,
    color: '#3B82F6'
  })),
  isActive: z.boolean().default(true)
});

export type TagCategory = z.infer<typeof tagCategorySchema>;
export type AgeRating = z.infer<typeof ageRatingSchema>;
export type CreateTagInput = z.infer<typeof createTagSchema>;