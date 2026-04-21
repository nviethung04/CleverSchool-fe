import axiosInstance from "./axios";

export interface AIGradingWritingRequest {
    essay_text: string;
    rubric?: string;
}

export interface AIGradingSpeakingRequest {
    audio_url: string;
    rubric?: string;
}

export interface AIGradingImageRequest {
    image_urls: string[];
    rubric?: string;
}

export interface AIGradingResponse {
    code?: number;
    success: boolean;
    data?: {
        overall_score: number;
        grammar_score: number;
        vocabulary_score: number;
        organization_score: number;
        content_score: number;
        feedback: string;
        strengths: string[] | null;
        improvements: string[] | null;
    };
    message?: string;
    error?: string;
    details?: string;
}

/**
 * Chấm điểm Writing bằng AI
 */
export async function gradeWritingByAI(
    payload: AIGradingWritingRequest
): Promise<AIGradingResponse> {
    try {
        const response = await axiosInstance.post<AIGradingResponse>(
            "/manage/ai/grading/writing",
            payload
        );
        return response.data;
    } catch (error: any) {
        console.error("Error grading writing by AI:", error);
        // Xử lý lỗi từ response
        if (error.response?.data) {
            throw {
                error: error.response.data.error || "Failed to grade writing",
                details: error.response.data.details || error.message,
                status: error.response.status,
            };
        }
        throw error;
    }
}

/**
 * Chấm điểm Speaking bằng AI
 */
export async function gradeSpeakingByAI(
    payload: AIGradingSpeakingRequest
): Promise<AIGradingResponse> {
    try {
        const response = await axiosInstance.post<AIGradingResponse>(
            "/manage/ai/grading/speaking",
            payload
        );
        return response.data;
    } catch (error: any) {
        console.error("Error grading speaking by AI:", error);
        // Xử lý lỗi từ response
        if (error.response?.data) {
            throw {
                error: error.response.data.error || "Failed to grade speaking",
                details: error.response.data.details || error.message,
                status: error.response.status,
            };
        }
        throw error;
    }
}

/**
 * Chấm điểm Image bằng AI
 */
export async function gradeImageByAI(
    payload: AIGradingImageRequest
): Promise<AIGradingResponse> {
    try {
        const response = await axiosInstance.post<AIGradingResponse>(
            "/manage/ai/grading/image",
            payload
        );
        return response.data;
    } catch (error: any) {
        console.error("Error grading image by AI:", error);
        // Xử lý lỗi từ response
        if (error.response?.data) {
            throw {
                error: error.response.data.error || "Failed to grade image",
                details: error.response.data.details || error.message,
                status: error.response.status,
            };
        }
        throw error;
    }
}
