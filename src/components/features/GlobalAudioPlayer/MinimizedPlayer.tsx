'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import H5AudioPlayer from 'react-h5-audio-player';
import { List, SkipBack, SkipForward, Volume2, Repeat, X } from 'lucide-react';
import Image from 'next/image';
import { useAudioContext } from './AudioContextProvider';

export function MinimizedPlayer() {
  const {
    currentTrack,
    playlistMeta,
    isPlaying,
    currentTime,
    duration,
    volume,
    autoPlay,
    audioContext,
    seek,
    changeVolume,
    toggleAutoPlay,
    getCurrentPlaylistPosition,
  } = useAudioPlayer();
  
  const isLoading = duration === 0;
  
  const playerRef = useRef<H5AudioPlayer>(null);
  
  // プレイヤーの参照をコンテキストに設定
  useEffect(() => {
    if (playerRef.current) {
      audioContext.setPlayerRef(playerRef);
    }
  }, [audioContext]);
  
  // プレイヤーの状態変化を監視
  const handlePlay = () => {
    audioContext.updatePlayingState(true);
  };
  
  const handlePause = () => {
    audioContext.updatePlayingState(false);
  };
  
  const handleLoadedData = () => {
    if (playerRef.current) {
      const audioElement = playerRef.current.audio.current;
      if (audioElement) {
        audioContext.updateTime(audioElement.currentTime, audioElement.duration);
      }
    }
  };
  
  const handleTimeUpdate = () => {
    if (playerRef.current) {
      const audioElement = playerRef.current.audio.current;
      if (audioElement) {
        audioContext.updateTime(audioElement.currentTime, audioElement.duration);
      }
    }
  };
  
  const handleEnded = () => {
    if (autoPlay) {
      audioContext.playNext();
    }
  };
  
  // 時間フォーマット関数
  const formatTime = (timeInSeconds: number): string => {
    if (!timeInSeconds || timeInSeconds === 0) return '0:00';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // プログレス計算
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
  
  // プログレスバークリックハンドラー
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const progressPercent = clickX / rect.width;
    const newTime = progressPercent * duration;
    
    seek(newTime);
  };
  
  if (!currentTrack) return null;
  
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ 
        type: "spring", 
        damping: 25, 
        stiffness: 200,
        opacity: { duration: 0.2 }
      }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg backdrop-blur-sm"
    >
      {/* プログレスバー */}
      <div 
        className="w-full h-1 bg-gray-200 cursor-pointer hover:h-2 transition-all duration-150"
        onClick={!isLoading ? handleProgressClick : undefined}
      >
        {isLoading ? (
          <div className="h-full bg-blue-300 animate-pulse w-1/4"></div>
        ) : (
          <div 
            className="h-full bg-blue-500 transition-all duration-150"
            style={{ width: `${progressPercentage}%` }}
          />
        )}
      </div>
      
      <div className="flex items-center h-14 sm:h-16 px-2 sm:px-4 space-x-2 sm:space-x-4">
        {/* 作品情報エリア */}
        <div 
          className="flex items-center space-x-2 sm:space-x-3 p-1 sm:p-2 rounded-lg min-w-0 flex-1"
        >
          {/* サムネイル */}
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0">
            {currentTrack.imageUrl ? (
              <Image
                src={currentTrack.imageUrl}
                alt={currentTrack.title}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                <span className="text-gray-400 text-xs">♪</span>
              </div>
            )}
          </div>
          
          {/* タイトル・作者情報 */}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 truncate">
              {currentTrack.title}
            </p>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span className="truncate">{currentTrack.displayName}</span>
              {playlistMeta && (
                <>
                  <span>•</span>
                  <span className="truncate">{playlistMeta.title}</span>
                  {(() => {
                    const { current, total } = getCurrentPlaylistPosition();
                    return total > 1 && (
                      <>
                        <span>•</span>
                        <span className="whitespace-nowrap">{current}/{total}</span>
                      </>
                    );
                  })()}
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* 隠れたH5AudioPlayer */}
        <div className="hidden">
          <H5AudioPlayer
            ref={playerRef}
            src={currentTrack.audioUrl}
            autoPlay
            volume={0.7}
            onPlay={handlePlay}
            onPause={handlePause}
            onLoadedData={handleLoadedData}
            onListen={handleTimeUpdate}
            onEnded={handleEnded}
            showJumpControls={false}
            showSkipControls={false}
            showDownloadProgress={false}
            showFilledProgress={false}
            customProgressBarSection={[]}
            customControlsSection={[]}
            customVolumeControls={[]}
            customAdditionalControls={[]}
            layout="horizontal"
          />
        </div>
        
        {/* 基本コントロール */}
        <div className="flex items-center space-x-0.5 sm:space-x-1">
          {/* 前へボタン */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              audioContext.playPrevious();
            }}
            className="cursor-pointer hover:bg-gray-100 transition-colors duration-200 p-1.5 sm:p-2 rounded-full"
          >
            <SkipBack size={18} className="text-gray-700 sm:w-5 sm:h-5" />
          </button>
          
          {/* 再生/停止ボタン */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              audioContext.togglePlay();
            }}
            className="cursor-pointer hover:bg-blue-100 transition-colors duration-200 p-1.5 sm:p-2 rounded-full bg-blue-50"
          >
            {isPlaying ? (
              <div className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                <div className="w-0.5 h-3 sm:w-1 sm:h-4 bg-blue-600 rounded mx-0.5"></div>
                <div className="w-0.5 h-3 sm:w-1 sm:h-4 bg-blue-600 rounded mx-0.5"></div>
              </div>
            ) : (
              <div className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                <div className="w-0 h-0 border-l-[6px] sm:border-l-[8px] border-l-blue-600 border-t-[4px] sm:border-t-[6px] border-t-transparent border-b-[4px] sm:border-b-[6px] border-b-transparent ml-0.5 sm:ml-1"></div>
              </div>
            )}
          </button>
          
          {/* 次へボタン */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              audioContext.playNext();
            }}
            className="cursor-pointer hover:bg-gray-100 transition-colors duration-200 p-1.5 sm:p-2 rounded-full"
          >
            <SkipForward size={18} className="text-gray-700 sm:w-5 sm:h-5" />
          </button>
        </div>
        
        {/* 時間表示 */}
        <div className="hidden sm:flex items-center text-xs text-gray-500 min-w-fit">
          {isLoading ? (
            <div className="flex items-center space-x-1">
              <div className="w-8 h-3 bg-gray-200 rounded animate-pulse"></div>
              <span>/</span>
              <div className="w-8 h-3 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ) : (
            <>
              <span>{formatTime(currentTime)}</span>
              <span className="mx-1">/</span>
              <span>{formatTime(duration)}</span>
            </>
          )}
        </div>
        
        {/* 右側コントロール */}
        <div className="flex items-center space-x-2">
          {/* 音量コントロール */}
          <div className="hidden md:flex items-center space-x-2">
            <button className="cursor-pointer hover:bg-gray-100 transition-colors duration-200 p-2 rounded-full">
              <Volume2 size={18} className="text-gray-700" />
            </button>
            <div className="w-16 h-1 bg-gray-200 rounded-full cursor-pointer relative group">
              <div 
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${volume * 100}%` }}
              />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => changeVolume(parseFloat(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>
          
          {/* 自動再生スイッチ */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleAutoPlay();
            }}
            className={`cursor-pointer transition-colors duration-200 p-2 rounded-full ${
              autoPlay ? 'bg-blue-100 hover:bg-blue-200' : 'hover:bg-gray-100'
            }`}
            title={autoPlay ? '自動再生: オン' : '自動再生: オフ'}
          >
            <Repeat size={18} className={autoPlay ? 'text-blue-600' : 'text-gray-700'} />
          </button>
          
          {/* プレイリストボタン */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              audioContext.setShowPlaylist(!audioContext.showPlaylist);
            }}
            className="cursor-pointer hover:bg-gray-100 transition-colors duration-200 p-2 rounded-full"
          >
            <List size={18} className="text-gray-700" />
          </button>
          
          {/* 閉じるボタン */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              audioContext.closePlayer();
            }}
            className="cursor-pointer hover:bg-gray-200 transition-colors duration-200 p-2 rounded-full"
            title="プレーヤーを閉じる"
          >
            <X size={18} className="text-gray-600" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// useAudioPlayerフック
// ... (useAudioPlayerの実装は別ファイルにあると仮定)
// ... (この例では、コンテキストから直接必要な値と関数を取得)
// ... (実際のプロジェクトでは useAudioPlayer フックにロジックが集約されている)
// ... (このファイルの末尾に useAudioPlayer の仮実装を配置)

// useAudioPlayerフックの仮実装
// 実際のプロジェクトでは `src/components/features/GlobalAudioPlayer/hooks/useAudioPlayer.ts` にある
const useAudioPlayer = () => {
  const audioContext = useAudioContext();
  
  const seek = (time: number) => {
    audioContext.seekTo(time);
  };
  
  const changeVolume = (newVolume: number) => {
    audioContext.setVolume(newVolume);
  };
  
  return {
    ...audioContext,
    audioContext,
    seek,
    changeVolume,
  };
};
