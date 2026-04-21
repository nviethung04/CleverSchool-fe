"use client";

import type React from "react";
import { useEffect, useState } from "react";

import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Send,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Info,
} from "lucide-react";
import Image from "next/image";
import { AudioEffects } from "@/lib/utils/audio-utils";

type FeedbackState = "initial" | "correct" | "incorrect";

interface HomeworkSubmissionPageProps {
  questions: any[];
  currentQuestionIndex: number;
  answers: Record<string, any>;
  isSubmitted: boolean;
  isLoading: boolean;
  feedbackState: FeedbackState;
  showFeedback: boolean;
  isCheckingAnswer: boolean;
  onAnswerUpdate: (answer: any) => void;
  onNext: () => void;
  onBack: () => void;
  onCheck: () => void;
  onSkip?: () => void;
  renderQuestion: () => React.ReactNode;
  canCheck: () => boolean;
  canSkip?: () => boolean;
  getBottomBackgroundColor: () => string;
  getRobotImage: () => string;
  getFeedbackMessage: () => string;
  getFeedbackTextColor?: () => string;
  maxViewedQuestionIndex: number;
  homeworkName?: string;
  lastQuestionIdCompleted?: number;
  completedQuestions?: Set<number>;
  onFinishHomework?: () => void;
  isSubmitButtonEnabled?: boolean;
  hasCorrectAnswer?: boolean;
  showFourRow?: boolean;
  rowBadgeImage?: string;
}

export default function HomeworkSubmissionPage({
  questions,
  currentQuestionIndex,
  answers,
  isSubmitted,
  isLoading,
  feedbackState,
  showFeedback,
  isCheckingAnswer,
  onAnswerUpdate,
  onNext,
  onBack,
  onCheck,
  onSkip,
  renderQuestion,
  canCheck,
  canSkip,
  getBottomBackgroundColor,
  getRobotImage,
  getFeedbackMessage,
  getFeedbackTextColor,
  maxViewedQuestionIndex,
  homeworkName,
  lastQuestionIdCompleted,
  completedQuestions,
  onFinishHomework,
  isSubmitButtonEnabled,
  hasCorrectAnswer,
  showFourRow,
  rowBadgeImage,
}: HomeworkSubmissionPageProps) {
  const router = useRouter();
  const params = useParams();
  const currentQuestion = questions[currentQuestionIndex];

  const [microphoneAvailable, setMicrophoneAvailable] = useState<
    boolean | null
  >(null);

  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showFloatingFeedback, setShowFloatingFeedback] = useState(false);
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const [fourRowJustAppeared, setFourRowJustAppeared] = useState(false);

  // Handle floating feedback display
  useEffect(() => {
    if (!isSidebarOpen && feedbackState !== "initial") {
      setShowFloatingFeedback(true);

      // Auto hide after 3 seconds
      const timer = setTimeout(() => {
        setShowFloatingFeedback(false);
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      setShowFloatingFeedback(false);
    }
  }, [isSidebarOpen, feedbackState]);

  // Handle 4 in a row badge animation
  useEffect(() => {
    if (showFourRow) {
      setFourRowJustAppeared(true);
      // Reset animation trigger after animation completes
      const timer = setTimeout(() => {
        setFourRowJustAppeared(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [showFourRow]);

  useEffect(() => {
    if (currentQuestion?.type === "speaking") {
      setMicrophoneAvailable(null); // reset while checking

      // Check if mediaDevices API is available
      if (
        typeof navigator !== "undefined" &&
        navigator.mediaDevices &&
        navigator.mediaDevices.getUserMedia
      ) {
        navigator.mediaDevices
          .getUserMedia({ audio: true })
          .then(() => setMicrophoneAvailable(true))
          .catch(() => setMicrophoneAvailable(false));
      } else {
        // MediaDevices API not available (old browser, HTTP context, or server-side)
        setMicrophoneAvailable(false);
      }
    } else {
      setMicrophoneAvailable(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion?.id, currentQuestion?.type]);

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
      setIsMobile(isMobileDevice || isMobileScreen);
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);

    return () => {
      window.removeEventListener("resize", checkDevice);
    };
  }, []);

  // Listen for image zoom events to hide/show floating menus
  useEffect(() => {
    const handleImageZoomChange = (event: any) => {
      setIsImageZoomed(event.detail.isZoomed);
    };

    window.addEventListener("imageZoomChange", handleImageZoomChange);

    return () => {
      window.removeEventListener("imageZoomChange", handleImageZoomChange);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="h-[100dvh] w-screen fixed inset-0 flex items-center justify-center bg-gradient-to-br from-blue-900 to-indigo-900 overflow-hidden">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading questions...</p>
        </div>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="h-[100dvh] w-screen fixed inset-0 flex items-center justify-center bg-gradient-to-br from-blue-900 to-indigo-900 overflow-hidden">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-white mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">
            No questions found
          </h1>
          <p className="text-white/80">This homework has no questions.</p>
        </div>
      </div>
    );
  }

  // Function to get video path based on question type
  const getVideoPath = (questionType: string): string => {
    const videoMap: Record<string, string> = {
      multiple_choice: "/guide/multiple_choice.mp4",
      fill_in_blanks: "/guide/fill_in_blanks.mp4",
      category: "/guide/categorize.mp4",
      drag_drop: "/guide/drag_and_drop.mp4",
      matching: "/guide/match.mp4",
      writing: "/guide/writing.mp4",
      speaking: "/guide/speaking.mp4",
      ordering: "/guide/reorder.mp4",
      labeling: "/guide/label.mp4",
    };
    return videoMap[questionType] || "";
  };

  return (
    <div className="fixed inset-0 flex overflow-hidden">
      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col overflow-y-auto min-w-0 transition-all duration-300 ease-in-out 
        ${isSidebarOpen ? (isMobile ? "pr-48" : "pr-80") : ""}
      `}
      >
        {/* Question Header - Fixed at top */}
        <div className="flex-shrink-0 p-4 md:p-6 lg:p-8 px-8 md:px-12 lg:px-16 xl:px-20">
          <div className="flex items-center justify-center gap-2">
            <h2
              className={`font-bold text-[#32428D] text-center ${
                isMobile ? "text-lg" : "text-3xl"
              }`}
            >
              Question {currentQuestionIndex + 1}:{" "}
              {currentQuestion?.metadata?.instructions}
            </h2>
            <button
              onClick={() => setShowVideoDialog(true)}
              className={`flex-shrink-0 text-[#32428D] hover:text-[#4285F4] transition-colors ${
                isMobile ? "p-1" : "p-2"
              }`}
              title="Xem hướng dẫn"
            >
              <Info className={isMobile ? "w-4 h-4" : "w-6 h-6"} />
            </button>
          </div>
        </div>
        {/* Question Content - Scrollable area */}
        <div className="flex-1 overflow-y-auto overflow-x-auto pb-4 md:pb-6 lg:pb-8 px-8 md:px-12 lg:px-16 xl:px-20">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-center min-h-full">
            {/* Question Render */}
            <div className="w-full flex items-center justify-center">
              {renderQuestion()}
            </div>
          </div>
        </div>

        {/* Back Button - Fixed positioning */}
        {/* Luôn hiển thị nút Back, không phụ thuộc isImageZoomed */}
        <button
          onClick={onBack}
          disabled={currentQuestionIndex === 0}
          className={`absolute left-6 top-1/2 transform -translate-y-1/2 z-30 bg-[#4285F4] text-white rounded-full shadow-lg transition-all hover:scale-105 disabled:opacity-30 disabled:hover:scale-100 ${
            isMobile ? "p-2" : "p-4"
          }`}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            className={isMobile ? "w-4 h-4" : "w-6 h-6"}
          >
            <path
              d="M15 18L9 12L15 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Sidebar */}
      {/* Sidebar */}
      <div
        className={`fixed right-0 top-0 h-full bg-white transition-transform duration-300 ease-in-out z-[9998]
    ${
      isSidebarOpen
        ? "translate-x-0 visible"
        : "translate-x-full invisible pointer-events-none"
    }
    ${
      isMobile ? "w-48" : "w-80"
    } fixed right-0 top-0 h-full bg-white shadow-lg transition-transform duration-300 ease-in-out
  `}
      >
        {/* Sidebar Content */}
        <div className="relative z-10 flex flex-col h-full">
          {/* Title Section - Fixed at top - Hidden on mobile */}
          {!isMobile && (
            <div className="flex-shrink-0 p-6 border-b border-gray-200 bg-white z-10">
              <h1 className="text-xl font-bold text-[#32428D] text-center flex items-center justify-center gap-2">
                <ClipboardList className="w-4 h-4" />
                <span>{homeworkName || `Homework`}</span>
              </h1>
            </div>
          )}

          {/* Scrollable middle area (Circle + Feedback) */}
          <div className="flex-1 overflow-y-auto px-4 md:px-6 flex flex-col justify-center">
            {/* 4-Row badge (shows when user hits 4 correct in a row) */}
            {showFourRow && (
              <div className="mb-4 flex items-center justify-center z-10 relative">
                {/* Sparkle effects */}
                <div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  style={{ width: "220px", height: "220px" }}
                >
                  {/* Yellow sparkles */}
                  <div
                    className="absolute top-2 left-8 w-3 h-3 bg-yellow-400 rounded-full four-row-badge-sparkle shadow-lg"
                    style={{
                      animationDelay: "0s",
                      boxShadow: "0 0 12px rgba(250, 204, 21, 1)",
                    }}
                  ></div>
                  <div
                    className="absolute top-12 right-8 w-3 h-3 bg-yellow-400 rounded-full four-row-badge-sparkle shadow-lg"
                    style={{
                      animationDelay: "0.3s",
                      boxShadow: "0 0 12px rgba(250, 204, 21, 1)",
                    }}
                  ></div>
                  <div
                    className="absolute bottom-12 left-10 w-3 h-3 bg-yellow-400 rounded-full four-row-badge-sparkle shadow-lg"
                    style={{
                      animationDelay: "0.6s",
                      boxShadow: "0 0 12px rgba(250, 204, 21, 1)",
                    }}
                  ></div>
                  <div
                    className="absolute bottom-2 right-10 w-3 h-3 bg-yellow-400 rounded-full four-row-badge-sparkle shadow-lg"
                    style={{
                      animationDelay: "0.9s",
                      boxShadow: "0 0 12px rgba(250, 204, 21, 1)",
                    }}
                  ></div>
                  {/* Blue sparkles */}
                  <div
                    className="absolute top-1/2 left-2 w-2.5 h-2.5 bg-blue-400 rounded-full four-row-badge-sparkle shadow-lg"
                    style={{
                      animationDelay: "0.15s",
                      boxShadow: "0 0 10px rgba(96, 165, 250, 1)",
                    }}
                  ></div>
                  <div
                    className="absolute top-1/2 right-2 w-2.5 h-2.5 bg-blue-400 rounded-full four-row-badge-sparkle shadow-lg"
                    style={{
                      animationDelay: "0.45s",
                      boxShadow: "0 0 10px rgba(96, 165, 250, 1)",
                    }}
                  ></div>
                  {/* Additional sparkles for more fun */}
                  <div
                    className="absolute top-6 left-1/2 w-2 h-2 bg-pink-400 rounded-full four-row-badge-sparkle shadow-lg"
                    style={{
                      animationDelay: "0.2s",
                      boxShadow: "0 0 8px rgba(244, 114, 182, 1)",
                      transform: "translateX(-50%)",
                    }}
                  ></div>
                  <div
                    className="absolute bottom-6 left-1/2 w-2 h-2 bg-pink-400 rounded-full four-row-badge-sparkle shadow-lg"
                    style={{
                      animationDelay: "0.7s",
                      boxShadow: "0 0 8px rgba(244, 114, 182, 1)",
                      transform: "translateX(-50%)",
                    }}
                  ></div>
                  <div
                    className="absolute top-1/2 left-6 w-2 h-2 bg-green-400 rounded-full four-row-badge-sparkle shadow-lg"
                    style={{
                      animationDelay: "0.5s",
                      boxShadow: "0 0 8px rgba(74, 222, 128, 1)",
                    }}
                  ></div>
                  <div
                    className="absolute top-1/2 right-6 w-2 h-2 bg-green-400 rounded-full four-row-badge-sparkle shadow-lg"
                    style={{
                      animationDelay: "0.8s",
                      boxShadow: "0 0 8px rgba(74, 222, 128, 1)",
                    }}
                  ></div>
                </div>
                <div className="w-[180px] h-[180px] max-w-[65%] relative">
                  <Image
                    src={rowBadgeImage || "/images/4row.png"}
                    alt="Streak in a row"
                    width={180}
                    height={180}
                    className={`select-none drop-shadow-2xl ${
                      fourRowJustAppeared ? "four-row-badge-enter" : ""
                    } four-row-badge-pulse four-row-badge-glow four-row-badge-bounce four-row-badge-wiggle`}
                  />
                </div>
              </div>
            )}

            {/* Circle Progress */}
            <div className={`flex flex-col items-center justify-center`}>
              <div
                className={`relative flex items-center justify-center ${
                  isMobile ? "w-24 h-24" : "w-32 h-32 md:w-44 md:h-44"
                }`}
                style={{ padding: 8 }}
              >
                <svg
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                  width={isMobile ? "96" : "160"}
                  height={isMobile ? "96" : "160"}
                  viewBox={isMobile ? "0 0 96 96" : "0 0 144 144"}
                >
                  <circle
                    cx={isMobile ? "48" : "72"}
                    cy={isMobile ? "48" : "72"}
                    r={isMobile ? "40" : "64"}
                    fill="none"
                    stroke="#69AAFA"
                    strokeWidth={isMobile ? "3" : "6"}
                    strokeDasharray={2 * Math.PI * (isMobile ? 40 : 64)}
                    strokeDashoffset={
                      2 *
                      Math.PI *
                      (isMobile ? 40 : 64) *
                      (1 - (currentQuestionIndex + 1) / questions.length)
                    }
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 0.5s" }}
                    transform={`rotate(-90 ${isMobile ? "48 48" : "72 72"})`}
                  />
                </svg>
                <Image
                  src="/images/ic_progress_do.png"
                  alt="Progress Icon"
                  width={isMobile ? 80 : 144}
                  height={isMobile ? 80 : 144}
                  className="object-contain aspect-square"
                  priority
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span
                    className={`text-[#69AAFA] font-bold text-center select-none ${
                      isMobile ? "text-sm" : "text-2xl md:text-3xl"
                    }`}
                  >
                    {currentQuestionIndex + 1}/{questions.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Completed Message - Show when question has correct answer */}
            {hasCorrectAnswer && (
              <div className={`flex flex-col items-center justify-center mt-4`}>
                <div
                  className={`shadow-lg border-2 border-green-400 ${
                    isMobile
                      ? "max-w-xs w-full mx-2 rounded-lg p-2"
                      : "max-w-sm w-full mx-4 rounded-2xl p-4"
                  } bg-green-50`}
                >
                  <p
                    className={`font-bold text-center text-green-700 break-words whitespace-pre-line ${
                      isMobile ? "text-xs" : "text-base"
                    }`}
                  >
                    ✓ This question has been completed.
                  </p>
                </div>
              </div>
            )}

            {/* Feedback Message */}
            {feedbackState !== "initial" && !hasCorrectAnswer && (
              <div className={`flex flex-col items-center justify-center`}>
                <div
                  className={`shadow-lg border border-gray-200 ${
                    isMobile
                      ? "max-w-xs w-full mx-2 rounded-lg p-2"
                      : "max-w-sm w-full mx-4 rounded-2xl p-4"
                  }`}
                  style={{
                    backgroundColor: getBottomBackgroundColor(),
                    color: getFeedbackTextColor
                      ? getFeedbackTextColor()
                      : "#FFFFFF",
                  }}
                >
                  <p
                    className={`font-bold text-center text-white break-words whitespace-pre-line ${
                      isMobile ? "text-xs" : "text-base"
                    }`}
                  >
                    {getFeedbackMessage()}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom buttons */}
          <div
            className="flex-shrink-0 p-4 md:p-6 border-t border-gray-200 space-y-3"
            style={{ paddingBottom: "max(env(safe-area-inset-bottom), 1rem)" }}
          >
            <button
              onClick={onCheck}
              disabled={isCheckingAnswer || !canCheck() || hasCorrectAnswer}
              className={`w-full bg-[#4285F4] text-white font-bold px-6 transition-all hover:bg-[#3367D6] disabled:opacity-50 disabled:hover:bg-[#4285F4] shadow-lg inline-flex items-center justify-center gap-2 ${
                isMobile
                  ? "py-2 text-xs rounded-lg"
                  : "py-3 text-base rounded-2xl"
              }`}
            >
              <CheckCircle2 className={isMobile ? `w-3 h-3` : `w-4 h-4`} />
              {isCheckingAnswer ? "Checking..." : "Check"}
            </button>

            {onSkip && canSkip && canSkip() && (
              <button
                onClick={onSkip}
                className={`w-full bg-gray-500 text-white font-bold px-6 transition-all hover:bg-gray-600 shadow-lg ${
                  isMobile
                    ? "py-2 text-xs rounded-lg"
                    : "py-3 text-base rounded-2xl"
                }`}
              >
                Skip question
              </button>
            )}

            <button
              onClick={onFinishHomework}
              className={`w-full bg-green-600 text-white font-bold px-6 transition-all hover:bg-green-700 shadow-lg inline-flex items-center justify-center gap-2 ${
                isMobile
                  ? "py-2 text-xs rounded-lg"
                  : "py-3 text-base rounded-2xl"
              }`}
            >
              <Send className={isMobile ? `w-3 h-3` : `w-4 h-4`} />
              Submit
            </button>
          </div>
        </div>
      </div>

      {/* Nút Next Question + Đóng/Mở Side */}
      {/* Nút Next Question + Đóng/Mở Sidebar */}
      <div
        className={`fixed top-1/2 transform -translate-y-1/2 flex items-center transition-all duration-300 ease-in-out gap-x-2 ${
          isSidebarOpen
            ? //  Chỉnh khoảng cách giữa nút đóng/mở và sidebar
              isMobile
              ? "right-48"
              : "right-80"
            : "right-0"
        }`}
        style={{ zIndex: 9999 }}
      >
        {/* Next Button - Luôn ở bên trái */}
        <button
          onClick={onNext}
          disabled={(() => {
            if (currentQuestion?.type === "speaking") {
              if (typeof microphoneAvailable !== "undefined") {
                if (microphoneAvailable === false) {
                  // Không có micro, luôn enable Next
                  return false;
                }
                if (microphoneAvailable === null) {
                  // Đang kiểm tra micro, disable Next
                  return true;
                }
                // Nếu có micro, giữ nguyên logic cũ
              }
            }
            // Logic mới: nút Next hiển thị khi câu hiện tại nhỏ hơn câu đã làm đúng cao nhất
            if (completedQuestions && completedQuestions.size > 0) {
              // Tìm câu hỏi đã làm đúng cao nhất (index lớn nhất)
              const completedIndices = Array.from(completedQuestions)
                .map((questionId) => {
                  const index = questions.findIndex(
                    (q) => String(q.id) === String(questionId)
                  );
                  return index;
                })
                .filter((index) => index !== -1);

              if (completedIndices.length > 0) {
                const maxCompletedIndex = Math.max(...completedIndices);
                // Nếu câu hiện tại nhỏ hơn câu đã làm đúng cao nhất, cho phép Next
                // Nếu câu hiện tại lớn hơn câu đã làm đúng cao nhất, disable Next
                const shouldDisable =
                  currentQuestionIndex > maxCompletedIndex ||
                  currentQuestionIndex === questions.length - 1;
                return shouldDisable;
              }
            }

            // Logic cũ cho trường hợp không có lastQuestionIdCompleted
            return (
              currentQuestionIndex >= maxViewedQuestionIndex ||
              currentQuestionIndex === questions.length - 1
            );
          })()}
          className={`bg-[#4285F4] text-white rounded-full shadow-lg transition-all hover:scale-105 disabled:opacity-30 disabled:hover:scale-100 ${
            isMobile ? "p-2" : "p-4"
          }`}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            className={isMobile ? "w-4 h-4" : "w-6 h-6"}
          >
            <path
              d="M9 18L15 12L9 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Sidebar Toggle Button - Luôn ở bên phải */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`h-24 w-6 bg-white text-[#32428D] transition-all duration-300 hover:w-7 shadow-xl flex flex-col items-center justify-center border border-gray-300 rounded-l-lg group ${
            isSidebarOpen ? "opacity-100" : "opacity-60 hover:opacity-100"
          }`}
          title={isSidebarOpen ? "Ẩn sidebar" : "Hiện sidebar"}
        >
          {isSidebarOpen ? (
            <ChevronRight className="h-5 w-5 transition-all duration-300 group-hover:scale-110" />
          ) : (
            <ChevronLeft className="h-5 w-5 transition-all duration-300 group-hover:scale-110" />
          )}
        </button>
      </div>

      {/* Floating Action Panel - Xuất hiện khi sidebar ẩn và ảnh không zoom */}
      {!isSidebarOpen && !isImageZoomed && (
        <div className="fixed bottom-4 right-4 bg-white border border-gray-200 shadow-2xl rounded-xl z-[9998] transition-all duration-300 ease-in-out">
          <div className="flex flex-row gap-2 p-2">
            {/* Check Button */}
            <button
              onClick={onCheck}
              disabled={isCheckingAnswer || !canCheck() || hasCorrectAnswer}
              className={`bg-[#4285F4] text-white font-bold transition-all hover:bg-[#3367D6] disabled:opacity-50 disabled:hover:bg-[#4285F4] shadow-lg inline-flex items-center justify-center ${
                isMobile ? "w-10 h-10 rounded-lg" : "w-12 h-12 rounded-xl"
              }`}
              title="Check Answer"
            >
              <CheckCircle2 className={isMobile ? "w-3 h-3" : "w-4 h-4"} />
            </button>

            {/* Skip Button */}
            {onSkip && canSkip && canSkip() && (
              <button
                onClick={onSkip}
                className={`bg-gray-500 text-white font-bold transition-all hover:bg-gray-600 shadow-lg inline-flex items-center justify-center ${
                  isMobile ? "w-10 h-10 rounded-lg" : "w-12 h-12 rounded-xl"
                }`}
                title="Skip Question"
              >
                <span
                  className={`font-bold ${isMobile ? "text-xs" : "text-sm"}`}
                >
                  Skip
                </span>
              </button>
            )}

            {/* Submit Button */}
            {onFinishHomework && (
              <button
                onClick={onFinishHomework}
                className={`bg-green-600 text-white font-bold transition-all hover:bg-green-700 shadow-lg inline-flex items-center justify-center ${
                  isMobile ? "w-10 h-10 rounded-lg" : "w-12 h-12 rounded-xl"
                }`}
                title="Submit Homework"
              >
                <Send className={isMobile ? "w-3 h-3" : "w-4 h-4"} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Floating Feedback - Xuất hiện khi sidebar ẩn và có feedback và ảnh không zoom */}
      {!isSidebarOpen &&
        !isImageZoomed &&
        showFloatingFeedback &&
        feedbackState !== "initial" && (
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[9999] transition-all duration-300 ease-in-out">
            <div
              className={`shadow-2xl border-2 ${
                isMobile
                  ? "max-w-xs w-full mx-2 rounded-xl p-3"
                  : "max-w-sm w-full mx-4 rounded-2xl p-6"
              } animate-bounce`}
              style={{
                backgroundColor: getBottomBackgroundColor(),
                borderColor:
                  feedbackState === "correct" ? "#10B981" : "#EF4444",
                color: getFeedbackTextColor
                  ? getFeedbackTextColor()
                  : "#FFFFFF",
              }}
            >
              {/* Robot Image */}
              <div className="flex justify-center mb-3">
                <Image
                  src={getRobotImage() || "/placeholder.svg"}
                  alt="Robot Feedback"
                  width={isMobile ? 60 : 80}
                  height={isMobile ? 60 : 80}
                  className="object-contain"
                  priority
                />
              </div>

              <p
                className={`font-bold text-center text-white break-words whitespace-pre-line ${
                  isMobile ? "text-sm" : "text-lg"
                }`}
              >
                {getFeedbackMessage()}
              </p>

              {/* Close button */}
              <button
                onClick={() => setShowFloatingFeedback(false)}
                className="absolute top-2 right-2 w-6 h-6 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
              >
                <span className="text-white text-sm">×</span>
              </button>
            </div>
          </div>
        )}

      {/* Floating Progress - Xuất hiện khi sidebar ẩn và ảnh không zoom */}
      {!isSidebarOpen && !isImageZoomed && (
        <div className="fixed top-4 right-4 z-[9998] transition-all duration-300 ease-in-out">
          <div
            className={`bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 ${
              isMobile ? "p-2 min-w-[80px]" : "p-3 min-w-[120px]"
            }`}
          >
            <div
              className={`flex items-center justify-center ${
                isMobile ? "gap-1 mb-1" : "gap-2 mb-2"
              }`}
            >
              <div
                className={`bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center ${
                  isMobile ? "w-4 h-4" : "w-6 h-6"
                }`}
              >
                <span
                  className={`text-white font-bold ${
                    isMobile ? "text-[8px]" : "text-xs"
                  }`}
                >
                  {currentQuestionIndex + 1}
                </span>
              </div>
              <span
                className={`text-gray-700 font-medium ${
                  isMobile ? "text-[10px]" : "text-sm"
                }`}
              >
                / {questions.length}
              </span>
            </div>
            {/* Progress Bar */}
            <div
              className={`w-full bg-gray-200 rounded-full ${
                isMobile ? "h-1" : "h-2"
              }`}
            >
              <div
                className={`bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-300 ${
                  isMobile ? "h-1" : "h-2"
                }`}
                style={{
                  width: `${
                    ((currentQuestionIndex + 1) / questions.length) * 100
                  }%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Video Guide Dialog */}
      {showVideoDialog && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[10000]"
          onClick={() => setShowVideoDialog(false)}
          style={{ touchAction: "manipulation" }}
        >
          <div
            className={`relative w-full bg-white rounded-2xl shadow-2xl ${
              isMobile ? "max-w-lg mx-4" : "max-w-4xl mx-8"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShowVideoDialog(false)}
              className="absolute top-4 right-4 z-10 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
            >
              <span className="text-gray-600 text-xl">×</span>
            </button>

            {/* Video container */}
            <div className="p-6">
              <div className="w-full aspect-video flex items-center justify-center bg-black rounded-lg overflow-hidden">
                {currentQuestion?.type && getVideoPath(currentQuestion.type) ? (
                  <video
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                  >
                    <source
                      src={getVideoPath(currentQuestion.type)}
                      type="video/mp4"
                    />
                    Trình duyệt của bạn không hỗ trợ video.
                  </video>
                ) : (
                  <div className="text-white text-center p-4">
                    Không tìm thấy video hướng dẫn cho loại câu hỏi này.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
