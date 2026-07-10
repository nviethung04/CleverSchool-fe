/** Role id quản lý trường — khớp models.SchoolRoleId (BE). */
export const SCHOOL_ROLE_ID = 4;

export function isSchoolManager(
  user: { role_id?: number; sub_type?: string } | null | undefined
): boolean {
  if (!user) return false;
  if (user.role_id === SCHOOL_ROLE_ID) return true;
  return (user.sub_type ?? "").toLowerCase() === "school";
}
