import axiosInstance from "./axios";

export type H5PContentSummary = {
  contentId: string;
  title: string;
  mainLibrary: string;
};

type H5PApiContentItem = {
  id: string;
  content_id: string;
  title: string;
  library: string;
  parameters: unknown;
  metadata: unknown | null;
  created_at: string;
  updated_at: string;
};

type H5PApiResponse = {
  code: number;
  message: string;
  data?: {
    "@type"?: string;
    contents?: H5PApiContentItem[];
    total_count?: string | number;
  };
  error?: string | null;
};

export async function getH5PList(): Promise<H5PContentSummary[]> {
  const { data } = await axiosInstance.get<H5PApiResponse>("/h5p/content");

  const contents = data?.data?.contents ?? [];

  if (!Array.isArray(contents)) return [];

  return contents.map((item) => ({
    contentId: String(item.content_id ?? ""),
    title: String(item.title ?? ""),
    mainLibrary: String(item.library ?? ""),
  }));
}

export async function deleteH5PContent(contentId: string): Promise<void> {
  if (!contentId) return;
  const url = `/h5p/content/${encodeURIComponent(contentId)}`;
  await axiosInstance.delete(url);
}

export type H5PContentScoreRequest = {
  contentId: string;
  score: string;
  maxScore: string;
  opened: string;
  finished: string;
};

export async function postH5PContentScore(
  payload: H5PContentScoreRequest
): Promise<void> {
  await axiosInstance.post("/h5p/content-score", payload);
}
