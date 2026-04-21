import axiosInstance from "./axios";

// Interface cho Subcriteria
export interface Subcriteria {
  id?: string | number;
  name: string;
  description: string;
  max_score: number;
}

// Interface cho Criteria
export interface Criteria {
  id?: string | number;
  subject_id?: string | number;
  name: string;
  description: string;
  has_subcriteria?: boolean;
  max_score: number;
  created_at?: string;
  created_by?: string | number;
  updated_at?: string;
  updated_by?: string | number;
  subcriteria?: Subcriteria[];
}

// Interface cho Assessment Criteria Group
export interface AssessmentCriteriaGroup {
  id: string | number;
  name: string;
  subject_id: string | number;
  subject_name?: string;
  has_file: boolean;
  created_at: string;
  created_by: string | number;
  updated_at: string;
  updated_by: string | number;
  criteria: Criteria[];
}

// Interface cho request tạo group với criteria
export interface CreateGroupWithCriteriaRequest {
  group: {
    name: string;
    subject_id: number;
    has_file: boolean;
    copy_from_assessment_criteria_group_id?: number;
  };
  criteria: Array<{
    id?: string | number;
    name: string;
    description: string;
    max_score: number;
    subcriteria?: Array<{
      id?: string | number;
      name: string;
      description: string;
      max_score: number;
    }>;
  }>;
}

// Interface cho response tạo group
interface CreateGroupResponse {
  code: number;
  message: string;
  data: {
    "@type": string;
    id: string;
    name: string;
    subject_id: string;
    has_file: boolean;
    created_at: string;
    created_by: string;
    updated_at: string;
    updated_by: string;
    criteria: Criteria[];
  };
  error: string;
}

// Interface cho response danh sách groups
interface GroupListResponse {
  code: number;
  message: string;
  data: {
    "@type": string;
    groups: AssessmentCriteriaGroup[];
    total: string | number;
  };
  error: string;
}

// Interface cho response chi tiết group
interface GroupDetailResponse {
  code: number;
  message: string;
  data: {
    "@type": string;
    id: string;
    name: string;
    subject_id: string;
    has_file: boolean;
    created_at: string;
    created_by: string;
    updated_at: string;
    updated_by: string;
    criteria: Criteria[];
  };
  error: string;
}

/**
 * Tạo nhóm tiêu chí đánh giá cùng với các tiêu chí
 */
export async function CreateGroupWithCriteria(
  request: CreateGroupWithCriteriaRequest
): Promise<AssessmentCriteriaGroup> {
  try {
    const response = await axiosInstance.post(
      "/manage/assessment-criteria-group/with-criteria",
      request
    );
    const data = response.data as CreateGroupResponse;

    if (data.code === 200 && data.data) {
      return {
        id: data.data.id,
        name: data.data.name,
        subject_id: data.data.subject_id,
        has_file: data.data.has_file,
        created_at: data.data.created_at,
        created_by: data.data.created_by,
        updated_at: data.data.updated_at,
        updated_by: data.data.updated_by,
        criteria: data.data.criteria,
      };
    } else {
      throw new Error(data.message || data.error);
    }
  } catch (error: any) {
    console.error("Error creating assessment criteria group:", error);

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
 * Lấy danh sách nhóm tiêu chí đánh giá
 */
export async function GetGroupList(subject_id?: number): Promise<{
  groups: AssessmentCriteriaGroup[];
  total: number;
}> {
  try {
    const params = subject_id ? { subject_id } : {};
    const response = await axiosInstance.get(
      "/manage/assessment-criteria-groups",
      {
        params,
      }
    );

    const data = response.data as GroupListResponse;

    if (data.code === 200 && data.data) {
      const totalCount =
        typeof data.data.total === "string"
          ? Number.parseInt(data.data.total)
          : data.data.total;

      return {
        groups: data.data.groups,
        total: totalCount,
      };
    } else {
      throw new Error(data.message || data.error);
    }
  } catch (error: any) {
    console.error("Error fetching assessment criteria groups:", error);

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
 * Lấy chi tiết nhóm tiêu chí đánh giá
 */
export async function GetGroupDetail(
  id: string | number
): Promise<AssessmentCriteriaGroup> {
  try {
    const response = await axiosInstance.get(
      `/manage/assessment-criteria-groups/${id}`
    );
    const data = response.data as GroupDetailResponse;

    if (data.code === 200 && data.data) {
      return {
        id: data.data.id,
        name: data.data.name,
        subject_id: data.data.subject_id,
        has_file: data.data.has_file,
        created_at: data.data.created_at,
        created_by: data.data.created_by,
        updated_at: data.data.updated_at,
        updated_by: data.data.updated_by,
        criteria: data.data.criteria,
      };
    } else {
      throw new Error(data.message || data.error);
    }
  } catch (error: any) {
    console.error(
      `Error fetching assessment criteria group detail with ID ${id}:`,
      error
    );

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
 * Cập nhật nhóm tiêu chí đánh giá cùng với các tiêu chí
 */
export async function UpdateGroupWithCriteria(
  id: string | number,
  request: CreateGroupWithCriteriaRequest
): Promise<AssessmentCriteriaGroup> {
  try {
    const response = await axiosInstance.put(
      `/manage/assessment-criteria-group/with-criteria/${id}`,
      request
    );
    const data = response.data as CreateGroupResponse;

    if (data.code === 200 && data.data) {
      return {
        id: data.data.id,
        name: data.data.name,
        subject_id: data.data.subject_id,
        has_file: data.data.has_file,
        created_at: data.data.created_at,
        created_by: data.data.created_by,
        updated_at: data.data.updated_at,
        updated_by: data.data.updated_by,
        criteria: data.data.criteria,
      };
    } else {
      throw new Error(data.message || data.error);
    }
  } catch (error: any) {
    console.error(
      `Error updating assessment criteria group with ID ${id}:`,
      error
    );

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
 * Xóa nhóm tiêu chí đánh giá
 */
export async function DeleteGroup(id: string | number): Promise<boolean> {
  try {
    const response = await axiosInstance.delete(
      `/manage/assessment-criteria-groups/${id}`
    );
    const data = response.data as {
      code: number;
      message: string;
      error: string;
    };

    if (data.code === 200) {
      return true;
    } else {
      throw new Error(
        data.message ||
          data.error ||
          "Failed to delete assessment criteria group"
      );
    }
  } catch (error: any) {
    console.error(
      `Error deleting assessment criteria group with ID ${id}:`,
      error
    );

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
