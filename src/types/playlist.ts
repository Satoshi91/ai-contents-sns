import { Work } from './work';
import { WorksCategory } from './worksSection';

export interface PlaylistMetadata {
  id: string;              // 一意識別子 "latest", "following-user123", "trending"
  title: string;           // 表示名 "みんなの新着", "フォロー新着" 
  category: WorksCategory; // カテゴリタイプ
  userId?: string;         // ユーザー固有プレイリストの場合
  totalTracks: number;     // プレイリスト内の総作品数
  audioTracks: Work[];     // 音声ファイルを持つ作品のみのフィルタ済み配列
  createdAt: Date;         // プレイリスト生成時刻
}

export interface PlaylistContext {
  playlist: Work[];              // 現在のプレイリスト（音声作品のみ）
  playlistMeta: PlaylistMetadata | null; // プレイリストのメタデータ
  currentIndex: number;          // プレイリスト内での現在位置
  
  // プレイリスト生成・設定
  setPlaylistFromWorks: (
    works: Work[], 
    metadata: Omit<PlaylistMetadata, 'audioTracks' | 'totalTracks' | 'createdAt'>,
    startIndex?: number
  ) => void;
  
  // プレイリスト操作
  playTrackFromPlaylist: (work: Work, playlist?: Work[], playlistMeta?: PlaylistMetadata) => void;
  getNextTrack: () => Work | null;
  getPreviousTrack: () => Work | null;
  getCurrentPlaylistPosition: () => { current: number; total: number };
}

// プレイリスト生成ヘルパー関数用の型
export interface CreatePlaylistOptions {
  category: WorksCategory;
  title: string;
  userId?: string;
  works: Work[];
}

export interface PlaylistGenerationResult {
  audioWorks: Work[];
  metadata: PlaylistMetadata;
}