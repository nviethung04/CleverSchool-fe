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
  // Subject management is hidden (default only 1 subject: Tiếng Anh)
  "admin/subjects",
  "admin/export",
  "admin/settings",
  "admin/notices",
  // Feedback (phản hồi/đánh giá): enable for Admin/GV/HS
  "criteria-assessment",
  "criteria-report",

  // Learning extensions (SCORM, lecture bank, contest, H5P)
  "lecture-bank",
  "contest",
  "scorm",
  "admin/h5p",
  // Thư viện tập tin tập trung — upload inline trong form vẫn hoạt động qua /api/upload-file
  "admin/images",
  // Học kỳ + lịch tuần (semesters, weeks, lesson_schedules) — ngoài MVP
  "admin/semesters",

  // Teacher — secondary (admin feedback vẫn ẩn qua admin/feedback)
];

/**
 * Học kỳ, lịch tuần (Schedule), chọn tuần trên BTVN HS / Bài học tuần GV.
 * Khi `false`: giao/làm bài theo khóa vẫn chạy (`week_id=0`); BE semesters/weeks không đổi.
 */
export const SEMESTER_SCHEDULE_UI_ENABLED = false;

/**
 * Tabs on /admin/users/list — slug: students | teachers | admins | schools
 * Role School (4) chưa có lọc dữ liệu theo trường — ẩn tab Quản lý trường.
 */
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

/**
 * Sửa câu hỏi theo bản clone trong bài tập (homework/exam/exercise).
 * Khi `false`: link sửa từ form bài tập luôn mở ngân hàng câu hỏi gốc, không gửi homework_id/exam_id/exercise_id.
 */
export const CLONE_QUESTION_EDIT_ENABLED = false;

/**
 * Nút Xuất dữ liệu / Nhập dữ liệu (Excel bulk) trên admin + ngân hàng câu hỏi GV.
 * Đặt `true` khi bật lại trên production.
 */
export const EXPORT_IMPORT_DATA_UI_ENABLED = false;

/**
 * Tab URL và Thư viện trong dialog thêm media (ảnh/audio/video) khi tạo/sửa câu hỏi.
 * Khi `false`: chỉ hiện tab Tải lên file.
 */
export const QUESTION_MEDIA_URL_LIBRARY_UI_ENABLED = false;
