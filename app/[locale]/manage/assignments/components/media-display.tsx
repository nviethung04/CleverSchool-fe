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
import { motion, AnimatePresence } from "framer-motion";
import { Howl } from "howler";

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
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showControlsTimeout, setShowControlsTimeout] =
    useState<NodeJS.Timeout | null>(null);

  // Howler.js refs - CHỈ cho audio
  const howlRef = useRef<Howl | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Store media state to prevent loss during re-renders
  const mediaStateRef = useRef({
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: false,
    isPlaying: false,
  });

  // Determine media type from URL or explicit type
  const getMediaType = useCallback(() => {
    if (media?.type) {
      if (media.type.startsWith("audio")) return "audio";
      if (media.type.startsWith("video")) return "video";
      if (media.type.startsWith("image")) return "image";
    }

    const url = media?.url.toLowerCase();
    if (
      url?.includes(".mp3") ||
      url?.includes(".wav") ||
      url?.includes(".ogg") ||
      url?.includes(".m4a")
    )
      return "audio";
    if (
      url?.includes(".mp4") ||
      url?.includes(".webm") ||
      url?.includes(".mov") ||
      url?.includes(".avi")
    )
      return "video";
    if (
      url?.includes(".jpg") ||
      url?.includes(".jpeg") ||
      url?.includes(".png") ||
      url?.includes(".gif") ||
      url?.includes(".webp")
    )
      return "image";

    return "image";
  }, [media?.type, media?.url]);

  const mediaType = getMediaType();

  // ============ HOWLER.JS SETUP FOR AUDIO ============
  useEffect(() => {
    // CHỈ dùng Howler cho audio
    if (mediaType !== "audio" || !media?.url) return;

    // Cleanup Howler cũ
    if (howlRef.current) {
      howlRef.current.unload();
      howlRef.current = null;
    }

    // Clear progress interval
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    // Reset states
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    // Tạo Howl instance mới
    const sound = new Howl({
      src: [media.url],
      html5: true, // Dùng HTML5 Audio (tốt hơn cho streaming)
      preload: true,
      volume: volume,
      onload: function() {
        const dur = sound.duration();
        setDuration(dur);
        console.log('Audio loaded, duration:', dur);
      },
      onplay: function() {
        setIsPlaying(true);
        
        // Update progress mỗi 100ms
        progressIntervalRef.current = setInterval(() => {
          if (sound.playing()) {
            const current = sound.seek();
            setCurrentTime(typeof current === 'number' ? current : 0);
          }
        }, 100);
      },
      onpause: function() {
        setIsPlaying(false);
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
      },
      onend: function() {
        setIsPlaying(false);
        setCurrentTime(0);
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
      },
      onstop: function() {
        setIsPlaying(false);
        setCurrentTime(0);
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
      },
      onloaderror: function(id, error) {
        console.error('Howler load error:', error);
      },
      onplayerror: function(id, error) {
        console.error('Howler play error:', error);
        // Unlock audio on iOS - thử play lại sau user interaction
        sound.once('unlock', function() {
          sound.play();
        });
      }
    });

    howlRef.current = sound;

    // Cleanup khi unmount hoặc URL thay đổi
    return () => {
      if (sound) {
        sound.unload();
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [media?.url, mediaType]);

  // Update Howler volume khi state thay đổi
  useEffect(() => {
    if (howlRef.current && mediaType === "audio") {
      howlRef.current.volume(isMuted ? 0 : volume);
    }
  }, [volume, isMuted, mediaType]);

  // ============ RESET CONTROLS TIMER ============
  const resetControlsTimer = useCallback(() => {
    if (showControlsTimeout) {
      clearTimeout(showControlsTimeout);
    }

    setIsHovered(true);

    if (isPlaying) {
      const timeout = setTimeout(() => {
        setIsHovered(false);
      }, 3000);

      setShowControlsTimeout(timeout);
    }
  }, [isPlaying, showControlsTimeout]);

  useEffect(() => {
    return () => {
      if (showControlsTimeout) {
        clearTimeout(showControlsTimeout);
      }
    };
  }, [showControlsTimeout]);

  useEffect(() => {
    if (isPlaying) {
      resetControlsTimer();
    } else {
      if (showControlsTimeout) {
        clearTimeout(showControlsTimeout);
      }
      setIsHovered(true);
    }
  }, [isPlaying]);

  // ============ VIDEO HANDLING (giữ nguyên) ============
  useEffect(() => {
    const mediaElement = mediaRef.current;
    // CHỈ áp dụng cho video (audio dùng Howler)
    if (!mediaElement || mediaType !== "video") return;

    const handleTimeUpdate = () => {
      const newTime = mediaElement.currentTime;
      setCurrentTime(newTime);
      mediaStateRef.current.currentTime = newTime;
    };

    const handleLoadedMetadata = () => {
      const newDuration = mediaElement.duration;
      setDuration(newDuration);
      mediaStateRef.current.duration = newDuration;

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

    const handlePlay = () => {
      setIsPlaying(true);
      mediaStateRef.current.isPlaying = true;
    };

    const handlePause = () => {
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

    mediaElement.addEventListener("timeupdate", handleTimeUpdate);
    mediaElement.addEventListener("loadedmetadata", handleLoadedMetadata);
    mediaElement.addEventListener("ended", handleEnded);
    mediaElement.addEventListener("play", handlePlay);
    mediaElement.addEventListener("pause", handlePause);
    mediaElement.addEventListener("volumechange", handleVolumeChange);

    if (mediaStateRef.current.volume !== 1) {
      mediaElement.volume = mediaStateRef.current.volume;
      setVolume(mediaStateRef.current.volume);
    }

    return () => {
      mediaElement.removeEventListener("timeupdate", handleTimeUpdate);
      mediaElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
      mediaElement.removeEventListener("ended", handleEnded);
      mediaElement.removeEventListener("play", handlePlay);
      mediaElement.removeEventListener("pause", handlePause);
      mediaElement.removeEventListener("volumechange", handleVolumeChange);
    };
  }, [mediaType]);

  // ============ TOGGLE PLAY/PAUSE ============
  const togglePlayPause = useCallback(() => {
    const currentMediaType = getMediaType();

    // Xử lý AUDIO với Howler
    if (currentMediaType === "audio" && howlRef.current) {
      if (isPlaying) {
        howlRef.current.pause();
      } else {
        howlRef.current.play();
      }
      return;
    }

    // Xử lý VIDEO với HTML5
    const mediaElement = mediaRef.current;
    if (!mediaElement) return;

    if (isPlaying) {
      mediaElement.pause();
      setIsPlaying(false);
      mediaStateRef.current.isPlaying = false;
    } else {
      const playPromise = mediaElement.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            mediaStateRef.current.isPlaying = true;
          })
          .catch((error) => {
            console.error("Play error:", error);
            setIsPlaying(false);
          });
      }
    }
  }, [isPlaying, getMediaType]);

  // ============ SEEK ============
  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number.parseFloat(e.target.value);
    const currentMediaType = getMediaType();

    // AUDIO với Howler
    if (currentMediaType === "audio" && howlRef.current) {
      howlRef.current.seek(time);
      setCurrentTime(time);
      return;
    }

    // VIDEO với HTML5
    const mediaElement = mediaRef.current;
    if (!mediaElement) return;

    mediaElement.currentTime = time;
    setCurrentTime(time);
    mediaStateRef.current.currentTime = time;
  }, [getMediaType]);

  // ============ VOLUME CHANGE ============
  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVolume = Number.parseFloat(e.target.value);
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
      mediaStateRef.current.volume = newVolume;
      mediaStateRef.current.isMuted = newVolume === 0;

      const currentMediaType = getMediaType();

      // AUDIO với Howler
      if (currentMediaType === "audio" && howlRef.current) {
        howlRef.current.volume(newVolume);
        return;
      }

      // VIDEO với HTML5
      const mediaElement = mediaRef.current;
      if (mediaElement) {
        mediaElement.volume = newVolume;
      }
    },
    [getMediaType]
  );

  // ============ TOGGLE MUTE ============
  const toggleMute = useCallback(() => {
    const currentMediaType = getMediaType();

    if (isMuted) {
      const prevVolume =
        mediaStateRef.current.volume > 0 ? mediaStateRef.current.volume : 1;
      setVolume(prevVolume);
      setIsMuted(false);
      mediaStateRef.current.volume = prevVolume;
      mediaStateRef.current.isMuted = false;

      // AUDIO với Howler
      if (currentMediaType === "audio" && howlRef.current) {
        howlRef.current.volume(prevVolume);
        return;
      }

      // VIDEO với HTML5
      const mediaElement = mediaRef.current;
      if (mediaElement) {
        mediaElement.volume = prevVolume;
      }
    } else {
      setVolume(0);
      setIsMuted(true);
      mediaStateRef.current.volume = 0;
      mediaStateRef.current.isMuted = true;

      // AUDIO với Howler
      if (currentMediaType === "audio" && howlRef.current) {
        howlRef.current.volume(0);
        return;
      }

      // VIDEO với HTML5
      const mediaElement = mediaRef.current;
      if (mediaElement) {
        mediaElement.volume = 0;
      }
    }
  }, [isMuted, getMediaType]);

  // ============ FULLSCREEN ============
  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as any;
      const fullscreenElement =
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement;

      if (!fullscreenElement) {
        setIsFullscreen(false);
      } else if (
        (containerRef.current && fullscreenElement === containerRef.current) ||
        (mediaRef.current && fullscreenElement === mediaRef.current)
      ) {
        setIsFullscreen(true);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "MSFullscreenChange",
        handleFullscreenChange
      );
    };
  }, []);

  const toggleFullscreen = useCallback(() => {
    const element = (mediaRef.current || containerRef.current) as any;
    if (!element) return;

    if (!isFullscreen) {
      if (element.requestFullscreen) {
        element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
      } else if (element.webkitEnterFullscreen) {
        element.webkitEnterFullscreen();
      } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
      } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
      }
    } else {
      const doc = document as any;
      if (doc.exitFullscreen) {
        doc.exitFullscreen();
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      } else if (doc.mozCancelFullScreen) {
        doc.mozCancelFullScreen();
      } else if (doc.msExitFullscreen) {
        doc.msExitFullscreen();
      } else if (element.webkitExitFullscreen) {
        element.webkitExitFullscreen();
      }
    }
  }, [isFullscreen]);

  // ============ UTILITY FUNCTIONS ============
  const formatTime = useCallback((time: number) => {
    if (!isFinite(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, []);

  const getProgressPercentage = useCallback(() => {
    return duration > 0 ? (currentTime / duration) * 100 : 0;
  }, [currentTime, duration]);

  useEffect(() => {
    const checkDevice = () => {
      const isMobileDevice =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );
      const isMobileScreen = window.innerWidth <= 768;
      const newIsMobile = isMobileDevice || isMobileScreen;

      setIsMobile(newIsMobile);

      if (newIsMobile) {
        setVolume(1);
        mediaStateRef.current.volume = 1;
        if (mediaRef.current) {
          mediaRef.current.volume = 1;
        }
        // Howler volume sẽ được update qua useEffect khác
      }
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);

    return () => {
      window.removeEventListener("resize", checkDevice);
    };
  }, []);

  // ============ RENDER ============
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

  // IMAGE
  if (mediaType === "image") {
    return (
      <div
        ref={containerRef}
        className={`relative overflow-hidden rounded-2xl ${className}`}
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

  // AUDIO - với Howler.js (KHÔNG cần audio element)
  if (mediaType === "audio") {
    return (
      <div
        ref={containerRef}
        className={`w-full bg-white p-2 ${className}`}
      >
        {showControls && (
          <div className="flex items-center gap-4">
            <motion.button
              onClick={togglePlayPause}
              className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex-shrink-0"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </motion.button>

            <div className="flex-1">
              <style jsx>{`
                .simple-range-slider::-webkit-slider-thumb {
                  appearance: none;
                  width: 16px;
                  height: 16px;
                  border-radius: 50%;
                  background: #3b82f6;
                  cursor: pointer;
                  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                  border: 2px solid white;
                }
                .simple-range-slider::-moz-range-thumb {
                  width: 16px;
                  height: 16px;
                  border-radius: 50%;
                  background: #3b82f6;
                  cursor: pointer;
                  border: 2px solid white;
                  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }
              `}</style>
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                step="any"
                onChange={handleSeek}
                className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer simple-range-slider"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${getProgressPercentage()}%, #e5e7eb ${getProgressPercentage()}%, #e5e7eb 100%)`,
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // VIDEO
  if (mediaType === "video") {
    return (
      <div
        ref={containerRef}
        className={`relative bg-white rounded-2xl border border-gray-200 overflow-hidden ${className}`}
        onMouseMove={resetControlsTimer}
        onMouseEnter={resetControlsTimer}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={resetControlsTimer}
        style={{
          cursor: !isHovered ? "none" : "default",
        }}
      >
        <video
          ref={mediaRef as React.RefObject<HTMLVideoElement>}
          src={media.url}
          className="w-full h-full object-contain"
          preload="metadata"
          playsInline
          webkit-playsinline="true"
        />

        <AnimatePresence>
          {showControls && (isHovered || !isPlaying) && (
            <motion.div
              key="controls"
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 transition-opacity duration-200"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div>
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  step="any"
                  onChange={handleSeek}
                  className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${getProgressPercentage()}%, rgba(255,255,255,0.3) ${getProgressPercentage()}%, rgba(255,255,255,0.3) 100%)`,
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePlayPause();
                    }}
                    className="p-1 text-white hover:text-blue-400 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {isPlaying ? (
                      <Pause
                        className={`${isMobile ? "h-4 w-4" : "h-5 w-5"}`}
                      />
                    ) : (
                      <Play className={`${isMobile ? "h-4 w-4" : "h-5 w-5"}`} />
                    )}
                  </motion.button>

                  {!isMobile && (
                    <div className="flex items-center space-x-2">
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMute();
                        }}
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
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  <span
                    className={`${isMobile ? "text-xs" : "text-sm"} text-white`}
                  >
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFullscreen();
                    }}
                    className="p-2 text-white hover:text-blue-400 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Maximize2 className="h-4 w-4" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!isPlaying && showControls && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                togglePlayPause();
              }}
              className="p-4 bg-white/20 backdrop-blur-sm text-white rounded-full hover:bg-white/30 transition-colors pointer-events-auto"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Play className={`${isMobile ? "h-4 w-4" : "h-8 w-8"} ml-1`} />
            </motion.button>
          </motion.div>
        )}
      </div>
    );
  }

  return null;
}