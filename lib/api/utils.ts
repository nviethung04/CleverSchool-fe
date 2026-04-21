import axiosInstance from "./axios";

export async function getTagsList() {
    try {
        const response = await axiosInstance.get("manage/tags");
        return response.data;
    } catch (error: any) {
        console.error("Error fetching tags: ", error);
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

export async function getTopicsList() {
    try {
        const response = await axiosInstance.get("manage/topics");
        return response.data;
    } catch (error: any) {
        console.error("Error fetching topics: ", error);
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

export async function getSkillsList() {
    try {
        const response = await axiosInstance.get("manage/skills");
        return response.data;
    } catch (error: any) {
        console.error("Error fetching skills: ", error);
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

export async function getActiveUsersCount(minutes: number = 15) {
    try {
        const response = await axiosInstance.get("manage/warnings/active-users-count", {
            params: { minutes }
        });
        return response.data;
    } catch (error: any) {
        console.error("Error fetching active users count: ", error);
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
