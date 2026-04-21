import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { CreateLesson } from "@/lib/api/lessons";
import { GetExamList } from "@/lib/api/exams";
import { GetHomeworkList } from "@/lib/api/homeworks";
import { getLessonPlans } from "@/lib/api/lectures";
import { getTagsList, getTopicsList, getSkillsList } from "@/lib/api/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import LectureCreateForm from "./lecture-create-form";
import HomeworkCreateForm from "@/components/homework-create-form";
import { ExamCreateForm } from "@/components/exam-create-form";
import { useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/use-debounce";

interface LessonCreateFormProps {
  onSuccess?: (res?: any) => void;
  onCancel?: () => void;
  hideSidebar?: boolean;
}

export function LessonCreateForm({
  onSuccess,
  onCancel,
  hideSidebar,
}: LessonCreateFormProps) {
  const [form, setForm] = useState({

    title: "",
    description: "",
    topic: "",
    tags: [] as string[],
    lesson_dependency: "",
    skills: [] as string[],
    lecture: "",
    exercise: [] as string[], // sửa thành mảng
    test: [] as string[], // sửa thành mảng
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [openHomeworkPopup, setOpenHomeworkPopup] = useState(false);
  const [openExamPopup, setOpenExamPopup] = useState(false);
  const [openLecturePopup, setOpenLecturePopup] = useState(false);
  const [homeworkSearch, setHomeworkSearch] = useState("");
  const [examSearch, setExamSearch] = useState("");
  const [lectureSearch, setLectureSearch] = useState("");
  const [topicsList, setTopicsList] = useState<
    { id: string | number; name: string }[]
  >([]);
  const [tagsList, setTagsList] = useState<
    { id: string | number; name: string }[]
  >([]);
  const [skillsList, setSkillsList] = useState<
    { id: string | number; name: string }[]
  >([]);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [skillsLoading, setSkillsLoading] = useState(false);
  
  const [showCreateLecture, setShowCreateLecture] = useState(false);
  const [showCreateHomework, setShowCreateHomework] = useState(false);
  const [showCreateExam, setShowCreateExam] = useState(false);

  // Store information of selected items to display correct names
  const [selectedLectureInfo, setSelectedLectureInfo] = useState<any>(null);
  const [selectedHomeworksInfo, setSelectedHomeworksInfo] = useState<{[key: string]: any}>({});
  const [selectedExamsInfo, setSelectedExamsInfo] = useState<{[key: string]: any}>({});

  // Temporary state for popup selection (not yet applied to form)
  const [tempSelectedHomeworks, setTempSelectedHomeworks] = useState<string[]>([]);
  const [tempSelectedExams, setTempSelectedExams] = useState<string[]>([]);
  const [tempSelectedHomeworksInfo, setTempSelectedHomeworksInfo] = useState<{[key: string]: any}>({});
  const [tempSelectedExamsInfo, setTempSelectedExamsInfo] = useState<{[key: string]: any}>({});

  // Data state management - only load when needed
  const [examsData, setExamsData] = useState<any>(null);
  const [homeworksData, setHomeworksData] = useState<any>(null);
  const [lessonPlansData, setLessonPlansData] = useState<any>(null);
  const [examsLoading, setExamsLoading] = useState(false);
  const [homeworksLoading, setHomeworksLoading] = useState(false);
  const [lessonPlansLoading, setLessonPlansLoading] = useState(false);

  // Pagination states
  const [homeworksPagination, setHomeworksPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [examsPagination, setExamsPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [lessonPlansPagination, setLessonPlansPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  const queryClient = useQueryClient();

  // Debounced search values for better UX
  const debouncedHomeworkSearch = useDebounce(homeworkSearch, 500);
  const debouncedExamSearch = useDebounce(examSearch, 500);
  const debouncedLectureSearch = useDebounce(lectureSearch, 500);

  // API functions
  const loadHomeworks = async (search?: string, page = 1) => {
    try {
      setHomeworksLoading(true);
      const response = await GetHomeworkList({ keyword: search, page, limit: 10 });
      if (page === 1) {
        setHomeworksData(response);
      } else {
        // Append data for load more
        setHomeworksData((prev: any) => ({
          ...response,
          homeworks: [...(prev?.homeworks || []), ...(response?.homeworks || [])]
        }));
      }
      setHomeworksPagination({
        currentPage: response?.page || 1,
        totalPages: response?.totalPages || 1,
        totalItems: response?.homeworks?.length || 0,
        hasNextPage: (response?.page || 1) < (response?.totalPages || 1),
        hasPrevPage: (response?.page || 1) > 1
      });
    } catch (error) {
      console.error("Error loading homeworks:", error);
    } finally {
      setHomeworksLoading(false);
    }
  };

  const loadExams = async (search?: string, page = 1) => {
    try {
      setExamsLoading(true);
      const response = await GetExamList({ keyword: search, page, limit: 10 });
      if (page === 1) {
        setExamsData(response);
      } else {
        // Append data for load more
        setExamsData((prev: any) => ({
          ...response,
          exams: [...(prev?.exams || []), ...(response?.exams || [])]
        }));
      }
      setExamsPagination({
        currentPage: response?.page || 1,
        totalPages: response?.totalPages || 1,
        totalItems: response?.exams?.length || 0,
        hasNextPage: (response?.page || 1) < (response?.totalPages || 1),
        hasPrevPage: (response?.page || 1) > 1
      });
    } catch (error) {
      console.error("Error loading exams:", error);
    } finally {
      setExamsLoading(false);
    }
  };

  const loadLessonPlans = async (search?: string, page = 1) => {
    try {
      setLessonPlansLoading(true);
      const response = await getLessonPlans({ keyword: search, page, limit: 10 });
      if (page === 1) {
        setLessonPlansData(response);
      } else {
        // Append data for load more
        setLessonPlansData((prev: any) => ({
          ...response,
          lessonPlans: [...(prev?.lessonPlans || []), ...(response?.lessonPlans || [])]
        }));
      }
      setLessonPlansPagination({
        currentPage: response?.page || 1,
        totalPages: response?.totalPages || 1,
        totalItems: response?.lessonPlans?.length || 0,
        hasNextPage: (response?.page || 1) < (response?.totalPages || 1),
        hasPrevPage: (response?.page || 1) > 1
      });
    } catch (error) {
      console.error("Error loading lesson plans:", error);
    } finally {
      setLessonPlansLoading(false);
    }
  };

  const loadMoreHomeworks = () => {
    if (homeworksPagination.hasNextPage && !homeworksLoading) {
      loadHomeworks(debouncedHomeworkSearch, homeworksPagination.currentPage + 1);
    }
  };

  const loadMoreExams = () => {
    if (examsPagination.hasNextPage && !examsLoading) {
      loadExams(debouncedExamSearch, examsPagination.currentPage + 1);
    }
  };

  const loadMoreLessonPlans = () => {
    if (lessonPlansPagination.hasNextPage && !lessonPlansLoading) {
      loadLessonPlans(debouncedLectureSearch, lessonPlansPagination.currentPage + 1);
    }
  };

  // Load data when popups open
  useEffect(() => {
    if (openHomeworkPopup && !homeworksData) {
      loadHomeworks(debouncedHomeworkSearch);
    }
  }, [openHomeworkPopup]);

  useEffect(() => {
    if (openExamPopup && !examsData) {
      loadExams(debouncedExamSearch);
    }
  }, [openExamPopup]);

  useEffect(() => {
    if (openLecturePopup && !lessonPlansData) {
      loadLessonPlans(debouncedLectureSearch);
    }
  }, [openLecturePopup]);

  // Load data when search changes (debounced)
  useEffect(() => {
    if (openHomeworkPopup) {
      loadHomeworks(debouncedHomeworkSearch);
    }
  }, [debouncedHomeworkSearch]);

  useEffect(() => {
    if (openExamPopup) {
      loadExams(debouncedExamSearch);
    }
  }, [debouncedExamSearch]);

  useEffect(() => {
    if (openLecturePopup) {
      loadLessonPlans(debouncedLectureSearch);
    }
  }, [debouncedLectureSearch]);

  useEffect(() => {
    setTopicsLoading(true);
    getTopicsList()
      .then((res) => {
        const arr = res?.data?.topics || res?.topics || [];
        setTopicsList(arr);
      })
      .finally(() => setTopicsLoading(false));
    setTagsLoading(true);
    getTagsList()
      .then((res) => {
        const arr = res?.data?.tags || res?.tags || [];
        setTagsList(arr);
      })
      .finally(() => setTagsLoading(false));
    setSkillsLoading(true);
    getSkillsList()
      .then((res) => {
        const arr = res?.data?.skills || res?.skills || [];
        setSkillsList(arr);
      })
      .finally(() => setSkillsLoading(false));
  }, []);

  const handleCreateLesson = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      alert("Vui lòng nhập tiêu đề và mô tả cho bài học.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const selectedTopic = topicsList.find((t) => String(t.id) === form.topic);
      let topicsField: { id: number; name: string }[] = [];
      if (selectedTopic) {
        topicsField = [
          { id: Number(selectedTopic.id), name: selectedTopic.name },
        ];
      } else if (form.topic) {
        topicsField = [{ id: Number(form.topic), name: form.topic }];
      }
      const data = {
        title: form.title,
        description: form.description,
        status: true,
        chapter: undefined,
        dependencies: undefined,
        tags: form.tags.map((name, idx) => ({ id: idx + 1, name })),
        topics: topicsField,
        skills: form.skills.map((name, idx) => ({ id: idx + 1, name })),
        lesson_plans: form.lecture ? [{ id: form.lecture }] : [],
        exams: Array.isArray(form.test)
          ? form.test.map((id) => ({ 
              id: Number(id), 
              name: selectedExamsInfo[id]?.name || `Bài kiểm tra #${id}`
            }))
          : [],
        homeworks: Array.isArray(form.exercise)
          ? form.exercise.map((id) => ({
              id: Number(id),
              name: selectedHomeworksInfo[id]?.name || `Bài luyện tập #${id}`,
            }))
          : [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const result = await CreateLesson(data);
      setSuccess(true);
      setForm({
        title: "",
        description: "",
        topic: "",
        tags: [],
        lesson_dependency: "",
        skills: [],
        lecture: "",
        exercise: [],
        test: [],
      });
      // Reset info states
      setSelectedLectureInfo(null);
      setSelectedHomeworksInfo({});
      setSelectedExamsInfo({});
      if (onSuccess) onSuccess(result);
      else alert("Tạo bài học thành công!");
    } catch (err: any) {
      setError(err?.message || "Đã có lỗi xảy ra");
      alert(err?.message || "Tạo bài học thất bại");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className={hideSidebar ? "" : "min-h-screen bg-gray-50/30"}>
      <div className={hideSidebar ? "p-6" : "container mx-auto px-6 py-8"}>
        {!hideSidebar && (
          <div className="mb-12">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                Tạo bài học mới
              </h1>
              <p className="text-gray-500 font-medium">
                Tạo bài học với nội dung và tài liệu học tập
              </p>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {" "}
          {/* Thông tin cơ bản */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden h-full">
              <div className="bg-gradient-to-r from-blue-400 to-blue-600"></div>
              <div className="p-8">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Thông tin cơ bản
                  </h2>
                  <p className="text-gray-500">Thông tin chính của bài học</p>
                </div>

                <div className="space-y-6">
                  {/* Title */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Tiêu đề bài học <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={form.title}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, title: e.target.value }))
                      }
                      placeholder="Nhập tiêu đề bài học"
                      className="rounded-2xl border-gray-200 focus:border-blue-300 focus:ring-blue-200 py-3"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Mô tả/Hướng dẫn
                    </label>
                    <Textarea
                      value={form.description}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, description: e.target.value }))
                      }
                      placeholder="Nhập mô tả hoặc hướng dẫn cho bài học"
                      rows={4}
                      className="rounded-2xl border-gray-200 focus:border-blue-300 focus:ring-blue-200"
                    />
                  </div>

                  {/* Topic */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Chủ đề
                    </label>
                    <Select
                      value={form.topic}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, topic: v }))
                      }
                    >
                      <SelectTrigger className="rounded-2xl border-gray-200 focus:border-blue-300 focus:ring-blue-200">
                        <SelectValue
                          placeholder={
                            topicsLoading ? "Đang tải..." : "Chọn chủ đề"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-gray-200">
                        {topicsLoading ? (
                          <SelectItem
                            value="__loading"
                            disabled
                            className="rounded-xl"
                          >
                            Đang tải...
                          </SelectItem>
                        ) : (
                          topicsList.map((topic) => (
                            <SelectItem
                              key={topic.id}
                              value={String(topic.id)}
                              className="rounded-xl"
                            >
                              {topic.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Tags
                    </label>
                    {form.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {form.tags.map((tag, idx) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="bg-blue-50 text-blue-700 border-blue-200 rounded-full px-3 py-1 text-xs font-medium"
                          >
                            {tag}
                            <button
                              type="button"
                              className="ml-2 text-blue-600 hover:text-blue-800 transition-colors"
                              onClick={() =>
                                setForm((f) => ({
                                  ...f,
                                  tags: f.tags.filter((t, i) => i !== idx),
                                }))
                              }
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                    <Select
                      onValueChange={(v) => {
                        if (!form.tags.includes(v))
                          setForm((f) => ({ ...f, tags: [...f.tags, v] }));
                      }}
                      value=""
                    >
                      <SelectTrigger className="rounded-2xl border-gray-200 focus:border-blue-300 focus:ring-blue-200">
                        <SelectValue
                          placeholder={
                            tagsLoading
                              ? "Đang tải..."
                              : "Thêm tag từ danh sách"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-gray-200">
                        {tagsLoading ? (
                          <SelectItem
                            value="__loading"
                            disabled
                            className="rounded-xl"
                          >
                            Đang tải...
                          </SelectItem>
                        ) : (
                          tagsList
                            .filter((tag) => !form.tags.includes(tag.name))
                            .map((tag) => (
                              <SelectItem
                                key={tag.id}
                                value={tag.name}
                                className="rounded-xl"
                              >
                                {tag.name}
                              </SelectItem>
                            ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </div>{" "}
          {/* Nội dung bài học */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden h-full">
              <div className="bg-gradient-to-r from-emerald-400 to-emerald-600"></div>
              <div className="p-8">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Nội dung bài học
                  </h2>
                  <p className="text-gray-500">
                    Thêm tài liệu và bài tập cho bài học
                  </p>
                </div>

                <div className="space-y-8">
                  {/* Skills */}
                  {/* <div className="space-y-4">
                    <label className="text-sm font-medium text-gray-700">
                      Kỹ năng
                    </label>
                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                      {skillsLoading ? (
                        <div className="text-center py-4">
                          <span className="text-gray-500">
                            Đang tải kỹ năng...
                          </span>
                        </div>
                      ) : skillsList.length === 0 ? (
                        <div className="text-center py-4">
                          <span className="text-gray-500">
                            Không có kỹ năng
                          </span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {skillsList.map((skill) => (
                            <label
                              key={skill.id}
                              className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-colors cursor-pointer"
                            >
                              <Checkbox
                                checked={form.skills.includes(skill.name)}
                                onCheckedChange={(checked) => {
                                  setForm((f) => ({
                                    ...f,
                                    skills: checked
                                      ? [...f.skills, skill.name]
                                      : f.skills.filter(
                                          (s) => s !== skill.name
                                        ),
                                  }));
                                }}
                                className="border-gray-300 text-emerald-600"
                              />
                              <span className="text-sm font-medium text-gray-700">
                                {skill.name}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div> */}

                  {/* Bài giảng */}
                  <div className="space-y-4">
                    <label className="text-sm font-medium text-gray-700">
                      Bài giảng
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-16 text-left rounded-2xl border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/30 transition-colors flex items-center justify-between px-6"
                      onClick={() => setOpenLecturePopup(true)}
                    >
                      <span className="text-gray-600">
                        {form.lecture
                          ? selectedLectureInfo?.name || `Bài giảng #${form.lecture}`
                          : "Chọn bài giảng"}
                      </span>
                      <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <span className="text-emerald-600 text-xl">+</span>
                      </div>
                    </Button>{" "}
                    {/* Dialog chọn bài giảng */}
                    <Dialog
                      open={openLecturePopup}
                      onOpenChange={(open) => {
                        setOpenLecturePopup(open);
                        if (!open) {
                          setLectureSearch("");
                          setLessonPlansData(null);
                          setLessonPlansPagination({
                            currentPage: 1,
                            totalPages: 1,
                            totalItems: 0,
                            hasNextPage: false,
                            hasPrevPage: false
                          });
                        }
                      }}
                    >
                      <DialogContent className="max-w-4xl h-[640px] overflow-hidden rounded-3xl border-0 shadow-xl flex flex-col">
                        <DialogHeader className="pb-4 border-b border-gray-100 flex-shrink-0">
                          <DialogTitle className="text-xl font-semibold text-gray-900">
                            Chọn bài giảng
                          </DialogTitle>
                        </DialogHeader>
                        <div className="flex flex-col flex-1 overflow-hidden">
                          {/* Search and Create */}
                          <div className="p-4 pb-2 flex items-center gap-4 flex-shrink-0">
                            <Input
                              placeholder="Tìm kiếm bài giảng..."
                              value={lectureSearch}
                              onChange={(e) => setLectureSearch(e.target.value)}
                              className="flex-1 rounded-2xl border-gray-200 focus:border-emerald-300 focus:ring-emerald-200"
                            />
                            <Button
                              variant="outline"
                              className="rounded-2xl border-gray-200 hover:border-emerald-300 hover:bg-emerald-50"
                              onClick={() => {
                                setOpenLecturePopup(false);
                                setShowCreateLecture(true);
                              }}
                            >
                              Tạo bài giảng
                            </Button>
                          </div>

                          {/* Lecture List - Fixed height scrollable area */}
                          <div className="px-4 overflow-y-auto space-y-3 flex-1 max-h-[430px]">
                            {lessonPlansLoading && lessonPlansPagination.currentPage === 1 ? (
                              <div className="text-center py-8 text-gray-500 flex flex-col items-center justify-center h-full">
                                <div className="w-10 h-10 mb-4">
                                  <svg className="animate-spin h-10 w-10" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                </div>
                                Đang tải...
                              </div>
                            ) : !lessonPlansData?.lessonPlans?.length ? (
                              <div className="text-center flex flex-col items-center justify-center h-full py-8">
                                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                  <svg
                                    className="h-8 w-8 text-emerald-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                  </svg>
                                </div>
                                <p className="text-gray-600">
                                  Không tìm thấy bài giảng nào
                                </p>
                              </div>
                            ) : (
                              <>
                                {lessonPlansData.lessonPlans
                                  .sort((a: any, b: any) => Number(a.id) - Number(b.id))
                                  .map((lecture: any) => (
                                  <div
                                    key={lecture.id}
                                    className={`p-4 border-2 rounded-2xl cursor-pointer transition-all duration-200 ${
                                      form.lecture === String(lecture.id)
                                        ? "border-emerald-300 bg-emerald-50"
                                        : "border-gray-200 hover:border-emerald-200 hover:bg-emerald-25"
                                    }`}
                                    onClick={() => {
                                      setForm((f) => ({ ...f, lecture: String(lecture.id) }));
                                      setSelectedLectureInfo(lecture);
                                      setOpenLecturePopup(false);
                                    }}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <h3 className="font-semibold text-gray-900">
                                          {lecture.name}
                                        </h3>
                                        <p className="text-sm text-gray-500 mt-1">
                                          {lecture.description || "Không có mô tả"}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Badge className="bg-emerald-100 text-emerald-600 border-emerald-200">
                                          Bài giảng
                                        </Badge>
                                        {form.lecture === String(lecture.id) && (
                                          <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                                            <svg
                                              className="h-4 w-4 text-white"
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M5 13l4 4L19 7"
                                              />
                                            </svg>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </>
                            )}
                          </div>
                          
                          {/* Load More Button - Positioned outside the scrollable area */}
                          {lessonPlansPagination.hasNextPage && (
                            <div className="text-center py-4 px-4 mt-auto border-t border-gray-100 flex-shrink-0 bg-gray-50/50">
                              <Button
                                variant="outline"
                                className="rounded-2xl border-gray-200 hover:border-emerald-300 hover:bg-emerald-50"
                                onClick={loadMoreLessonPlans}
                                disabled={lessonPlansLoading}
                              >
                                {lessonPlansLoading ? (
                                  <>
                                    <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Đang tải...
                                  </>
                                ) : (
                                  <>
                                    Tải thêm ({lessonPlansPagination.currentPage}/{lessonPlansPagination.totalPages})
                                  </>
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* Bài luyện tập */}
                  <div className="space-y-4">
                    <label className="text-sm font-medium text-gray-700">
                      Bài luyện tập
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-16 text-left rounded-2xl border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 transition-colors flex items-center justify-between px-6"
                      onClick={() => setOpenHomeworkPopup(true)}
                    >
                      <span className="text-gray-600">
                        {form.exercise.length === 0
                          ? "Chọn bài luyện tập"
                          : `Đã chọn ${form.exercise.length} bài luyện tập`}
                      </span>
                      <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
                        <span className="text-blue-600 text-xl">+</span>
                      </div>
                    </Button>

                    {/* Danh sách bài đã chọn */}
                    {form.exercise.length > 0 && (
                      <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
                        <h4 className="text-sm font-medium text-blue-900 mb-3">
                          Bài luyện tập đã chọn:
                        </h4>
                        <div className="space-y-2">
                          {form.exercise.map((id) => {
                            const homeworkInfo = selectedHomeworksInfo[id];
                            return (
                              <div
                                key={id}
                                className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-blue-200"
                              >
                                <span className="text-sm font-medium text-gray-900 truncate flex-1">
                                  {homeworkInfo?.name || `Bài luyện tập #${id}`}
                                </span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 rounded-xl hover:bg-red-50 text-red-600"
                                  onClick={() => {
                                    setForm((f) => ({
                                      ...f,
                                      exercise: f.exercise.filter(
                                        (eid) => eid !== id
                                      ),
                                    }));
                                    setSelectedHomeworksInfo(prev => {
                                      const newInfo = {...prev};
                                      delete newInfo[id];
                                      return newInfo;
                                    });
                                  }}
                                >
                                  ×
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {/* Dialog chọn bài luyện tập */}
                    <Dialog
                      open={openHomeworkPopup}
                      onOpenChange={(open) => {
                        setOpenHomeworkPopup(open);
                        if (open) {
                          // Reset temporary state when opening popup
                          setTempSelectedHomeworks([...form.exercise]);
                          setTempSelectedHomeworksInfo({...selectedHomeworksInfo});
                        } else {
                          setHomeworkSearch("");
                          setHomeworksData(null);
                          setHomeworksPagination({
                            currentPage: 1,
                            totalPages: 1,
                            totalItems: 0,
                            hasNextPage: false,
                            hasPrevPage: false
                          });
                          // Reset temp state
                          setTempSelectedHomeworks([]);
                          setTempSelectedHomeworksInfo({});
                        }
                      }}
                    >
                      <DialogContent className="max-w-4xl h-[640px] overflow-hidden rounded-3xl border-0 shadow-xl flex flex-col">
                        <DialogHeader className="pb-4 border-b border-gray-100 flex-shrink-0">
                          <DialogTitle className="text-xl font-semibold text-gray-900">
                            Chọn bài luyện tập
                          </DialogTitle>
                        </DialogHeader>
                        <div className="flex flex-col flex-1 overflow-hidden">
                          {/* Search and Create */}
                          <div className="p-4 pb-2 flex items-center gap-4 flex-shrink-0">
                            <Input
                              placeholder="Tìm kiếm bài luyện tập..."
                              value={homeworkSearch}
                              onChange={(e) => setHomeworkSearch(e.target.value)}
                              className="flex-1 rounded-2xl border-gray-200 focus:border-green-300 focus:ring-green-200"
                            />
                            <Button
                              variant="outline"
                              className="rounded-2xl border-gray-200 hover:border-green-300 hover:bg-green-50"
                              onClick={() => {
                                setOpenHomeworkPopup(false);
                                setShowCreateHomework(true);
                              }}
                            >
                              Tạo bài luyện tập
                            </Button>
                          </div>

                          {/* Homework List - Fixed height scrollable area */}
                          <div className="px-4 overflow-y-auto space-y-3 flex-1 max-h-[430px]">
                            {homeworksLoading && homeworksPagination.currentPage === 1 ? (
                              <div className="text-center py-8 text-gray-500 flex flex-col items-center justify-center h-full">
                                <div className="w-10 h-10 mb-4">
                                  <svg className="animate-spin h-10 w-10" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                </div>
                                Đang tải...
                              </div>
                            ) : !homeworksData?.homeworks?.length ? (
                              <div className="text-center flex flex-col items-center justify-center h-full py-8">
                                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                  <svg
                                    className="h-8 w-8 text-green-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                  </svg>
                                </div>
                                <p className="text-gray-600">
                                  Không tìm thấy bài luyện tập nào
                                </p>
                              </div>
                            ) : (
                              <>
                                {homeworksData.homeworks
                                  .sort((a: any, b: any) => Number(a.id) - Number(b.id))
                                  .map((homework: any) => (
                                  <div
                                    key={homework.id}
                                    className={`p-4 border-2 rounded-2xl cursor-pointer transition-all duration-200 ${
                                      tempSelectedHomeworks.includes(String(homework.id))
                                        ? "border-green-300 bg-green-50"
                                        : "border-gray-200 hover:border-green-200 hover:bg-green-25"
                                    }`}
                                    onClick={() => {
                                      const idStr = String(homework.id);
                                      // Update temporary state
                                      if (tempSelectedHomeworks.includes(idStr)) {
                                        // Remove from temporary list
                                        setTempSelectedHomeworks(prev => prev.filter(id => id !== idStr));
                                        setTempSelectedHomeworksInfo(prev => {
                                          const newInfo = {...prev};
                                          delete newInfo[idStr];
                                          return newInfo;
                                        });
                                      } else {
                                        // Add to temporary list
                                        setTempSelectedHomeworks(prev => [...prev, idStr]);
                                        setTempSelectedHomeworksInfo(prev => ({
                                          ...prev,
                                          [idStr]: homework
                                        }));
                                      }
                                    }}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <h3 className="font-semibold text-gray-900">
                                          {homework.name}
                                        </h3>
                                        <p className="text-sm text-gray-500 mt-1">
                                          {homework.description || "Không có mô tả"}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Badge className="bg-green-100 text-green-600 border-green-200">
                                          {homework.questions?.length || 0} câu hỏi
                                        </Badge>
                                        {tempSelectedHomeworks.includes(String(homework.id)) && (
                                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                            <svg
                                              className="h-4 w-4 text-white"
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M5 13l4 4L19 7"
                                              />
                                            </svg>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </>
                            )}
                          </div>
                          
                          {/* Confirm Button - Positioned at the bottom */}
                          <div className="px-4 py-4 border-t border-gray-100 flex-shrink-0 bg-gray-50/50">
                            <div className="flex gap-3 justify-end">
                              <Button
                                variant="outline"
                                className="rounded-2xl border-gray-200 hover:border-gray-300"
                                onClick={() => setOpenHomeworkPopup(false)}
                              >
                                Hủy
                              </Button>
                              <Button
                                className="bg-green-600 hover:bg-green-700 text-white rounded-2xl px-6"
                                onClick={() => {
                                  // Apply changes to form and selectedInfo
                                  setForm(f => ({ ...f, exercise: [...tempSelectedHomeworks] }));
                                  setSelectedHomeworksInfo({...tempSelectedHomeworksInfo});
                                  setOpenHomeworkPopup(false);
                                }}
                              >
                                Xác nhận ({tempSelectedHomeworks.length} bài)
                              </Button>
                            </div>
                          </div>
                          
                          {/* Load More Button - Positioned outside the scrollable area */}
                          {homeworksPagination.hasNextPage && (
                            <div className="text-center py-4 px-4 mt-auto border-t border-gray-100 flex-shrink-0 bg-gray-50/50">
                              <Button
                                variant="outline"
                                className="rounded-2xl border-gray-200 hover:border-green-300 hover:bg-green-50"
                                onClick={loadMoreHomeworks}
                                disabled={homeworksLoading}
                              >
                                {homeworksLoading ? (
                                  <>
                                    <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Đang tải...
                                  </>
                                ) : (
                                  <>
                                    Tải thêm ({homeworksPagination.currentPage}/{homeworksPagination.totalPages})
                                  </>
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* Bài kiểm tra */}
                  <div className="space-y-4">
                    <label className="text-sm font-medium text-gray-700">
                      Bài kiểm tra
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-16 text-left rounded-2xl border-gray-200 hover:border-purple-300 hover:bg-purple-50/30 transition-colors flex items-center justify-between px-6"
                      onClick={() => setOpenExamPopup(true)}
                    >
                      <span className="text-gray-600">
                        {form.test.length === 0
                          ? "Chọn bài kiểm tra"
                          : `Đã chọn ${form.test.length} bài kiểm tra`}
                      </span>
                      <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center">
                        <span className="text-purple-600 text-xl">+</span>
                      </div>
                    </Button>

                    {/* Danh sách bài đã chọn */}
                    {form.test.length > 0 && (
                      <div className="bg-purple-50 rounded-2xl p-4 border border-purple-200">
                        <h4 className="text-sm font-medium text-purple-900 mb-3">
                          Bài kiểm tra đã chọn:
                        </h4>
                        <div className="space-y-2">
                          {form.test.map((id) => {
                            const examInfo = selectedExamsInfo[id];
                            return (
                              <div
                                key={id}
                                className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-purple-200"
                              >
                                <span className="text-sm font-medium text-gray-900 truncate flex-1">
                                  {examInfo?.name || `Bài kiểm tra #${id}`}
                                </span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 rounded-xl hover:bg-red-50 text-red-600"
                                  onClick={() => {
                                    setForm((f) => ({
                                      ...f,
                                      test: f.test.filter((eid) => eid !== id),
                                    }));
                                    setSelectedExamsInfo(prev => {
                                      const newInfo = {...prev};
                                      delete newInfo[id];
                                      return newInfo;
                                    });
                                  }}
                                >
                                  ×
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {/* Dialog chọn bài kiểm tra */}
                    <Dialog
                      open={openExamPopup}
                      onOpenChange={(open) => {
                        setOpenExamPopup(open);
                        if (open) {
                          // Reset temporary state when opening popup
                          setTempSelectedExams([...form.test]);
                          setTempSelectedExamsInfo({...selectedExamsInfo});
                        } else {
                          setExamSearch("");
                          setExamsData(null);
                          setExamsPagination({
                            currentPage: 1,
                            totalPages: 1,
                            totalItems: 0,
                            hasNextPage: false,
                            hasPrevPage: false
                          });
                          // Reset temp state
                          setTempSelectedExams([]);
                          setTempSelectedExamsInfo({});
                        }
                      }}
                    >
                      <DialogContent className="max-w-4xl h-[640px] overflow-hidden rounded-3xl border-0 shadow-xl flex flex-col">
                        <DialogHeader className="pb-4 border-b border-gray-100 flex-shrink-0">
                          <DialogTitle className="text-xl font-semibold text-gray-900">
                            Chọn bài kiểm tra
                          </DialogTitle>
                        </DialogHeader>
                        <div className="flex flex-col flex-1 overflow-hidden">
                          {/* Search and Create */}
                          <div className="p-4 pb-2 flex items-center gap-4 flex-shrink-0">
                            <Input
                              placeholder="Tìm kiếm bài kiểm tra..."
                              value={examSearch}
                              onChange={(e) => setExamSearch(e.target.value)}
                              className="flex-1 rounded-2xl border-gray-200 focus:border-blue-300 focus:ring-blue-200"
                            />
                            <Button
                              variant="outline"
                              className="rounded-2xl border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                              onClick={() => {
                                setOpenExamPopup(false);
                                setShowCreateExam(true);
                              }}
                            >
                              Tạo bài kiểm tra
                            </Button>
                          </div>

                          {/* Exam List - Fixed height scrollable area */}
                          <div className="px-4 overflow-y-auto space-y-3 flex-1 max-h-[430px]">
                            {examsLoading && examsPagination.currentPage === 1 ? (
                              <div className="text-center py-8 text-gray-500 flex flex-col items-center justify-center h-full">
                                <div className="w-10 h-10 mb-4">
                                  <svg className="animate-spin h-10 w-10" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                </div>
                                Đang tải...
                              </div>
                            ) : !examsData?.exams?.length ? (
                              <div className="text-center flex flex-col items-center justify-center h-full py-8">
                                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                  <svg
                                    className="h-8 w-8 text-blue-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                  </svg>
                                </div>
                                <p className="text-gray-600">
                                  Không tìm thấy bài kiểm tra nào
                                </p>
                              </div>
                            ) : (
                              <>
                                {examsData.exams
                                  .sort((a: any, b: any) => Number(a.id) - Number(b.id))
                                  .map((exam: any) => (
                                  <div
                                    key={exam.id}
                                    className={`p-4 border-2 rounded-2xl cursor-pointer transition-all duration-200 ${
                                      tempSelectedExams.includes(String(exam.id))
                                        ? "border-blue-300 bg-blue-50"
                                        : "border-gray-200 hover:border-blue-200 hover:bg-blue-25"
                                    }`}
                                    onClick={() => {
                                      const idStr = String(exam.id);
                                      // Update temporary state
                                      if (tempSelectedExams.includes(idStr)) {
                                        // Remove from temporary list
                                        setTempSelectedExams(prev => prev.filter(id => id !== idStr));
                                        setTempSelectedExamsInfo(prev => {
                                          const newInfo = {...prev};
                                          delete newInfo[idStr];
                                          return newInfo;
                                        });
                                      } else {
                                        // Add to temporary list
                                        setTempSelectedExams(prev => [...prev, idStr]);
                                        setTempSelectedExamsInfo(prev => ({
                                          ...prev,
                                          [idStr]: exam
                                        }));
                                      }
                                    }}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <h3 className="font-semibold text-gray-900">
                                          {exam.name}
                                        </h3>
                                        <p className="text-sm text-gray-500 mt-1">
                                          {exam.description || "Không có mô tả"}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Badge className="bg-blue-100 text-blue-600 border-blue-200">
                                          {exam.questions?.length || 0} câu hỏi
                                        </Badge>
                                        {tempSelectedExams.includes(String(exam.id)) && (
                                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                            <svg
                                              className="h-4 w-4 text-white"
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M5 13l4 4L19 7"
                                              />
                                            </svg>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </>
                            )}
                          </div>
                          
                          {/* Confirm Button - Positioned at the bottom */}
                          <div className="px-4 py-4 border-t border-gray-100 flex-shrink-0 bg-gray-50/50">
                            <div className="flex gap-3 justify-end">
                              <Button
                                variant="outline"
                                className="rounded-2xl border-gray-200 hover:border-gray-300"
                                onClick={() => setOpenExamPopup(false)}
                              >
                                Hủy
                              </Button>
                              <Button
                                className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-6"
                                onClick={() => {
                                  // Apply changes to form and selectedInfo
                                  setForm(f => ({ ...f, test: [...tempSelectedExams] }));
                                  setSelectedExamsInfo({...tempSelectedExamsInfo});
                                  setOpenExamPopup(false);
                                }}
                              >
                                Xác nhận ({tempSelectedExams.length} bài)
                              </Button>
                            </div>
                          </div>
                          
                          {/* Load More Button - Positioned outside the scrollable area */}
                          {examsPagination.hasNextPage && (
                            <div className="text-center py-4 px-4 mt-auto border-t border-gray-100 flex-shrink-0 bg-gray-50/50">
                              <Button
                                variant="outline"
                                className="rounded-2xl border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                                onClick={loadMoreExams}
                                disabled={examsLoading}
                              >
                                {examsLoading ? (
                                  <>
                                    <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Đang tải...
                                  </>
                                ) : (
                                  <>
                                    Tải thêm ({examsPagination.currentPage}/{examsPagination.totalPages})
                                  </>
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* Submit/Cancel buttons */}
                  <div className="pt-8 flex justify-end gap-4">
                    {onCancel && (
                      <Button
                        variant="outline"
                        onClick={onCancel}
                        disabled={loading}
                        className="rounded-2xl border-gray-200 hover:border-gray-300 px-6 py-3"
                      >
                        Hủy
                      </Button>
                    )}
                    <Button
                      disabled={loading}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl px-8 py-3 font-semibold shadow-sm"
                      onClick={handleCreateLesson}
                    >
                      {loading ? "Đang tạo..." : "Tạo bài học"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>{" "}
      {/* Popup tạo bài luyện tập mới */}
      {showCreateHomework && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-0 w-full max-w-6xl h-[85vh] min-h-[600px] max-h-[90vh] relative flex flex-col">
            <div className="absolute top-4 right-4 z-10">
              <Button
                size="icon"
                variant="ghost"
                className="h-10 w-10 rounded-2xl hover:bg-gray-100"
                onClick={() => setShowCreateHomework(false)}
              >
                ×
              </Button>
            </div>
            <div className="flex-1 overflow-auto p-8">
              <HomeworkCreateForm
                hideSidebar
                onCancel={() => setShowCreateHomework(false)}
                onSuccess={async (res: any) => {
                  setShowCreateHomework(false);
                  if (res && res.id) {
                    // Add new homework to homeworksData to display name immediately
                    setHomeworksData((prev: any) => ({
                      ...prev,
                      homeworks: prev?.homeworks ? [...prev.homeworks, res] : [res]
                    }));
                    // Save info of newly created homework
                    setSelectedHomeworksInfo(prev => ({
                      ...prev,
                      [String(res.id)]: res
                    }));
                    await loadHomeworks(debouncedHomeworkSearch);
                    setForm((f) => ({
                      ...f,
                      exercise: [...f.exercise, String(res.id)],
                    }));
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
      {/* Popup tạo bài giảng */}
      {showCreateLecture && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-0 w-full max-w-6xl h-[85vh] min-h-[600px] max-h-[90vh] relative flex flex-col">
            <div className="absolute top-4 right-4 z-10">
              <Button
                size="icon"
                variant="ghost"
                className="h-10 w-10 rounded-2xl hover:bg-gray-100"
                onClick={() => setShowCreateLecture(false)}
              >
                ×
              </Button>
            </div>
            <div className="flex-1 overflow-auto p-8">
              <LectureCreateForm
                onCancel={() => setShowCreateLecture(false)}
                onSuccess={async (res) => {
                  setShowCreateLecture(false);
                  setOpenLecturePopup(false);
                  if (res && res.id) {
                    // Add new lecture to lessonPlansData to display name immediately
                    setLessonPlansData((prev: any) => ({
                      ...prev,
                      lessonPlans: prev?.lessonPlans ? [...prev.lessonPlans, res] : [res]
                    }));
                    // Save info of newly created lecture
                    setSelectedLectureInfo(res);
                    await loadLessonPlans(debouncedLectureSearch);
                    setForm((f) => ({ ...f, lecture: String(res.id) }));
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
      {/* Popup tạo bài kiểm tra */}
      {showCreateExam && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-0 w-full max-w-6xl h-[85vh] min-h-[600px] max-h-[90vh] relative flex flex-col">
            <div className="absolute top-4 right-4 z-10">
              <Button
                size="icon"
                variant="ghost"
                className="h-10 w-10 rounded-2xl hover:bg-gray-100"
                onClick={() => setShowCreateExam(false)}
              >
                ×
              </Button>
            </div>
            <div className="flex-1 overflow-auto p-8">
              <div className="[&_.radix-popper-content]:z-[150] [&_.radix-select-content]:z-[150] [&_.radix-popover-content]:z-[150]">
                <ExamCreateForm
                  hideSidebar={false}
                  onCancel={() => setShowCreateExam(false)}
                  onSuccess={async (res: any) => {
                    setShowCreateExam(false);
                    if (res && res.id) {
                      // Add new exam to examsData to display name immediately
                      setExamsData((prev: any) => ({
                        ...prev,
                        exams: prev?.exams ? [...prev.exams, res] : [res]
                      }));
                      // Save info of newly created exam
                      setSelectedExamsInfo(prev => ({
                        ...prev,
                        [String(res.id)]: res
                      }));
                      await loadExams(debouncedExamSearch);
                      setForm((f) => ({
                        ...f,
                        test: [...f.test, String(res.id)],
                      }));
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
