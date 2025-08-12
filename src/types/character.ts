export interface Character {
  id: string;
  character_name?: string;
  series?: string;
  series_ja?: string;
  status?: string;
  tags?: string[];
  imageUrl?: string;
  imageId?: string;
  userId?: string;
  created_at?: Date;
  updated_at?: Date;
}

export type CharacterCategory = 'all' | 'recent' | 'popular' | 'by_series';

export interface CharacterFilters {
  series?: string;
  status?: string;
  searchQuery?: string;
}