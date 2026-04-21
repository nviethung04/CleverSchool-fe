"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getFeedbackDetail } from "@/lib/api/feedbacks";
import CreateFeedbackComponent from "../../components/create-feedback";
import { toast } from "sonner";

export default function FeedbackDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getFeedbackDetail(id)
      .then((res) => {
        if (res && res.data) {
          setFeedback(res.data);
        } else {
          toast.error("Không tìm thấy nhận xét");
        }
      })
      .catch(() => toast.error("Lỗi khi tải chi tiết nhận xét"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="p-8 text-center text-lg">
        Đang tải chi tiết nhận xét...
      </div>
    );
  }
  if (!feedback) {
    return (
      <div className="p-8 text-center text-red-500">
        Không tìm thấy nhận xét
      </div>
    );
  }

  // Chuẩn bị dữ liệu cho CreateFeedbackComponent
  let files = [];
  try {
    files = feedback.file_url
      ? JSON.parse(feedback.file_url).map((url: string, idx: number) => ({
          id: String(idx),
          name: url.split("/").pop() || `file_${idx + 1}`,
          url,
          type: url.match(/\.(jpg|jpeg|png|gif)$/i)
            ? "image/png"
            : "application/octet-stream",
          size: 0,
          isUploading: false,
          uploadProgress: 100,
          preview: url.match(/\.(jpg|jpeg|png|gif)$/i) ? url : undefined,
        }))
      : [];
  } catch {
    files = [];
  }

  const formData = {
    title: feedback.title || "",
    content: feedback.content || "",
    files,
  };

  // Render UI, tất cả input đều disabled/readOnly, không cho upload/xóa file
  return (
    <CreateFeedbackComponent
      formData={formData}
      isSubmitting={false}
      onInputChange={() => {}}
      onFileChange={() => {}}
      onRemoveFile={() => {}}
      onSubmit={() => {}}
      readOnly={true}
    />
  );
}
