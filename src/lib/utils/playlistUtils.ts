import { Work } from '@/types/work';
import { WorksCategory } from '@/types/worksSection';
import { PlaylistMetadata, CreatePlaylistOptions, PlaylistGenerationResult } from '@/types/playlist';

/**
 * 作品リストから音声ファイルを持つ作品のみをフィルタリング
 */
export function filterAudioWorks(works: Work[]): Work[] {
  return works.filter(work => work.audioUrl && work.audioUrl.trim() !== '');
}

/**
 * カテゴリに基づいてプレイリストIDを生成
 */
export function generatePlaylistId(category: WorksCategory, userId?: string): string {
  switch (category) {
    case 'latest':
      return 'latest-all';
    case 'following':
      return `following-${userId || 'anonymous'}`;
    case 'trending':
      return 'trending-all';
    case 'liked':
      return `liked-${userId || 'anonymous'}`;
    case 'user':
      return `user-${userId || 'unknown'}`;
    case 'recommended':
      return `recommended-${userId || 'anonymous'}`;
    case 'genre':
      return `genre-${userId || 'all'}`;
    default:
      return `custom-${Date.now()}`;
  }
}

/**
 * カテゴリに基づいてプレイリストのタイトルを生成
 */
export function getCategoryDisplayName(category: WorksCategory): string {
  switch (category) {
    case 'latest':
      return 'みんなの新着';
    case 'following':
      return 'フォロー新着';
    case 'trending':
      return '急上昇';
    case 'liked':
      return 'お気に入り';
    case 'user':
      return 'ユーザー作品';
    case 'recommended':
      return 'おすすめ';
    case 'genre':
      return 'ジャンル別';
    default:
      return 'プレイリスト';
  }
}

/**
 * 作品リストからプレイリストメタデータとフィルタ済み音声作品を生成
 */
export function createPlaylist(options: CreatePlaylistOptions): PlaylistGenerationResult {
  const { category, title, userId, works } = options;
  
  const audioWorks = filterAudioWorks(works);
  
  const metadata: PlaylistMetadata = {
    id: generatePlaylistId(category, userId),
    title: title || getCategoryDisplayName(category),
    category,
    userId,
    totalTracks: works.length,
    audioTracks: audioWorks,
    createdAt: new Date(),
  };

  return {
    audioWorks,
    metadata,
  };
}

/**
 * プレイリスト内での指定作品のインデックスを取得
 */
export function findTrackIndexInPlaylist(trackId: string, playlist: Work[]): number {
  return playlist.findIndex(work => work.id === trackId);
}

/**
 * プレイリストの次のトラックを取得（シャッフル・リピート対応）
 */
export function getNextTrackInPlaylist(
  currentIndex: number,
  playlist: Work[],
  shuffle: boolean = false,
  repeat: 'none' | 'one' | 'all' = 'none'
): { nextIndex: number; nextTrack: Work | null } {
  if (playlist.length === 0) {
    return { nextIndex: -1, nextTrack: null };
  }

  // リピートワンの場合は現在の曲を繰り返す
  if (repeat === 'one') {
    return { 
      nextIndex: currentIndex, 
      nextTrack: playlist[currentIndex] || null 
    };
  }

  let nextIndex: number;

  if (shuffle) {
    // シャッフル時はランダムに選択
    nextIndex = Math.floor(Math.random() * playlist.length);
  } else {
    // 通常時は次のインデックス
    nextIndex = currentIndex + 1;
    
    // プレイリストの最後に到達した場合
    if (nextIndex >= playlist.length) {
      if (repeat === 'all') {
        nextIndex = 0; // 最初に戻る
      } else {
        return { nextIndex: -1, nextTrack: null }; // 終了
      }
    }
  }

  return {
    nextIndex,
    nextTrack: playlist[nextIndex] || null,
  };
}

/**
 * プレイリストの前のトラックを取得（シャッフル・リピート対応）
 */
export function getPreviousTrackInPlaylist(
  currentIndex: number,
  playlist: Work[],
  shuffle: boolean = false,
  repeat: 'none' | 'one' | 'all' = 'none'
): { prevIndex: number; prevTrack: Work | null } {
  if (playlist.length === 0) {
    return { prevIndex: -1, prevTrack: null };
  }

  // リピートワンの場合は現在の曲を繰り返す
  if (repeat === 'one') {
    return { 
      prevIndex: currentIndex, 
      prevTrack: playlist[currentIndex] || null 
    };
  }

  let prevIndex: number;

  if (shuffle) {
    // シャッフル時はランダムに選択
    prevIndex = Math.floor(Math.random() * playlist.length);
  } else {
    // 通常時は前のインデックス
    prevIndex = currentIndex - 1;
    
    // プレイリストの最初に到達した場合
    if (prevIndex < 0) {
      if (repeat === 'all') {
        prevIndex = playlist.length - 1; // 最後に戻る
      } else {
        return { prevIndex: -1, prevTrack: null }; // 前の曲はない
      }
    }
  }

  return {
    prevIndex,
    prevTrack: playlist[prevIndex] || null,
  };
}