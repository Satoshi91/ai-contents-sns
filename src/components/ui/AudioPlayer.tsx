'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, RotateCcw } from 'lucide-react';

interface AudioPlayerProps {
  audioUrl: string;
  title?: string;
  className?: string;
  autoPlay?: boolean;
  showTitle?: boolean;
}

export function AudioPlayer({ 
  audioUrl, 
  title, 
  className = '',
  autoPlay = false,
  showTitle = true 
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadStart = () => {
      setIsLoading(true);
      setError(null);
    };

    const handleLoadedData = () => {
      setIsLoading(false);
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      setIsLoading(false);
      setError('音声ファイルの読み込みに失敗しました');
    };

    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [audioUrl]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || error) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleRestart = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = 0;
    setCurrentTime(0);
  };

  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-3">
          <Volume2 size={20} className="text-red-500" />
          <div>
            <p className="text-sm text-red-700 font-medium">音声再生エラー</p>
            <p className="text-xs text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
      {showTitle && title && (
        <div className="mb-3">
          <h4 className="text-sm font-medium text-gray-900 truncate">{title}</h4>
        </div>
      )}
      
      <div className="flex items-center space-x-3">
        {/* 再生/一時停止ボタン */}
        <button
          onClick={togglePlay}
          disabled={isLoading}
          className="cursor-pointer hover:bg-gray-200 transition-colors duration-200 p-2 rounded-full bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          ) : isPlaying ? (
            <Pause size={20} className="text-gray-700" />
          ) : (
            <Play size={20} className="text-gray-700" />
          )}
        </button>

        {/* プログレスバー */}
        <div className="flex-1">
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            disabled={isLoading || !!error}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: `linear-gradient(to right, #3b82f6 ${progressPercentage}%, #e5e7eb ${progressPercentage}%)`
            }}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* リスタートボタン */}
        <button
          onClick={handleRestart}
          disabled={isLoading || currentTime === 0}
          className="cursor-pointer hover:bg-gray-200 transition-colors duration-200 p-2 rounded-full bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="最初から再生"
        >
          <RotateCcw size={16} className="text-gray-700" />
        </button>
      </div>

      {/* 隠れた音声要素 */}
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        autoPlay={autoPlay}
        className="hidden"
      />
    </div>
  );
}