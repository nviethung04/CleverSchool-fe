import axiosInstance from "./axios";

export async function UploadMedia(file: File, path: string = "user/avatars") {
    try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("path", path); // Mặc định là 'avatars'

        const response = await axiosInstance.post("/upload-file", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });

        return response.data;
    } catch (error: any) {
        console.error("Error uploading media:", error);

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

export async function UploadLogo(file: File, path: string = "logos") {
    try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("path", path); // Mặc định là 'logo'

        const response = await axiosInstance.post("/upload-file", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });

        return response.data;
    } catch (error: any) {
        console.error("Error uploading media:", error);

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

export async function UploadFile(file: File, path: string = "certificates") {
    try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("path", path); // Mặc định là 'files'

        const response = await axiosInstance.post("/upload-file", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });

        return response.data;
    } catch (error: any) {
        console.error("Error uploading file:", error);

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
