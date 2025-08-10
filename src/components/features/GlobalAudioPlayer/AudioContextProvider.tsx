'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type ReactH5AudioPlayer from 'react-h5-audio-player';
import { Work } from '@/types/work';
import { PlaylistMetadata } from '@/types/playlist';
import { 
  createPlaylist, 
  findTrackIndexInPlaylist,
  getNextTrackInPlaylist,
  getPreviousTrackInPlaylist
} from '@/lib/utils/playlistUtils';

interface AudioContextState {
  // 現在の作品・プレイリスト
  currentTrack: Work | null;
  playlist: Work[];
  currentIndex: number;
  
  // プレイリストメタデータ
  playlistMeta: PlaylistMetadata | null;
  
  // H5AudioPlayerインスタンス制御
  playerRef: React.RefObject<ReactH5AudioPlayer> | null;
  
  // 再生状態（H5AudioPlayerから同期）
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  
  // プレイリスト設定
  shuffle: boolean;
  repeat: 'none' | 'one' | 'all';
  autoPlay: boolean;
  
  // UI状態
  isMinimized: boolean;  // 最小化（下部バー）
  showPlaylist: boolean;
}

interface AudioContextActions {
  // プレイヤー制御
  playTrack: (track: Work, playlist?: Work[]) => void;
  playNext: () => void;
  playPrevious: () => void;
  togglePlay: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleAutoPlay: () => void;
  
  // プレイリスト管理
  addToPlaylist: (track: Work) => void;
  removeFromPlaylist: (trackId: string) => void;
  setPlaylist: (playlist: Work[], currentIndex?: number) => void;
  
  // 新しいプレイリスト機能
  playTrackFromPlaylist: (track: Work, playlist: Work[], playlistMeta: PlaylistMetadata) => void;
  setPlaylistFromWorks: (
    works: Work[], 
    metadata: Omit<PlaylistMetadata, 'audioTracks' | 'totalTracks' | 'createdAt'>,
    startTrack?: Work
  ) => void;
  getNextTrack: () => Work | null;
  getPreviousTrack: () => Work | null;
  getCurrentPlaylistPosition: () => { current: number; total: number };
  
  // UI制御
  setIsMinimized: (minimized: boolean) => void;
  setShowPlaylist: (show: boolean) => void;
  
  // プレイヤー同期
  setPlayerRef: (ref: React.RefObject<ReactH5AudioPlayer>) => void;
  updatePlayingState: (isPlaying: boolean) => void;
  updateTime: (currentTime: number, duration: number) => void;
}

type AudioContextType = AudioContextState & AudioContextActions;

const AudioContext = createContext<AudioContextType | null>(null);

interface AudioContextProviderProps {
  children: ReactNode;
}

export function AudioContextProvider({ children }: AudioContextProviderProps) {
  // 状態管理
  const [currentTrack, setCurrentTrack] = useState<Work | null>(null);
  const [playlist, setPlaylistState] = useState<Work[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playlistMeta, setPlaylistMeta] = useState<PlaylistMetadata | null>(null);
  
  const [playerRef, setPlayerRef] = useState<React.RefObject<ReactH5AudioPlayer> | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<'none' | 'one' | 'all'>('none');
  const [autoPlay, setAutoPlay] = useState(true);
  
  const [isMinimized, setIsMinimized] = useState(true);
  const [showPlaylist, setShowPlaylist] = useState(false);
  
  // プレイヤー制御アクション
  const playTrack = (track: Work, newPlaylist?: Work[]) => {
    setCurrentTrack(track);
    
    if (newPlaylist) {
      setPlaylistState(newPlaylist);
      const trackIndex = newPlaylist.findIndex(t => t.id === track.id);
      setCurrentIndex(trackIndex >= 0 ? trackIndex : 0);
    } else if (playlist.length === 0) {
      // プレイリストがない場合、単曲プレイリストを作成
      setPlaylistState([track]);
      setCurrentIndex(0);
    }
    
    setIsMinimized(true);
  };
  
  const playNext = () => {
    if (playlist.length === 0) return;
    
    const { nextIndex, nextTrack } = getNextTrackInPlaylist(
      currentIndex,
      playlist,
      shuffle,
      repeat
    );
    
    if (nextTrack && nextIndex >= 0) {
      setCurrentIndex(nextIndex);
      setCurrentTrack(nextTrack);
    }
  };
  
  const playPrevious = () => {
    if (playlist.length === 0) return;
    
    const { prevIndex, prevTrack } = getPreviousTrackInPlaylist(
      currentIndex,
      playlist,
      shuffle,
      repeat
    );
    
    if (prevTrack && prevIndex >= 0) {
      setCurrentIndex(prevIndex);
      setCurrentTrack(prevTrack);
    } else if (currentIndex === 0) {
      // プレイリストの最初のトラックの場合、0秒にジャンプ
      seekTo(0);
    }
  };
  
  const togglePlay = () => {
    if (playerRef?.current) {
      const audioElement = playerRef.current.audio.current;
      if (audioElement) {
        if (isPlaying) {
          audioElement.pause();
        } else {
          audioElement.play();
        }
      }
    }
  };
  
  const seekTo = (time: number) => {
    if (playerRef?.current) {
      const audioElement = playerRef.current.audio.current;
      if (audioElement) {
        audioElement.currentTime = time;
        setCurrentTime(time);
      }
    }
  };
  
  const setVolume = (newVolume: number) => {
    if (playerRef?.current) {
      const audioElement = playerRef.current.audio.current;
      if (audioElement) {
        audioElement.volume = newVolume;
        setVolumeState(newVolume);
      }
    }
  };

  const toggleAutoPlay = () => {
    setAutoPlay(prev => !prev);
  };
  
  // プレイリスト管理
  const addToPlaylist = (track: Work) => {
    setPlaylistState(prev => [...prev, track]);
  };
  
  const removeFromPlaylist = (trackId: string) => {
    setPlaylistState(prev => {
      const filtered = prev.filter(t => t.id !== trackId);
      // 現在再生中のトラックが削除された場合の処理
      if (currentTrack?.id === trackId) {
        if (filtered.length > 0) {
          const newIndex = Math.min(currentIndex, filtered.length - 1);
          setCurrentIndex(newIndex);
          setCurrentTrack(filtered[newIndex]);
        } else {
          setCurrentTrack(null);
          setCurrentIndex(0);
        }
      }
      return filtered;
    });
  };
  
  const setPlaylist = (newPlaylist: Work[], newCurrentIndex = 0) => {
    setPlaylistState(newPlaylist);
    setCurrentIndex(newCurrentIndex);
    if (newPlaylist.length > newCurrentIndex) {
      setCurrentTrack(newPlaylist[newCurrentIndex]);
    }
  };

  // 新しいプレイリスト機能
  const playTrackFromPlaylist = (track: Work, newPlaylist: Work[], newPlaylistMeta: PlaylistMetadata) => {
    setPlaylistState(newPlaylist);
    setPlaylistMeta(newPlaylistMeta);
    setCurrentTrack(track);
    
    const trackIndex = findTrackIndexInPlaylist(track.id, newPlaylist);
    setCurrentIndex(trackIndex >= 0 ? trackIndex : 0);
    setIsMinimized(true);
  };

  const setPlaylistFromWorks = (
    works: Work[], 
    metadata: Omit<PlaylistMetadata, 'audioTracks' | 'totalTracks' | 'createdAt'>,
    startTrack?: Work
  ) => {
    const { audioWorks, metadata: fullMetadata } = createPlaylist({
      works,
      category: metadata.category,
      title: metadata.title,
      userId: metadata.userId,
    });

    setPlaylistState(audioWorks);
    setPlaylistMeta(fullMetadata);

    if (startTrack && audioWorks.length > 0) {
      const startIndex = findTrackIndexInPlaylist(startTrack.id, audioWorks);
      if (startIndex >= 0) {
        setCurrentIndex(startIndex);
        setCurrentTrack(startTrack);
      } else {
        setCurrentIndex(0);
        setCurrentTrack(audioWorks[0]);
      }
    } else if (audioWorks.length > 0) {
      setCurrentIndex(0);
      setCurrentTrack(audioWorks[0]);
    }

    setIsMinimized(true);
  };

  const getNextTrack = (): Work | null => {
    if (playlist.length === 0) return null;
    
    const { nextTrack } = getNextTrackInPlaylist(
      currentIndex,
      playlist,
      shuffle,
      repeat
    );
    
    return nextTrack;
  };

  const getPreviousTrack = (): Work | null => {
    if (playlist.length === 0) return null;
    
    const { prevTrack } = getPreviousTrackInPlaylist(
      currentIndex,
      playlist,
      shuffle,
      repeat
    );
    
    return prevTrack;
  };

  const getCurrentPlaylistPosition = (): { current: number; total: number } => {
    return {
      current: currentIndex + 1, // 1-indexed for user display
      total: playlist.length,
    };
  };
  
  
  // プレイヤー同期
  const updatePlayingState = (playing: boolean) => {
    setIsPlaying(playing);
  };
  
  const updateTime = (time: number, dur: number) => {
    setCurrentTime(time);
    setDuration(dur);
  };
  
  const contextValue: AudioContextType = {
    // State
    currentTrack,
    playlist,
    currentIndex,
    playlistMeta,
    playerRef,
    isPlaying,
    currentTime,
    duration,
    volume,
    shuffle,
    repeat,
    autoPlay,
    isMinimized,
    showPlaylist,
    
    // Actions
    playTrack,
    playNext,
    playPrevious,
    togglePlay,
    seekTo,
    setVolume,
    toggleAutoPlay,
    addToPlaylist,
    removeFromPlaylist,
    setPlaylist,
    
    // New playlist actions
    playTrackFromPlaylist,
    setPlaylistFromWorks,
    getNextTrack,
    getPreviousTrack,
    getCurrentPlaylistPosition,
    
    // UI control
    setIsMinimized,
    setShowPlaylist,
    setPlayerRef,
    updatePlayingState,
    updateTime,
  };
  
  return (
    <AudioContext.Provider value={contextValue}>
      {children}
    </AudioContext.Provider>
  );
}

export const useAudioContext = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudioContext must be used within AudioContextProvider');
  }
  return context;
};