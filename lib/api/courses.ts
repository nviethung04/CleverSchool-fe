import axiosInstance from "./axios";
import { getCurrentUser } from "./auth";

// Ham goi API tao khoa hoc
export async function CreateCourse(data: any) {
  try {
    //Sử dụng axios instance đã được cấu hình với token
    const response = await axiosInstance.post("/manage/courses", data);

    return response.data;
  } catch (error: any) {
    console.error("Error creating course:", error);

    // Log them thong tin chi tiet ve loi
    if (error.response) {
      // Server trả về response với status code nằm ngoài range 2xx
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
      console.error("Response headers:", error.response.headers);
    } else if (error.request) {
      // Request đã được gửi nhưng không nhận được response
      console.error("No response received:", error.request);
    } else {
      // Có lỗi khi thiết lập request
      console.error("Error setting up request:", error.message);
    }

    throw error;
  }
}

/**
 * Hàm lấy danh sách khóa học với tự động set by_user dựa trên role
 *
 * Logic tự động:
 * - Admin: by_user = false (xem tất cả khóa học trong hệ thống)
 * - Teacher/Student: by_user = true (chỉ xem khóa học đã tham gia)
 *
 * @param params - Các tham số tùy chọn
 * @param params.school_id - ID trường học
 * @param params.by_user - Nếu được truyền vào, sẽ override logic tự động
 * @param params.keyword - Từ khóa tìm kiếm
 * @param params.page - Số trang
 * @returns Promise với dữ liệu khóa học
 */
export async function GetCourseList(params?: {
  school_id?: string | number;
  subject_id?: string;
  by_user?: boolean;
  keyword?: string;
  page?: number;
  per_page?: number;
}) {
  try {
    // Lấy thông tin user hiện tại
    const currentUser = getCurrentUser();

    // Tự động set by_user dựa trên role nếu không được truyền vào
    let by_user = params?.by_user;
    if (currentUser && by_user === undefined) {
      if (currentUser.type === "admin") {
        by_user = false; // Admin luôn xem tất cả khóa học
      } else if (
        currentUser.type === "teacher" ||
        currentUser.type === "student" ||
        currentUser.type === "school"
      ) {
        by_user = true; // Teacher/Student chỉ xem khóa học đã tham gia
      }
    }

    console.log(
      `GetCourseList - User: ${currentUser?.type}, Auto-set by_user: ${by_user}`
    );

    const response = await axiosInstance.get("/manage/courses", {
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
      params: {
        ...(params?.school_id ? { school_id: params.school_id } : {}),
        ...(params?.subject_id ? { subject_id: params.subject_id } : {}),
        ...(by_user !== undefined ? { by_user } : {}),
        ...(params?.keyword ? { keyword: params.keyword } : {}),
        ...(params?.page ? { page: params.page } : {}),
        ...(params?.per_page ? { per_page: params.per_page } : {}),
      },
    });
    return response.data;
  } catch (error: any) {
    console.error("Error fetching course list:", error);
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

export async function DeleteCourse(courseId: string) {
  try {
    const response = await axiosInstance.delete(`/manage/courses/${courseId}`);
    // Trả về status code để component có thể kiểm tra thành công/thất bại
    return { status: response.status };
  } catch (error: any) {
    console.error("Error deleting course:", error);

    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
      console.error("Response headers:", error.response.headers);
      // Nếu có response trả về, trả về status code để component xử lý
      return { status: error.response.status };
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Error setting up request:", error.message);
    }

    throw error;
  }
}

// Hàm cập nhật thông tin khóa học
export async function UpdateCourse(courseId: string, data: any) {
  try {
    console.log("Updating course with ID:", courseId);
    console.log("Updated data:", JSON.stringify(data, null, 2));

    const response = await axiosInstance.put(
      `/manage/courses/${courseId}`,
      data
    );
    return response.data;
  } catch (error: any) {
    console.error("Error updating course:", error);

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

// Hàm lấy chi tiết khóa học
export async function GetCourseDetail(courseId: string) {
  try {

    const response = await axiosInstance.get(`/manage/courses/${courseId}`);

    return response.data;
  } catch (error: any) {
    console.error("Error fetching course detail:", error);

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

export async function GetCourseBySchool(school_id: string) {
  try {
    const response = await axiosInstance.get(`/manage/courses`, {
      params: { school_id, page: 1, per_page: 200 },
    });
    return response.data;
  } catch (error: any) {
    console.error("Error deleting course:", error);

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

// Thêm học sinh vào khóa học
export async function SaveListUsersToCourse(
  courseId: string,
  users: Array<{ id: number; name: string; username: string }>,
  role_id: number
) {
  try {
    const payload = { users, role_id };
    const response = await axiosInstance.post(
      `/manage/courses/${courseId}/users`,
      payload
    );
    return response.data;
  } catch (error: any) {
    console.error("Error adding users to course:", error);
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

export async function GetUsersInCourse(role_id?: number, course_id?: number) {
  try {
    const response = await axiosInstance.get(
      `/manage/courses/${course_id}/users?role_id=${role_id}`
    );
    return response.data;
  } catch (error: any) {
    console.error("Error fetching user list:", error);
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

export async function GetCourseScheduleByWeek(course_id: string) {
  try {

    const response = await axiosInstance.get(
      `/manage/lessons/schedules?course_id=${course_id}&week_by_course=true`);

    return response.data;
  } catch (error: any) {
    console.error("Error fetching course schedule:", error);

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

export async function UpdateCourseSchedule(scheduleData: {
  course_id: number;
  weeks: Array<{
    week_id: number;
    week_number_in_year: number;
    week_number: number;
    start_date: string;
    end_date: string;
    schedules: Array<{
      id: number;
      scheduled_date: string;
      week_id: number;
      week_number: number;
      lesson: {
        id: number;
        title: string;
        description: string;
      };
      course: {
        id: number;
        name: string;
        description: string;
      };
    }>;
  }>;
}) {
  try {

    const response = await axiosInstance.post(
      "/manage/lessons/schedules",
      scheduleData,
    );

    return response.data;
  } catch (error: any) {
    console.error("Error updating course schedule:", error);

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
export async function GetScheduleByWeek(course_id?: string, week_id?: string) {
  try {
    const params: any = { by_user: true };
    if (course_id) params.course_id = course_id;
    if (week_id) params.week_id = week_id;

    const response = await axiosInstance.get(`/manage/lessons/schedules`, {
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
      params,
    });

    return response.data;
  } catch (error: any) {
    console.error("Error fetching course schedule:", error);

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
 * Hàm lấy danh sách chi tiết bài kiểm tra của học sinh theo id khóa học
 *
 * @param courseId - ID khóa học
 * @returns Promise với dữ liệu điểm số và kết quả bài kiểm tra
 */
export async function GetCourseScores(courseId: string) {
  try {
    console.log("Fetching course scores for course ID:", courseId);

    const response = await axiosInstance.get(
      `/manage/courses/${courseId}/score`,
      {
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
      }
    );

    console.log("Course scores response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching course scores:", error);

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
 * Hàm lấy danh sách bài kiểm tra theo khóa học
 
 * @param is_assigned - true: đã chấm, false: chưa chấm, không truyền: tất cả

 */
export async function GetExamCourses(courseId: string, is_assigned?: boolean) {
  try {
    console.log(
      "Fetching exam courses for course ID:",
      courseId,
      "is_assigned:",
      is_assigned
    );
    const params: any = { course_id: courseId };
    if (typeof is_assigned === "boolean") {
      params.is_assigned = is_assigned;
    }
    const response = await axiosInstance.get(`/study/exam-courses`, {
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
      params,
    });
    console.log("Exam courses response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching exam courses:", error);
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
 * Clone a course by ID
 * @param courseId - ID of the course to clone
 * @param cloneOptions - Options for cloning (course_name, add_subname, skip_clone_chapters, ...)
 * @returns Promise with the cloned course data
 */
export async function CloneCourse(
  courseId: string,
  cloneOptions: {
    course_name?: string;
    add_subname?: string;
    skip_clone_chapters?: boolean;
    skip_clone_lessons?: boolean;
    skip_clone_homeworks?: boolean;
    skip_clone_exams?: boolean;
    skip_clone_lesson_plans?: boolean;
    skip_clone_lesson_plan_parts?: boolean;
  }
) {
  try {
    console.log("Cloning course with ID:", courseId, "options:", cloneOptions);
    const response = await axiosInstance.post(
      `/manage/courses/${courseId}/cloned`,
      cloneOptions,
      {
        headers: {
          "ngrok-skip-browser-warning": "true",
          "Content-Type": "application/json",
        },
      }
    );
    console.log("Cloned course response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Error cloning course:", error);
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

// Lấy danh sách các khóa học con theo parent_id
export async function GetCourseListByParentId(parent_id: string | number) {
  try {
    console.log("Fetching course list by parent_id:", parent_id);
    const response = await axiosInstance.get("/manage/courses", {
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
      params: { parent_id },
    });
    return response.data;
  } catch (error: any) {
    console.error("Error fetching course list by parent_id:", error);
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

// Đồng bộ các khóa học con theo khóa gốc
export async function SyncChildCourses(
  parentId: string | number,
  ids: Array<number | string>
) {
  try {
    // Ép kiểu tất cả id sang số nguyên
    const cleanIds: number[] = [];
    for (const id of ids) {
      const numId = parseInt(String(id), 10);
      if (!isNaN(numId) && numId > 0) {
        cleanIds.push(numId);
      }
    }
    if (cleanIds.length === 0) throw new Error("Danh sách ids không hợp lệ");
    console.log(
      "Syncing child courses for parentId:",
      parentId,
      "with ids:",
      cleanIds
    );
    console.log("Body being sent:", JSON.stringify({ ids: cleanIds }));
    const response = await axiosInstance.post(
      `/manage/courses/${parentId}/sync`,
      { ids: cleanIds },
      {
        headers: {
          "ngrok-skip-browser-warning": "true",
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error syncing child courses:", error);
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
 * Lấy danh sách khóa học mẫu theo program_id
 * @param program_id - ID của chương trình
 * @returns Promise với danh sách khóa học mẫu
 */
export async function GetTemplateCoursesByProgram(program_id: string | number) {
  try {
    const response = await axiosInstance.get("/manage/courses", {
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
      params: {
        program_id,
        is_template: true, // Chỉ lấy khóa học mẫu
        by_user: false, // Lấy tất cả khóa học mẫu, không giới hạn theo user
      },
    });
    return response.data;
  } catch (error: any) {
    console.error("Error fetching template courses:", error);
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
 * Lấy thông tin khóa học cùng chương trình (parent và children)
 * @param course_id - ID của khóa học
 * @returns Promise với dữ liệu parent và children courses
 */
export async function GetCourseFamily(course_id: string | number) {
  try {

    const response = await axiosInstance.get(`/manage/course-schedule/family`, {
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
      params: {
        course_id,
      },
    });

    return response.data;
  } catch (error: any) {
    console.error("Error fetching course family:", error);

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
 * Đồng bộ lịch học cho tất cả khóa học cùng chương trình
 * @param course_id - ID của khóa học
 * @param onProgress - Callback khi có progress update (optional)
 * @param onDone - Callback khi hoàn thành (optional)
 * @param onError - Callback khi có lỗi (optional)
 * @returns Promise với kết quả đồng bộ (nếu không dùng callbacks)
 */
export async function SyncAllFamilyCourses(
  course_id: number | string,
  onProgress?: (data: {
    target_course_id: number;
    status: string;
    message: string;
    total_courses: number;
    completed_courses: number;
  }) => void,
  onDone?: (data: {
    status: string;
    source_course_id: number;
    synced_course_ids: number[];
    synced_count: number;
  }) => void,
  onError?: (error: Error) => void
) {
  try {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const baseURL = "/api";
    const url = `${baseURL}/manage/course-schedule/sync-all-family`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
        ...(token && {
          Authorization: `Bearer ${token}`,
          Token: token,
        }),
      },
      body: JSON.stringify({ course_id: Number(course_id) }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Nếu có callbacks, xử lý stream response
    if (onProgress || onDone || onError) {
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Response body is not readable");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.trim() === "") continue;

          const [eventLine, dataLine] = line.split("\n");
          if (!eventLine || !dataLine) continue;

          const eventMatch = eventLine.match(/^event:\s*(.+)$/);
          const dataMatch = dataLine.match(/^data:\s*(.+)$/);

          if (!eventMatch || !dataMatch) continue;

          const eventType = eventMatch[1].trim();
          const dataStr = dataMatch[1].trim();

          try {
            const data = JSON.parse(dataStr);

            if (eventType === "progress" && onProgress) {
              onProgress(data);
            } else if (eventType === "done" && onDone) {
              onDone(data);
              return;
            }
          } catch (parseError) {
            console.error("Error parsing SSE data:", parseError);
          }
        }
      }
      return;
    }

    // Nếu không có callbacks, trả về response như cũ (fallback)
    const responseData = await response.json();
    return responseData;
  } catch (error: any) {
    console.error("Error syncing all family courses:", error);

    if (onError) {
      onError(error instanceof Error ? error : new Error(String(error)));
    } else {
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
}

/**
 * Lấy danh sách courses family theo program_id
 * @param program_id - ID của chương trình
 * @returns Promise với danh sách parent courses và children courses
 */
export async function GetListCoursesFamily(program_id: string | number) {
  try {
    const response = await axiosInstance.get("/manage/list-courses-family", {
      params: {
        program_id,
      },
    });
    return response.data;
  } catch (error: any) {
    console.error("Error fetching list courses family:", error);
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
 * Gán các khóa học con vào khóa học cha
 * @param course_ids - Danh sách ID khóa học con (string dạng "125,126,127" hoặc array)
 * @param parent_course_id - ID khóa học cha
 * @returns Promise với kết quả gán
 */
export async function AssignParentCourse(
  course_ids: string | number[],
  parent_course_id: number
) {
  try {
    // Chuyển đổi course_ids thành string nếu là array
    const courseIdsString = Array.isArray(course_ids)
      ? course_ids.length > 0
        ? course_ids.join(",")
        : "" // Nếu array rỗng, trả về chuỗi rỗng
      : course_ids; // Nếu đã là string, giữ nguyên (có thể là "")

    const response = await axiosInstance.post(
      "/manage/course-schedule/assign-parent",
      {
        course_ids: courseIdsString,
        parent_course_id,
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error assigning parent course:", error);
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
