"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  FileText,
  Mic,
  PenTool,
  Volume2,
  CheckCircle2,
  Clock,
  Sparkles,
  Download,
  File,
  Image as ImageIcon,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { TiptapMathViewer } from "@/components/question-editor/tiptap-math-viewer";
import {
  getHomeworkAnswersByTeacher,
  HomeworkOverview,
  ManualAnswer,
  HomeworkFile,
  saveManualScoring,
  postHomeworkComment,
  postEvaluateScore,
} from "@/lib/api/exam-answers";
import { gradeWritingByAI, gradeSpeakingByAI, gradeImageByAI } from "@/lib/api/ai-grading";
import { useTypedTranslations } from "@/lib/i18n/client";
import { useToast } from "@/components/ui/use-toast";
import { QuestionMedia } from "@/lib/api/questions";

interface AIGradingResult {
  overall_score: number;
  grammar_score: number;
  vocabulary_score: number;
  organization_score: number;
  content_score: number;
  feedback: string;
  strengths: string[] | null;
  improvements: string[] | null;
}

interface StudentSubmission {
  id: string;
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  examId: string;
  examTitle: string;
  submittedAt: string;
  status: "submitted" | "graded" | "draft";
  totalQuestions: number;
  answers: StudentAnswer[];
  totalScore?: number;
  maxScore: number;
  timeSpent: number;
  feedback?: string;
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
}

// Component to render file item
const FileItem = ({
  file,
  index,
  isQuestionFile = false,
}: {
  file: HomeworkFile;
  index: number;
  isQuestionFile?: boolean;
}) => {
  const getFileIcon = (type: string) => {
    if (type === "image") return <ImageIcon className="h-5 w-5" />;
    if (type === "pdf") return <File className="h-5 w-5 text-red-500" />;
    return <File className="h-5 w-5" />;
  };

  const getFileName = (url: string) => {
    try {
      const urlParts = url.split("/");
      return urlParts[urlParts.length - 1];
    } catch {
      return `File ${index + 1}`;
    }
  };

  const openFile = (url: string) => {
    window.open(url, "_blank");
  };

  // For question files: always show file name with view button
  if (isQuestionFile) {
    return (
      <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {getFileIcon(file.type)}
            <span className="text-sm font-medium truncate">
              {getFileName(file.url)}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openFile(file.url)}
          >
            Xem
          </Button>
        </div>
      </div>
    );
  }

  // For submitted files: images display, others show filename with view button
  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      {file.type === "image" ? (
        <img
          src={file.url}
          alt={`File ${index + 1}`}
          className="w-full h-auto rounded-lg"
        />
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {getFileIcon(file.type)}
            <span className="text-sm font-medium truncate">
              {getFileName(file.url)}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openFile(file.url)}
          >
            Xem
          </Button>
        </div>
      )}
    </div>
  );
};

// Component to render media content
const MediaContent = ({
  media,
}: {
  media?: { type: "image" | "video" | "audio"; url: string };
}) => {
  if (!media) return null;

  switch (media.type) {
    case "image":
      return (
        <div className="mt-2">
          <img
            src={media.url || "/placeholder.svg?height=120&width=180"}
            alt="Question media"
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
          <Volume2 className="h-4 w-4" />
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
  t,
}: {
  answer: StudentAnswer;
  index: number;
  t: any;
}) => {
  const renderAnswer = () => {
    const isCorrect = answer.isCorrect;
    const bgColor =
      isCorrect === true
        ? "bg-green-100 border-green-300"
        : isCorrect === false
          ? "bg-red-100 border-red-300"
          : "bg-gray-100";

    switch (answer.questionType) {
      case "multiple_choice":
        return (
          <div className={`space-y-2 p-3 rounded border ${bgColor}`}>
            <p className="text-sm font-medium text-gray-600">{t("options")}:</p>
            <div className="flex flex-wrap gap-2">
              {answer.options?.map((option: any, idx: number) => (
                <div
                  key={idx}
                  className={`px-3 py-1 rounded border text-sm ${answer.answer.selectedOption === option.text
                    ? "bg-blue-200 border-blue-400 font-medium"
                    : "bg-white border-gray-300"
                    }`}
                >
                  <span className="font-medium">
                    {String.fromCharCode(65 + idx)}.
                  </span>{" "}
                  {option.text}
                </div>
              ))}
            </div>
          </div>
        );

      case "fill_in_blank":
        return (
          <div className={`space-y-2 p-3 rounded border ${bgColor}`}>
            <p className="text-sm font-medium text-gray-600">{t("answer")}:</p>
            <div className="flex flex-wrap gap-2">
              {Array.isArray(answer.answer.blanks) ? (
                answer.answer.blanks.map((blank: string, idx: number) => (
                  <div key={idx} className="flex items-center space-x-1">
                    <span className="text-sm text-gray-500">{idx + 1}:</span>
                    <span className="px-2 py-1 bg-blue-100 rounded text-sm">
                      {blank || t("empty")}
                    </span>
                  </div>
                ))
              ) : (
                <span className="px-2 py-1 bg-blue-100 rounded text-sm">
                  {answer.answer.text || t("empty")}
                </span>
              )}
            </div>
          </div>
        );

      case "matching":
        return (
          <div className={`space-y-2 p-3 rounded border ${bgColor}`}>
            <p className="text-sm font-medium text-gray-600">
              {t("matchingResult")}:
            </p>
            <div className="flex flex-wrap gap-2">
              {answer.answer.matches?.map((match: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center space-x-2 px-3 py-1 bg-gray-50 rounded text-sm"
                >
                  <span>{match.left}</span>
                  <span className="text-gray-400">↔</span>
                  <span>{match.right}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case "ordering":
        return (
          <div className={`space-y-2 p-3 rounded border ${bgColor}`}>
            <p className="text-sm font-medium text-gray-600">
              {t("orderingResult")}:
            </p>
            <div className="flex flex-wrap gap-2">
              {answer.answer.order?.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center space-x-1 px-3 py-1 bg-gray-50 rounded text-sm"
                >
                  <span className="font-medium text-blue-600">{idx + 1}.</span>
                  <span>{item.text || item}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case "drag_drop":
        return (
          <div className={`space-y-2 p-3 rounded border ${bgColor}`}>
            <p className="text-sm font-medium text-gray-600">
              {t("dragDropResult")}:
            </p>
            <div className="space-y-3">
              {answer.answer.drops?.map((drop: any, idx: number) => (
                <div key={idx}>
                  <p className="text-sm font-medium mb-1">
                    {t("zone")} {idx + 1}:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {drop.items?.map((item: any, itemIdx: number) => (
                      <div
                        key={itemIdx}
                        className="px-2 py-1 bg-blue-100 rounded text-sm"
                      >
                        {item.text || item}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "labeling":
        return (
          <div className={`space-y-2 p-3 rounded border ${bgColor}`}>
            <p className="text-sm font-medium text-gray-600">
              {t("labelsMarked")}:
            </p>
            {answer.answer.image && (
              <div className="relative inline-block">
                <img
                  src={
                    answer.answer.image ||
                    "/placeholder.svg?height=300&width=400"
                  }
                  alt="Labeled image"
                  className="max-w-full h-auto rounded border"
                />
                {answer.answer.labels?.map((label: any, idx: number) => (
                  <div
                    key={idx}
                    className="absolute bg-red-500 text-white text-xs px-2 py-1 rounded shadow"
                    style={{ left: `${label.x}%`, top: `${label.y}%` }}
                  >
                    {label.text}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "category":
        return (
          <div className={`space-y-2 p-3 rounded border ${bgColor}`}>
            <p className="text-sm font-medium text-gray-600">
              {t("categorization")}:
            </p>
            <div className="space-y-3">
              {Object.entries(answer.answer.categories || {}).map(
                ([category, items]: [string, any]) => (
                  <div key={category}>
                    <h4 className="font-medium text-gray-700 mb-1">
                      {category}:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(items) &&
                        items.map((item: any, idx: number) => (
                          <div
                            key={idx}
                            className="px-2 py-1 bg-gray-100 rounded text-sm"
                          >
                            {item.text || item}
                          </div>
                        ))}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        );

      case "writing":
        return (
          <div className={`p-3 rounded border ${bgColor}`}>
            <p className="whitespace-pre-wrap text-sm">{answer.answer.text}</p>
          </div>
        );

      case "speaking":
        return (
          <div className={`p-3 rounded border ${bgColor}`}>
            <div className="flex items-center space-x-3">
              <Mic className="h-5 w-5 text-blue-600" />
              <span className="text-sm">
                {t("audioRecording")} ({answer.answer.duration}s)
              </span>
              <audio controls src={answer.answer.fileUrl} className="flex-1" />
            </div>
          </div>
        );

      default:
        return (
          <div className={`p-3 rounded border ${bgColor}`}>
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
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">{t("question")}:</h4>
        <div className="text-gray-700 space-y-2">
          <TiptapMathViewer value={answer.questionText} />
          {answer.questionMedia && (
            <MediaContent media={answer.questionMedia} />
          )}
        </div>
      </div>

      {/* Student Answer */}
      <div className="bg-green-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">
          {t("studentAnswer")}:
        </h4>
        <div className="text-gray-700">{renderAnswer()}</div>
      </div>
    </div>
  );
};

export default function GradeHomeworkPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params as any)?.locale || "vi";
  const t = useTypedTranslations("gradeHomework");
  const { toast } = useToast();
  const [overview, setOverview] = useState<HomeworkOverview | null>(null);
  const [manualAnswers, setManualAnswers] = useState<ManualAnswer[]>([]);
  const [submitFiles, setSubmitFiles] = useState<HomeworkFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAllScored, setIsAllScored] = useState<boolean>(false);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [totalScore, setTotalScore] = useState<string>("");
  const [comment, setComment] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmDialogData, setConfirmDialogData] = useState<{
    type: "unmarked" | "no_comment" | "both";
    unmarkedCount: number;
  } | null>(null);
  const [canGoBack, setCanGoBack] = useState(false);

  // AI Grading states
  const [aiGradingLoading, setAiGradingLoading] = useState(false);
  const [showAiGradingDialog, setShowAiGradingDialog] = useState(false);
  const [aiGradingResult, setAiGradingResult] =
    useState<AIGradingResult | null>(null);
  // Cache kết quả AI grading theo answer.id để tránh spam API
  const [aiGradingCache, setAiGradingCache] = useState<
    Record<string, AIGradingResult>
  >({});
  const [currentGradingAnswerId, setCurrentGradingAnswerId] = useState<
    string | null
  >(null);
  // Lưu thông tin câu hỏi và câu trả lời đang được chấm
  const [currentGradingQuestion, setCurrentGradingQuestion] = useState<string | null>(null);
  const [currentGradingAnswer, setCurrentGradingAnswer] = useState<ManualAnswer | null>(null);

  useEffect(() => {
    fetchSubmission();
    // Kiểm tra xem có thể quay lại hay không
    setCanGoBack(window.history.length > 1);
  }, []);//

  const fetchSubmission = async () => {
    try {
      setLoading(true);
      const homeworkId = Number(params.homeworkId);
      const studentId = Number(params.studentId);
      const response = await getHomeworkAnswersByTeacher({
        homework_id: homeworkId,
        user_id: studentId,
      });
      if (response && response.data) {
        setOverview(response.data.overview);
        setManualAnswers(response.data.manual_answers || []);
        setSubmitFiles(response.data.submit_files || []);
        setIsAllScored(response.data.is_all_scored || false);

        // Điền sẵn nhận xét gần nhất nếu có
        if (
          response.data.overview &&
          (response.data.overview as any).latest_comment
        ) {
          setComment((response.data.overview as any).latest_comment || "");
        }

        // Điền sẵn điểm tổng cho write form
        if (
          response.data.overview &&
          response.data.overview.homework_question_form === "write" &&
          typeof (response.data.overview as any).ratio !== "undefined"
        ) {
          setTotalScore(String((response.data.overview as any).ratio));
        }

        // Khởi tạo điểm từ dữ liệu nếu có (chỉ set khi is_scored = true)
        const initial: Record<string, number> = {};
        (response.data.manual_answers || []).forEach((ans: any) => {
          if (ans && ans.id) {
            // Chỉ set điểm nếu is_scored = true và có manual_score
            if (
              ans.is_scored === true &&
              ans.manual_score !== null &&
              ans.manual_score !== undefined
            ) {
              initial[ans.id] = Number(ans.manual_score);
            }
            // Không set giá trị mặc định 0 và không hiển thị manual_score khi is_scored = false
          }
        });
        setScores(initial);
      } else {
        setOverview(null);
        setManualAnswers([]);
        setSubmitFiles([]);
      }
    } catch (error) {
      console.error("Error fetching submission:", error);
      setOverview(null);
      setManualAnswers([]);
      setSubmitFiles([]);
    } finally {
      setLoading(false);
    }
  };

  // AI Grading function
  const handleAIGrading = async (answer?: ManualAnswer) => {
    // Xác định cache key: dùng answer.id nếu có, hoặc "write_form" cho write form
    const cacheKey = answer?.id || "write_form";

    // Lưu thông tin câu hỏi và câu trả lời
    setCurrentGradingQuestion(answer?.content_struct?.text || overview?.homework_description || "");
    setCurrentGradingAnswer(answer || null);

    // Kiểm tra cache trước - nếu đã có kết quả thì hiển thị luôn
    if (aiGradingCache[cacheKey]) {
      setAiGradingResult(aiGradingCache[cacheKey]);
      setCurrentGradingAnswerId(cacheKey);
      setShowAiGradingDialog(true);
      return;
    }

    // Nếu chưa có cache, gọi API
    setAiGradingLoading(true);
    setCurrentGradingAnswerId(cacheKey);
    try {
      const rubric = answer?.content_struct?.text || overview?.homework_description || "";
      let data;

      // Kiểm tra xem có phải write form với submit_files không
      if (overview?.homework_question_form === "write" && submitFiles.length > 0) {
        // Lọc lấy các URL của image từ submit_files
        const imageUrls = submitFiles
          .filter(file => file.type === "image")
          .map(file => file.url);

        if (imageUrls.length > 0) {
          // Gọi API grading/image với nhiều ảnh
          data = await gradeImageByAI({
            image_urls: imageUrls,
            rubric: rubric,
          });
        } else {
          // Không có ảnh nào để chấm
          toast({
            title: "Không có ảnh để chấm",
            description: "Học sinh chưa nộp file ảnh nào.",
            variant: "destructive",
          });
          setAiGradingLoading(false);
          return;
        }
      } else if (answer?.type === "writing") {
        // answer.answer chứa text câu trả lời
        const essayText = answer.answer || "";
        data = await gradeWritingByAI({
          essay_text: essayText,
          rubric: rubric,
        });
      } else if (answer?.type === "speaking") {
        const audioUrl = answer.file_url || "";
        data = await gradeSpeakingByAI({
          audio_url: audioUrl,
          rubric: rubric,
        });
      }

      if (data && data.success && data.data) {
        // Response từ API đã có đủ thông tin, dùng trực tiếp
        let cleanFeedback = data.data.feedback || "";

        // Xử lý trường hợp backend trả về feedback chứa JSON object
        // Remove markdown code blocks (```json ... ```)
        cleanFeedback = cleanFeedback
          .replace(/```json\s*/g, "")
          .replace(/```\s*/g, "")
          .trim();

        // Nếu feedback vẫn là JSON string, parse nó và lấy field feedback bên trong
        try {
          const parsed = JSON.parse(cleanFeedback);
          if (parsed && typeof parsed === "object" && parsed.feedback) {
            cleanFeedback = parsed.feedback;
          }
        } catch (e) {
          // Không phải JSON, giữ nguyên text
        }

        const result: AIGradingResult = {
          overall_score: data.data.overall_score || 0,
          grammar_score: data.data.grammar_score || 0,
          vocabulary_score: data.data.vocabulary_score || 0,
          organization_score: data.data.organization_score || 0,
          content_score: data.data.content_score || 0,
          feedback: cleanFeedback,
          strengths: data.data.strengths || null,
          improvements: data.data.improvements || null,
        };

        // Lưu vào cache
        setAiGradingCache((prev) => ({
          ...prev,
          [cacheKey]: result,
        }));

        setAiGradingResult(result);
        setShowAiGradingDialog(true);
      } else {
        // Sử dụng toast
        toast({
          title: "Lỗi chấm điểm AI",
          description:
            data?.error ||
            data?.message ||
            "Không thể chấm điểm bằng AI. Vui lòng thử lại.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error calling AI grading:", error);

      // Xử lý lỗi chi tiết từ Gemini API
      let errorTitle = "Lỗi chấm điểm AI";
      let errorDescription = "Đã xảy ra lỗi khi chấm điểm bằng AI.";

      if (error.error || error.details) {
        // Lỗi từ API backend
        errorTitle = error.error || "Lỗi chấm điểm AI";

        // Parse details nếu có thông tin từ Gemini
        if (error.details) {
          try {
            // Tìm message từ Gemini trong details
            const geminiErrorMatch = error.details.match(
              /"message":\s*"([^"]+)"/
            );
            const geminiStatusMatch = error.details.match(
              /"status":\s*"([^"]+)"/
            );

            if (geminiErrorMatch && geminiErrorMatch[1]) {
              errorDescription = geminiErrorMatch[1];

              // Dịch một số lỗi phổ biến
              if (geminiErrorMatch[1].includes("overloaded")) {
                errorDescription =
                  "Dịch vụ AI đang quá tải. Vui lòng thử lại sau vài phút.";
              } else if (
                geminiStatusMatch &&
                geminiStatusMatch[1] === "UNAVAILABLE"
              ) {
                errorDescription =
                  "Dịch vụ AI tạm thời không khả dụng. Vui lòng thử lại sau.";
              }
            } else {
              errorDescription = error.details;
            }
          } catch (e) {
            errorDescription = error.details;
          }
        }
      } else if (error.message) {
        errorDescription = error.message;
      }

      // Sử dụng toast
      toast({
        title: errorTitle,
        description: errorDescription,
        variant: "destructive",
      });
    } finally {
      setAiGradingLoading(false);
    }
  };

  const handleScoreChange = (id: string, value: string) => {
    // Nếu input trống, không set giá trị
    if (value === "" || value === null || value === undefined) {
      setScores((prev) => {
        const newScores = { ...prev };
        delete newScores[id];
        return newScores;
      });
      return;
    }

    let v = Number(value);
    if (Number.isNaN(v)) return; // Không set nếu không phải số hợp lệ

    // Giới hạn 0..10
    v = Math.max(0, Math.min(10, v));
    setScores((prev) => ({ ...prev, [id]: v }));
  };

  // Kiểm tra trạng thái chấm điểm
  const getValidationStatus = () => {
    const isWriteForm = overview?.homework_question_form === "write";

    if (isWriteForm) {
      // Write form: chỉ cần có điểm hợp lệ
      const scoreValue = parseFloat(totalScore);
      const hasValidScore =
        !isNaN(scoreValue) && scoreValue >= 0 && scoreValue <= 100;
      const hasComment = comment.trim().length > 0;

      return {
        unmarkedCount: hasValidScore ? 0 : 1,
        hasComment,
        unmarkedQuestions: [],
        isComplete: hasValidScore && hasComment,
      };
    } else {
      // Question form: kiểm tra các câu hỏi manual
      const unmarkedQuestions = manualAnswers.filter(
        (answer) => !scores[answer.id] && scores[answer.id] !== 0
      );
      const hasComment = comment.trim().length > 0;

      return {
        unmarkedCount: unmarkedQuestions.length,
        hasComment,
        unmarkedQuestions,
        isComplete: unmarkedQuestions.length === 0 && hasComment,
      };
    }
  };

  // Tìm câu chưa chấm có số thứ tự nhỏ nhất
  const getFirstUnmarkedQuestionIndex = () => {
    const unmarkedQuestions = manualAnswers.filter(
      (answer) => !scores[answer.id] && scores[answer.id] !== 0
    );
    if (unmarkedQuestions.length === 0) return -1;

    const firstUnmarked = unmarkedQuestions[0];
    return manualAnswers.findIndex((answer) => answer.id === firstUnmarked.id);
  };

  const handleSubmitGrading = async () => {
    if (!overview) return;

    const validation = getValidationStatus();
    const isWriteForm = overview.homework_question_form === "write";

    // TH 1: Hoàn thành đầy đủ - chuyển về trang chủ
    if (validation.isComplete) {
      try {
        setSubmitting(true);
        const homeworkId = Number(params.homeworkId);
        const studentId = Number(params.studentId);

        // Gửi API lưu điểm - khác nhau theo form type
        if (isWriteForm) {
          // Write form: sử dụng postEvaluateScore
          const scoreValue = parseFloat(totalScore);
          if (isNaN(scoreValue) || scoreValue < 0 || scoreValue > 100) {
            toast({
              title: "Lỗi",
              description:
                "Điểm không hợp lệ. Vui lòng nhập điểm từ 0 đến 100.",
              variant: "destructive",
            });
            setSubmitting(false);
            return;
          }

          await postEvaluateScore({
            homework_id: homeworkId,
            user_id: studentId,
            score: scoreValue,
          });
        } else {
          // Question form: sử dụng saveManualScoring
          await saveManualScoring({
            homework_id: homeworkId,
            user_id: studentId,
            score_list: scores,
          });
        }

        // Chỉ gửi API comment nếu có nội dung
        if (comment.trim().length > 0) {
          await postHomeworkComment({
            homework_id: homeworkId,
            student_id: studentId,
            content: comment,
          });
        }

        // Cập nhật trạng thái đã chấm hết
        setIsAllScored(true);

        toast({
          title: "Thành công",
          description: "Đã lưu điểm và nhận xét",
        });

        // Chuyển về trang trước đó hoặc trang weekly-lessons
        if (canGoBack) {
          router.back();
        } else {
          router.push(`/${locale}/teacher/weekly-lessons`);
        }
      } catch (error) {
        console.error("Error submitting grading:", error);
        toast({
          title: "Lỗi",
          description: "Không thể lưu điểm. Vui lòng thử lại.",
          variant: "destructive",
        });
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // TH 2: Chưa hoàn thành - hiển thị popup xác nhận
    let dialogType: "unmarked" | "no_comment" | "both" = "unmarked";

    if (validation.unmarkedCount > 0 && !validation.hasComment) {
      dialogType = "both";
    } else if (validation.unmarkedCount > 0) {
      dialogType = "unmarked";
    } else if (!validation.hasComment) {
      dialogType = "no_comment";
    }

    setConfirmDialogData({
      type: dialogType,
      unmarkedCount: validation.unmarkedCount,
    });
    setShowConfirmDialog(true);
  };

  // Xử lý khi người dùng chọn "Có" trong dialog - vẫn lưu dữ liệu hiện tại
  const handleConfirmExit = async () => {
    setShowConfirmDialog(false);

    if (!overview) return;

    try {
      setSubmitting(true);
      const homeworkId = Number(params.homeworkId);
      const studentId = Number(params.studentId);
      const isWriteForm = overview.homework_question_form === "write";

      // Gửi API lưu điểm - khác nhau theo form type
      if (isWriteForm) {
        // Write form: sử dụng postEvaluateScore
        const scoreValue = parseFloat(totalScore);
        if (!isNaN(scoreValue) && scoreValue >= 0 && scoreValue <= 100) {
          await postEvaluateScore({
            homework_id: homeworkId,
            user_id: studentId,
            score: scoreValue,
          });
        }
      } else {
        // Question form: sử dụng saveManualScoring
        await saveManualScoring({
          homework_id: homeworkId,
          user_id: studentId,
          score_list: scores,
        });
      }

      // Chỉ gửi API comment nếu có nội dung
      if (comment.trim().length > 0) {
        await postHomeworkComment({
          homework_id: homeworkId,
          student_id: studentId,
          content: comment,
        });
      }

      // Cập nhật trạng thái đã chấm hết (nếu đã chấm hết)
      const validation = getValidationStatus();
      if (validation.isComplete) {
        setIsAllScored(true);
      }

      // Sau khi lưu thành công, chuyển về trang trước đó
      if (canGoBack) {
        router.back();
      } else {
        router.push(`/${locale}/teacher/weekly-lessons`);
      }
    } catch (error) {
      console.error("Error saving data before exit:", error);
      // Nếu lưu thất bại, vẫn cho phép thoát
      if (canGoBack) {
        router.back();
      } else {
        router.push(`/${locale}/teacher/weekly-lessons`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Xử lý khi người dùng chọn "Chấm tiếp" hoặc "Viết nhận xét"
  const handleContinueGrading = () => {
    setShowConfirmDialog(false);

    if (
      confirmDialogData?.type === "unmarked" ||
      confirmDialogData?.type === "both"
    ) {
      // Scroll đến câu chưa chấm đầu tiên
      const firstUnmarkedIndex = getFirstUnmarkedQuestionIndex();
      if (firstUnmarkedIndex >= 0) {
        const element = document.getElementById(
          `question-${firstUnmarkedIndex}`
        );
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    }

    if (
      confirmDialogData?.type === "no_comment" ||
      confirmDialogData?.type === "both"
    ) {
      // Focus vào textarea nhận xét
      const commentTextarea = document.querySelector("textarea");
      if (commentTextarea) {
        commentTextarea.focus();
        commentTextarea.scrollIntoView({ behavior: "smooth", block: "center" });
      }
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

  const getGradingStatusBadge = (answer: ManualAnswer) => {
    if (answer.is_scored === true) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          {t("graded")}
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
          <Clock className="h-3 w-3 mr-1" />
          {t("pendingGrading")}
        </Badge>
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t("loadingSubmission")}</p>
        </div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">{t("submissionNotFound")}</p>
          <Button onClick={() => router.back()} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("goBack")}
          </Button>
        </div>
      </div>
    );
  }

  // Tính số câu writing/speaking và số câu khác đã làm
  const writingSpeakingCount = Number(overview.manual_questions_count || 0);
  const questionsCompleted = Number(overview.questions_completed || 0);
  const otherCount = Math.max(questionsCompleted - writingSpeakingCount, 0);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-lg border-b rounded-b-3xl sticky top-0 z-30">
        <div className="max-w-full mx-auto px-4 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between h-auto py-3">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-6">
              <Button
                variant="ghost"
                size="lg"
                onClick={() => router.back()}
                className="text-gray-600 hover:text-gray-900 rounded-full shadow-md transition-all hover:bg-blue-100"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                {t("goBack")}
              </Button>
              <Separator orientation="vertical" className="hidden md:inline h-8" />
              <div>
                <h1 className="text-2xl font-extrabold text-blue-600 drop-shadow-lg">
                  {t("viewHomework")}
                </h1>
                <p className="text-base text-gray-500 font-medium">
                  {overview.homework_name}
                  {overview.homework_description
                    ? ` - ${overview.homework_description}`
                    : ""}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-full mx-auto px-4 sm:px-8 lg:px-12 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar trái: Thông tin học sinh */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 max-h-[calc(100vh-6rem)] overflow-y-auto space-y-8 scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-100">
              {/* Student Info */}
              <Card className="rounded-2xl shadow-xl border-0 bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center text-blue-700">
                    <User className="h-5 w-5 mr-2 text-blue-500" />
                    {t("studentInfo")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <img
                      src={"/placeholder.svg?height=40&width=40"}
                      alt={overview.student_name}
                      className="h-12 w-12 rounded-full border-2 border-blue-200 shadow"
                    />
                    <div>
                      <p className="font-bold text-lg text-gray-900">
                        {overview.student_name}
                      </p>
                    </div>
                  </div>
                  <Separator />
                  {overview.homework_question_form === "write" ? (
                    // Stats for write form
                    <div className="space-y-2 text-base">
                      {/* Tổng điểm/ratio nếu BE trả về */}
                      {typeof (overview as any).ratio !== "undefined" && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-gray-700">
                            <Award className="h-4 w-4 text-amber-500 mr-2" />
                            <span className="font-medium">Điểm hiện tại</span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold">
                            {(overview as any).ratio}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">File bài tập:</span>
                        <span className="font-semibold text-blue-700">
                          {overview.question_files?.length || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">File đã nộp:</span>
                        <span className="font-semibold text-green-700">
                          {submitFiles.length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Trạng thái:</span>
                        <span className="font-semibold text-gray-800">
                          {submitFiles.length > 0 ? "Đã nộp" : "Chưa nộp"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    // Stats for question form
                    <div className="space-y-2 text-base">
                      {/* Tổng điểm/ratio nếu BE trả về - chuyển vào card học sinh */}
                      {typeof (overview as any).ratio !== "undefined" && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-gray-700">
                            <CheckCircle2 className="h-4 w-4 text-amber-500 mr-2" />
                            <span className="font-medium">
                              {t("totalScore") || "Điểm tổng"}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold">
                            {(overview as any).ratio}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          {t("writingSpeakingCompleted")}:
                        </span>
                        <span className="font-semibold text-blue-700">
                          {writingSpeakingCount}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          {t("otherQuestionsCompleted")}:
                        </span>
                        <span className="font-semibold text-green-700">
                          {otherCount}
                        </span>
                      </div>
                      {/* Tổng số câu đã làm / tổng số câu */}
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          {t("completedTotal") || "Đã làm / Tổng số"}:
                        </span>
                        <span className="font-semibold text-gray-800">
                          {Number(overview.questions_completed || 0)} /{" "}
                          {Number(overview.total_questions || 0)}
                        </span>
                      </div>
                    </div>
                  )}
                  <Separator />

                  {/* Grading input for write form */}
                  {overview.homework_question_form === "write" && (
                    <>
                      <div className="space-y-2">
                        <p className="font-medium text-gray-700 flex items-center">
                          <Award className="h-4 w-4 mr-2" />
                          Điểm số (0-100)
                        </p>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={totalScore}
                          onChange={(e) => setTotalScore(e.target.value)}
                          placeholder="Nhập điểm (0-100)"
                          className="text-center text-lg font-semibold"
                        />
                      </div>
                      <Separator />
                    </>
                  )}

                  {/* Homework comment */}
                  <div className="space-y-2">
                    <p className="font-medium text-gray-700">
                      {t("homeworkComment") || "Nhận xét bài tập"}
                    </p>
                    <Textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder={
                        t("enterHomeworkComment") || "Nhập nhận xét cho bài tập"
                      }
                      className="min-h-[100px]"
                    />
                  </div>
                  <Button
                    className={`w-full mt-2 ${isAllScored
                      ? "bg-orange-600 hover:bg-orange-700 text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                    onClick={handleSubmitGrading}
                    disabled={submitting}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {submitting
                      ? t("submitting") || "Đang gửi..."
                      : isAllScored
                        ? t("reGrade") || "Chấm lại"
                        : t("finishGrading") || "Hoàn thành chấm điểm"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content: Questions & Grading or Files */}
          <div className="lg:col-span-3">
            {overview.homework_question_form === "write" ? (
              // File-based homework display
              <div className="space-y-8">
                {/* Question Files Section */}
                {overview.question_files &&
                  overview.question_files.length > 0 && (
                    <Card className="rounded-2xl shadow-lg border-0 bg-white">
                      <CardHeader className="bg-blue-50 py-4 rounded-t-2xl">
                        <CardTitle className="flex items-center text-xl">
                          <FileText className="h-5 w-5 mr-2" />
                          File bài tập
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {overview.question_files.map((file, index) => (
                            <FileItem
                              key={index}
                              file={file}
                              index={index}
                              isQuestionFile={true}
                            />
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                {/* Submit Files Section */}
                <Card className="rounded-2xl shadow-lg border-0 bg-white">
                  <CardHeader className="bg-green-50 py-4 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center text-xl">
                        <CheckCircle2 className="h-5 w-5 mr-2" />
                        File bài làm của học sinh
                      </CardTitle>
                      {/* AI Grading Button for Write Form - Always show */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAIGrading(manualAnswers[0] || undefined)}
                          disabled={
                            aiGradingLoading &&
                            (currentGradingAnswerId === manualAnswers[0]?.id || currentGradingAnswerId === "write_form")
                          }
                          className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 text-purple-700 hover:from-purple-100 hover:to-pink-100 hover:border-purple-300"
                        >
                          <Sparkles className="h-4 w-4 mr-1" />
                          {aiGradingLoading &&
                            (currentGradingAnswerId === manualAnswers[0]?.id || currentGradingAnswerId === "write_form")
                            ? "Đang chấm..."
                            : "Chấm AI"}
                        </Button>
                        {((manualAnswers[0] && aiGradingCache[manualAnswers[0].id]) || aiGradingCache["write_form"]) && (
                          <Badge
                            variant="outline"
                            className="text-xs text-green-600 border-green-300 bg-green-50"
                          >
                            ✓ Đã chấm
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    {submitFiles.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {submitFiles.map((file, index) => (
                          <FileItem key={index} file={file} index={index} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">
                          Học sinh chưa nộp file nào
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              // Question-based homework display (original logic)
              <div className="space-y-8">
                {manualAnswers.map((answer, index) => {
                  const isUnmarked =
                    !scores[answer.id] && scores[answer.id] !== 0;
                  return (
                    <Card
                      key={answer.id}
                      className={`overflow-hidden rounded-2xl shadow-lg border-0 bg-white ${isUnmarked ? "ring-2 ring-red-300 bg-red-50" : ""
                        }`}
                      id={`question-${index}`}
                    >
                      <CardHeader className="bg-gray-50 py-4 rounded-t-2xl">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center text-xl">
                            {getQuestionIcon(answer.type)}
                            <span className="ml-2">
                              {t("question")} {index + 1}
                            </span>
                            <Badge
                              variant="outline"
                              className="ml-2 capitalize"
                            >
                              {answer.type.replace("_", " ")}
                            </Badge>
                          </CardTitle>
                          {getGradingStatusBadge(answer)}
                        </div>
                      </CardHeader>

                      <CardContent className="p-8">
                        {/* Question text */}
                        <div className="bg-blue-50 rounded-lg p-4 mb-4">
                          <h4 className="font-medium text-gray-900 mb-2">
                            {t("question")}:
                          </h4>
                          <div className="text-gray-700 space-y-2">
                            <TiptapMathViewer
                              value={answer.content_struct?.text || ""}
                            />
                            {answer.content_struct.medias && answer.content_struct.medias.length > 1 ? 
                              answer.content_struct.medias.map((media: QuestionMedia, index) => {
                                if (media.type === 'image') {
                                  return (
                                    <img
                                      key={media.type + index}
                                      src={media.url}
                                      alt=""
                                      className="max-w-full h-auto rounded border max-h-32"
                                    />
                                  )
                                }
                                if (media.type === 'audio') {
                                  return (
                                    <audio
                                      key={media.type + index}
                                      controls
                                      src={media.url}
                                      className="flex-1 mt-2"
                                    />
                                  )
                                }
                              })
                            : answer.content_struct?.media?.type &&
                              answer.content_struct?.media?.url && (
                                <>
                                  {answer.content_struct.media.type ===
                                    "image" && (
                                      <img
                                        src={answer.content_struct.media.url}
                                        alt=""
                                        className="max-w-full h-auto rounded border max-h-32"
                                      />
                                    )}
                                  {answer.content_struct.media.type ===
                                    "audio" && (
                                      <audio
                                        controls
                                        src={answer.content_struct.media.url}
                                        className="flex-1 mt-2"
                                      />
                                    )}
                                </>
                              )}
                          </div>
                        </div>
                        {/* Student Answer */}
                        <div className="bg-green-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2">
                            {t("studentAnswer")}:
                          </h4>
                          <div className="text-gray-700">
                            {answer.type === "speaking" ? (
                              answer.file_url ? (
                                <div className="flex items-center space-x-3">
                                  <Mic className="h-5 w-5 text-blue-600" />
                                  <audio
                                    controls
                                    src={answer.file_url}
                                    className="flex-1"
                                  />
                                </div>
                              ) : (
                                <span className="italic text-gray-500">
                                  {t("studentNotRecorded")}
                                </span>
                              )
                            ) : answer.type === "writing" ? (
                              answer.answer ? (
                                <span>{answer.answer}</span>
                              ) : (
                                <span className="italic text-gray-500">
                                  {t("studentNotWritten")}
                                </span>
                              )
                            ) : null}
                          </div>
                        </div>

                        {/* Score input with AI Grading Button */}
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t("score")} (0-10)
                          </label>
                          <div className="flex items-center gap-3">
                            <input
                              type="number"
                              step="0.5"
                              min={0}
                              max={10}
                              value={scores[answer.id] ?? ""}
                              onChange={(e) =>
                                handleScoreChange(answer.id, e.target.value)
                              }
                              className={`w-32 px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:border-blue-400 transition ${answer.is_scored === true
                                ? "border-green-300 bg-green-50 focus:ring-green-200"
                                : "border-gray-200 focus:ring-blue-200"
                                }`}
                              placeholder={
                                answer.is_scored === true
                                  ? `${answer.manual_score || ""}`
                                  : ""
                              }
                            />
                            {/* AI Grading Button for Speaking and Writing */}
                            {(answer.type === "speaking" || answer.type === "writing") && (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAIGrading(answer)}
                                disabled={aiGradingLoading && currentGradingAnswerId === answer.id}
                                className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 text-purple-700 hover:from-purple-100 hover:to-pink-100 hover:border-purple-300"
                              >
                                <Sparkles className="h-4 w-4 mr-1" />
                                {(aiGradingLoading && currentGradingAnswerId === answer.id) ? "Đang chấm..." : "Chấm AI"}
                              </Button>
                              {aiGradingCache[answer.id] && (
                                <Badge variant="outline" className="text-xs text-green-600 border-green-300 bg-green-50">
                                  ✓ Đã chấm
                                </Badge>
                              )}
                            </div>
                          )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              {confirmDialogData?.type === "unmarked" &&
                t("confirmExitUnmarked", {
                  count: confirmDialogData.unmarkedCount,
                })}
              {confirmDialogData?.type === "no_comment" &&
                t("confirmExitNoComment")}
              {confirmDialogData?.type === "both" &&
                t("confirmExitBoth", {
                  count: confirmDialogData.unmarkedCount,
                })}
            </DialogTitle>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleConfirmExit}
              className="flex-1"
              disabled={submitting}
            >
              {submitting ? t("submitting") : t("yes")}
            </Button>
            <Button
              onClick={handleContinueGrading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={submitting}
            >
              {confirmDialogData?.type === "unmarked" && t("continueMarking")}
              {confirmDialogData?.type === "no_comment" && t("giveComment")}
              {confirmDialogData?.type === "both" && t("continueMarking")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Grading Result Dialog */}
      <Dialog open={showAiGradingDialog} onOpenChange={setShowAiGradingDialog}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Kết quả chấm điểm từ AI
              {/* Hiển thị badge nếu là kết quả cached */}
              {currentGradingAnswerId &&
                aiGradingCache[currentGradingAnswerId] && (
                  <Badge
                    variant="outline"
                    className="ml-2 text-xs text-green-600 border-green-300 bg-green-50"
                  >
                    Kết quả đã lưu
                  </Badge>
                )}
            </DialogTitle>
            <DialogDescription>
              Đây là kết quả tham khảo từ AI. Giáo viên có thể tham khảo để đưa
              ra quyết định chấm điểm cuối cùng.
            </DialogDescription>
          </DialogHeader>

          {aiGradingResult && (
            <div className="space-y-6 py-4">
              {/* Question and Answer Section */}
              <div className="space-y-4">
                {/* Question */}
                {currentGradingQuestion && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Câu hỏi / Yêu cầu
                    </h4>
                    <div className="text-sm text-blue-800">
                      <TiptapMathViewer value={currentGradingQuestion} />
                    </div>
                  </div>
                )}

                {/* Student Answer */}
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Câu trả lời của học sinh
                  </h4>
                  <div className="text-sm text-green-800">
                    {currentGradingAnswer?.type === "writing" && currentGradingAnswer.answer && (
                      <div className="whitespace-pre-wrap bg-white p-3 rounded border border-green-300">
                        {currentGradingAnswer.answer}
                      </div>
                    )}
                    {currentGradingAnswer?.type === "speaking" && currentGradingAnswer.file_url && (
                      <div className="flex items-center space-x-3 bg-white p-3 rounded border border-green-300">
                        <Mic className="h-5 w-5 text-green-600" />
                        <span>Ghi âm của học sinh:</span>
                        <audio controls src={currentGradingAnswer.file_url} className="flex-1" />
                      </div>
                    )}
                    {overview?.homework_question_form === "write" && submitFiles.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Các file đã nộp:</p>
                        <div className="grid grid-cols-2 gap-2">
                          {submitFiles.filter(f => f.type === "image").map((file, idx) => (
                            <div key={idx} className="bg-white p-2 rounded border border-green-300">
                              <img
                                src={file.url}
                                alt={`Bài làm ${idx + 1}`}
                                className="w-full h-auto rounded"
                              />
                              <p className="text-xs text-gray-600 mt-1 text-center">
                                Ảnh {idx + 1}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Overall Score */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Điểm tổng thể</p>
                  <p className="text-5xl font-bold text-purple-700">
                    {aiGradingResult.overall_score.toFixed(1)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">/ 10</p>
                </div>
              </div>

              {/* Detailed Scores */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-xs text-gray-600 mb-1">Ngữ pháp</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {aiGradingResult.grammar_score.toFixed(1)}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <p className="text-xs text-gray-600 mb-1">Từ vựng</p>
                  <p className="text-2xl font-bold text-green-700">
                    {aiGradingResult.vocabulary_score.toFixed(1)}
                  </p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <p className="text-xs text-gray-600 mb-1">Tổ chức</p>
                  <p className="text-2xl font-bold text-orange-700">
                    {aiGradingResult.organization_score.toFixed(1)}
                  </p>
                </div>
                <div className="bg-pink-50 rounded-lg p-4 border border-pink-200">
                  <p className="text-xs text-gray-600 mb-1">Nội dung</p>
                  <p className="text-2xl font-bold text-pink-700">
                    {aiGradingResult.content_score.toFixed(1)}
                  </p>
                </div>
              </div>

              {/* Feedback */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Nhận xét chung
                </h4>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {aiGradingResult.feedback}
                </p>
              </div>

              {/* Strengths */}
              {aiGradingResult.strengths &&
                aiGradingResult.strengths.length > 0 && (
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Điểm mạnh
                    </h4>
                    <ul className="list-disc list-inside space-y-1">
                      {aiGradingResult.strengths.map((strength, index) => (
                        <li key={index} className="text-sm text-green-800">
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              {/* Improvements */}
              {aiGradingResult.improvements &&
                aiGradingResult.improvements.length > 0 && (
                  <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                    <h4 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                      <PenTool className="h-4 w-4" />
                      Cần cải thiện
                    </h4>
                    <ul className="list-disc list-inside space-y-1">
                      {aiGradingResult.improvements.map(
                        (improvement, index) => (
                          <li key={index} className="text-sm text-orange-800">
                            {improvement}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={() => setShowAiGradingDialog(false)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
