// 外部システム（image-generation-admin）との互換性を保つImageData型定義

export interface ImageData {
  id: string;
  request_id: string;
  storage_url: string;
  prompt?: string;
  original_filename?: string;
  created_at?: string;
  is_public?: boolean;
  rating?: string;
  views?: number;
  parent_image_id?: string;
  edit_parameters?: {
    brightness?: number;
    saturation?: number;
    contrast?: number;
    upscale_factor?: number;
  };
}

export interface ImageDocument {
  id?: string;
  image_data: ImageData;
  created_at?: unknown;
  updated_at?: unknown;
}

// フィルタリング・検索用の型
export interface ImageFilters {
  rating?: string[];
  isPublic?: boolean;
  hasPrompt?: boolean;
  search?: string;
}

// ソート用の型
export type ImageSortBy = 'created_at' | 'views' | 'rating';
export type ImageSortDirection = 'desc' | 'asc';

// ページネーション結果
export interface ImagesPaginationResult {
  images: ImageDocument[];
  lastVisible: any; // QueryDocumentSnapshot
  hasMore: boolean;
}