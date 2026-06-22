import axiosInstance from "./axios";

// Type definitions for Study Report
export interface StudyReportStarSkillType {
  id: string;
  name_vn: string;
  name_en: string;
  star: number;
  node_types?: StudyReportStarSkillType[];
}

export interface StudyReportStarSkill {
  id: string;
  name_vn: string;
  name_en: string;
  average_star: number;
  types: StudyReportStarSkillType[];
}

export interface StudyReportCheckSkillType {
  id: string;
  name_vn: string;
  name_en: string;
  is_check: boolean;
  node_types?: StudyReportCheckSkillType[];
}

export interface StudyReportCheckSkill {
  id: string;
  name_vn: string;
  name_en: string;
  types: StudyReportCheckSkillType[];
}

export interface StudyReportNote {
  value: number;
  text: string;
}

export interface StudentInfo {
  id: string;
  name: string;
  class: string;
}

export interface TeacherInfo {
  id: string;
  name: string;
}

export interface CourseInfo {
  id: string;
  name: string;
  program: string;
  id_program: string;
}

export interface StudyReport {
  id: string;
  name: string;
  description: string;
  subject_id: string;
  study_report_criteria_id: string;
  course_id: string;
  student_id: string;
  teacher_id: string;
  general_comment: string;
  total_star: number;
  avg_star: number;
  type: string;
  type_value: string;
  is_completed: boolean;
  max_star: number;
  created_at: string;
  updated_at: string;
  star_skills: StudyReportStarSkill[];
  check_skills: StudyReportCheckSkill[];
  student_info: StudentInfo;
  teacher_info: TeacherInfo;
  course_info: CourseInfo;
  notes: StudyReportNote[];
}

export interface StudyReportResponseData {
  id: string;
  name: string;
  description: string;
  subject_id: string;
  study_report_criteria_id: string;
  course_id: string;
  student_id: string;
  teacher_id: string;
  general_comment: string;
  total_star: number;
  avg_star: number;
  type: string;
  type_value: string;
  is_completed: boolean;
  max_star: number;
  created_at: string;
  updated_at: string;
  star_skills: StudyReportStarSkill[];
  check_skills: StudyReportCheckSkill[];
  student_info: StudentInfo;
  teacher_info: TeacherInfo;
  course_info: CourseInfo;
  notes: StudyReportNote[];
}

export interface StudyReportResponse {
  code: number;
  message: string;
  data: StudyReportResponseData;
  error: string;
}

// Request type for PUT (update) – same structure as StudyReportResponseData
export type UpdateStudyReportRequest = StudyReportResponseData;

export interface StudyReportsListParams {
  subject_id?: string | number;
  course_id?: string | number;
  assessment_id?: string | number;
  page?: number;
  per_page?: number;
}

export interface StudyReportsListResponseData {
  "@type"?: string;
  study_reports?: StudyReportResponseData[];
  total_count?: string;
  page?: number;
  per_page?: number;
  total_pages?: number;
}

export interface StudyReportsListResponse {
  code: number;
  message: string;
  data:
    | StudyReportResponseData
    | StudyReportResponseData[]
    | StudyReportsListResponseData;
  error: string;
}

// Request types for POST
export interface CreateStudyReportStarSkillTypeRequest {
  id: number;
  star: number;
  node_types?: CreateStudyReportStarSkillTypeRequest[];
}

export interface CreateStudyReportStarSkillRequest {
  id: number;
  types: CreateStudyReportStarSkillTypeRequest[];
}

export interface CreateStudyReportCheckSkillTypeRequest {
  id: number;
  is_check: boolean;
  node_types?: CreateStudyReportCheckSkillTypeRequest[];
}

export interface CreateStudyReportCheckSkillRequest {
  id: number;
  types: CreateStudyReportCheckSkillTypeRequest[];
}

export interface CreateStudyReportRequest {
  study_report_criteria_id: number;
  subject_id: number;
  assessment_id: number;
  student_id: number;
  teacher_id: number;
  course_id: number;
  general_comment: string;
  is_completed: boolean;
  star_skills: CreateStudyReportStarSkillRequest[];
  check_skills: CreateStudyReportCheckSkillRequest[];
}

// Evaluate types
export interface StudyReportEvaluateStarSkillType {
  id: string;
  name_vn: string;
  name_en: string;
  star: number;
}

export interface StudyReportEvaluateStarSkill {
  id: string;
  name_vn: string;
  name_en: string;
  average_star: number;
  types: StudyReportEvaluateStarSkillType[];
}

export interface StudyReportEvaluateCheckSkillType {
  id: string;
  name_vn: string;
  name_en: string;
  is_check: boolean;
}

export interface StudyReportEvaluateCheckSkill {
  id: string;
  name_vn: string;
  name_en: string;
  types: StudyReportEvaluateCheckSkillType[];
}

export interface StudyReportEvaluateItem {
  student_id: string;
  student_name: string;
  course_id: string;
  course_name: string;
  report_id: string;
  report_name: string;
  type: string;
  type_value: string;
  is_completed: boolean;
  criteria_count: number;
  evaluated_criteria: number;
  has_general_comment: boolean;
  general_comment: string;
  assessment_id?: string;
  assessment_score_id?: string;
  star_skills?: StudyReportEvaluateStarSkill[];
  check_skills?: StudyReportEvaluateCheckSkill[];
  total_star?: number;
  avg_star?: number;
}

export interface StudyReportEvaluateResponseData {
  "@type": "type.googleapis.com/prot.StudyReportEvaluateResponse";
  items: StudyReportEvaluateItem[];
  publish: boolean;
  total_count: string;
}

export interface StudyReportEvaluateResponse {
  code: number;
  message: string;
  data: StudyReportEvaluateResponseData;
  error: string;
}

export interface StudyReportEvaluatesParams {
  assessment_id?: string | number | null;
  is_completed?: boolean;
}

export interface PublishStudyReportRequest {
  course_id: number;
  assessment_id: number;
  publish: boolean;
}

// API Functions
/**
 * Get list of study reports
 * @param params - Query parameters (subject_id, course_id, assessment_id, page, per_page)
 * @returns Promise with study reports list or single study report
 */
export async function GetStudyReports(
  params?: StudyReportsListParams
): Promise<StudyReportsListResponse> {
  try {
    const queryParams: Record<string, any> = {};
    if (params?.subject_id !== undefined) {
      queryParams.subject_id = params.subject_id;
    }
    if (params?.course_id !== undefined) {
      queryParams.course_id = params.course_id;
    }
    if (params?.assessment_id !== undefined) {
      queryParams.assessment_id = params.assessment_id;
    }
    if (params?.page !== undefined) {
      queryParams.page = params.page;
    }
    if (params?.per_page !== undefined) {
      queryParams.per_page = params.per_page;
    }

    const response = await axiosInstance.get("/manage/study-reports", {
      params: queryParams,
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return {
        code: 200,
        message: "success",
        data: { study_reports: [] },
        error: "",
      } as StudyReportsListResponse;
    }

    console.error("Error fetching study reports:", error);

    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
      console.error("Response headers:", error.response.headers);
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Error setting up request:", error.message);
    }

    throw error;
  }
}

/**
 * Get study report detail by ID
 * @param id - Study report ID
 * @returns Promise with study report detail
 */
export async function GetStudyReportDetail(
  id: string | number
): Promise<StudyReportResponse> {
  try {
    const response = await axiosInstance.get(`/manage/study-reports/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(`Error fetching study report detail with ID ${id}:`, error);

    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
      console.error("Response headers:", error.response.headers);
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Error setting up request:", error.message);
    }

    throw error;
  }
}

/**
 * Create a new study report
 * @param data - Study report data
 * @returns Promise with created study report
 */
export async function CreateStudyReport(
  data: CreateStudyReportRequest
): Promise<StudyReportResponse> {
  try {
    const response = await axiosInstance.post("/manage/study-reports", data);
    return response.data;
  } catch (error: any) {
    console.error("Error creating study report:", error);

    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
      console.error("Response headers:", error.response.headers);
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Error setting up request:", error.message);
    }

    throw error;
  }
}

/**
 * Update an existing study report
 * @param id - Study report ID (path param)
 * @param data - Study report data (same structure as StudyReportResponseData)
 * @returns Promise with updated study report
 */
export async function UpdateStudyReport(
  id: string | number,
  data: UpdateStudyReportRequest
): Promise<StudyReportResponse> {
  try {
    const response = await axiosInstance.put(
      `/manage/study-reports/${id}`,
      data
    );
    return response.data;
  } catch (error: any) {
    console.error(`Error updating study report with ID ${id}:`, error);

    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
      console.error("Response headers:", error.response.headers);
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Error setting up request:", error.message);
    }

    throw error;
  }
}

/**
 * Get study report evaluates for a course
 * @param courseId - Course ID (in path)
 * @param params - Query parameters (assessment_id, is_completed)
 * @returns Promise with study report evaluates list
 */
export async function GetStudyReportEvaluates(
  courseId: string | number,
  params: StudyReportEvaluatesParams
): Promise<StudyReportEvaluateResponse> {
  try {
    const queryParams: Record<string, any> = {};

    // Chỉ thêm assessment_id nếu có giá trị hợp lệ
    if (
      params.assessment_id !== undefined &&
      params.assessment_id !== null &&
      params.assessment_id !== ""
    ) {
      queryParams.assessment_id = params.assessment_id;
    }

    if (params.is_completed !== undefined) {
      queryParams.is_completed = params.is_completed;
    }

    const response = await axiosInstance.get(
      `/manage/study-reports/evaluates/${courseId}`,
      {
        params: queryParams,
      }
    );
    return response.data;
  } catch (error: any) {
    console.error(`Error fetching study report evaluates for course:`, error);

    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
      console.error("Response headers:", error.response.headers);
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Error setting up request:", error.message);
    }

    throw error;
  }
}

/**
 * Publish or unpublish study report
 * @param data - Publish study report data (course_id, assessment_id, publish)
 * @returns Promise with response
 */
export async function PublishStudyReport(
  data: PublishStudyReportRequest
): Promise<any> {
  try {
    const response = await axiosInstance.put(
      "/manage/publish-study-report",
      data
    );
    return response.data;
  } catch (error: any) {
    console.error("Error publishing study report:", error);

    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
      console.error("Response headers:", error.response.headers);
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Error setting up request:", error.message);
    }

    throw error;
  }
}
