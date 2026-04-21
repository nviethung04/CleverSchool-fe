import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { CreateQuestionRelation } from "@/lib/api/exams";
import { CreateHomework } from "@/lib/api/homeworks";
import { uploadFile, getQuestions, type QuestionType } from "@/lib/api/questions";
import { QuestionDetailDialog } from "@/components/question-detail-dialog";
import { TiptapMathViewer } from "@/components/question-editor/tiptap-math-viewer";
import { LucideArrowLeft, LucideCheck, LucideImage, LucideLoader2, LucidePlus, LucideSearch, LucideX, LucideEye, LucideBookOpen, LucideChevronLeft, LucideChevronRight, LucideAlertCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface HomeworkCreateFormProps {
  onSuccess?: (res?: any) => void;
  onCancel?: () => void;
  hideSidebar?: boolean;
}

export function HomeworkCreateForm({ onSuccess, onCancel, hideSidebar }: HomeworkCreateFormProps) {
  const router = useRouter ? useRouter() : { push: () => {} };
  const { toast } = useToast();

  // State cho thông tin bài tập về nhà
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<number>(1); // 1: active, 0: draft
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [uploadingCover, setUploadingCover] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [questionScores, setQuestionScores] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [questionBankOpen, setQuestionBankOpen] = useState(false);

  // State cho ngân hàng câu hỏi
  const [questions, setQuestions] = useState<QuestionType[]>([]);
  const [selectedQuestionsData, setSelectedQuestionsData] = useState<QuestionType[]>([]);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [questionError, setQuestionError] = useState<string | null>(null);
  const [questionFilters, setQuestionFilters] = useState({
    page: 1,
    limit: 20,
    type: "all",
    search: "",
  });
  const [hasMoreQuestions, setHasMoreQuestions] = useState(true);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | number | null>(null);
  const [questionDetailOpen, setQuestionDetailOpen] = useState(false);

  // Fetch danh sách câu hỏi khi mở ngân hàng câu hỏi
  useEffect(() => {
    const fetchQuestions = async () => {
      if (!questionBankOpen) return;

      setQuestionLoading(true);
      setQuestionError(null);

      try {
        const questionsData = await getQuestions({
          page: questionFilters.page,
          per_page: questionFilters.limit,
          keyword: questionFilters.search || undefined,
          question_type: questionFilters.type !== "all" ? questionFilters.type : undefined,
          sort_created_at: "newest" // Sắp xếp theo mới nhất
        });

        if (questionsData && Array.isArray(questionsData.questions)) {
          setQuestions(questionsData.questions);
          // Cập nhật hasMore dựa trên số lượng câu hỏi trả về
          setHasMoreQuestions(questionsData.questions.length === questionFilters.limit);
        } else {
          setQuestionError("Failed to fetch questions: Invalid response format");
        }
      } catch (err: any) {
        console.error("Error fetching questions:", err);
        setQuestionError(err.message || "An error occurred while fetching questions");
      } finally {
        setQuestionLoading(false);
      }
    };

    fetchQuestions();
  }, [questionBankOpen, questionFilters]);

  // Xử lý khi chọn ảnh cover
  const handleCoverImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setCoverImage(file);

      // Tạo URL tạm thời để hiển thị preview
      const objectUrl = URL.createObjectURL(file);
      setCoverImageUrl(objectUrl);

      // Upload ảnh cover
      setUploadingCover(true);
      try {
        const uploadResponse = await uploadFile(file, "covers");
        console.log("Cover image upload response:", uploadResponse);

        // Kiểm tra nếu có lỗi
        if (uploadResponse.error) {
          throw new Error(uploadResponse.error);
        }

        // Lấy URL từ response
        const fileUrl = uploadResponse?.url || uploadResponse?.data?.url;

        if (!fileUrl) {
          throw new Error("Không nhận được URL file từ server");
        }

        // Cập nhật URL ảnh cover
        setCoverImageUrl(fileUrl);

        toast({
          title: "Tải lên thành công",
          description: "Ảnh cover đã được tải lên thành công.",
        });
      } catch (error: any) {
        console.error("Lỗi khi upload ảnh cover:", error);
        toast({
          title: "Lỗi tải lên",
          description: error.message || "Không thể tải lên ảnh cover. Vui lòng thử lại sau.",
          variant: "destructive",
        });
      } finally {
        setUploadingCover(false);
      }
    }
  };

  // Xử lý khi xóa ảnh cover
  const handleRemoveCoverImage = () => {
    setCoverImage(null);
    setCoverImageUrl("");
  };

  // Xử lý khi chọn/bỏ chọn câu hỏi
  const handleQuestionToggle = (questionId: string, defaultPoints = 0) => {
    const question = questions.find(q => q.id.toString() === questionId);
    
    setSelectedQuestions((prev) => {
      const newSelected = prev.includes(questionId) ? prev.filter((id) => id !== questionId) : [...prev, questionId];

      // Cập nhật selectedQuestionsData
      if (question) {
        setSelectedQuestionsData((prevData) => {
          if (newSelected.includes(questionId)) {
            // Thêm câu hỏi nếu chưa có
            const exists = prevData.find(q => q.id.toString() === questionId);
            if (!exists) {
              return [...prevData, question];
            }
            return prevData;
          } else {
            // Xóa câu hỏi
            return prevData.filter(q => q.id.toString() !== questionId);
          }
        });
      }

      // Nếu bỏ chọn câu hỏi, xóa điểm số khỏi state
      if (!newSelected.includes(questionId)) {
        setQuestionScores((prev) => {
          const newScores = { ...prev };
          delete newScores[questionId];
          return newScores;
        });
      } else {
        // Nếu chọn câu hỏi, thêm điểm mặc định
        setQuestionScores((prev) => ({
          ...prev,
          [questionId]: defaultPoints,
        }));
      }

      return newSelected;
    });
  };

  // Xử lý khi thay đổi điểm số của câu hỏi
  const handleScoreChange = (questionId: string, score: number) => {
    setQuestionScores((prev) => ({
      ...prev,
      [questionId]: score,
    }));
  };

  // Xử lý khi lưu bài tập về nhà
  const handleSaveHomework = async () => {
    // Validate dữ liệu
    if (!name.trim()) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập tên bài tập về nhà",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      // Tính tổng điểm tối đa từ các câu hỏi đã chọn
      const maxScore = selectedQuestions.reduce((total, questionId) => {
        return total + (questionScores[questionId] || 0);
      }, 0);

      // Bước 1: Tạo bài tập về nhà
      const homeworkData = {
        name,
        description,
        status,
        max_score: maxScore,
        cover_image: coverImageUrl,
        lesson_id: 0, // Use 0 as default for no lesson
      };

      const createdHomework = await CreateHomework(homeworkData);
      console.log("Homework created:", createdHomework);

      // Bước 2: Liên kết câu hỏi với bài tập về nhà (nếu có câu hỏi được chọn)
      if (selectedQuestions.length > 0) {
        // Tạo object question_scores từ selectedQuestions và questionScores
        const questionScoresObj: Record<string, number> = {};
        selectedQuestions.forEach((id) => {
          questionScoresObj[id] = questionScores[id] || 0;
        });

        const relationData = {
          exam_id: null,
          homework_id: Number(createdHomework.id),
          lesson_plan_part_id: null,
          question_scores: questionScoresObj,
        };

        await CreateQuestionRelation(relationData);
        console.log("Question relation created successfully");
      }

      toast({
        title: "Thành công",
        description: "Bài tập về nhà đã được tạo thành công.",
      });

      // Chuyển về trang danh sách bài tập về nhà
      setTimeout(() => {
        if (onSuccess) onSuccess(createdHomework);
        else router.push("/manage/assignments");
      }, 1500);
    } catch (error: any) {
      console.error("Error creating homework:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo bài tập về nhà. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Xử lý khi thay đổi trang trong ngân hàng câu hỏi
  const handleQuestionPageChange = (newPage: number) => {
    if (newPage > 0 && (newPage === 1 || (newPage > questionFilters.page && hasMoreQuestions) || (newPage < questionFilters.page))) {
      setQuestionFilters((prev) => ({ ...prev, page: newPage }));
    }
  };

  // Xử lý khi thay đổi bộ lọc câu hỏi
  const handleQuestionFilterChange = (key: string, value: string) => {
    setQuestionFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  // Xử lý khi tìm kiếm câu hỏi
  const handleQuestionSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuestionFilters((prev) => ({ ...prev, page: 1 }));
  };

  // Xử lý khi click vào icon mắt để xem chi tiết câu hỏi
  const handleViewQuestionDetail = (questionId: string | number) => {
    setSelectedQuestionId(questionId);
    setQuestionDetailOpen(true);
  };

  // Format loại câu hỏi để hiển thị
  const formatQuestionType = (type: string) => {
    if (!type) return "Unknown";

    const typeMap: Record<string, string> = {
      fill_in_blanks: "Fill In Blanks",
      matching: "Matching",
      labeling: "Labeling",
      multiple_choice: "Multiple Choice",
      ordering: "Ordering",
      drag_drop: "Drag & Drop",
      writing: "Writing",
      speaking: "Speaking",
      category: "Category",
    };

    return (
      typeMap[type] ||
      type
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    );
  };

  // Lấy câu hỏi đã chọn
  const getSelectedQuestionsList = () => {
    return selectedQuestionsData;
  };

  // Helper function to render media content
  const renderMediaContent = (media: any) => {
    if (!media) return null;

    switch (media.type) {
      case 'image':
        return (
          <div className="mt-2">
            <img 
              src={media.url} 
              alt="Question media" 
              className="max-w-full h-auto rounded-lg border border-gray-200"
              style={{ maxHeight: '200px' }}
            />
          </div>
        );
      case 'audio':
        return (
          <div className="mt-2">
            <audio controls className="w-full max-w-md">
              <source src={media.url} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          </div>
        );
      case 'video':
        return (
          <div className="mt-2">
            <video controls className="w-full max-w-md rounded-lg border border-gray-200" style={{ maxHeight: '300px' }}>
              <source src={media.url} type="video/mp4" />
              Your browser does not support the video element.
            </video>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={hideSidebar ? "" : "min-h-screen bg-white"}>
      <main className={hideSidebar ? "p-0" : "container mx-auto px-6 py-12"}>
        {/* Header */}
        {!hideSidebar && (
          <div className="mb-12">
            <Button variant="ghost" size="icon" className="mb-6" asChild>
              <Link href="/manage/assignments">
                <LucideArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="text-center">
              <h1 className="text-3xl font-light text-gray-900 mb-2">Tạo bài tập về nhà mới</h1>
              <p className="text-gray-500">Nhập thông tin cần thiết để tạo bài tập về nhà</p>
            </div>
          </div>
        )}

        <div className={hideSidebar ? "grid grid-cols-1 gap-6" : "grid grid-cols-1 lg:grid-cols-3 gap-8"}>
          {/* Main Content */}
          <div className={hideSidebar ? "col-span-1" : "lg:col-span-2"}>
            <div className="max-w-2xl mx-auto lg:mx-0">
              <div className="space-y-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-6">Thông tin cơ bản</h2>
                
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                      Tên bài tập về nhà <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      placeholder="Nhập tên bài tập về nhà"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                      Mô tả bài tập về nhà
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Nhập mô tả chi tiết về bài tập về nhà"
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="mt-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="status" className="text-sm font-medium text-gray-700">
                      Trạng thái
                    </Label>
                    <Select value={status.toString()} onValueChange={(value) => setStatus(Number(value))}>
                      <SelectTrigger id="status" className="mt-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                        <SelectValue placeholder="Chọn trạng thái" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Xuất bản</SelectItem>
                        <SelectItem value="0">Bản nháp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            

            {/* Questions */}
            <div className="border-t pt-8">
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-6">Câu hỏi</h2>
                
                <Tabs defaultValue="bank" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="bank">Ngân hàng câu hỏi</TabsTrigger>
                    <TabsTrigger value="new">Tạo mới</TabsTrigger>
                  </TabsList>

                  <TabsContent value="bank" className="space-y-6">
                    <Button
                      variant="outline"
                      className="w-full h-24 flex flex-col items-center gap-2 border-dashed border-gray-300 hover:border-gray-400"
                      onClick={() => setQuestionBankOpen(true)}
                    >
                      <LucideBookOpen className="h-6 w-6 text-gray-400" />
                      <span className="font-medium text-gray-700">Chọn từ ngân hàng câu hỏi</span>
                      <span className="text-sm text-gray-500">Chọn câu hỏi có sẵn để thêm vào bài tập về nhà</span>
                    </Button>

                    {selectedQuestions.length > 0 && (
                      <div>
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center">
                            <LucideCheck className="h-4 w-4 text-green-600" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            Câu hỏi đã chọn ({selectedQuestions.length})
                          </h3>
                        </div>
                        <div className="bg-gray-50 rounded-2xl border border-gray-200 divide-y divide-gray-200">
                          {getSelectedQuestionsList().map((question, index) => (
                            <div key={question.id} className="p-6 hover:bg-gray-25 transition-colors">
                              <div className="flex gap-4">
                                <div className="flex-1">
                                  {/* Question Title */}
                                  <div className="mb-3">
                                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                                      Question {index + 1}:
                                    </h4>
                                  </div>
                                  
                                  {/* Question Content */}
                                  <div className="mb-4">
                                    <div className="font-medium text-gray-900 text-base leading-relaxed mb-3">
                                      <TiptapMathViewer
                                        value={question.content.text.split('\n').join('<br />')}
                                        isHtml
                                      />
                                    </div>
                                    
                                    {/* Question Media */}
                                    {question.content?.media && renderMediaContent(question.content.media)}
                                  </div>

                                  {/* Enhanced Answer Options Display */}
                                  {question.type === "multiple_choice" && question.options?.answers && (
                                    <div className="mb-4">
                                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Đáp án:</div>
                                      <div className="grid grid-cols-2 gap-2">
                                        {question.options.answers.map((answer: any, idx: number) => {
                                          const isCorrect = question.correct_answers?.ids?.includes(idx);
                                          return (
                                            <div
                                              key={idx}
                                              className={`p-3 rounded-xl border text-sm ${
                                                isCorrect 
                                                  ? "bg-green-50 border-green-200 text-green-800" 
                                                  : "bg-gray-50 border-gray-200 text-gray-700"
                                              }`}
                                            >
                                              <div className="flex items-start gap-2">
                                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${
                                                  isCorrect ? "bg-green-200 text-green-800" : "bg-gray-200 text-gray-600"
                                                }`}>
                                                  {String.fromCharCode(65 + idx)}
                                                </span>
                                                <div className="flex-1">
                                                  <div className="break-words">{answer.text}</div>
                                                  {answer.media && renderMediaContent(answer.media)}
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  {question.type === "fill_in_blanks" && question.correct_answers?.list && (
                                    <div className="mb-4">
                                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Đáp án đúng:</div>
                                      <div className="flex flex-wrap gap-2">
                                        {Object.entries(question.correct_answers.list).map(([key, value], idx) => (
                                          <div key={idx} className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                                            <span className="text-xs font-medium text-blue-600">{key}:</span>
                                            <span className="text-sm text-blue-800 ml-1">{String(value)}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {question.type === "matching" && (question.options as any)?.sources && (question.options as any)?.targets && (
                                    <div className="mb-4">
                                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Ghép đôi:</div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                          <div className="text-xs font-medium text-purple-600 mb-2">Nguồn:</div>
                                          <div className="space-y-2">
                                            {(question.options as any).sources.slice(0, 3).map((source: any, idx: number) => (
                                              <div key={idx} className="p-2 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-800">
                                                {source.content?.text}
                                                {source.content?.media && renderMediaContent(source.content.media)}
                                              </div>
                                            ))}
                                            {(question.options as any).sources.length > 3 && (
                                              <div className="text-xs text-gray-500">+{(question.options as any).sources.length - 3} items nữa</div>
                                            )}
                                          </div>
                                        </div>
                                        <div>
                                          <div className="text-xs font-medium text-pink-600 mb-2">Đích:</div>
                                          <div className="space-y-2">
                                            {(question.options as any).targets.slice(0, 3).map((target: any, idx: number) => (
                                              <div key={idx} className="p-2 bg-pink-50 border border-pink-200 rounded-lg text-sm text-pink-800">
                                                {target.content?.text}
                                                {target.content?.media && renderMediaContent(target.content.media)}
                                              </div>
                                            ))}
                                            {(question.options as any).targets.length > 3 && (
                                              <div className="text-xs text-gray-500">+{(question.options as any).targets.length - 3} items nữa</div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {question.type === "ordering" && question.options?.answers && (
                                    <div className="mb-4">
                                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Thứ tự đúng:</div>
                                      <div className="space-y-2">
                                        {question.options.answers.map((answer: any, idx: number) => (
                                          <div key={idx} className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                            <span className="w-6 h-6 bg-orange-200 text-orange-800 rounded-full flex items-center justify-center text-xs font-medium">
                                              {answer.correct_position || (idx + 1)}
                                            </span>
                                            <div className="flex-1">
                                              <div className="text-sm text-orange-800">{answer.text}</div>
                                              {answer.media && renderMediaContent(answer.media)}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {question.type === "labeling" && question.options?.labels && (
                                    <div className="mb-4">
                                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Nhãn:</div>
                                      <div className="flex flex-wrap gap-2">
                                        {question.options.labels.map((label: any, idx: number) => (
                                          <div key={idx} className="px-3 py-2 bg-cyan-50 border border-cyan-200 rounded-lg">
                                            <span className="text-sm text-cyan-800">{label.text}</span>
                                            {label.media && renderMediaContent(label.media)}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {question.type === "category" && question.options?.categories && question.options?.items && (
                                    <div className="mb-4">
                                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Phân loại:</div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                          <div className="text-xs font-medium text-teal-600 mb-2">Danh mục:</div>
                                          <div className="space-y-1">
                                            {question.options.categories.slice(0, 3).map((category: any, idx: number) => (
                                              <div key={idx} className="px-3 py-2 bg-teal-50 border border-teal-200 rounded-lg text-sm text-teal-800">
                                                {category.name}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                        <div>
                                          <div className="text-xs font-medium text-emerald-600 mb-2">Items:</div>
                                          <div className="space-y-1">
                                            {question.options.items.slice(0, 3).map((item: any, idx: number) => (
                                              <div key={idx} className="px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800">
                                                {item.text}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {question.type === "drag_drop" && question.options?.items && (
                                    <div className="mb-4">
                                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Kéo thả:</div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                          <div className="text-xs font-medium text-yellow-600 mb-2">Items kéo:</div>
                                          <div className="space-y-2">
                                            {question.options.items.slice(0, 4).map((item: any, idx: number) => (
                                              <div key={idx} className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                                                {item.text}
                                                {item.media && renderMediaContent(item.media)}
                                              </div>
                                            ))}
                                            {question.options.items.length > 4 && (
                                              <div className="text-xs text-gray-500">+{question.options.items.length - 4} items nữa</div>
                                            )}
                                          </div>
                                        </div>
                                        {question.options?.blanks && question.options.blanks.length > 0 && (
                                          <div>
                                            <div className="text-xs font-medium text-slate-600 mb-2">Vùng thả:</div>
                                            <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800">
                                              {question.options.blanks.length} vùng thả
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {(question.type === "writing" || question.type === "speaking") && (
                                    <div className="mb-4">
                                      <div className="px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                                        <div className="flex items-center gap-2">
                                          <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                                          <span className="text-sm font-medium text-indigo-800">
                                            Câu hỏi tự luận - {question.type === "writing" ? "Viết" : "Nói"}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Question Type Badge */}
                                  <div className="flex items-center gap-3">
                                    <Badge className="bg-green-50 text-green-600 border border-green-200 px-3 py-1 rounded-full text-xs font-medium">
                                      {formatQuestionType(question.type)}
                                    </Badge>
                                    {question.level && (
                                      <Badge
                                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                                          question.level === "easy"
                                            ? "bg-green-100 text-green-700 border border-green-200"
                                            : question.level === "medium"
                                            ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                                            : "bg-red-100 text-red-700 border border-red-200"
                                        }`}
                                      >
                                        {question.level.charAt(0).toUpperCase() + question.level.slice(1)}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Actions */}
                                <div className="flex flex-col items-end gap-4 ml-4">
                                  <div className="flex items-center gap-2">
                                    <Label
                                      htmlFor={`score-${question.id}`}
                                      className="text-sm font-medium text-gray-700"
                                    >
                                      Điểm:
                                    </Label>
                                    <Input
                                      id={`score-${question.id}`}
                                      type="number"
                                      min="0"
                                      step="0.5"
                                      className="w-20 h-8 rounded-xl border-gray-200 focus:border-green-300 focus:ring-green-200"
                                      value={
                                        questionScores[question.id.toString()] !== undefined
                                          ? questionScores[question.id.toString()]
                                          : question.metadata?.points || 0
                                      }
                                      onChange={(e) =>
                                        handleScoreChange(
                                          question.id.toString(),
                                          Number.parseFloat(e.target.value) || 0
                                        )
                                      }
                                    />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 rounded-xl hover:bg-blue-50"
                                      onClick={() => handleViewQuestionDetail(question.id)}
                                    >
                                      <LucideEye className="h-4 w-4 text-blue-600" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 rounded-xl hover:bg-red-50"
                                      onClick={() => handleQuestionToggle(question.id.toString())}
                                    >
                                      <LucideX className="h-4 w-4 text-red-600" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="new" className="text-center py-12">
                    <div className="max-w-md mx-auto">
                      <LucidePlus className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Tạo câu hỏi mới</h3>
                      <p className="text-sm text-gray-500 mb-6">
                        Tạo câu hỏi mới để thêm vào bài tập về nhà. Câu hỏi sẽ được lưu vào ngân hàng câu hỏi.
                      </p>
                      <Button asChild>
                        <Link href="/manage/question-bank/create-question" target="_blank" rel="noopener noreferrer">
                          Tạo câu hỏi mới
                        </Link>
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>

            {/* Save Button */}
            <div className="border-t pt-8 flex justify-end gap-3">
              {onCancel && (
                <Button variant="outline" onClick={onCancel}>
                  Hủy
                </Button>
              )}
              <Button onClick={handleSaveHomework} disabled={isSaving} className="px-8">
                {isSaving ? (
                  <>
                    <LucideLoader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <LucideCheck className="mr-2 h-4 w-4" />
                    Lưu bài tập về nhà
                  </>
                )}
              </Button>
            </div>
              </div>
            </div>
          </div>

        {/* Sidebar - Hướng dẫn */}
        {!hideSidebar && (
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-gray-900">Hướng dẫn</CardTitle>
                <CardDescription>Các bước tạo bài tập về nhà</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-medium">
                      1
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Nhập thông tin bài tập</p>
                      <p className="text-sm text-gray-600 mt-1">Nhập tên, mô tả và các thông tin cơ bản của bài tập về nhà.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-medium">
                      2
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Thêm ảnh bìa</p>
                      <p className="text-sm text-gray-600 mt-1">Tải lên ảnh bìa để làm cho bài tập về nhà trở nên hấp dẫn hơn.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-medium">
                      3
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Thêm câu hỏi (tùy chọn)</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Thêm câu hỏi từ ngân hàng câu hỏi hoặc tạo câu hỏi mới cho bài tập về nhà.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-medium">
                      4
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Lưu bài tập về nhà</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Kiểm tra lại thông tin và nhấn nút "Lưu bài tập về nhà" để hoàn tất.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-gray-900">Lưu ý</CardTitle>
                <CardDescription>Thông tin quan trọng</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-700">
                      Tất cả các trường thông tin đều có thể để trống, ngoại trừ tên bài tập về nhà. Bạn có thể tạo bài
                      tập về nhà trước và cập nhật thông tin sau.
                    </p>
                  </div>                  
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      </main>

      {/* Dialog ngân hàng câu hỏi */}
      <Dialog open={questionBankOpen} onOpenChange={setQuestionBankOpen}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col z-[1200]">
          <DialogHeader>
            <DialogTitle>Ngân hàng câu hỏi</DialogTitle>
            <DialogDescription>Chọn câu hỏi để thêm vào bài tập về nhà</DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2 mb-4">
            <form onSubmit={handleQuestionSearch} className="relative flex-1">
              <LucideSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                className="pl-10"
                placeholder="Tìm kiếm câu hỏi..."
                value={questionFilters.search}
                onChange={(e) => handleQuestionFilterChange("search", e.target.value)}
              />
            </form>
            <Select value={questionFilters.type} onValueChange={(value) => handleQuestionFilterChange("type", value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Loại câu hỏi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                <SelectItem value="fill_in_blanks">Fill in Blanks</SelectItem>
                <SelectItem value="matching">Matching</SelectItem>
                <SelectItem value="ordering">Ordering</SelectItem>
                <SelectItem value="writing">Writing</SelectItem>
                <SelectItem value="speaking">Speaking</SelectItem>
                <SelectItem value="category">Category</SelectItem>
                <SelectItem value="labeling">Labeling</SelectItem>
                <SelectItem value="drag_drop">Drag & Drop</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 overflow-auto border rounded-md">
            {questionLoading ? (
              <div className="flex justify-center items-center h-full">
                <LucideLoader2 className="h-8 w-8 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500">Đang tải câu hỏi...</span>
              </div>
            ) : questionError ? (
              <div className="flex justify-center items-center h-full text-red-500">
                <LucideAlertCircle className="h-8 w-8 mr-2" />
                <span>{questionError}</span>
              </div>
            ) : questions.length === 0 ? (
              <div className="flex justify-center items-center h-full text-gray-500">
                <span>Không tìm thấy câu hỏi nào</span>
              </div>
            ) : (
              <div className="divide-y">
                {questions.map((question) => (
                  <div key={question.id} className="p-3 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id={`question-bank-${question.id}`}
                        checked={selectedQuestions.includes(question.id.toString())}
                        onChange={() => handleQuestionToggle(question.id.toString(), question.metadata?.points || 0)}
                        className="mt-1"
                      />
                      <div>
                        <label htmlFor={`question-bank-${question.id}`} className="font-medium cursor-pointer">
                          <TiptapMathViewer value={question.content.text.split('\n').join('<br />')} isHtml />
                        </label>
                        {/* Simple answers display */}
                        {question.type === "multiple_choice" && question.options?.answers && (
                          <div className="mb-2">
                            <div className="flex flex-wrap gap-1">
                              {question.options.answers.slice(0, 4).map((answer: any, idx: number) => {
                                const isCorrect = question.correct_answers?.ids?.includes(idx);
                                return (
                                  <span
                                    key={idx}
                                    className={`text-xs px-2 py-1 rounded ${
                                      isCorrect 
                                        ? "bg-green-100 text-green-700 border border-green-200" 
                                        : "bg-gray-100 text-gray-600"
                                    }`}
                                  >
                                    {String.fromCharCode(65 + idx)}: {answer.text?.slice(0, 15)}{answer.text?.length > 15 ? "..." : ""}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        {question.type === "fill_in_blanks" && question.correct_answers?.list && (
                          <div className="mb-2">
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(question.correct_answers.list).slice(0, 2).map(([key, value], idx) => (
                                <span key={idx} className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 border border-blue-200">
                                  {key}: {String(value).slice(0, 10)}{String(value).length > 10 ? "..." : ""}
                                </span>
                              ))}
                              {Object.keys(question.correct_answers.list).length > 2 && (
                                <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                                  +{Object.keys(question.correct_answers.list).length - 2} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        {question.type === "matching" && (question.options as any)?.sources && (question.options as any)?.targets && (
                          <div className="mb-2">
                            <div className="flex flex-wrap gap-1">
                              {(question.options as any).sources.slice(0, 2).map((source: any, idx: number) => (
                                <span key={`src-${idx}`} className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-700 border border-purple-200">
                                  {source.content?.text?.slice(0, 10)}{source.content?.text?.length > 10 ? "..." : ""}
                                </span>
                              ))}
                              <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                                ↔
                              </span>
                              {(question.options as any).targets.slice(0, 2).map((target: any, idx: number) => (
                                <span key={`tgt-${idx}`} className="text-xs px-2 py-1 rounded bg-pink-100 text-pink-700 border border-pink-200">
                                  {target.content?.text?.slice(0, 10)}{target.content?.text?.length > 10 ? "..." : ""}
                                </span>
                              ))}
                              {((question.options as any).sources.length > 2 || (question.options as any).targets.length > 2) && (
                                <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                                  +{Math.max((question.options as any).sources.length - 2, (question.options as any).targets.length - 2)} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        {question.type === "ordering" && question.options?.answers && (
                          <div className="mb-2">
                            <div className="flex flex-wrap gap-1">
                              {question.options.answers.slice(0, 3).map((answer: any, idx: number) => (
                                <span key={idx} className="text-xs px-2 py-1 rounded bg-orange-100 text-orange-700 border border-orange-200">
                                  {idx + 1}. {answer.text?.slice(0, 8)}{answer.text?.length > 8 ? "..." : ""}
                                </span>
                              ))}
                              {question.options.answers.length > 3 && (
                                <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                                  +{question.options.answers.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        {(question.type === "writing" || question.type === "speaking") && (
                          <div className="mb-2">
                            <span className="text-xs px-2 py-1 rounded bg-indigo-100 text-indigo-700 border border-indigo-200">
                              Open-ended {question.type}
                            </span>
                          </div>
                        )}
                        {question.type === "labeling" && question.options?.labels && (
                          <div className="mb-2">
                            <div className="flex flex-wrap gap-1">
                              {question.options.labels.slice(0, 3).map((label: any, idx: number) => (
                                <span key={idx} className="text-xs px-2 py-1 rounded bg-cyan-100 text-cyan-700 border border-cyan-200">
                                  {label.text?.slice(0, 10)}{label.text?.length > 10 ? "..." : ""}
                                </span>
                              ))}
                              {question.options.labels.length > 3 && (
                                <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                                  +{question.options.labels.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        {question.type === "category" && question.options?.categories && question.options?.items && (
                          <div className="mb-2">
                            <div className="flex flex-wrap gap-1">
                              {question.options.categories.slice(0, 2).map((category: any, idx: number) => (
                                <span key={`cat-${idx}`} className="text-xs px-2 py-1 rounded bg-teal-100 text-teal-700 border border-teal-200">
                                  {category.name?.slice(0, 8)}{category.name?.length > 8 ? "..." : ""}
                                </span>
                              ))}
                              <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                                ←
                              </span>
                              {question.options.items.slice(0, 2).map((item: any, idx: number) => (
                                <span key={`item-${idx}`} className="text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-700 border border-emerald-200">
                                  {item.text?.slice(0, 8)}{item.text?.length > 8 ? "..." : ""}
                                </span>
                              ))}
                              {(question.options.categories.length > 2 || question.options.items.length > 2) && (
                                <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                                  +{Math.max(question.options.categories.length - 2, question.options.items.length - 2)} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        {question.type === "drag_drop" && question.options?.items && (
                          <div className="mb-2">
                            <div className="flex flex-wrap gap-1">
                              {question.options.items.slice(0, 3).map((item: any, idx: number) => (
                                <span key={idx} className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-700 border border-yellow-200">
                                  {item.text?.slice(0, 10)}{item.text?.length > 10 ? "..." : ""}
                                </span>
                              ))}
                              {question.options.items.length > 3 && (
                                <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                                  +{question.options.items.length - 3} more
                                </span>
                              )}
                              {question.options?.blanks && question.options.blanks.length > 0 && (
                                <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                  {question.options.blanks.length} zones
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{formatQuestionType(question.type)}</Badge>
                          <span className="text-xs text-gray-500">{question.metadata?.points || 0} điểm</span>
                          {question.level && (
                            <Badge
                              className={
                                question.level === "easy"
                                  ? "bg-green-100 text-green-800"
                                  : question.level === "medium"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                              }
                            >
                              {question.level.charAt(0).toUpperCase() + question.level.slice(1)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleViewQuestionDetail(question.id)}
                    >
                      <LucideEye className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-between items-center mt-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuestionPageChange(questionFilters.page - 1)}
                disabled={questionFilters.page <= 1 || questionLoading}
              >
                <LucideChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Trang {questionFilters.page} {hasMoreQuestions ? "" : "(Trang cuối)"}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuestionPageChange(questionFilters.page + 1)}
                disabled={!hasMoreQuestions || questionLoading}
              >
                <LucideChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center">
              <span className="text-sm text-gray-500 mr-4">Đã chọn {selectedQuestions.length} câu hỏi</span>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setQuestionBankOpen(false)}>
                  Hủy
                </Button>
                <Button onClick={() => setQuestionBankOpen(false)}>Xác nhận</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog chi tiết câu hỏi */}
      <QuestionDetailDialog
        questionId={selectedQuestionId}
        open={questionDetailOpen}
        onOpenChange={setQuestionDetailOpen}
      />
    </div>
  );
}

export default HomeworkCreateForm;
