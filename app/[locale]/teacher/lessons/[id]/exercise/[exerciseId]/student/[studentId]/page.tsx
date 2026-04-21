"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  CheckCircle,
  User,
  FileText,
  Mic,
  PenTool,
  Star,
  Volume2,
  Video,
  Clock,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { TiptapMathViewer } from "@/components/question-editor/tiptap-math-viewer";
import {
  getExerciseAnswersByTeacher,
  saveManualScoring,
  type ExerciseOverview,
  postExerciseComment,
} from "@/lib/api/exercises";
import { toast } from "sonner";
import { useTypedTranslations } from "@/lib/i18n/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface StudentSubmission {
  id: string;
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  exerciseId: string;
  exerciseTitle: string;
  submittedAt: string;
  status: "submitted" | "graded" | "draft";
  totalQuestions: number;
  answers: StudentAnswer[];
  totalScore?: number;
  maxScore: number;
  timeSpent: number;
  feedback?: string;
  overview?: ExerciseOverview;
}

interface StudentAnswer {
  questionId: string;
  questionType: string;
  questionText: string;
  questionMedia?: { type: "image" | "video" | "audio"; url: string };
  questionPoints: number;
  answer: any;
  score?: number;
  feedback?: string;
  isCorrect?: boolean;
  options?: any[];
  is_all_correct?: boolean; // Thêm trường này vào StudentAnswer
}

// Component to render media content
const MediaContent = ({
  media,
  t,
}: {
  media?: { type: "image" | "video" | "audio"; url: string };
  t: (key: string) => string;
}) => {
  if (!media) return null;

  switch (media.type) {
    case "image":
      return (
        <div className="mt-2">
          <img
            src={media.url || "/placeholder.svg?height=120&width=180"}
            alt={t("questionMedia")}
            className="max-w-full h-auto rounded border max-h-32"
          />
        </div>
      );
    case "video":
      return (
        <div className="mt-2">
          <video
            controls
            className="max-w-full h-auto rounded border max-h-32"
            src={media.url}
          />
        </div>
      );
    case "audio":
      return (
        <div className="flex items-center space-x-2 p-2 bg-gray-100 rounded mt-2">
          {/* <Volume2 className="h-4 w-4" /> */}
          <audio controls src={media.url} className="flex-1" />
        </div>
      );
    default:
      return null;
  }
};

// Component to render different question types
const QuestionAnswerDisplay = ({
  answer,
  index,
  onScoreChange,
  t,
}: {
  answer: StudentAnswer;
  index: number;
  onScoreChange: (score: number | undefined) => void;
  t: (key: string) => string;
}) => {
  const renderStudentAnswer = () => {
    switch (answer.questionType) {
      case "multiple_choice":
        return (
          <div className="space-y-3">
            {/* Show all answer options in grid layout */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">Các lựa chọn:</p>
              <div className="grid grid-cols-2 gap-3">
                {answer.options?.map((option: any, idx: number) => {
                  const isSelected = answer.answer.selectedAnswers?.includes(
                    option.content
                  );
                  const isCorrect = answer.answer.correctAnswers?.includes(
                    option.content
                  );

                  let bgColor = "bg-white border-gray-300";
                  if (isSelected && isCorrect) {
                    bgColor = "bg-green-200 border-green-400 font-medium";
                  } else if (isSelected && !isCorrect) {
                    bgColor = "bg-red-200 border-red-400 font-medium";
                  } else if (!isSelected && isCorrect) {
                    bgColor = "bg-green-100 border-green-300";
                  }

                  return (
                    <div
                      key={idx}
                      className={`flex items-center space-x-3 px-3 py-2 rounded border text-sm ${bgColor}`}
                    >
                      <span className="font-medium">
                        {String.fromCharCode(65 + idx)}.
                      </span>
                      <div className="flex items-center space-x-2 flex-1">
                        {/* Show both content and image if available */}
                        {option.content && <span>{option.content}</span>}
                        {option.file_url && (
                          <img
                            src={option.file_url || "/placeholder.svg"}
                            alt={t("answerOption")}
                            className="max-h-8 max-w-16 object-contain"
                          />
                        )}
                      </div>
                      {isSelected && (
                        <Badge variant="outline" className="ml-auto">
                          {isCorrect ? "✓" : "✗"}
                        </Badge>
                      )}
                      {!isSelected && isCorrect && (
                        <Badge
                          variant="outline"
                          className="ml-auto text-green-600"
                        >
                          ✓
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case "fill_in_blanks":
        return (
          <div
            className={`space-y-2 p-3 rounded border ${
              answer.is_all_correct
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <p className="text-sm font-medium text-gray-600">
              Câu trả lời của học sinh:
            </p>
            <div className="flex flex-wrap gap-2">
              {Array.isArray(answer.answer.blanks) ? (
                answer.answer.blanks.map((blank: any, idx: number) => (
                  <div key={idx} className="flex items-center space-x-1">
                    <span className="text-sm text-gray-500">{idx + 1}:</span>
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        blank.isCorrect ? "bg-green-100" : "bg-red-100"
                      }`}
                    >
                      {blank.answer || t("empty")} {blank.isCorrect ? "✓" : "✗"}
                    </span>
                    {blank.correctAnswer &&
                      blank.answer !== blank.correctAnswer && (
                        <span className="text-xs text-gray-500">
                          (Đáp án: {blank.correctAnswer})
                        </span>
                      )}
                  </div>
                ))
              ) : (
                <span className="px-2 py-1 bg-blue-100 rounded text-sm">
                  {typeof answer.answer.text === "string"
                    ? answer.answer.text
                    : t("empty")}
                </span>
              )}
            </div>
          </div>
        );

      case "drag_drop":
        const dragStats =
          answer.answer.correctCount && answer.answer.totalCount
            ? `${answer.answer.correctCount}/${answer.answer.totalCount} đúng`
            : "";

        return (
          <div className="space-y-3 p-3 rounded border bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-600">
                Các đáp án đã kéo thả:
              </p>
              {dragStats && (
                <Badge variant="outline" className="text-xs">
                  {dragStats}
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {answer.answer.positions?.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-2 rounded text-sm ${
                    item.isCorrect
                      ? "bg-green-100 border border-green-300"
                      : "bg-red-100 border border-red-300"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-blue-600">
                      Vị trí {item.position}:
                    </span>
                    <span>{item.content}</span>
                    {item.file_url && (
                      <img
                        src={item.file_url || "/placeholder.svg"}
                        alt={t("dragDropItem")}
                        className="max-h-6 max-w-12 object-contain"
                      />
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={item.isCorrect ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {item.isCorrect ? "✓" : "✗"}
                    </Badge>
                    {!item.isCorrect && item.correctAnswer && (
                      <span className="text-xs text-gray-500">
                        (Đáp án: {item.correctAnswer})
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "ordering":
        const orderStats =
          answer.answer.correctCount && answer.answer.totalCount
            ? `${answer.answer.correctCount}/${answer.answer.totalCount} đúng`
            : "";

        return (
          <div className="space-y-3 p-3 rounded border bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-600">
                Thứ tự sắp xếp của học sinh:
              </p>
              {orderStats && (
                <Badge variant="outline" className="text-xs">
                  {orderStats}
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {answer.answer.positions?.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className={`flex items-center space-x-1 px-3 py-1 rounded text-sm ${
                    item.isCorrect
                      ? "bg-green-100 border border-green-300"
                      : "bg-red-100 border border-red-300"
                  }`}
                >
                  <span className="font-medium text-blue-600">
                    {item.position}.
                  </span>
                  <span>{item.content}</span>
                  <Badge
                    variant={item.isCorrect ? "default" : "destructive"}
                    className="text-xs ml-1"
                  >
                    {item.isCorrect ? "✓" : "✗"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        );

      case "category":
        const categoryStats =
          answer.answer.correctCount && answer.answer.totalCount
            ? `${answer.answer.correctCount}/${answer.answer.totalCount} đúng`
            : "";

        return (
          <div className="space-y-3 p-3 rounded border bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-600">
                Phân loại của học sinh:
              </p>
              {categoryStats && (
                <Badge variant="outline" className="text-xs">
                  {categoryStats}
                </Badge>
              )}
            </div>
            <div className="space-y-3">
              {Object.entries(answer.answer.groups || {}).map(
                ([groupName, items]: [string, any]) => (
                  <div key={groupName}>
                    <h4 className="font-medium text-gray-700 mb-1">
                      {groupName}:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(items) &&
                        items.map((item: any, idx: number) => (
                          <div
                            key={idx}
                            className={`px-2 py-1 rounded text-sm flex items-center space-x-1 ${
                              item.isCorrect
                                ? "bg-green-100 border border-green-300"
                                : "bg-red-100 border border-red-300"
                            }`}
                          >
                            <span>{item.content}</span>
                            <Badge
                              variant={
                                item.isCorrect ? "default" : "destructive"
                              }
                              className="text-xs"
                            >
                              {item.isCorrect ? "✓" : "✗"}
                            </Badge>
                          </div>
                        ))}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        );

      case "labeling":
        const labelStats =
          answer.answer.correctCount && answer.answer.totalCount
            ? `${answer.answer.correctCount}/${answer.answer.totalCount} đúng`
            : "";

        return (
          <div className="space-y-3 p-3 rounded border bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-600">
                Nhãn đã đánh dấu:
              </p>
              {labelStats && (
                <Badge variant="outline" className="text-xs">
                  {labelStats}
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {answer.answer.labels?.map((label: any, idx: number) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-2 rounded text-sm ${
                    label.is_correct
                      ? "bg-green-100 border border-green-300"
                      : "bg-red-100 border border-red-300"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Vị trí {idx + 1}:</span>
                    <span>{label.answer_content}</span>
                    {label.answer_file_url && (
                      <img
                        src={label.answer_file_url || "/placeholder.svg"}
                        alt="Label content"
                        className="max-h-6 max-w-12 object-contain"
                      />
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={label.is_correct ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {label.is_correct ? "✓" : "✗"}
                    </Badge>
                    {!label.is_correct && (
                      <span className="text-xs text-gray-500">
                        (Đáp án: {label.true_blank_content})
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "matching":
        const matchStats =
          answer.answer.correctCount && answer.answer.totalCount
            ? `${answer.answer.correctCount}/${answer.answer.totalCount} đúng`
            : "";

        return (
          <div className="space-y-3 p-3 rounded border bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-600">
                Kết quả ghép đôi:
              </p>
              {matchStats && (
                <Badge variant="outline" className="text-xs">
                  {matchStats}
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {answer.answer.matches?.map((match: any, idx: number) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-3 rounded text-sm ${
                    match.isCorrect
                      ? "bg-green-100 border border-green-300"
                      : "bg-red-100 border border-red-300"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {/* First Item */}
                    <div className="flex items-center space-x-2">
                      {match.firstItem.file_url ? (
                        <img
                          src={match.firstItem.file_url || "/placeholder.svg"}
                          alt="First item"
                          className="max-h-12 max-w-20 object-contain"
                        />
                      ) : (
                        <span>{match.firstItem.content}</span>
                      )}
                    </div>
                    <span className="text-gray-400">↔</span>
                    {/* Second Item */}
                    <div className="flex items-center space-x-2">
                      {match.secondItem.file_url ? (
                        <img
                          src={match.secondItem.file_url || "/placeholder.svg"}
                          alt="Second item"
                          className="max-h-12 max-w-20 object-contain"
                        />
                      ) : (
                        <span>{match.secondItem.content}</span>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant={match.isCorrect ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {match.isCorrect ? "✓" : "✗"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        );

      case "writing":
        return (
          <div className="p-3 rounded border bg-blue-50 border-blue-200">
            <p className="text-sm font-medium text-gray-600 mb-2">
              Bài viết của học sinh:
            </p>
            <div className="bg-white p-3 rounded border">
              <p className="whitespace-pre-wrap text-sm">
                {answer.answer.text || t("notWritten")}
              </p>
            </div>
            {answer.answer.isScored && (
              <div className="mt-2 flex items-center space-x-2">
                <Badge
                  variant="default"
                  className="bg-green-100 text-green-800"
                >
                  Đã chấm: {answer.answer.score} điểm
                </Badge>
              </div>
            )}
          </div>
        );

      case "speaking":
        return (
          <div className="p-3 rounded border bg-blue-50 border-blue-200">
            <p className="text-sm font-medium text-gray-600 mb-2">
              Bài ghi âm của học sinh:
            </p>
            {answer.answer.fileUrl ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-3 bg-white p-3 rounded border">
                  {/* <Mic className="h-5 w-5 text-blue-600" /> */}
                  {/* <span className="text-sm">
                      Thời lượng: {answer.answer.duration || 0}s
                    </span> */}
                  <audio
                    controls
                    src={answer.answer.fileUrl}
                    className="flex-1"
                  />
                </div>
              </div>
            ) : (
              <div className="bg-white p-3 rounded border text-center text-gray-500 text-sm">
                (Chưa ghi âm/quay video)
              </div>
            )}
            {answer.answer.isScored && (
              <div className="mt-2 flex items-center space-x-2">
                <Badge
                  variant="default"
                  className="bg-green-100 text-green-800"
                >
                  Đã chấm: {answer.answer.score} điểm
                </Badge>
              </div>
            )}
          </div>
        );

      // case "speaking":
      //   return (
      //     <div className="p-3 rounded border bg-blue-50 border-blue-200">
      //       <p className="text-sm font-medium text-gray-600 mb-2">
      //         Bài ghi âm của học sinh:
      //       </p>
      //       {answer.answer.fileUrl ? (
      //         <div className="space-y-3">
      //           {answer.answer.fileUrl.includes(".mp4") ||
      //           answer.answer.fileUrl.includes(".webm") ? (
      //             <div className="flex items-center space-x-3 bg-white p-3 rounded border">
      //               <Video className="h-5 w-5 text-blue-600" />
      //               <video
      //                 controls
      //                 src={answer.answer.fileUrl}
      //                 className="max-w-xs max-h-32"
      //               />
      //             </div>
      //           ) : (
      //             <div className="flex items-center space-x-3 bg-white p-3 rounded border">
      //               <Mic className="h-5 w-5 text-blue-600" />
      //               <span className="text-sm">
      //                 Thời lượng: {answer.answer.duration || 0}s
      //               </span>
      //               <audio
      //                 controls
      //                 src={answer.answer.fileUrl}
      //                 className="flex-1"
      //               />
      //             </div>
      //           )}
      //         </div>
      //       ) : (
      //         <div className="bg-white p-3 rounded border text-center text-gray-500 text-sm">
      //           (Chưa ghi âm/quay video)
      //         </div>
      //       )}
      //       {answer.answer.isScored && (
      //         <div className="mt-2 flex items-center space-x-2">
      //           <Badge
      //             variant="default"
      //             className="bg-green-100 text-green-800"
      //           >
      //             Đã chấm: {answer.answer.score} điểm
      //           </Badge>
      //         </div>
      //       )}
      //     </div>
      //   );

      default:
        return (
          <div className="p-3 rounded border bg-blue-50 border-blue-200">
            <pre className="whitespace-pre-wrap text-sm">
              {JSON.stringify(answer.answer, null, 2)}
            </pre>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Question */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Câu hỏi:</h4>
        <div className="text-gray-700 space-y-2">
          <TiptapMathViewer value={answer.questionText} />
          {answer.questionMedia && (
            <MediaContent media={answer.questionMedia} t={t} />
          )}
        </div>
      </div>

      {/* Student Answer */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">
          Câu trả lời của học sinh:
        </h4>
        <div className="text-gray-700">{renderStudentAnswer()}</div>
      </div>

      {/* Grading Section for subjective questions */}
      {(answer.questionType === "writing" ||
        answer.questionType === "speaking") && (
        <div className="bg-yellow-50 rounded-lg p-4 space-y-4">
          <h4 className="font-medium text-gray-900 flex items-center">
            <Star className="h-4 w-4 mr-2 text-yellow-600" />
            Chấm điểm thủ công
          </h4>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Điểm số (tối đa {answer.questionPoints})
            </label>
            <Input
              type="number"
              min="0"
              max={answer.questionPoints}
              step="0.5"
              value={answer.score ?? ""}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === "") {
                  onScoreChange(undefined);
                  return;
                }
                const parsed = Number.parseFloat(raw);
                if (Number.isNaN(parsed)) {
                  onScoreChange(undefined);
                  return;
                }
                const clamped = Math.max(
                  0,
                  Math.min(parsed, answer.questionPoints)
                );
                onScoreChange(clamped);
              }}
              placeholder={t("enterScore")}
              className="w-full"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default function GradeExercisePage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params as any)?.locale || "vi";
  const t = useTypedTranslations("gradeExercise");
  const [submission, setSubmission] = useState<StudentSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [showUnscoredDialog, setShowUnscoredDialog] = useState(false);
  const [unscoredCount, setUnscoredCount] = useState<number>(0);

  // Extract dynamic IDs from URL params
  const exerciseId = params.exerciseId as string;
  const studentId = params.studentId as string;

  // Helper function to format duration from seconds to MM:SS
  const formatDuration = (seconds: string | number) => {
    const totalSeconds =
      typeof seconds === "string" ? Number.parseInt(seconds) : seconds;
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Helper function to format unix timestamp to readable date
  const formatSubmittedAt = (timestamp: string) => {
    const date = new Date(Number.parseInt(timestamp) * 1000);
    return date.toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  useEffect(() => {
    fetchSubmission();
  }, []);

  const fetchSubmission = async () => {
    try {
      setLoading(true);
      console.log(
        `Fetching exercise answers with user_id: ${studentId}, exercise_id: ${exerciseId}`
      );

      // Call API with dynamic values from URL params
      const response = await getExerciseAnswersByTeacher({
        exercise_id: Number.parseInt(exerciseId),
        user_id: Number.parseInt(studentId),
      });
      console.log("Full API Response:", response);

      // Fix: Access questions from response.data.questions instead of response.questions
      if (
        response &&
        response.data &&
        response.data.questions &&
        response.data.questions.length > 0
      ) {
        const questions = response.data.questions;
        const overview = response.data.overview;
        setQuestions(questions);

        // Convert API data to UI format
        const convertedAnswers = questions.map((question: any) => {
          const baseAnswer = {
            questionId: question.id,
            questionType: question.type,
            questionText: question.content,
            questionMedia:
              question.file_url && question.question_kind
                ? {
                    type: question.question_kind as "image" | "video" | "audio",
                    url: question.file_url,
                  }
                : undefined,
            questionPoints: 10, // Default points, will be updated based on question type
            answer: {},
            score: undefined,
            isCorrect: undefined,
            is_all_correct: undefined, // Thêm trường này vào StudentAnswer
          };

          // Handle different question types based on new API structure
          switch (question.type) {
            case "multiple_choice":
              if (question.answer_multiple_choice) {
                const mc = question.answer_multiple_choice;
                return {
                  ...baseAnswer,
                  answer: {
                    selectedAnswers: mc.answers || [],
                    correctAnswers: mc.true_answers || [],
                  },
                  options:
                    mc.all_answer_contents?.map(
                      (content: string, idx: number) => ({
                        content,
                        file_url: mc.all_answer_file_urls?.[idx] || "",
                        kind: mc.all_answer_kinds?.[idx] || "text",
                      })
                    ) || [],
                  is_all_correct: mc.is_all_correct, // Sử dụng is_correct cho is_all_correct
                };
              }
              break;

            case "fill_in_blanks":
              if (question.answer_fill_in_blank) {
                const fib = question.answer_fill_in_blank;
                return {
                  ...baseAnswer,
                  answer: {
                    blanks:
                      fib.answers?.map((a: any) => ({
                        answer: a.answer,
                        correctAnswer: a.true_answer,
                        isCorrect: a.is_correct,
                      })) || [],
                  },
                  is_all_correct: fib.is_all_correct,
                };
              }
              break;

            case "drag_drop":
              if (question.answer_position) {
                const dd = question.answer_position;
                const correctCount =
                  dd.answers?.filter((a: any) => a.is_correct).length || 0;
                const totalCount = dd.answers?.length || 0;

                return {
                  ...baseAnswer,
                  answer: {
                    positions:
                      dd.answers?.map((a: any) => ({
                        position: a.sort_position,
                        content: a.answer_content,
                        file_url: a.answer_file_url,
                        correctAnswer: a.true_answer_content,
                        isCorrect: a.is_correct,
                      })) || [],
                    correctCount,
                    totalCount,
                  },
                  is_all_correct: dd.is_all_correct,
                };
              }
              break;

            case "ordering":
              if (question.answer_position) {
                const ord = question.answer_position;
                const correctCount =
                  ord.answers?.filter((a: any) => a.is_correct).length || 0;
                const totalCount = ord.answers?.length || 0;

                return {
                  ...baseAnswer,
                  answer: {
                    positions:
                      ord.answers?.map((a: any) => ({
                        position: a.sort_position,
                        content: a.answer_content,
                        isCorrect: a.is_correct,
                      })) || [],
                    correctCount,
                    totalCount,
                  },
                  is_all_correct: ord.is_all_correct,
                };
              }
              break;

            case "category":
              if (question.answer_group) {
                const cat = question.answer_group;
                const groups: any = {};
                let correctCount = 0;
                let totalCount = 0;

                cat.groups?.forEach((g: any) => {
                  if (!groups[g.group_content]) {
                    groups[g.group_content] = [];
                  }
                  groups[g.group_content].push({
                    content: g.answer_content,
                    isCorrect: g.is_correct,
                  });
                  totalCount++;
                  if (g.is_correct) correctCount++;
                });

                return {
                  ...baseAnswer,
                  answer: {
                    groups,
                    correctCount,
                    totalCount,
                  },
                  is_all_correct: cat.is_all_correct,
                };
              }
              break;

            case "labeling":
              if (question.answer_labeling) {
                const lab = question.answer_labeling;
                const correctCount =
                  lab.answers?.filter((a: any) => a.is_correct).length || 0;
                const totalCount = lab.answers?.length || 0;

                return {
                  ...baseAnswer,
                  answer: {
                    labels: lab.answers || [],
                    correctCount,
                    totalCount,
                  },
                  is_all_correct: lab.is_all_correct,
                };
              }
              break;

            case "matching":
              if (question.answer_matching) {
                const mat = question.answer_matching;
                const correctCount =
                  mat.matches?.filter((m: any) => m.is_correct).length || 0;
                const totalCount = mat.matches?.length || 0;

                return {
                  ...baseAnswer,
                  answer: {
                    matches:
                      mat.matches?.map((m: any) => ({
                        firstItem: {
                          content: m.first_item_content,
                          file_url: m.first_item_file_url,
                          kind: m.first_item_kind,
                        },
                        secondItem: {
                          content: m.second_item_content,
                          file_url: m.second_item_file_url,
                          kind: m.second_item_kind,
                        },
                        isCorrect: m.is_correct,
                      })) || [],
                    correctCount,
                    totalCount,
                  },
                  is_all_correct: mat.is_all_correct,
                };
              }
              break;

            case "writing":
              if (question.answer_manual) {
                const manual = question.answer_manual;
                return {
                  ...baseAnswer,
                  questionPoints: 10, // Default for subjective questions
                  answer: {
                    text: manual.answer || manual.answer_text || "",
                    fileUrl: manual.answer_file_url || "",
                    score: manual.score || 0,
                    isScored: manual.is_scored || false,
                  },
                  score: manual.is_scored ? manual.score : undefined,
                };
              }
              break;

            case "speaking":
              if (question.answer_manual) {
                const manual = question.answer_manual;
                return {
                  ...baseAnswer,
                  questionPoints: 10, // Default for subjective questions
                  answer: {
                    text: manual.answer || manual.answer_text || "",
                    fileUrl: manual.answer_file_url || "",
                    duration: 120, // Default duration
                    score: manual.score || 0,
                    isScored: manual.is_scored || false,
                  },
                  score: manual.is_scored ? manual.score : undefined,
                };
              }
              break;

            default:
              return baseAnswer;
          }

          return baseAnswer;
        });

        console.log("Converted answers:", convertedAnswers);

        // Create submission object with overview data
        const submissionData = {
          id: "sub_001",
          studentId: studentId,
          studentName: overview?.student_name || t("testStudent"),
          studentAvatar: "/placeholder.svg?height=40&width=40",
          exerciseId: exerciseId,
          exerciseTitle: `Bài tập - ID ${exerciseId}`,
          submittedAt: overview?.submitted_at
            ? formatSubmittedAt(overview.submitted_at)
            : new Date().toISOString(),
          status: "submitted" as const,
          totalQuestions: overview?.total_questions || questions.length,
          maxScore: 100, // Will be calculated properly later
          timeSpent: overview?.duration
            ? Number.parseInt(overview.duration)
            : 1800,
          answers: convertedAnswers,
          totalScore: overview?.total_score,
          feedback: overview?.comment || "",
          overview: overview,
        };

        console.log("Final submission data:", submissionData);
        setSubmission(submissionData);
      } else {
        console.error("No questions found in response");
      }
    } catch (error) {
      console.error("Error fetching submission:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuestionScore = (
    questionIndex: number,
    score: number | undefined
  ) => {
    if (!submission) return;

    const updatedSubmission = { ...submission };
    updatedSubmission.answers[questionIndex] = {
      ...updatedSubmission.answers[questionIndex],
      score,
    };

    // Recalculate total score
    updatedSubmission.totalScore = updatedSubmission.answers.reduce(
      (total, answer) => {
        return total + (answer.score || 0);
      },
      0
    );

    setSubmission(updatedSubmission);
  };

  const handleCompleteClick = () => {
    if (!submission) return;
    const count = submission.answers.filter(
      (a) =>
        (a.questionType === "writing" || a.questionType === "speaking") &&
        typeof a.score === "undefined"
    ).length;
    if (count > 0) {
      setUnscoredCount(count);
      setShowUnscoredDialog(true);
      return;
    }
    completeGrading();
  };

  const savePartialScores = async () => {
    try {
      setSaving(true);
      if (!submission) return;
      const scoreList: Record<string, number> = {};
      submission.answers.forEach((answer) => {
        if (
          (answer.questionType === "writing" ||
            answer.questionType === "speaking") &&
          typeof answer.score !== "undefined"
        ) {
          scoreList[answer.questionId] = answer.score as number;
        }
      });

      if (Object.keys(scoreList).length === 0) {
        toast(t("noScoreToSave"), {
          description: t("noQuestionsGraded"),
        });
        return;
      }

      const response = await saveManualScoring({
        exercise_id: Number.parseInt(exerciseId),
        user_id: Number.parseInt(studentId),
        score_list: scoreList,
      });

      if (response.code === 200) {
        const updated = { ...submission };
        updated.answers = updated.answers.map((a) => {
          if (
            (a.questionType === "writing" || a.questionType === "speaking") &&
            typeof a.score !== "undefined"
          ) {
            const updatedAnswer: any = { ...a.answer };
            updatedAnswer.isScored = true;
            updatedAnswer.score = a.score;
            return { ...a, answer: updatedAnswer };
          }
          return a;
        });
        setSubmission(updated);
        toast.success(t("saved"), {
          description: t("gradedQuestionsSaved"),
        });
      } else {
        throw new Error("Failed to save partial scores");
      }
    } catch (error) {
      console.error("Error saving partial scores:", error);
      toast.error(t("error"), {
        description: t("cannotSaveTemporaryScore"),
      });
    } finally {
      setSaving(false);
      setShowUnscoredDialog(false);
    }
  };

  const saveGrades = async () => {
    try {
      setSaving(true);
      console.log("Saving grades:", submission);
      // Here you would call an API to save the grades
      toast.success(t("saved"), {
        description: t("scoreSavedSuccessfully"),
      });
    } catch (error) {
      console.error("Error saving grades:", error);
      toast.error(t("error"), {
        description: t("cannotSaveScore"),
      });
    } finally {
      setSaving(false);
    }
  };

  const completeGrading = async () => {
    try {
      setSaving(true);
      if (submission) {
        // Collect scores for Writing and Speaking questions only
        const scoreList: Record<string, number> = {};

        submission.answers.forEach((answer) => {
          if (
            (answer.questionType === "writing" ||
              answer.questionType === "speaking") &&
            answer.score !== undefined
          ) {
            scoreList[answer.questionId] = answer.score;
          }
        });

        console.log("Score list to submit:", scoreList);

        // Only submit if there are scores to save
        if (Object.keys(scoreList).length > 0) {
          const response = await saveManualScoring({
            exercise_id: Number.parseInt(exerciseId), // Use dynamic exerciseId
            user_id: Number.parseInt(studentId), // Use dynamic studentId
            score_list: scoreList,
          });

          console.log("Manual scoring response:", response);

          if (response.code === 200) {
            // Gửi nhận xét nếu có feedback
            if (submission.feedback && submission.feedback.trim() !== "") {
              try {
                await postExerciseComment({
                  exercise_id: Number.parseInt(exerciseId),
                  student_id: Number.parseInt(studentId),
                  content: submission.feedback,
                });
              } catch (err) {
                // Không cần dừng flow nếu gửi nhận xét lỗi
                console.error("Error posting exercise comment:", err);
              }
            }
            toast.success(t("gradingCompleted"), {
              description: t("scoreSavedSuccessfully"),
            });

            submission.status = "graded";
            router.back();
          } else {
            throw new Error("Failed to save manual scoring");
          }
        } else {
          // No manual scores to save, just mark as completed
          // Gửi nhận xét nếu có feedback
          if (submission.feedback && submission.feedback.trim() !== "") {
            try {
              await postExerciseComment({
                exercise_id: Number.parseInt(exerciseId),
                student_id: Number.parseInt(studentId),
                content: submission.feedback,
              });
            } catch (err) {
              // Không cần dừng flow nếu gửi nhận xét lỗi
              console.error("Error posting exercise comment:", err);
            }
          }
          submission.status = "graded";
          toast.success(t("gradingCompleted"), {
            description: t("exerciseGradingCompleted"),
          });
          router.back();
        }
      }
    } catch (error) {
      console.error("Error completing grading:", error);
      toast.error(t("error"), {
        description: t("cannotCompleteGrading"),
      });
    } finally {
      setSaving(false);
    }
  };

  const getQuestionIcon = (type: string) => {
    switch (type) {
      case "speaking":
        return <Mic className="h-4 w-4" />;
      case "writing":
        return <PenTool className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải bài làm...</p>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Không tìm thấy bài làm</p>
          <Button onClick={() => router.back()} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
        </div>
      </div>
    );
  }

  // Refactor toàn bộ style cho GradeExercisePage
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-lg border-b rounded-b-3xl sticky top-0 z-30">
        <div className="max-w-full mx-auto px-4 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-6">
              <Button
                variant="ghost"
                size="lg"
                onClick={() => router.back()}
                className="text-gray-600 hover:text-gray-900 rounded-full shadow-md transition-all hover:bg-blue-100"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Quay lại
              </Button>
              <Separator orientation="vertical" className="h-8" />
              <div>
                <h1 className="text-2xl font-extrabold text-blue-600 drop-shadow-lg">
                  Chấm điểm bài tập
                </h1>
                <p className="text-base text-gray-500 font-medium">
                  {submission.exerciseTitle}
                </p>
              </div>
            </div>
            {/* Trong header, chỉ giữ lại nút Hoàn thành chấm điểm */}
            <div className="flex items-center space-x-3">
              <Button
                onClick={handleCompleteClick}
                disabled={saving}
                size="lg"
                className="rounded-full font-semibold shadow-sm px-5 py-2 bg-blue-600 text-white hover:bg-blue-700"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                {saving ? t("processing") : t("gradingCompleted")}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-full mx-auto px-4 sm:px-8 lg:px-12 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar trái: Thông tin học sinh, feedback, navigation */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 max-h-[calc(100vh-6rem)] overflow-y-auto space-y-8 scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-100">
              {/* Student Info */}
              <Card className="rounded-2xl shadow-xl border-0 bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center text-blue-700">
                    <User className="h-5 w-5 mr-2 text-blue-500" />
                    Thông tin học sinh
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <img
                      src={
                        submission.studentAvatar ||
                        "/placeholder.svg?height=40&width=40"
                      }
                      alt={submission.studentName}
                      className="h-12 w-12 rounded-full border-2 border-blue-200 shadow"
                    />
                    <div>
                      <p className="font-bold text-lg text-gray-900">
                        {submission.studentName}
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2 text-base">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        Thời gian làm bài:
                      </span>
                      <span className="font-semibold text-indigo-700">
                        {formatDuration(submission.timeSpent)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Nộp bài lúc:
                      </span>
                      <span className="font-medium text-xs">
                        {submission.submittedAt}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tổng câu hỏi:</span>
                      <span className="font-semibold text-blue-700">
                        {submission.totalQuestions}
                      </span>
                    </div>
                    {/* Hiển thị điểm nếu đã chấm xong hết (unscored_questions = 0) */}
                    {submission.overview &&
                      submission.overview.unscored_questions === 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 font-semibold">
                            Điểm:
                          </span>
                          <span className="font-extrabold text-2xl text-green-600">
                            {typeof submission.overview.ratio !== "undefined"
                              ? submission.overview.ratio
                              : "-"}
                          </span>
                        </div>
                      )}
                    {submission.overview && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Câu chưa chấm:</span>
                        <span className="font-medium text-orange-600">
                          {submission.overview.unscored_questions}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Overall Feedback */}
              <Card className="rounded-2xl shadow-xl border-0 bg-white border-2 border-blue-200">
                <CardHeader className="bg-blue-50 pb-3 rounded-t-2xl">
                  <CardTitle className="flex items-center text-lg text-blue-700">
                    <FileText className="h-5 w-5 mr-2 text-blue-500" />
                    Nhận xét tổng quan
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <Textarea
                    value={submission.feedback || ""}
                    onChange={(e) => {
                      const updatedSubmission = { ...submission };
                      updatedSubmission.feedback = e.target.value;
                      setSubmission(updatedSubmission);
                    }}
                    placeholder={t("overallFeedbackPlaceholder")}
                    rows={6}
                    className="w-full rounded-xl border-blue-200"
                  />
                </CardContent>
              </Card>

              {/* Question Navigation */}
              <Card className="rounded-2xl shadow-lg border-0 bg-white">
                <CardHeader className="pb-3 rounded-t-2xl">
                  <CardTitle className="text-lg font-bold text-blue-700 flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Danh sách câu hỏi
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {submission.answers.map((answer, index) => {
                      let colorClass =
                        "bg-red-100 text-red-700 border-red-300 hover:bg-red-200";
                      // Áp dụng is_all_correct cho tất cả dạng trừ speaking, writing
                      if (
                        answer.questionType !== "speaking" &&
                        answer.questionType !== "writing"
                      ) {
                        const isAllCorrect =
                          (answer.answer &&
                          typeof answer.answer === "object" &&
                          typeof answer.answer.is_all_correct !== "undefined"
                            ? answer.answer.is_all_correct
                            : undefined) ?? answer.is_all_correct;
                        if (typeof isAllCorrect !== "undefined") {
                          colorClass = isAllCorrect
                            ? "bg-green-100 text-green-700 border-green-300 hover:bg-green-200"
                            : "bg-red-100 text-red-700 border-red-300 hover:bg-red-200";
                        }
                      } else if (
                        answer.questionType === "writing" ||
                        answer.questionType === "speaking"
                      ) {
                        if (
                          answer.answer &&
                          typeof answer.answer === "object" &&
                          typeof answer.answer.isScored !== "undefined"
                        ) {
                          colorClass = answer.answer.isScored
                            ? "bg-green-100 text-green-700 border-green-300 hover:bg-green-200"
                            : "bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200";
                        }
                      }
                      return (
                        <button
                          key={index}
                          onClick={() => {
                            const element = document.getElementById(
                              `question-${index}`
                            );
                            element?.scrollIntoView({ behavior: "smooth" });
                          }}
                          className={`w-12 h-12 rounded-full border-2 font-bold shadow-md transition-all duration-200 transform hover:scale-110 hover:shadow-xl text-lg ${colorClass}`}
                        >
                          {index + 1}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content: Questions & Grading */}
          <div className="lg:col-span-3">
            <div className="space-y-8">
              {submission.answers.map((answer, index) => (
                <Card
                  key={answer.questionId}
                  className="overflow-hidden rounded-2xl shadow-lg border-0 bg-white"
                  id={`question-${index}`}
                >
                  <CardHeader className="bg-gray-50 py-4 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center text-xl">
                        {getQuestionIcon(answer.questionType)}
                        <span className="ml-2">Câu {index + 1}</span>
                        <Badge variant="outline" className="ml-2 capitalize">
                          {answer.questionType.replace("_", " ")}
                        </Badge>
                      </CardTitle>
                      <div className="flex items-center space-x-2">
                        {/* Show badge based on is_all_correct if present, else fallback to manual scoring status */}
                        {typeof answer.is_all_correct !== "undefined" ? (
                          <Badge
                            variant={
                              answer.is_all_correct ? "default" : "destructive"
                            }
                          >
                            {answer.is_all_correct
                              ? t("correct")
                              : t("incorrect")}
                          </Badge>
                        ) : answer.questionType === "writing" ||
                          answer.questionType === "speaking" ? (
                          answer.answer.isScored ? (
                            <Badge
                              variant="default"
                              className="bg-green-100 text-green-800"
                            >
                              Đã chấm
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-yellow-100 text-yellow-800"
                            >
                              Chưa chấm
                            </Badge>
                          )
                        ) : null}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-8">
                    <QuestionAnswerDisplay
                      answer={answer}
                      index={index}
                      onScoreChange={(score) =>
                        updateQuestionScore(index, score)
                      }
                      t={t}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
      <AlertDialog
        open={showUnscoredDialog}
        onOpenChange={setShowUnscoredDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("ungradedQuestionsRemain")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("gradeRemainingQuestions").replace(
                "{count}",
                unscoredCount.toString()
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                // Lưu tạm điểm đã chấm nhưng ở lại trang để tiếp tục chấm
                void savePartialScores();
              }}
            >
              {t("continueGrading")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                // Lưu tạm và quay về tab grading
                savePartialScores()
                  .catch(() => {})
                  .finally(() => {
                    router.back();
                  });
              }}
            >
              {t("doLater")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
