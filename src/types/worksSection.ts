export type WorksCategory = 
  | 'latest'      // 全体新着
  | 'following'   // フォロー新着
  | 'trending'    // 急上昇
  | 'liked'       // いいね済み
  | 'user'        // ユーザー作品
  | 'recommended' // おすすめ（将来拡張）
  | 'genre';      // ジャンル別（将来拡張）

export interface WorksSectionConfig {
  category: WorksCategory;
  userId?: string;     // user カテゴリ用
  genreId?: string;    // genre カテゴリ用  
  limit?: number;      // 取得件数制限
  enableInfiniteScroll?: boolean; // 無限スクロール有効化
}

export interface WorksGridConfig {
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
}