'use client';

import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { MinimizedPlayer } from './MinimizedPlayer';
import { PlaylistOverlay } from './PlaylistOverlay';

export function PlayerContainer() {
  const { 
    currentTrack, 
    isMinimized 
  } = useAudioPlayer();
  
  // キーボードショートカット有効化
  useKeyboardShortcuts();
  
  // 現在再生中のトラックがない場合は何も表示しない
  if (!currentTrack) {
    return null;
  }
  
  return (
    <>
      {/* 最小化プレイヤー（下部固定バー） */}
      {isMinimized && <MinimizedPlayer />}
      
      {/* プレイリストオーバーレイ */}
      <PlaylistOverlay />
    </>
  );
}