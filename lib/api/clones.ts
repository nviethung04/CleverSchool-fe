import axiosInstance from "./axios";

export interface CloneRequestBody {
  name: string;
  lesson_id?: number | string;
  description?: string;
}

export interface CloneResponse<T> {
  code: number;
  message: string;
  data: T;
  error: string;
}

// Homework shape aligns with SingleHomeworkResponse.data in homeworks.ts
export interface ClonedHomework {
  "@type": string;
  id: string | number;
  lesson_id: string | number;
  name: string;
  status: number;
  description: string;
  max_score: number;
  cover_image: string;
  created_at: string;
  created_by: string | number;
  updated_at: string;
  updated_by: string | number;
  is_assigned?: boolean;
  total_questions: number;
  question_completed: number;
  last_question_id_completed: number | string;
}

// Exam shape aligns with SingleExamResponse.data in exams.ts
export interface ClonedExam {
  "@type": string;
  id: string | number;
  name: string;
  lesson_id: string | number;
  status: number;
  time_limit?: number | string;
  max_score: number;
  description: string;
  cover_image: string;
  created_at: string;
  created_by: string | number;
  updated_at: string;
  updated_by: string | number;
  deleted_at?: string | number;
  deleted_by?: string | number;
  deadline?: string;
  is_assigned?: boolean;
  total_questions?: number;
}

export interface ClonedExercise {
  "@type": string;
  id: string | number;
  name: string;
  lesson_id: string | number;
  status: number;
  time_limit?: number | string;
  max_score: number;
  description: string;
  cover_image: string;
  created_at: string;
  created_by: string | number;
  updated_at: string;
  updated_by: string | number;
  deleted_at?: string | number;
  deleted_by?: string | number;
  deadline?: string;
  is_assigned?: boolean;
  total_questions?: number;
}

export async function CloneHomework(
  id: string | number,
  body: CloneRequestBody
): Promise<CloneResponse<ClonedHomework>> {
  const response = await axiosInstance.post(
    `/manage/homeworks/${id}/cloned`,
    body
  );
  return response.data as CloneResponse<ClonedHomework>;
}

export async function CloneExam(
  id: string | number,
  body: CloneRequestBody
): Promise<CloneResponse<ClonedExam>> {
  const response = await axiosInstance.post(`/manage/exams/${id}/cloned`, body);
  return response.data as CloneResponse<ClonedExam>;
}

export async function CloneExercise(
  id: string | number,
  body: CloneRequestBody
): Promise<CloneResponse<ClonedExercise>> {
  const response = await axiosInstance.post(`/manage/exercises/${id}/cloned`, body);
  return response.data as CloneResponse<ClonedExercise>;
}