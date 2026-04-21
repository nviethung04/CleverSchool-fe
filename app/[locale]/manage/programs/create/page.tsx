"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useTypedTranslations } from "@/lib/i18n/client";
import { uploadFile } from "@/lib/api/questions";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/context/auth-context";
import { RoleBasedHeaderSidebar } from "@/components/layout/role-based-header-sidebar";
import { CreateProgram } from "@/lib/api/programs";
import { GetSubjectsList } from "@/lib/api/subjects";
import { ArrowLeft } from "lucide-react";
import { sortAlphabetGeneric } from "@/lib/utils";

// Định nghĩa type cho form
interface CreateProgramFormState {
  name: string;
  target: string;
  description: string;
  cover: string;
  coverType: "upload" | "link";
  duration: number;
  startDate: string;
  endDate: string;
  skills: string[];
  chapters: { name: string; lessons: string[] }[];
  students: {
    id: string;
    name: string;
    email: string;
    school?: string;
    class?: string;
  }[];
  subject_id: string;
  book_url: string;
}

interface Subject {
  id: string;
  name: string;
  type?: string;
  description: string;
  status: boolean;
  created_at: string;
  updated_at: string;
}

function CreateProgramForm({
  form,
  setForm,
  handleCreateProgram,
  showSuccess,
  setShowSuccess,
  createdProgramId,
  router,
  subjects,
}: any) {
  const t = useTypedTranslations("teacherCourses");
  const params = useParams() as { locale?: string };
  const locale = params?.locale || "vi";

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-2 md:px-6 py-8">
        {/* Header Section - Minimalist */}
        {window.history.length > 1 && <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900 mt-8 xl:mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("backButton")}
        </Button>}
        <div className="mb-12">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Tạo chương trình mới
            </h1>
            <p className="text-gray-500 font-medium">
              Thiết lập thông tin cơ bản cho chương trình
            </p>
          </div>
        </div>

        {/* Main Form Card */}
        <div className="container mx-auto px-0">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-8">
            {/* Thông tin cơ bản */}
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Tên chương trình <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={form.name}
                    onChange={(e) =>
                      setForm((f: CreateProgramFormState) => ({
                        ...f,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Nhập tên chương trình"
                    className="rounded-xl border-gray-200 focus:border-emerald-300 focus:ring-emerald-200 px-4 py-3 text-gray-900 placeholder:text-gray-400"
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Môn học <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={form.subject_id}
                      onValueChange={(value) =>
                        setForm((f: CreateProgramFormState) => ({
                          ...f,
                          subject_id: value,
                        }))
                      }
                    >
                      <SelectTrigger className="rounded-xl border-gray-200 focus:border-emerald-300 focus:ring-emerald-200 px-4 py-3 text-gray-900">
                        <SelectValue placeholder="Chọn môn học" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-gray-200">
                        {subjects && subjects.length > 0 ? (
                          sortAlphabetGeneric(subjects, (item: any) => item.name, true).map((subject: Subject) => (
                            <SelectItem
                              key={subject.id}
                              value={subject.id}
                              className="rounded-xl"
                            >
                              {subject.name}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-2 py-1.5 text-sm text-gray-500 text-center">
                            Không có môn học nào
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Mục tiêu chương trình
                    </label>
                    <Input
                      value={form.target}
                      onChange={(e) =>
                        setForm((f: CreateProgramFormState) => ({
                          ...f,
                          target: e.target.value,
                        }))
                      }
                      placeholder="Nhập mục tiêu"
                      className="rounded-xl border-gray-200 focus:border-emerald-300 focus:ring-emerald-200 px-4 py-3 text-gray-900 placeholder:text-gray-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Thời gian học (tuần)
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={form.duration}
                    onChange={(e) =>
                      setForm((f: CreateProgramFormState) => ({
                        ...f,
                        duration: Number(e.target.value),
                      }))
                    }
                    className="rounded-xl border-gray-200 focus:border-emerald-300 focus:ring-emerald-200 px-4 py-3 text-gray-900 w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Mô tả chi tiết
                </label>
                <Textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((f: CreateProgramFormState) => ({
                      ...f,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Nhập mô tả chi tiết về chương trình"
                  className="rounded-xl border-gray-200 focus:border-emerald-300 focus:ring-emerald-200 px-4 py-3 text-gray-900 placeholder:text-gray-400 min-h-[120px] resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Đường dẫn sách 
                </label>
                  <Input
                    value={form.book_url}
                    onChange={(e) =>
                      setForm((f: CreateProgramFormState) => ({
                        ...f,
                        book_url: e.target.value,
                      }))
                    }
                    placeholder="Dán liên kết vào đây"
                    className="rounded-xl border-gray-200 focus:border-emerald-300 focus:ring-emerald-200 px-4 py-3 text-gray-900 placeholder:text-gray-400"
                  />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Ảnh bìa
                </label>
                <div className="flex gap-3 mb-4 flex-wrap w-full sm:w-auto">
                  <Button
                    variant={
                      form.coverType === "upload" ? "default" : "outline"
                    }
                    onClick={() =>
                      setForm((f: CreateProgramFormState) => ({
                        ...f,
                        coverType: "upload",
                      }))
                    }
                    className={`w-full sm:w-auto rounded-xl px-6 py-2 font-medium ${
                      form.coverType === "upload"
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600"
                    }`}
                  >
                    Tải lên ảnh
                  </Button>
                  <Button
                    variant={form.coverType === "link" ? "default" : "outline"}
                    onClick={() =>
                      setForm((f: CreateProgramFormState) => ({
                        ...f,
                        coverType: "link",
                      }))
                    }
                    className={`w-full sm:w-auto rounded-xl px-6 py-2 font-medium ${
                      form.coverType === "link"
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600"
                    }`}
                  >
                    Liên kết ảnh
                  </Button>
                </div>
                {form.coverType === "upload" ? (
                  <Input
                    type="file"
                    className="rounded-xl border-gray-200 focus:border-emerald-300 focus:ring-emerald-200 px-4 pt-3 pb-6 text-gray-900 file:mr-4 file:py-2 file:px-6 file:rounded-lg file:border-0 file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 flex items-start min-h-[60px]"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setForm((f: CreateProgramFormState) => ({
                          ...f,
                          cover: URL.createObjectURL(file),
                        }));
                      }
                    }}
                  />
                ) : (
                  <Input
                    value={form.cover}
                    onChange={(e) =>
                      setForm((f: CreateProgramFormState) => ({
                        ...f,
                        cover: e.target.value,
                      }))
                    }
                    placeholder="Dán liên kết ảnh vào đây"
                    className="rounded-xl border-gray-200 focus:border-emerald-300 focus:ring-emerald-200 px-4 py-3 text-gray-900 placeholder:text-gray-400"
                  />
                )}
                {form.cover && (
                  <div className="mt-6 flex justify-center">
                    <div className="relative bg-gray-50 rounded-2xl p-4 border border-gray-200">
                      <Image
                        src={form.cover}
                        alt="cover"
                        width={300}
                        height={180}
                        className="rounded-xl object-cover border border-gray-100 shadow-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Button */}
            <div className="flex justify-end pt-8 border-t border-gray-100">
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl px-8 py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 min-w-[200px]"
                onClick={handleCreateProgram}
              >
                Tạo chương trình
              </Button>
            </div>
          </div>
        </div>

        {/* Success Modal - Minimalist */}
        {showSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md flex flex-col items-center border-0">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                <svg
                  className="w-8 h-8 text-emerald-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">
                Tạo chương trình thành công!
              </h3>
              <p className="text-gray-600 text-center mb-8 leading-relaxed">
                Chương trình đã được tạo thành công. Bạn có thể chỉnh sửa thông
                tin chi tiết.
              </p>
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200"
                onClick={() => {
                  if (createdProgramId)
                    router.push(
                      `/${locale}/manage/programs/${createdProgramId}/edit`
                    );
                }}
              >
                Chỉnh sửa chương trình
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function CreateProgramPage() {
  const { user } = useAuth();
  const [form, setForm] = useState<CreateProgramFormState>({
    name: "",
    target: "",
    description: "",
    cover: "",
    coverType: "upload",
    duration: 1,
    startDate: "",
    endDate: "",
    skills: [],
    chapters: [],
    students: [],
    subject_id: "",
    book_url: "",
  });

  const router = useRouter();
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdProgramId, setCreatedProgramId] = useState<string | null>(null);
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);

  // Fetch danh sách môn học
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoadingSubjects(true);
        const response = await GetSubjectsList();
        // Cấu trúc response: response.data.data.subjects
        if (response?.data?.data?.subjects) {
          setSubjects(response.data.data.subjects);
        } else if (response?.data?.subjects) {
          // Fallback cho trường hợp response structure khác
          setSubjects(response.data.subjects);
        } else {
          setSubjects([]);
        }
      } catch (error: any) {
        console.error("Error fetching subjects:", error);
        toast({
          title: "Lỗi",
          description: "Không thể tải danh sách môn học",
          variant: "destructive",
        });
        setSubjects([]);
      } finally {
        setLoadingSubjects(false);
      }
    };

    fetchSubjects();
  }, [toast]);

  // Hàm tạo chương trình
  const handleCreateProgram = async () => {
    // Validate các trường bắt buộc
    if (!form.name.trim()) {
      alert("Vui lòng nhập tên chương trình.");
      return;
    }
    if (!form.subject_id) {
      alert("Vui lòng chọn môn học.");
      return;
    }
    if (!form.target.trim()) {
      alert("Vui lòng nhập mục tiêu chương trình.");
      return;
    }
    if (!form.description.trim()) {
      alert("Vui lòng nhập mô tả chi tiết cho chương trình.");
      return;
    }

    // Validate ngày bắt đầu
    // Removed date validation

    if (!form.cover.trim()) {
      alert("Vui lòng nhập hoặc upload ảnh cover cho chương trình.");
      return;
    }

    let coverUrl = form.cover;
    // Nếu user upload file từ máy, cover là objectURL => cần upload lên server
    if (
      form.coverType === "upload" &&
      form.cover &&
      form.cover.startsWith("blob:")
    ) {
      const fileInput = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      const file = fileInput?.files?.[0];
      if (!file) {
        alert("Vui lòng chọn file ảnh cover.");
        return;
      }
      try {
        const uploadResponse = await uploadFile(file, "programs/covers");
        if (uploadResponse.error) {
          throw new Error(uploadResponse.error);
        }
        const fileUrl = uploadResponse?.url || uploadResponse?.data?.url;
        if (!fileUrl) {
          throw new Error("Không nhận được URL file từ server");
        }
        coverUrl = fileUrl;
      } catch (error: any) {
        console.error("Lỗi khi upload ảnh cover:", error);
        toast({
          title: "Lỗi tải lên",
          description:
            error.message || "Không thể tải lên ảnh cover. Vui lòng thử lại.",
          variant: "destructive",
        });
        return;
      }
    } else if (form.coverType === "link") {
      // Validate url ảnh
      const isImageUrl = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)$/i.test(
        form.cover.trim()
      );
      if (!isImageUrl) {
        alert(
          "Vui lòng nhập đúng url ảnh cover (jpg, jpeg, png, gif, webp, svg)"
        );
        return;
      }
    }

    try {
      const now = new Date().toISOString();
      const selectedSubject = subjects.find((s) => s.id === form.subject_id);
      const data = {
        name: form.name,
        description: form.description,
        type: "", // mặc định rỗng
        level: "", // mặc định rỗng
        duration: String(form.duration),
        image: coverUrl,
        book_url: form.book_url,
        status: true,
        subject_id: Number(form.subject_id),
        student_count: 0,
        target: form.target,
        subject: selectedSubject
          ? {
              id: Number(selectedSubject.id),
              name: selectedSubject.name,
              description: selectedSubject.description || "",
              status: selectedSubject.status,
              created_at: selectedSubject.created_at || now,
              updated_at: selectedSubject.updated_at || now,
            }
          : {
              id: 0,
              name: "",
              description: "",
              status: true,
              created_at: now,
              updated_at: now,
            },
        schools: [
          {
            id: 0,
            name: "",
          },
        ],
        created_at: now,
        updated_at: now,
      };
      const res = await CreateProgram(data);
      setCreatedProgramId(res?.data?.id || res?.id || res?.program_id || null);
      setShowSuccess(true);
    } catch (err) {
      console.error("Tạo chương trình thất bại:", err);
    }
  };

  if (!user) return null;

  return (
    <RoleBasedHeaderSidebar>
      <CreateProgramForm
        form={form}
        setForm={setForm}
        handleCreateProgram={handleCreateProgram}
        showSuccess={showSuccess}
        setShowSuccess={setShowSuccess}
        createdProgramId={createdProgramId}
        router={router}
        subjects={subjects}
      />
    </RoleBasedHeaderSidebar>
  );
}
