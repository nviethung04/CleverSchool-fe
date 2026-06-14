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

  // Learning extensions (H5P, SCORM, lecture bank, flashcard, contest)
  "admin/h5p",
  "lecture-bank",
  "flashcard",
  "contest",
  "scorm",

  // Teacher / student — secondary UX
  "ranking",
  "feedback",
];

/** Tabs hidden on /admin/users/list (MVP — hide school accounts tab) */
export const HIDDEN_USER_LIST_TABS: string[] = ["schools"];
