"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { useAuth } from "@/lib/context/auth-context";
import { getAssignmentsRoute } from "@/lib/utils/route-utils";
import { AudioEffects } from "@/lib/utils/audio-utils";

// Interface for exam result data
interface ExamResultData {
  examName: string;
  score: number;
  totalTime: string;
  isLoading: boolean;
  ratio: number;
}

export default function ExamResultPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const examId = params.id as string;

  const [examResult, setExamResult] = useState<ExamResultData>({
    examName: "",
    score: 0,
    totalTime: "00:00",
    isLoading: true,
    ratio: 0,
  });

  // Function to convert seconds to MM:SS format
  const formatTimeFromSeconds = (timeInSeconds: string): string => {
    const seconds = Number.parseInt(timeInSeconds, 10);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  useEffect(() => {
    // Xóa dữ liệu tạm của bài làm khi vào trang kết quả
    localStorage.removeItem(`exam_doing_${examId}`);
    const loadExamResult = async () => {
      try {
        setExamResult((prev) => ({ ...prev, isLoading: true }));

        // Get exam result data from localStorage (saved from submission page)
        const examResultData = localStorage.getItem(`examResult_${examId}`);

        if (examResultData) {
          const parsedData = JSON.parse(examResultData);

          // Extract data from SaveScoreBulkResponse format
          if (parsedData.data) {
            setExamResult({
              examName: parsedData.data.exam_name || "TEST",
              score: parsedData.data.total_score || 0,
              totalTime: formatTimeFromSeconds(parsedData.data.time || "0"),
              isLoading: false,
              ratio: parsedData.data.ratio || 0,
            });

            // Play completion audio feedback
            AudioEffects.complete();
          }
        }
      } catch (error) {
        console.error("Error loading exam result:", error);
      }
    };

    loadExamResult();
  }, [examId]);

  const handleOkClick = () => {
    // Play navigation sound when clicking OK button
    AudioEffects.navigate();
    
    // Clean up stored exam result data
    localStorage.removeItem(`examResult_${examId}`);
    router.push(getAssignmentsRoute(user));
  };

  if (examResult.isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-blue-600 text-lg">Đang tải kết quả...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      {/* Main Content Card */}
      <motion.div
        className="bg-white rounded-3xl shadow-2xl p-12 max-w-3xl w-full relative overflow-hidden"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{ minHeight: "500px" }}
      >
        {/* Decorative Elements Inside Card */}
        {/* UFO - Top Right */}
        <motion.div
          className="absolute top-20 right-28"
          animate={{ x: [0, 15, 0], y: [0, -8, 0] }}
          transition={{
            duration: 4,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        >
          <Image
            src="/images/ufo.png"
            alt="UFO"
            width={110}
            height={83}
            className="opacity-80"
          />
        </motion.div>

        {/* Stars Inside Card */}
        <motion.div
          className="absolute top-16 left-16"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{
            duration: 2,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        >
          <Image
            src="/images/star-light-blue.png"
            alt="Star"
            width={30}
            height={30}
          />
        </motion.div>

        {/* Bottom Stars - repositioned to match the image */}
        <motion.div
          className="absolute bottom-16 right-20"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{
            duration: 2.5,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: 0.5,
          }}
        >
          <Image
            src="/images/star-blue.png"
            alt="Star"
            width={50}
            height={50}
          />
        </motion.div>

        <motion.div
          className="absolute bottom-40 right-20"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{
            duration: 3,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: 1,
          }}
        >
          <Image
            src="/images/star-cyan.png"
            alt="Star"
            width={22}
            height={22}
          />
        </motion.div>

        {/* Title */}
        <motion.div
          className="text-center mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-[#32428D] mb-2">
            {examResult.examName}
          </h1>
          <p className="text-[#32428D] text-xl font-semibold">Hoàn thành!</p>
        </motion.div>

        {/* Content Area */}
        <div className="flex justify-center">
          {/* Robot Character - Bottom Left */}
          <motion.div
            className="absolute bottom-12 left-8 flex-shrink-0"
            initial={{ scale: 0, x: -50 }}
            animate={{ scale: 1, x: 0 }}
            transition={{
              delay: 0.4,
              duration: 0.6,
              type: "spring",
              stiffness: 200,
            }}
          >
            <Image
              src="/images/robot-character.png"
              alt="Happy Robot"
              width={180}
              height={180}
              className="drop-shadow-lg"
            />
          </motion.div>

          {/* Score and Time Section - Centered */}
          <motion.div
            className="flex-1 max-w-md"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            {/* Score and Time Card */}
            <div className="bg-[#F3F5FF] rounded-[2rem] p-8 shadow-sm">
              {/* Score Section */}
              <div className="text-center mb-8">
                <p className="text-[#32428D] text-xl font-medium mb-4">Điểm:</p>
                <div className="relative inline-block">
                  <div className="w-28 h-28 bg-white border-4 border-gray-200 rounded-full flex items-center justify-center shadow-lg">
                    <motion.span
                      className="text-5xl font-bold text-[#0078FF]"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.8, duration: 0.4, type: "spring" }}
                    >
                      {Math.round(examResult.ratio)}
                    </motion.span>
                  </div>
                </div>
                <div className="text-[#32428D] mt-4">
                  <span>Điểm chưa tính 2 dạng bài Speaking và Writing</span>
                </div>
              </div>

              {/* Time Section */}
              <div className="text-center mb-4">
                <p className="text-[#32428D] text-xl font-medium mb-3">
                  Thời gian làm bài:
                </p>
                <p className="text-4xl font-bold text-[#0078FF]">
                  {examResult.totalTime}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* OK Button */}
        <motion.div
          className="text-center mt-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
        >
          <motion.button
            onClick={handleOkClick}
            className="bg-[#4285F4] hover:bg-[#3367D6] text-white font-bold py-4 px-16 rounded-full text-xl shadow-lg transition-all duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Quay lại
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
}
