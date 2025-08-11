'use client';

import { useHotkeys } from 'react-hotkeys-hook';
import { useAudioPlayer } from './useAudioPlayer';

export function useKeyboardShortcuts() {
  const { 
    currentTrack, 
    togglePlay, 
    skipToNext, 
    skipToPrevious, 
    seek, 
    changeVolume, 
    currentTime, 
    duration, 
    volume,
    showMinimizedPlayer 
  } = useAudioPlayer();

  // スペースキー: 再生/停止切り替え
  useHotkeys('space', (e) => {
    e.preventDefault();
    if (currentTrack) {
      togglePlay();
    }
  }, { enableOnFormTags: false }, [currentTrack, togglePlay]);

  // 左矢印: 10秒巻き戻し
  useHotkeys('left', (e) => {
    e.preventDefault();
    if (currentTrack && duration > 0) {
      const newTime = Math.max(0, currentTime - 10);
      seek(newTime);
    }
  }, { enableOnFormTags: false }, [currentTrack, currentTime, duration, seek]);

  // 右矢印: 10秒早送り
  useHotkeys('right', (e) => {
    e.preventDefault();
    if (currentTrack && duration > 0) {
      const newTime = Math.min(duration, currentTime + 10);
      seek(newTime);
    }
  }, { enableOnFormTags: false }, [currentTrack, currentTime, duration, seek]);

  // 上矢印: 音量アップ
  useHotkeys('up', (e) => {
    e.preventDefault();
    if (currentTrack) {
      const newVolume = Math.min(1, volume + 0.1);
      changeVolume(newVolume);
    }
  }, { enableOnFormTags: false }, [currentTrack, volume, changeVolume]);

  // 下矢印: 音量ダウン
  useHotkeys('down', (e) => {
    e.preventDefault();
    if (currentTrack) {
      const newVolume = Math.max(0, volume - 0.1);
      changeVolume(newVolume);
    }
  }, { enableOnFormTags: false }, [currentTrack, volume, changeVolume]);

  // Shift + N: 次の曲
  useHotkeys('shift+n', (e) => {
    e.preventDefault();
    if (currentTrack) {
      skipToNext();
    }
  }, { enableOnFormTags: false }, [currentTrack, skipToNext]);

  // Shift + P: 前の曲
  useHotkeys('shift+p', (e) => {
    e.preventDefault();
    if (currentTrack) {
      skipToPrevious();
    }
  }, { enableOnFormTags: false }, [currentTrack, skipToPrevious]);

  // F: フルスクリーン切り替え
  useHotkeys('f', (e) => {
    e.preventDefault();
    if (currentTrack) {
      // Toggle player visibility
      showMinimizedPlayer();
    }
  }, { enableOnFormTags: false }, [currentTrack, showMinimizedPlayer]);

  // ESC: フルスクリーンを閉じる
  useHotkeys('escape', (e) => {
    e.preventDefault();
    if (currentTrack) {
      showMinimizedPlayer();
    }
  }, { enableOnFormTags: false }, [currentTrack, showMinimizedPlayer]);

  // M: ミュート切り替え
  useHotkeys('m', (e) => {
    e.preventDefault();
    if (currentTrack) {
      const newVolume = volume > 0 ? 0 : 0.7;
      changeVolume(newVolume);
    }
  }, { enableOnFormTags: false }, [currentTrack, volume, changeVolume]);

  return {
    // ショートカット情報を返す（将来のヘルプUI用）
    shortcuts: [
      { key: 'Space', description: '再生/停止' },
      { key: '←', description: '10秒巻き戻し' },
      { key: '→', description: '10秒早送り' },
      { key: '↑', description: '音量アップ' },
      { key: '↓', description: '音量ダウン' },
      { key: 'Shift + N', description: '次の曲' },
      { key: 'Shift + P', description: '前の曲' },
      { key: 'F', description: 'フルスクリーン切り替え' },
      { key: 'Esc', description: 'フルスクリーンを閉じる' },
      { key: 'M', description: 'ミュート切り替え' },
    ],
  };
}