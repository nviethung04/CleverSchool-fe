import axiosInstance from "./axios";
import { Course } from "./students";

// Interface cho file info
export interface FileInfo {
  id: number;
  disk: string;
  path: string;
}

// Interface cho bài kiểm tra đánh giá
export interface Assessment {
  id: string | number;
  name: string;
  description: string;
  type: string;
  program_id: string | number;
  created_at: string;
  created_by: string | number;
  updated_at: string;
  updated_by: string | number;
  criteria?: any[];
  file_infos?: FileInfo[];
  files?: string[];
  assessment_criteria_group_id?: number;
  study_report_criteria_id?: number;
  assessment_criteria_ids?: number[];
  subject_id?: number;
  lesson_id?: string | number;
  lesson_title?: string;
}

// Interface cho response của API
interface AssessmentResponse {
  code: number;
  message: string;
  data: {
    "@type": string;
    assessments: Assessment[];
    total: number | string;
  };
  error: string;
}

// Interface cho tham số lọc
export interface AssessmentFilters {
  keyword?: string;
  type?: string;
  page?: number;
  limit?: number;
  // Bổ sung filter theo môn học và khóa học
  subject_id?: string | number;
  course_id?: string | number;
  class_main_id?: string | number;
  grade_id?: string | number;
}

// Interface cho request tạo assessment
export interface CreateAssessmentRequest {
  name: string;
  description: string;
  type: string;
  program_id: number;
  assessment_criteria_group_id?: number;
  study_report_criteria_id?: number;
  assessment_criteria_ids?: number[];
  subject_id?: number;
  file_infos?: FileInfo[];
  files?: string[];
}

// Interface cho response detail
interface AssessmentDetailResponse {
  code: number;
  message: string;
  data: {
    "@type": string;
    id: string;
    name: string;
    description: string;
    type: string;
    program_id: string;
    created_at: string;
    created_by: string;
    updated_at: string;
    updated_by: string;
    criteria: any[];
    file_infos: FileInfo[];
    files: string[];
    assessment_criteria_group_id?: number | string;
    study_report_criteria_id?: number | string;
    assessment_criteria_ids?: number[];
    subject_id?: number | string;
  };
  error: string;
}

export interface PublishAssessmentScoreRequest {
  course_id: number;
  assessment_id: number;
  publish: boolean;
}

export interface GetPublishAssessmentScoreParams {
  course_id: string | number;
  assessment_id: string | number;
}

export interface GetPublishAssessmentScoreResponse {
  code: number;
  message: string;
  data: {
    "@type": string;
    course_id: string;
    assessment_id: string;
    publish: boolean;
  };
  error: string;
}

/**
 * Lấy danh sách bài kiểm tra đánh giá với bộ lọc
 */
export async function GetAssessmentList(
  filters: AssessmentFilters = {}
): Promise<{
  assessment: Assessment[];
  totalPages: number;
  page: number;
  total: number;
}> {
  try {
    const response = await axiosInstance.get("/manage/assessments", {
      params: filters,
    });

    const data = response.data as AssessmentResponse;

    if (data.code === 200 && data.data) {
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const totalCount =
        typeof data.data.total === "string"
          ? Number.parseInt(data.data.total)
          : data.data.total;
      const totalPages = Math.ceil(totalCount / limit);

      return {
        assessment: data.data.assessments,
        totalPages,
        page,
        total: totalCount,
      };
    } else {
      throw new Error(data.message || data.error);
    }
  } catch (error: any) {
    if (error.response?.status === 404) {
      console.warn(
        "Assessments API is not available on the backend (404). Returning empty list."
      );
      const page = filters.page || 1;
      return {
        assessment: [],
        totalPages: 0,
        page,
        total: 0,
      };
    }

    console.error("Error fetching assessment:", error);
    throw error;
  }
}

/**
 * Danh sách bài kiểm tra đánh giá cho học sinh (báo cáo tiến độ).
 * Endpoint: GET /dashboard/student/assessment-list
 */
export async function GetStudentAssessmentList(
  filters: AssessmentFilters = {}
): Promise<{
  assessment: Assessment[];
  totalPages: number;
  page: number;
  total: number;
}> {
  try {
    const response = await axiosInstance.get("/dashboard/student/assessment-list", {
      params: filters,
    });

    const data = response.data as AssessmentResponse;

    if (data.code === 200 && data.data) {
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const totalCount =
        typeof data.data.total === "string"
          ? Number.parseInt(data.data.total)
          : data.data.total;
      const totalPages = Math.ceil(totalCount / limit);

      return {
        assessment: data.data.assessments,
        totalPages,
        page,
        total: totalCount,
      };
    }

    throw new Error(data.message || data.error);
  } catch (error: any) {
    if (error.response?.status === 404) {
      console.warn(
        "Student assessment list API is not available (404). Returning empty list."
      );
      const page = filters.page || 1;
      return {
        assessment: [],
        totalPages: 0,
        page,
        total: 0,
      };
    }

    console.error("Error fetching student assessment list:", error);
    throw error;
  }
}

/**
 * Tạo bài kiểm tra đánh giá mới
 */
function parseNumberValue(value: any): number | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

export async function CreateAssessment(
  request: CreateAssessmentRequest
): Promise<Assessment> {
  try {
    const response = await axiosInstance.post("/manage/assessments", request);
    const data = response.data as AssessmentDetailResponse;

    if (data.code === 200 && data.data) {
      return {
        id: data.data.id,
        name: data.data.name,
        description: data.data.description,
        type: data.data.type,
        program_id: data.data.program_id,
        created_at: data.data.created_at,
        created_by: data.data.created_by,
        updated_at: data.data.updated_at,
        updated_by: data.data.updated_by,
        criteria: data.data.criteria,
        file_infos: data.data.file_infos,
        files: data.data.files,
        assessment_criteria_group_id: parseNumberValue(
          data.data.assessment_criteria_group_id
        ),
        study_report_criteria_id: parseNumberValue(
          data.data.study_report_criteria_id
        ),
        assessment_criteria_ids: data.data.assessment_criteria_ids || [],
        subject_id: parseNumberValue(data.data.subject_id),
      };
    } else {
      throw new Error(data.message || data.error);
    }
  } catch (error: any) {
    console.error("Error creating assessment:", error);

    // Log chi tiết lỗi
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
 * Lấy chi tiết bài kiểm tra đánh giá
 */
export async function GetAssessmentDetail(
  id: string | number
): Promise<Assessment> {
  try {
    const response = await axiosInstance.get(`/manage/assessments/${id}`);
    const data = response.data as AssessmentDetailResponse;

    if (data.code === 200 && data.data) {
      return {
        id: data.data.id,
        name: data.data.name,
        description: data.data.description,
        type: data.data.type,
        program_id: data.data.program_id,
        created_at: data.data.created_at,
        created_by: data.data.created_by,
        updated_at: data.data.updated_at,
        updated_by: data.data.updated_by,
        criteria: data.data.criteria,
        file_infos: data.data.file_infos,
        files: data.data.files,
        assessment_criteria_group_id: parseNumberValue(
          data.data.assessment_criteria_group_id
        ),
        study_report_criteria_id: parseNumberValue(
          data.data.study_report_criteria_id
        ),
        assessment_criteria_ids: data.data.assessment_criteria_ids || [],
        subject_id: parseNumberValue(data.data.subject_id),
      };
    } else {
      throw new Error(data.message || data.error);
    }
  } catch (error: any) {
    console.error(`Error fetching assessment detail with ID ${id}:`, error);

    // Log chi tiết lỗi
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
 * Xóa bài kiểm tra đánh giá
 */
export async function DeleteAssessment(id: string | number): Promise<boolean> {
  try {
    const response = await axiosInstance.delete(`/manage/assessments/${id}`);
    const data = response.data;

    if (data.code === 200) {
      return true;
    } else {
      throw new Error(data.message || data.error);
    }
  } catch (error: any) {
    console.error(`Error deleting assessment with ID ${id}:`, error);

    // Log chi tiết lỗi
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
 * Cập nhật bài kiểm tra đánh giá
 */
export async function UpdateAssessment(
  id: string | number,
  request: CreateAssessmentRequest
): Promise<Assessment> {
  try {
    const response = await axiosInstance.put(
      `/manage/assessments/${id}`,
      request
    );
    const data = response.data as AssessmentDetailResponse;

    if (data.code === 200 && data.data) {
      return {
        id: data.data.id,
        name: data.data.name,
        description: data.data.description,
        type: data.data.type,
        program_id: data.data.program_id,
        created_at: data.data.created_at,
        created_by: data.data.created_by,
        updated_at: data.data.updated_at,
        updated_by: data.data.updated_by,
        criteria: data.data.criteria,
        file_infos: data.data.file_infos,
        files: data.data.files,
        assessment_criteria_group_id: parseNumberValue(
          data.data.assessment_criteria_group_id
        ),
        study_report_criteria_id: parseNumberValue(
          data.data.study_report_criteria_id
        ),
        assessment_criteria_ids: data.data.assessment_criteria_ids || [],
        subject_id: parseNumberValue(data.data.subject_id),
      };
    } else {
      throw new Error(data.message || data.error);
    }
  } catch (error: any) {
    console.error(`Error updating assessment with ID ${id}:`, error);

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
export interface AssessmentStudentCriterionSub {
  id: string;
  name: string;
  description: string;
  max_score: number;
  score: number;
}

export interface AssessmentStudentCriterion {
  id: string;
  subject_id: string;
  name: string;
  description: string;
  has_subcriteria: boolean;
  max_score: number;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  subcriteria: AssessmentStudentCriterionSub[];
  score: number;
}

export interface AssessmentStudentAssessment {
  id: string;
  name: string;
  description: string;
  type: string;
  program_id: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  file_infos: FileInfo[];
  files: string[];
  study_report_criteria_id: string;
  subject_id: string;
  assessment_criteria_group_id: string;
  assessment_criteria_group_name: string;
  study_report_criteria_name: string;
  subject_name: string;
  criteria: AssessmentStudentCriterion[];
  lesson_id?: string;
  lesson_title?: string;
  is_assigned?: boolean;
  has_file: boolean;
}

export interface CourseInfo {
  name: string;
  teacher_names: string;
  object_title: string;
}
export interface AssessmentStudentItem {
  student_id: string;
  student_name: string;
  assessment: AssessmentStudentAssessment;
  total_score: number;
  files: string[];
  is_scored: boolean;
  file_infos?: FileInfo[];
}

export interface AssessmentStudentListResponseData {
  "@type": string;
  students: AssessmentStudentItem[];
  total: string;
  course_info: CourseInfo;
}

export interface AssessmentStudentListResponse {
  code: number;
  message: string;
  data: AssessmentStudentListResponseData;
  error: string;
}

export interface AssessmentStudentsParams {
  course_id: string | number;
  assessment_id: string | number;
  student_id?: string | number;
  page?: number;
  limit?: number;
  get_score: boolean;
}

/**
 * Lấy danh sách học sinh theo bài kiểm tra đánh giá cho giáo viên
 * Endpoint: GET /dashboard/teacher/assessment/students
 */
export async function GetAssessmentStudents(
  params: AssessmentStudentsParams
): Promise<AssessmentStudentListResponse> {
  try {
    const response = await axiosInstance.get(
      "/dashboard/teacher/assessment/students",
      {
        params,
      }
    );
    return response.data as AssessmentStudentListResponse;
  } catch (error: any) {
    console.error(
      "Error fetching teacher assessment students with params:",
      params,
      error
    );

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

export interface AssessmentSaveScoreSubcriteriaRequest {
  subcriteria_id: number;
  score: number;
}

export interface AssessmentSaveScoreCriteriaRequest {
  criteria_id: number;
  score: number;
  subcriteria: AssessmentSaveScoreSubcriteriaRequest[];
}

export interface AssessmentSaveScoreStudentRequest {
  user_id: number;
  file_infos?: FileInfo[];
  criteria: AssessmentSaveScoreCriteriaRequest[];
}

export interface AssessmentSaveScoreBulkRequest {
  assessment_id: number;
  course_id: number;
  students: AssessmentSaveScoreStudentRequest[];
}

export interface AssessmentSaveScoreBulkResponseData {
  message: string;
}

export interface AssessmentSaveScoreBulkResponse {
  code: number;
  data: AssessmentSaveScoreBulkResponseData;
  message: string;
}

/**
 * Lưu điểm hàng loạt cho học sinh trong một bài kiểm tra
 * Endpoint: POST /assessments/save-score/bulk
 */
export async function SaveAssessmentScoresBulk(
  payload: AssessmentSaveScoreBulkRequest
): Promise<AssessmentSaveScoreBulkResponse> {
  try {
    const response = await axiosInstance.post(
      "/assessments/save-score/bulk",
      payload
    );
    return response.data as AssessmentSaveScoreBulkResponse;
  } catch (error: any) {
    console.error(
      "Error saving assessment scores in bulk with payload:",
      payload,
      error
    );

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

// Interface cho assessment item trong student dashboard
export interface DashboardStudentAssessmentItem {
  assessment: AssessmentStudentAssessment;
  is_scored: boolean;
  total_score: number;
  files: string[];
}

// Interface cho response của student dashboard assessments
export interface DashboardStudentAssessmentListResponseData {
  "@type": string;
  assessments: DashboardStudentAssessmentItem[];
  total: string;
}

export interface DashboardStudentAssessmentListResponse {
  code: number;
  message: string;
  data: DashboardStudentAssessmentListResponseData;
  error: string;
}

// Interface cho params của student dashboard assessments
export interface DashboardStudentAssessmentParams {
  course_id?: string | number;
  assessment_id?: string | number;
  page?: number;
  limit?: number;
}

/**
 * Lấy danh sách bài kiểm tra đánh giá cho học sinh từ dashboard
 * Endpoint: GET /dashboard/student/assessments
 */
export async function GetDashboardStudentAssessments(
  params: DashboardStudentAssessmentParams = {}
): Promise<DashboardStudentAssessmentListResponse> {
  try {
    const response = await axiosInstance.get("/dashboard/student/assessments", {
      params,
    });
    return response.data as DashboardStudentAssessmentListResponse;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return {
        code: 200,
        message: "success",
        data: {
          "@type": "type.googleapis.com/prot.DashboardStudentAssessmentListResponse",
          assessments: [],
          total: "0",
        },
        error: "",
      };
    }

    console.error(
      "Error fetching student dashboard assessments with params:",
      params,
      error
    );

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
 * Xuất file Excel mẫu cho bài kiểm tra đánh giá
 * Endpoint: GET /manage/assessments/export-excel
 */
export async function ExportAssessmentExcel({
  course_ids,
  assessment_id,
}: {
  course_ids: string;
  assessment_id: string | number;
}) {
  try {
    const response = await axiosInstance.get(
      "/manage/assessments/export-excel",
      {
        params: {
          course_ids,
          assessment_id,
        },
        responseType: "blob",
      }
    );
    return response.data;
  } catch (error: any) {
    if (error.response) {
      console.error("Response data:", error.response.data);
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Error setting up request:", error.message);
    }

    throw error;
  }
}

// Interface cho params của assessment report
export interface AssessmentReportParams {
  class_main_id: string | number;
  assessment_id: string | number;
  get_score?: boolean;
  get_study_report_criteria?: boolean;
  student_id?: string | number;
}

// Interface cho info trong assessment report
export interface AssessmentReportInfo {
  school_name: string;
  class_name: string;
  program_name?: string;
  school_logo?: string;
  vn_teacher?: string;
  fr_teacher?: string;
}

// Interface cho statistic trong assessment report
export interface AssessmentReportStatistic {
  unscored: string;
  from_0_to_50: string;
  from_50_to_70: string;
  from_70_to_80: string;
  from_80_to_100: string;
}

// Interface cho student item trong assessment report
export interface AssessmentReportStudentItem {
  student_id: string;
  student_name: string;
  assessment: AssessmentStudentAssessment;
  total_score: number;
  files: string[];
  is_scored: boolean;
  file_infos?: FileInfo[];
  study_report_criteria: StudyReportCriteria;
}

// Interface cho response data của assessment report
export interface AssessmentReportResponseData {
  info: AssessmentReportInfo;
  students: AssessmentReportStudentItem[];
  total: string;
  statistic: AssessmentReportStatistic;
}

// Interface cho response của assessment report
export interface AssessmentReportResponse {
  code: number;
  message: string;
  data: AssessmentReportResponseData;
  error: string;
}

// Interface cho ghi chú trong tiêu chí báo cáo học tập
export interface StudyReportCriteriaNote {
  value: number;
  text: string;
  description: string;
}

// Interface cho node kỹ năng (dùng đệ quy)
export interface StudyReportCriteriaSkillNode {
  id: string;
  skill_id: string;
  name_vn: string;
  name_en: string;
  sort_order: number;
  parent_id: string;
  level: number;
  node_types: StudyReportCriteriaSkillNode[];
  star: number;
  is_check: boolean;
}

// Interface cho nhóm kỹ năng (star / check)
export interface StudyReportCriteriaSkill {
  id: string;
  criteria_id: string;
  name_vn: string;
  name_en: string;
  description: string;
  type: string;
  sort_order: number;
  types: StudyReportCriteriaSkillNode[];
}

// Interface cho môn học trong tiêu chí báo cáo
export interface StudyReportCriteriaSubject {
  id: string;
  name: string;
}

// Interface tổng cho study_report_criteria trong report
export interface StudyReportCriteria {
  id: string;
  subject_id: string;
  name: string;
  description: string;
  max_star: number;
  created_at: string;
  updated_at: string;
  notes: StudyReportCriteriaNote[];
  star_skills: StudyReportCriteriaSkill[];
  check_skills: StudyReportCriteriaSkill[];
  subject: StudyReportCriteriaSubject;
}

/**
 * Lấy báo cáo bài kiểm tra đánh giá
 * Endpoint: GET /dashboard/assessment/report
 */
export async function GetAssessmentReport(
  params: AssessmentReportParams
): Promise<AssessmentReportResponse> {
  try {
    // Set default value for get_score if not provided
    const requestParams = {
      ...params,
      get_score: params.get_score !== undefined ? params.get_score : true,
    };

    const response = await axiosInstance.get("/dashboard/assessment/report", {
      params: requestParams,
    });
    return response.data as AssessmentReportResponse;
  } catch (error: any) {
    if (error.response) {
      console.error("Response data:", error.response.data);
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Error setting up request:", error.message);
    }

    throw error;
  }
}

// Interface cho request body của export assessment school report
export interface ExportAssessmentSchoolReportRequest {
  school_ids: string;
  subjects: Array<{
    subject_id: number;
    grades: Array<{
      grade_id: number;
      assessment_id: number;
    }>;
  }>;
}

/**
 * Xuất file Excel báo cáo bài kiểm tra đánh giá theo trường
 * Endpoint: POST /dashboard/assessment/report-excel
 */
export async function ExportAssessmentSchoolReportExcel(
  request: ExportAssessmentSchoolReportRequest
) {
  try {
    const response = await axiosInstance.post(
      "/dashboard/assessment/report-excel",
      request,
      {
        responseType: "blob",
      }
    );
    return response.data;
  } catch (error: any) {
    if (error.response) {
      console.error("Response data:", error.response.data);
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Error setting up request:", error.message);
    }

    throw error;
  }
}

/**
 * Import điểm và đánh giá từ file Excel
 * Endpoint: POST /manage/assessments/import-excel
 * Content-Type: multipart/form-data
 * Body: file (xlsx file)
 */
export async function ImportAssessmentExcel(file: File) {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axiosInstance.post(
      "/manage/assessments/import-excel",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error importing assessment excel:", error);

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
 * Lấy trạng thái xuất bản của bảng điểm
 * Endpoint: GET /manage/publish-assessments
 */
export async function GetPublishAssessmentScore(
  params: GetPublishAssessmentScoreParams
): Promise<GetPublishAssessmentScoreResponse> {
  try {
    const response = await axiosInstance.get("/manage/publish-assessments", {
      params,
    });
    return response.data as GetPublishAssessmentScoreResponse;
  } catch (error: any) {
    console.error("Error getting publish assessment score:", error);

    if (error.response) {
      console.error("Response data:", error.response.data);
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Error setting up request:", error.message);
    }

    throw error;
  }
}

/**
 * Publish or unpublish assessment score
 * @param data - Publish assessment score data (course_id, assessment_id, publish)
 * @returns Promise with response
 */
export async function PublishAssessmentScore(
  data: PublishAssessmentScoreRequest
): Promise<any> {
  try {
    const response = await axiosInstance.put(
      "/manage/publish-assessments",
      data
    );
    return response.data;
  } catch (error: any) {
    console.error("Error publishing assessment score:", error);

    if (error.response) {
      console.error("Response data:", error.response.data);
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Error setting up request:", error.message);
    }

    throw error;
  }
}

export interface SubmitStudentAssessmentRequest {
  assessment_id: number;
  course_id: number;
  file_infos: FileInfo[];
}

/**
 * HS nộp bài kiểm tra đánh giá (upload ảnh/PDF bài làm)
 * Endpoint: POST /study/assessment-submit
 */
export async function SubmitStudentAssessment(
  payload: SubmitStudentAssessmentRequest
): Promise<{ code: number; message: string }> {
  const response = await axiosInstance.post("/study/assessment-submit", payload);
  return response.data;
}

export async function AssignAssessment(
  id: string | number,
  lessonId: number,
  requestBody: { is_assigned: boolean; course_id?: number }
): Promise<{ lesson_id: string; is_assigned: boolean }> {
  const response = await axiosInstance.post(
    `/manage/assessments/${id}/assigned`,
    {
      ...requestBody,
      lesson_id: lessonId,
    },
    {
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
    }
  );

  if (response.data.code === 200) {
    return {
      lesson_id: response.data.data.lesson_id,
      is_assigned: response.data.data.is_assigned,
    };
  }
  throw new Error(
    response.data.message ||
      response.data.error ||
      "Failed to assign assessment"
  );
}
