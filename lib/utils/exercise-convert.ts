import { ExerciseQuestion, ExerciseOverview } from "@/lib/api/exercises";

export interface DisplayQuestion {
  questionId: string;
  questionType: string;
  questionText: string;
  questionMedia?: { type: "image" | "video" | "audio"; url: string };
  questionPoints: number;
  studentAnswer: any;
  options?: any[];
  is_all_correct?: boolean;
  score?: number;
  feedback?: string;
}

export interface DisplayExerciseResult {
  id: string;
  exerciseId: string;
  exerciseTitle: string;
  studentId: string;
  studentName: string;
  submittedAt: string;
  timeSpent: number;
  status: "submitted" | "graded";
  totalQuestions: number;
  totalScore: number;
  maxScore?: number;
  percentage?: number;
  answers: DisplayQuestion[];
  feedback?: string;
  overview?: ExerciseOverview;
  ratio?: number;
}

export function convertApiDataToDisplay(
  apiData: ExerciseQuestion[],
  overview: ExerciseOverview,
  exerciseId: string,
  options?: { includeFeedback?: boolean; includePercentage?: boolean }
): DisplayExerciseResult {
  const answers: DisplayQuestion[] = apiData.map((question) => {
    let studentAnswer: any = {};
    let options: any[] = [];
    let isCorrect = false;
    let score = 0;
    let is_all_correct: boolean | undefined = undefined;

    switch (question.type) {
      case "multiple_choice":
        if (question.answer_multiple_choice) {
          const mc = question.answer_multiple_choice;
          studentAnswer = {
            selectedAnswers: mc.answers || [],
            correctAnswers: mc.true_answers || [],
            is_all_correct: mc.is_all_correct,
          };
          options =
            mc.all_answer_contents?.map((content: string, idx: number) => ({
              content,
              file_url: mc.all_answer_file_urls?.[idx] || "",
              kind: mc.all_answer_kinds?.[idx] || "text",
            })) || [];
          score = mc.score;
          is_all_correct = mc.is_all_correct;
        }
        break;
      case "fill_in_blanks":
        if (question.answer_fill_in_blank) {
          const fib = question.answer_fill_in_blank;
          studentAnswer = {
            blanks:
              fib.answers?.map((a: any) => ({
                answer: a.answer,
                correctAnswer: a.true_answer,
                isCorrect: a.is_correct,
                score: a.score,
              })) || [],
            is_all_correct: fib.is_all_correct,
          };
          isCorrect = fib.answers?.every((a) => a.is_correct);
          score = fib.answers?.reduce((sum, a) => sum + a.score, 0);
          is_all_correct = fib.is_all_correct;
        }
        break;
      case "drag_drop":
        if (question.answer_position) {
          const dd = question.answer_position;
          const correctCount =
            dd.answers?.filter((a: any) => a.is_correct).length || 0;
          const totalCount = dd.answers?.length || 0;
          studentAnswer = {
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
            is_all_correct: dd.is_all_correct,
          };
          is_all_correct = dd.is_all_correct;
        }
        break;
      case "ordering":
        if (question.answer_position) {
          const ord = question.answer_position;
          const correctCount =
            ord.answers?.filter((a: any) => a.is_correct).length || 0;
          const totalCount = ord.answers?.length || 0;
          studentAnswer = {
            positions:
              ord.answers?.map((a: any) => ({
                position: a.sort_position,
                content: a.answer_content,
                isCorrect: a.is_correct,
              })) || [],
            correctCount,
            totalCount,
            is_all_correct: ord.is_all_correct,
          };
          is_all_correct = ord.is_all_correct;
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
          studentAnswer = {
            groups,
            correctCount,
            totalCount,
            is_all_correct: cat.is_all_correct,
          };
          is_all_correct = cat.is_all_correct;
          return {
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
            questionPoints: 10,
            studentAnswer,
            options,
            is_all_correct,
            score,
            feedback: options?.includeFeedback
              ? overview.comment || ""
              : undefined,
          };
        }
        break;
      case "labeling":
        if (question.answer_labeling) {
          const lab = question.answer_labeling;
          const correctCount =
            lab.answers?.filter((a: any) => a.is_correct).length || 0;
          const totalCount = lab.answers?.length || 0;
          studentAnswer = {
            labels: lab.answers || [],
            correctCount,
            totalCount,
            is_all_correct: lab.is_all_correct,
          };
          is_all_correct = lab.is_all_correct;
        }
        break;
      case "matching":
        if (question.answer_matching) {
          const mat = question.answer_matching;
          const correctCount =
            mat.matches?.filter((m: any) => m.is_correct).length || 0;
          const totalCount = mat.matches?.length || 0;
          studentAnswer = {
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
            is_all_correct: mat.is_all_correct,
          };
          is_all_correct = mat.is_all_correct;
        }
        break;
      case "writing":
        if (question.answer_manual) {
          const manual = question.answer_manual;
          studentAnswer = {
            text: manual.answer || manual.answer_text || "",
            fileUrl: manual.answer_file_url || "",
            score: manual.score || 0,
            isScored: manual.is_scored || false,
          };
        }
        break;
      case "speaking":
        if (question.answer_manual) {
          const manual = question.answer_manual;
          studentAnswer = {
            text: manual.answer || manual.answer_text || "",
            fileUrl: manual.answer_file_url || "",
            duration: 120,
            score: manual.score || 0,
            isScored: manual.is_scored || false,
          };
        }
        break;
      default:
        studentAnswer = {};
    }
    return {
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
      questionPoints: 10,
      studentAnswer,
      options,
      is_all_correct,
      score,
      feedback: options?.includeFeedback ? overview.comment || "" : undefined,
    };
  });
  return {
    id: `display_${exerciseId}`,
    exerciseId,
    exerciseTitle: "Bài kiểm tra",
    studentId: "current_student",
    studentName: overview.student_name || "Học sinh",
    submittedAt: new Date(
      (Number.parseInt(overview.submitted_at) || 0) * 1000
    ).toISOString(),
    timeSpent: Number.parseInt(overview.duration) || 0,
    status: "submitted",
    totalQuestions: overview.total_questions,
    totalScore: typeof overview.ratio === "number" ? overview.ratio : 0,
    maxScore: 100,
    percentage: typeof overview.ratio === "number" ? overview.ratio : 0,
    answers,
    feedback: options?.includeFeedback ? overview.comment || "" : undefined,
    overview,
    ratio: overview.ratio,
  };
}
