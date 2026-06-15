"use client";

import React, { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  BookOpen,
  Edit,
  Plus,
  Save,
  Trash2,
  ArrowLeft,
  Edit2,
  ArrowUpDown,
  GripVertical,
  LucideChevronLeft,
} from "lucide-react";
import { Plus as LucidePlus } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/context/auth-context";
import { RoleBasedHeaderSidebar } from "@/components/layout/role-based-header-sidebar";
import { useRouter, useParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import axiosInstance from "@/lib/api/axios";
import {
  CreateChapter,
  UpdateChapter,
  DeleteChapter,
  SortLessons,
} from "@/lib/api/chapters";
import { GetLessons, UpdateLesson } from "@/lib/api/lessons";
import { GetSchoolList } from "@/lib/api/schools";
import { UploadFile } from "@/lib/api/picture";
import { GetProgramDetail, UpdateProgram } from "@/lib/api/programs";
import { GetSubjectsList } from "@/lib/api/subjects";
import type { Lesson } from "@/lib/api/lessons";
import type { Chapter } from "@/lib/api/chapters";
import { LessonForm } from "@/components/lesson-form";

// Lesson Selection Modal Component - Same as course page
const LessonModal = ({
  open,
  onSelect,
  onClose,
  chapterId,
  onCreateLesson,
}: {
  open: boolean;
  onSelect: (lesson: Lesson, onSuccess?: () => void) => Promise<void>;
  onClose: () => void;
  chapterId: string;
  onCreateLesson: () => void;
}) => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateLesson, setShowCreateLesson] = useState(false);

  useEffect(() => {
    if (open) {
      setLoading(true);
      GetLessons({ page: 1, limit: 1000, chapter_id: 0 })
        .then((res) => {
          setLessons(res?.data?.lessons || []);
        })
        .catch((err) => {
          console.error("Error fetching lessons:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open]);

  const filteredLessons = lessons.filter((lesson) =>
    lesson.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] rounded-2xl border-0 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900">
            Chọn bài học để thêm vào chương
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Chọn bài học từ danh sách để thêm vào chương này
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2 items-center">
            <Input
              placeholder="Tìm kiếm bài học..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 flex-1"
            />
            <Button
              variant="outline"
              className="rounded-xl border-gray-200 hover:border-green-300 hover:bg-green-50 px-4"
              onClick={() => {
                onCreateLesson();
              }}
            >
              Tạo bài học
            </Button>
          </div>

          <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-xl p-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <div className="text-gray-600">
                  Đang tải danh sách bài học...
                </div>
              </div>
            ) : filteredLessons.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                Không tìm thấy bài học nào
              </div>
            ) : (
              <div className="space-y-2">
                {filteredLessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => onSelect(lesson)}
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {lesson.title}
                      </h3>
                      {lesson.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {lesson.description}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                    >
                      Chọn
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-xl px-6"
          >
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

function EditProgramContent({
  chapterLessonSelect,
  setChapterLessonSelect,
  popuploading,
  setPopuploading,
  popuploadingText,
  setPopuploadingText,
  refreshTrigger,
}: {
  chapterLessonSelect: { idx: string; show: boolean };
  setChapterLessonSelect: (value: { idx: string; show: boolean }) => void;
  popuploading: boolean;
  setPopuploading: (loading: boolean) => void;
  popuploadingText: string;
  setPopuploadingText: (text: string) => void;
  refreshTrigger: number;
}) {
  const { user } = useAuth();
  const params = useParams();
  const programIdParam = params.id;
  const programId = Array.isArray(programIdParam)
    ? programIdParam[0]
    : programIdParam;
  const router = useRouter();
  const { toast } = useToast();

  // State
  const [form, setForm] = useState({
    name: "",
    target: "",
    description: "",
    cover: "",
    coverType: "upload",
    duration: 1 as number | "",
    chapters: [] as Chapter[],
    subject_id: "",
    book_url: "",
  });
  const [programData, setProgramData] = useState<any>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [showAddChapterDialog, setShowAddChapterDialog] = useState(false);
  const [newChapter, setNewChapter] = useState({ title: "", description: "" });
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [isFormChanged, setIsFormChanged] = useState(false);
  const initialFormRef = useRef<any>(null);
  const [isSavingProgram, setIsSavingProgram] = useState(false);
  const [expandedDescriptions, setExpandedDescriptions] = useState<{
    [key: string]: boolean;
  }>({});
  const [showCreateLesson, setShowCreateLesson] = useState(false);
  const [currentChapterId, setCurrentChapterId] = useState<string>("");
  const [deleteChapterConfirm, setDeleteChapterConfirm] = useState<{
    show: boolean;
    chapterId: string;
    chapterTitle: string;
  }>({
    show: false,
    chapterId: "",
    chapterTitle: "",
  });
  const [shouldClampDescription, setShouldClampDescription] = useState<{
    [key: string]: boolean;
  }>({});

  // School management
  const [schoolList, setSchoolList] = useState<any[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const [selectedSchoolName, setSelectedSchoolName] = useState<string>("");

  // Subjects management
  const [subjects, setSubjects] = useState<any[]>([]);

  // Sort lessons modal
  const [sortLessonsModal, setSortLessonsModal] = useState<{
    show: boolean;
    chapterId: string;
    chapterTitle: string;
    lessons: any[];
  }>({
    show: false,
    chapterId: "",
    chapterTitle: "",
    lessons: [],
  });
  const [draggedLessons, setDraggedLessons] = useState<any[]>([]);

  // Fetch school list
  useEffect(() => {
    if (programData && schoolList.length === 0) {
      (async () => {
        try {
          const res = await GetSchoolList({ page: 1 });
          setSchoolList(res?.data?.schools || []);

          const currentSchool = programData?.schools?.[0];
          if (currentSchool) {
            setSelectedSchoolId(String(currentSchool.id));
            setSelectedSchoolName(currentSchool.name);
          }
        } catch (error) {
          console.error("Error loading schools:", error);
        }
      })();
    }
  }, [programData, schoolList.length]);

  // Fetch subjects list
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
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
        setSubjects([]);
      }
    };

    fetchSubjects();
  }, []);

  // Fetch program detail
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!programId) return;
        const detail = await GetProgramDetail(programId);
        if (cancelled) return;

        const program = detail?.data?.data ?? detail?.data;
        if (program) {
          const {
            name = "",
            target = "",
            description = "",
            image: cover = "",
            duration = 1,
            chapters = [],
            subject_id = "",
            book_url = "",
          } = program;

          setForm((f) => ({
            ...f,
            name,
            description,
            cover,
            coverType: cover && !cover.startsWith("blob:") ? "link" : "upload",
            duration: duration || 1,
            book_url,
            target,
            chapters: chapters || [],
            subject_id: subject_id ? String(subject_id) : "",
          }));
          setProgramData(program);
        }
      } catch (err) {
        console.error("Error fetching program detail:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [programId, refreshTrigger]);

  // Track form changes
  useEffect(() => {
    if (!initialFormRef.current && form.name) {
      initialFormRef.current = {
        name: form.name,
        target: form.target,
        description: form.description,
        cover: form.cover,
        coverType: form.coverType,
        duration: form.duration,
        schoolId: selectedSchoolId,
        subject_id: form.subject_id,
        book_url: form.book_url,
      };
    }

    if (initialFormRef.current) {
      const changed =
        form.name !== initialFormRef.current.name ||
        form.target !== initialFormRef.current.target ||
        form.description !== initialFormRef.current.description ||
        form.cover !== initialFormRef.current.cover ||
        form.coverType !== initialFormRef.current.coverType ||
        form.duration !== initialFormRef.current.duration ||
        selectedSchoolId !== initialFormRef.current.schoolId ||
        form.subject_id !== initialFormRef.current.subject_id ||
        form.book_url !== initialFormRef.current.book_url;
      setIsFormChanged(changed);
    }
  }, [
    form.name,
    form.target,
    form.description,
    form.cover,
    form.coverType,
    form.duration,
    selectedSchoolId,
    form.subject_id,
    form.book_url,
  ]);

  // Handlers
  const handleSaveProgram = async () => {
    if (!programId) return;
    if (!form.subject_id) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn môn học.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingProgram(true);

    try {
      let imageUrl = form.cover;

      if (form.cover.startsWith("blob:")) {
        if (!selectedImageFile) {
          toast({
            title: "Lỗi",
            description: "Vui lòng chọn file ảnh bìa để tải lên.",
            variant: "destructive",
          });
          return;
        }
        const uploadResponse = await UploadFile(
          selectedImageFile,
          "programs/covers"
        );
        const fileUrl =
          uploadResponse?.data?.url ||
          uploadResponse?.url ||
          uploadResponse?.data?.data?.url;
        if (!fileUrl) {
          throw new Error("Không nhận được URL file từ server");
        }
        imageUrl = fileUrl;
      } else if (selectedImageFile) {
        const uploadResponse = await UploadFile(
          selectedImageFile,
          "programs/covers"
        );
        const fileUrl =
          uploadResponse?.data?.url ||
          uploadResponse?.url ||
          uploadResponse?.data?.data?.url;
        if (fileUrl) {
          imageUrl = fileUrl;
        }
      }

      const selectedSubject = subjects.find(
        (s) => String(s.id) === String(form.subject_id)
      );
      const updateData = {
        id: Number(programId),
        name: form.name,
        description: form.description,
        target: form.target,
        duration: Number(form.duration) || 1,
        book_url: form.book_url,
        image: imageUrl,
        status: programData?.status ?? true,
        subject_id: Number(form.subject_id),
        ...(selectedSubject && {
          subject: {
            id: Number(selectedSubject.id),
            name: selectedSubject.name,
            description: selectedSubject.description || "",
            status: selectedSubject.status,
          },
        }),
        ...(selectedSchoolId && {
          schools: [
            { id: parseInt(selectedSchoolId), name: selectedSchoolName },
          ],
        }),
      };

      await UpdateProgram(programId, updateData);

      setIsFormChanged(false);
      initialFormRef.current = {
        name: form.name,
        target: form.target,
        description: form.description,
        cover: imageUrl,
        coverType: form.coverType,
        duration: form.duration,
        schoolId: selectedSchoolId,
        subject_id: form.subject_id,
        book_url: form.book_url,
      };
      setSelectedImageFile(null);

      alert("Cập nhật chương trình thành công!");
    } catch (error) {
      console.error("Error updating program:", error);
      toast({
        title: "Lỗi",
        description: "Có lỗi khi cập nhật chương trình",
        variant: "destructive",
      });
    } finally {
      setIsSavingProgram(false);
    }
  };

  const handleAddChapter = async () => {
    if (!programId || !newChapter.title.trim()) return;

    try {
      const chapterData = {
        title: newChapter.title,
        description: newChapter.description,
        lessons: [],
      };

      await CreateChapter(chapterData, parseInt(programId), true);

      // Refresh program data
      const detail = await GetProgramDetail(programId);
      if (detail?.data) {
        setForm((f) => ({
          ...f,
          chapters: detail.data.chapters || [],
        }));
        setProgramData(detail.data);
      }

      setNewChapter({ title: "", description: "" });
      setShowAddChapterDialog(false);
    } catch (error) {
      console.error("Error adding chapter:", error);
      alert("Có lỗi khi thêm chương");
    }
  };

  const handleUpdateChapter = async (
    chapterId: string,
    title: string,
    description: string
  ) => {
    try {
      const chapter: Chapter | undefined = form.chapters.find(
        (c) => String(c.id) === String(chapterId)
      );

      if (!chapter) {
        console.error("Không tìm thấy chương để cập nhật:", chapterId);
        return;
      }

      await UpdateChapter(chapterId, {
        title,
        description,
        lessons: (chapter.lessons || []).map((l: any) => ({
          id: typeof l === "object" ? String(l.id) : String(l),
        })),
      });

      if (programId) {
        const detail = await GetProgramDetail(programId);
        setForm((f) => ({
          ...f,
          chapters: detail.data.chapters || [],
        }));
      }

      setEditingChapterId(null);
    } catch (error) {
      console.error("Error updating chapter:", error);
      alert("Có lỗi khi cập nhật chương");
    }
  };

  const handleDeleteChapter = async () => {
    try {
      await DeleteChapter(deleteChapterConfirm.chapterId);

      if (programId) {
        const detail = await GetProgramDetail(programId);
        setForm((f) => ({
          ...f,
          chapters: detail.data.chapters || [],
        }));
      }

      setDeleteChapterConfirm({ show: false, chapterId: "", chapterTitle: "" });
    } catch (error) {
      console.error("Error deleting chapter:", error);
      alert("Có lỗi khi xóa chương");
    }
  };

  const handleRemoveLessonFromChapter = async (
    chapterId: string,
    lessonIndex: number
  ) => {
    try {
      const chapter = (form.chapters || []).find(
        (c) => String(c.id) === chapterId
      );
      if (!chapter?.lessons) return;

      const updatedLessons = chapter.lessons.filter(
        (_: any, idx: number) => idx !== lessonIndex
      );

      await UpdateChapter(chapterId, {
        title: chapter.title,
        description: chapter.description,
        lessons: updatedLessons.map((l: any) => ({
          id: typeof l === "object" ? String(l.id) : String(l),
        })),
      });

      if (programId) {
        const detail = await GetProgramDetail(programId);
        setForm((f) => ({
          ...f,
          chapters: detail.data.chapters || [],
        }));
      }
    } catch (error) {
      console.error("Error removing lesson from chapter:", error);
      alert("Có lỗi khi xóa bài học khỏi chương");
    }
  };

  const handleAddLessonToChapter = async (
    lesson: Lesson,
    onSuccess?: () => void
  ) => {
    const chapterId = chapterLessonSelect.idx;
    console.log("Adding lesson to chapter:", { lesson: lesson.id, chapterId });

    setPopuploadingText("Đang thêm bài học vào chương...");
    setPopuploading(true);

    try {
      // Find the target chapter
      const chapter = (form.chapters || []).find(
        (c: Chapter) => String(c.id) === chapterId
      );
      if (!chapter) {
        console.error("Chapter not found:", chapterId);
        return;
      }

      // Add the lesson to the chapter's lessons array
      const updatedLessons = [
        ...(chapter.lessons || []),
        { id: String(lesson.id) },
      ];

      // Update the chapter with the new lessons array
      await UpdateChapter(chapterId, {
        title: chapter.title,
        description: chapter.description,
        lessons: updatedLessons.map((l: any) => ({
          id: typeof l === "object" ? String(l.id) : String(l),
        })),
      });

      // Refresh program detail
      if (programId) {
        const detail = await GetProgramDetail(programId);
        setForm((f) => ({
          ...f,
          chapters: detail.data.chapters || [],
        }));
      }

      console.log("Program detail updated successfully, triggering refresh...");

      // Gọi callback thành công nếu có
      if (onSuccess) {
        onSuccess();
      }

      setChapterLessonSelect({ idx: "", show: false });
    } catch (err) {
      console.error("Cập nhật chapter thất bại", err);
    } finally {
      setPopuploading(false);
    }
  };

  // Helper functions - Exact same as course page
  const handleEditChapter = (chapterId: string | number) => {
    setEditingChapterId(String(chapterId));
  };

  const handleOpenLessonSelect = (chapterId: string) => {
    setChapterLessonSelect({ idx: chapterId, show: true });
  };

  const handleConfirmDeleteChapter = (
    chapterId: string,
    chapterTitle: string
  ) => {
    setDeleteChapterConfirm({
      show: true,
      chapterId,
      chapterTitle,
    });
  };

  const handleOpenSortLessons = (
    chapterId: string,
    chapterTitle: string,
    lessons: any[]
  ) => {
    setSortLessonsModal({
      show: true,
      chapterId,
      chapterTitle,
      lessons,
    });
    setDraggedLessons([...lessons]);
  };

  const handleCloseSortLessons = () => {
    setSortLessonsModal({
      show: false,
      chapterId: "",
      chapterTitle: "",
      lessons: [],
    });
    setDraggedLessons([]);
  };

  const handleSaveSortLessons = async () => {
    try {
      const sortData = {
        lessons: draggedLessons.map((lesson, index) => ({
          lesson_id: typeof lesson === "object" ? lesson.id : lesson,
          sort_order: index + 1,
          id: lesson.id,
        })),
      };

      await SortLessons(sortLessonsModal.chapterId, sortData);

      if (programId) {
        const detail = await GetProgramDetail(programId);
        setForm((f) => ({
          ...f,
          chapters: detail.data.chapters || [],
        }));
      }

      handleCloseSortLessons();
    } catch (error) {
      console.error("Error sorting lessons:", error);
      alert("Có lỗi khi sắp xếp bài học");
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData("text/plain"));

    if (dragIndex === dropIndex) return;

    const newLessons = [...draggedLessons];
    const draggedItem = newLessons[dragIndex];

    newLessons.splice(dragIndex, 1);
    newLessons.splice(dropIndex, 0, draggedItem);

    setDraggedLessons(newLessons);
  };

  // Render lesson function
  function renderLesson(lessonItem: any, lidx: number, chapter: Chapter) {
    let lesson: Lesson | undefined;

    if (
      typeof lessonItem === "object" &&
      lessonItem !== null &&
      lessonItem.title
    ) {
      lesson = lessonItem;
    } else {
      lesson = {
        id: lessonItem,
        title: `Bài học #${lessonItem}`,
        description: "",
        status: false,
        chapter: { id: chapter.id, title: chapter.title },
        dependencies: [],
        tags: [],
        skill: [],
        topics: [],
        exams: [],
        homeworks: [],
        assessment: [],
        author: { id: "", name: "", username: "", email: "", phone_number: "" },
      };
    }

    if (!lesson) {
      return (
        <div
          key={lessonItem}
          className="flex items-center justify-between bg-red-50 border border-red-100 rounded-xl px-4 py-3"
        >
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-red-700">
              Bài {lidx + 1}: #{lessonItem}
            </div>
            <div className="text-xs text-red-500 mt-1">
              Không tìm thấy thông tin bài học
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              handleRemoveLessonFromChapter(String(chapter.id), lidx)
            }
            className="text-red-500 hover:bg-red-100 rounded-lg p-2"
          >
            ×
          </Button>
        </div>
      );
    }

    return (
      <div
        key={lesson.id}
        className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 hover:bg-blue-100 transition-colors"
      >
        <div
          className="flex-1 min-w-0 cursor-pointer hover:underline"
          title="Xem chi tiết bài học"
          onClick={() =>
            window.open(
              `/${params.locale}/manage/programs/${programId}/lessons/${lesson.id}`,
              "_blank"
            )
          }
        >
          <div className="font-semibold text-blue-700">
            Bài {lidx + 1}: {lesson.title}
          </div>
          {lesson.description && (
            <div className="text-xs text-blue-600 mt-1 line-clamp-2">
              {lesson.description}
            </div>
          )}
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() =>
            handleRemoveLessonFromChapter(String(chapter.id), lidx)
          }
          className="text-red-500 hover:bg-red-100 rounded-lg p-2"
        >
          ×
        </Button>
      </div>
    );
  }

  if (!programData) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">
            Đang tải thông tin chương trình...
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-2 md:px-6">
        {window.history.length > 1 && 
          <Button 
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900 mt-8 xl:mt-4"
          >
            <LucideChevronLeft className="h-4 w-4 mr-2" />
            Quay lại danh sách chương trình
        </Button>}
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Chỉnh sửa chương trình
          </h1>
          <div className="text-gray-500">
            Quản lý thông tin và nội dung chương trình
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Basic Info */}
          <div className="lg:col-span-1">
            <div className="bg-white border-0 shadow-sm rounded-2xl p-6 sticky top-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Tên chương trình
                  </label>
                  <Input
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    className="border-gray-200 rounded-xl focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Môn học <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={form.subject_id}
                    onValueChange={(value) =>
                      setForm((f) => ({ ...f, subject_id: value }))
                    }
                  >
                    <SelectTrigger className="border-gray-200 rounded-xl focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="Chọn môn học" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-gray-200">
                      {subjects && subjects.length > 0 ? (
                        subjects.map((subject: any) => (
                          <SelectItem
                            key={subject.id}
                            value={String(subject.id)}
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
                      setForm((f) => ({ ...f, target: e.target.value }))
                    }
                    className="border-gray-200 rounded-xl focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Nhập mục tiêu chương trình..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Mô tả chi tiết
                  </label>
                  <Textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                    className="border-gray-200 rounded-xl focus:border-blue-500 focus:ring-blue-500 min-h-[100px] resize-none"
                    placeholder="Nhập mô tả chi tiết về chương trình..."
                  />
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
                      setForm((f) => ({
                        ...f,
                        duration: Number(e.target.value),
                      }))
                    }
                    className="border-gray-200 rounded-xl focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Đường dẫn sách 
                  </label>
                    <Input
                      value={form.book_url}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, book_url: e.target.value }))
                      }
                      placeholder="Dán liên kết vào đây"
                      className="rounded-xl border-gray-200 focus:border-emerald-300 focus:ring-emerald-200 px-4 py-3 text-gray-900 placeholder:text-gray-400"
                    />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Ảnh bìa
                  </label>
                  <div className="flex gap-2 mb-3">
                    <Button
                      variant={
                        form.coverType === "upload" ? "default" : "outline"
                      }
                      onClick={() => {
                        setForm((f) => ({ ...f, coverType: "upload" }));
                        setSelectedImageFile(null);
                      }}
                      className="rounded-xl"
                    >
                      Upload
                    </Button>
                    <Button
                      variant={
                        form.coverType === "link" ? "default" : "outline"
                      }
                      onClick={() => {
                        setForm((f) => ({ ...f, coverType: "link" }));
                        setSelectedImageFile(null);
                      }}
                      className="rounded-xl"
                    >
                      Link
                    </Button>
                  </div>
                  {form.coverType === "upload" ? (
                    <Input
                      type="file"
                      accept="image/*"
                      className="border-gray-200 rounded-xl"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setSelectedImageFile(file);
                          setForm((f) => ({
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
                        setForm((f) => ({ ...f, cover: e.target.value }))
                      }
                      placeholder="Dán link ảnh..."
                      className="border-gray-200 rounded-xl focus:border-blue-500 focus:ring-blue-500"
                    />
                  )}
                  {form.cover && (
                    <div className="mt-3">
                      <Image
                        src={form.cover}
                        alt="Ảnh bìa chương trình"
                        width={200}
                        height={120}
                        className="rounded-xl object-cover border w-full max-w-[200px] h-auto shadow-sm"
                      />
                    </div>
                  )}
                </div>
                <div className="pt-4">
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-sm transition-all hover:shadow-md"
                    disabled={!isFormChanged || isSavingProgram}
                    onClick={handleSaveProgram}
                  >
                    {isSavingProgram ? "Đang lưu..." : "Lưu thay đổi"}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Content */}
          <div className="lg:col-span-2">
            <div className="bg-white border-0 shadow-sm rounded-2xl p-6">
              <Tabs defaultValue="chapters" className="w-full">
                <TabsList className="grid w-full grid-cols-1 bg-gray-100 rounded-xl p-1 mb-6">
                  <TabsTrigger
                    value="chapters"
                    className="flex items-center gap-2 rounded-lg"
                  >
                    <BookOpen className="h-4 w-4" />
                    Chương & Bài học
                  </TabsTrigger>
                </TabsList>

                {/* Chapters Tab */}
                <TabsContent value="chapters">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
                      <h3 className="text-xl font-bold text-gray-900">
                        Chương & Bài học
                      </h3>
                      <Button
                        onClick={() => setShowAddChapterDialog(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 w-full sm:w-auto"
                      >
                        <LucidePlus className="h-4 w-4 mr-2" />
                        Thêm chương
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {(form.chapters || []).map(
                        (chapter: Chapter, idx: number) => (
                          <div
                            key={chapter.id}
                            className="border border-gray-200 rounded-2xl p-6 bg-gray-50 hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                              <div className="flex items-center gap-3 flex-wrap">
                                <Badge className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1 text-sm font-medium">
                                  Chương {idx + 1}
                                </Badge>
                                <h3 className="text-lg font-bold text-gray-900">
                                  {chapter.title}
                                </h3>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    handleOpenLessonSelect(String(chapter.id))
                                  }
                                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-1 w-full sm:w-auto"
                                >
                                  <LucidePlus className="h-4 w-4 mr-1" /> Thêm
                                  bài học
                                </Button>
                                {chapter.lessons &&
                                  chapter.lessons.length > 1 && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() =>
                                        handleOpenSortLessons(
                                          String(chapter.id),
                                          chapter.title,
                                          chapter.lessons || []
                                        )
                                      }
                                      className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-3 py-1 w-full sm:w-auto"
                                    >
                                      <ArrowUpDown className="h-4 w-4 mr-1" />{" "}
                                      Sắp xếp
                                    </Button>
                                  )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditChapter(chapter.id)}
                                  className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-3 py-1 w-full sm:w-auto"
                                >
                                  <Edit2 className="h-4 w-4 mr-1" /> Chỉnh sửa
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    handleConfirmDeleteChapter(
                                      String(chapter.id),
                                      chapter.title
                                    )
                                  }
                                  className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-3 py-1 w-full sm:w-auto"
                                >
                                  <Trash2 className="h-4 w-4 mr-1" /> Xóa
                                </Button>
                              </div>
                            </div>
                            {chapter.description && (
                              <div className="mb-4">
                                <p
                                  id={`desc-chapter-${chapter.id}`}
                                  ref={(el) => {
                                    if (el) {
                                      if (
                                        typeof window !== "undefined" &&
                                        shouldClampDescription[chapter.id] ===
                                          undefined
                                      ) {
                                        el.classList.remove("line-clamp-3");
                                        const lineHeight = parseFloat(
                                          getComputedStyle(el).lineHeight
                                        );
                                        const height = el.offsetHeight;
                                        const lines = Math.round(
                                          height / lineHeight
                                        );
                                        setShouldClampDescription((prev) => ({
                                          ...prev,
                                          [chapter.id]: lines > 3,
                                        }));
                                      }
                                    }
                                  }}
                                  className={
                                    `text-gray-600 text-sm leading-relaxed whitespace-pre-line ` +
                                    (expandedDescriptions[chapter.id] ||
                                    !shouldClampDescription[chapter.id]
                                      ? ""
                                      : "line-clamp-3")
                                  }
                                  style={{
                                    cursor: shouldClampDescription[chapter.id]
                                      ? "pointer"
                                      : "default",
                                  }}
                                >
                                  {chapter.description}
                                </p>
                                {shouldClampDescription[chapter.id] && (
                                  <button
                                    className="text-blue-600 hover:underline text-xs mt-1 focus:outline-none"
                                    type="button"
                                    onClick={() =>
                                      setExpandedDescriptions((prev) => ({
                                        ...prev,
                                        [chapter.id]: !prev[chapter.id],
                                      }))
                                    }
                                  >
                                    {expandedDescriptions[chapter.id]
                                      ? "Thu gọn"
                                      : "Xem thêm"}
                                  </button>
                                )}
                              </div>
                            )}
                            {/* Lessons List */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {(chapter.lessons || [])
                                .slice()
                                .map((lessonItem: any, lidx: number) =>
                                  renderLesson(lessonItem, lidx, chapter)
                                )}
                            </div>
                            {(!chapter.lessons ||
                              chapter.lessons.length === 0) && (
                              <div className="text-center py-8 text-gray-400">
                                <div className="text-sm">
                                  Chưa có bài học nào trong chương này
                                </div>
                                <div className="text-xs mt-1">
                                  Nhấn "Thêm bài học" để bắt đầu
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>

                    {(form.chapters || []).length === 0 && (
                      <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
                        <div className="text-gray-400 text-lg mb-2">
                          Chưa có chương học nào
                        </div>
                        <div className="text-gray-500 text-sm mb-4">
                          Thêm chương đầu tiên để bắt đầu xây dựng chương trình
                        </div>
                        <Button
                          onClick={() => setShowAddChapterDialog(true)}
                          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6"
                        >
                          <LucidePlus className="h-4 w-4 mr-2" /> Thêm chương
                          đầu tiên
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>

        {/* Dialogs */}

        {/* Add Chapter Dialog */}
        <Dialog
          open={showAddChapterDialog}
          onOpenChange={setShowAddChapterDialog}
        >
          <DialogContent className="rounded-2xl border-0 shadow-2xl max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-900">
                Thêm chương mới
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Tạo chương mới cho chương trình của bạn
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên chương *
                </label>
                <Input
                  value={newChapter.title}
                  onChange={(e) =>
                    setNewChapter((n) => ({ ...n, title: e.target.value }))
                  }
                  placeholder="Nhập tên chương..."
                  className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mô tả chương
                </label>
                <Textarea
                  value={newChapter.description}
                  onChange={(e) =>
                    setNewChapter((n) => ({
                      ...n,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Nhập mô tả cho chương..."
                  className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 resize-none"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowAddChapterDialog(false)}
                className="rounded-xl px-6"
              >
                Hủy
              </Button>
              <Button
                onClick={handleAddChapter}
                disabled={!newChapter.title.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6"
              >
                Thêm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Chapter Dialog */}
        <Dialog
          open={deleteChapterConfirm.show}
          onOpenChange={(open) =>
            setDeleteChapterConfirm((prev) => ({ ...prev, show: open }))
          }
        >
          <DialogContent className="rounded-2xl border-0 shadow-2xl max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-red-600">
                Xác nhận xóa chương
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Bạn có chắc chắn muốn xóa chương "
                {deleteChapterConfirm.chapterTitle}"? Hành động này không thể
                hoàn tác.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-3">
              <Button
                variant="outline"
                onClick={() =>
                  setDeleteChapterConfirm({
                    show: false,
                    chapterId: "",
                    chapterTitle: "",
                  })
                }
                className="rounded-xl px-6"
              >
                Hủy
              </Button>
              <Button
                onClick={handleDeleteChapter}
                className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-6"
              >
                Xóa
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Sort Lessons Modal */}
        <Dialog
          open={sortLessonsModal.show}
          onOpenChange={(open) =>
            setSortLessonsModal((prev) => ({ ...prev, show: open }))
          }
        >
          <DialogContent className="rounded-2xl border-0 shadow-2xl max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-900">
                Sắp xếp bài học - {sortLessonsModal.chapterTitle}
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Kéo và thả để sắp xếp thứ tự bài học trong chương
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 max-h-96 overflow-y-auto py-4">
              {draggedLessons.map((lesson, index) => (
                <div
                  key={lesson.id || index}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl cursor-move hover:bg-gray-100 transition-colors"
                >
                  <GripVertical className="h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">
                      {lesson.title || `Bài học #${lesson.id || lesson}`}
                    </div>
                    {lesson.description && (
                      <div className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {lesson.description}
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">#{index + 1}</div>
                </div>
              ))}
            </div>
            <DialogFooter className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleCloseSortLessons}
                className="rounded-xl px-6"
              >
                Hủy
              </Button>
              <Button
                onClick={handleSaveSortLessons}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6"
              >
                Lưu thay đổi
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Chapter Dialog */}
        <Dialog
          open={editingChapterId !== null}
          onOpenChange={(open) => !open && setEditingChapterId(null)}
        >
          <DialogContent className="rounded-2xl border-0 shadow-2xl max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-900">
                Chỉnh sửa chương
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Cập nhật thông tin chương
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {editingChapterId &&
                (() => {
                  const chapter = form.chapters.find(
                    (c) => String(c.id) === editingChapterId
                  );
                  return (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tên chương *
                        </label>
                        <Input
                          defaultValue={chapter?.title || ""}
                          id="edit-chapter-title"
                          placeholder="Nhập tên chương..."
                          className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mô tả chương
                        </label>
                        <Textarea
                          defaultValue={chapter?.description || ""}
                          id="edit-chapter-description"
                          placeholder="Nhập mô tả cho chương..."
                          className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 resize-none"
                          rows={3}
                        />
                      </div>
                    </>
                  );
                })()}
            </div>
            <DialogFooter className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setEditingChapterId(null)}
                className="rounded-xl px-6"
              >
                Hủy
              </Button>
              <Button
                onClick={() => {
                  const titleEl = document.getElementById(
                    "edit-chapter-title"
                  ) as HTMLInputElement;
                  const descEl = document.getElementById(
                    "edit-chapter-description"
                  ) as HTMLTextAreaElement;
                  if (titleEl && editingChapterId) {
                    handleUpdateChapter(
                      editingChapterId,
                      titleEl.value,
                      descEl?.value || ""
                    );
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6"
              >
                Cập nhật
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Lesson Selection Modal - Exact same as course page */}
        {chapterLessonSelect.show && (
          <LessonModal
            open={chapterLessonSelect.show}
            onSelect={handleAddLessonToChapter}
            onClose={() => setChapterLessonSelect({ idx: "", show: false })}
            chapterId={chapterLessonSelect.idx}
            onCreateLesson={() => {
              setCurrentChapterId(chapterLessonSelect.idx);
              setChapterLessonSelect({ idx: "", show: false }); // Đóng popup chọn bài học
              setShowCreateLesson(true); // Mở popup tạo bài học
            }}
          />
        )}

        {/* Popup tạo bài học mới */}
        {showCreateLesson && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={(e) => {
              // Only close if clicking on backdrop, not on the modal content
              if (e.target === e.currentTarget) {
                setShowCreateLesson(false);
              }
            }}
          >
            <div className="bg-white rounded-3xl shadow-2xl p-0 w-full max-w-6xl h-[85vh] min-h-[600px] max-h-[90vh] relative flex flex-col">
              <div className="absolute top-4 right-4 z-10">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-10 w-10 rounded-2xl hover:bg-gray-100"
                  onClick={() => setShowCreateLesson(false)}
                >
                  ×
                </Button>
              </div>
              <div className="flex-1 overflow-auto">
                {/* Header giống như trang tạo bài học */}
                <div className="px-8 pt-8 pb-6 border-b border-gray-100">
                  <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                      Tạo bài học mới
                    </h1>
                    <p className="text-gray-500 font-medium">
                      Tạo bài học với nội dung và tài liệu học tập
                    </p>
                  </div>
                </div>

                {/* Nội dung LessonForm */}
                <div className="px-8 pb-8">
                  <LessonForm
                    hideSidebar
                    mode="create"
                    chapterId={currentChapterId}
                    onCancel={() => setShowCreateLesson(false)}
                    onSuccess={async (res: any) => {
                      setShowCreateLesson(false);
                      if (res && res.data && res.data.id) {
                        try {
                          // Hiển thị loading
                          setPopuploading(true);
                          setPopuploadingText(
                            "Đang thêm bài học vào chương..."
                          );

                          // Gọi API PUT để cập nhật bài học và gắn vào chương
                          await UpdateLesson(res.data.id, {
                            ...res.data,
                            chapter: { id: currentChapterId, title: "" },
                          });

                          // Refresh lại program để hiển thị bài học mới
                          if (programId) {
                            const detail = await GetProgramDetail(programId);
                            if (detail?.data) {
                              setForm((f) => ({
                                ...f,
                                chapters: detail.data.chapters || [],
                              }));
                            }
                          }
                        } catch (error) {
                          console.error(
                            "Lỗi khi gắn bài học vào chương:",
                            error
                          );
                          alert(
                            "Có lỗi khi thêm bài học vào chương: " +
                              (error as any)?.message
                          );
                        } finally {
                          setPopuploading(false);
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function EditProgramPage() {
  const [chapterLessonSelect, setChapterLessonSelect] = useState<{
    idx: string;
    show: boolean;
  }>({ idx: "", show: false });

  const [popuploading, setPopuploading] = useState(false);
  const [popuploadingText, setPopuploadingText] = useState(
    "Đang thêm bài học vào chương..."
  );
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const params = useParams();
  const programIdParam = params.id;
  const programId = Array.isArray(programIdParam)
    ? programIdParam[0]
    : programIdParam;

  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <>
      <RoleBasedHeaderSidebar>
        <EditProgramContent
          chapterLessonSelect={chapterLessonSelect}
          setChapterLessonSelect={setChapterLessonSelect}
          popuploading={popuploading}
          setPopuploading={setPopuploading}
          popuploadingText={popuploadingText}
          setPopuploadingText={setPopuploadingText}
          refreshTrigger={refreshTrigger}
        />
      </RoleBasedHeaderSidebar>
      {/* Overlay loading - Exact same as course page */}
      {popuploading && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl px-8 py-6 flex flex-col items-center">
            <span className="text-lg font-semibold mb-4 text-gray-900">
              {popuploadingText}
            </span>
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
          </div>
        </div>
      )}
    </>
  );
}
