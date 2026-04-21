// src/api/permissions.ts

import axiosInstance from "./axios";

// Hàm lấy danh sách quyền
export async function GetPermissions() {
  try {
    const response = await axiosInstance.get("/manage/permissions");
    return response.data;
  } catch (error: any) {
    console.error("Error fetching role permissions:", error);

    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
      console.error("Response headers:", error.response.headers);
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Error setting up request:", error.message);
    }

    throw error;
  }
}

// Hàm lấy danh sách quyền đang được kích hoạt
export async function GetActivePermissions() {
  try {
    const response = await axiosInstance.get("/manage/permissions/display");
    return response.data;
  } catch (error: any) {
    console.error("Error fetching active permissions:", error);

    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
      console.error("Response headers:", error.response.headers);
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Error setting up request:", error.message);
    }

    throw error;
  }
}

// Hàm cập nhật trạng thái kích hoạt của quyền
export async function UpdatePermissionStatus(data: any) {
  try {
    console.log(
      "Updating permission status with data:",
      JSON.stringify(data, null, 2)
    );

    const response = await axiosInstance.post("/manage/permissions/display", data);
    return response.data;
  } catch (error: any) {
    console.error("Error updating permission status:", error);

    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
      console.error("Response headers:", error.response.headers);
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Error setting up request:", error.message);
    }

    throw error;
  }
}

// Hàm cập nhật quyền cho vai trò
export async function UpdateRolePermissions(data: any) {
  try {
    console.log(
      "Updating role permissions with data:",
      JSON.stringify(data, null, 2)
    );

    const response = await axiosInstance.post("/manage/permissions", data);
    return response.data;
  } catch (error: any) {
    console.error("Error updating role permissions:", error);

    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
      console.error("Response headers:", error.response.headers);
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Error setting up request:", error.message);
    }

    throw error;
  }
}
