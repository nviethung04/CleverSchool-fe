export const QUESTION_BANK_LIST_REFRESH_KEY = "cleverschool:refresh:question-bank";
export const ASSIGNMENTS_EXERCISES_REFRESH_KEY =
  "cleverschool:refresh:assignments-exercises";
export const ASSIGNMENTS_HOMEWORKS_REFRESH_KEY =
  "cleverschool:refresh:assignments-homeworks";

export function markListForRefresh(key: string) {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(key, String(Date.now()));
  }
}

/** Read refresh flag without removing it (safe for React Strict Mode double-mount). */
export function peekListForRefresh(key: string): boolean {
  if (typeof window === "undefined") return false;
  return !!sessionStorage.getItem(key);
}

export function clearListForRefresh(key: string) {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(key);
}

/** @deprecated Prefer peekListForRefresh + clearListForRefresh after successful fetch */
export function consumeListForRefresh(key: string): boolean {
  if (typeof window === "undefined") return false;
  const value = sessionStorage.getItem(key);
  if (!value) return false;
  sessionStorage.removeItem(key);
  return true;
}
