"use client";

import type React from "react";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
  Maximize2,
} from "lucide-react";
import { motion } from "framer-motion";

interface MediaDisplayProps {
  media?: {
    type: string;
    url: string;
  };
  alt?: string;
  className?: string;
  showControls?: boolean;
}

export function MediaDisplay({
  media,
  alt = "Media content",
  className = "",
  showControls = true,
}: MediaDisplayProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Store media state to prevent loss during re-renders
  const mediaStateRef = useRef({
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: false,
    isPlaying: false,
  });

  // Initialize media state from ref to preserve across re-renders
  useEffect(() => {
    if (mediaStateRef.current.currentTime > 0) {
      setCurrentTime(mediaStateRef.current.currentTime);
      setDuration(mediaStateRef.current.duration);
      setVolume(mediaStateRef.current.volume);
      setIsMuted(mediaStateRef.current.isMuted);
      setIsPlaying(mediaStateRef.current.isPlaying);
    }
  }, []);

  // Update ref when state changes to preserve across re-renders
  useEffect(() => {
    mediaStateRef.current = {
      currentTime,
      duration,
      volume,
      isMuted,
      isPlaying,
    };
  }, [currentTime, duration, volume, isMuted, isPlaying]);

  // Setup media event listeners only once when component mounts
  useEffect(() => {
    const mediaElement = mediaRef.current;
    if (!mediaElement) return;

    const handleTimeUpdate = () => {
      const newTime = mediaElement.currentTime;
      setCurrentTime(newTime);
      mediaStateRef.current.currentTime = newTime;
    };

    const handleLoadedMetadata = () => {
      const newDuration = mediaElement.duration;
      setDuration(newDuration);
      mediaStateRef.current.duration = newDuration;

      // Restore previous time if available
      if (
        mediaStateRef.current.currentTime > 0 &&
        mediaStateRef.current.currentTime < newDuration
      ) {
        mediaElement.currentTime = mediaStateRef.current.currentTime;
        setCurrentTime(mediaStateRef.current.currentTime);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      mediaStateRef.current.isPlaying = false;
    };

    const handleVolumeChange = () => {
      const newVolume = mediaElement.volume;
      setVolume(newVolume);
      mediaStateRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
      mediaStateRef.current.isMuted = newVolume === 0;
    };

    // Add event listeners
    mediaElement.addEventListener("timeupdate", handleTimeUpdate);
    mediaElement.addEventListener("loadedmetadata", handleLoadedMetadata);
    mediaElement.addEventListener("ended", handleEnded);
    mediaElement.addEventListener("volumechange", handleVolumeChange);

    // Restore previous state if available
    if (mediaStateRef.current.volume !== 1) {
      mediaElement.volume = mediaStateRef.current.volume;
      setVolume(mediaStateRef.current.volume);
    }

    return () => {
      mediaElement.removeEventListener("timeupdate", handleTimeUpdate);
      mediaElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
      mediaElement.removeEventListener("ended", handleEnded);
      mediaElement.removeEventListener("volumechange", handleVolumeChange);
    };
  }, []); // Empty dependency array - only run once

  const togglePlayPause = useCallback(() => {
    const mediaElement = mediaRef.current;
    if (!mediaElement) return;

    if (isPlaying) {
      mediaElement.pause();
      setIsPlaying(false);
      mediaStateRef.current.isPlaying = false;
    } else {
      mediaElement.play();
      setIsPlaying(true);
      mediaStateRef.current.isPlaying = true;
    }
  }, [isPlaying]);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const mediaElement = mediaRef.current;
    if (!mediaElement) return;

    const time = Number.parseFloat(e.target.value);
    mediaElement.currentTime = time;
    setCurrentTime(time);
    mediaStateRef.current.currentTime = time;
  }, []);

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const mediaElement = mediaRef.current;
      if (!mediaElement) return;

      const newVolume = Number.parseFloat(e.target.value);
      mediaElement.volume = newVolume;
      setVolume(newVolume);
      mediaStateRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
      mediaStateRef.current.isMuted = newVolume === 0;
    },
    []
  );

  const toggleMute = useCallback(() => {
    const mediaElement = mediaRef.current;
    if (!mediaElement) return;

    if (isMuted) {
      const prevVolume =
        mediaStateRef.current.volume > 0 ? mediaStateRef.current.volume : 1;
      mediaElement.volume = prevVolume;
      setVolume(prevVolume);
      mediaStateRef.current.volume = prevVolume;
      setIsMuted(false);
      mediaStateRef.current.isMuted = false;
    } else {
      mediaElement.volume = 0;
      setVolume(0);
      mediaStateRef.current.volume = 0;
      setIsMuted(true);
      mediaStateRef.current.isMuted = true;
    }
  }, [isMuted]);

  const resetMedia = useCallback(() => {
    const mediaElement = mediaRef.current;
    if (!mediaElement) return;

    mediaElement.currentTime = 0;
    setCurrentTime(0);
    mediaStateRef.current.currentTime = 0;
    setIsPlaying(false);
    mediaStateRef.current.isPlaying = false;
    mediaElement.pause();
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  const formatTime = useCallback((time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, []);

  const getProgressPercentage = useCallback(() => {
    return duration > 0 ? (currentTime / duration) * 100 : 0;
  }, [currentTime, duration]);

  if (!media?.url) {
    return (
      <div
        className={`bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex items-center justify-center ${className}`}
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-3">
            <span className="text-2xl">📄</span>
          </div>
          <span className="text-gray-500 text-sm font-medium">
            No media available
          </span>
        </div>
      </div>
    );
  }

  // Determine media type from URL or explicit type
  const getMediaType = useCallback(() => {
    if (media.type) {
      if (media.type.startsWith("audio")) return "audio";
      if (media.type.startsWith("video")) return "video";
      if (media.type.startsWith("image")) return "image";
    }

    // Fallback to URL extension detection
    const url = media.url.toLowerCase();
    if (
      url.includes(".mp3") ||
      url.includes(".wav") ||
      url.includes(".ogg") ||
      url.includes(".m4a")
    )
      return "audio";
    if (
      url.includes(".mp4") ||
      url.includes(".webm") ||
      url.includes(".mov") ||
      url.includes(".avi")
    )
      return "video";
    if (
      url.includes(".jpg") ||
      url.includes(".jpeg") ||
      url.includes(".png") ||
      url.includes(".gif") ||
      url.includes(".webp")
    )
      return "image";

    return "image"; // Default fallback
  }, [media.type, media.url]);

  const mediaType = getMediaType();

  // Image Display
  if (mediaType === "image") {
    return (
      <div
        ref={containerRef}
        className={`relative overflow-hidden rounded-2xl bg-white border border-gray-200 ${className}`}
      >
        <motion.img
          src={media.url}
          alt={alt}
          className="w-full h-full object-contain"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src =
              "/placeholder.svg?height=400&width=400&text=Image+Not+Found";
          }}
        />
        {/* Đổi motion.button thành motion.div để tránh button lồng button */}
        {showControls && (
          <motion.div
            onClick={toggleFullscreen}
            role="button"
            tabIndex={0}
            className="absolute top-3 right-3 bg-black/50 text-white p-2 rounded-full opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Maximize2 className="h-4 w-4" />
          </motion.div>
        )}
      </div>
    );
  }

  // Audio Display
  if (mediaType === "audio") {
    return (
      <div
        ref={containerRef}
        className={`bg-[#F6FCFE] rounded-2xl border border-gray-200 p-6 flex items-center justify-center min-h-[100px] ${className}`}
      >
        <audio
          ref={mediaRef as React.RefObject<HTMLAudioElement>}
          src={media.url}
          preload="metadata"
        />
        <div className="flex flex-col w-full items-center justify-center">
          {showControls && (
            <>
              {/* Progress Bar */}
              <div className="space-y-2 w-full">
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  step="any"
                  onChange={handleSeek}
                />
              </div>
              {/* Controls */}
              <div className="flex items-center justify-center space-x-4 mt-0 w-full">
                <motion.button
                  onClick={togglePlayPause}
                  className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors shadow-lg"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {isPlaying ? (
                    <Pause className="h-6 w-6" />
                  ) : (
                    <Play className="h-6 w-6 ml-1" />
                  )}
                </motion.button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Video Display
  if (mediaType === "video") {
    return (
      <div
        ref={containerRef}
        className={`relative bg-white rounded-2xl border border-gray-200 overflow-hidden ${className}`}
      >
        <video
          ref={mediaRef as React.RefObject<HTMLVideoElement>}
          src={media.url}
          className="w-full h-full object-contain"
          preload="metadata"
          onClick={togglePlayPause}
        />

        {showControls && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            {/* Progress Bar */}
            <div className="mb-3">
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${getProgressPercentage()}%, rgba(255,255,255,0.3) ${getProgressPercentage()}%, rgba(255,255,255,0.3) 100%)`,
                }}
              />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <motion.button
                  onClick={togglePlayPause}
                  className="p-2 text-white hover:text-blue-400 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {isPlaying ? (
                    <Pause className="h-6 w-6" />
                  ) : (
                    <Play className="h-6 w-6" />
                  )}
                </motion.button>

                <motion.button
                  onClick={resetMedia}
                  className="p-2 text-white hover:text-blue-400 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <RotateCcw className="h-5 w-5" />
                </motion.button>

                <div className="flex items-center space-x-2">
                  <motion.button
                    onClick={toggleMute}
                    className="p-1 text-white hover:text-blue-400 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {isMuted ? (
                      <VolumeX className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </motion.button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-16 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-white text-sm">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
                <motion.button
                  onClick={toggleFullscreen}
                  className="p-2 text-white hover:text-blue-400 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Maximize2 className="h-4 w-4" />
                </motion.button>
              </div>
            </div>
          </div>
        )}

        {/* Play overlay for paused video */}
        {!isPlaying && showControls && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-black/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.button
              onClick={togglePlayPause}
              className="p-4 bg-white/20 backdrop-blur-sm text-white rounded-full hover:bg-white/30 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Play className="h-12 w-12 ml-1" />
            </motion.button>
          </motion.div>
        )}
      </div>
    );
  }

  return null;
}
