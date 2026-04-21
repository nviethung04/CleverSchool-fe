import axiosInstance from "./axios";

//Student
export async function getStudentExamDashboard({
  course_id,
  start_date,
  end_date,
}: {
  course_id: string;
  start_date: number;
  end_date: number;
}) {
  const res = await axiosInstance.get("/dashboard/student/exam", {
    params: {
      course_id,
      start_date,
      end_date,
    },
  });
  return res.data;
}

export async function getStudentHomeworkDashboard({
  course_id,
  start_date,
  end_date,
}: {
  course_id: string;
  start_date: number;
  end_date: number;
}) {
  const res = await axiosInstance.get("/dashboard/student/homework", {
    params: {
      course_id,
      start_date,
      end_date,
    },
  });
  return res.data;
}

export async function getStudentListExam({
  course_id,
  start_date,
  end_date,
  page,
  limit,
}: {
  course_id: string;
  start_date: number;
  end_date: number;
  page: number;
  limit: number;
}) {
  const res = await axiosInstance.get("/dashboard/student/exam-list", {
    params: {
      course_id,
      start_date,
      end_date,
      page,
      limit,
    },
  });
  return res.data;
}

export async function getStudentListHomework({
  course_id,
  start_date,
  end_date,
  page,
  limit,
}: {
  course_id: string;
  start_date: number;
  end_date: number;
  page: number;
  limit: number;
}) {
  const res = await axiosInstance.get("/dashboard/student/homework-list", {
    params: {
      course_id,
      start_date,
      end_date,
      page,
      limit,
    },
  });
  return res.data;
}

// Exam Ranking
export async function getExamRanking({
  course_id,
  order_by = "desc",
  limit,
  page,
  start_date,
  end_date,
  exam_id,
}: {
  course_id: string;
  order_by?: "asc" | "desc";
  limit?: number;
  page?: number;
  start_date: number;
  end_date: number;
  exam_id?: string;
}) {
  const params: any = {
    course_id,
    order_by,
    limit,
    page,
    start_date,
    end_date,
  };

  // Thêm exam_id nếu có
  if (exam_id) {
    params.exam_id = exam_id;
  }

  const res = await axiosInstance.get("/dashboard/exam/ranking", {
    params,
  });
  return res.data;
}

//Homework ranking
export interface HomeworkRankingStudent {
  id: string;
  name: string;
  avatar: string;
  class: string;
  star: number;
  rank: number;
  is_me: boolean;
  score: number;
  exp: number;
}

export interface HomeworkRankingResponse {
  code: number;
  message: string;
  data: {
    "@type"?: string;
    students: HomeworkRankingStudent[];
    total: string | number;
  };
  error?: string;
}

export async function getHomeworkRanking({
  course_id,
  order_by = "star",
  sort = "desc",
}: {
  course_id: string;
  order_by?: "star" | "exp";
  sort?: "asc" | "desc";
}): Promise<HomeworkRankingResponse> {
  const res = await axiosInstance.get("/dashboard/ranking/homework", {
    params: {
      course_id,
      order_by,
      sort,
    },
  });
  return res.data;
}

//Assessment ranking
export interface AssessmentRankingStudent {
  id: string;
  name: string;
  avatar: string;
  class: string;
  star: number;
  rank: number;
  is_me: boolean;
  score: number;
  exp: number;
}

export interface AssessmentRankingResponse {
  code: number;
  message: string;
  data: {
    "@type"?: string;
    students: AssessmentRankingStudent[];
    total: string | number;
  };
  error?: string;
}

export async function getAssessmentRanking({
  course_id,
  order_by = "score",
  sort = "desc",
  assessment_id,
}: {
  course_id: string;
  order_by?: "score" | "star";
  sort?: "asc" | "desc";
  assessment_id: string;
}): Promise<AssessmentRankingResponse> {
  const res = await axiosInstance.get("/dashboard/ranking/assessment", {
    params: {
      course_id,
      order_by,
      sort,
      assessment_id,
    },
  });
  return res.data;
}


//Assessment ranking
//Admin
export async function getAdminDashboard({
  course_id,
  school_id,
  teacher_id,
  program_id,
  role_id,
  year,
  month,
  tab,
}: {
  course_id: string;
  school_id: string;
  teacher_id: string;
  program_id: string;
  role_id: string;
  year: number;
  month: number;
  tab: string;
}) {
  const res = await axiosInstance.get("/dashboard", {
    params: {
      course_id,
      school_id,
      teacher_id,
      program_id,
      role_id,
      year,
      month,
      tab,
    },
  });
  return res.data;
}

//Teacher
export async function getTeacherExamScored({
  course_id,
  exam_id,
  start_date,
  end_date,
  page,
  limit,
}: {
  course_id: string;
  exam_id: string;
  start_date: number;
  end_date: number;
  page: number;
  limit: number;
}) {
  const res = await axiosInstance.get("/dashboard/teacher/exam-scored", {
    params: {
      course_id,
      exam_id,
      start_date,
      end_date,
      page,
      limit,
    },
  });
  return res.data;
}

export async function getTeacherExamUnscored({
  course_id,
  exam_id,
  start_date,
  end_date,
  page,
  limit,
}: {
  course_id: string;
  exam_id: string;
  start_date: number;
  end_date: number;
  page: number;
  limit: number;
}) {
  const res = await axiosInstance.get("/dashboard/teacher/exam-unscored", {
    params: {
      course_id,
      exam_id,
      start_date,
      end_date,
      page,
      limit,
    },
  });
  return res.data;
}

export async function getTeacherExamOverview({
  course_id,
  exam_id,
  start_date,
  end_date,
}: {
  course_id: string;
  exam_id: string;
  start_date: number;
  end_date: number;
}) {
  const res = await axiosInstance.get("/dashboard/teacher/exam-overview", {
    params: {
      course_id,
      exam_id,
      start_date,
      end_date,
    },
  });
  return res.data;
}

export async function getTeacherAllHomework({
  course_id,
  start_date,
  end_date,
  page,
  limit,
  order_by,
  lesson_ids,
  chapter_id,
  homework_ids,
}: {
  course_id: string;
  start_date: number;
  end_date: number;
  page?: number;
  limit?: number;
  order_by?: "completed_homework" | "average_score";
  lesson_ids?: string;
  chapter_id?: string;
  homework_ids?: string;
}) {
  const params: any = {
    course_id,
    start_date,
    end_date,
    page,
    limit,
  };

  if (order_by) {
    params.order_by = order_by;
  }
  if (lesson_ids) {
    params.lesson_ids = lesson_ids;
  }
  if (chapter_id) {
    params.chapter_id = chapter_id;
  }
  if (homework_ids) {
    params.homework_ids = homework_ids;
  }

  const res = await axiosInstance.get("/dashboard/teacher/homework", {
    params,
  });
  return res.data;
}

export async function getTeacherListHomeworks({
  course_id,
  start_date,
  end_date,
  page,
  limit,
  order_by,
  lesson_ids,
  chapter_id,
  homework_ids,
  student_id,
}: {
  course_id: string;
  start_date: number;
  end_date: number;
  page?: number;
  limit?: number;
  order_by?: "completed_homework" | "average_score";
  lesson_ids?: string;
  chapter_id?: string;
  homework_ids?: string;
  student_id?: string;
}) {
  const params: any = {
    course_id,
    start_date,
    end_date,
    page,
    limit,
  };

  if (order_by) {
    params.order_by = order_by;
  }
  if (lesson_ids) {
    params.lesson_ids = lesson_ids;
  }
  if (chapter_id) {
    params.chapter_id = chapter_id;
  }
  if (homework_ids) {
    params.homework_ids = homework_ids;
  }
  if (student_id) {
    params.student_id = student_id;
  }

  const res = await axiosInstance.get(
    "/dashboard/teacher/homework/list-homeworks",
    {
      params,
    }
  );
  return res.data;
}

export async function exportTeacherAllHomework({
  course_id,
  start_date,
  end_date,
  page,
  limit,
  order_by,
  lesson_ids,
  chapter_id,
  homework_ids,
}: {
  course_id: string;
  start_date: number;
  end_date: number;
  page?: number;
  limit?: number;
  order_by?: "completed_homework" | "average_score";
  lesson_ids?: string;
  chapter_id?: string;
  homework_ids?: string;
}) {
  const params: any = {
    course_id,
    start_date,
    end_date,
    page,
    limit,
  };

  if (order_by) {
    params.order_by = order_by;
  }
  if (lesson_ids) {
    params.lesson_ids = lesson_ids;
  }
  if (chapter_id) {
    params.chapter_id = chapter_id;
  }
  if (homework_ids) {
    params.homework_ids = homework_ids;
  }

  const res = await axiosInstance.get("/dashboard/teacher/homework/export", {
    params,
    responseType: "blob",
  });
  return res.data;
}

export async function getTeacherDetailHomework({
  course_id,
  homework_id,
  start_date,
  end_date,
  page,
  limit,
}: {
  course_id: string;
  homework_id: string;
  start_date: number;
  end_date: number;
  page?: number;
  limit?: number;
}) {
  const res = await axiosInstance.get(
    `dashboard/teacher/homework/${homework_id}`,
    {
      params: {
        course_id,
        start_date,
        end_date,
        page,
        limit,
      },
    }
  );
  return res.data;
}

export async function exportTeacherDetailHomework({
  course_id,
  homework_id,
  start_date,
  end_date,
  page,
  limit,
}: {
  course_id: string;
  homework_id: string;
  start_date: number;
  end_date: number;
  page?: number;
  limit?: number;
}) {
  const res = await axiosInstance.get(
    `dashboard/teacher/homework/${homework_id}/export`,
    {
      params: {
        course_id,
        start_date,
        end_date,
        page,
        limit,
      },
      responseType: "blob",
    }
  );
  return res.data;
}

export async function getTeacherOverviewHomework({
  course_id,
  homework_id,
  start_date,
  end_date,
}: {
  course_id: string;
  homework_id: string;
  start_date: number;
  end_date: number;
}) {
  const res = await axiosInstance.get("/dashboard/teacher/homework-overview", {
    params: {
      course_id,
      homework_id,
      start_date,
      end_date,
    },
  });
  return res.data;
}

export async function getTeacherHomeworkScored({
  course_id,
  homework_id,
  start_date,
  end_date,
  page,
  limit,
  student_name,
}: {
  course_id?: string;
  homework_id?: string;
  start_date: number;
  end_date: number;
  page: number;
  limit: number;
  student_name?: string;
}) {
  const params: any = {
    start_date,
    end_date,
    page,
    limit,
  };

  if (course_id) params.course_id = course_id;
  if (homework_id) params.homework_id = homework_id;
  if (student_name) params.student_name = student_name;

  const res = await axiosInstance.get("/dashboard/teacher/homework-scored", {
    params,
  });
  return res.data;
}

export async function getTeacherHomeworkUnscored({
  course_id,
  homework_id,
  start_date,
  end_date,
  page,
  limit,
  student_name,
}: {
  course_id?: string;
  homework_id?: string;
  start_date: number;
  end_date: number;
  page: number;
  limit: number;
  student_name?: string;
}) {
  const params: any = {
    start_date,
    end_date,
    page,
    limit,
  };

  if (course_id) params.course_id = course_id;
  if (homework_id) params.homework_id = homework_id;
  if (student_name) params.student_name = student_name;

  const res = await axiosInstance.get("/dashboard/teacher/homework-unscored", {
    params,
  });
  return res.data;
}

export async function getTeacherHomeworkOverviewGrade({
  course_id,
  homework_id,
  start_date,
  end_date,
}: {
  course_id?: string;
  homework_id?: string;
  start_date: number;
  end_date: number;
}) {
  const params: any = {
    start_date,
    end_date,
  };

  if (course_id) params.course_id = course_id;
  if (homework_id) params.homework_id = homework_id;

  const res = await axiosInstance.get(
    "/dashboard/teacher/homework-overview-grade",
    {
      params,
    }
  );
  return res.data;
}

//Bộ lọc
export async function getListSchool() {
  const res = await axiosInstance.get("/dashboard/school-list");
  return res.data;
}

export async function getListClassMain({
  page,
  limit,
  school_id,
}: {
  page?: number;
  limit?: number;
  school_id?: string;
} = {}) {
  const params: any = {};
  if (page) params.page = page;
  if (limit) params.limit = limit;
  if (school_id) params.school_id = school_id;

  const res = await axiosInstance.get("/dashboard/class-main-list", {
    params,
  });
  return res.data;
}

export async function getListCourse({
  school_id,
  program_id,
  parent_course_id,
  assessment_id,
}: {
  school_id?: string;
  program_id?: string;
  parent_course_id?: string;
  assessment_id?: string;
} = {}) {
  const params: any = {};
  if (school_id) {
    params.school_id = school_id;
  }
  if (program_id) {
    params.program_id = program_id;
  }
  if (parent_course_id) {
    params.parent_course_id = parent_course_id;
  }
  if (assessment_id) {
    params.assessment_id = assessment_id;
  }
  const res = await axiosInstance.get("/dashboard/course-list", {
    params,
  });
  return res.data;
}

export async function getListChapter({
  course_id,
}: {
  course_id?: string;
} = {}) {
  const res = await axiosInstance.get("/dashboard/chapter-list", {
    params: course_id ? { course_id } : {},
  });
  return res.data;
}

export async function getListLesson({
  school_id,
  course_id,
  chapter_id,
}: {
  school_id?: string;
  course_id?: string;
  chapter_id?: string;
} = {}) {
  const params: any = {};
  if (school_id) params.school_id = school_id;
  if (course_id) params.course_id = course_id;
  if (chapter_id) params.chapter_id = chapter_id;

  const res = await axiosInstance.get("/dashboard/lesson-list", {
    params,
  });
  return res.data;
}

export async function getListTeacher({
  course_id,
  school_id,
}: {
  course_id?: string;
  school_id?: string;
} = {}) {
  const params: any = {};
  if (course_id) params.course_id = course_id;
  if (school_id) params.school_id = school_id;

  const res = await axiosInstance.get("/dashboard/teacher-list", {
    params,
  });
  return res.data;
}

export async function getListExam({
  course_id,
  subject_id,
  lesson_id,
}: {
  course_id?: string;
  subject_id?: string;
  lesson_id?: string;
}) {
  const params: any = {};
  if (course_id) params.course_id = course_id;
  if (subject_id) params.subject_id = subject_id;
  if (lesson_id) params.lesson_id = lesson_id;

  const res = await axiosInstance.get("/dashboard/exam-list", {
    params,
  });
  return res.data;
}

export async function getListHomework({
  course_id,
  subject_id,
  lesson_ids,
  is_assigned,
  chapter_id,
  start_date,
  end_date,
}: {
  course_id?: string;
  subject_id?: string;
  lesson_ids?: string;
  is_assigned?: boolean;
  chapter_id?: boolean;
  start_date?: number;
  end_date?: number;
}) {
  const params: any = {};
  if (course_id) params.course_id = course_id;
  if (subject_id) params.subject_id = subject_id;
  if (lesson_ids) params.lesson_ids = lesson_ids;
  if (chapter_id) params.chapter_id = chapter_id;
  if (typeof is_assigned !== "undefined") params.is_assigned = is_assigned;
  if (start_date) params.start_date = start_date;
  if (end_date) params.end_date = end_date;

  const res = await axiosInstance.get("/dashboard/homework-list", {
    params,
  });
  return res.data;
}

export async function getActiveUsersCount(minutes: number = 15) {
  const res = await axiosInstance.get("/manage/warnings/active-users-count", {
    params: { minutes },
  });
  return res.data;
}

export async function getActiveUsersList({
  minutes = 15,
  page = 1,
  limit = 20,
}: {
  minutes?: number;
  page?: number;
  limit?: number;
}) {
  const res = await axiosInstance.get("/manage/warnings/active-users", {
    params: { minutes, page, limit },
  });
  return res.data;
}

export async function getFailedLoginsCount(minutes: number = 3600) {
  const res = await axiosInstance.get("/manage/warnings/failed-logins-count", {
    params: { minutes },
  });
  return res.data;
}

export async function getFailedLoginsList({
  minutes = 60,
  page = 1,
  limit = 20,
}: {
  minutes?: number;
  page?: number;
  limit?: number;
}) {
  const res = await axiosInstance.get("/manage/warnings/failed-logins", {
    params: { minutes, page, limit },
  });
  return res.data;
}
