import axiosInstance from "./axios"

// Hàm lấy danh sách vai trò (đã có)
export async function GetRoleList() {
  try {
    const response = await axiosInstance.get("/mng/roles")
    return response.data
  } catch (error: any) {
    console.error("Error fetching roles:", error)
    if (error.response) {
      console.error("Response data:", error.response.data)
    }
    throw error
  }
}

// ✅ Hàm mới: Lấy danh sách quyền theo ID của vai trò
export async function GetPermissionsByRoleId(roleId: string | number) {
  try {
    const response = await axiosInstance.get(`/mng/roles/${roleId}/permissions`)
    return response.data // Trả về nguyên object chứa Code, Message, Data
  } catch (error: any) {
    console.error(`Error fetching permissions for role ${roleId}:`, error)
    if (error.response) {
      console.error("Response data:", error.response.data)
    }
    throw error
  }
}
