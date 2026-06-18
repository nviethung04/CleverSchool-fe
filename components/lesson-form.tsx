"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { CreateLesson, UpdateLesson, GetLessonDetail, syncLessonVocabularies } from "@/lib/api/lessons";
import { GetExamList } from "@/lib/api/exams";
import { GetHomeworkList } from "@/lib/api/homeworks";
import { getExercisesList } from "@/lib/api/exercises";
import { GetAssessmentList } from "@/lib/api/assessment";
import { getLessonPlans } from "@/lib/api/lectures";
import { GetSubjectsList } from "@/lib/api/subjects";
import { FlashcardAPI } from "@/lib/api/flashcard-api";
import axiosInstance from "@/lib/api/axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { getTagsList, getTopicsList, getSkillsList } from "@/lib/api/utils";
import { getQuestions, type QuestionType } from "@/lib/api/questions";
import LectureCreateForm from "./lecture-create-form";
import { HomeworkForm } from "@/app/[locale]/manage/assignments/components/homework-form";
import { ExamForm } from "@/app/[locale]/manage/assignments/components/exam-form";
import { AssessmentForm } from "@/app/[locale]/manage/assignments/components/assessment-form";
import { ExerciseForm } from "@/app/[locale]/manage/assignments/components/exercise-form";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";
import { useTypedTranslations } from "@/lib/i18n/client";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/context/auth-context";
import { sub } from "date-fns";
import { ArrowLeft } from "lucide-react";

interface LessonFormProps {
  mode: "create" | "edit";
  lessonId?: string;
  chapterId?: string;
  onSuccess?: (res?: any) => void;
  onCancel?: () => void;
  hideSidebar?: boolean;
}

export function LessonForm({
  mode,
  lessonId,
  chapterId,
  onSuccess,
  onCancel,
  hideSidebar,
}: LessonFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const t = useTypedTranslations("lessonForm");
  const params = useParams();
  const locale = params?.locale || "vi";
  const searchParams = useSearchParams();
  const courseId = searchParams.get("course_id");

  const [form, setForm] = useState({
    title: "",
    description: "",
    topic: "",
    tags: [] as string[],
    lesson_dependency: "",
    skills: [] as string[],
    lecture: "",
    exercise: [] as string[],
    test: [] as string[],
    vocabularies: [] as string[],
    homework: [] as string[],
    assessment: [] as string[],
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(mode === "edit");
  const [originalLessonData, setOriginalLessonData] = useState<any>(null);

  // Popup states
  const [openHomeworkPopup, setOpenHomeworkPopup] = useState(false);
  const [openExercisePopup, setOpenExercisePopup] = useState(false);
  const [openAssessmentPopup, setOpenAssessmentPopup] = useState(false);
  const [openExamPopup, setOpenExamPopup] = useState(false);
  const [openLecturePopup, setOpenLecturePopup] = useState(false);
  const [openVocabularyPopup, setOpenVocabularyPopup] = useState(false);
  const [showCreateLecture, setShowCreateLecture] = useState(false);
  const [showCreateHomework, setShowCreateHomework] = useState(false);
  const [showCreateAssessment, setShowCreateAssessment] = useState(false);
  const [showCreateExam, setShowCreateExam] = useState(false);
  const [showCreateExercise, setShowCreateExercise] = useState(false);

  //Chặn click
  const [isCreatingHomework, setIsCreatingHomework] = useState(false);
  const [isCreatingExam, setIsCreatingExam] = useState(false);
  const [isCreatingExercise, setIsCreatingExercise] = useState(false);
  const [isCreatingAssessment, setIsCreatingAssessment] = useState(false);

  // Homework form states for HomeworkForm component
  const [homeworkFormState, setHomeworkFormState] = useState({
    name: "",
    description: "",
    status: 1,
    coverImageUrl: "",
    selectedQuestions: [] as string[],
    selectedQuestionsData: [] as any[],
    questionScores: {} as Record<string, number>,
  });

  // Assessment form states for AssessmentForm component
  const [assessmentFormState, setAssessmentFormState] = useState({
    name: "",
    description: "",
    assessmentType: "mini_test",
    subject_id: "",
  });

  // Assessment reference data states
  const [assessmentSubjects, setAssessmentSubjects] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [assessmentSubjectsLoading, setAssessmentSubjectsLoading] =
    useState(false);
  const [assessmentFileInfos, setAssessmentFileInfos] = useState<any[]>([]);
  const [assessmentFiles, setAssessmentFiles] = useState<string[]>([]);

  // Exam form states for ExamForm component
  const [examFormState, setExamFormState] = useState({
    name: "",
    description: "",
    status: 1,
    timeLimit: 60,
    deadline: undefined as Date | undefined,
    deadlineTime: "23:59",
    coverImageUrl: "",
    selectedQuestions: [] as string[],
    selectedQuestionsData: [] as any[],
    questionScores: {} as Record<string, number>,
  });

  // Exercise form states for ExerciseForm component
  const [exerciseFormState, setExerciseFormState] = useState({
    name: "",
    description: "",
    status: 1,
    timeLimit: 60,
    deadline: undefined as Date | undefined,
    deadlineTime: "23:59",
    coverImageUrl: "",
    selectedQuestions: [] as string[],
    selectedQuestionsData: [] as any[],
    questionScores: {} as Record<string, number>,
  });

  // Question bank states for HomeworkForm
  const [questionBankOpen, setQuestionBankOpen] = useState(false);
  const [questions, setQuestions] = useState<QuestionType[]>([]);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [questionError, setQuestionError] = useState<string | null>(null);
  const [questionFilters, setQuestionFilters] = useState({
    page: 1,
    limit: 20,
    search: "",
    type: "all",
  });
  const [hasMoreQuestions, setHasMoreQuestions] = useState(true);
  const [selectedQuestionId, setSelectedQuestionId] = useState<
    string | number | null
  >(null);
  const [questionDetailOpen, setQuestionDetailOpen] = useState(false);

  // Question bank states for ExamForm
  const [examQuestionBankOpen, setExamQuestionBankOpen] = useState(false);
  const [examQuestions, setExamQuestions] = useState<QuestionType[]>([]);
  const [examQuestionLoading, setExamQuestionLoading] = useState(false);
  const [examQuestionError, setExamQuestionError] = useState<string | null>(
    null
  );
  const [examQuestionFilters, setExamQuestionFilters] = useState({
    page: 1,
    limit: 20,
    search: "",
    type: "all",
  });
  const [examHasMoreQuestions, setExamHasMoreQuestions] = useState(true);

  // Question bank states for ExerciseForm
  const [exerciseQuestionBankOpen, setExerciseQuestionBankOpen] =
    useState(false);
  const [exerciseQuestions, setExerciseQuestions] = useState<QuestionType[]>(
    []
  );
  const [exerciseQuestionLoading, setExerciseQuestionLoading] = useState(false);
  const [exerciseQuestionError, setExerciseQuestionError] = useState<
    string | null
  >(null);
  const [exerciseQuestionFilters, setExerciseQuestionFilters] = useState({
    page: 1,
    limit: 20,
    search: "",
    type: "all",
  });
  const [exerciseSelectedQuestionId, setExerciseSelectedQuestionId] = useState<
    string | number | null
  >(null);
  const [exerciseHasMoreQuestions, setExerciseHasMoreQuestions] =
    useState(true);
  const [exerciseQuestionDetailOpen, setExerciseQuestionDetailOpen] =
    useState(false);

  // Search states
  const [homeworkSearch, setHomeworkSearch] = useState("");
  const [assessmentSearch, setAssessmentSearch] = useState("");
  const [examSearch, setExamSearch] = useState("");
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [lectureSearch, setLectureSearch] = useState("");
  const [vocabularySearch, setVocabularySearch] = useState("");

  // Dropdown data states
  const [topicsList, setTopicsList] = useState<
    { id: string | number; name: string }[]
  >([]);
  const [tagsList, setTagsList] = useState<
    { id: string | number; name: string }[]
  >([]);
  const [skillsList, setSkillsList] = useState<
    { id: string | number; name: string }[]
  >([]);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [skillsLoading, setSkillsLoading] = useState(false);

  // Store information of selected items to display correct names
  const [selectedLectureInfo, setSelectedLectureInfo] = useState<any>(null);
  const [selectedHomeworksInfo, setSelectedHomeworksInfo] = useState<{
    [key: string]: any;
  }>({});
  const [selectedAssessmentInfo, setSelectedAssessmentInfo] = useState<{
    [key: string]: any;
  }>({});
  const [selectedExamsInfo, setSelectedExamsInfo] = useState<{
    [key: string]: any;
  }>({});
  const [selectedVocabulariesInfo, setSelectedVocabulariesInfo] = useState<{
    [key: string]: any;
  }>({});
  const [selectedExercisesInfo, setSelectedExercisesInfo] = useState<{
    [key: string]: any;
  }>({});

  // Temporary state for popup selection (not yet applied to form)
  const [tempSelectedHomeworks, setTempSelectedHomeworks] = useState<string[]>(
    []
  );
  const [tempSelectedAssessment, setTempSelectedAssessment] = useState<
    string[]
  >([]);
  const [tempSelectedExams, setTempSelectedExams] = useState<string[]>([]);
  const [tempSelectedVocabularies, setTempSelectedVocabularies] = useState<
    string[]
  >([]);
  const [tempSelectedExercises, setTempSelectedExercises] = useState<string[]>(
    []
  );
  const [tempSelectedHomeworksInfo, setTempSelectedHomeworksInfo] = useState<{
    [key: string]: any;
  }>({});
  const [tempSelectedAssessmentInfo, setTempSelectedAssessmentInfo] = useState<{
    [key: string]: any;
  }>({});
  const [tempSelectedExamsInfo, setTempSelectedExamsInfo] = useState<{
    [key: string]: any;
  }>({});
  const [tempSelectedVocabulariesInfo, setTempSelectedVocabulariesInfo] =
    useState<{
      [key: string]: any;
    }>({});
  const [tempSelectedExercisesInfo, setTempSelectedExercisesInfo] = useState<{
    [key: string]: any;
  }>({});

  // Data state management - only load when needed
  const [examsData, setExamsData] = useState<any>(null);
  const [homeworksData, setHomeworksData] = useState<any>(null);
  const [assessmentData, setAssessmentData] = useState<any>(null);
  const [exercisesData, setExercisesData] = useState<any>(null);
  const [lessonPlansData, setLessonPlansData] = useState<any>(null);
  const [vocabulariesData, setVocabulariesData] = useState<any>(null);
  const [examsLoading, setExamsLoading] = useState(false);
  const [homeworksLoading, setHomeworksLoading] = useState(false);
  const [assessmentLoading, setAssessmentLoading] = useState(false);
  const [exercisesLoading, setExercisesLoading] = useState(false);
  const [lessonPlansLoading, setLessonPlansLoading] = useState(false);
  const [vocabulariesLoading, setVocabulariesLoading] = useState(false);

  // Pagination states
  const [homeworksPagination, setHomeworksPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [assessmentPagination, setAssessmentPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [exercisesPagination, setExercisesPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [examsPagination, setExamsPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [lessonPlansPagination, setLessonPlansPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [vocabulariesPagination, setVocabulariesPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Debounced search values for better UX
  const debouncedHomeworkSearch = useDebounce(homeworkSearch, 500);
  const debouncedAssessmentSearch = useDebounce(assessmentSearch, 500);
  const debouncedExamSearch = useDebounce(examSearch, 500);
  const debouncedExerciseSearch = useDebounce(exerciseSearch, 500);
  const debouncedLectureSearch = useDebounce(lectureSearch, 500);
  const debouncedVocabularySearch = useDebounce(vocabularySearch, 500);

  // Exam form handlers for ExamForm component
  const handleExamSave = async () => {
    // ⛔ Nếu đang tạo thì bỏ qua (chống spam click)
    if (isCreatingExam) return;

    setIsCreatingExam(true);
    try {
      // Validate dữ liệu
      if (!examFormState.name.trim()) {
        toast({
          title: t("missingInfo"),
          description: t("enterExamName"),
          variant: "destructive",
        });
        return { success: false, error: t("missingExamName") };
      }

      // Tính tổng điểm tối đa từ các câu hỏi đã chọn
      const maxScore = examFormState.selectedQuestions.reduce(
        (total, questionId) => {
          return total + (examFormState.questionScores[questionId] || 0);
        },
        0
      );

      // Bước 1: Tạo bài kiểm tra
      const examData = {
        name: examFormState.name,
        description: examFormState.description,
        status: examFormState.status,
        max_score: maxScore,
        time_limit: examFormState.timeLimit,
        deadline: examFormState.deadline,
        cover_image: examFormState.coverImageUrl,
        lesson_id: 0, // Use 0 as default for no lesson
      };

      // Import CreateExam function
      const { CreateExam } = await import("@/lib/api/exams");
      const createdExam = await CreateExam(examData);

      // Bước 2: Liên kết câu hỏi với bài kiểm tra (nếu có câu hỏi được chọn)
      if (examFormState.selectedQuestions.length > 0) {
        // Tạo object question_scores từ selectedQuestions và questionScores
        const questionScoresObj: Record<string, number> = {};
        examFormState.selectedQuestions.forEach((id) => {
          questionScoresObj[id] = examFormState.questionScores[id] || 0;
        });

        const relationData = {
          exam_id: Number(createdExam.id),
          homework_id: null,
          exercise_id: null,
          lesson_plan_part_id: null,
          question_scores: questionScoresObj,
        };

        // Import CreateQuestionRelation function
        const { CreateQuestionRelation } = await import("@/lib/api/exams");
        await CreateQuestionRelation(relationData);
      }

      toast({
        title: t("success"),
        description: t("examCreatedSuccess"),
      });

      // Tự động thêm exam vào lesson
      const examId = String(createdExam.id);
      setForm((prev) => ({
        ...prev,
        test: [...prev.test, examId],
      }));

      // Cập nhật selectedExamsInfo với thông tin exam mới
      setSelectedExamsInfo((prev) => ({
        ...prev,
        [examId]: {
          id: createdExam.id,
          name: createdExam.name,
          description: createdExam.description,
          max_score: createdExam.max_score,
          time_limit: createdExam.time_limit,
          deadline: createdExam.deadline,
          cover_image: createdExam.cover_image,
        },
      }));

      // Đóng modal và reset form
      setShowCreateExam(false);
      setExamFormState({
        name: "",
        description: "",
        status: 1,
        timeLimit: 60,
        deadline: undefined,
        deadlineTime: "23:59",
        coverImageUrl: "",
        selectedQuestions: [],
        selectedQuestionsData: [],
        questionScores: {},
      });

      return { success: true, data: createdExam };
    } catch (error: any) {
      console.error("❌ Error creating exam:", error);
      toast({
        title: t("error"),
        description: error.message || t("cannotCreateExam"),
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  // Homework form handlers for HomeworkForm component
  const handleHomeworkSave = async () => {
    // ⛔ Nếu đang tạo thì bỏ qua (chống spam click)
    if (isCreatingHomework) return;

    setIsCreatingHomework(true);
    try {
      // Validate dữ liệu
      if (!homeworkFormState.name.trim()) {
        toast({
          title: t("missingInfo"),
          description: t("enterHomeworkName"),
          variant: "destructive",
        });
        return { success: false, error: t("missingHomeworkName") };
      }

      // Tính tổng điểm tối đa từ các câu hỏi đã chọn
      const maxScore = homeworkFormState.selectedQuestions.reduce(
        (total, questionId) => {
          return total + (homeworkFormState.questionScores[questionId] || 0);
        },
        0
      );

      // Bước 1: Tạo bài tập về nhà
      const homeworkData = {
        name: homeworkFormState.name,
        description: homeworkFormState.description,
        status: homeworkFormState.status,
        max_score: maxScore,
        cover_image: homeworkFormState.coverImageUrl,
        lesson_id: 0, // Use 0 as default for no lesson
      };

      // Import CreateHomework function
      const { CreateHomework } = await import("@/lib/api/homeworks");
      const createdHomework = await CreateHomework(homeworkData);

      // Bước 2: Liên kết câu hỏi với bài tập về nhà (nếu có câu hỏi được chọn)
      if (homeworkFormState.selectedQuestions.length > 0) {
        // Tạo object question_scores từ selectedQuestions và questionScores
        const questionScoresObj: Record<string, number> = {};
        homeworkFormState.selectedQuestions.forEach((id) => {
          questionScoresObj[id] = homeworkFormState.questionScores[id] || 0;
        });

        const relationData = {
          exam_id: null,
          homework_id: Number(createdHomework.id),
          exercise_id: null,
          lesson_plan_part_id: null,
          question_scores: questionScoresObj,
        };

        // Import CreateQuestionRelation function
        const { CreateQuestionRelation } = await import("@/lib/api/exams");
        await CreateQuestionRelation(relationData);
      }

      toast({
        title: t("success"),
        description: t("homeworkCreatedSuccess"),
      });

      // Tự động thêm homework vào lesson
      const homeworkId = String(createdHomework.id);
      setForm((prev) => ({
        ...prev,
        homework: [...prev.homework, homeworkId],
      }));

      // Cập nhật selectedHomeworksInfo với thông tin homework mới
      setSelectedHomeworksInfo((prev) => ({
        ...prev,
        [homeworkId]: {
          id: createdHomework.id,
          name: createdHomework.name,
          description: createdHomework.description,
          max_score: createdHomework.max_score,
          cover_image: createdHomework.cover_image,
        },
      }));

      // Đóng modal và reset form
      setShowCreateHomework(false);
      setHomeworkFormState({
        name: "",
        description: "",
        status: 1,
        coverImageUrl: "",
        selectedQuestions: [],
        selectedQuestionsData: [],
        questionScores: {},
      });

      return { success: true, data: createdHomework };
    } catch (error: any) {
      console.error("❌ Error creating homework:", error);
      toast({
        title: t("error"),
        description: error.message || t("cannotCreateHomework"),
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  // Assessment form handlers for AssessmentForm component
  const handleAssessmentSave = async () => {
    // ⛔ Nếu đang tạo thì bỏ qua (chống spam click)
    if (isCreatingAssessment) return;

    setIsCreatingAssessment(true);
    try {
      // Validate dữ liệu
      if (!assessmentFormState.name.trim()) {
        toast({
          title: t("missingInfo"),
          description: t("enterAssessmentName"),
          variant: "destructive",
        });
        return { success: false, error: t("missingAssessmentName") };
      }

      // Validate required fields
      if (!assessmentFormState.subject_id) {
        toast({
          title: t("missingInfo"),
          description: "Vui lòng chọn môn học",
          variant: "destructive",
        });
        return { success: false, error: "Missing subject_id" };
      }

      // Normalize file infos
      const normalizeFileInfos = (infos: any[]) => {
        return infos
          .map((info, index) => {
            const path = info?.path || info?.url;
            if (!path) {
              return null;
            }
            const disk = info?.disk || info?.disk_name || "public";
            return {
              id:
                typeof info?.id === "number" && !Number.isNaN(info.id)
                  ? info.id
                  : index + 1,
              disk,
              path,
            };
          })
          .filter((info) => !!info);
      };

      const normalizedFileInfos = normalizeFileInfos(assessmentFileInfos);

      // Bước 1: Tạo bài đánh giá
      const assessmentData = {
        name: assessmentFormState.name.trim(),
        description: assessmentFormState.description.trim(),
        type: assessmentFormState.assessmentType,
        program_id: 0,
        subject_id: Number(assessmentFormState.subject_id),
        file_infos: normalizedFileInfos.length
          ? normalizedFileInfos
          : undefined,
        files: assessmentFiles.length ? assessmentFiles : undefined,
      };

      // Import CreateAssessment function
      const { CreateAssessment } = await import("@/lib/api/assessment");
      const createdAssessment = await CreateAssessment(assessmentData);

      toast({
        title: t("success"),
        description: t("assessmentCreatedSuccess"),
      });

      // Tự động thêm assessment vào lesson
      const assessmentId = String(createdAssessment.id);
      setForm((prev) => ({
        ...prev,
        assessment: [...prev.assessment, assessmentId],
      }));

      // Cập nhật selectedAssessmentInfo với thông tin assessment mới
      setSelectedAssessmentInfo((prev) => ({
        ...prev,
        [assessmentId]: {
          id: createdAssessment.id,
          name: createdAssessment.name,
          description: createdAssessment.description,
          subject_id: createdAssessment.subject_id,
        },
      }));

      // Đóng modal và reset form
      setShowCreateAssessment(false);
      setAssessmentFormState({
        name: "",
        description: "",
        assessmentType: "mini_test",
        subject_id: "",
      });
      setAssessmentFileInfos([]);
      setAssessmentFiles([]);

      return { success: true, data: createdAssessment };
    } catch (error: any) {
      console.error("❌ Error creating assessment:", error);
      toast({
        title: t("error"),
        description: error.message || t("cannotCreateAssessment"),
        variant: "destructive",
      });
      return { success: false, error };
    } finally {
      setIsCreatingAssessment(false);
    }
  };

  const handleAssessmentFilesChange = useCallback(({
    fileInfos: infos,
    files: urls,
  }: {
    fileInfos: any[];
    files: string[];
  }) => {
    setAssessmentFileInfos(infos || []);
    setAssessmentFiles(urls || []);
  }, []);

  //Handle exercise save
  const handleExerciseSave = async () => {
    try {
      // Validate dữ liệu
      if (!exerciseFormState.name.trim()) {
        toast({
          title: t("missingInfo"),
          description: t("enterExerciseName"),
          variant: "destructive",
        });
        return { success: false, error: t("missingExerciseName") };
      }

      // Tính tổng điểm tối đa từ các câu hỏi đã chọn
      const maxScore = exerciseFormState.selectedQuestions.reduce(
        (total, questionId) => {
          return total + (exerciseFormState.questionScores[questionId] || 0);
        },
        0
      );

      // Bước 1: Tạo bài tập
      const exerciseData = {
        name: exerciseFormState.name,
        description: exerciseFormState.description,
        status: exerciseFormState.status,
        max_score: maxScore,
        time_limit: exerciseFormState.timeLimit,
        deadline: exerciseFormState.deadline,
        cover_image: exerciseFormState.coverImageUrl,
        lesson_id: 0, // Use 0 as default for no lesson
      };

      // Import createExercise function
      const { createExercise } = await import("@/lib/api/exercises");
      const createdExercise = await createExercise(exerciseData);

      // Bước 2: Liên kết câu hỏi với bài tập(nếu có câu hỏi được chọn)
      if (exerciseFormState.selectedQuestions.length > 0) {
        // Tạo object question_scores từ selectedQuestions và questionScores
        const questionScoresObj: Record<string, number> = {};
        exerciseFormState.selectedQuestions.forEach((id) => {
          questionScoresObj[id] = exerciseFormState.questionScores[id] || 0;
        });

        const relationData = {
          exam_id: null,
          homework_id: null,
          exercise_id: Number(createdExercise.id),
          lesson_plan_part_id: null,
          question_scores: questionScoresObj,
        };

        // Import CreateQuestionRelation function
        const { CreateQuestionRelation } = await import("@/lib/api/exams");
        await CreateQuestionRelation(relationData);
      }

      toast({
        title: t("success"),
        description: t("exerciseCreatedSuccess"),
      });

      // Tự động thêm exercise vào lesson
      const exerciseId = String(createdExercise.id);
      setForm((prev) => ({
        ...prev,
        exercise: [...prev.exercise, exerciseId],
      }));

      // Cập nhật selectedExercisesInfo với thông tin exercise mới
      setSelectedExercisesInfo((prev) => ({
        ...prev,
        [exerciseId]: {
          id: createdExercise.id,
          name: createdExercise.name,
          description: createdExercise.description,
          max_score: createdExercise.max_score,
          time_limit: createdExercise.time_limit,
          deadline: createdExercise.deadline,
          cover_image: createdExercise.cover_image,
        },
      }));

      // Đóng modal và reset form
      setShowCreateExercise(false);
      setExerciseFormState({
        name: "",
        description: "",
        status: 1,
        timeLimit: 60,
        deadline: undefined,
        deadlineTime: "23:59",
        coverImageUrl: "",
        selectedQuestions: [],
        selectedQuestionsData: [],
        questionScores: {},
      });

      return { success: true, data: createdExercise };
    } catch (error: any) {
      toast({
        title: t("error"),
        description: error.message || t("cannotCreateExercise"),
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  // Đóng modal homework khi đóng modal chính
  const handleCloseHomeworkModal = () => {
    setShowCreateHomework(false);
  };

  // Helper functions for HomeworkForm
  const handleQuestionToggle = (questionId: string, defaultPoints = 0) => {
    console.log("🔄 handleQuestionToggle called:", {
      questionId,
      defaultPoints,
    });
    const question = questions.find((q) => q.id.toString() === questionId);
    console.log("🔍 Found question:", question);

    setHomeworkFormState((prev) => {
      console.log("📝 Previous state:", prev);

      const newSelectedQuestions = prev.selectedQuestions.includes(questionId)
        ? prev.selectedQuestions.filter((id) => id !== questionId)
        : [...prev.selectedQuestions, questionId];

      const newQuestionScores = { ...prev.questionScores };
      if (newSelectedQuestions.includes(questionId)) {
        newQuestionScores[questionId] = defaultPoints;
      } else {
        delete newQuestionScores[questionId];
      }

      // Cập nhật selectedQuestionsData
      let newSelectedQuestionsData = [...prev.selectedQuestionsData];
      if (newSelectedQuestions.includes(questionId)) {
        // Thêm câu hỏi nếu chưa có
        if (
          question &&
          !newSelectedQuestionsData.find((q) => q.id.toString() === questionId)
        ) {
          newSelectedQuestionsData = [...newSelectedQuestionsData, question];
          console.log("➕ Added question to selectedQuestionsData:", question);
        }
      } else {
        // Xóa câu hỏi
        newSelectedQuestionsData = newSelectedQuestionsData.filter(
          (q) => q.id.toString() !== questionId
        );
        console.log(
          "➖ Removed question from selectedQuestionsData:",
          questionId
        );
      }

      const newState = {
        ...prev,
        selectedQuestions: newSelectedQuestions,
        selectedQuestionsData: newSelectedQuestionsData,
        questionScores: newQuestionScores,
      };

      console.log("📝 New state:", newState);
      return newState;
    });
  };

  const handleScoreChange = (questionId: string, score: number) => {
    setHomeworkFormState((prev) => ({
      ...prev,
      questionScores: {
        ...prev.questionScores,
        [questionId]: score,
      },
    }));
  };

  // Helper functions for ExamForm
  const handleExamQuestionToggle = (questionId: string, defaultPoints = 0) => {
    const question = examQuestions.find((q) => q.id.toString() === questionId);

    setExamFormState((prev) => {
      const newSelectedQuestions = prev.selectedQuestions.includes(questionId)
        ? prev.selectedQuestions.filter((id) => id !== questionId)
        : [...prev.selectedQuestions, questionId];

      const newQuestionScores = { ...prev.questionScores };
      if (newSelectedQuestions.includes(questionId)) {
        newQuestionScores[questionId] = defaultPoints;
      } else {
        delete newQuestionScores[questionId];
      }

      // Cập nhật selectedQuestionsData
      let newSelectedQuestionsData = [...prev.selectedQuestionsData];
      if (newSelectedQuestions.includes(questionId)) {
        // Thêm câu hỏi nếu chưa có
        if (
          question &&
          !newSelectedQuestionsData.find((q) => q.id.toString() === questionId)
        ) {
          newSelectedQuestionsData = [...newSelectedQuestionsData, question];
        }
      } else {
        // Xóa câu hỏi
        newSelectedQuestionsData = newSelectedQuestionsData.filter(
          (q) => q.id.toString() !== questionId
        );
      }

      const newState = {
        ...prev,
        selectedQuestions: newSelectedQuestions,
        selectedQuestionsData: newSelectedQuestionsData,
        questionScores: newQuestionScores,
      };
      return newState;
    });
  };

  const handleExamScoreChange = (questionId: string, score: number) => {
    setExamFormState((prev) => ({
      ...prev,
      questionScores: {
        ...prev.questionScores,
        [questionId]: score,
      },
    }));
  };

  // Helper functions for ExerciseForm
  const handleExerciseQuestionToggle = (
    questionId: string,
    defaultPoints = 0
  ) => {
    const question = exerciseQuestions.find(
      (q) => q.id.toString() === questionId
    );

    setExerciseFormState((prev) => {
      const newSelectedQuestions = prev.selectedQuestions.includes(questionId)
        ? prev.selectedQuestions.filter((id) => id !== questionId)
        : [...prev.selectedQuestions, questionId];

      const newQuestionScores = { ...prev.questionScores };
      if (newSelectedQuestions.includes(questionId)) {
        newQuestionScores[questionId] = defaultPoints;
      } else {
        delete newQuestionScores[questionId];
      }

      // Cập nhật selectedQuestionsData
      let newSelectedQuestionsData = [...prev.selectedQuestionsData];
      if (newSelectedQuestions.includes(questionId)) {
        // Thêm câu hỏi nếu chưa có
        if (
          question &&
          !newSelectedQuestionsData.find((q) => q.id.toString() === questionId)
        ) {
          newSelectedQuestionsData = [...newSelectedQuestionsData, question];
        }
      } else {
        // Xóa câu hỏi
        newSelectedQuestionsData = newSelectedQuestionsData.filter(
          (q) => q.id.toString() !== questionId
        );
      }

      const newState = {
        ...prev,
        selectedQuestions: newSelectedQuestions,
        selectedQuestionsData: newSelectedQuestionsData,
        questionScores: newQuestionScores,
      };
      return newState;
    });
  };

  const handleExerciseScoreChange = (questionId: string, score: number) => {
    setExerciseFormState((prev) => ({
      ...prev,
      questionScores: {
        ...prev.questionScores,
        [questionId]: score,
      },
    }));
  };

  // Helper functions
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

  const getSelectedQuestionsList = () => {
    return homeworkFormState.selectedQuestionsData;
  };

  const getExamSelectedQuestionsList = () => {
    return examFormState.selectedQuestionsData;
  };

  const getExerciseSelectedQuestionsList = () => {
    return exerciseFormState.selectedQuestionsData;
  };

  // API function để load questions cho HomeworkForm
  const loadQuestions = async (search?: string, page = 1) => {
    try {
      setQuestionLoading(true);
      // Gọi API getQuestions từ thư viện
      const response = await getQuestions({
        page: page,
        per_page: questionFilters.limit,
        keyword: search || undefined,
        question_type:
          questionFilters.type !== "all" ? questionFilters.type : undefined,
        sort_created_at: "newest",
      });

      if (response && Array.isArray(response.questions)) {
        if (page === 1) {
          setQuestions(response.questions);
        } else {
          setQuestions((prev) => [...prev, ...response.questions]);
        }

        // Cập nhật hasMore dựa trên số lượng câu hỏi trả về
        setHasMoreQuestions(
          response.questions.length === questionFilters.limit
        );
      } else {
        setQuestionError("Failed to fetch questions: Invalid response format");
      }

      setQuestionError(null);
    } catch (error: any) {
      console.error("Error loading questions:", error);
      setQuestionError(error.message || t("cannotLoadQuestions"));
    } finally {
      setQuestionLoading(false);
    }
  };

  // API function để load questions cho ExerciseForm
  const loadExerciseQuestions = async (search?: string, page = 1) => {
    try {
      setExerciseQuestionLoading(true);
      // Gọi API getQuestions từ thư viện
      const response = await getQuestions({
        page: page,
        per_page: exerciseQuestionFilters.limit,
        keyword: search || undefined,
        question_type:
          exerciseQuestionFilters.type !== "all"
            ? exerciseQuestionFilters.type
            : undefined,
        sort_created_at: "newest",
      });

      if (response && Array.isArray(response.questions)) {
        if (page === 1) {
          setExerciseQuestions(response.questions);
        } else {
          setExerciseQuestions((prev) => [...prev, ...response.questions]);
        }

        // Cập nhật hasMore dựa trên số lượng câu hỏi trả về
        setExerciseHasMoreQuestions(
          response.questions.length === exerciseQuestionFilters.limit
        );
      } else {
        setExerciseQuestionError(
          "Failed to fetch questions: Invalid response format"
        );
      }

      setExerciseQuestionError(null);
    } catch (error: any) {
      console.error("Error loading exercise questions:", error);
      setExerciseQuestionError(error.message || t("cannotLoadQuestions"));
    } finally {
      setExerciseQuestionLoading(false);
    }
  };

  // API function để load questions cho ExamForm
  const loadExamQuestions = async (search?: string, page = 1) => {
    try {
      setExamQuestionLoading(true);
      // Gọi API getQuestions từ thư viện
      const response = await getQuestions({
        page: page,
        per_page: examQuestionFilters.limit,
        keyword: search || undefined,
        question_type:
          examQuestionFilters.type !== "all"
            ? examQuestionFilters.type
            : undefined,
        sort_created_at: "newest",
      });

      if (response && Array.isArray(response.questions)) {
        if (page === 1) {
          setExamQuestions(response.questions);
        } else {
          setExamQuestions((prev) => [...prev, ...response.questions]);
        }

        // Cập nhật hasMore dựa trên số lượng câu hỏi trả về
        setExamHasMoreQuestions(
          response.questions.length === examQuestionFilters.limit
        );
      } else {
        setExamQuestionError(
          "Failed to fetch questions: Invalid response format"
        );
      }

      setExamQuestionError(null);
    } catch (error: any) {
      console.error("Error loading exam questions:", error);
      setExamQuestionError(error.message || t("cannotLoadQuestions"));
    } finally {
      setExamQuestionLoading(false);
    }
  };

  // API functions
  const loadHomeworks = async (search?: string, page = 1) => {
    try {
      setHomeworksLoading(true);
      const response = await GetHomeworkList({
        keyword: search,
        page,
        limit: 10,
      });
      if (page === 1) {
        setHomeworksData(response);
      } else {
        setHomeworksData((prev: any) => ({
          ...response,
          homeworks: [
            ...(prev?.homeworks || []),
            ...(response?.homeworks || []),
          ],
        }));
      }

      // Cập nhật temp list nếu có item trùng với danh sách chính
      if (openHomeworkPopup && response?.homeworks) {
        const newTempInfo: { [key: string]: any } = {};
        response.homeworks.forEach((homework: any) => {
          const idStr = String(homework.id);
          // Nếu homework này có trong danh sách chính, thêm vào temp
          if (form.homework.includes(idStr)) {
            newTempInfo[idStr] = homework;
          }
        });

        // Merge với temp info hiện tại
        setTempSelectedHomeworksInfo((prev) => ({
          ...prev,
          ...newTempInfo,
        }));
      }

      setHomeworksPagination({
        currentPage: response?.page || 1,
        totalPages: response?.totalPages || 1,
        totalItems: response?.homeworks?.length || 0,
        hasNextPage: (response?.page || 1) < (response?.totalPages || 1),
        hasPrevPage: (response?.page || 1) > 1,
      });
    } catch (error) {
      console.error("Error loading homeworks:", error);
    } finally {
      setHomeworksLoading(false);
    }
  };

  const loadAssessment = async (search?: string, page = 1) => {
    try {
      setAssessmentLoading(true);
      const response = await GetAssessmentList({
        keyword: search,
        page,
        limit: 10,
      });
      if (page === 1) {
        setAssessmentData(response);
      } else {
        setAssessmentData((prev: any) => ({
          ...response,
          assessment: [
            ...(prev?.assessment || []),
            ...(response?.assessment || []),
          ],
        }));
      }

      // Cập nhật temp list nếu có item trùng với danh sách chính
      if (openAssessmentPopup && response?.assessment) {
        const newTempInfo: { [key: string]: any } = {};
        response.assessment.forEach((assessment: any) => {
          const idStr = String(assessment.id);
          // Nếu assessment này có trong danh sách chính, thêm vào temp
          if (form.assessment.includes(idStr)) {
            newTempInfo[idStr] = assessment;
          }
        });

        // Merge với temp info hiện tại
        setTempSelectedAssessmentInfo((prev) => ({
          ...prev,
          ...newTempInfo,
        }));
      }

      setAssessmentPagination({
        currentPage: response?.page || 1,
        totalPages: response?.totalPages || 1,
        totalItems: response?.assessment?.length || 0,
        hasNextPage: (response?.page || 1) < (response?.totalPages || 1),
        hasPrevPage: (response?.page || 1) > 1,
      });
    } catch (error) {
      console.error("Error loading assessment:", error);
    } finally {
      setAssessmentLoading(false);
    }
  };

  const loadVocabularies = async (search?: string, page = 1) => {
    console.log("📚 Loading vocabularies...", { search, page });
    try {
      setVocabulariesLoading(true);
      const response = await axiosInstance.get(
        "/manage/flashcard/vocabularies",
        {
          params: {
            keyword: search,
            page,
            limit: 10,
          },
        }
      );

      console.log("📚 Vocabularies API response:", response.data);
      const vocabulariesResponse = response.data;

      // Parse response structure: response.data.data.vocabularies
      const vocabulariesData = vocabulariesResponse.data || {};
      const vocabularies = vocabulariesData.vocabularies || [];

      if (page === 1) {
        setVocabulariesData(vocabulariesData);
      } else {
        setVocabulariesData((prev: any) => ({
          ...vocabulariesData,
          vocabularies: [...(prev?.vocabularies || []), ...vocabularies],
        }));
      }
      if (openVocabularyPopup && vocabularies.length > 0) {
        const newTempInfo: { [key: string]: any } = {};
        vocabularies.forEach((vocab: any) => {
          const idStr = String(vocab.id);
          // Nếu vocabulary này có trong danh sách chính, thêm vào temp
          if (form.vocabularies.includes(idStr)) {
            newTempInfo[idStr] = vocab;
          }
        });
        setTempSelectedVocabulariesInfo((prev) => ({
          ...prev,
          ...newTempInfo,
        }));
      }
      // Get pagination from response.data.data.pagination
      const pagination = vocabulariesData.pagination || {};

      setVocabulariesPagination({
        currentPage: pagination.page || 1,
        totalPages: pagination.total_pages || 1,
        totalItems: pagination.total || 0,
        hasNextPage: (pagination.page || 1) < (pagination.total_pages || 1),
        hasPrevPage: (pagination.page || 1) > 1,
      });
    } catch (error) {
      console.error("Error loading vocabularies:", error);
    } finally {
      setVocabulariesLoading(false);
    }
  };

  const loadExercises = async (search?: string, page = 1) => {
    try {
      setExercisesLoading(true);
      const res = await getExercisesList({
        keyword: search,
        page,
        limit: 10,
      });
      const response = res;
      if (page === 1) {
        setExercisesData(response);
      } else {
        setExercisesData((prev: any) => ({
          ...response,
          exercises: [
            ...(prev?.exercises || []),
            ...(response?.exercises || []),
          ],
        }));
      }

      // Cập nhật temp list nếu có item trùng với danh sách chính
      if (openExercisePopup && response?.exercises) {
        const newTempInfo: { [key: string]: any } = {};
        response.exercises.forEach((exercise: any) => {
          const idStr = String(exercise.id);
          // Nếu exercise này có trong danh sách chính, thêm vào temp
          if (form.exercise.includes(idStr)) {
            newTempInfo[idStr] = exercise;
          }
        });
        // Merge với temp info hiện tại
        setTempSelectedExercisesInfo((prev) => ({
          ...prev,
          ...newTempInfo,
        }));
      }
      setExercisesPagination({
        currentPage: response?.page || 1,
        totalPages: response?.totalPages || 1,
        totalItems: response?.exercises?.length || 0,
        hasNextPage: (response?.page || 1) < (response?.totalPages || 1),
        hasPrevPage: (response?.page || 1) > 1,
      });
    } catch (error) {
      console.error("Error loading exercises:", error);
    } finally {
      setExercisesLoading(false);
    }
  };

  const loadExams = async (search?: string, page = 1) => {
    try {
      setExamsLoading(true);
      const response = await GetExamList({ keyword: search, page, limit: 10 });
      if (page === 1) {
        setExamsData(response);
      } else {
        setExamsData((prev: any) => ({
          ...response,
          exams: [...(prev?.exams || []), ...(response?.exams || [])],
        }));
      }

      // Cập nhật temp list nếu có item trùng với danh sách chính
      if (openExamPopup && response?.exams) {
        const newTempInfo: { [key: string]: any } = {};
        response.exams.forEach((exam: any) => {
          const idStr = String(exam.id);
          // Nếu exam này có trong danh sách chính, thêm vào temp
          if (form.test.includes(idStr)) {
            newTempInfo[idStr] = exam;
          }
        });

        // Merge với temp info hiện tại
        setTempSelectedExamsInfo((prev) => ({
          ...prev,
          ...newTempInfo,
        }));
      }

      setExamsPagination({
        currentPage: response?.page || 1,
        totalPages: response?.totalPages || 1,
        totalItems: response?.exams?.length || 0,
        hasNextPage: (response?.page || 1) < (response?.totalPages || 1),
        hasPrevPage: (response?.page || 1) > 1,
      });
    } catch (error) {
      console.error("Error loading exams:", error);
    } finally {
      setExamsLoading(false);
    }
  };

  const loadLessonPlans = async (search?: string, page = 1) => {
    try {
      setLessonPlansLoading(true);
      const response = await getLessonPlans({
        keyword: search,
        page,
        limit: 10,
      });
      if (page === 1) {
        setLessonPlansData(response);
      } else {
        setLessonPlansData((prev: any) => ({
          ...response,
          lessonPlans: [
            ...(prev?.lessonPlans || []),
            ...(response?.lessonPlans || []),
          ],
        }));
      }
      setLessonPlansPagination({
        currentPage: response?.page || 1,
        totalPages: response?.totalPages || 1,
        totalItems: response?.lessonPlans?.length || 0,
        hasNextPage: (response?.page || 1) < (response?.totalPages || 1),
        hasPrevPage: (response?.page || 1) > 1,
      });
    } catch (error) {
      console.error("Error loading lesson plans:", error);
    } finally {
      setLessonPlansLoading(false);
    }
  };

  const loadMoreHomeworks = () => {
    if (homeworksPagination.hasNextPage && !homeworksLoading) {
      loadHomeworks(
        debouncedHomeworkSearch,
        homeworksPagination.currentPage + 1
      );
    }
  };

  const loadMoreAssessment = () => {
    if (assessmentPagination.hasNextPage && !assessmentLoading) {
      loadAssessment(
        debouncedAssessmentSearch,
        assessmentPagination.currentPage + 1
      );
    }
  };

  const loadMoreExams = () => {
    if (examsPagination.hasNextPage && !examsLoading) {
      loadExams(debouncedExamSearch, examsPagination.currentPage + 1);
    }
  };

  const loadMoreExercises = () => {
    if (exercisesPagination.hasNextPage && !exercisesLoading) {
      loadExercises(
        debouncedExerciseSearch,
        exercisesPagination.currentPage + 1
      );
    }
  };

  const loadMoreLessonPlans = () => {
    if (lessonPlansPagination.hasNextPage && !lessonPlansLoading) {
      loadLessonPlans(
        debouncedLectureSearch,
        lessonPlansPagination.currentPage + 1
      );
    }
  };

  // Load initial data for edit mode
  useEffect(() => {
    if (mode === "edit" && lessonId) {
      const fetchLessonDetail = async () => {
        try {
          setInitializing(true);
          const response = await GetLessonDetail(
            lessonId,
            courseId || undefined
          );
          const lesson = response?.data || response;

          setOriginalLessonData(lesson);
          setForm({
            title: lesson.title || "",
            description: lesson.description || "",
            topic: lesson.topics?.[0]?.id ? String(lesson.topics[0].id) : "",
            tags: lesson.tags?.map((tag: any) => tag.name) || [],
            lesson_dependency: "",
            skills: lesson.skills?.map((skill: any) => skill.name) || [],
            lecture: lesson.lesson_plans?.[0]?.id
              ? String(lesson.lesson_plans[0].id)
              : "",
            homework: lesson.homeworks?.map((hw: any) => String(hw.id)) || [],
            test: lesson.exams?.map((exam: any) => String(exam.id)) || [],
            vocabularies:
              lesson.vocabularies?.map((vocab: any) => String(vocab.id)) || [],
            exercise:
              lesson.exercises?.map((exercise: any) => String(exercise.id)) ||
              [],
            assessment:
              lesson.assessment?.map((assessment: any) =>
                String(assessment.id)
              ) || [],
          });

          // Set selected info
          if (lesson.lesson_plans?.[0]) {
            setSelectedLectureInfo(lesson.lesson_plans[0]);
          }

          const hwInfo: { [key: string]: any } = {};
          lesson.homeworks?.forEach((hw: any) => {
            hwInfo[String(hw.id)] = hw;
          });
          setSelectedHomeworksInfo(hwInfo);

          const assessmentInfo: { [key: string]: any } = {};
          lesson.assessment?.forEach((assessment: any) => {
            assessmentInfo[String(assessment.id)] = assessment;
          });
          setSelectedAssessmentInfo(assessmentInfo);

          const examInfo: { [key: string]: any } = {};
          lesson.exams?.forEach((exam: any) => {
            examInfo[String(exam.id)] = exam;
          });
          setSelectedExamsInfo(examInfo);

          const vocabInfo: { [key: string]: any } = {};
          lesson.vocabularies?.forEach((vocab: any) => {
            vocabInfo[String(vocab.id)] = vocab;
          });
          setSelectedVocabulariesInfo(vocabInfo);

          const exerciseInfo: { [key: string]: any } = {};
          lesson.exercises?.forEach((exercise: any) => {
            exerciseInfo[String(exercise.id)] = exercise;
          });
          setSelectedExercisesInfo(exerciseInfo);
        } catch (error) {
          console.error("Error fetching lesson detail:", error);
          toast({
            title: t("error"),
            description: t("cannotLoadLessonInfo"),
            variant: "destructive",
          });
        } finally {
          setInitializing(false);
        }
      };

      fetchLessonDetail();
    }
  }, [mode, lessonId, courseId, toast]);

  //Assessment
  useEffect(() => {
    if (openAssessmentPopup && !assessmentData) {
      loadAssessment(debouncedAssessmentSearch);
    }
  }, [openAssessmentPopup]);

  //Homework
  // Load data when popups open
  useEffect(() => {
    if (openHomeworkPopup && !homeworksData) {
      loadHomeworks(debouncedHomeworkSearch);
    }
  }, [openHomeworkPopup]);

  useEffect(() => {
    if (openVocabularyPopup) {
      loadVocabularies(debouncedVocabularySearch);
    }
  }, [openVocabularyPopup]);

  // Load questions when question bank opens
  useEffect(() => {
    if (questionBankOpen) {
      loadQuestions(questionFilters.search, 1);
    } else {
      setQuestions([]);
      setQuestionFilters((prev) => ({ ...prev, page: 1 }));
    }
  }, [questionBankOpen]);

  //Exercise
  useEffect(() => {
    if (exerciseQuestionBankOpen) {
      loadExerciseQuestions(exerciseQuestionFilters.search, 1);
    } else {
      setExerciseQuestions([]);
      setExerciseQuestionFilters((prev) => ({ ...prev, page: 1 }));
    }
  }, [exerciseQuestionBankOpen]);

  useEffect(() => {
    if (openExercisePopup && !exercisesData) {
      loadExercises(debouncedExerciseSearch);
    }
  }, [openExercisePopup]);

  //Exam
  // Load exam questions when exam question bank opens
  useEffect(() => {
    if (examQuestionBankOpen) {
      loadExamQuestions(examQuestionFilters.search, 1);
    } else {
      setExamQuestions([]);
      setExamQuestionFilters((prev) => ({ ...prev, page: 1 }));
    }
  }, [examQuestionBankOpen]);

  useEffect(() => {
    if (openExamPopup && !examsData) {
      loadExams(debouncedExamSearch);
    }
  }, [openExamPopup]);

  //Lecture
  useEffect(() => {
    if (openLecturePopup && !lessonPlansData) {
      loadLessonPlans(debouncedLectureSearch);
    }
  }, [openLecturePopup]);

  // Load data when search changes (debounced)
  useEffect(() => {
    if (openAssessmentPopup) {
      loadAssessment(debouncedAssessmentSearch);
    }
  }, [debouncedAssessmentSearch]);

  // Load assessment subjects when create assessment dialog opens
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!showCreateAssessment) return;
      try {
        setAssessmentSubjectsLoading(true);
        const response = await GetSubjectsList();
        const subjectList =
          response?.data?.subjects || response?.subjects || [];
        const mapped =
          subjectList?.map((subject: any) => ({
            id: String(subject.id),
            name: subject.name,
          })) || [];
        setAssessmentSubjects(mapped);
      } catch (error: any) {
        console.error("Error fetching subjects:", error);
        toast({
          title: t("error"),
          description: "Không thể tải danh sách môn học",
          variant: "destructive",
        });
      } finally {
        setAssessmentSubjectsLoading(false);
      }
    };

    fetchSubjects();
  }, [showCreateAssessment, toast, t]);

  // Load data when search changes (debounced)
  useEffect(() => {
    if (openHomeworkPopup) {
      loadHomeworks(debouncedHomeworkSearch);
    }
  }, [debouncedHomeworkSearch]);

  // Auto search for vocabulary when search term changes
  useEffect(() => {
    if (openVocabularyPopup) {
      loadVocabularies(debouncedVocabularySearch);
    }
  }, [debouncedVocabularySearch]);

  // Handle homework creation success
  useEffect(() => {
    // Khi homework được tạo thành công, HomeworkForm sẽ cập nhật state
    if (homeworkFormState.name && homeworkFormState.description) {
    }
  }, [homeworkFormState]);

  // Debug: Log homeworkFormState changes
  useEffect(() => { }, [homeworkFormState]);

  // Load questions when filters change
  useEffect(() => {
    if (questionBankOpen) {
      loadQuestions(questionFilters.search, 1);
    }
  }, [questionFilters.search, questionFilters.type]);

  // Load exam questions when exam filters change
  useEffect(() => {
    if (examQuestionBankOpen) {
      loadExamQuestions(examQuestionFilters.search, 1);
    }
  }, [examQuestionFilters.search, examQuestionFilters.type]);

  // Load exercise questions when exercise filters change
  useEffect(() => {
    if (exerciseQuestionBankOpen) {
      loadExerciseQuestions(exerciseQuestionFilters.search, 1);
    }
  }, [exerciseQuestionFilters.search, exerciseQuestionFilters.type]);

  useEffect(() => {
    if (openExamPopup) {
      loadExams(debouncedExamSearch);
    }
  }, [debouncedExamSearch]);

  useEffect(() => {
    if (openExercisePopup) {
      loadExercises(debouncedExerciseSearch);
    }
  }, [debouncedExerciseSearch]);

  useEffect(() => {
    if (openLecturePopup) {
      loadLessonPlans(debouncedLectureSearch);
    }
  }, [debouncedLectureSearch]);

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      alert(t("enterTitleAndDescription"));
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const selectedTopic = topicsList.find((t) => String(t.id) === form.topic);
      let topicsField: { id: number; name: string }[] = [];
      if (selectedTopic) {
        topicsField = [
          { id: Number(selectedTopic.id), name: selectedTopic.name },
        ];
      } else if (form.topic) {
        topicsField = [{ id: Number(form.topic), name: form.topic }];
      }

      const data = {
        title: form.title,
        description: form.description,
        status: true,
        chapter: chapterId
          ? { id: Number(chapterId), title: "" }
          : originalLessonData
            ? originalLessonData.chapter
            : undefined,
        dependencies: undefined,
        tags: form.tags.map((name, idx) => ({ id: idx + 1, name })),
        topics: topicsField,
        skills: form.skills.map((name, idx) => ({ id: idx + 1, name })),
        lesson_plans: form.lecture ? [{ id: form.lecture }] : [],
        exams: Array.isArray(form.test)
          ? form.test.map((id) => ({
            id: Number(id),
            name: selectedExamsInfo[id]?.name || `Bài kiểm tra #${id}`,
          }))
          : [],
        homeworks: Array.isArray(form.homework)
          ? form.homework.map((id) => ({
            id: Number(id),
            name: selectedHomeworksInfo[id]?.name || `Bài tập về nhà #${id}`,
          }))
          : [],
        assessment: Array.isArray(form.assessment)
          ? form.assessment.map((id) => ({
            id: Number(id),
            name:
              selectedAssessmentInfo[id]?.name ||
              `Bài kiểm tra đánh giá #${id}`,
          }))
          : [],
        exercises: Array.isArray(form.exercise)
          ? form.exercise.map((id) => ({
            id: Number(id),
            name: selectedExercisesInfo[id]?.name || `Bài luyện tập #${id}`,
          }))
          : [],
        vocabularies: Array.isArray(form.vocabularies)
          ? form.vocabularies.map((id) => ({
            id: Number(id),
            name: selectedVocabulariesInfo[id]?.name || `Từ vựng #${id}`,
          }))
          : [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      let result;
      const savedLessonId =
        mode === "create" ? null : lessonId;
      const vocabularyIds = (form.vocabularies || [])
        .map((id) => Number(id))
        .filter((id) => !Number.isNaN(id) && id > 0);

      if (mode === "create") {
        result = await CreateLesson(data);

        const newLessonId =
          result?.data?.id ?? result?.id ?? result?.data?.data?.id;
        if (newLessonId && vocabularyIds.length > 0) {
          await syncLessonVocabularies(newLessonId, vocabularyIds);
        }

        // Alert thông báo thành công với đa ngôn ngữ
        alert(t("lessonCreatedSuccess"));

        // toast({
        //   title: t("success"),
        //   description: t("lessonCreatedSuccess"),
        // });
        // Reset form for create mode
        setForm({
          title: "",
          description: "",
          topic: "",
          tags: [],
          lesson_dependency: "",
          skills: [],
          lecture: "",
          exercise: [],
          test: [],
          vocabularies: [],
          homework: [],
          assessment: [],
        });
        setSelectedLectureInfo(null);
        setSelectedHomeworksInfo({});
        setSelectedAssessmentInfo({});
        setSelectedExamsInfo({});
        setSelectedVocabulariesInfo({});
        setSelectedExercisesInfo({});
      } else {
        result = await UpdateLesson(lessonId!, data);

        if (savedLessonId) {
          await syncLessonVocabularies(savedLessonId, vocabularyIds);
        }

        // Alert thông báo cập nhật thành công với đa ngôn ngữ
        alert(t("lessonUpdatedSuccess"));

        // toast({
        //   title: t("success"),
        //   description: t("lessonUpdatedSuccess"),
        // });
      }

      setSuccess(true);
      if (onSuccess) onSuccess(result);
    } catch (err: any) {
      const errorMessage = err?.message || t("errorOccurred");
      setError(errorMessage);

      // Alert thông báo lỗi với đa ngôn ngữ
      alert(errorMessage);

      // toast({
      //   title: t("error"),
      //   description: errorMessage,
      //   variant: "destructive",
      // });
    } finally {
      setLoading(false);
    }
  };

  if (mode === "edit" && initializing) {
    return (
      <div className="min-h-screen bg-gray-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto mb-4">
            <svg
              className="animate-spin h-10 w-10"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
          <p className="text-gray-600">{t("loadingData")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={hideSidebar ? "p-6" : "min-h-screen"}>
      {/* Floating Save/Cancel Buttons */}
      {!hideSidebar && (
        <div className="fixed top-20 right-8 z-10 flex gap-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              className="rounded-2xl border-gray-200 hover:border-gray-300 shadow-md"
              onClick={onCancel}
              disabled={loading}
            >
              {t("cancel")}
            </Button>
          )}
          <Button
            type="button"
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl px-8 shadow-md"
            onClick={() => {
              handleSubmit();
            }}
            disabled={loading}
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                {mode === "create" ? t("creating") : t("updating")}
              </>
            ) : mode === "create" ? (
              t("createLesson")
            ) : (
              t("updateLesson")
            )}
          </Button>
        </div>
      )}
      <div className={hideSidebar ? "" : "container mx-auto px-2 sm:px-6 py-8"}>
        <Button
          variant="ghost"
          size="sm"
          onClick={router.back}
          className="w-fit mt-6 text-gray-600 hover:text-gray-800 font-semibold justify-start"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t("back")}
        </Button>
        {!hideSidebar && (
          <div className="mb-12">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                {mode === "create" ? t("createNewLesson") : t("editLesson")}
              </h1>
              <p className="text-gray-500 font-medium">
                {mode === "create"
                  ? t("createLessonDescription")
                  : t("updateLessonDescription")}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Thông tin cơ bản */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden h-full">
              <div className="p-6 sm:p-8">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {t("basicInfo")}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {t("basicInfoDescription")}
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t("lessonTitle")} <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={form.title}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, title: e.target.value }))
                      }
                      placeholder={t("enterLessonTitle")}
                      className="w-full rounded-2xl border-gray-200 focus:border-emerald-300 focus:ring-emerald-200 transition-all duration-200"
                      readOnly={mode === "edit" && Boolean(courseId)}
                      disabled={mode === "edit" && Boolean(courseId)}
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t("description")} <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      value={form.description}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, description: e.target.value }))
                      }
                      placeholder={t("enterDescription")}
                      className="w-full rounded-2xl border-gray-200 focus:border-emerald-300 focus:ring-emerald-200 min-h-[120px] transition-all duration-200"
                      readOnly={mode === "edit" && Boolean(courseId)}
                      disabled={mode === "edit" && Boolean(courseId)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Nội dung bài học */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden h-full">
              <div className="p-6 sm:p-8">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {t("lessonContent")}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {t("lessonContentDescription")}
                  </p>
                </div>

                <div className="space-y-8">
                  {/* Lecture Section */}
                  <div className="bg-white rounded-2xl p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {t("lecture")}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {t("selectLectureForLesson")}
                        </p>
                      </div>
                      {!courseId && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 rounded-xl"
                          onClick={() => setOpenLecturePopup(true)}
                        >
                          {t("addFromLibrary")}
                        </Button>
                      )}
                    </div>
                    <div className="space-y-3 mb-2">
                      {form.lecture ? (
                        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-4 flex-wrap">
                          <div className="flex flex-wrap items-center gap-3 flex-wrap">
                            <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center">
                              <svg
                                className="h-4 w-4 text-gray-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                />
                              </svg>
                            </div>
                            <div>
                              <span className="font-medium text-emerald-700">
                                {selectedLectureInfo?.name ||
                                  `Bài giảng #${form.lecture}`}
                              </span>
                              {selectedLectureInfo?.description && (
                                <p className="text-sm text-gray-500 mt-1">
                                  {selectedLectureInfo.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-2 w-full md:w-auto">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300 rounded-xl px-3 py-1 w-full"
                              onClick={() =>
                                window.open(
                                  `/${locale}/manage/lecture-bank/edit/${form.lecture
                                  }${courseId ? `?course_id=${courseId}` : ""}`,
                                  "_blank"
                                )
                              }
                            >
                              {t("edit")}
                            </Button>
                            {!courseId && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-gray-400 hover:text-gray-600"
                                onClick={() => {
                                  setForm((f) => ({ ...f, lecture: "" }));
                                  setSelectedLectureInfo(null);
                                }}
                                aria-label={t("removeLecture")}
                              >
                                ×
                              </Button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-500 text-sm italic bg-gray-50 rounded-xl p-3 text-center">
                          {t("noLectureSelected")}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Homework Section */}
                  <div className="bg-white rounded-2xl p-6 border border-gray-200 mb-6">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {t("homeworks")}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {t("selectHomeworksForLesson")}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-green-600 border-green-200 hover:bg-green-50 hover:border-green-300 rounded-xl"
                        onClick={() => setOpenHomeworkPopup(true)}
                      >
                        {t("addFromLibrary")}
                      </Button>
                    </div>
                    <div className="space-y-3 mb-2">
                      {(() => {
                        return null;
                      })()}
                      {form.homework.length === 0 ? (
                        <div className="text-gray-500 text-sm italic bg-gray-50 rounded-xl p-3 text-center">
                          {t("noHomeworksSelected")}
                        </div>
                      ) : (
                        [...form.homework]
                          .sort((a, b) => Number(a) - Number(b))
                          .map((id, idx) => {
                            const homeworkInfo = selectedHomeworksInfo[id];
                            return (
                              <div
                                key={id}
                                className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-4 flex-wrap gap-2"
                              >
                                <div className="flex flex-wrap items-center gap-3 flex-wrap">
                                  <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <svg
                                      className="h-4 w-4 text-gray-500"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                      />
                                    </svg>
                                  </div>
                                  <div>
                                    <span className="font-medium text-green-700">
                                      {homeworkInfo?.name ||
                                        originalLessonData?.homeworks?.find(
                                          (h: any) => String(h.id) === id
                                        )?.name ||
                                        `Bài luyện tập #${id}`}
                                    </span>
                                    {homeworkInfo?.description && (
                                      <div className="text-xs text-gray-500 mt-1">
                                        {homeworkInfo.description}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {(() => {
                                  const isProgram = Boolean(
                                    homeworkInfo?.is_program ??
                                    originalLessonData?.homeworks?.find(
                                      (h: any) => String(h.id) === id
                                    )?.is_program
                                  );
                                  if (
                                    mode === "edit" &&
                                    Boolean(courseId) &&
                                    isProgram
                                  )
                                    return null;
                                  return (
                                    <div className="flex items-center gap-2 mt-2 w-full md:w-auto">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300 rounded-xl px-3 py-1 w-full"
                                        onClick={() =>
                                          window.open(
                                            `/${locale}/manage/assignments/edit-homework/${id}${courseId
                                              ? `?course_id=${courseId}`
                                              : ""
                                            }`,
                                            "_blank"
                                          )
                                        }
                                      >
                                        {t("edit")}
                                      </Button>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="text-gray-400 hover:text-gray-600"
                                        onClick={() => {
                                          setSelectedHomeworksInfo((prev) => {
                                            const newInfo = { ...prev };
                                            delete newInfo[id];
                                            return newInfo;
                                          });
                                          setForm((f) => ({
                                            ...f,
                                            homework: f.homework.filter(
                                              (homeworkId) => homeworkId !== id
                                            ),
                                          }));
                                        }}
                                        aria-label={t("removeExercise")}
                                      >
                                        ×
                                      </Button>
                                    </div>
                                  );
                                })()}
                              </div>
                            );
                          })
                      )}
                    </div>
                  </div>

                  {/* Assessment Section */}
                  {user?.type === "admin" && (
                    <div className="bg-white rounded-2xl p-6 border border-gray-200 mb-6">
                      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {t("assessment")}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {t("selectAssessmentForLesson")}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-green-600 border-green-200 hover:bg-green-50 hover:border-green-300 rounded-xl"
                          onClick={() => setOpenAssessmentPopup(true)}
                        >
                          {t("addFromLibrary")}
                        </Button>
                      </div>
                      <div className="space-y-3 mb-2">
                        {(() => {
                          return null;
                        })()}
                        {form.assessment.length === 0 ? (
                          <div className="text-gray-500 text-sm italic bg-gray-50 rounded-xl p-3 text-center">
                            {t("noAssessmentSelected")}
                          </div>
                        ) : (
                          [...form.assessment]
                            .sort((a, b) => Number(a) - Number(b))
                            .map((id, idx) => {
                              const assessmentInfo = selectedAssessmentInfo[id];
                              return (
                                <div
                                  key={id}
                                  className="flex flex-wrap gap-2 items-center justify-between bg-white border border-gray-200 rounded-2xl p-4"
                                >
                                  <div className="flex flex-wrap items-center gap-3">
                                    <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center">
                                      <svg
                                        className="h-4 w-4 text-gray-500"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        />
                                      </svg>
                                    </div>
                                    <div>
                                      <span className="font-medium text-green-700">
                                        {assessmentInfo?.name ||
                                          originalLessonData?.homeworks?.find(
                                            (h: any) => String(h.id) === id
                                          )?.name ||
                                          `Bài luyện tập #${id}`}
                                      </span>
                                      {assessmentInfo?.description && (
                                        <div className="text-xs text-gray-500 mt-1">
                                          {assessmentInfo.description}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  {(() => {
                                    const isProgram = Boolean(
                                      assessmentInfo?.is_program ??
                                      originalLessonData?.assessment?.find(
                                        (e: any) => String(e.id) === id
                                      )?.is_program
                                    );
                                    if (
                                      mode === "edit" &&
                                      Boolean(courseId) &&
                                      isProgram
                                    )
                                      return null;
                                    return (
                                      <div className="flex items-center gap-2 w-full">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300 rounded-xl px-3 py-1 w-full"
                                          onClick={() =>
                                            window.open(
                                              `/${locale}/manage/assignments/edit-assessment/${id}${courseId
                                                ? `?course_id=${courseId}`
                                                : ""
                                              }`,
                                              "_blank"
                                            )
                                          }
                                        >
                                          {t("edit")}
                                        </Button>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="text-gray-400 hover:text-gray-600"
                                          onClick={() => {
                                            setSelectedAssessmentInfo(
                                              (prev) => {
                                                const newInfo = { ...prev };
                                                delete newInfo[id];
                                                return newInfo;
                                              }
                                            );
                                            setForm((f) => ({
                                              ...f,
                                              assessment: f.assessment.filter(
                                                (assessmentId) =>
                                                  assessmentId !== id
                                              ),
                                            }));
                                          }}
                                          aria-label={t("removeAssessment")}
                                        >
                                          ×
                                        </Button>
                                      </div>
                                    );
                                  })()}
                                </div>
                              );
                            })
                        )}
                      </div>
                    </div>
                  )}

                  {/* Exercise Section */}
                  {user?.type === "admin" && (
                    <div className="bg-white rounded-2xl p-6 border border-gray-200 mb-6">
                      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {t("exercises")}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {t("selectExercisesForLesson")}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-green-600 border-green-200 hover:bg-green-50 hover:border-green-300 rounded-xl"
                          onClick={() => setOpenExercisePopup(true)}
                        >
                          {t("addFromLibrary")}
                        </Button>
                      </div>
                      <div className="space-y-3 mb-2">
                        {(() => {
                          return null;
                        })()}
                        {form.exercise.length === 0 ? (
                          <div className="text-gray-500 text-sm italic bg-gray-50 rounded-xl p-3 text-center">
                            {t("noExercisesSelected")}
                          </div>
                        ) : (
                          [...form.exercise]
                            .sort((a, b) => Number(a) - Number(b))
                            .map((id, idx) => {
                              const exerciseInfo = selectedExercisesInfo[id];
                              return (
                                <div
                                  key={id}
                                  className="flex flex-wrap gap-2 items-center justify-between bg-white border border-gray-200 rounded-2xl p-4"
                                >
                                  <div className="flex flex-wrap items-center gap-3">
                                    <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center">
                                      <svg
                                        className="h-4 w-4 text-gray-500"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        />
                                      </svg>
                                    </div>
                                    <div>
                                      <span className="font-medium text-green-700">
                                        {exerciseInfo?.name ||
                                          originalLessonData?.homeworks?.find(
                                            (h: any) => String(h.id) === id
                                          )?.name ||
                                          `Bài luyện tập #${id}`}
                                      </span>
                                      {exerciseInfo?.description && (
                                        <div className="text-xs text-gray-500 mt-1">
                                          {exerciseInfo.description}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  {(() => {
                                    const isProgram = Boolean(
                                      exerciseInfo?.is_program ??
                                      originalLessonData?.exercises?.find(
                                        (e: any) => String(e.id) === id
                                      )?.is_program
                                    );
                                    if (
                                      mode === "edit" &&
                                      Boolean(courseId) &&
                                      isProgram
                                    )
                                      return null;
                                    return (
                                      <div className="flex items-center gap-2 w-full">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300 rounded-xl px-3 py-1 w-full"
                                          onClick={() =>
                                            window.open(
                                              `/${locale}/manage/assignments/edit-exercise/${id}${courseId
                                                ? `?course_id=${courseId}`
                                                : ""
                                              }`,
                                              "_blank"
                                            )
                                          }
                                        >
                                          {t("edit")}
                                        </Button>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="text-gray-400 hover:text-gray-600"
                                          onClick={() => {
                                            setSelectedExercisesInfo((prev) => {
                                              const newInfo = { ...prev };
                                              delete newInfo[id];
                                              return newInfo;
                                            });
                                            setForm((f) => ({
                                              ...f,
                                              exercise: f.exercise.filter(
                                                (exerciseId) =>
                                                  exerciseId !== id
                                              ),
                                            }));
                                          }}
                                          aria-label={t("removeExercise")}
                                        >
                                          ×
                                        </Button>
                                      </div>
                                    );
                                  })()}
                                </div>
                              );
                            })
                        )}
                      </div>
                    </div>
                  )}

                  {/* Exam Section */}
                  {user?.type === "admin" && (
                    <div className="bg-white rounded-2xl p-6 border border-gray-200 mb-6">
                      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {t("tests")}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {t("selectTestsForLesson")}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300 rounded-xl"
                          onClick={() => setOpenExamPopup(true)}
                        >
                          {t("addFromLibrary")}
                        </Button>
                      </div>
                      <div className="space-y-3 mb-2">
                        {form.test.length === 0 ? (
                          <div className="text-gray-500 text-sm italic bg-gray-50 rounded-xl p-3 text-center">
                            {t("noTestsSelected")}
                          </div>
                        ) : (
                          [...form.test]
                            .sort((a, b) => Number(a) - Number(b))
                            .map((id, idx) => {
                              const examInfo = selectedExamsInfo[id];
                              return (
                                <div
                                  key={id}
                                  className="flex flex-wrap gap-2 items-center justify-between bg-white border border-gray-200 rounded-2xl p-4"
                                >
                                  <div className="flex flex-wrap items-center gap-3">
                                    <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center">
                                      <svg
                                        className="h-4 w-4 text-gray-500"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                                        />
                                      </svg>
                                    </div>
                                    <div>
                                      <span className="font-medium text-blue-700">
                                        {examInfo?.name ||
                                          originalLessonData?.exams?.find(
                                            (e: any) => String(e.id) === id
                                          )?.name ||
                                          `Bài kiểm tra #${id}`}
                                      </span>
                                      {examInfo?.description && (
                                        <div className="text-xs text-gray-500 mt-1">
                                          {examInfo.description}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  {(() => {
                                    const isProgram = Boolean(
                                      examInfo?.is_program ??
                                      originalLessonData?.exams?.find(
                                        (e: any) => String(e.id) === id
                                      )?.is_program
                                    );
                                    if (
                                      mode === "edit" &&
                                      Boolean(courseId) &&
                                      isProgram
                                    )
                                      return null;
                                    return (
                                      <div className="flex items-center gap-2 w-full">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300 rounded-xl px-3 py-1 w-full"
                                          onClick={() =>
                                            window.open(
                                              `/${locale}/manage/assignments/edit/${id}${courseId
                                                ? `?course_id=${courseId}`
                                                : ""
                                              }`,
                                              "_blank"
                                            )
                                          }
                                        >
                                          {t("edit")}
                                        </Button>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="text-gray-400 hover:text-gray-600"
                                          onClick={() => {
                                            setSelectedExamsInfo((prev) => {
                                              const newInfo = { ...prev };
                                              delete newInfo[id];
                                              return newInfo;
                                            });
                                            setForm((f) => ({
                                              ...f,
                                              test: f.test.filter(
                                                (testId) => testId !== id
                                              ),
                                            }));
                                          }}
                                          aria-label={t("removeTest")}
                                        >
                                          ×
                                        </Button>
                                      </div>
                                    );
                                  })()}
                                </div>
                              );
                            })
                        )}
                      </div>
                    </div>
                  )}

                  {/* Vocabulary Section */}
                  {user?.type === "admin" && (
                    <div className="bg-white rounded-2xl p-6 border border-gray-200 mb-6">
                      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            Từ vựng
                          </h3>
                          <p className="text-sm text-gray-500">
                            Chọn từ vựng cho bài học từ thư viện
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-purple-600 border-purple-200 hover:bg-purple-50 hover:border-purple-300 rounded-xl"
                          onClick={() => setOpenVocabularyPopup(true)}
                        >
                          Thêm từ thư viện
                        </Button>
                      </div>
                      <div className="space-y-3 mb-2">
                        {form.vocabularies.length === 0 ? (
                          <div className="text-gray-500 text-sm italic bg-gray-50 rounded-xl p-3 text-center">
                            Chưa có từ vựng nào được chọn
                          </div>
                        ) : (
                          [...form.vocabularies]
                            .sort((a, b) => Number(a) - Number(b))
                            .map((id, idx) => {
                              const vocabInfo = selectedVocabulariesInfo[id];
                              return (
                                <div
                                  key={id}
                                  className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-4"
                                >
                                  <div className="flex flex-wrap items-center gap-3">
                                    <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center">
                                      <svg
                                        className="h-4 w-4 text-gray-500"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M7 4V2C7 1.45 7.45 1 8 1H16C16.55 1 17 1.45 17 2V4H20C20.55 4 21 4.45 21 5S20.55 6 20 6H19V19C19 20.1 18.1 21 17 21H7C5.9 21 5 20.1 5 19V6H4C3.45 6 3 5.55 3 5S3.45 4 4 4H7ZM9 3V4H15V3H9ZM7 6V19H17V6H7Z"
                                        />
                                      </svg>
                                    </div>
                                    <div>
                                      <span className="font-medium text-purple-700">
                                        {vocabInfo?.word ||
                                          originalLessonData?.vocabularies?.find(
                                            (v: any) => String(v.id) === id
                                          )?.word ||
                                          `Từ vựng #${id}`}
                                      </span>
                                      {vocabInfo?.meaning && (
                                        <div className="text-xs text-gray-500 mt-1">
                                          {vocabInfo.meaning}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="text-gray-400 hover:text-gray-600"
                                      onClick={() => {
                                        setSelectedVocabulariesInfo((prev) => {
                                          const newInfo = { ...prev };
                                          delete newInfo[id];
                                          return newInfo;
                                        });
                                        setForm((f) => ({
                                          ...f,
                                          vocabularies: f.vocabularies.filter(
                                            (vocabId) => vocabId !== id
                                          ),
                                        }));
                                      }}
                                      aria-label="Xóa từ vựng"
                                    >
                                      ×
                                    </Button>
                                  </div>
                                </div>
                              );
                            })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Popup tạo bài giảng */}
      {showCreateLecture && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-0 w-full max-w-6xl h-[85vh] min-h-[600px] max-h-[90vh] relative flex flex-col">
            <div className="absolute top-4 right-4 z-10">
              <Button
                size="icon"
                variant="ghost"
                className="h-10 w-10 rounded-2xl hover:bg-gray-100"
                onClick={() => setShowCreateLecture(false)}
              >
                ×
              </Button>
            </div>
            <div className="flex-1 overflow-auto sm:p-8">
              <LectureCreateForm
                onCancel={() => setShowCreateLecture(false)}
                onSuccess={async (res) => {
                  setShowCreateLecture(false);
                  setOpenLecturePopup(false);
                  if (res && res.id) {
                    setLessonPlansData((prev: any) => ({
                      ...prev,
                      lessonPlans: prev?.lessonPlans
                        ? [...prev.lessonPlans, res]
                        : [res],
                    }));
                    setSelectedLectureInfo(res);
                    await loadLessonPlans(debouncedLectureSearch);
                    setForm((f) => ({ ...f, lecture: String(res.id) }));
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Popup tạo bài tập */}
      <Dialog open={showCreateExercise} onOpenChange={setShowCreateExercise}>
        <DialogContent className="max-w-6xl h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{t("createExercise")}</DialogTitle>
            <DialogDescription className="sr-only">
              {t("selectHomeworksForLesson")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto sm:p-8">
            <ExerciseForm
              // Basic exercise info
              name={exerciseFormState.name}
              setName={(name: string) =>
                setExerciseFormState((prev) => ({ ...prev, name }))
              }
              description={exerciseFormState.description}
              setDescription={(description: string) =>
                setExerciseFormState((prev) => ({ ...prev, description }))
              }
              status={exerciseFormState.status}
              setStatus={(status: number) =>
                setExerciseFormState((prev) => ({ ...prev, status }))
              }
              timeLimit={exerciseFormState.timeLimit}
              setTimeLimit={(timeLimit: number) =>
                setExerciseFormState((prev) => ({ ...prev, timeLimit }))
              }
              deadline={exerciseFormState.deadline}
              setDeadline={(deadline: Date | undefined) =>
                setExerciseFormState((prev) => ({ ...prev, deadline }))
              }
              deadlineTime={exerciseFormState.deadlineTime}
              setDeadlineTime={(deadlineTime: string) =>
                setExerciseFormState((prev) => ({ ...prev, deadlineTime }))
              }
              // Cover image
              coverImageUrl={exerciseFormState.coverImageUrl}
              uploadingCover={false}
              handleCoverImageChange={() => { }}
              handleRemoveCoverImage={() => { }}
              // Questions
              selectedQuestions={exerciseFormState.selectedQuestions}
              selectedQuestionsData={exerciseFormState.selectedQuestionsData}
              questionScores={exerciseFormState.questionScores}
              exerciseQuestions={exerciseFormState.selectedQuestionsData}
              handleQuestionToggle={handleExerciseQuestionToggle}
              handleScoreChange={handleExerciseScoreChange}
              getSelectedQuestionsList={getExerciseSelectedQuestionsList}
              // Question bank - sử dụng state từ ExerciseForm
              questionBankOpen={exerciseQuestionBankOpen}
              setQuestionBankOpen={setExerciseQuestionBankOpen}
              questions={exerciseQuestions}
              questionLoading={exerciseQuestionLoading}
              questionError={exerciseQuestionError}
              questionFilters={exerciseQuestionFilters}
              hasMoreQuestions={exerciseHasMoreQuestions}
              handleQuestionPageChange={(newPage) =>
                loadExerciseQuestions(exerciseQuestionFilters.search, newPage)
              }
              handleQuestionFilterChange={(key, value) => {
                setExerciseQuestionFilters((prev) => ({
                  ...prev,
                  [key]: value,
                }));
                // Không gọi loadQuestions ở đây, để useEffect xử lý
              }}
              handleQuestionSearch={(e) => {
                e.preventDefault();
                loadExerciseQuestions(exerciseQuestionFilters.search, 1);
              }}
              getCurrentPageQuestions={() => exerciseQuestions}
              // Question detail - sử dụng state từ LessonForm
              selectedQuestionId={exerciseSelectedQuestionId}
              questionDetailOpen={exerciseQuestionDetailOpen}
              handleViewQuestionDetail={(questionId) => {
                setExerciseSelectedQuestionId(questionId);
                setExerciseQuestionDetailOpen(true);
              }}
              setQuestionDetailOpen={setExerciseQuestionDetailOpen}
              // Actions
              handleSave={handleExerciseSave}
              handleCancel={() => setShowCreateExercise(false)}
              isSaving={false}
              isLoading={false}
              // UI props
              title="Tạo bài tập"
              subtitle="Tạo bài tập mới cho học sinh"
              saveButtonText="Tạo bài tập"
              // Navigation
              backUrl=""
              // Exercise ID for edit mode
              exerciseId={undefined}
              // Đóng modal chọn câu hỏi và lưu localStorage
              handleCloseQuestionBank={() => setExerciseQuestionBankOpen(false)}
              // State setters for questions
              setSelectedQuestions={(
                questions: string[] | ((prev: string[]) => string[])
              ) => {
                if (typeof questions === "function") {
                  setExerciseFormState((prev) => ({
                    ...prev,
                    selectedQuestions: questions(prev.selectedQuestions),
                  }));
                } else {
                  setExerciseFormState((prev) => ({
                    ...prev,
                    selectedQuestions: questions,
                  }));
                }
              }}
              setSelectedQuestionsData={(
                questions: any[] | ((prev: any[]) => any[])
              ) => {
                if (typeof questions === "function") {
                  setExerciseFormState((prev) => ({
                    ...prev,
                    selectedQuestionsData: questions(
                      prev.selectedQuestionsData
                    ),
                  }));
                } else {
                  setExerciseFormState((prev) => ({
                    ...prev,
                    selectedQuestionsData: questions,
                  }));
                }
              }}
              setQuestionScores={(
                scores:
                  | Record<string, number>
                  | ((prev: Record<string, number>) => Record<string, number>)
              ) => {
                if (typeof scores === "function") {
                  setExerciseFormState((prev) => ({
                    ...prev,
                    questionScores: scores(prev.questionScores),
                  }));
                } else {
                  setExerciseFormState((prev) => ({
                    ...prev,
                    questionScores: scores,
                  }));
                }
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Popup tạo bài tập về nhà */}
      <Dialog open={showCreateHomework} onOpenChange={setShowCreateHomework}>
        <DialogContent className="max-w-6xl h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{t("exercises")}</DialogTitle>
            <DialogDescription className="sr-only">
              {t("selectExercisesForLesson")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto sm:p-8">
            <HomeworkForm
              mode="create"
              // Basic homework info
              name={homeworkFormState.name}
              setName={(name: string) =>
                setHomeworkFormState((prev) => ({ ...prev, name }))
              }
              description={homeworkFormState.description}
              setDescription={(description: string) =>
                setHomeworkFormState((prev) => ({ ...prev, description }))
              }
              status={homeworkFormState.status}
              setStatus={(status: number) =>
                setHomeworkFormState((prev) => ({ ...prev, status }))
              }
              // Cover image
              coverImageUrl={homeworkFormState.coverImageUrl}
              uploadingCover={false}
              handleCoverImageChange={() => { }}
              handleRemoveCoverImage={() => { }}
              // Questions
              selectedQuestions={homeworkFormState.selectedQuestions}
              selectedQuestionsData={homeworkFormState.selectedQuestionsData}
              questionScores={homeworkFormState.questionScores}
              handleQuestionToggle={handleQuestionToggle}
              handleScoreChange={handleScoreChange}
              getSelectedQuestionsList={getSelectedQuestionsList}
              // Question bank - sử dụng state từ LessonForm
              questionBankOpen={questionBankOpen}
              setQuestionBankOpen={setQuestionBankOpen}
              questions={questions}
              questionLoading={questionLoading}
              questionError={questionError}
              questionFilters={questionFilters}
              hasMoreQuestions={hasMoreQuestions}
              handleQuestionPageChange={(newPage) =>
                loadQuestions(questionFilters.search, newPage)
              }
              handleQuestionFilterChange={(key, value) => {
                setQuestionFilters((prev) => ({ ...prev, [key]: value }));
                // Không gọi loadQuestions ở đây, để useEffect xử lý
              }}
              handleQuestionSearch={(e) => {
                e.preventDefault();
                loadQuestions(questionFilters.search, 1);
              }}
              getCurrentPageQuestions={() => questions}
              // Question detail - sử dụng state từ LessonForm
              selectedQuestionId={selectedQuestionId}
              questionDetailOpen={questionDetailOpen}
              handleViewQuestionDetail={(questionId) => {
                setSelectedQuestionId(questionId);
                setQuestionDetailOpen(true);
              }}
              setQuestionDetailOpen={setQuestionDetailOpen}
              // Actions
              handleSave={handleHomeworkSave}
              isSaving={isCreatingHomework}
              // Utils
              formatQuestionType={formatQuestionType}
              // Navigation
              backUrl=""
              // Homework ID for edit mode
              homeworkId={undefined}
              // Đóng modal chọn câu hỏi và lưu localStorage
              handleCloseQuestionBank={() => setQuestionBankOpen(false)}
              // State setters for questions
              setSelectedQuestions={(
                questions: string[] | ((prev: string[]) => string[])
              ) => {
                if (typeof questions === "function") {
                  setHomeworkFormState((prev) => ({
                    ...prev,
                    selectedQuestions: questions(prev.selectedQuestions),
                  }));
                } else {
                  setHomeworkFormState((prev) => ({
                    ...prev,
                    selectedQuestions: questions,
                  }));
                }
              }}
              setSelectedQuestionsData={(
                questions: any[] | ((prev: any[]) => any[])
              ) => {
                if (typeof questions === "function") {
                  setHomeworkFormState((prev) => ({
                    ...prev,
                    selectedQuestionsData: questions(
                      prev.selectedQuestionsData
                    ),
                  }));
                } else {
                  setHomeworkFormState((prev) => ({
                    ...prev,
                    selectedQuestionsData: questions,
                  }));
                }
              }}
              setQuestionScores={(
                scores:
                  | Record<string, number>
                  | ((prev: Record<string, number>) => Record<string, number>)
              ) => {
                if (typeof scores === "function") {
                  setHomeworkFormState((prev) => ({
                    ...prev,
                    questionScores: scores(prev.questionScores),
                  }));
                } else {
                  setHomeworkFormState((prev) => ({
                    ...prev,
                    questionScores: scores,
                  }));
                }
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Popup tạo bài kiểm tra đánh giá */}
      <Dialog
        open={showCreateAssessment}
        onOpenChange={setShowCreateAssessment}
      >
        <DialogContent className="max-w-6xl h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{t("createAssessment")}</DialogTitle>
            <DialogDescription className="sr-only">
              {t("selectAssessmentForLesson")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto sm:p-8">
            <AssessmentForm
              mode="create"
              // Basic assessment info
              name={assessmentFormState.name}
              setName={(name: string) =>
                setAssessmentFormState((prev) => ({ ...prev, name }))
              }
              description={assessmentFormState.description}
              setDescription={(description: string) =>
                setAssessmentFormState((prev) => ({ ...prev, description }))
              }
              // Actions
              handleSave={handleAssessmentSave}
              isSaving={isCreatingAssessment}
              // Navigation
              backUrl=""
              // Assessment ID for edit mode
              assessmentId={undefined}
              // Assessment meta
              assessmentType={assessmentFormState.assessmentType}
              setAssessmentType={(value: string) =>
                setAssessmentFormState((prev) => ({
                  ...prev,
                  assessmentType: value,
                }))
              }
              subjects={assessmentSubjects}
              subjectsLoading={assessmentSubjectsLoading}
              subjectId={assessmentFormState.subject_id}
              setSubjectId={(value: string) =>
                setAssessmentFormState((prev) => ({
                  ...prev,
                  subject_id: value,
                }))
              }
              onFilesChange={handleAssessmentFilesChange}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Popup tạo bài kiểm tra */}
      <Dialog open={showCreateExam} onOpenChange={setShowCreateExam}>
        <DialogContent className="max-w-6xl h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{t("createTest")}</DialogTitle>
            <DialogDescription className="sr-only">
              {t("selectTestsForLesson")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto sm:p-8">
            <ExamForm
              // Basic exam info
              name={examFormState.name}
              setName={(name: string) =>
                setExamFormState((prev) => ({ ...prev, name }))
              }
              description={examFormState.description}
              setDescription={(description: string) =>
                setExamFormState((prev) => ({ ...prev, description }))
              }
              status={examFormState.status}
              setStatus={(status: number) =>
                setExamFormState((prev) => ({ ...prev, status }))
              }
              timeLimit={examFormState.timeLimit}
              setTimeLimit={(timeLimit: number) =>
                setExamFormState((prev) => ({ ...prev, timeLimit }))
              }
              deadline={examFormState.deadline}
              setDeadline={(deadline: Date | undefined) =>
                setExamFormState((prev) => ({ ...prev, deadline }))
              }
              deadlineTime={examFormState.deadlineTime}
              setDeadlineTime={(deadlineTime: string) =>
                setExamFormState((prev) => ({ ...prev, deadlineTime }))
              }
              // Cover image
              coverImageUrl={examFormState.coverImageUrl}
              uploadingCover={false}
              handleCoverImageChange={() => { }}
              handleRemoveCoverImage={() => { }}
              // Questions
              selectedQuestions={examFormState.selectedQuestions}
              selectedQuestionsData={examFormState.selectedQuestionsData}
              questionScores={examFormState.questionScores}
              setSelectedQuestions={(
                questions: string[] | ((prev: string[]) => string[])
              ) => {
                if (typeof questions === "function") {
                  setExamFormState((prev) => ({
                    ...prev,
                    selectedQuestions: questions(prev.selectedQuestions),
                  }));
                } else {
                  setExamFormState((prev) => ({
                    ...prev,
                    selectedQuestions: questions,
                  }));
                }
              }}
              setSelectedQuestionsData={(
                questions: any[] | ((prev: any[]) => any[])
              ) => {
                if (typeof questions === "function") {
                  setExamFormState((prev) => ({
                    ...prev,
                    selectedQuestionsData: questions(
                      prev.selectedQuestionsData
                    ),
                  }));
                } else {
                  setExamFormState((prev) => ({
                    ...prev,
                    selectedQuestionsData: questions,
                  }));
                }
              }}
              setQuestionScores={(
                scores:
                  | Record<string, number>
                  | ((prev: Record<string, number>) => Record<string, number>)
              ) => {
                if (typeof scores === "function") {
                  setExamFormState((prev) => ({
                    ...prev,
                    questionScores: scores(prev.questionScores),
                  }));
                } else {
                  setExamFormState((prev) => ({
                    ...prev,
                    questionScores: scores,
                  }));
                }
              }}
              examQuestions={examFormState.selectedQuestionsData}
              handleQuestionToggle={handleExamQuestionToggle}
              handleScoreChange={handleExamScoreChange}
              getSelectedQuestionsList={getExamSelectedQuestionsList}
              // Question bank - sử dụng state riêng cho ExamForm
              questionBankOpen={examQuestionBankOpen}
              setQuestionBankOpen={setExamQuestionBankOpen}
              questions={examQuestions}
              questionLoading={examQuestionLoading}
              questionError={examQuestionError}
              questionFilters={examQuestionFilters}
              hasMoreQuestions={examHasMoreQuestions}
              handleQuestionPageChange={(newPage) =>
                loadExamQuestions(examQuestionFilters.search, newPage)
              }
              handleQuestionFilterChange={(key, value) => {
                setExamQuestionFilters((prev) => ({ ...prev, [key]: value }));
                // Không gọi loadExamQuestions ở đây, để useEffect xử lý
              }}
              handleQuestionSearch={(e) => {
                e.preventDefault();
                loadExamQuestions(examQuestionFilters.search, 1);
              }}
              getCurrentPageQuestions={() => examQuestions}
              // Question detail - sử dụng state từ LessonForm
              selectedQuestionId={selectedQuestionId}
              questionDetailOpen={questionDetailOpen}
              handleViewQuestionDetail={(questionId) => {
                setSelectedQuestionId(questionId);
                setQuestionDetailOpen(true);
              }}
              setQuestionDetailOpen={setQuestionDetailOpen}
              // Actions
              handleSave={handleExamSave}
              handleCancel={() => setShowCreateExam(false)}
              isSaving={isCreatingExam}
              isLoading={false}
              // UI props
              title="Tạo bài kiểm tra"
              subtitle="Tạo bài kiểm tra mới cho học sinh"
              saveButtonText="Tạo bài kiểm tra"
              // Navigation
              backUrl=""
              // Exam ID for edit mode
              examId={undefined}
              // Đóng modal chọn câu hỏi và lưu localStorage
              handleCloseQuestionBank={() => setExamQuestionBankOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog chọn bài giảng */}
      <Dialog
        open={openLecturePopup}
        onOpenChange={(open) => {
          setOpenLecturePopup(open);
          if (!open) {
            setLectureSearch("");
            setLessonPlansData(null);
            setLessonPlansPagination({
              currentPage: 1,
              totalPages: 1,
              totalItems: 0,
              hasNextPage: false,
              hasPrevPage: false,
            });
          }
        }}
      >
        <DialogContent className="max-w-4xl h-[720px] sm:h-[640px] overflow-hidden rounded-3xl border-0 shadow-xl flex flex-col">
          <DialogHeader className="pb-4 border-b border-gray-100 flex-shrink-0">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              {t("selectLecture")}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {t("selectLectureForLesson")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="px-4 pt-2.5 pb-2 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 flex-shrink-0">
              <Input
                placeholder={t("searchLectures")}
                value={lectureSearch}
                onChange={(e) => setLectureSearch(e.target.value)}
                className="flex-1 rounded-2xl border-gray-200 focus:border-emerald-300 focus:ring-emerald-200"
              />
              <Button
                variant="outline"
                className="rounded-2xl border-gray-200 hover:border-emerald-300 hover:bg-emerald-50"
                onClick={() => {
                  setOpenLecturePopup(false);
                  setShowCreateLecture(true);
                }}
              >
                {t("createLecture")}
              </Button>
            </div>

            <div className="px-4 overflow-y-auto space-y-3 flex-1 max-h-[430px]">
              {lessonPlansLoading && lessonPlansPagination.currentPage === 1 ? (
                <div className="text-center py-8 text-gray-500 flex flex-col items-center justify-center h-full">
                  <div className="w-10 h-10 mb-4">
                    <svg
                      className="animate-spin h-10 w-10"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  </div>
                  {t("loading")}
                </div>
              ) : !lessonPlansData?.lessonPlans?.length ? (
                <div className="text-center flex flex-col items-center justify-center h-full py-8">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg
                      className="h-8 w-8 text-emerald-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-600">{t("noLecturesFound")}</p>
                </div>
              ) : (
                <>
                  {lessonPlansData.lessonPlans
                    .sort((a: any, b: any) => Number(a.id) - Number(b.id))
                    .map((lecture: any) => (
                      <div
                        key={lecture.id}
                        className={`p-4 border-2 rounded-2xl cursor-pointer transition-all duration-200 ${form.lecture === String(lecture.id)
                            ? "border-emerald-300 bg-emerald-50"
                            : "border-gray-200 hover:border-emerald-200 hover:bg-emerald-25"
                          }`}
                        onClick={() => {
                          setForm((f) => ({
                            ...f,
                            lecture: String(lecture.id),
                          }));
                          setSelectedLectureInfo(lecture);
                          setOpenLecturePopup(false);
                        }}
                      >
                        <div className="flex flex-wrap-reverse gap-2 items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {lecture.name}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                              {lecture.description || t("noDescription")}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-emerald-100 text-emerald-600 border-emerald-200">
                              {t("lecture")}
                            </Badge>
                            {form.lecture === String(lecture.id) && (
                              <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                                <svg
                                  className="h-4 w-4 text-white"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </>
              )}
            </div>

            {lessonPlansPagination.hasNextPage && (
              <div className="text-center pt-4 px-4 mt-auto border-t border-gray-100 flex-shrink-0 bg-gray-50/50">
                <Button
                  variant="outline"
                  className="rounded-2xl border-gray-200 hover:border-emerald-300 hover:bg-emerald-50"
                  onClick={loadMoreLessonPlans}
                  disabled={lessonPlansLoading}
                >
                  {lessonPlansLoading ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      {t("loading")}
                    </>
                  ) : (
                    <>
                      {t("loadMore")} ({lessonPlansPagination.currentPage}/
                      {lessonPlansPagination.totalPages})
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog chọn bài tập về nhà */}
      <Dialog
        open={openExercisePopup}
        onOpenChange={(open) => {
          setOpenExercisePopup(open);
          if (open) {
            // Khởi tạo temp state rỗng cho popup "add-only"
            setTempSelectedExercises([]);
            setTempSelectedExercisesInfo({});
          } else {
            setExerciseSearch("");
            setExercisesData(null);
            setExercisesPagination({
              currentPage: 1,
              totalPages: 1,
              totalItems: 0,
              hasNextPage: false,
              hasPrevPage: false,
            });
            // Clear temp khi đóng popup
            setTempSelectedExercises([]);
            setTempSelectedExercisesInfo({});
          }
        }}
      >
        <DialogContent className="max-w-4xl h-[720px] sm:h-[640px] overflow-hidden rounded-3xl border-0 shadow-xl flex flex-col">
          <DialogHeader className="pb-4 border-b border-gray-100 flex-shrink-0">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              {t("selectExercises")}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {t("selectExercisesForLesson")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="px-4 pt-2.5 pb-2 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 flex-shrink-0">
              <Input
                placeholder={t("searchExercises")}
                value={exerciseSearch}
                onChange={(e) => setExerciseSearch(e.target.value)}
                className="flex-1 rounded-2xl border-gray-200 focus:border-green-300 focus:ring-green-200"
              />
              <Button
                variant="outline"
                className="rounded-2xl border-gray-200 hover:border-green-300 hover:bg-green-50"
                onClick={() => {
                  setOpenExercisePopup(false);
                  setShowCreateExercise(true);
                }}
              >
                {t("createExercise")}
              </Button>
            </div>

            <div className="px-4 overflow-y-auto space-y-3 flex-1 max-h-[430px]">
              {exercisesLoading && exercisesPagination.currentPage === 1 ? (
                <div className="text-center py-8 text-gray-500 flex flex-col items-center justify-center h-full">
                  <div className="w-10 h-10 mb-4">
                    <svg
                      className="animate-spin h-10 w-10"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  </div>
                  {t("loading")}
                </div>
              ) : !exercisesData?.exercises?.filter(
                (exercise: any) =>
                  !form.exercise.includes(String(exercise.id))
              )?.length ? (
                <div className="text-center flex flex-col items-center justify-center h-full py-8">
                  <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg
                      className="h-8 w-8 text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-600">{t("noNewExercisesToAdd")}</p>
                  <p className="text-gray-400 text-sm mt-1">
                    {t("allExercisesAdded")}
                  </p>
                </div>
              ) : (
                (() => {
                  const filteredExercises = exercisesData.exercises
                    .filter(
                      (exercise: any) =>
                        !form.exercise.includes(String(exercise.id))
                    )
                    .sort((a: any, b: any) => Number(a.id) - Number(b.id));
                  return (
                    <>
                      {filteredExercises.map((exercise: any) => {
                        const idStr = String(exercise.id);
                        const isSelected =
                          tempSelectedExercises.includes(idStr);
                        return (
                          <div
                            key={exercise.id}
                            className={`p-4 border-2 rounded-2xl cursor-pointer transition-all duration-200 ${isSelected
                                ? "border-green-300 bg-green-50"
                                : "border-gray-200 hover:border-green-200 hover:bg-green-25"
                              }`}
                            onClick={() => {
                              if (isSelected) {
                                setTempSelectedExercises((prev) =>
                                  prev.filter((id) => id !== idStr)
                                );
                                setTempSelectedExercisesInfo((prev) => {
                                  const newInfo = { ...prev };
                                  delete newInfo[idStr];
                                  return newInfo;
                                });
                              } else {
                                setTempSelectedExercises((prev) => [
                                  ...prev,
                                  idStr,
                                ]);
                                setTempSelectedExercisesInfo((prev) => ({
                                  ...prev,
                                  [idStr]: exercise,
                                }));
                              }
                            }}
                          >
                            <div className="flex flex-wrap-reverse gap-2 items-center justify-between">
                              <div>
                                <h3 className="font-semibold text-gray-900">
                                  {exercise.name}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                  {exercise.description || t("noDescription")}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className="bg-green-100 text-green-600 border-green-200">
                                  {t("exercise")}
                                </Badge>
                                {isSelected && (
                                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                    <svg
                                      className="h-4 w-4 text-white"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  );
                })()
              )}
            </div>

            <div className="px-4 py-4 border-t border-gray-100 flex-shrink-0 bg-gray-50/50">
              <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end">
                <Button
                  variant="outline"
                  className="rounded-2xl border-gray-200 hover:border-gray-300"
                  onClick={() => setOpenExercisePopup(false)}
                >
                  {t("cancel")}
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white rounded-2xl px-6"
                  onClick={() => {
                    // Chỉ thêm những bài mới chưa có trong form.exercise
                    const currentExercises = form.exercise;
                    const newExercises = tempSelectedExercises.filter(
                      (id) => !currentExercises.includes(id)
                    );
                    const mergedExercises = [
                      ...currentExercises,
                      ...newExercises,
                    ];
                    setForm((f) => ({ ...f, exercise: mergedExercises }));
                    setSelectedExercisesInfo((prev) => ({
                      ...prev,
                      ...tempSelectedExercisesInfo,
                    }));
                    setOpenExercisePopup(false);
                    // Clear temp state khi xác nhận
                    setTempSelectedExercises([]);
                    setTempSelectedExercisesInfo({});
                  }}
                >
                  {t("addExercises")} ({tempSelectedExercises.length})
                </Button>
              </div>
            </div>

            {exercisesPagination.hasNextPage && (
              <div className="text-center pt-4 px-4 mt-auto border-t border-gray-100 flex-shrink-0 bg-gray-50/50">
                <Button
                  variant="outline"
                  className="rounded-2xl border-gray-200 hover:border-green-300 hover:bg-green-50"
                  onClick={loadMoreExercises}
                  disabled={exercisesLoading}
                >
                  {exercisesLoading ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      {t("loading")}
                    </>
                  ) : (
                    <>
                      {t("loadMore")} ({exercisesPagination.currentPage}/
                      {exercisesPagination.totalPages})
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog chọn bài kiểm tra đánh giá */}
      <Dialog
        open={openAssessmentPopup}
        onOpenChange={(open) => {
          setOpenAssessmentPopup(open);
          if (open) {
            // Khởi tạo temp state rỗng cho popup "add-only"
            setTempSelectedAssessment([]);
            setTempSelectedAssessmentInfo({});
          } else {
            setAssessmentSearch("");
            setAssessmentData(null);
            setAssessmentPagination({
              currentPage: 1,
              totalPages: 1,
              totalItems: 0,
              hasNextPage: false,
              hasPrevPage: false,
            });
            // Clear temp khi đóng popup
            setTempSelectedAssessment([]);
            setTempSelectedAssessmentInfo({});
          }
        }}
      >
        <DialogContent className="max-w-4xl h-[720px] sm:h-[640px] overflow-hidden rounded-3xl border-0 shadow-xl flex flex-col">
          <DialogHeader className="pb-4 border-b border-gray-100 flex-shrink-0">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              {t("selectAssessment")}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {t("selectAssessmentForLesson")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="px-4 pt-2.5 pb-2 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 flex-shrink-0">
              <Input
                placeholder={t("searchAssessment")}
                value={assessmentSearch}
                onChange={(e) => setAssessmentSearch(e.target.value)}
                className="flex-1 rounded-2xl border-gray-200 focus:border-green-300 focus:ring-green-200"
              />
              <Button
                variant="outline"
                className="rounded-2xl border-gray-200 hover:border-green-300 hover:bg-green-50"
                onClick={() => {
                  setOpenAssessmentPopup(false);
                  setShowCreateAssessment(true);
                }}
              >
                {t("createAssessment")}
              </Button>
            </div>

            <div className="px-4 overflow-y-auto space-y-3 flex-1 max-h-[430px]">
              {assessmentLoading && assessmentPagination.currentPage === 1 ? (
                <div className="text-center py-8 text-gray-500 flex flex-col items-center justify-center h-full">
                  <div className="w-10 h-10 mb-4">
                    <svg
                      className="animate-spin h-10 w-10"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  </div>
                  {t("loading")}
                </div>
              ) : !assessmentData?.assessment?.filter(
                (assessment: any) =>
                  !form.assessment.includes(String(assessment.id))
              )?.length ? (
                <div className="text-center flex flex-col items-center justify-center h-full py-8">
                  <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg
                      className="h-8 w-8 text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-600">{t("noNewExercisesToAdd")}</p>
                  <p className="text-gray-400 text-sm mt-1">
                    {t("allExercisesAdded")}
                  </p>
                </div>
              ) : (
                (() => {
                  const filteredAssessment = assessmentData.assessment
                    .filter(
                      (assessment: any) =>
                        !form.assessment.includes(String(assessment.id))
                    )
                    .sort((a: any, b: any) => Number(a.id) - Number(b.id));
                  return (
                    <>
                      {filteredAssessment.map((assessment: any) => {
                        const idStr = String(assessment.id);
                        const isSelected =
                          tempSelectedAssessment.includes(idStr);
                        return (
                          <div
                            key={assessment.id}
                            className={`p-4 border-2 rounded-2xl cursor-pointer transition-all duration-200 ${isSelected
                                ? "border-green-300 bg-green-50"
                                : "border-gray-200 hover:border-green-200 hover:bg-green-25"
                              }`}
                            onClick={() => {
                              if (isSelected) {
                                setTempSelectedAssessment((prev) =>
                                  prev.filter((id) => id !== idStr)
                                );
                                setTempSelectedAssessmentInfo((prev) => {
                                  const newInfo = { ...prev };
                                  delete newInfo[idStr];
                                  return newInfo;
                                });
                              } else {
                                setTempSelectedAssessment((prev) => [
                                  ...prev,
                                  idStr,
                                ]);
                                setTempSelectedAssessmentInfo((prev) => ({
                                  ...prev,
                                  [idStr]: assessment,
                                }));
                              }
                            }}
                          >
                            <div className="flex flex-wrap-reverse gap-2 items-center justify-between">
                              <div>
                                <h3 className="font-semibold text-gray-900">
                                  {assessment.name}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                  {assessment.description || t("noDescription")}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className="bg-green-100 text-green-600 border-green-200">
                                  {t("assessment")}
                                </Badge>
                                {isSelected && (
                                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                    <svg
                                      className="h-4 w-4 text-white"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  );
                })()
              )}
            </div>

            <div className="px-4 py-4 border-t border-gray-100 flex-shrink-0 bg-gray-50/50">
              <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end">
                <Button
                  variant="outline"
                  className="rounded-2xl border-gray-200 hover:border-gray-300"
                  onClick={() => setOpenAssessmentPopup(false)}
                >
                  {t("cancel")}
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white rounded-2xl px-6"
                  onClick={() => {
                    // Chỉ thêm những bài mới chưa có trong form.assessment
                    const currentAssessment = form.assessment;
                    const newAssessment = tempSelectedAssessment.filter(
                      (id) => !currentAssessment.includes(id)
                    );
                    const mergedAssessment = [
                      ...currentAssessment,
                      ...newAssessment,
                    ];
                    setForm((f) => ({ ...f, assessment: mergedAssessment }));
                    setSelectedAssessmentInfo((prev) => ({
                      ...prev,
                      ...tempSelectedAssessmentInfo,
                    }));
                    setOpenAssessmentPopup(false);
                    // Clear temp state khi xác nhận
                    setTempSelectedAssessment([]);
                    setTempSelectedAssessmentInfo({});
                  }}
                >
                  {t("addAssessment")} ({tempSelectedAssessment.length})
                </Button>
              </div>
            </div>

            {assessmentPagination.hasNextPage && (
              <div className="text-center pt-4 px-4 mt-auto border-t border-gray-100 flex-shrink-0 bg-gray-50/50">
                <Button
                  variant="outline"
                  className="rounded-2xl border-gray-200 hover:border-green-300 hover:bg-green-50"
                  onClick={loadMoreAssessment}
                  disabled={assessmentLoading}
                >
                  {assessmentLoading ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      {t("loading")}
                    </>
                  ) : (
                    <>
                      {t("loadMore")} ({assessmentPagination.currentPage}/
                      {assessmentPagination.totalPages})
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog chọn bài luyện tập */}
      <Dialog
        open={openHomeworkPopup}
        onOpenChange={(open) => {
          setOpenHomeworkPopup(open);
          if (open) {
            // Khởi tạo temp state rỗng cho popup "add-only"
            setTempSelectedHomeworks([]);
            setTempSelectedHomeworksInfo({});
          } else {
            setHomeworkSearch("");
            setHomeworksData(null);
            setHomeworksPagination({
              currentPage: 1,
              totalPages: 1,
              totalItems: 0,
              hasNextPage: false,
              hasPrevPage: false,
            });
            // Clear temp khi đóng popup
            setTempSelectedHomeworks([]);
            setTempSelectedHomeworksInfo({});
          }
        }}
      >
        <DialogContent className="max-w-4xl h-[720px] sm:h-[640px] overflow-hidden rounded-3xl border-0 shadow-xl flex flex-col">
          <DialogHeader className="pb-4 border-b border-gray-100 flex-shrink-0">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              {t("selectExercises")}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {t("selectHomeworksForLesson")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="px-4 pt-2.5 pb-2 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 flex-shrink-0">
              <Input
                placeholder={t("searchExercises")}
                value={homeworkSearch}
                onChange={(e) => setHomeworkSearch(e.target.value)}
                className="flex-1 rounded-2xl border-gray-200 focus:border-green-300 focus:ring-green-200"
              />
              <Button
                variant="outline"
                className="rounded-2xl border-gray-200 hover:border-green-300 hover:bg-green-50"
                onClick={() => {
                  setOpenHomeworkPopup(false);
                  setShowCreateHomework(true);
                }}
              >
                {t("createExercise")}
              </Button>
            </div>

            <div className="px-4 overflow-y-auto space-y-3 flex-1 max-h-[430px]">
              {homeworksLoading && homeworksPagination.currentPage === 1 ? (
                <div className="text-center py-8 text-gray-500 flex flex-col items-center justify-center h-full">
                  <div className="w-10 h-10 mb-4">
                    <svg
                      className="animate-spin h-10 w-10"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  </div>
                  {t("loading")}
                </div>
              ) : !homeworksData?.homeworks?.filter(
                (homework: any) =>
                  !form.homework.includes(String(homework.id))
              )?.length ? (
                <div className="text-center flex flex-col items-center justify-center h-full py-8">
                  <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg
                      className="h-8 w-8 text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-600">{t("noNewExercisesToAdd")}</p>
                  <p className="text-gray-400 text-sm mt-1">
                    {t("allExercisesAdded")}
                  </p>
                </div>
              ) : (
                (() => {
                  const filteredHomeworks = homeworksData.homeworks
                    .filter(
                      (homework: any) =>
                        !form.homework.includes(String(homework.id))
                    )
                    .sort((a: any, b: any) => Number(a.id) - Number(b.id));
                  return (
                    <>
                      {filteredHomeworks.map((homework: any) => {
                        const idStr = String(homework.id);
                        const isSelected =
                          tempSelectedHomeworks.includes(idStr);
                        return (
                          <div
                            key={homework.id}
                            className={`p-4 border-2 rounded-2xl cursor-pointer transition-all duration-200 ${isSelected
                                ? "border-green-300 bg-green-50"
                                : "border-gray-200 hover:border-green-200 hover:bg-green-25"
                              }`}
                            onClick={() => {
                              if (isSelected) {
                                setTempSelectedHomeworks((prev) =>
                                  prev.filter((id) => id !== idStr)
                                );
                                setTempSelectedHomeworksInfo((prev) => {
                                  const newInfo = { ...prev };
                                  delete newInfo[idStr];
                                  return newInfo;
                                });
                              } else {
                                setTempSelectedHomeworks((prev) => [
                                  ...prev,
                                  idStr,
                                ]);
                                setTempSelectedHomeworksInfo((prev) => ({
                                  ...prev,
                                  [idStr]: homework,
                                }));
                              }
                            }}
                          >
                            <div className="flex flex-wrap-reverse gap-2 items-center justify-between">
                              <div>
                                <h3 className="font-semibold text-gray-900">
                                  {homework.name}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                  {homework.description || t("noDescription")}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className="bg-green-100 text-green-600 border-green-200">
                                  {t("exercise")}
                                </Badge>
                                {isSelected && (
                                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                    <svg
                                      className="h-4 w-4 text-white"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  );
                })()
              )}
            </div>

            <div className="px-4 py-4 border-t border-gray-100 flex-shrink-0 bg-gray-50/50">
              <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end">
                <Button
                  variant="outline"
                  className="rounded-2xl border-gray-200 hover:border-gray-300"
                  onClick={() => setOpenHomeworkPopup(false)}
                >
                  {t("cancel")}
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white rounded-2xl px-6"
                  onClick={() => {
                    // Chỉ thêm những bài mới chưa có trong form.homework
                    const currentHomeworks = form.homework;
                    const newHomeworks = tempSelectedHomeworks.filter(
                      (id) => !currentHomeworks.includes(id)
                    );
                    const mergedHomeworks = [
                      ...currentHomeworks,
                      ...newHomeworks,
                    ];
                    console.log("Current homeworks:", currentHomeworks);
                    console.log(
                      "Temp selected homeworks:",
                      tempSelectedHomeworks
                    );
                    console.log("New homeworks (filtered):", newHomeworks);
                    console.log("Merged homeworks:", mergedHomeworks);
                    setForm((f) => ({ ...f, homework: mergedHomeworks }));
                    setSelectedHomeworksInfo((prev) => ({
                      ...prev,
                      ...tempSelectedHomeworksInfo,
                    }));
                    setOpenHomeworkPopup(false);
                    // Clear temp state khi xác nhận
                    setTempSelectedHomeworks([]);
                    setTempSelectedHomeworksInfo({});
                  }}
                >
                  {t("addExercises")} ({tempSelectedHomeworks.length})
                </Button>
              </div>
            </div>

            {homeworksPagination.hasNextPage && (
              <div className="text-center pt-4 px-4 mt-auto border-t border-gray-100 flex-shrink-0 bg-gray-50/50">
                <Button
                  variant="outline"
                  className="rounded-2xl border-gray-200 hover:border-green-300 hover:bg-green-50"
                  onClick={loadMoreHomeworks}
                  disabled={homeworksLoading}
                >
                  {homeworksLoading ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      {t("loading")}
                    </>
                  ) : (
                    <>
                      {t("loadMore")} ({homeworksPagination.currentPage}/
                      {homeworksPagination.totalPages})
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog chọn bài kiểm tra */}
      <Dialog
        open={openExamPopup}
        onOpenChange={(open) => {
          setOpenExamPopup(open);
          if (open) {
            // Khởi tạo temp state rỗng cho popup "add-only"
            setTempSelectedExams([]);
            setTempSelectedExamsInfo({});
          } else {
            setExamSearch("");
            setExamsData(null);
            setExamsPagination({
              currentPage: 1,
              totalPages: 1,
              totalItems: 0,
              hasNextPage: false,
              hasPrevPage: false,
            });
            // Clear temp khi đóng popup
            setTempSelectedExams([]);
            setTempSelectedExamsInfo({});
          }
        }}
      >
        <DialogContent className="max-w-4xl h-[720px] sm:h-[640px] overflow-hidden rounded-3xl border-0 shadow-xl flex flex-col">
          <DialogHeader className="pb-4 border-b border-gray-100 flex-shrink-0">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              {t("selectTests")}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {t("selectTestsForLesson")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="px-4 pt-2.5 pb-2 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 flex-shrink-0">
              <Input
                placeholder={t("searchTests")}
                value={examSearch}
                onChange={(e) => setExamSearch(e.target.value)}
                className="flex-1 rounded-2xl border-gray-200 focus:border-blue-300 focus:ring-blue-200"
              />
              <Button
                variant="outline"
                className="rounded-2xl border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                onClick={() => {
                  setOpenExamPopup(false);
                  setShowCreateExam(true);
                }}
              >
                {t("createTest")}
              </Button>
            </div>

            <div className="px-4 overflow-y-auto space-y-3 flex-1 max-h-[430px]">
              {examsLoading && examsPagination.currentPage === 1 ? (
                <div className="text-center py-8 text-gray-500 flex flex-col items-center justify-center h-full">
                  <div className="w-10 h-10 mb-4">
                    <svg
                      className="animate-spin h-10 w-10"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  </div>
                  {t("loading")}
                </div>
              ) : !examsData?.exams?.filter(
                (exam: any) => !form.test.includes(String(exam.id))
              )?.length ? (
                <div className="text-center flex flex-col items-center justify-center h-full py-8">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg
                      className="h-8 w-8 text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-600">{t("noNewTestsToAdd")}</p>
                  <p className="text-gray-400 text-sm mt-1">
                    {t("allTestsAdded")}
                  </p>
                </div>
              ) : (
                <>
                  {examsData.exams
                    .filter((exam: any) => !form.test.includes(String(exam.id))) // Lọc ra những bài đã có trong form
                    .sort((a: any, b: any) => Number(a.id) - Number(b.id))
                    .map((exam: any) => (
                      <div
                        key={exam.id}
                        className={`p-4 border-2 rounded-2xl cursor-pointer transition-all duration-200 ${tempSelectedExams.includes(String(exam.id))
                            ? "border-blue-300 bg-blue-50"
                            : "border-gray-200 hover:border-blue-200 hover:bg-blue-25"
                          }`}
                        onClick={() => {
                          const idStr = String(exam.id);
                          // Toggle selection: nếu đã chọn thì bỏ chọn, nếu chưa chọn thì chọn
                          if (tempSelectedExams.includes(idStr)) {
                            setTempSelectedExams((prev) =>
                              prev.filter((id) => id !== idStr)
                            );
                            setTempSelectedExamsInfo((prev) => {
                              const newInfo = { ...prev };
                              delete newInfo[idStr];
                              return newInfo;
                            });
                          } else {
                            setTempSelectedExams((prev) => [...prev, idStr]);
                            setTempSelectedExamsInfo((prev) => ({
                              ...prev,
                              [idStr]: exam,
                            }));
                          }
                        }}
                      >
                        <div className="flex items-start sm:items-center gap-2 flex-col-reverse sm:flex-row justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {exam.name}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                              {exam.description || t("noDescription")}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-blue-100 text-blue-600 border-blue-200">
                              {t("test")}
                            </Badge>
                            {tempSelectedExams.includes(String(exam.id)) && (
                              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                <svg
                                  className="h-4 w-4 text-white"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </>
              )}
            </div>

            <div className="px-4 py-4 border-t border-gray-100 flex-shrink-0 bg-gray-50/50">
              <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end">
                <Button
                  variant="outline"
                  className="rounded-2xl border-gray-200 hover:border-gray-300"
                  onClick={() => setOpenExamPopup(false)}
                >
                  {t("cancel")}
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-6"
                  onClick={() => {
                    // Chỉ thêm những bài mới được chọn trong popup (kiểm tra trùng ID)
                    const currentExams = form.test;
                    const newExams = tempSelectedExams.filter(
                      (id) => !currentExams.includes(id)
                    );
                    const mergedExams = [...currentExams, ...newExams];
                    console.log("Current exams:", currentExams);
                    console.log("Temp selected exams:", tempSelectedExams);
                    console.log("New exams (filtered):", newExams);
                    console.log("Merged exams:", mergedExams);
                    setForm((f) => ({ ...f, test: mergedExams }));
                    setSelectedExamsInfo((prev) => ({
                      ...prev,
                      ...tempSelectedExamsInfo,
                    }));
                    setOpenExamPopup(false);
                    // Clear temp state khi xác nhận
                    setTempSelectedExams([]);
                    setTempSelectedExamsInfo({});
                  }}
                >
                  {t("addTests")} ({tempSelectedExams.length})
                </Button>
              </div>
            </div>

            {examsPagination.hasNextPage && (
              <div className="text-center pt-4 px-4 mt-auto border-t border-gray-100 flex-shrink-0 bg-gray-50/50">
                <Button
                  variant="outline"
                  className="rounded-2xl border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                  onClick={loadMoreExams}
                  disabled={examsLoading}
                >
                  {examsLoading ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      {t("loading")}
                    </>
                  ) : (
                    <>
                      {t("loadMore")} ({examsPagination.currentPage}/
                      {examsPagination.totalPages})
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog chọn từ vựng */}
      <Dialog
        open={openVocabularyPopup}
        onOpenChange={(open) => {
          setOpenVocabularyPopup(open);
          if (open) {
            // Khởi tạo temp state rỗng cho popup "add-only"
            setTempSelectedVocabularies([]);
            setTempSelectedVocabulariesInfo({});
          } else {
            setVocabularySearch("");
            setVocabulariesData(null);
            setVocabulariesPagination({
              currentPage: 1,
              totalPages: 1,
              totalItems: 0,
              hasNextPage: false,
              hasPrevPage: false,
            });
            // Clear temp khi đóng popup
            setTempSelectedVocabularies([]);
            setTempSelectedVocabulariesInfo({});
          }
        }}
      >
        <DialogContent className="max-w-4xl h-[720px] sm:h-[640px] overflow-hidden rounded-3xl border-0 shadow-xl flex flex-col">
          <DialogHeader className="pb-4 border-b border-gray-100 flex-shrink-0">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Chọn từ vựng
            </DialogTitle>
            <DialogDescription className="sr-only">
              Chọn từ vựng cho bài học từ thư viện
            </DialogDescription>
          </DialogHeader>

          <div className="px-4 pb-4 border-b border-gray-100 flex-shrink-0">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-4 w-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <Input
                placeholder="Tìm kiếm từ vựng..."
                className="pl-10 pr-4 py-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-purple-500"
                value={vocabularySearch}
                onChange={(e) => setVocabularySearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4">
            {vocabulariesLoading && vocabulariesPagination.currentPage === 1 ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-4"></div>
                <div className="text-gray-500">Đang tải từ vựng...</div>
              </div>
            ) : (
              <>
                {vocabulariesData?.vocabularies?.length > 0 ? (
                  vocabulariesData.vocabularies.map((vocab: any) => (
                    <div
                      key={vocab.id}
                      className={`flex items-center justify-between p-4 border border-gray-200 rounded-2xl mb-3 cursor-pointer transition-all hover:border-purple-300 hover:bg-purple-50/30 ${tempSelectedVocabularies.includes(String(vocab.id))
                          ? "bg-purple-50 border-purple-300"
                          : "bg-white"
                        }`}
                      onClick={() => {
                        const idStr = String(vocab.id);
                        if (tempSelectedVocabularies.includes(idStr)) {
                          setTempSelectedVocabularies((prev) =>
                            prev.filter((id) => id !== idStr)
                          );
                          setTempSelectedVocabulariesInfo((prev) => {
                            const newInfo = { ...prev };
                            delete newInfo[idStr];
                            return newInfo;
                          });
                        } else {
                          setTempSelectedVocabularies((prev) => [
                            ...prev,
                            idStr,
                          ]);
                          setTempSelectedVocabulariesInfo((prev) => ({
                            ...prev,
                            [idStr]: vocab,
                          }));
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center">
                          <svg
                            className="h-4 w-4 text-purple-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 4V2C7 1.45 7.45 1 8 1H16C16.55 1 17 1.45 17 2V4H20C20.55 4 21 4.45 21 5S20.55 6 20 6H19V19C19 20.1 18.1 21 17 21H7C5.9 21 5 20.1 5 19V6H4C3.45 6 3 5.55 3 5S3.45 4 4 4H7Z"
                            />
                          </svg>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {vocab.word}
                          </div>
                          <div className="text-sm text-gray-500">
                            {vocab.meaning || vocab.translation}
                          </div>
                          {vocab.phonetic && (
                            <div className="text-xs text-gray-400 mt-1">
                              {vocab.phonetic}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-purple-100 text-purple-800 border-purple-200 px-2 py-1 text-xs">
                          Từ vựng
                        </Badge>
                        {tempSelectedVocabularies.includes(
                          String(vocab.id)
                        ) && (
                            <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                              <svg
                                className="h-4 w-4 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </div>
                          )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="h-8 w-8 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 4V2C7 1.45 7.45 1 8 1H16C16.55 1 17 1.45 17 2V4H20C20.55 4 21 4.45 21 5S20.55 6 20 6H19V19C19 20.1 18.1 21 17 21H7C5.9 21 5 20.1 5 19V6H4C3.45 6 3 5.55 3 5S3.45 4 4 4H7Z"
                        />
                      </svg>
                    </div>
                    <div className="text-gray-500 text-lg">
                      {vocabularySearch
                        ? "Không tìm thấy từ vựng nào"
                        : "Chưa có từ vựng nào"}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="px-4 py-4 border-t border-gray-100 flex-shrink-0 bg-gray-50/50">
            <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end">
              <Button
                variant="outline"
                className="rounded-2xl border-gray-200 hover:border-gray-300"
                onClick={() => setOpenVocabularyPopup(false)}
              >
                Hủy
              </Button>
              <Button
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-2xl px-6"
                onClick={() => {
                  // Chỉ thêm những từ vựng mới được chọn trong popup (kiểm tra trùng ID)
                  const currentVocabs = form.vocabularies;
                  const newVocabs = tempSelectedVocabularies.filter(
                    (id) => !currentVocabs.includes(id)
                  );
                  const mergedVocabs = [...currentVocabs, ...newVocabs];
                  console.log("Current vocabularies:", currentVocabs);
                  console.log(
                    "Temp selected vocabularies:",
                    tempSelectedVocabularies
                  );
                  console.log("New vocabularies (filtered):", newVocabs);
                  console.log("Merged vocabularies:", mergedVocabs);
                  setForm((f) => ({ ...f, vocabularies: mergedVocabs }));
                  setSelectedVocabulariesInfo((prev) => ({
                    ...prev,
                    ...tempSelectedVocabulariesInfo,
                  }));
                  setOpenVocabularyPopup(false);
                  // Clear temp state khi xác nhận
                  setTempSelectedVocabularies([]);
                  setTempSelectedVocabulariesInfo({});
                }}
              >
                Thêm từ vựng ({tempSelectedVocabularies.length})
              </Button>
            </div>
          </div>

          {vocabulariesPagination.hasNextPage && (
            <div className="text-center pt-4 px-4 mt-auto border-t border-gray-100 flex-shrink-0 bg-gray-50/50">
              <Button
                variant="outline"
                className="rounded-2xl border-gray-200 hover:border-purple-300 hover:bg-purple-50"
                onClick={() => {
                  // Load more vocabularies
                  if (!vocabulariesLoading) {
                    loadVocabularies(
                      debouncedVocabularySearch,
                      vocabulariesPagination.currentPage + 1
                    );
                  }
                }}
                disabled={vocabulariesLoading}
              >
                {vocabulariesLoading ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Đang tải...
                  </>
                ) : (
                  <>
                    Tải thêm ({vocabulariesPagination.currentPage}/
                    {vocabulariesPagination.totalPages})
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Button Tạo bài học cho popup modal */}
      {hideSidebar && (
        <div className="sticky bottom-0 bg-white border-t border-gray-100 p-6 flex justify-end gap-3 mt-6">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              className="rounded-2xl border-gray-200 hover:border-gray-300"
              onClick={onCancel}
              disabled={loading}
            >
              {t("cancel")}
            </Button>
          )}
          <Button
            type="button"
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl px-8"
            onClick={() => {
              handleSubmit();
            }}
            disabled={loading}
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                {t("creating")}
              </>
            ) : (
              t("createLesson")
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
