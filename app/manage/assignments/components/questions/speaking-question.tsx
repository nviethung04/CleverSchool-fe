// File: speaking-question.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, Video, Square } from "lucide-react";
import { motion } from "framer-motion";
import { TiptapMathViewer } from "@/components/question-editor/tiptap-math-viewer";
import { MediaDisplay } from "../media-display";

interface SpeakingQuestionProps {
  question: {
    id: string;
    content: {
      text: string;
      media?: {
        type: "image" | "audio" | "video" | "text";
        url: string;
      };
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

export function SpeakingQuestion({
  question,
  userAnswer,
  onAnswerUpdate,
  uploadFile,
  isSubmitted = false,
  studentAnswer,
}: SpeakingQuestionProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaBlob, setMediaBlob] = useState<Blob | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | undefined>();
  const [mediaType] = useState<"audio">("audio");
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const isTextMedia = question.content.media?.type === "text";

  // Pick a supported audio MIME type for the current browser (Safari/iPad often doesn't support webm)
  const getSupportedAudioMimeType = () => {
    const candidates = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/aac",
      "audio/ogg;codecs=opus",
      "audio/ogg",
    ];
    try {
      if (typeof window !== "undefined" && (window as any).MediaRecorder) {
        for (const type of candidates) {
          // Some browsers throw on invalid inputs; guard with try
          try {
            if ((MediaRecorder as any).isTypeSupported?.(type)) return type;
          } catch {}
        }
      }
    } catch {}
    return ""; // Let browser default
  };

  const getFileExtensionFromMimeType = (mime: string) => {
    if (!mime) return "webm";
    if (mime.includes("mp4")) return "m4a"; // Safari records AAC in mp4 container
    if (mime.includes("aac")) return "aac";
    if (mime.includes("ogg")) return "ogg";
    if (mime.includes("webm")) return "webm";
    return "webm";
  };

  useEffect(() => {
    stopRecording();

    // clear old timer & stream
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

    // CLEAR old objectUrl if có
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    const blob = userAnswer?.audioBlob || userAnswer?.videoBlob || null;
    setMediaBlob(blob);

    // 🔥 TẠO LẠI URL nếu có blob
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
  }, [question.id]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [question.id]);

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

  const startRecording = async () => {
    try {
      const constraints = {
        audio: { echoCancellation: true },
      } as MediaStreamConstraints;
      const mediaStream = await navigator.mediaDevices.getUserMedia(
        constraints
      );
      setStream(mediaStream);
      const selectedMimeType = getSupportedAudioMimeType();
      const options = selectedMimeType
        ? { mimeType: selectedMimeType }
        : undefined;
      const mediaRecorder = new MediaRecorder(mediaStream, options as any);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, {
          type: selectedMimeType || "audio/webm",
        });
        if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
        const url = URL.createObjectURL(blob);
        objectUrlRef.current = url;
        setMediaBlob(blob);
        setMediaUrl(url);
        mediaStream.getTracks().forEach((track) => track.stop());
        setStream(null);

        if (uploadFile) {
          try {
            const ext = getFileExtensionFromMimeType(blob.type);
            const file = new File([blob], `recording.${ext}`, {
              type: blob.type,
            });
            const uploadRes = await uploadFile(file);
            setFileUrl(uploadRes.data.url);
          } catch {
            setFileUrl(undefined);
          }
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setFileUrl(undefined);
      setRecordingDuration(0);

      let duration = 0;
      timerRef.current = setInterval(() => {
        duration++;
        setRecordingDuration(duration);
        if (duration >= (question.options?.maxDuration || 300)) stopRecording();
      }, 1000);
    } catch (err) {
      console.error("Recording error", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const toggleRecording = () =>
    isRecording ? stopRecording() : startRecording();

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="w-full flex flex-col items-center justify-center">
      {/* QUESTION LAYOUT (TOP) */}
      <div
        className="w-full max-w-5xl mx-auto"
        style={{ minHeight: 260, height: "min(320px, 30vw)" }}
      >
        {question.content.media && question.content.media.type !== "text" ? (
          <div className="flex flex-row items-stretch h-full">
            {/* Media cột trái */}
            <div className="flex-1 flex items-center justify-center">
              <MediaDisplay
                media={question.content.media}
                alt="Media"
                className="w-full h-full object-contain"
                showControls={true}
              />
            </div>
            {/* Text cột phải */}
            <div className="flex-1 flex items-center justify-center">
              <div className="text-[#32428D] font-medium leading-relaxed text-center text-xl lg:text-2xl px-4">
                <TiptapMathViewer
                  value={
                    question.content.text?.split("\n").join("<br />") || ""
                  }
                  isHtml
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full w-full">
            <div className="text-[#32428D] font-medium leading-relaxed text-center text-xl lg:text-2xl px-4">
              <TiptapMathViewer
                value={question.content.text?.split("\n").join("<br />") || ""}
                isHtml
              />
            </div>
          </div>
        )}
      </div>
      {/* KHOẢNG CÁCH GIỮA 2 LAYOUT */}
      <div className="h-24" />
      {/* ANSWER LAYOUT (BOTTOM) */}
      <div
        className="w-full max-w-5xl mx-auto flex items-center justify-center"
        style={{ minHeight: 180 }}
      >
        <div className="w-full max-w-3xl mx-auto">{renderRecordingArea()}</div>
      </div>
      {/* Hiển thị audio đã nộp nếu có */}
      {studentAnswer?.fileUrl && (
        <div className="mt-4 w-full flex flex-col items-center">
          <audio
            src={studentAnswer.fileUrl}
            controls
            className="w-full max-w-md"
          />
        </div>
      )}
    </div>
  );

  function renderRecordingArea() {
    return (
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
        <motion.button
          onClick={toggleRecording}
          className="w-32 h-32 bg-white text-blue-800 rounded-full border-4 border-white shadow-xl flex items-center justify-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={isSubmitted}
        >
          {isRecording ? (
            <Square className="h-16 w-16 text-red-600 fill-current" />
          ) : mediaBlob ? (
            <img
              src="/images/ic_micro.png"
              alt="micro"
              className="h-16 w-16 object-contain aspect-square"
            />
          ) : (
            <img
              src="/images/ic_micro.png"
              alt="micro"
              className="h-16 w-16 object-contain aspect-square"
            />
          )}
        </motion.button>
        {/* Text hiển thị khi đang ghi âm */}
        {isRecording && (
          <div className="mt-4">
            <span className="text-xl font-bold text-red-600">
              ĐANG GHI ÂM... {formatTime(recordingDuration)}
            </span>
          </div>
        )}
        {/* Hiển thị trạng thái đã ghi âm */}
        {!isRecording && mediaBlob && (
          <div className="mt-4">
            <span className="text-lg font-semibold text-green-600">
              ĐÃ GHI ÂM ({formatTime(recordingDuration)})
            </span>
          </div>
        )}
        <div
          style={{ minHeight: 80, marginTop: 24 }}
          className="flex items-center justify-center w-full"
        >
          {!isRecording && (mediaUrl || fileUrl) ? (
            <div className="w-full">
              <audio src={mediaUrl || fileUrl} controls className="w-full" />
            </div>
          ) : null}
        </div>
      </div>
    );
  }
}
