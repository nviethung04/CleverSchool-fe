import axiosInstance from "./axios";

// Types for School Report
export interface SchoolReportData {
  id: string;
  school_id: string;
  school_name: string;
  total_students: string;
  total_teachers: string;
  active_teachers_from_sep8: string;
  active_students_from_sep15: string;
  students_completed_homework_from_sep15: string;
  students_completed_homework_selected_week: string;
  active_students_selected_week: string;
  active_teachers_selected_week: string;
}

export interface SchoolReportResponse {
  code: number;
  message: string;
  data: {
    "@type": string;
    schools: SchoolReportData[];
    total: string;
    page: number;
    limit: number;
    total_pages: number;
  };
  error: string;
}

// Types for Course Report
export interface TeacherInfo {
  id: string;
  username: string;
  name: string;
}

export interface CourseReportData {
  id: string;
  course_id: string;
  course_name: string;
  object_title: string;
  school_id: string;
  school_name: string;
  total_students: string;
  total_teachers: string;
  teacher_ids: string;
  teacher_infos: TeacherInfo[];
  students_completed_homework: string;
  students_completed_all_homeworks: string;
  students_doing_homeworks: string;
  students_not_started_any_homework: string;
  student_active_not_started_any_homework: string;
  active_students: string;
  active_teachers: string;
  total_homeworks: string;
  assigned_homeworks: string;
  homework_over_50_percent_student_complete: string;
}

export interface CourseReportResponse {
  code: number;
  message: string;
  data: {
    "@type": string;
    courses: CourseReportData[];
    total: string;
    page: number;
    limit: number;
    total_pages: number;
  };
  error: string;
}

// Course Students Report
export interface HomeworkInfo {
  id: string;
  name: string;
  lesson_name: string;
  chapter_name: string;
  is_completed: boolean;
  is_completed_late: boolean;
}

export interface StudentInfo {
  id: string;
  name: string;
  is_active: boolean;
  homeworks: HomeworkInfo[];
}

export interface CourseStudentsResponse {
  code: number;
  message: string;
  data: {
    "@type": string;
    students: StudentInfo[];
  };
  error: string;
}

//Course Homeworks Report
export interface HomeworkReportData {
  id: string;
  name: string;
  assigned_at: string;
  is_assigned_late: boolean;
  lesson_name: string;
  chapter_name: string;
}

export interface CourseHomeworksResponse {
  code: number;
  message: string;
  data: {
    "@type": string;
    homeworks: HomeworkReportData[];
  };
  error: string;
}

//Users
export async function exportUser({
  role_id,
  school_id,
  class_id,
  course_id,
  keyword,
  begin_at,
  end_at,
  status,
  is_used,
}: {
  role_id?: number;
  school_id?: number;
  class_id?: number;
  course_id?: number;
  keyword?: string;
  begin_at?: string;
  end_at?: string;
  status?: string;
  is_used?: boolean | string;
}) {
  const res = await axiosInstance.get("/manage/users/export", {
    params: {
      role_id,
      school_id,
      class_id,
      course_id,
      keyword,
      begin_at,
      end_at,
      status,
      is_used,
    },
  });
  return res.data;
}

export async function importUser(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await axiosInstance.post("/manage/users/import", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
}

//Questions
export async function exportQuestion() {
  const res = await axiosInstance.get("/manage/questions/export");
  return res.data;
}

export async function importQuestion(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await axiosInstance.post("/manage/questions/import", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
}

//Schools
export async function exportSchool() {
  const res = await axiosInstance.get("/manage/schools/export");
  return res.data;
}

export async function importSchool(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await axiosInstance.post("/manage/schools/import", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
}

//Classes
export async function exportClass({ school_id }: { school_id: number }) {
  const res = await axiosInstance.get("/manage/classes/export", {
    params: {
      school_id,
    },
  });
  return res.data;
}

export async function importClass(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await axiosInstance.post("/manage/classes/import", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
}

//Dashboard
export async function exportAdminDashboard({
  course_id,
  school_id,
  teacher_id,
  program_id,
  month,
  year, role_id
}: {
  course_id: string;
  school_id: string;
  teacher_id: string;
  program_id?: string;
  month?: number;
  year?: number;
  role_id?: string;
}) {
  const res = await axiosInstance.get("/dashboard/export", {
    params: {
      course_id,
      school_id,
      teacher_id,
      program_id,
      month,
      year,
      role_id
    },
  });
  return res.data;
}

//Weekly Report
export async function exportWeeklyReport() {
  const res = await axiosInstance.get("/dashboard/report/export");
  return res.data;
}

//School Report
export async function getSchoolReport({
  page = 1,
  limit = 10,
  start_date,
  end_date,
}: {
  page?: number;
  limit?: number;
  start_date?: number;
  end_date?: number;
}): Promise<SchoolReportResponse> {
  const res = await axiosInstance.get("/dashboard/report/schools", {
    params: {
      page,
      limit,
      start_date,
      end_date,
    },
  });
  return res.data;
}

export async function exportSchoolReport({
  start_date,
  end_date,
}: {
  start_date?: number;
  end_date?: number;
} = {}) {
  const res = await axiosInstance.get("/dashboard/report/schools/export", {
    params: {
      start_date,
      end_date,
    },
    responseType: "blob",
  });
  return res.data;
}

//Course Report
export async function getCourseReport({
  school_id,
  course_id,
  teacher_id,
  page = 1,
  limit = 10,
  start_date,
  end_date,
}: {
  school_id?: number;
  course_id?: number | string;
  teacher_id?: number | string;
  page?: number;
  limit?: number;
  start_date?: number;
  end_date?: number;
}): Promise<CourseReportResponse> {
  const params: any = { page, limit, start_date, end_date };
  if (typeof school_id !== "undefined") params.school_id = school_id;
  if (typeof course_id !== "undefined" && course_id !== "")
    params.course_id = course_id;
  if (typeof teacher_id !== "undefined" && teacher_id !== "")
    params.teacher_id = teacher_id;

  const res = await axiosInstance.get("/dashboard/report/courses", {
    params,
  });
  return res.data;
}

export async function exportCourseReport({
  school_id,
  course_id,
  teacher_id,
  start_date,
  end_date,
}: {
  school_id?: number;
  course_id?: number | string;
  teacher_id?: number | string;
  start_date?: number;
  end_date?: number;
}) {
  const params: any = { start_date, end_date };
  if (typeof school_id !== "undefined") params.school_id = school_id;
  if (typeof course_id !== "undefined" && course_id !== "")
    params.course_id = course_id;
  if (typeof teacher_id !== "undefined" && teacher_id !== "")
    params.teacher_id = teacher_id;

  const res = await axiosInstance.get("/dashboard/report/courses/export", {
    params,
    responseType: "blob",
  });
  return res.data;
}

export async function getCourseStudentsReport({
  start_date,
  end_date,
  course_id,
}: {
  start_date?: number;
  end_date?: number;
  course_id: number | string;
}): Promise<CourseStudentsResponse> {
  const res = await axiosInstance.get("/dashboard/report/courses/students", {
    params: {
      start_date,
      end_date,
      course_id,
    },
  });
  return res.data;
}

export async function getCourseHomeworksReport({
  start_date,
  end_date,
  course_id,
}: {
  start_date?: number;
  end_date?: number;
  course_id: number | string;
}): Promise<CourseHomeworksResponse> {
  const res = await axiosInstance.get("/dashboard/report/courses/homeworks", {
    params: {
      start_date,
      end_date,
      course_id,
    },
  });
  return res.data;
}
