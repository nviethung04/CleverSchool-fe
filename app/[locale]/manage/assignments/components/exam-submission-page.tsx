"use client";

import React, { useState, useEffect, useRef } from "react";

import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  ClipboardCheck,
  Expand,
  X,
} from "lucide-react";
import type { Exam } from "@/lib/api/exams";
import { AudioEffects } from "@/lib/utils/audio-utils";

interface ExamSubmissionPageProps {
  examName: string;
  questions: any[] | null | undefined;
  currentQuestionIndex: number;
  examDetail: Exam | null;
  timeLeft: number | null;
  isLoading: boolean;
  onNext: () => void;
  onBack: () => void;
  onSubmit: () => void;
  onQuestionJump: (index: number) => void;
  renderQuestion: (isPopupMode?: boolean) => React.ReactNode;
  formatTime: (seconds: number | null) => string;
  isQuestionAnswered: (questionId: string) => boolean;
}

export default function ExamSubmissionPage({
  questions,
  currentQuestionIndex,
  examDetail,
  timeLeft,
  isLoading,
  onNext,
  onBack,
  onSubmit,
  onQuestionJump,
  renderQuestion,
  formatTime,
  isQuestionAnswered,
  examName,
}: ExamSubmissionPageProps) {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigationContainerRef = useRef<HTMLDivElement>(null);
  const questionButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const currentQuestion = Array.isArray(questions)
    ? questions[currentQuestionIndex]
    : null;

  const isMatchingQuestion = currentQuestion?.type === "matching";
  const isCategoryQuestion = currentQuestion?.type === "category";
  const isLabelingQuestion = currentQuestion?.type === "labeling";
  const shouldShowPopupButton =
    isMatchingQuestion || isCategoryQuestion || isLabelingQuestion;

  // Listen for expand events from complex questions
  useEffect(() => {
    const handleLabelingExpand = () => {
      setIsPopupOpen(true);
    };

    window.addEventListener("labelingExpand", handleLabelingExpand);

    return () => {
      window.removeEventListener("labelingExpand", handleLabelingExpand);
    };
  }, []);

  // Auto scroll current question to top of navigation
  useEffect(() => {
    const container = navigationContainerRef.current;
    const button = questionButtonRefs.current[currentQuestionIndex];
    if (!container || !button) return;

    // Tính vị trí cần cuộn đến (cách trên 40px)
    const containerRect = container.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();
    let targetScrollTop = buttonRect.top - containerRect.top + container.scrollTop - 40;

    // Giới hạn trong phạm vi cuộn hợp lệ
    const maxScroll = container.scrollHeight - container.clientHeight;
    if (targetScrollTop < 0) targetScrollTop = 0;
    if (targetScrollTop > maxScroll) targetScrollTop = maxScroll;

    // Bỏ qua animation nếu khoảng cách giữa 2 câu hỏi quá nhỏ
    const start = container.scrollTop;
    const distance = targetScrollTop - start;
    if (Math.abs(distance) < 2) return;

    // Cài đặt thời gian & hàm easing
    const duration = 1000; // Animation duration in ms
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
    const startTime = performance.now();

    // Hàm chạy animation
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOut(progress);

      container.scrollTop = start + distance * eased;
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [currentQuestionIndex]);

  if (isLoading) {
    return (
      <div className="h-[100dvh] w-screen fixed inset-0 flex items-center justify-center bg-gradient-to-br from-blue-900 to-indigo-900 overflow-hidden min-w-[360px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading questions...</p>
        </div>
      </div>
    );
  }

  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    return (
      <div className="h-[100dvh] w-screen fixed inset-0 flex items-center justify-center bg-gradient-to-br from-blue-900 to-indigo-900 overflow-hidden">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-white mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">
            No questions found
          </h1>
          <p className="text-white/80">This exam has no questions.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 flex overflow-hidden min-w-[360px] bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
      style={{
        backgroundImage: `
             linear-gradient(45deg, rgba(99, 102, 241, 0.05) 25%, transparent 25%),
             linear-gradient(-45deg, rgba(99, 102, 241, 0.05) 25%, transparent 25%),
             linear-gradient(45deg, transparent 75%, rgba(99, 102, 241, 0.05) 75%),
             linear-gradient(-45deg, transparent 75%, rgba(99, 102, 241, 0.05) 75%)
           `,
        backgroundSize: "20px 20px",
        backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
      }}
    >
      {/* Minimum Width Warning */}
      <div
        className="fixed top-0 left-0 right-0 bg-orange-500 text-white text-center py-2 text-sm z-50 block sm:hidden"
        style={{
          display:
            typeof window !== "undefined" && window.innerWidth < 360
              ? "block"
              : "none",
        }}
      >
        📱 Để có trải nghiệm tốt nhất, vui lòng sử dụng màn hình rộng hơn 360px
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col overflow-y-auto transition-all duration-300 ease-in-out ${isSidebarOpen ? '' : 'mr-[-5rem] sm:mr-[-6rem] md:mr-[-8rem] lg:mr-[-11rem] xl:mr-[-13rem]'
        } ${!isSidebarOpen ? 'pb-20' : ''}`}>
        {/* Question Header */}
        <div className="flex-shrink-0 px-4 sm:px-6 landscape:px-3 mt-6 lg:mt-12 mb-4 lg:mb-8 relative z-50">
          <div className="mobile-landscape-container bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 mx-4 sm:mx-8 md:mx-12 lg:mx-16 relative">
            <h2 className="mobile-landscape-title text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-3xl font-extrabold text-[#32428D] text-center leading-snug py-4 sm:py-5 md:py-6 px-4 sm:px-6">
              Question {currentQuestionIndex + 1}:{" "}
              {currentQuestion?.metadata?.instructions ||
                "Complete the question"}
            </h2>
            {shouldShowPopupButton && (
              <button
                onClick={() => setIsPopupOpen(true)}
                className="absolute top-1/2 right-4 sm:right-6 transform -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-full transition-all duration-300 hover:scale-110 hover:shadow-xl shadow-md flex items-center justify-center border border-white/20 lg:hidden"
                title="Xem toàn màn hình"
              >
                <svg
                  className="h-4 w-4 sm:h-4.5 sm:w-4.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M20.25 3.75v4.5m0-4.5h-4.5m4.5 0L15 9m5.25 11.25v-4.5m0 4.5h-4.5m4.5 0L15 15M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Question Render Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="min-h-full flex items-start justify-center pt-6 sm:pt-8 md:pt-12 landscape:pt-2 landscape:items-center px-4 sm:px-6 md:px-8 landscape:px-3">
            <div
              className="text-xl sm:text-xl md:text-2xl landscape:text-lg text-gray-800 leading-relaxed landscape:leading-snug text-center space-y-6 sm:space-y-8 landscape:space-y-3 w-full max-w-4xl bg-white/80 backdrop-blur-sm rounded-3xl p-6 sm:p-8 md:p-10 lg:p-12 shadow-xl border border-white/50"
              style={{
                transform: "none",
                isolation: "auto",
              }}
            >
              {renderQuestion()}
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar - Right */}
      <div className={`h-[100dvh] w-20 sm:w-24 md:w-32 lg:w-44 xl:w-52 flex-shrink-0 bg-gradient-to-b from-[#32428D] to-[#4a5bb8] shadow-2xl border-l-4 border-blue-300 flex flex-col transition-transform duration-300 ease-in-out relative ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
        {/* Sidebar Toggle Button - Modern vertical tab design */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-full h-24 w-6 bg-gradient-to-b from-[#32428D] to-[#4a5bb8] hover:from-[#2a3a7a] hover:to-[#3d4ba5] text-white transition-all duration-300 hover:w-7 shadow-lg flex flex-col items-center justify-center border border-white/20 rounded-l-lg z-10 group ${isSidebarOpen ? 'opacity-100' : 'opacity-60 hover:opacity-100'
            }`}

          title={isSidebarOpen ? "Ẩn sidebar" : "Hiện sidebar"}
        >
          {/* Arrow icon */}
          {isSidebarOpen ? (
            <ChevronRight className="h-4 w-4 transition-all duration-300 group-hover:scale-110" />
          ) : (
            <ChevronLeft className="h-4 w-4 transition-all duration-300 group-hover:scale-110" />
          )}
        </button>

        {/* Timer - Top */}
        <div className="flex-shrink-0 p-2 border-b border-white/20">
          <div className="bg-white/95 backdrop-blur-sm rounded-md px-2 py-1.5 md:px-4 md:py-3 border border-white/50 shadow-lg">
            <div className="flex items-center justify-center gap-2 landscape:gap-1">
              <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse"></div>
              <div className="text-lg landscape:text-base font-bold text-[#32428D] tabular-nums leading-none">
                {formatTime(timeLeft) || "00:00"}
              </div>
            </div>
          </div>
        </div>

        {/* Question Navigation - Middle */}
        <div className="flex-1 p-2 items-center justify-center overflow-y-auto" ref={navigationContainerRef}>
          <div className="space-y-1.5">
            <h3 className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-bold text-white text-center mb-2">
              Questions
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1 justify-items-center">
              {Array.isArray(questions) &&
                questions.map((question, index) => {
                  const isAnswered = isQuestionAnswered(question.id);
                  const isCurrent = index === currentQuestionIndex;
                  return (
                    <button
                      key={index}
                      ref={(el) => {
                        questionButtonRefs.current[index] = el;
                      }}
                      onClick={() => {
                        // Play audio feedback when question button is clicked
                        AudioEffects.navigate();
                        onQuestionJump(index);
                      }}
                      className={`
                        w-8 h-8 rounded-full text-xs font-bold transition-all duration-200 hover:scale-110 cursor-pointer shadow-sm flex items-center justify-center
                        ${isCurrent && isAnswered
                          ? "bg-[#3B82F6] text-white"
                          : isCurrent && !isAnswered
                            ? "bg-white text-blue-500 border-2 border-blue-500"
                            : isAnswered
                              ? "bg-green-500 text-white"
                              : "bg-white/20 text-white hover:bg-white/30"
                        }
                      `}
                    >
                      {index + 1}
                    </button>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Submit Button - Bottom */}
        <div className="flex-shrink-0 p-2 border-t border-white/20">
          <button
            onClick={onSubmit}
            className="w-full group bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-md py-2 md:py-3 border border-white/30 shadow-lg text-xs transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-95 flex items-center justify-center gap-1 backdrop-blur-sm"
          >
            <div className="w-3 h-3 bg-white/20 rounded-full group-hover:bg-white/30 transition-colors">
              <ClipboardCheck className="w-2 h-2" />
            </div>
            <span>Submit</span>
          </button>
        </div>
      </div>

      {/* Popup Modal for Complex Questions (Matching & Category) */}
      {isPopupOpen && shouldShowPopupButton && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm">
          <div className="w-full h-full flex flex-col bg-white/95 backdrop-blur-md shadow-2xl border border-white/50 sm:rounded-3xl sm:m-4 sm:max-w-7xl sm:mx-auto sm:max-h-[calc(100vh-2rem)]">
            {/* Popup Header */}
            <div className="flex-shrink-0 flex items-center justify-between p-4 sm:p-6 bg-gradient-to-r from-[#32428D] to-[#4a5bb8] text-white sm:rounded-t-3xl">
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold pr-4">
                {isMatchingQuestion && "Matching: "}
                {isCategoryQuestion && "Category: "}
                {isLabelingQuestion && "Labeling: "}
                Question {currentQuestionIndex + 1}:{" "}
                {currentQuestion?.metadata?.instructions ||
                  "Complete the question"}
              </h3>
              <button
                onClick={() => {
                  setIsPopupOpen(false);
                  // Force a small delay to ensure state is fully synchronized
                  setTimeout(() => {
                    console.log(
                      "Popup closed - UI should be updated with latest answers"
                    );
                  }, 100);
                }}
                className="flex-shrink-0 bg-white/20 hover:bg-white/30 p-2 rounded-full transition-all duration-200 hover:scale-110"
                title="Đóng"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>

            {/* Popup Content - Fixed height with scroll */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <div className="p-4 sm:p-6 min-h-full">
                {renderQuestion(true)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Portal container for drag overlay - highest z-index */}
      <div
        id="drag-overlay-portal"
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 99999 }}
      />

      {/* CSS cho mobile landscape only */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @media (max-width: 1024px) and (orientation: landscape) {
            .mobile-landscape-header {
              margin-top: 0.25rem !important;
              margin-bottom: 0.5rem !important;
              padding-left: 0.5rem !important;
              padding-right: 0.5rem !important;
            }
            
            .mobile-landscape-container {
              margin-left: 0.5rem !important;
              margin-right: 0.5rem !important;
            }
            
            .mobile-landscape-title {
              font-size: 0.875rem !important;
              padding-top: 0.5rem !important;
              padding-bottom: 0.5rem !important;
              padding-left: 0.75rem !important;
              padding-right: 0.75rem !important;
            }
            
            .mobile-landscape-render-area {
              top: 1rem !important;
            }
            
            .mobile-landscape-content-wrapper {
              padding-top: 1rem !important;
            }
            
            .mobile-landscape-content {
              font-size: 0.75rem !important;
              padding: 0.75rem !important;
              line-height: 1.25 !important;
              color: #32428D !important;
            }
            
            .mobile-landscape-drag-text {
              margin-top: 2.5rem !important;
              margin-bottom: 1rem !important;
            }
          }
          
          /* Đảm bảo drag overlay không bị ảnh hưởng bởi transform context */
          .dnd-overlay-container {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            pointer-events: none !important;
            z-index: 99999 !important;
          }
        `,
        }}
      />

      {/* Floating Submit Panel - Xuất hiện khi sidebar ẩn */}
      {!isSidebarOpen && (
        <div className="fixed bottom-4 right-4 bg-white border border-gray-200 shadow-2xl rounded-xl z-[9998] transition-all duration-300 ease-in-out">
          <div className="flex flex-col gap-2 p-2">
            {/* Sidebar Toggle Button */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="bg-[#32428D] text-white font-bold transition-all hover:bg-[#2a3a7a] shadow-lg inline-flex items-center justify-center w-12 h-12 rounded-xl"
              title="Mở menu"
            >
              <ClipboardList className="w-5 h-5" />
            </button>

            {/* Submit Button */}
            <button
              onClick={onSubmit}
              disabled={isLoading}
              className="bg-green-600 text-white font-bold transition-all hover:bg-green-700 disabled:opacity-50 disabled:hover:bg-green-600 shadow-lg inline-flex items-center justify-center w-12 h-12 rounded-xl"
              title="Nộp bài"
            >
              <ClipboardCheck className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Progress - Xuất hiện khi sidebar ẩn */}
      {!isSidebarOpen && questions && questions.length > 0 && (
        <div className="fixed top-4 right-4 z-[9998] transition-all duration-300 ease-in-out">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-3 min-w-[120px]">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">
                  {currentQuestionIndex + 1}
                </span>
              </div>
              <span className="text-gray-700 font-medium text-sm">
                / {questions.length}
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
