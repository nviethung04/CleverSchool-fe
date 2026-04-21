"use client";

import type React from "react";
import { useEffect, useState } from "react";

import { useParams, useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Send, ClipboardList } from "lucide-react";
import Image from "next/image";

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
}: HomeworkSubmissionPageProps) {
  const router = useRouter();
  const params = useParams();
  const currentQuestion = questions[currentQuestionIndex];

  const [microphoneAvailable, setMicrophoneAvailable] = useState<
    boolean | null
  >(null);

  useEffect(() => {
    if (currentQuestion?.type === "speaking") {
      setMicrophoneAvailable(null); // reset while checking
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then(() => setMicrophoneAvailable(true))
        .catch(() => setMicrophoneAvailable(false));
    } else {
      setMicrophoneAvailable(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion?.id, currentQuestion?.type]);

  if (isLoading) {
    return (
      <div className="h-[100dvh] w-screen fixed inset-0 flex items-center justify-center bg-gradient-to-br from-blue-900 to-indigo-900 overflow-hidden">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Đang tải câu hỏi...</p>
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
            Không tìm thấy câu hỏi
          </h1>
          <p className="text-white/80">Bài tập này chưa có câu hỏi nào.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-screen flex overflow-hidden">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative min-w-0">
        {/* Question Header - Fixed at top */}
        <div className="flex-shrink-0 p-4 md:p-6 lg:p-8">
          <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-[#32428D] text-center">
            Question {currentQuestionIndex + 1}:{" "}
            {currentQuestion?.metadata?.instructions}
          </h2>
        </div>

        {/* Question Content - Scrollable area */}
        <div className="flex-1 overflow-y-auto overflow-x-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto w-full flex justify-center min-h-full">
            {/* Question Render */}
            <div className="flex-1 flex items-center justify-center py-8">
              {renderQuestion()}
            </div>
          </div>
        </div>

        {/* Navigation Buttons - Fixed positioning */}
        <button
          onClick={onBack}
          disabled={currentQuestionIndex === 0}
          className="absolute left-6 top-1/2 transform -translate-y-1/2 z-30 bg-[#4285F4] text-white rounded-full p-4 shadow-lg transition-all hover:scale-105 disabled:opacity-30 disabled:hover:scale-100"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            className="w-6 h-6"
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
              console.log(
                "completedQuestions:",
                Array.from(completedQuestions)
              );
              // Tìm câu hỏi đã làm đúng cao nhất (index lớn nhất)
              const completedIndices = Array.from(completedQuestions)
                .map((questionId) => {
                  const index = questions.findIndex(
                    (q) => String(q.id) === String(questionId)
                  );
                  console.log(
                    `Tìm câu hỏi ${questionId} trong questions:`,
                    index
                  );
                  return index;
                })
                .filter((index) => index !== -1);

              console.log("completedIndices:", completedIndices);

              if (completedIndices.length > 0) {
                const maxCompletedIndex = Math.max(...completedIndices);
                console.log(
                  "maxCompletedIndex:",
                  maxCompletedIndex,
                  "currentQuestionIndex:",
                  currentQuestionIndex
                );
                // Nếu câu hiện tại nhỏ hơn câu đã làm đúng cao nhất, cho phép Next
                // Nếu câu hiện tại lớn hơn câu đã làm đúng cao nhất, disable Next
                const shouldDisable =
                  currentQuestionIndex > maxCompletedIndex ||
                  currentQuestionIndex === questions.length - 1;
                console.log("shouldDisable Next:", shouldDisable);
                return shouldDisable;
              }
            }

            // Logic cũ cho trường hợp không có lastQuestionIdCompleted
            return (
              currentQuestionIndex >= maxViewedQuestionIndex ||
              currentQuestionIndex === questions.length - 1
            );
          })()}
          className="absolute right-6 top-1/2 transform -translate-y-1/2 z-30 bg-[#4285F4] text-white rounded-full p-4 shadow-lg transition-all hover:scale-105 disabled:opacity-30 disabled:hover:scale-100"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            className="w-6 h-6"
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
      </div>

      {/* Sidebar */}
      <div
        className="w-80 lg:w-96 md:w-72 sm:w-64 flex-shrink-0 flex flex-col relative overflow-hidden bg-white"
        // style={{
        //   backgroundImage: "url(/images/sidebar.png)",
        //   backgroundSize: "cover",
        //   backgroundPosition: "center",
        // }}
      >
        {/* Sidebar Content */}
        <div className="relative z-10 flex flex-col h-full">
          {/* Title Section - Fixed at top */}
          <div className="flex-shrink-0 p-4 md:p-6">
            <h1 className="text-lg md:text-xl font-bold text-[#32428D] mb-4 text-center flex items-center justify-center gap-2">
              <ClipboardList className="w-5 h-5 md:w-6 md:h-6" />
              <span>{homeworkName || `Bài tập về nhà`}</span>
            </h1>
            <div className="flex flex-col items-center justify-center py-4 md:py-8">
              <div
                className="relative flex items-center justify-center w-32 h-32 md:w-44 md:h-44"
                style={{ padding: 8 }}
              >
                {/* Circle Progress */}
                <svg
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                  width="160"
                  height="160"
                  viewBox="0 0 144 144"
                >
                  <circle
                    cx="72"
                    cy="72"
                    r="64"
                    fill="none"
                    stroke="#69AAFA"
                    strokeWidth="6"
                    strokeDasharray={2 * Math.PI * 64}
                    strokeDashoffset={
                      2 *
                      Math.PI *
                      64 *
                      (1 - (currentQuestionIndex + 1) / questions.length)
                    }
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 0.5s" }}
                    transform="rotate(-90 72 72)"
                  />
                </svg>
                <Image
                  src="/images/ic_progress_do.png"
                  alt="Progress Icon"
                  width={144}
                  height={144}
                  className="object-contain aspect-square"
                  priority
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[#69AAFA] text-2xl md:text-3xl font-bold text-center select-none">
                    {currentQuestionIndex + 1}/{questions.length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Content - Scrollable area */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {/* Robot Character with Feedback */}
            <div className="flex flex-col items-center justify-center p-4 md:p-6 relative min-h-[300px]">
              <div className="relative">
                <Image
                  src={getRobotImage() || "/placeholder.svg"}
                  alt="Robot Character"
                  width={120}
                  height={160}
                  className="drop-shadow-lg"
                  priority
                />
                {feedbackState !== "initial" && (
                  <div
                    className="absolute -top-16 left-1/2 transform -translate-x-1/2 rounded-2xl p-3 shadow-lg border border-gray-200 max-w-sm w-64"
                    style={{
                      backgroundColor: getBottomBackgroundColor(),
                      color: getFeedbackTextColor
                        ? getFeedbackTextColor()
                        : "#FFFFFF",
                    }}
                  >
                    <p className="font-bold text-base text-center break-words whitespace-pre-line">
                      {getFeedbackMessage()}
                    </p>
                    {/* Speech bubble arrow */}
                    <div
                      className="absolute bottom-[-8px] left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent"
                      style={{
                        borderTopColor: getBottomBackgroundColor(),
                      }}
                    ></div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Check Button và Submit Button - Fixed at bottom */}
          <div
            className="flex-shrink-0 p-4 md:p-6 border-t border-gray-200 space-y-3"
            style={{ paddingBottom: "max(env(safe-area-inset-bottom), 1rem)" }}
          >
            <button
              onClick={onCheck}
              disabled={isCheckingAnswer || !canCheck()}
              className="w-full bg-[#4285F4] text-white font-bold py-3 md:py-4 px-6 rounded-2xl transition-all hover:bg-[#3367D6] disabled:opacity-50 disabled:hover:bg-[#4285F4] shadow-lg text-base md:text-lg inline-flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" />
              {isCheckingAnswer ? "Đang kiểm tra..." : "Kiểm tra"}
            </button>

            {/* Skip Button */}
            {onSkip && canSkip && canSkip() && (
              <button
                onClick={onSkip}
                className="w-full bg-gray-500 text-white font-bold py-3 px-6 rounded-2xl transition-all hover:bg-gray-600 shadow-lg text-base"
              >
                Bỏ qua câu hỏi
              </button>
            )}

            {/* Submit Button - shown when onFinishHomework is provided */}
            {onFinishHomework && (
              <button
                onClick={onFinishHomework}
                className={`w-full bg-green-600 text-white font-bold py-3 md:py-4 px-6 rounded-2xl transition-all hover:bg-green-700 shadow-lg text-base md:text-lg inline-flex items-center justify-center gap-2 ${
                  isSubmitButtonEnabled ? "opacity-100" : "opacity-50"
                }`}
              >
                <Send className="w-5 h-5 md:w-6 md:h-6" />
                Nộp bài
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
