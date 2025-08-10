import { ImageFilters, ImageSortBy, ImageSortDirection } from './image';

// イラストセクションのカテゴリ
export type ImagesCategory = 'all' | 'recent' | 'popular' | 'favorites';

// イラストセクションの設定
export interface ImagesSectionConfig {
  limit?: number;
  orderBy?: ImageSortBy;
  orderDirection?: ImageSortDirection;
  filters?: ImageFilters;
  userId?: string; // 特定ユーザーの画像のみ取得
}

// グリッドレイアウト設定
export interface ImagesGridConfig {
  sm?: number; // スマホ（640px以上）
  md?: number; // タブレット（768px以上）
  lg?: number; // デスクトップ（1024px以上）
  xl?: number; // 大画面（1280px以上）
}

// マサリー表示のブレークポイント設定
export interface MasonryBreakpoints {
  default: number;
  [key: number]: number;
}

// イラスト一覧の表示設定
export interface ImagesDisplayConfig {
  showPrompt?: boolean;
  showMetadata?: boolean;
  showStats?: boolean;
  showActions?: boolean;
  cardSize?: 'small' | 'medium' | 'large';
}

// イラスト操作のイベントハンドラー型
export interface ImageEventHandlers {
  onImageClick?: (imageId: string) => void;
  onImageSelect?: (imageId: string) => void;
  onAddVoice?: (imageId: string) => void;
  onFavorite?: (imageId: string) => void;
  onShare?: (imageId: string) => void;
}

// デフォルト設定値
export const DEFAULT_IMAGES_GRID_CONFIG: ImagesGridConfig = {
  sm: 1,
  md: 2,
  lg: 3,
  xl: 4
};

export const DEFAULT_MASONRY_BREAKPOINTS: MasonryBreakpoints = {
  default: 4,
  1280: 4, // xl
  1024: 3, // lg  
  768: 2,  // md
  640: 1   // sm
};

export const DEFAULT_IMAGES_SECTION_CONFIG: ImagesSectionConfig = {
  limit: 20,
  orderBy: 'created_at',
  orderDirection: 'desc',
  filters: {
    isPublic: true
  }
};