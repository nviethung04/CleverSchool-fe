"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getFeedbackDetail, UpdateFeedback } from "@/lib/api/feedbacks";
import { toast } from "sonner";
import CreateFeedbackComponent from "../../components/create-feedback";

interface FeedbackData {
  id: string;
  title: string;
  content: string;
  response?: string;
  note?: string;
  type?: string;
  status?: string | number;
  created_at: string;
  updated_at: string;
  file_url?: string;
}

export default function EditFeedbackPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);

  // Edit form data
  const [editData, setEditData] = useState({
    response: "",
    note: "",
    type: "",
  });

  // Form data for create-feedback component
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    files: [],
  });

  // Existing files for display in edit mode
  const [existingFiles, setExistingFiles] = useState<
    Array<{
      id: string;
      name: string;
      url: string;
      type?: string;
    }>
  >([]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getFeedbackDetail(id)
      .then((res) => {
        if (res && res.data) {
          const feedbackData = res.data;
          setFeedback(feedbackData);

          // Set edit data
          setEditData({
            response: feedbackData.response || "",
            note: feedbackData.note || "",
            type: feedbackData.type || "",
          });

          // Set form data for display
          setFormData({
            title: feedbackData.title || "",
            content: feedbackData.content || "",
            files: [],
          });

          // Parse and set existing files
          if (feedbackData.file_url) {
            try {
              const fileUrls = JSON.parse(feedbackData.file_url);
              if (Array.isArray(fileUrls)) {
                const files = fileUrls.map((url, index) => ({
                  id: String(index),
                  name: url.split("/").pop() || `file_${index + 1}`,
                  url: url,
                  type: url.match(/\.(jpg|jpeg|png|gif)$/i)
                    ? "image/png"
                    : "application/octet-stream",
                }));
                setExistingFiles(files);
              }
            } catch (error) {
              console.error("Error parsing file_url:", error);
              setExistingFiles([]);
            }
          } else {
            setExistingFiles([]);
          }
        } else {
          toast.error("Không tìm thấy nhận xét");
        }
      })
      .catch(() => toast.error("Lỗi khi tải chi tiết nhận xét"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleEditFieldChange = (field: string, value: string) => {
    setEditData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveEdit = async () => {
    if (!feedback) return;

    setSaving(true);
    try {
      await UpdateFeedback(id, editData);

      toast.success("Cập nhật nhận xét thành công!");
      router.back();
    } catch (error) {
      console.error("Error updating feedback:", error);
      toast.error("Không thể cập nhật nhận xét");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-lg">
        <div className="animate-spin h-8 w-8 mx-auto mb-4 border-4 border-gray-300 border-t-blue-600 rounded-full"></div>
        Đang tải thông tin nhận xét...
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

  return (
    <CreateFeedbackComponent
      formData={formData}
      isSubmitting={saving}
      onInputChange={() => {}} // Not used in edit mode
      onFileChange={() => {}} // Not used in edit mode
      onRemoveFile={() => {}} // Not used in edit mode
      onSubmit={() => {}} // Not used in edit mode
      readOnly={false}
      isEditMode={true}
      editData={editData}
      onEditFieldChange={handleEditFieldChange}
      onSaveEdit={handleSaveEdit}
      onCancelEdit={handleCancelEdit}
      existingFiles={existingFiles}
    />
  );
}
