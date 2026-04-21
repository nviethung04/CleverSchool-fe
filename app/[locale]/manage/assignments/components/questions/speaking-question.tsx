// File: speaking-question.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import {
  Mic,
  Video,
  Square,
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
  Info,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { TiptapMathViewer } from "@/components/question-editor/tiptap-math-viewer";
import { MediaDisplay } from "../media-display";
import { AudioEffects } from "@/lib/utils/audio-utils";
import { createPortal } from "react-dom";
import { toast } from "sonner";

interface SpeakingQuestionProps {
  question: {
    id: string;
    content: {
      text: string;
      media?: {
        type: "image" | "audio" | "video" | "text";
        url: string;
      };
      medias?: {
        type: "image" | "audio" | "video" | "text";
        url: string;
      }[];
    };
    options: {
      maxDuration?: number;
    };
  };
  userAnswer?: {
    audioBlob?: Blob;
    videoBlob?: Blob;
    audioUrl?: string;
    videoUrl?: string;
    mediaType?: "audio" | "video";
    duration?: number;
    isAnswered: boolean;
    fileUrl?: string;
  };
  onAnswerUpdate: (answer: any) => void;
  uploadFile?: (file: File) => Promise<{ data: { url: string } }>;
  isSubmitted?: boolean;
  studentAnswer?: any;
}

// Helper function để validate xem text có thực sự empty không (bao gồm cả empty HTML tags)
function isTextContentEmpty(text: string | undefined | null): boolean {
  if (!text) return true;
  const trimmed = text.trim();
  if (!trimmed) return true;
  const withoutTags = trimmed.replace(/<[^>]*>/g, "").trim();
  if (!withoutTags) return true;
  const withoutEntities = withoutTags
    .replace(/&nbsp;|&#160;|\u00A0/g, "")
    .trim();
  return !withoutEntities;
}

export function SpeakingQuestion({
  question,
  userAnswer,
  onAnswerUpdate,
  uploadFile,
  isSubmitted = false,
  studentAnswer,
}: SpeakingQuestionProps) {
  // state for loading upload file
  const [loadingUpload, setLoadingUpload] = useState(false)
  // RECORDING STATES (unchanged logic)
  const [isRecording, setIsRecording] = useState(false);
  const [mediaBlob, setMediaBlob] = useState<Blob | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | undefined>();
  const [mediaType] = useState<"audio">("audio");
  const [recordingDuration, setRecordingDuration] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const chunksRef = useRef<Float32Array[]>([]);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [microphoneError, setMicrophoneError] = useState<string | null>(null);
  const [hasStartedNewRecording, setHasStartedNewRecording] = useState(false);

  // --- Answer audio player states (kept as original) ---
  // this audioRef is used for the student's recorded-answer playback (bottom player)
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // --- Question audio player states (NEW, separate) ---
  // questionAudioRef is used only for the question's media (the player at the top)
  const questionAudioRef = useRef<HTMLAudioElement | null>(null);
  const [questionIsPlaying, setQuestionIsPlaying] = useState(false);
  const [questionCurrentTime, setQuestionCurrentTime] = useState(0);
  const [questionDuration, setQuestionDuration] = useState(0);
  const [questionMuted, setQuestionMuted] = useState(false);

  // other refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const isTextMedia = question.content.media?.type === "text";

  // --- util / mime helpers (unchanged) ---
  const getSupportedAudioMimeType = () => {
    const candidates = [
      "audio/mp4",
      "audio/m4a",
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/aac",
      "audio/ogg;codecs=opus",
      "audio/ogg",
    ];
    try {
      if (
        typeof window !== "undefined" &&
        typeof MediaRecorder !== "undefined"
      ) {
        for (const type of candidates) {
          try {
            if (
              MediaRecorder.isTypeSupported &&
              MediaRecorder.isTypeSupported(type)
            ) {
              return type;
            }
          } catch { }
        }
      }
    } catch { }
    return "audio/mp4";
  };

  const getFileExtensionFromMimeType = (mime: string) => {
    if (!mime) return "mp4";
    if (mime.includes("mp4")) return "mp4";
    if (mime.includes("m4a")) return "m4a";
    if (mime.includes("aac")) return "aac";
    if (mime.includes("ogg")) return "ogg";
    if (mime.includes("webm")) return "webm";
    return "mp4";
  };

  // --- lifecycle: reset when question changes (kept original) ---
  useEffect(() => {
    stopRecording();

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = null;
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    const blob = userAnswer?.audioBlob || userAnswer?.videoBlob || null;
    setMediaBlob(blob);

    if (blob) {
      const newUrl = URL.createObjectURL(blob);
      objectUrlRef.current = newUrl;
      setMediaUrl(newUrl);
    } else {
      setMediaUrl(
        userAnswer?.audioUrl ||
        userAnswer?.videoUrl ||
        userAnswer?.fileUrl ||
        null
      );
    }

    setFileUrl(userAnswer?.fileUrl);
    setIsRecording(false);
    setRecordingDuration(userAnswer?.duration || 0);
    setHasStartedNewRecording(false);

    // reset question player states when new question
    setQuestionIsPlaying(false);
    setQuestionCurrentTime(0);
    setQuestionDuration(0);

    // Reset question audio element
    if (questionAudioRef.current) {
      questionAudioRef.current.pause();
      questionAudioRef.current.currentTime = 0;
    }

    // reset answer player states
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [question.id]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [question.id]);

  // --- propagate answer data (unchanged) ---
  useEffect(() => {
    const answerData: any = {
      duration: recordingDuration,
      mediaType,
      isAnswered: !!mediaBlob && recordingDuration > 0,
      fileUrl,
    };
    answerData.audioBlob = mediaBlob;
    answerData.audioUrl = mediaUrl;
    onAnswerUpdate(answerData);
  }, [
    mediaBlob,
    mediaUrl,
    mediaType,
    recordingDuration,
    fileUrl,
    onAnswerUpdate,
  ]);

  // --- recording logic (unchanged) ---
  const startRecording = async () => {
    try {
      setMicrophoneError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStream(stream);

      // Tạo AudioContext
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      // Nguồn âm thanh từ micro
      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;

      // Node để lấy dữ liệu PCM
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      source.connect(processor);
      processor.connect(audioContext.destination);

      chunksRef.current = [];

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        chunksRef.current.push(new Float32Array(inputData));
      };

      setIsRecording(true);
      setRecordingDuration(0);
      setHasStartedNewRecording(true);

      let durationCounter = 0;
      timerRef.current = setInterval(() => {
        durationCounter++;
        setRecordingDuration(durationCounter);
        if (durationCounter >= (question.options?.maxDuration || 300)) stopRecording();
      }, 1000);
    } catch (err) {
      console.error("Recording error", err);
      setMicrophoneError("Không thể truy cập microphone. Vui lòng kiểm tra quyền truy cập.");
    }
  };

  const stopRecording = async () => {
    if (!isRecording) return;
    setIsRecording(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const audioContext = audioContextRef.current;
    const processor = processorRef.current;
    const source = sourceRef.current;

    if (processor && source) {
      processor.disconnect();
      source.disconnect();
    }

    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }

    // Gộp các đoạn âm thanh lại
    const chunks = chunksRef.current;
    const length = chunks.reduce((acc, cur) => acc + cur.length, 0);
    const result = new Float32Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    // Chuyển PCM → WAV Blob
    const wavBlob = encodeWAV(result, audioContext?.sampleRate || 44100);

    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const audioUrl = URL.createObjectURL(wavBlob);
    objectUrlRef.current = audioUrl;
    setMediaBlob(wavBlob);
    setMediaUrl(audioUrl);

    // Upload lên server nếu có hàm uploadFile
    if (uploadFile) {
      try {
        setLoadingUpload(true)
        const file = new File([wavBlob], "recording.wav", { type: "audio/wav" });
        const res = await uploadFile(file);
        setFileUrl(res.data.url);
      } catch (err) {
        console.error("Upload lỗi:", err);
        toast.error("Lỗi", {
          description: "Tải file ghi âm lỗi, vui lòng thử ghi âm lại!"
        })
      } finally {
        setLoadingUpload(false)
      }
    }

    chunksRef.current = [];
  };

  function encodeWAV(samples: Float32Array, sampleRate: number): Blob {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    function writeString(view: DataView, offset: number, str: string) {
      for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    }

    let offset = 0;
    writeString(view, offset, "RIFF"); offset += 4;
    view.setUint32(offset, 36 + samples.length * 2, true); offset += 4;
    writeString(view, offset, "WAVE"); offset += 4;
    writeString(view, offset, "fmt "); offset += 4;
    view.setUint32(offset, 16, true); offset += 4;
    view.setUint16(offset, 1, true); offset += 2;
    view.setUint16(offset, 1, true); offset += 2;
    view.setUint32(offset, sampleRate, true); offset += 4;
    view.setUint32(offset, sampleRate * 2, true); offset += 4;
    view.setUint16(offset, 2, true); offset += 2;
    view.setUint16(offset, 16, true); offset += 2;
    writeString(view, offset, "data"); offset += 4;
    view.setUint32(offset, samples.length * 2, true); offset += 4;

    let idx = 44;
    for (let i = 0; i < samples.length; i++, idx += 2) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(idx, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }

    return new Blob([view], { type: "audio/wav" });
  }

  // --- ANSWER audio player event handlers (keeps original behaviour) ---
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(audio.duration);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [mediaUrl, fileUrl]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

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

    const time = parseFloat(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newVolume = parseFloat(e.target.value);
    audio.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.volume = volume > 0 ? volume : 1;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  const resetRecording = () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    setMediaBlob(null);
    setMediaUrl(null);
    setFileUrl(undefined);
    setRecordingDuration(0);
    setCurrentTime(0);
    setIsPlaying(false);
    setMicrophoneError(null);
  };

  const getProgressPercentage = () => {
    return duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;
  };

  // --- QUESTION audio player handlers (NEW, separate) ---
  useEffect(() => {
    const qAudio = questionAudioRef.current;
    if (!qAudio) return;

    const handleTimeUpdate = () => setQuestionCurrentTime(qAudio.currentTime);
    const handleLoadedMetadata = () => setQuestionDuration(qAudio.duration);
    const handleEnded = () => {
      setQuestionIsPlaying(false);
      setQuestionCurrentTime(qAudio.duration);
    };

    qAudio.addEventListener("timeupdate", handleTimeUpdate);
    qAudio.addEventListener("loadedmetadata", handleLoadedMetadata);
    qAudio.addEventListener("ended", handleEnded);

    return () => {
      qAudio.removeEventListener("timeupdate", handleTimeUpdate);
      qAudio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      qAudio.removeEventListener("ended", handleEnded);
    };
    // re-run when the question changes or media url changes
  }, [question.id, question.content.media?.url]);

  const toggleQuestionPlayPause = () => {
    const qAudio = questionAudioRef.current;
    if (!qAudio) return;

    if (questionIsPlaying) {
      qAudio.pause();
      setQuestionIsPlaying(false);
    } else {
      // Pause answer player if it is playing (avoid concurrent audio)
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      qAudio.play();
      setQuestionIsPlaying(true);
    }
  };

  const handleSeekQuestion = (e: React.ChangeEvent<HTMLInputElement>) => {
    const qAudio = questionAudioRef.current;
    if (!qAudio) return;
    const time = parseFloat(e.target.value);
    qAudio.currentTime = time;
    setQuestionCurrentTime(time);
  };

  const toggleQuestionMute = () => {
    const qAudio = questionAudioRef.current;
    if (!qAudio) return;
    qAudio.muted = !qAudio.muted;
    setQuestionMuted(qAudio.muted);
  };

  const toggleRecording = () => {
    AudioEffects.microphone();
    return isRecording ? stopRecording() : startRecording();
  };

  // Hàm format time
  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    const checkDevice = () => {
      const isMobileDevice =
        typeof navigator !== "undefined"
          ? /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
          )
          : false;
      const isMobileScreen =
        typeof window !== "undefined" ? window.innerWidth <= 768 : false;
      const newIsMobile = isMobileDevice || isMobileScreen;

      setIsMobile(newIsMobile);
    };

    checkDevice();
    if (typeof window !== "undefined") {
      window.addEventListener("resize", checkDevice);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", checkDevice);
      }
    };
  }, []);

  // Thêm state quản lý popup info cho video
  const [showVideoInfo, setShowVideoInfo] = useState(false);

  const mediasWithImage = question.content.medias?.find((media) => media.type === "image")

  // --- RENDER ---
  return (
    <div className="w-full flex flex-col items-center justify-center transition-all duration-300">
      {/* QUESTION LAYOUT (TOP) */}
      <div className="mobile-landscape-content-wrapper w-full max-w-5xl xl:max-w-4xl 2xl:max-w-5xl mx-auto pt-6 pb-4 landscape:pt-4 landscape:pb-2 sm:pt-8 sm:pb-6 px-4 sm:px-6 lg:px-8 xl:px-4 2xl:px-8">
        {question.content.medias &&  question.content.medias.length > 1 ?
          <>
            {/* Text content trên (nếu có) */}
              {!isTextContentEmpty(question.content.text) && (
                <div className="w-full flex items-center justify-center mb-5">
                  <div className="text-center">
                    <TiptapMathViewer
                      className={`text-[#32428D] font-medium leading-relaxed text-center ${
                        isMobile
                          ? "text-sm sm:text-base"
                          : "text-base lg:text-lg xl:text-xl 2xl:text-2xl"
                      } whitespace-normal break-words`}
                      value={question.content.text}
                    />
                  </div>
                </div>
              )
            }
            <div className={`flex flex-1 gap-6 flex-wrap justify-center items-center sm:px-8 ${mediasWithImage ? "sm:flex-nowrap" : ""}`}>
              {question.content.medias.map((media, index) => {
                if (media.type === 'audio') {
                  return (
                    <audio
                      key={index}
                      controls
                      src={media.url}
                      preload="metadata"
                      className={"lg:w-3/5 sm:w-4/5 w-full"}
                    />
                  )
                }
                if (media.type === 'image') {
                  return (
                    <MediaDisplay
                      key={index}
                      media={media}
                      alt="Hình ảnh câu hỏi"
                      className="max-h-full max-w-full object-contain rounded-xl shadow-lg w-1/5"
                    />
                  )
                }
              })}
            </div>
          </>
        :
        question.content.media && question.content.media?.type !== "text" ? (
          isTextContentEmpty(question.content.text) ? (
            // Media only - if media is audio, render question audio player with its own ref
            question.content.media.type === "audio" ? (
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm w-full max-w-md mx-auto">
                {/* QUESTION audio element */}
                <audio
                  ref={questionAudioRef}
                  src={question.content.media.url}
                  preload="metadata"
                />

                <div className="flex items-center gap-4">
                  <motion.button
                    onClick={toggleQuestionPlayPause}
                    className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex-shrink-0"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {questionIsPlaying ? (
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
                      max={questionDuration || 0}
                      value={questionCurrentTime}
                      step="any"
                      onChange={handleSeekQuestion}
                      className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer simple-range-slider"
                      style={{
                        background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${questionDuration > 0
                            ? (questionCurrentTime / questionDuration) * 100
                            : 0
                          }%, #e5e7eb ${questionDuration > 0
                            ? (questionCurrentTime / questionDuration) * 100
                            : 0
                          }%, #e5e7eb 100%)`,
                      }}
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{formatTime(questionCurrentTime)}</span>
                      <span>{formatTime(questionDuration)}</span>
                    </div>
                  </div>

                  {/* <motion.button
                    onClick={toggleQuestionMute}
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition ml-3"
                    whileHover={{ scale: 1.05 }}
                  >
                    {questionMuted ? <VolumeX className="w-4 h-4 text-gray-600" /> : <Volume2 className="w-4 h-4 text-gray-600" />}
                  </motion.button> */}
                </div>
              </div>
            ) : (
              // Non-audio media only
              <div className="flex justify-center max-w-5xl mx-auto">
                <MediaDisplay
                  key={`media-${question.id}`}
                  media={question.content.media}
                  className={`object-cover rounded-xl shadow-lg ${isMobile ? "max-h-48 max-w-64" : "h-full max-w-2xl"
                    }`}
                  showControls={true}
                />
              </div>
            )
          ) : // Media with text
            question.content.media.type === "video" ? (
              // Nếu media là video, bỏ text, thay vào nút info
              <div
                className={`relative flex justify-center mx-auto ${isMobile ? "max-w-sm" : "max-w-xl"
                  }`}
              >
                <MediaDisplay
                  key={`media-${question.id}`}
                  media={question.content.media}
                  className={`max-h-full object-contain rounded-xl shadow-lg max-w-full`}
                  showControls={true}
                />
                {/* Nút info ở góc trên bên phải */}
                <button
                  className="absolute top-2 right-2 z-10 bg-white rounded-full shadow-lg hover:scale-110 transition-all duration-200 flex items-center justify-center"
                  onClick={() => setShowVideoInfo(true)}
                  aria-label="Xem thông tin"
                  type="button"
                >
                  <Info
                    className={`${isMobile ? "w-6 h-6" : "w-9 h-9"
                      } text-blue-600`}
                  />
                </button>
                {/* Popup hiển thị question content */}
                {showVideoInfo &&
                  typeof window !== "undefined" &&
                  createPortal(
                    <div
                      className="fixed inset-0 bg-black/80 flex items-center justify-center z-[99999]"
                      onClick={() => setShowVideoInfo(false)}
                      style={{ touchAction: "manipulation" }}
                    >
                      <div
                        className={`relative w-full bg-white rounded-3xl border-[3px] border-blue-500 shadow-2xl p-6 ${isMobile ? "max-w-lg" : "max-w-2xl"
                          }`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div
                          className={`flex flex-row items-center border-b border-blue-200 pb-4 mb-4 ${isMobile ? "gap-2" : "gap-3"
                            }`}
                        >
                          <Info
                            className={`${isMobile ? "w-6 h-6" : "w-8 h-8"
                              } text-blue-600`}
                          />
                          <span
                            className={`font-semibold text-blue-700 ${isMobile
                                ? "text-sm sm:text-base"
                                : "text-base lg:text-lg xl:text-xl"
                              }`}
                          >
                            Nội dung câu hỏi
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowVideoInfo(false)}
                          className="absolute top-4 right-4 bg-white rounded-lg p-2 border-2 border-red-400 shadow-lg hover:bg-red-50 hover:border-red-600 hover:scale-110 transition-all duration-200 z-10 flex items-center justify-center"
                          style={{ touchAction: "manipulation" }}
                        >
                          <X
                            className={`${isMobile ? "w-3 h-3" : "w-5 h-5"
                              } text-red-600`}
                          />
                        </button>
                        <div
                          className={`text-[#32428D] font-medium leading-relaxed text-left overflow-y-auto ${isMobile
                              ? "max-h-28 text-md sm:text-sm"
                              : "max-h-56 text-sm lg:text-base xl:text-lg"
                            }`}
                        >
                          <TiptapMathViewer
                            value={
                              question.content.text?.split("\n").join("<br />") ||
                              ""
                            }
                            isHtml
                          />
                        </div>
                      </div>
                    </div>,
                    document.body
                  )}
              </div>
            ) : (
              // Media với text (unchanged)
              <div className="flex flex-row items-center gap-4 md:gap-6 landscape:gap-4 max-w-5xl mx-auto">
                <div className="flex-shrink-0 w-2/5 flex justify-center">
                  <MediaDisplay
                    key={`media-${question.id}`}
                    media={question.content.media}
                    className={`max-h-full object-contain rounded-xl shadow-lg max-w-full`}
                    showControls={true}
                  />
                </div>
                <div className="flex-1 w-3/5 flex items-center justify-center md:justify-start min-h-[224px] md:min-h-[288px] lg:min-h-[320px] landscape:min-h-[160px] pl-4 sm:pl-6 md:pl-8">
                  <div className="w-full text-left pr-4 sm:pr-6">
                    <div
                      className={`text-[#32428D] font-medium leading-relaxed ${isMobile
                          ? "text-sm sm:text-base"
                          : "text-base lg:text-lg xl:text-xl 2xl:text-2xl"
                        }`}
                    >
                      <TiptapMathViewer
                        value={
                          question.content.text?.split("\n").join("<br />") || ""
                        }
                        isHtml
                      />
                    </div>
                  </div>
                </div>
              </div>
            )
        ) : (
          <div className="text-center max-w-4xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
            <div
              className={`text-[#32428D] font-medium leading-relaxed text-center ${isMobile
                  ? "text-sm sm:text-base"
                  : "text-base lg:text-lg xl:text-xl 2xl:text-2xl"
                }`}
            >
              <TiptapMathViewer
                value={question.content.text?.split("\n").join("<br />") || ""}
                isHtml
              />
            </div>
          </div>
        )}
      </div>

      {/* KHOẢNG CÁCH GIỮA 2 LAYOUT */}
      <div className="h-4 landscape:h-2 sm:h-6 lg:h-8 xl:h-12" />

      {/* ANSWER LAYOUT (BOTTOM) */}
      <div className="w-full max-w-5xl xl:max-w-4xl 2xl:max-w-5xl mx-auto flex items-center justify-center pt-2 pb-4 landscape:pt-1 landscape:pb-2 sm:pt-4 sm:pb-6 lg:pt-6 lg:pb-8 xl:pt-8 xl:pb-12 px-4 sm:px-6 lg:px-8 xl:px-4 2xl:px-8">
        <div className="w-full max-w-3xl xl:max-w-2xl 2xl:max-w-3xl mx-auto">
          {renderRecordingArea()}
        </div>
      </div>

      {/* Hiển thị audio đã nộp nếu có và user chưa bắt đầu ghi âm mới */}
      {studentAnswer?.fileUrl && !hasStartedNewRecording && (
        <div className="mt-3 sm:mt-4 w-full flex flex-col items-center px-4">
          <audio
            src={studentAnswer.fileUrl}
            controls
            className="w-full max-w-sm sm:max-w-md"
          />
        </div>
      )}
    </div>
  );

  // --- renderRecordingArea kept unchanged except it uses audioRef for the answer player ---
  function renderRecordingArea() {
    return (
      <div className="w-full flex flex-col items-center">
        {/* Recording Container */}
        <div className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl p-2 sm:p-2">
          {/* Microphone Button */}
          <div className="flex justify-center mb-6">
            <motion.button
              onClick={toggleRecording}
              className={`relative w-16 h-16 landscape:w-14 landscape:h-14 sm:w-18 sm:h-18 md:w-20 md:h-20 lg:w-22 lg:h-22 rounded-full shadow-lg border-2 flex items-center justify-center transition-all duration-300 ${isSubmitted || microphoneError
                  ? "bg-gray-300 text-gray-500 border-gray-300 cursor-not-allowed"
                  : isRecording
                    ? "bg-red-500 text-white border-red-400 shadow-red-200"
                    : "bg-blue-500 text-white border-blue-400 shadow-blue-200 hover:bg-blue-600"
                }`}
              whileHover={isSubmitted || microphoneError ? {} : { scale: 1.05 }}
              whileTap={isSubmitted || microphoneError ? {} : { scale: 0.95 }}
              disabled={isSubmitted || !!microphoneError}
            >
              {isRecording ? (
                <Square className="w-6 h-6 landscape:w-5 landscape:h-5 sm:w-7 sm:h-7 md:w-8 md:h-8 fill-current" />
              ) : mediaBlob ? (
                <Mic className="w-6 h-6 landscape:w-5 landscape:h-5 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
              ) : (
                <Mic className="w-6 h-6 landscape:w-5 landscape:h-5 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
              )}

              {isRecording && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-red-300"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                />
              )}
            </motion.button>
          </div>

          <div className="text-center mb-4">
            {isRecording && (
              <div className="text-red-600 font-medium text-sm flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                Đang ghi âm {formatTime(recordingDuration)}
              </div>
            )}

            {!isRecording && mediaBlob && (
              <div className="text-green-600 font-medium text-sm flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Đã ghi âm ({formatTime(recordingDuration)})
              </div>
            )}

            {microphoneError && (
              <div className="text-red-600 text-xs bg-red-50 p-2 rounded border border-red-200">
                {microphoneError}
              </div>
            )}
          </div>

          {!isRecording && (mediaUrl || fileUrl) && (
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-800">
                  🎵 Phát lại ghi âm
                </h4>
                <motion.button
                  onClick={resetRecording}
                  className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <RotateCcw className="w-4 h-4" />
                </motion.button>
              </div>

              {/* NOTE: this audioRef is for the answer playback ONLY */}
              <audio
                ref={audioRef}
                src={fileUrl || mediaUrl as string | undefined}
                preload="metadata"
              />
            
              <div className="flex items-center gap-4">
                <motion.button
                  onClick={togglePlayPause}
                  className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex-shrink-0"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={loadingUpload}
                >
                  {loadingUpload ? 
                    (<svg className="h-5 w-5 animate-spin text-white" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>)
                    :
                    isPlaying ? (
                      <Pause className="w-5 h-5" />
                    ) : (
                      <Play className="w-5 h-5 ml-0.5" />
                    )
                  }
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
            </div>
          )}
        </div>
      </div>
    );
  }
}
