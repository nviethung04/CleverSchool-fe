import { FOLDER } from "@/lib/constants/folder";
import axiosInstance, { postMultipartUpload } from "./axios";
import { percentageToPixel } from "@/lib/utils/coordinate-utils";

// Updated interface for question media
export interface QuestionMedia {
  type: string;
  url: string;
}

// Interface for question item (answer, category, label, etc.)
export interface QuestionItem {
  id: number | string;
  text: string;
  media?: QuestionMedia;
  correct_position?: number
}

// Interface for blank coordinates
export interface BlankCoordinates {
  x: number;
  y: number;
  w: number;
  h: number;
}

// Interface for blank
export interface Blank {
  id: number;
  coordinates: BlankCoordinates;
}

// Interface cho câu hỏi
export interface QuestionType {
  id: number | string;
  kind: string;
  type: string;
  skill: string;
  level: string;
  topic: string;
  metadata: {
    instructions: string;
    points: number;
    time: number;
    display?: string;
  };
  content: {
    text: string;
    media?: QuestionMedia;
    medias?: QuestionMedia[];
  };
  options: {
    answers?: QuestionItem[];
    items?: QuestionItem[];
    categories?: QuestionItem[];
    labels?: QuestionItem[];
    blanks?: Blank[];
  };
  correct_answers: {
    list?: Record<string, number>;
    ids?: number[];
  };
  sort_position: number;
  image_width?: number;
  image_height?: number;
  created_at: string;
  updated_at: string;
  status?: number; // Adding for backward compatibility
}

// Type for question attribute node
export interface QuestionAttributeNode {
  id: string;
  parent_id: string;
  subject_id: string;
  name: string;
  level: number;
  weight: number;
  description: string;
  nodes: QuestionAttributeNode[];
}

// Type for API response
export interface QuestionAttributesResponse {
  code: number;
  message: string;
  data: {
    "@type": string;
    attributes: QuestionAttributeNode[];
  };
  error: string;
}

// Hàm xóa question theo id
export async function deleteQuestion(id: number) {
  try {
    const response = await axiosInstance.delete(`/manage/questions/${id}`, {
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
    });

    return response.data;
  } catch (error) {
    console.error(`Error deleting question with ID ${id}:`, error);
    throw error;
  }
}

// Hàm cập nhật question theo id
export async function updateQuestion(
  id: string,
  data: any,
  options?: {
    homework_id?: number;
    exam_id?: number;
    lesson_plan_part_id?: number;
  }
) {
  try {
    // Log data being sent to API for debugging
    console.log(
      `Updating question ${id} with data:`,
      JSON.stringify(data, null, 2)
    );

    // Chuẩn bị params cho query string
    const params: any = {};
    if (options?.homework_id !== undefined)
      params.homework_id = options.homework_id;
    if (options?.exam_id !== undefined) params.exam_id = options.exam_id;
    if (options?.lesson_plan_part_id !== undefined)
      params.lesson_plan_part_id = options.lesson_plan_part_id;

    const response = await axiosInstance.put(
      `/manage/questions/${id}`,
      data, // chỉ truyền data gốc
      {
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
        params, // truyền các giá trị vào query string
      }
    );

    return response.data;
  } catch (error: any) {
    console.error(`Error updating question with ID ${id}:`, error);

    // Log detailed error information
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

// Hàm get list getQuestions
export async function getQuestions(params?: {
  homework_id?: number;
  lesson_plan_part_id?: number;
  exam_id?: number;
  exercise_id?: number;
  status?: string;
  page?: number;
  per_page?: number;
  question_type?: string;
  keyword?: string; // Thêm keyword search theo text
  sort_created_at?: string; // Sắp xếp theo thời gian tạo: "newest" hoặc "oldest"
  attribute_ids?: string; // Danh sách attribute IDs được join bằng dấu phẩy (ví dụ: "3,5,6")
}): Promise<{
  questions: any[];
  total_count: number;
  current_page: number;
  total_pages: number;
}> {
  try {
    const {
      homework_id,
      lesson_plan_part_id,
      exam_id,
      exercise_id,
      status,
      page,
      per_page,
      question_type,
      keyword, // Lấy text từ params
      sort_created_at, // Lấy sort order từ params
      attribute_ids,
    } = params || {};
    const response = await axiosInstance.get("/manage/questions", {
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
      params: {
        homework_id,
        lesson_plan_part_id,
        exam_id,
        exercise_id,
        status,
        page,
        per_page,
        question_type,
        keyword, // Truyền keyword vào params để search
        sort_created_at, // Truyền sort order vào params
        attribute_ids,
      },
    });

    // Log response để debug
    console.log("API Response:", response.data);

    // Kiểm tra cấu trúc dữ liệu trả về
    if (response.data && response.data.data) {
      const questions = response.data.data.questions || [];
      const total_count = response.data.data.total_count || questions.length;
      const current_page = params?.page || 1;
      const per_page = params?.per_page || 20;
      const total_pages = Math.ceil(total_count / per_page);

      return {
        questions,
        total_count,
        current_page,
        total_pages,
      };
    } else if (response.data && Array.isArray(response.data)) {
      // Fallback cho trường hợp API trả về array trực tiếp
      return {
        questions: response.data,
        total_count: response.data.length,
        current_page: params?.page || 1,
        total_pages: 1,
      };
    } else if (
      response.data &&
      response.data.questions &&
      Array.isArray(response.data.questions)
    ) {
      // Fallback cho trường hợp API trả về { questions: [...] }
      return {
        questions: response.data.questions,
        total_count:
          response.data.total_count || response.data.questions.length,
        current_page: params?.page || 1,
        total_pages: Math.ceil(
          (response.data.total_count || response.data.questions.length) /
            (params?.per_page || 20)
        ),
      };
    } else {
      console.warn("Unexpected API response structure:", response.data);
      return {
        questions: [],
        total_count: 0,
        current_page: params?.page || 1,
        total_pages: 0,
      };
    }
  } catch (error) {
    console.error("Error fetching questions:", error);
    return {
      questions: [],
      total_count: 0,
      current_page: params?.page || 1,
      total_pages: 0,
    };
  }
}

// Hàm lấy chi tiết câu hỏi theo ID
export async function getQuestionById(
  id: number,
  options?: {
    homework_id?: number;
    exam_id?: number;
    lesson_plan_part_id?: number;
  }
) {
  try {
    // Chuẩn bị params cho query string
    const params: any = {};
    if (options?.homework_id !== undefined)
      params.homework_id = options.homework_id;
    if (options?.exam_id !== undefined) params.exam_id = options.exam_id;
    if (options?.lesson_plan_part_id !== undefined)
      params.lesson_plan_part_id = options.lesson_plan_part_id;

    const response = await axiosInstance.get(`/manage/questions/${id}`, {
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
      params,
    });

    // Log response để debug
    console.log("Question Detail API Response:", response.data);

    // Kiểm tra nếu response là HTML (ngrok error page)
    if (
      typeof response.data === "string" &&
      response.data.includes("<!DOCTYPE html>")
    ) {
      console.warn("Received HTML instead of JSON. API might be unavailable.");
      return null;
    }

    // Kiểm tra cấu trúc dữ liệu trả về
    if (response.data && response.data.data) {
      return response.data.data;
    } else if (response.data) {
      return response.data;
    } else {
      console.warn("Unexpected API response structure:", response.data);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching question with ID ${id}:`, error);
    return null;
  }
}

// Hàm gọi API tạo câu hỏi
export async function createQuestion(data: any) {
  try {
    // Log dữ liệu gửi đi để debug
    console.log("Sending data to API:", JSON.stringify(data, null, 2));

    // Sử dụng axios instance đã được cấu hình với token
    const response = await axiosInstance.post("/manage/questions", data);

    return response.data;
  } catch (error: any) {
    console.error("Error creating question:", error);

    // Log thêm thông tin chi tiết về lỗi
    if (error.response) {
      // Server trả về response với status code nằm ngoài range 2xx
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
      console.error("Response headers:", error.response.headers);
    } else if (error.request) {
      // Request đã được gửi nhưng không nhận được response
      console.error("No response received:", error.request);
    } else {
      // Có lỗi khi thiết lập request
      console.error("Error setting up request:", error.message);
    }

    throw error;
  }
}

/** Lấy URL public từ response POST /upload-file (proto File trong data). */
export function extractUploadFileUrl(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const body = payload as Record<string, any>;
  const inner = body.data;
  if (inner && typeof inner === "object") {
    if (typeof inner.url === "string" && inner.url.trim()) return inner.url.trim();
    if (typeof inner.path === "string" && inner.path.trim()) return inner.path.trim();
  }
  if (typeof body.url === "string" && body.url.trim()) return body.url.trim();
  return "";
}

// Hàm upload file
export async function uploadFile(file: File, path?: string) {
  try {
    const newPath = path && FOLDER.some(folder => path.includes(folder)) ? path : 'user/' + path
    
    const formData = new FormData();
    formData.append("path", newPath);
    formData.append("file", file);

    const response = await postMultipartUpload(formData, "/upload-file");
    const body = response.data as Record<string, any>;
    const url = extractUploadFileUrl(body);

    return {
      ...body,
      data: {
        ...(body?.data && typeof body.data === "object" ? body.data : {}),
        url,
      },
    };
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
}

// Cập nhật hàm getMediaType để xác định chính xác loại media
function getMediaType(url?: string): "image" | "video" | "audio" | "text" {
  if (!url) return "text";

  const lowerUrl = url.toLowerCase();

  if (lowerUrl.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)($|\?)/i)) {
    return "image";
  } else if (lowerUrl.match(/\.(mp4|webm|mov|avi|wmv)($|\?)/i)) {
    return "video";
  } else if (lowerUrl.match(/\.(mp3|wav|ogg|aac)($|\?)/i)) {
    return "audio";
  }

  // Nếu không thể xác định từ extension, thử xác định từ domain
  if (lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be")) {
    return "video";
  }

  // Kiểm tra nếu URL chứa các từ khóa liên quan đến audio/video
  if (
    lowerUrl.includes("audio") ||
    lowerUrl.includes("sound") ||
    lowerUrl.includes("mp3")
  ) {
    return "audio";
  }
  if (lowerUrl.includes("video") || lowerUrl.includes("mp4")) {
    return "video";
  }

  // Mặc định là image nếu có URL nhưng không xác định được loại
  return "image";
}

// Hàm xác định loại media và URL từ đối tượng
function determineMediaTypeAndUrl(obj: any): {
  type: "image" | "video" | "audio" | "text";
  url?: string;
} {
  if (!obj) return { type: "text" };

  if (obj.image) {
    return { type: "image", url: obj.image };
  } else if (obj.audio) {
    return { type: "audio", url: obj.audio };
  } else if (obj.video) {
    return { type: "video", url: obj.video };
  }

  return { type: "text" };
}

// Định nghĩa format attributes gửi lên
export interface QuestionAttributePayload {
  id: string;
  name: string;
  value: {
    id: string;
    name: string;
  };
}

// Helper function để tạo medias array từ question state
function createMediasArray(questionState: any): any[] {
  const medias: { type?: string; url?: string }[] = []

  // Thêm media chính của câu hỏi nếu có
  if (questionState.questionImage && questionState.questionImage.length > 0) {
    medias.push(...questionState.questionImage)
  }
  if (questionState.questionAudio && questionState.questionAudio.length > 0) {
    medias.push(...questionState.questionAudio)
  }
  if (questionState.questionVideo && questionState.questionVideo.length > 0) {
    medias.push(...questionState.questionVideo)
  }

  // Thêm media cho labeling (labelImage) nếu khác với media chính
  if (
    questionState.labelImage &&
    !medias.some((m) => m.url === questionState.labelImage)
  ) {
    medias.push({
      type: 'image',
      url: questionState.labelImage
    })
  }

  return medias
}

// Sửa hàm convertMultipleChoiceToApiFormat để xử lý đúng các loại media và nhận attributes
export function convertMultipleChoiceToApiFormat(
  questionState: any,
  attributes: QuestionAttributePayload[] = [],
  isCreate: boolean = false,
  customInstructions?: string
): any {
  // Tạo mảng answers từ answerOptions
  const answers = questionState.answerOptions.map((option: any) => {
    // Xác định loại media và URL
    let mediaType = "text";
    let mediaUrl = undefined;

    if (option.image) {
      mediaType = "image";
      mediaUrl = option.image;
    } else if (option.audio) {
      mediaType = "audio";
      mediaUrl = option.audio;
    } else if (option.video) {
      mediaType = "video";
      mediaUrl = option.video;
    }

    const answerObj: any = {
      text: option.text,
      media: {
        type: mediaType,
        url: mediaUrl,
      },
      is_correct: option.isCorrect,
    };
    // Nếu là update và id dương thì mới gửi id
    if (
      !isCreate &&
      typeof option.id === "number" &&
      option.id > 0 &&
      option.id < 1e6
    ) {
      answerObj.id = option.id;
    }
    return answerObj;
  });

  // Xác định loại media cho câu hỏi
  let questionMediaType = "text";
  let questionMediaUrl = undefined;

  if (questionState.questionImage) {
    questionMediaType = "image";
    questionMediaUrl = questionState.questionImage[0].url;
  } else if (questionState.questionAudio) {
    questionMediaType = "audio";
    questionMediaUrl = questionState.questionAudio[0].url;
  } else if (questionState.questionVideo) {
    questionMediaType = "video";
    questionMediaUrl = questionState.questionVideo[0].url;
  }

  // Tạo đối tượng media cho câu hỏi - luôn có trường type
  const questionMedia = {
    type: questionMediaType,
    url: questionMediaUrl,
  };

  // Tạo medias array
  const medias = createMediasArray(questionState);

  // Tạo đối tượng request API theo mẫu đã cung cấp
  return {
    type: "multiple_choice",
    skill: "Reading",
    level: "medium",
    topic: "grammar",
    metadata: {
      instructions: customInstructions || "Choose the correct answer.",
      points: questionState.points || 10,
      time: Math.round((questionState.timeLimit || 1.5) * 60), // Convert to seconds
    },
    content: {
      text: questionState.questionText,
      media: questionMedia, // Luôn gửi lên trường media
      medias: medias, // Thêm medias array
    },
    options: {
      answers,
    },
    correct_answers: {
      ids: [],
    },
    attributes,
  };
}

// Cập nhật hàm convertFillInBlankToApiFormat để xử lý đúng các loại media và nhận attributes
export function convertFillInBlankToApiFormat(
  questionState: any,
  attributes: QuestionAttributePayload[] = [],
  isCreate: boolean = false,
  customInstructions?: string
): any {
  // Tạo mảng answers từ blankAnswers
  const answers = questionState.blankAnswers.map(
    (answer: any, index: number) => {
      // Xác định loại media và URL
      let mediaType = "text";
      let mediaUrl = undefined;

      if (answer.image) {
        mediaType = "image";
        mediaUrl = answer.image;
      } else if (answer.audio) {
        mediaType = "audio";
        mediaUrl = answer.audio;
      }

      const answerObj: any = {
        text: answer.text,
        point: Math.round(
          questionState.points / questionState.blankAnswers.length
        ), // Chia điểm đều cho các blank
        media: {
          type: mediaType,
          url: mediaUrl,
        },
        correct_position: index + 1, // Vị trí của blank, bắt đầu từ 1
        group_position:
          answer.groupPosition !== null && answer.groupPosition !== undefined
            ? answer.groupPosition + 1
            : null,
      };
      // Nếu là update và id dương thì mới gửi id
      if (
        !isCreate &&
        typeof answer.id === "number" &&
        answer.id > 0 &&
        answer.id < 1e6
      ) {
        answerObj.id = answer.id;
      }
      return answerObj;
    }
  );

  // Tạo mảng groups cho options
  const groups = (questionState.blankGroups || []).map(
    (group: any, idx: number) => {
      // Đếm số answer tham chiếu group này
      const count = questionState.blankAnswers.filter(
        (item: any) => item.groupPosition === idx
      ).length;
      // Xác định media
      let mediaType = "text";
      let mediaUrl = undefined;
      if (group.image) {
        mediaType = "image";
        mediaUrl = group.image;
      } else if (group.audio) {
        mediaType = "audio";
        mediaUrl = group.audio;
      } else if (group.video) {
        mediaType = "video";
        mediaUrl = group.video;
      }
      return {
        position: idx + 1,
        count,
        text: group.text,
        media: {
          type: mediaType,
          url: mediaUrl,
        },
      };
    }
  );

  // Xác định loại media cho câu hỏi
  let questionMediaType = "text";
  let questionMediaUrl = undefined;

  if (questionState.questionImage) {
    questionMediaType = "image";
    questionMediaUrl = questionState.questionImage[0].url;
  } else if (questionState.questionAudio) {
    questionMediaType = "audio";
    questionMediaUrl = questionState.questionAudio[0].url;
  } else if (questionState.questionVideo) {
    questionMediaType = "video";
    questionMediaUrl = questionState.questionVideo[0].url;
  }

  // Tạo đối tượng media cho câu hỏi - luôn có trường type
  const questionMedia = {
    type: questionMediaType,
    url: questionMediaUrl,
  };

  // Tạo medias array
  const medias = createMediasArray(questionState);

  // Tạo đối tượng request API theo mẫu đã cung cấp
  return {
    type: "fill_in_blanks",
    skill: "Use of English",
    level: "easy",
    topic: "grammar",
    metadata: {
      instructions: customInstructions || "Fill in the blank.",
      points: questionState.points || 10,
      time: Math.round((questionState.timeLimit || 1.5) * 60), // Convert to seconds
    },
    content: {
      text: questionState.questionText,
      media: questionMedia, // Luôn gửi lên trường media
      medias: medias, // Thêm medias array
    },
    options: {
      answers,
      groups,
    },
    correct_answers: {
      list: {},
    },
    attributes,
  };
}

// Cập nhật hàm convertOrderingToApiFormat để xử lý đúng các loại media và nhận attributes
export function convertOrderingToApiFormat(
  questionState: any,
  attributes: QuestionAttributePayload[] = [],
  isCreate: boolean = false,
  customInstructions?: string
): any {
  // Tạo mảng answers từ orderItems
  const answers = questionState.orderItems.map((item: any, index: number) => {
    // Xác định loại media và URL
    let mediaType = "text";
    let mediaUrl = undefined;

    if (item.image) {
      mediaType = "image";
      mediaUrl = item.image;
    } else if (item.audio) {
      mediaType = "audio";
      mediaUrl = item.audio;
    } else if (item.video) {
      mediaType = "video";
      mediaUrl = item.video;
    }

    const answerObj: any = {
      text: item.text,
      point: Math.round(questionState.points / questionState.orderItems.length), // Chia điểm đều cho các item
      media: {
        type: mediaType,
        url: mediaUrl,
      },
      correct_position: index + 1, // Thứ tự đúng
      group_position:
        item.groupPosition !== null && item.groupPosition !== undefined
          ? item.groupPosition + 1
          : null, // index của group (bắt đầu từ 1)
    };
    // Nếu là update và id dương thì mới gửi id
    if (
      !isCreate &&
      typeof item.id === "number" &&
      item.id > 0 &&
      item.id < 1e6
    ) {
      answerObj.id = item.id;
    }
    return answerObj;
  });

  // Tạo mảng groups cho options
  const groups = (questionState.orderGroups || []).map(
    (group: any, idx: number) => {
      // Đếm số answer tham chiếu group này
      const count = questionState.orderItems.filter(
        (item: any) => item.groupPosition === idx
      ).length;
      // Xác định media
      let mediaType = "text";
      let mediaUrl = undefined;
      if (group.image) {
        mediaType = "image";
        mediaUrl = group.image;
      } else if (group.audio) {
        mediaType = "audio";
        mediaUrl = group.audio;
      } else if (group.video) {
        mediaType = "video";
        mediaUrl = group.video;
      }
      return {
        position: idx + 1,
        count,
        text: group.text,
        media: {
          type: mediaType,
          url: mediaUrl,
        },
      };
    }
  );

  // Xác định loại media cho câu hỏi
  let questionMediaType = "text";
  let questionMediaUrl = undefined;

  if (questionState.questionImage) {
    questionMediaType = "image";
    questionMediaUrl = questionState.questionImage[0].url;
  } else if (questionState.questionAudio) {
    questionMediaType = "audio";
    questionMediaUrl = questionState.questionAudio[0].url;
  } else if (questionState.questionVideo) {
    questionMediaType = "video";
    questionMediaUrl = questionState.questionVideo[0].url;
  }

  // Tạo đối tượng media cho câu hỏi
  const questionMedia = {
    type: questionMediaType,
    url: questionMediaUrl,
  };

  // Tạo medias array
  const medias = createMediasArray(questionState);

  // Tạo đối tượng request API theo mẫu đã cung cấp
  return {
    type: "ordering",
    skill: "Use of English",
    level: "easy",
    topic: "grammar",
    metadata: {
      instructions: customInstructions || "Reorder.",
      points: questionState.points || 10,
      time: Math.round((questionState.timeLimit || 1.5) * 60), // Convert to seconds
      display: questionState.display || "vertical",
    },
    content: {
      text: questionState.questionText,
      media: questionMedia,
      medias: medias, // Thêm medias array
    },
    options: {
      answers,
      groups,
    },
    correct_answers: {
      ids: [],
    },
    attributes,
  };
}

// Cập nhật hàm convertMatchingToApiFormat để xử lý đúng các loại media và nhận attributes
export function convertMatchingToApiFormat(
  questionState: any,
  attributes: QuestionAttributePayload[] = [],
  isCreate: boolean = false,
  customInstructions?: string
): any {
  const {
    questionText,
    questionImage,
    questionAudio,
    questionVideo,
    matchItems,
    points,
    timeLimit,
  } = questionState;

  // Create media object if any media exists
  const media = questionImage
    ? { type: "image", url: questionImage[0].url }
    : questionAudio
    ? { type: "audio", url: questionAudio[0].url }
    : questionVideo
    ? { type: "video", url: questionVideo[0].url }
    : { type: "text" };

  // Sort items by position
  const sortedItems = [...matchItems].sort((a, b) => a.position - b.position);

  // Create sources for API format
  const sources = sortedItems.map((item: any) => {
    let leftMediaType = "text";
    let leftMediaUrl = undefined;
    if (item.leftImage) {
      leftMediaType = "image";
      leftMediaUrl = item.leftImage;
    } else if (item.leftAudio) {
      leftMediaType = "audio";
      leftMediaUrl = item.leftAudio;
    } else if (item.leftVideo) {
      leftMediaType = "video";
      leftMediaUrl = item.leftVideo;
    }
    const sourceObj: any = {
      content: {
        text: item.leftText,
        media: {
          type: leftMediaType,
          url: leftMediaUrl,
        },
      },
    };
    // Nếu là update và sourceId hợp lệ thì mới gửi id
    if (
      !isCreate &&
      typeof item.sourceId === "number" &&
      item.sourceId > 0 &&
      item.sourceId < 1e6
    ) {
      sourceObj.id = item.sourceId;
    }
    return sourceObj;
  });

  // Create targets for API format
  const targets = sortedItems.map((item: any, idx: number) => {
    let rightMediaType = "text";
    let rightMediaUrl = undefined;
    if (item.rightImage) {
      rightMediaType = "image";
      rightMediaUrl = item.rightImage;
    } else if (item.rightAudio) {
      rightMediaType = "audio";
      rightMediaUrl = item.rightAudio;
    } else if (item.rightVideo) {
      rightMediaType = "video";
      rightMediaUrl = item.rightVideo;
    }
    const targetObj: any = {
      content: {
        text: item.rightText,
        point: points,
        media: {
          type: rightMediaType,
          url: rightMediaUrl,
        },
        correct_position: idx + 1,
      },
    };
    // Nếu là update và targetId hợp lệ thì mới gửi id
    if (
      !isCreate &&
      typeof item.targetId === "number" &&
      item.targetId > 0 &&
      item.targetId < 1e6
    ) {
      targetObj.id = item.targetId;
    }
    return targetObj;
  });

  // correct_answers.list is always empty for matching
  const correctList: Record<string, string> = {};

  // Tạo medias array
  const medias = createMediasArray(questionState);

  // Tạo đối tượng request API theo mẫu đã cung cấp
  return {
    type: "matching",
    skill: "Use of English",
    level: "easy",
    topic: "grammar",
    metadata: {
      instructions: customInstructions || "Match.",
      points: points,
      time: timeLimit,
    },
    content: {
      text: questionText,
      media: media,
      medias: medias, // Thêm medias array
    },
    options: {
      sources,
      targets,
    },
    correct_answers: {
      list: correctList,
    },
    attributes,
  };
}

// Hàm chuyển đổi dữ liệu từ Redux store sang định dạng API cho Drag and Drop
export function convertDragDropToApiFormat(
  questionState: any,
  attributes: QuestionAttributePayload[] = [],
  isCreate: boolean = false,
  customInstructions?: string
): any {
  // Xác định loại media cho câu hỏi
  let questionMediaType = "text";
  let questionMediaUrl = undefined;

  if (questionState.questionImage) {
    questionMediaType = "image";
    questionMediaUrl = questionState.questionImage[0].url;
  } else if (questionState.questionAudio) {
    questionMediaType = "audio";
    questionMediaUrl = questionState.questionAudio[0].url;
  } else if (questionState.questionVideo) {
    questionMediaType = "video";
    questionMediaUrl = questionState.questionVideo[0].url;
  }

  // Tạo đối tượng media cho câu hỏi
  const questionMedia = {
    type: questionMediaType,
    url: questionMediaUrl,
  };

  // Lấy các tùy chọn đúng và sai
  const correctOptions = questionState.dragDropOptions.filter(
    (option: any) => option.isCorrect
  );
  const incorrectOptions = questionState.dragDropOptions.filter(
    (option: any) => !option.isCorrect
  );

  // Tạo mảng answers (cả đúng và sai, giữ nguyên thứ tự trong dragDropOptions)
  const answers = questionState.dragDropOptions.map(
    (option: any, index: number) => {
      // Xác định loại media và URL
      let mediaType = "text";
      let mediaUrl = undefined;

      if (option.image) {
        mediaType = "image";
        mediaUrl = option.image;
      } else if (option.audio) {
        mediaType = "audio";
        mediaUrl = option.audio;
      } else if (option.video) {
        mediaType = "video";
        mediaUrl = option.video;
      }

      const answerObj: any = {
        text: option.text,
        point: 1, // Mỗi đáp án có 1 điểm
        media: {
          type: mediaType,
          url: mediaUrl,
        },
        correct_position: option.isCorrect
          ? correctOptions.indexOf(option) + 1
          : undefined, // Vị trí đúng, bắt đầu từ 1
        group_position:
          option.groupPosition !== null && option.groupPosition !== undefined
            ? option.groupPosition + 1
            : null,
      };
      // Nếu là update và id dương thì mới gửi id
      if (
        !isCreate &&
        typeof option.id === "number" &&
        option.id > 0 &&
        option.id < 1e6
      ) {
        answerObj.id = option.id;
      }
      return answerObj;
    }
  );

  // Tạo mảng groups cho options
  const groups = (questionState.dragDropGroups || []).map(
    (group: any, idx: number) => {
      // Đếm số answer tham chiếu group này
      const count = questionState.dragDropOptions.filter(
        (item: any) => item.groupPosition === idx
      ).length;
      // Xác định media
      let mediaType = "text";
      let mediaUrl = undefined;
      if (group.image) {
        mediaType = "image";
        mediaUrl = group.image;
      } else if (group.audio) {
        mediaType = "audio";
        mediaUrl = group.audio;
      } else if (group.video) {
        mediaType = "video";
        mediaUrl = group.video;
      }
      return {
        position: idx + 1,
        count,
        text: group.text,
        media: {
          type: mediaType,
          url: mediaUrl,
        },
      };
    }
  );

  // Tạo medias array
  const medias = createMediasArray(questionState);

  // Tạo đối tượng request API theo mẫu đã cung cấp
  return {
    type: "drag_drop",
    skill: "Use of English",
    level: "easy",
    topic: "grammar",
    metadata: {
      instructions: customInstructions || "Drag and drop.",
      points: questionState.points || 10,
      time: Math.round((questionState.timeLimit || 1.5) * 60), // Convert to seconds
    },
    content: {
      text: questionState.questionText, // Giữ nguyên [blank] không thêm số
      media: questionMedia,
      medias: medias, // Thêm medias array
    },
    options: {
      answers,
      groups,
    },
    correct_answers: {
      list: {},
    },
    attributes,
  };
}

// Đổi tên hàm export 'tôi' thành 'convertLabelingToApiFormat'
export function convertLabelingToApiFormat(
  questionState: any,
  attributes: QuestionAttributePayload[] = [],
  isCreate: boolean = false,
  customInstructions?: string
): any {
  // Xác định loại media cho câu hỏi
  let questionMediaType = "text";
  let questionMediaUrl = undefined;

  if (questionState.labelImage) {
    questionMediaType = "image";
    questionMediaUrl = questionState.labelImage;
  }

  // Tạo đối tượng media cho câu hỏi
  const questionMedia = {
    type: questionMediaType,
    url: questionMediaUrl,
  };

  // Tạo mảng labels từ labelPositions, lấy text từ group
  const labels = questionState.labelPositions.map(
    (position: any, index: number) => {
      let text = "";
      let group_position = null;
      if (
        typeof position.groupPosition === "number" &&
        questionState.labelGroups &&
        questionState.labelGroups[position.groupPosition]
      ) {
        text = questionState.labelGroups[position.groupPosition].text;
        group_position = position.groupPosition + 1;
      }
      const labelObj: any = {
        text,
        point: Math.round(
          questionState.points / questionState.labelPositions.length
        ),
        media: {
          type: "text",
        },
        correct_position: index + 1,
        group_position,
      };
      // Gửi id cho label cũ (labelApiId dương hoặc là string số), label mới thì không gửi id
      if (
        !isCreate &&
        ((typeof position.labelApiId === "number" &&
          position.labelApiId > 0 &&
          position.labelApiId < 1e6) ||
          (typeof position.labelApiId === "string" &&
            /^\d+$/.test(position.labelApiId) &&
            parseInt(position.labelApiId) > 0 &&
            parseInt(position.labelApiId) < 1e6))
      ) {
        labelObj.id = Number(position.labelApiId);
      }
      // Thêm log kiểm tra từng labelObj
      if (typeof window !== "undefined") {
        console.log(
          "[DEBUG][convertLabelingToApiFormat] labelObj:",
          labelObj,
          "labelApiId:",
          position.labelApiId
        );
      }
      return labelObj;
    }
  );

  // Tạo mảng blanks từ labelPositions
  const blanks = questionState.labelPositions.map((position: any) => {
    // Lấy kích thước ảnh thực tế từ questionState
    const imageWidth = 1024;
    const imageHeight = 576;

    // Sử dụng utility function để chuyển đổi chính xác
    const pixelCoordinates = percentageToPixel(
      {
        x: position.x,
        y: position.y,
        width: position.width,
        height: position.height,
      },
      imageWidth,
      imageHeight
    );

    return {
      coordinates: pixelCoordinates,
    };
  });

  // Tạo medias array
  const medias = createMediasArray(questionState);

  // Tạo đối tượng request API theo mẫu đã cung cấp
  return {
    type: "labeling",
    skill: "Use of English",
    level: "easy",
    topic: "grammar",
    metadata: {
      instructions: customInstructions || "Label the picture.",
      points: questionState.points || 10,
      time: Math.round((questionState.timeLimit || 1.5) * 60), // Convert to seconds
    },
    content: {
      text: questionState.questionText,
      media: questionMedia,
      medias: medias, // Thêm medias array
    },
    options: {
      labels,
      blanks,
    },
    correct_answers: {
      list: {},
    },
    image_width: questionState.imageWidth,
    image_height: questionState.imageHeight,
    attributes,
  };
}

// Hàm chuyển đổi dữ liệu từ Redux store sang định dạng API cho Writing
export function convertWritingToApiFormat(
  questionState: any,
  attributes: QuestionAttributePayload[] = [],
  customInstructions?: string
): any {
  // Xác định loại media cho câu hỏi
  let questionMediaType = "text";
  let questionMediaUrl = undefined;

  if (questionState.questionImage) {
    questionMediaType = "image";
    questionMediaUrl = questionState.questionImage[0].url;
  } else if (questionState.questionAudio) {
    questionMediaType = "audio";
    questionMediaUrl = questionState.questionAudio[0].url;
  } else if (questionState.questionVideo) {
    questionMediaType = "video";
    questionMediaUrl = questionState.questionVideo[0].url;
  }

  // Tạo đối tượng media cho câu hỏi
  const questionMedia = {
    type: questionMediaType,
    url: questionMediaUrl,
  };

  // Tạo medias array
  const medias = createMediasArray(questionState);

  // Tạo đối tượng request API theo mẫu đã cung cấp
  return {
    type: "writing",
    skill: "Use of English",
    level: "easy",
    topic: "grammar",
    metadata: {
      instructions:
        customInstructions ||
        questionState.writingInstructions ||
        "Write your answer in the box.",
      points: questionState.points || 10,
      time: Math.round((questionState.timeLimit || 1.5) * 60), // Convert to seconds
      // Only set when user explicitly configured it; 0 means "no limit".
      max_characters: questionState.writingMaxCharacters || 0,
      allow_image_upload: questionState.writingAllowImageUpload || false,
    },
    content: {
      text: questionState.questionText,
      media: questionMedia,
      medias: medias, // Thêm medias array
    },
    attributes,
  };
}

// Hàm chuyển đổi dữ liệu từ Redux store sang định dạng API cho Speaking
export function convertSpeakingToApiFormat(
  questionState: any,
  attributes: QuestionAttributePayload[] = [],
  customInstructions?: string
): any {
  // Xác định loại media cho câu hỏi
  let questionMediaType = "text";
  let questionMediaUrl = undefined;

  if (questionState.questionImage) {
    questionMediaType = "image";
    questionMediaUrl = questionState.questionImage[0].url;
  } else if (questionState.questionAudio) {
    questionMediaType = "audio";
    questionMediaUrl = questionState.questionAudio[0].url;
  } else if (questionState.questionVideo) {
    questionMediaType = "video";
    questionMediaUrl = questionState.questionVideo[0].url;
  }

  // Tạo đối tượng media cho câu hỏi
  const questionMedia = {
    type: questionMediaType,
    url: questionMediaUrl,
  };

  // Tạo medias array
  const medias = createMediasArray(questionState);

  // Tạo đối tượng request API theo mẫu đã cung cấp
  return {
    type: "speaking",
    skill: "Speaking",
    level: "easy",
    topic: "grammar",
    metadata: {
      instructions:
        customInstructions ||
        questionState.speakingInstructions ||
        "Speak and record.",
      points: questionState.points || 10,
      time: Math.round((questionState.timeLimit || 1.5) * 60), // Convert to seconds
      max_recording_time: questionState.speakingMaxDuration || 60, // Thời gian ghi âm tối đa (giây)
    },
    content: {
      text: questionState.questionText,
      media: questionMedia,
      medias: medias, // Thêm medias array
    },
    attributes,
  };
}

// Hàm chuyển đổi dữ liệu từ Redux store sang định dạng API cho Category
export function convertCategoryToApiFormat(
  questionState: any,
  attributes: QuestionAttributePayload[] = [],
  isCreate: boolean = false,
  customInstructions?: string
): any {
  // Xác định loại media cho câu hỏi
  let questionMediaType = "text";
  let questionMediaUrl = undefined;

  if (questionState.questionImage) {
    questionMediaType = "image";
    questionMediaUrl = questionState.questionImage[0].url;
  } else if (questionState.questionAudio) {
    questionMediaType = "audio";
    questionMediaUrl = questionState.questionAudio[0].url;
  } else if (questionState.questionVideo) {
    questionMediaType = "video";
    questionMediaUrl = questionState.questionVideo[0].url;
  }

  // Tạo đối tượng media cho câu hỏi
  const questionMedia = {
    type: questionMediaType,
    url: questionMediaUrl,
  };

  // Tạo danh sách các danh mục
  const categories = questionState.categories.map(
    (category: any, idx: number) => {
      // Determine media for category (prefer audio then image; video optional)
      let mediaType: "text" | "image" | "audio" | "video" = "text";
      let mediaUrl: string | undefined = undefined;
      if (category.audio) {
        mediaType = "audio";
        mediaUrl = category.audio;
      } else if (category.image) {
        mediaType = "image";
        mediaUrl = category.image;
      } else if (category.video) {
        mediaType = "video";
        mediaUrl = category.video;
      }
      const categoryObj: any = {
        name: category.name,
        media: {
          type: mediaType,
          url: mediaUrl,
        },
      };
      // Chỉ gửi id khi cập nhật (update). Khi tạo mới thì bỏ id để backend tự sinh.
      if (!isCreate) {
        const numericId = Number(category.id);
        if (!Number.isNaN(numericId) && numericId > 0 && numericId < 1e6) {
          categoryObj.id = numericId;
        } else {
          // Fallback: dùng vị trí nếu không có id hợp lệ
          categoryObj.id = idx + 1;
        }
      }
      return categoryObj;
    }
  );

  // Tạo danh sách các mục cần phân loại
  const items = [];
  const correctList: Record<string, string> = {};
  let itemIndex = 0;

  // Duyệt qua từng danh mục
  for (const [catIdx, category] of questionState.categories.entries()) {
    const categoryGroupId =
      !isCreate &&
      typeof category.id === "number" &&
      category.id > 0 &&
      category.id < 1e6
        ? String(category.id)
        : String(catIdx + 1);

    for (const item of category.items) {
      itemIndex++;
      // Xác định loại media và URL
      let mediaType = "text";
      let mediaUrl = undefined;

      if (item.image) {
        mediaType = "image";
        mediaUrl = item.image;
      } else if (item.audio) {
        mediaType = "audio";
        mediaUrl = item.audio;
      }

      const itemObj: any = {
        text: item.text,
        point: Math.round(
          questionState.points /
            questionState.categories.reduce(
              (total: number, cat: any) => total + cat.items.length,
              0
            ) || 1
        ),
        media: {
          type: mediaType,
          url: mediaUrl,
        },
        group_position: catIdx + 1, // Sử dụng số thứ tự (1-based) thay vì id
      };
      // Nếu là update và id dương thì mới gửi id
      if (
        !isCreate &&
        typeof item.id === "number" &&
        item.id > 0 &&
        item.id < 1e6
      ) {
        itemObj.id = item.id;
        correctList[String(item.id)] = categoryGroupId;
      } else {
        correctList[String(itemIndex)] = categoryGroupId;
      }
      items.push(itemObj);
    }
  }

  // Tạo medias array
  const medias = createMediasArray(questionState);

  // Tạo đối tượng request API theo mẫu đã cung cấp
  return {
    type: "category",
    skill: "Use of English",
    level: "easy",
    topic: "grammar",
    metadata: {
      instructions: customInstructions || "Sort the words out.",
      points: questionState.points || 10,
      time: Math.round((questionState.timeLimit || 1.5) * 60), // Convert to seconds
    },
    content: {
      text: questionState.questionText,
      media: questionMedia,
      medias: medias, // Thêm medias array
    },
    options: {
      items,
      categories,
    },
    correct_answers: {
      list: correctList,
    },
    attributes,
  };
}

// API: GET /manage/question-attributes?subject_id=...
export async function getQuestionAttributes(
  subject_id: string | number
): Promise<QuestionAttributeNode[]> {
  try {
    const response = await axiosInstance.get<QuestionAttributesResponse>(
      "/manage/question-attributes/parent",
      {
        params: { subject_id },
        headers: { "ngrok-skip-browser-warning": "true" },
      }
    );
    if (
      response.data &&
      response.data.data &&
      Array.isArray(response.data.data.attributes)
    ) {
      return response.data.data.attributes;
    }
    return [];
  } catch (error) {
    console.error("Error fetching question attributes:", error);
    return [];
  }
}
