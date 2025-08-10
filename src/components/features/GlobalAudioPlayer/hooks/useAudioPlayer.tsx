'use client';

import { useCallback } from 'react';
import { useAudioContext } from '../AudioContextProvider';
import { Work } from '@/types/work';

export function useAudioPlayer() {
  const audioContext = useAudioContext();
  
  // 作品を再生開始する（従来の単純再生）
  const startPlay = useCallback((track: Work, playlist?: Work[]) => {
    audioContext.playTrack(track, playlist);
  }, [audioContext]);
  
  // プレイリスト付きで作品を再生開始する（新機能）
  const startPlayWithPlaylist = useCallback((
    track: Work, 
    works: Work[], 
    playlistTitle: string,
    category: import('@/types/worksSection').WorksCategory,
    userId?: string
  ) => {
    audioContext.setPlaylistFromWorks(
      works,
      {
        category,
        title: playlistTitle,
        id: `${category}-${userId || 'all'}`,
        userId,
      },
      track
    );
  }, [audioContext]);
  
  // 現在の作品の再生/停止を切り替え
  const togglePlay = useCallback(() => {
    audioContext.togglePlay();
  }, [audioContext]);
  
  // 次の作品に移動
  const skipToNext = useCallback(() => {
    audioContext.playNext();
  }, [audioContext]);
  
  // 前の作品に移動
  const skipToPrevious = useCallback(() => {
    audioContext.playPrevious();
  }, [audioContext]);
  
  // 指定時間にシーク
  const seek = useCallback((time: number) => {
    audioContext.seekTo(time);
  }, [audioContext]);
  
  // 音量調整
  const changeVolume = useCallback((volume: number) => {
    audioContext.setVolume(Math.max(0, Math.min(1, volume)));
  }, [audioContext]);

  const toggleAutoPlay = useCallback(() => {
    audioContext.toggleAutoPlay();
  }, [audioContext]);
  
  // プレイヤーUI表示状態制御
  const showMinimizedPlayer = useCallback(() => {
    audioContext.setIsMinimized(true);
  }, [audioContext]);
  
  
  // プレイリスト操作
  const addTrackToPlaylist = useCallback((track: Work) => {
    audioContext.addToPlaylist(track);
  }, [audioContext]);
  
  const removeTrackFromPlaylist = useCallback((trackId: string) => {
    audioContext.removeFromPlaylist(trackId);
  }, [audioContext]);
  
  // 特定のトラックが現在再生中かを判定
  const isTrackPlaying = useCallback((trackId: string) => {
    return audioContext.currentTrack?.id === trackId && audioContext.isPlaying;
  }, [audioContext.currentTrack?.id, audioContext.isPlaying]);
  
  // 特定のトラックが現在選択されているかを判定
  const isTrackCurrent = useCallback((trackId: string) => {
    return audioContext.currentTrack?.id === trackId;
  }, [audioContext.currentTrack?.id]);
  
  return {
    // State
    currentTrack: audioContext.currentTrack,
    playlist: audioContext.playlist,
    playlistMeta: audioContext.playlistMeta,
    isPlaying: audioContext.isPlaying,
    currentTime: audioContext.currentTime,
    duration: audioContext.duration,
    volume: audioContext.volume,
    autoPlay: audioContext.autoPlay,
    isMinimized: audioContext.isMinimized,
    showPlaylist: audioContext.showPlaylist,
    
    // Actions
    startPlay,
    startPlayWithPlaylist, // 新機能
    togglePlay,
    skipToNext,
    skipToPrevious,
    seek,
    changeVolume,
    toggleAutoPlay,
    showMinimizedPlayer,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    
    // New playlist utilities
    getNextTrack: audioContext.getNextTrack,
    getPreviousTrack: audioContext.getPreviousTrack,
    getCurrentPlaylistPosition: audioContext.getCurrentPlaylistPosition,
    
    // Utilities
    isTrackPlaying,
    isTrackCurrent,
    
    // Direct access to context for advanced usage
    audioContext,
  };
}