/**
 * Route fragments hidden from navigation (sidebar / header).
 * Pages remain reachable by direct URL; only UI entry points are removed.
 *
 * Aligns with MVP scope in be/docs/features.md §6 — core LMS only.
 * Remove a slug here to show that module again in the menu.
 */
export const HIDDEN_MODULES: string[] = [
  // HR / org extensions (not in current MVP)
  "departments",
  "degrees",
  "certificates",
  "employee-positions",
  "training-levels",

  // Admin — reporting & configuration extras
  "users/permissions",
  "admin/export",
  "admin/settings",
  "admin/notices",
  "admin/feedback",
  "criteria-assessment",
  "criteria-report",

  // Learning extensions (H5P, SCORM, lecture bank, contest)
  "admin/h5p",
  "lecture-bank",
  "contest",
  "scorm",

  // Teacher / student — secondary UX
  "ranking",
  "feedback",
];

/** Tabs hidden on /admin/users/list (MVP — hide school accounts tab) */
export const HIDDEN_USER_LIST_TABS: string[] = ["schools"];

/**
 * Tab / nút "Thảo luận" trên trang khóa học (HS + GV).
 * Đặt `true` khi bật chat khóa học trên production.
 */
export const COURSE_DISCUSSION_UI_ENABLED = false;

/**
 * Tab "Kiểm tra và đánh giá" trên `/teacher/reports`.
 * BE chưa có `/api/manage/study-reports/*` — đặt `true` sau khi triển khai module study-reports.
 */
export const TEACHER_REPORTS_ASSESSMENT_TAB_ENABLED = true;

/**
 * Tab "Xuất mẫu nhập điểm & đánh giá" trên `/teacher/reports`.
 * Ngoài MVP — đặt `true` khi bật lại trên production.
 */
export const TEACHER_REPORTS_EXPORT_TAB_ENABLED = false;
