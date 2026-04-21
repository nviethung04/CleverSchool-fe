import axiosInstance from "./axios";

// Type definitions
export interface Note {
  value: number;
  text: string;
  description: string;
}

export interface NodeSkillType {
  id: string;
  name_vn: string;
  name_en: string;
  sort_order?: number;
  parent_id?: string;
  level?: number;
  node_types?: NodeSkillType[]; // Hỗ trợ cấp 4
}

export interface SkillType {
  id?: string;
  skill_id?: string;
  name_vn: string;
  name_en: string;
  sort_order?: number;
  parent_id?: string;
  level?: number;
  node_types: NodeSkillType[];
}

export interface StarSkill {
  id: string;
  criteria_id?: string;
  name_vn: string;
  name_en: string;
  description: string;
  sort_order?: number;
  types: SkillType[];
}

export interface CheckSkill {
  id: string;
  criteria_id?: string;
  name_vn: string;
  name_en: string;
  description: string;
  sort_order?: number;
  types: SkillType[];
}

export interface StudyReportCriteria {
  id: string;
  subject_id: string;
  name: string;
  description: string;
  max_star: number;
  created_at: string;
  updated_at: string;
  notes: Note[];
  star_skills: StarSkill[];
  check_skills: CheckSkill[];
}

export interface StudyReportCriteriasResponseData {
  study_report_criterias: StudyReportCriteria[];
  total_count: string;
}

export interface StudyReportCriteriaResponseData {
  id: string;
  subject_id: string;
  name: string;
  description: string;
  max_star: number;
  created_at: string;
  updated_at: string;
  notes: Note[];
  star_skills: StarSkill[];
  check_skills: CheckSkill[];
}

export interface StudyReportCriteriasResponse {
  code: number;
  message: string;
  data: StudyReportCriteriasResponseData;
  error: string;
}

export interface StudyReportCriteriaResponse {
  code: number;
  message: string;
  data: StudyReportCriteriaResponseData;
  error: string;
}

export interface CreateStudyReportCriteriaRequest {
  subject_id: number;
  name: string;
  description: string;
  max_star: number;
  notes: Note[];
  star_skills: (Omit<StarSkill, "id" | "criteria_id" | "sort_order"> & {
    id?: string;
  })[];
  check_skills: (Omit<CheckSkill, "id" | "criteria_id" | "sort_order"> & {
    id?: string;
  })[];
  copy_from_study_report_criteria_id: number;
}

// API Functions
/**
 * Get list of study report criteria
 * @param keyword - Optional search keyword
 * @returns Promise with study report criteria list
 */
export interface StudyReportCriteriaListParams {
  keyword?: string;
  subject_id?: number | string;
}

export async function GetStudyReportCriterias(
  params?: StudyReportCriteriaListParams
): Promise<StudyReportCriteriasResponse> {
  try {
    const requestParams: Record<string, any> = {};
    const keyword = params?.keyword;
    if (keyword && keyword.trim()) {
      requestParams.keyword = keyword.trim();
    }
    if (params?.subject_id) {
      requestParams.subject_id = params.subject_id;
    }

    const response = await axiosInstance.get("/manage/study-report-criterias", {
      params: requestParams,
    });
    return response.data;
  } catch (error: any) {
    console.error("Error fetching study report criterias:", error);

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
 * Get study report criteria detail by ID
 * @param id - Criteria ID
 * @returns Promise with study report criteria detail
 */
export async function GetStudyReportCriteriaDetail(
  id: string
): Promise<StudyReportCriteriaResponse> {
  try {
    const response = await axiosInstance.get(
      `/manage/study-report-criterias/${id}`
    );
    return response.data;
  } catch (error: any) {
    console.error("Error fetching study report criteria detail:", error);

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
 * Create a new study report criteria
 * @param data - Study report criteria data
 * @returns Promise with created study report criteria
 */
export async function CreateStudyReportCriteria(
  data: CreateStudyReportCriteriaRequest
): Promise<StudyReportCriteriaResponse> {
  try {
    console.log(
      "Sending study report criteria data to API:",
      JSON.stringify(data, null, 2)
    );
    const response = await axiosInstance.post(
      "/manage/study-report-criterias",
      data
    );
    return response.data;
  } catch (error: any) {
    console.error("Error creating study report criteria:", error);

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
 * Update study report criteria
 * @param id - Criteria ID
 * @param data - Study report criteria data
 * @returns Promise with updated study report criteria
 */
export async function UpdateStudyReportCriteria(
  id: string,
  data: CreateStudyReportCriteriaRequest
): Promise<StudyReportCriteriaResponse> {
  try {
    console.log(
      "Updating study report criteria:",
      id,
      JSON.stringify(data, null, 2)
    );
    const response = await axiosInstance.put(
      `/manage/study-report-criterias/${id}`,
      data
    );
    return response.data;
  } catch (error: any) {
    console.error("Error updating study report criteria:", error);

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
 * Delete study report criteria
 * @param id - Criteria ID
 * @returns Promise<boolean> - true if successful
 */
export async function DeleteStudyReportCriteria(id: string): Promise<boolean> {
  try {
    console.log("Deleting study report criteria with ID:", id);
    const response = await axiosInstance.delete(
      `/manage/study-report-criterias/${id}`
    );
    const data = response.data;

    if (data.code === 200) {
      return true;
    } else {
      throw new Error(
        data.message || data.error || "Failed to delete study report criteria"
      );
    }
  } catch (error: any) {
    console.error(`Error deleting study report criteria with ID ${id}:`, error);

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
