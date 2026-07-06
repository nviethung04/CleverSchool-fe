/**
 * Dashboard admin MVP — chỉ hiển thị phần được bật ở đây.
 * Ẩn Speaking/Writing khỏi mọi thống kê giao/chấm bài.
 */

export const DASHBOARD_HIDE_SPEAKING_WRITING = true;

export type DashboardTabId =
  | "overview"
  | "learning"
  | "behavior"
  | "grading"
  | "questions"
  | "alerts"
  | "report";

/** Tab hiển thị trên MVP */
export const DASHBOARD_VISIBLE_TABS: DashboardTabId[] = ["overview", "alerts"];

export const DASHBOARD_FILTERS = {
  school: true,
  program: false,
  course: false,
  teacher: false,
  year: true,
  month: true,
  role: false,
  export: false,
} as const;

/** Thẻ số tab Tổng quan */
export const DASHBOARD_OVERVIEW_CARDS = {
  totalUsers: false,
  onlineUsers: false,
  onlineUsers24h: false,
  onlineUsers1w: false,
  onlineUsers1m: false,
  totalSchools: true,
  totalTeachers: true,
  totalStudents: true,
  activeToday: true,
} as const;

export const DASHBOARD_OVERVIEW_CHARTS = {
  courseOverview: true,
  completionRate: false,
} as const;

/** Tab Cảnh báo */
export const DASHBOARD_ALERTS = {
  inactiveStudents: true,
  decliningStudents: false,
  slowGradingTeachers: true,
  failedLogins: false,
} as const;

/** Map tab UI → param API `tab` */
export function dashboardTabToApiParam(tab: DashboardTabId): string {
  switch (tab) {
    case "learning":
      return "quality";
    case "alerts":
      return "warning";
    case "questions":
      return "question";
    case "report":
      return "";
    default:
      return tab;
  }
}
