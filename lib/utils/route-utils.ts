import { User } from "@/lib/types/auth";

// Resolve current locale from URL path on the client; default to 'vi' on SSR
const resolveLocale = (): string => {
  try {
    if (typeof window !== "undefined") {
      const seg = window.location.pathname.split("/")[1];
      if (seg === "vi" || seg === "en") return seg;
    }
  } catch (_) {
    // no-op, fallback below
  }
  return "vi";
};

/** Path for next-intl Link/router — locale prefix is added automatically */
function pathForIntlLink(baseRoute: string, pathname: string): string {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${baseRoute}${path}`;
}

/**
 * Utility function to get the base route based on user role
 */
export const getBaseRoute = (user: User | null): string => {
  if (!user) return "/";

  switch (user.type) {
    case "admin":
      return "/admin";
    case "teacher":
      return "/teacher";
    case "student":
      return "";
    default:
      return "/";
  }
};

/**
 * Utility function to get the default dashboard route based on user role
 */
export const getDefaultRoute = (user: User | null): string => {
  const locale = resolveLocale();

  if (!user) return "/login";

  switch (user.type) {
    case "admin":
      return `/${locale}/admin/dashboard`;
    case "teacher":
      return `/${locale}/teacher/weekly-lessons`;
    case "student":
      return `/${locale}/assignments`;
    default:
      return "/login";
  }
};

//Bài tập
export const getAssignmentsRoute = (user: User | null): string => {
  const baseRoute = getBaseRoute(user);
  const locale = resolveLocale();
  return `/${locale}${baseRoute}/assignments`;
};

export const getCreateAssignmentRoute = (user: User | null): string => {
  const baseRoute = getBaseRoute(user);
  const locale = resolveLocale();
  return `/${locale}${baseRoute}/assignments/create`;
};

export const getCreateHomeworkRoute = (user: User | null): string => {
  const baseRoute = getBaseRoute(user);
  const locale = resolveLocale();
  return `/${locale}${baseRoute}/assignments/create-homework`;
};

export const getCreateAssessmentRoute = (user: User | null): string => {
  const baseRoute = getBaseRoute(user);
  const locale = resolveLocale();
  return `/${locale}${baseRoute}/assignments/create-assessment`;
};

export const getCreateExerciseRoute = (user: User | null): string => {
  const baseRoute = getBaseRoute(user);
  const locale = resolveLocale();
  return `/${locale}${baseRoute}/assignments/create-exercise`;
};

export const getEditAssignmentRoute = (
  user: User | null,
  id: string | number
): string => {
  const baseRoute = getBaseRoute(user);
  const locale = resolveLocale();
  return `/${locale}${baseRoute}/assignments/edit/${id}`;
};

export const getEditHomeworkRoute = (
  user: User | null,
  id: string | number
): string => {
  const baseRoute = getBaseRoute(user);
  const locale = resolveLocale();
  return `/${locale}${baseRoute}/assignments/edit-homework/${id}`;
};

export const getEditAssessmentRoute = (
  user: User | null,
  id: string | number
): string => {
  const baseRoute = getBaseRoute(user);
  const locale = resolveLocale();
  return `/${locale}${baseRoute}/assignments/edit-assessment/${id}`;
};

export const getEditExerciseRoute = (
  user: User | null,
  id: string | number
): string => {
  const baseRoute = getBaseRoute(user);
  const locale = resolveLocale();
  return `/${locale}${baseRoute}/assignments/edit-exercise/${id}`;
};

// export const getDoAssignmentRoute = (id: string | number): string => {
//   return `/assignments/do/${id}`;
// };

// export const getDoHomeworkRoute = (id: string | number): string => {
//   return `/assignments/do-homework/${id}`;
// };

//Bài giảng

export const getLectureRoute = (user: User | null): string => {
  const baseRoute = getBaseRoute(user);
  const locale = resolveLocale();
  return `/${locale}${baseRoute}/lecture-bank`;
};

export const getCreateLectureRoute = (user: User | null): string => {
  const baseRoute = getBaseRoute(user);
  const locale = resolveLocale();
  return `/${locale}${baseRoute}/lecture-bank/create`;
};

export const getEditLectureRoute = (
  user: User | null,
  id: string | number,
  courseId?: string | number
): string => {
  const baseRoute = getBaseRoute(user);
  const locale = resolveLocale();
  const baseUrl = `/${locale}${baseRoute}/lecture-bank/edit/${id}`;
  return courseId ? `${baseUrl}?course_id=${courseId}` : baseUrl;
};

export const getPreviewLectureRoute = (
  user: User | null,
  id: string | number,
  courseId?: string | number
): string => {
  const baseRoute = getBaseRoute(user);
  const locale = resolveLocale();
  const baseUrl = `/${locale}${baseRoute}/lecture-bank/preview/${id}`;
  return courseId ? `${baseUrl}?course_id=${courseId}` : baseUrl;
};

//Làm bài tập - bài kiểm tra

export const doHomeworkRoute = (
  user: User | null,
  id: string | number
): string => {
  const baseRoute = getBaseRoute(user);
  const locale = resolveLocale();
  return `/${locale}${baseRoute}/assignments/do-homework/${id}`;
};

export const doHomeworkWithLessonIdRoute = (
  user: User | null,
  id: string | number,
  lessonId: string | number
): string => {
  const baseRoute = getBaseRoute(user);
  const locale = resolveLocale();
  return `/${locale}${baseRoute}/assignments/do-homework/${id}?lessonId=${lessonId}`;
};

export const doHomeworkFromAssignmentsRoute = (
  user: User | null,
  id: string | number
): string => {
  const baseRoute = getBaseRoute(user);
  const locale = resolveLocale();
  return `/${locale}${baseRoute}/assignments/do-homework/${id}?from=assignments`;
};

export const doHomeworkFromDetailLessonRoute = (
  user: User | null,
  id: string | number,
  courseId: string | number,
  lessonId: string | number
): string => {
  const baseRoute = getBaseRoute(user);
  return pathForIntlLink(
    baseRoute,
    `/assignments/do-homework/${id}?from=lesson-detail&courseId=${courseId}&lessonId=${lessonId}`
  );
};

export const doHomeworkFromReportRoute = (
  user: User | null,
  id: string | number,
  lessonId?: string | number
): string => {
  const baseRoute = getBaseRoute(user);
  const locale = resolveLocale();
  const baseUrl = `/${locale}${baseRoute}/assignments/do-homework/${id}?from=progress-report`;
  return lessonId ? `${baseUrl}&lessonId=${lessonId}` : baseUrl;
};

export const doExerciseFromReportRoute = (
  user: User | null,
  id: string | number,
  lessonId?: string | number
): string => {
  const baseRoute = getBaseRoute(user);
  const locale = resolveLocale();
  const baseUrl = `/${locale}${baseRoute}/assignments/do-exercise/${id}?from=progress-report`;
  return lessonId ? `${baseUrl}&lessonId=${lessonId}` : baseUrl;
};

export const resultHomeworkRoute = (
  user: User | null,
  id: string | number
): string => {
  const baseRoute = getBaseRoute(user);
  const locale = resolveLocale();
  return `${baseRoute}/assignments/do-homework/${id}/result`;
};

export const resultHomeworkStudentRoute = (
  user: User | null,
  id: string | number,
  from?: string,
  courseId?: string | number,
  lessonId?: string | number
): string => {
  const baseRoute = getBaseRoute(user);
  const locale = resolveLocale();
  let query = [];
  if (from) query.push(`from=${from}`);
  if (courseId) query.push(`courseId=${courseId}`);
  if (lessonId) query.push(`lessonId=${lessonId}`);
  return query.length > 0
    ? `/${locale}${baseRoute}/assignments/do-homework/${id}/result?${query.join(
        "&"
      )}`
    : `/${locale}${baseRoute}/assignments/do-homework/${id}/result`;
};

export const reviewResultHomeworkFromAssignmentsStudentRoute = (
  user: User | null,
  id: string | number,
  from?: string,
  courseId?: string | number,
  lessonId?: string | number
): string => {
  const baseRoute = getBaseRoute(user);
  const locale = resolveLocale();
  let query = [];
  if (from) query.push(`from=${from}`);
  if (courseId) query.push(`courseId=${courseId}`);
  if (lessonId) query.push(`lessonId=${lessonId}`);
  return query.length > 0
    ? `/${locale}${baseRoute}/assignments/homework/${id}/result?from=assignments${query.join(
        "&"
      )}`
    : `/${locale}${baseRoute}/assignments/homework/${id}/result?from=assignments`;
};

export const reviewResultHomeworkFromDetailLessonStudentRoute = (
  user: User | null,
  id: string | number,
  from?: string,
  courseId?: string | number,
  lessonId?: string | number
): string => {
  const baseRoute = getBaseRoute(user);
  let query = [];
  if (from) query.push(`from=${from}`);
  if (courseId) query.push(`courseId=${courseId}`);
  if (lessonId) query.push(`lessonId=${lessonId}`);
  return query.length > 0
    ? pathForIntlLink(
        baseRoute,
        `/assignments/homework/${id}/result?from=lesson-detail&${query.join("&")}`
      )
    : pathForIntlLink(
        baseRoute,
        `/assignments/homework/${id}/result?from=lesson-detail`
      );
};

export const reviewResultHomeworkFromReportStudentRoute = (
  user: User | null,
  id: string | number,
  from?: string,
  courseId?: string | number,
  lessonId?: string | number
): string => {
  const baseRoute = getBaseRoute(user);
  const locale = resolveLocale();
  let query = [];
  if (from) query.push(`from=${from}`);
  if (courseId) query.push(`courseId=${courseId}`);
  if (lessonId) query.push(`lessonId=${lessonId}`);
  return query.length > 0
    ? `/${locale}${baseRoute}/assignments/homework/${id}/result?from=progress-report${query.join(
        "&"
      )}`
    : `/${locale}${baseRoute}/assignments/homework/${id}/result?from=progress-report`;
};

export const doExamRoute = (user: User | null, id: string | number): string => {
  const baseRoute = getBaseRoute(user);
  const locale = resolveLocale();
  return `/${locale}${baseRoute}/assignments/do/${id}`;
};

export const doExamWithLessonIdRoute = (
  user: User | null,
  id: string | number,
  lessonId: string | number
): string => {
  const baseRoute = getBaseRoute(user);
  const locale = resolveLocale();
  return `/${locale}${baseRoute}/assignments/do/${id}?lessonId=${lessonId}`;
};

export const doExamFromAssignmentsRoute = (
  user: User | null,
  id: string | number
): string => {
  const baseRoute = getBaseRoute(user);
  const locale = resolveLocale();
  return `/${locale}${baseRoute}/assignments/do/${id}?from=assigments`;
};

export const doExamFromDetailLessonRoute = (
  user: User | null,
  id: string | number,
  courseId: string | number,
  lessonId: string | number
): string => {
  const baseRoute = getBaseRoute(user);
  return pathForIntlLink(
    baseRoute,
    `/assignments/do/${id}?from=lesson-detail&courseId=${courseId}&lessonId=${lessonId}`
  );
};

export const doExamFromReportRoute = (
  user: User | null,
  id: string | number
): string => {
  const baseRoute = getBaseRoute(user);
  const locale = resolveLocale();
  return `/${locale}${baseRoute}/assignments/do/${id}?from=progress-report`;
};

export const resultExamRoute = (
  user: User | null,
  id: string | number
): string => {
  const baseRoute = getBaseRoute(user);
  const locale = resolveLocale();
  return `${baseRoute}/assignments/do/${id}/result`;
};

export const resultExamStudentRoute = (
  user: User | null,
  id: string | number,
  from?: string,
  courseId?: string | number,
  lessonId?: string | number
): string => {
  const baseRoute = getBaseRoute(user);
  const locale = resolveLocale();
  let query = [];
  if (from) query.push(`from=${from}`);
  if (courseId) query.push(`courseId=${courseId}`);
  if (lessonId) query.push(`lessonId=${lessonId}`);
  return query.length > 0
    ? `/${locale}${baseRoute}/assignments/do/${id}/result?${query.join("&")}`
    : `/${locale}${baseRoute}/assignments/do/${id}/result`;
};

export const reviewExamStudentRoute = (
  user: User | null,
  id: string | number,
  from?: string,
  courseId?: string | number,
  lessonId?: string | number
): string => {
  const baseRoute = getBaseRoute(user);
  const locale = resolveLocale();
  let query = [];
  if (from) query.push(`from=${from}`);
  if (courseId) query.push(`courseId=${courseId}`);
  if (lessonId) query.push(`lessonId=${lessonId}`);
  return query.length > 0
    ? `${baseRoute}/assignments/exam/${id}/review?${query.join("&")}`
    : `${baseRoute}/assignments/exam/${id}/review`;
};

export const reviewResultExamStudentRoute = (
  user: User | null,
  id: string | number,
  from?: string,
  courseId?: string | number,
  lessonId?: string | number
): string => {
  const baseRoute = getBaseRoute(user);
  const locale = resolveLocale();
  let query = [];
  if (from) query.push(`from=${from}`);
  if (courseId) query.push(`courseId=${courseId}`);
  if (lessonId) query.push(`lessonId=${lessonId}`);
  return query.length > 0
    ? `${baseRoute}/assignments/exam/${id}/result?${query.join("&")}`
    : `${baseRoute}/assignments/exam/${id}/result`;
};

export const doExerciseRoute = (
  user: User | null,
  id: string | number
): string => {
  const baseRoute = getBaseRoute(user);
  const locale = resolveLocale();
  return `/${locale}${baseRoute}/assignments/do-exercise/${id}`;
};

export const doExerciseWithLessonIdRoute = (
  user: User | null,
  id: string | number,
  lessonId: string | number
): string => {
  const baseRoute = getBaseRoute(user);
  const locale = resolveLocale();
  return `/${locale}${baseRoute}/assignments/do-exercise/${id}?lessonId=${lessonId}`;
};

export const resultExerciseRoute = (
  user: User | null,
  id: string | number
): string => {
  const baseRoute = getBaseRoute(user);
  const locale = resolveLocale();
  return `/${locale}${baseRoute}/assignments/do-exercise/${id}/result`;
};

export const doExerciseFromAssignmentsRoute = (
  user: User | null,
  id: string | number
): string => {
  const baseRoute = getBaseRoute(user);
  const locale = resolveLocale();
  return `/${locale}${baseRoute}/assignments/do-exercise/${id}?from=assigments`;
};

export const doExerciseFromDetailLessonRoute = (
  user: User | null,
  id: string | number,
  courseId: string | number,
  lessonId: string | number
): string => {
  const baseRoute = getBaseRoute(user);
  return pathForIntlLink(
    baseRoute,
    `/assignments/do-exercise/${id}?from=lesson-detail&courseId=${courseId}&lessonId=${lessonId}`
  );
};

export const reviewExerciseStudentRoute = (
  user: User | null,
  id: string | number,
  from?: string,
  courseId?: string | number,
  lessonId?: string | number
): string => {
  const baseRoute = getBaseRoute(user);
  let query = [];
  if (from) query.push(`from=${from}`);
  if (courseId) query.push(`courseId=${courseId}`);
  if (lessonId) query.push(`lessonId=${lessonId}`);
  return query.length > 0
    ? pathForIntlLink(
        baseRoute,
        `/assignments/exercise/${id}/review?${query.join("&")}`
      )
    : pathForIntlLink(baseRoute, `/assignments/exercise/${id}/review`);
};

export const reviewResultExerciseStudentRoute = (
  user: User | null,
  id: string | number,
  from?: string,
  courseId?: string | number,
  lessonId?: string | number
): string => {
  const baseRoute = getBaseRoute(user);
  const locale = resolveLocale();
  let query = [];
  if (from) query.push(`from=${from}`);
  if (courseId) query.push(`courseId=${courseId}`);
  if (lessonId) query.push(`lessonId=${lessonId}`);
  return query.length > 0
    ? `/${locale}${baseRoute}/assignments/exercise/${id}/result?${query.join(
        "&"
      )}`
    : `/${locale}${baseRoute}/assignments/exercise/${id}/result`;
};

export const resultExerciseStudentRoute = (
  user: User | null,
  id: string | number,
  from?: string,
  courseId?: string | number,
  lessonId?: string | number
): string => {
  const baseRoute = getBaseRoute(user);
  const locale = resolveLocale();
  let query = [];
  if (from) query.push(`from=${from}`);
  if (courseId) query.push(`courseId=${courseId}`);
  if (lessonId) query.push(`lessonId=${lessonId}`);
  return query.length > 0
    ? `/${locale}${baseRoute}/assignments/do-exercise/${id}/result?${query.join(
        "&"
      )}`
    : `/${locale}${baseRoute}/assignments/do-exercise/${id}/result`;
};

//Feedback
export const createFeedbackRoute = (user: User | null): string => {
  const baseRoute = getBaseRoute(user);
  const locale = resolveLocale();
  return `/${locale}${baseRoute}/feedback/create`;
};

export const getFeedbackRoute = (user: User | null): string => {
  const baseRoute = getBaseRoute(user);
  const locale = resolveLocale();
  return `/${locale}${baseRoute}/feedback/`;
};

export const getDetailFeedbackRoute = (
  user: User | null,
  id: string | number
): string => {
  const baseRoute = getBaseRoute(user);
  const locale = resolveLocale();
  return `/${locale}${baseRoute}/feedback/${id}/detail`;
};

export const editFeedbackRoute = (
  user: User | null,
  id: string | number
): string => {
  const baseRoute = getBaseRoute(user);
  const locale = resolveLocale();
  return `/${locale}${baseRoute}/feedback/${id}/edit`;
};
