export interface Tag {
  id: string;
  name: string;
  slug: string;
  category: TagCategory;
  metadata: {
    isR18: boolean;
    ageRating: 'all' | '12+' | '15+' | '18+';
    color: string;
    icon?: string;
    description?: string;
  };
  stats: {
    usageCount: number;
    trendScore: number;
    lastUsed: Date;
  };
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export type TagCategory = 
  | 'genre'        // ジャンル（恋愛、SF、ホラー等）
  | 'mood'         // 雰囲気（感動、コメディ、シリアス等）  
  | 'usage'        // 用途（作業用、睡眠用、リラックス等）
  | 'target'       // 対象（子供向け、大人向け等）
  | 'length'       // 長さ（短編、長編等）
  | 'style'        // スタイル（朗読、ドラマ、ASMR等）
  | 'other';       // その他

export interface WorkTag {
  id: string;
  name: string;
  category: TagCategory;
  isR18: boolean;
  color: string;
}

export interface TagSearchResult {
  tag: Tag;
  relatedTags: string[];
  worksCount: number;
}

export interface TrendingTag {
  tag: Tag;
  trendScore: number;
  growthRate: number;
  period: '24h' | '7d' | '30d';
}