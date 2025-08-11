'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, Music } from 'lucide-react';
import Image from 'next/image';
import { useAudioPlayer } from './hooks/useAudioPlayer';

export function PlaylistOverlay() {
  const {
    playlist,
    playlistMeta,
    currentTrack,
    isPlaying,
    showPlaylist,
    audioContext,
    startPlay,
    isTrackCurrent,
    isTrackPlaying,
  } = useAudioPlayer();

  if (!showPlaylist || playlist.length === 0) return null;

  const handleTrackClick = (track: typeof playlist[0]) => {
    if (isTrackCurrent(track.id)) {
      audioContext.togglePlay();
    } else {
      startPlay(track, playlist);
    }
  };

  const handleClose = () => {
    audioContext.setShowPlaylist(false);
  };

  const formatTime = (timeInSeconds: number): string => {
    if (!timeInSeconds || timeInSeconds === 0) return '0:00';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      {showPlaylist && (
        <>
          {/* オーバーレイ背景 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={handleClose}
          />

          {/* プレイリストパネル */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl max-h-[70vh]"
          >
            {/* ヘッダー */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {playlistMeta?.title || 'プレイリスト'}
                </h2>
                <p className="text-sm text-gray-500">
                  {playlist.length}曲
                </p>
              </div>
              <button
                onClick={handleClose}
                className="cursor-pointer hover:bg-gray-100 p-2 rounded-full transition-colors duration-200"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* トラックリスト */}
            <div className="overflow-y-auto max-h-[calc(70vh-80px)]">
              {playlist.map((track, index) => {
                const isCurrent = isTrackCurrent(track.id);
                const isCurrentPlaying = isTrackPlaying(track.id);

                return (
                  <div
                    key={track.id}
                    onClick={() => handleTrackClick(track)}
                    className={`
                      cursor-pointer flex items-center space-x-3 p-3 hover:bg-gray-50 transition-colors duration-200
                      ${isCurrent ? 'bg-blue-50' : ''}
                    `}
                  >
                    {/* インデックス番号または再生状態アイコン */}
                    <div className="w-8 flex items-center justify-center">
                      {isCurrent ? (
                        <div className="w-6 h-6 flex items-center justify-center">
                          {isCurrentPlaying ? (
                            <div className="flex items-center space-x-0.5">
                              <div className="w-0.5 h-3 bg-blue-600 rounded animate-pulse"></div>
                              <div className="w-0.5 h-4 bg-blue-600 rounded animate-pulse animation-delay-75"></div>
                              <div className="w-0.5 h-2 bg-blue-600 rounded animate-pulse animation-delay-150"></div>
                            </div>
                          ) : (
                            <Pause size={16} className="text-blue-600" />
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 font-medium">
                          {(index + 1).toString().padStart(2, '0')}
                        </span>
                      )}
                    </div>

                    {/* サムネイル */}
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                      {track.imageUrl ? (
                        <Image
                          src={track.imageUrl}
                          alt={track.title}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                          <Music size={16} className="text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* トラック情報 */}
                    <div className="flex-1 min-w-0">
                      <p className={`
                        font-medium truncate text-sm
                        ${isCurrent ? 'text-blue-600' : 'text-gray-900'}
                      `}>
                        {track.title}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {track.displayName}
                      </p>
                      {track.tags && track.tags.length > 0 && (
                        <p className="text-xs text-gray-400 truncate">
                          {typeof track.tags[0] === 'string' ? track.tags[0] : track.tags[0]?.name}
                        </p>
                      )}
                    </div>

                    {/* 再生時間 */}
                    <div className="text-xs text-gray-400 ml-2">
                      {/* Duration not available in Work type */}
                    </div>

                    {/* 再生アイコン（ホバー時） */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Play size={16} className="text-gray-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}