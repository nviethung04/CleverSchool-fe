export const QUESTION_BANK_LIST_REFRESH_KEY = "cleverschool:refresh:question-bank";
export const ASSIGNMENTS_EXERCISES_REFRESH_KEY =
  "cleverschool:refresh:assignments-exercises";

export function markListForRefresh(key: string) {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(key, String(Date.now()));
  }
}

export function consumeListForRefresh(key: string): boolean {
  if (typeof window === "undefined") return false;
  const value = sessionStorage.getItem(key);
  if (!value) return false;
  sessionStorage.removeItem(key);
  return true;
}
