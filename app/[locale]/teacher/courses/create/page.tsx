"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { getSkillsList } from "@/lib/api/utils";
import { useParams, useRouter } from "next/navigation";
import { useTypedTranslations } from "@/lib/i18n/client";
import { CreateCourse, GetCourseDetail } from "@/lib/api/courses";
import { getListCourse } from "@/lib/api/dashboard";
import { uploadFile } from "@/lib/api/questions";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/context/auth-context";
import { RoleBasedHeaderSidebar } from "@/components/layout/role-based-header-sidebar";
import { GetProgramList } from "@/lib/api/programs";
import { ArrowLeft, CalendarClock } from "lucide-react";
import { GetSchoolList } from "@/lib/api/schools";
import { GetSemestersList, Semester } from "@/lib/api/semesters";
import { Checkbox } from "@/components/ui/checkbox";
import { sortAlphabetGeneric, sortByNumberAndAlphabetFromSecondGeneric } from "@/lib/utils";

// Định nghĩa type cho form
interface CreateCourseFormState {
  name: string;
  object_title: string;
  target: string;
  description: string;
  cover: string;
  duration: number;
  startDate: string;
  endDate: string;
  program_id: number;
  parent_course_id: number;
  skills: string[];
  chapters: { name: string; lessons: string[] }[];
  students: {
    id: string;
    name: string;
    email: string;
    school?: string;
    class?: string;
  }[];
  semesters: {
    id: number;
    name: string;
    description: string;
    start_date: string;
    end_date: string;
  }[];
}

function CreateCourseForm({
  form,
  setForm,
  handleCreateCourse,
  showSuccess,
  setShowSuccess,
  createdCourseId,
  router,
  skills,
  skillsLoading,
  startDateError,
  // NEW:
  programList,
  selectedProgramId,
  setSelectedProgramId,
  useTemplateSchedule,
  setUseTemplateSchedule,
  templateCourses,
  selectedTemplateCourseId,
  setSelectedTemplateCourseId,
  selectedTemplateCourseDetail,
  setSelectedTemplateCourseDetail,
  loadingCourseDetail,
  setLoadingCourseDetail,
  toast,

  // ====== NHẬN PROPS TRƯỜNG HỌC MỚI ======
  selectedSchoolId,
  setSelectedSchoolId,
  selectedSchoolName,
  setSelectedSchoolName,

  // ====== NHẬN PROPS KỲ HỌC MỚI ======
  semesterList,
  selectedSemesterIds,
  setSelectedSemesterIds,
  isSemesterDropdownOpen,
  setIsSemesterDropdownOpen,

  // loading create course
  loadingCreateCourse
}: any) {
  // Danh sách trường (fetch 1 lần khi cần)
  const [schoolList, setSchoolList] = useState<any[]>([]);

  // Fetch school list chỉ 1 lần khi component mount
  useEffect(() => {
    (async () => {
      try {
        const res = await GetSchoolList({ page: 1 });
        setSchoolList(res?.data?.schools || []);
      } catch {
        setSchoolList([]);
      }
    })();
  }, []); // dependency rỗng => chỉ chạy 1 lần

  const t = useTypedTranslations("teacherCourses");
  const params = useParams() as { locale?: string };
  const locale = params?.locale || "vi";

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-2 md:px-6 py-8">
        {window.history.length > 1 && <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-900 mt-8 xl:mt-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("backButton")}
        </Button>}
        {/* Header Section - Minimalist */}
        <div className="mb-12">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              {t("createCourse")}
            </h1>
            <p className="text-gray-500 font-medium">{t("setupCourseInfo")}</p>
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
                    {t("courseName")} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={form.name}
                    onChange={(e) =>
                      setForm((f: CreateCourseFormState) => ({
                        ...f,
                        name: e.target.value,
                      }))
                    }
                    placeholder={t("enterCourseName")}
                    className="rounded-xl border-gray-200 focus:border-emerald-300 focus:ring-emerald-200 px-4 py-3 text-gray-900 placeholder:text-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    {t("courseTitle")} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={form.object_title}
                    onChange={(e) =>
                      setForm((f: CreateCourseFormState) => ({
                        ...f,
                        object_title: e.target.value,
                      }))
                    }
                    placeholder={t("enterCourseTitle")}
                    className="rounded-xl border-gray-200 focus:border-emerald-300 focus:ring-emerald-200 px-4 py-3 text-gray-900 placeholder:text-gray-400"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-2 mt-4">
                    Chương trình
                  </label>
                  <select
                    className="w-full border rounded-xl px-4 py-2 bg-white"
                    value={selectedProgramId}
                    onChange={(e) => setSelectedProgramId(e.target.value)}
                  >
                    <option value="">-- Chọn chương trình --</option>
                    {sortByNumberAndAlphabetFromSecondGeneric(programList, (item: any) => item.name, true).map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Cài đặt thời gian khóa học - Khung chung */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <CalendarClock className="w-5 h-5 text-blue-500" />
                    Cài đặt thời gian khóa học
                  </h3>

                  {/* Option Selection */}
                  <div className="space-y-3 mb-6">
                    {/* Option 1: Thủ công */}
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        id="manualSchedule"
                        name="scheduleType"
                        checked={!useTemplateSchedule}
                        onChange={() => {
                          setUseTemplateSchedule(false);
                          setSelectedTemplateCourseId("");
                          setSelectedTemplateCourseDetail(null);
                          setSelectedSemesterIds([]);
                          setForm((prev: CreateCourseFormState) => ({
                            ...prev,
                            parent_course_id: 0,
                            semesters: [],
                          }));
                        }}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
                      />
                      <label
                        htmlFor="manualSchedule"
                        className="text-sm font-medium text-gray-900 cursor-pointer"
                      >
                        📅 Tự chọn kỳ học
                      </label>
                    </div>

                    {/* Option 2: Theo mẫu (chỉ hiện khi có template) */}
                    {templateCourses.length > 0 && (
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          id="templateSchedule"
                          name="scheduleType"
                          checked={useTemplateSchedule}
                          onChange={() => setUseTemplateSchedule(true)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
                        />
                        <label
                          htmlFor="templateSchedule"
                          className="text-sm font-medium text-gray-900 cursor-pointer"
                        >
                          📋 Sao chép lịch từ khóa học mẫu
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Content based on selection */}
                  {!useTemplateSchedule ? (
                    /* Manual Date Selection */
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          {t("startDate")}{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <Input
                          type="date"
                          value={form.startDate}
                          onChange={(e) =>
                            setForm((f: CreateCourseFormState) => ({
                              ...f,
                              startDate: e.target.value,
                            }))
                          }
                          className={`rounded-xl border-gray-200 focus:border-emerald-300 focus:ring-emerald-200 px-4 py-3 text-gray-900 w-full ${
                            startDateError
                              ? "border-red-300 focus:border-red-400 focus:ring-red-200"
                              : ""
                          }`}
                        />
                        {startDateError && (
                          <p className="text-xs text-red-500 mt-1">
                            {startDateError}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {t("startMondayHint")}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          {t("endDate")}
                        </label>
                        <Input
                          type="date"
                          value={form.endDate}
                          readOnly
                          className="rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-gray-500 w-full cursor-not-allowed"
                        />
                        {form.endDate && (
                          <p className="text-xs text-gray-500 mt-1">
                            {t("endDateAuto")}
                          </p>
                        )}
                      </div> */}
                    </div>
                  ) : (
                    /* Template Course Selection */
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Chọn khóa học mẫu{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <select
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white focus:border-emerald-300 focus:ring-emerald-200 focus:ring-2 transition-colors"
                        value={selectedTemplateCourseId}
                        onChange={async (e) => {
                          const courseId = e.target.value;
                          setSelectedTemplateCourseId(courseId);
                          setSelectedTemplateCourseDetail(null);

                          if (courseId) {
                            // Gắn id vào parent_course_id
                            setForm((prev: CreateCourseFormState) => ({
                              ...prev,
                              parent_course_id: Number(courseId),
                            }));

                            setLoadingCourseDetail(true);
                            try {
                              const courseDetail = await GetCourseDetail(
                                courseId
                              );
                              const detailData =
                                courseDetail?.data || courseDetail;
                              setSelectedTemplateCourseDetail(detailData);

                              // Cập nhật form với thông tin từ API
                              if (detailData) {
                                // Sao chép semesters từ khóa học mẫu
                                const templateSemesters =
                                  detailData.semesters || [];

                                // Map semesters từ template với semesterList để tìm các id tương ứng
                                const matchedSemesterIds: string[] = [];
                                const matchedSemesters: {
                                  id: number;
                                  name: string;
                                  description: string;
                                  start_date: string;
                                  end_date: string;
                                }[] = [];

                                templateSemesters.forEach(
                                  (templateSemester: any) => {
                                    // Tìm semester trong semesterList có cùng id
                                    const matchedSemester = semesterList.find(
                                      (s: Semester) =>
                                        String(s.id) ===
                                        String(templateSemester.id)
                                    );

                                    if (matchedSemester) {
                                      matchedSemesterIds.push(
                                        matchedSemester.id
                                      );
                                      matchedSemesters.push({
                                        id: Number(matchedSemester.id),
                                        name: matchedSemester.name,
                                        description:
                                          matchedSemester.description || "",
                                        start_date: matchedSemester.start_date,
                                        end_date: matchedSemester.end_date,
                                      });
                                    }
                                  }
                                );

                                // Cập nhật selectedSemesterIds và form.semesters
                                setSelectedSemesterIds(matchedSemesterIds);

                                setForm((prev: CreateCourseFormState) => ({
                                  ...prev,
                                  startDate: detailData.start_date || "",
                                  endDate: detailData.end_date || "",
                                  duration:
                                    detailData.duration || prev.duration,
                                  parent_course_id: Number(courseId),
                                  // ✅ THÊM 3 DÒNG NÀY
                                  target: detailData.target || "",
                                  description: detailData.description || "",
                                  cover: detailData.image || "",
                                  // ✅ SAO CHÉP SEMESTERS TỪ KHÓA HỌC MẪU
                                  semesters: matchedSemesters,
                                }));
                              }
                            } catch (error) {
                              console.error(
                                "Error loading course detail:",
                                error
                              );
                              toast({
                                title: "Lỗi",
                                description:
                                  "Không thể tải thông tin chi tiết khóa học. Vui lòng thử lại.",
                                variant: "destructive",
                              });
                            } finally {
                              setLoadingCourseDetail(false);
                            }
                          } else {
                            // Nếu chọn lại "-- Chọn khóa học mẫu --" thì reset về rỗng
                            setSelectedSemesterIds([]);
                            setForm((prev: CreateCourseFormState) => ({
                              ...prev,
                              parent_course_id: 0,
                              target: "",
                              description: "",
                              cover: "",
                              semesters: [],
                            }));
                          }
                        }}
                      >
                        <option value="">-- Chọn khóa học mẫu --</option>
                        {sortByNumberAndAlphabetFromSecondGeneric(templateCourses, (item: any) => item.name, true)
                          .map((course: any) => (
                            <option key={course.id} value={course.id}>
                              {course.object_title
                                ? `${course.name} - ${course.object_title}`
                                : course.name}
                            </option>
                          ))}
                      </select>

                      {/* Preview thông tin từ template */}
                      {selectedTemplateCourseId && (
                        <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 shadow-sm">
                          <h4 className="text-sm font-semibold text-green-900 mb-3 flex items-center gap-2">
                            📋 Thông tin sao chép từ khóa học mẫu
                            {loadingCourseDetail && (
                              <span className="ml-2 text-xs text-blue-600">
                                Đang tải...
                              </span>
                            )}
                          </h4>

                          {loadingCourseDetail ? (
                            <div className="space-y-3">
                              <div className="animate-pulse">
                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                              </div>
                            </div>
                          ) : selectedTemplateCourseDetail ? (
                            (() => {
                              // Format ngày tháng dễ đọc
                              const formatDate = (dateString: string) => {
                                if (!dateString) return "Chưa đặt";
                                try {
                                  const date = new Date(dateString);
                                  return date.toLocaleDateString("vi-VN", {
                                    weekday: "long",
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  });
                                } catch {
                                  return dateString;
                                }
                              };

                              return (
                                <div className="space-y-3">
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                    <span className="text-sm text-gray-600 min-w-[100px]">
                                      📚 Tên khóa học:
                                    </span>
                                    <span className="text-sm font-medium text-gray-900 bg-white px-3 py-1 rounded-md border">
                                      {selectedTemplateCourseDetail.object_title
                                        ? `${selectedTemplateCourseDetail.name} - ${selectedTemplateCourseDetail.object_title}`
                                        : selectedTemplateCourseDetail.name}
                                    </span>
                                  </div>
                                  {selectedTemplateCourseDetail.description && (
                                    <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                                      <span className="text-sm text-gray-600 min-w-[100px]">
                                        � Mô tả:
                                      </span>
                                      <span className="text-sm font-medium text-gray-900 bg-white px-3 py-1 rounded-md border max-w-md">
                                        {selectedTemplateCourseDetail
                                          .description.length > 100
                                          ? `${selectedTemplateCourseDetail.description.substring(
                                              0,
                                              100
                                            )}...`
                                          : selectedTemplateCourseDetail.description}
                                      </span>
                                    </div>
                                  )}
                                  {selectedTemplateCourseDetail.semesters &&
                                    selectedTemplateCourseDetail.semesters
                                      .length > 0 && (
                                      <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                                        <span className="text-sm text-gray-600 min-w-[100px]">
                                          📅 Kỳ học:
                                        </span>
                                        <div className="flex flex-wrap gap-2">
                                          {selectedTemplateCourseDetail.semesters.map(
                                            (semester: any, index: number) => (
                                              <span
                                                key={index}
                                                className="text-sm font-medium text-gray-900 bg-white px-3 py-1 rounded-md border"
                                              >
                                                {semester.name}
                                              </span>
                                            )
                                          )}
                                        </div>
                                      </div>
                                    )}
                                </div>
                              );
                            })()
                          ) : (
                            <div className="text-sm text-gray-500">
                              Không thể tải thông tin chi tiết khóa học.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>{" "}
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-2 mt-4">
                  Kỳ học
                </label>
                <div className="relative" data-semester-dropdown>
                  <button
                    type="button"
                    onClick={() =>
                      setIsSemesterDropdownOpen(!isSemesterDropdownOpen)
                    }
                    className="w-full border rounded-xl px-4 py-3 bg-white text-left flex items-center justify-between hover:border-emerald-300 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-200 transition-colors"
                  >
                    <span
                      className={
                        selectedSemesterIds.length === 0
                          ? "text-gray-400"
                          : "text-gray-900"
                      }
                    >
                      {selectedSemesterIds.length === 0
                        ? "-- Chọn kỳ học --"
                        : selectedSemesterIds.length === 1
                        ? semesterList.find(
                            (s: Semester) => s.id === selectedSemesterIds[0]
                          )?.name || "Đã chọn"
                        : `Đã chọn ${selectedSemesterIds.length} kỳ học`}
                    </span>
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform ${
                        isSemesterDropdownOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {isSemesterDropdownOpen && (
                    <div className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                      <div className="p-2 space-y-2">
                        {semesterList.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-gray-500 text-center">
                            Không có kỳ học nào
                          </div>
                        ) : (
                          semesterList.map((semester: Semester) => {
                            const isSelected = selectedSemesterIds.includes(
                              semester.id
                            );
                            return (
                              <label
                                key={semester.id}
                                className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                              >
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      const newIds = [
                                        ...selectedSemesterIds,
                                        semester.id,
                                      ];
                                      setSelectedSemesterIds(newIds);
                                      setForm(
                                        (prev: CreateCourseFormState) => ({
                                          ...prev,
                                          semesters: semesterList
                                            .filter((s: Semester) =>
                                              newIds.includes(s.id)
                                            )
                                            .map((s: Semester) => ({
                                              id: Number(s.id),
                                              name: s.name,
                                              description: s.description,
                                              start_date: s.start_date,
                                              end_date: s.end_date,
                                            })),
                                        })
                                      );
                                    } else {
                                      const newIds = selectedSemesterIds.filter(
                                        (id: string) => id !== semester.id
                                      );
                                      setSelectedSemesterIds(newIds);
                                      setForm(
                                        (prev: CreateCourseFormState) => ({
                                          ...prev,
                                          semesters: semesterList
                                            .filter((s: Semester) =>
                                              newIds.includes(s.id)
                                            )
                                            .map((s: Semester) => ({
                                              id: Number(s.id),
                                              name: s.name,
                                              description: s.description,
                                              start_date: s.start_date,
                                              end_date: s.end_date,
                                            })),
                                        })
                                      );
                                    }
                                  }}
                                />
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-gray-900">
                                    {semester.name}
                                  </div>
                                  {semester.description && (
                                    <div className="text-xs text-gray-500 mt-0.5">
                                      {semester.description}
                                    </div>
                                  )}
                                </div>
                              </label>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {selectedSemesterIds.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedSemesterIds.map((semesterId: string) => {
                      const semester = semesterList.find(
                        (s: Semester) => s.id === semesterId
                      );
                      if (!semester) return null;
                      return (
                        <div
                          key={semesterId}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm border border-emerald-200"
                        >
                          <span>{semester.name}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const newIds = selectedSemesterIds.filter(
                                (id: string) => id !== semesterId
                              );
                              setSelectedSemesterIds(newIds);
                              setForm((prev: CreateCourseFormState) => ({
                                ...prev,
                                semesters: semesterList
                                  .filter((s: Semester) =>
                                    newIds.includes(s.id)
                                  )
                                  .map((s: Semester) => ({
                                    id: Number(s.id),
                                    name: s.name,
                                    description: s.description,
                                    start_date: s.start_date,
                                    end_date: s.end_date,
                                  })),
                              }));
                            }}
                            className="hover:text-emerald-900 focus:outline-none"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  {t("courseTarget")}
                </label>
                <Input
                  value={form.target}
                  onChange={(e) =>
                    setForm((f: CreateCourseFormState) => ({
                      ...f,
                      target: e.target.value,
                    }))
                  }
                  placeholder={t("enterTarget")}
                  className="rounded-xl border-gray-200 focus:border-emerald-300 focus:ring-emerald-200 px-4 py-3 text-gray-900 placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  {t("detailedDescription")}
                </label>
                <Textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((f: CreateCourseFormState) => ({
                      ...f,
                      description: e.target.value,
                    }))
                  }
                  placeholder={t("enterDetailedDescription")}
                  className="rounded-xl border-gray-200 focus:border-emerald-300 focus:ring-emerald-200 px-4 py-3 text-gray-900 placeholder:text-gray-400 min-h-[120px] resize-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-2 mt-4">
                  Trường
                </label>
                <select
                  className="w-full border rounded-xl px-4 py-2 bg-white"
                  value={selectedSchoolId || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSelectedSchoolId(value);
                    const found = schoolList.find(
                      (s) => String(s.id) === value
                    );
                    setSelectedSchoolName(found ? found.name : "");
                  }}
                >
                  <option value="">-- Chọn trường --</option>
                  {sortAlphabetGeneric(schoolList, item => item.name, true).map((s) => (
                    <option key={s.id} value={String(s.id)}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  {t("coverImage")}
                </label>
                <Input
                  type="file"
                  className="rounded-xl border-gray-200 focus:border-emerald-300 focus:ring-emerald-200 px-4 pt-3 pb-6 text-gray-900 file:mr-4 file:py-2 file:px-6 file:rounded-lg file:border-0 file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 flex items-start min-h-[60px]"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setForm((f: CreateCourseFormState) => ({
                        ...f,
                        cover: URL.createObjectURL(file),
                      }));
                    }
                  }}
                />
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
                onClick={handleCreateCourse}
                disabled={loadingCreateCourse}
              >
                {loadingCreateCourse ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-b-transparent" />: t("createCourse")}
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
                {t("createSuccessTitle")}
              </h3>
              <p className="text-gray-600 text-center mb-8 leading-relaxed">
                {t("createSuccessSubtitle")}
              </p>
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200"
                onClick={() => {
                  if (createdCourseId)
                    router.push(
                      `/${locale}/manage/courses/${createdCourseId}/edit`
                    );
                }}
              >
                {t("editCourse")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function CreateCoursePage() {
  const { user } = useAuth();
  const [programList, setProgramList] = useState<any[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string>("");
  const [semesterList, setSemesterList] = useState<Semester[]>([]);
  const [selectedSemesterIds, setSelectedSemesterIds] = useState<string[]>([]);
  const [isSemesterDropdownOpen, setIsSemesterDropdownOpen] = useState(false);
  const [useTemplateSchedule, setUseTemplateSchedule] =
    useState<boolean>(false);
  const [templateCourses, setTemplateCourses] = useState<any[]>([]);
  const [selectedTemplateCourseId, setSelectedTemplateCourseId] =
    useState<string>("");
  const [selectedTemplateCourseDetail, setSelectedTemplateCourseDetail] =
    useState<any>(null);
  const [loadingCourseDetail, setLoadingCourseDetail] =
    useState<boolean>(false);
  const [form, setForm] = useState<CreateCourseFormState>({
    name: "",
    object_title: "",
    target: "",
    description: "",
    cover: "",
    duration: 1,
    startDate: "",
    endDate: "",
    program_id: 0,
    parent_course_id: 0,
    skills: [],
    chapters: [],
    students: [],
    semesters: [],
  });

  // Thêm vào phần state ở đầu CreateCoursePage (nơi bạn khai báo useState khác)
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const [selectedSchoolName, setSelectedSchoolName] = useState<string>("");

  const calculateEndDate = (startDate: string, duration: number) => {
    if (!startDate || !duration) return "";
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + duration * 7);
    return end.toISOString().split("T")[0];
  };

  const isMonday = (dateString: string) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    return date.getDay() === 1;
  };

  const [chapterLessonSelect, setChapterLessonSelect] = useState<{
    idx: number;
    show: boolean;
  }>({ idx: -1, show: false });
  const router = useRouter();
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdCourseId, setCreatedCourseId] = useState<string | null>(null);
  const [startDateError, setStartDateError] = useState<string>("");

  const [skills, setSkills] = useState<{ id: string | number; name: string }[]>(
    []
  );
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [loadingCreateCourse, setLoadingCreateCourse] = useState<boolean>(false)
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      try {
        const res = await GetProgramList({ page: 1 });
        setProgramList(res?.data?.programs || []);
      } catch {
        setProgramList([]);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await GetSemestersList();
        setSemesterList(res?.data?.semesters || []);
      } catch {
        setSemesterList([]);
      }
    })();
  }, []);

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest("[data-semester-dropdown]")) {
        setIsSemesterDropdownOpen(false);
      }
    };
    if (isSemesterDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSemesterDropdownOpen]);

  useEffect(() => {
    setSkillsLoading(true);
    getSkillsList()
      .then((res) => {
        const arr = res?.data?.skills || res?.skills || [];
        setSkills(arr);
      })
      .catch(() => setSkills([]))
      .finally(() => setSkillsLoading(false));
  }, []);

  // Load template courses using getListCourse
  useEffect(() => {
    // Reset template selections when program changes
    setSelectedTemplateCourseId("");
    setUseTemplateSchedule(false);
    setSelectedTemplateCourseDetail(null);
    setForm((prev: CreateCourseFormState) => ({
      ...prev,
      parent_course_id: 0,
    }));

    (async () => {
      try {
        const params: {
          parent_course_id: string;
          school_id?: string;
          program_id?: string;
        } = {
          parent_course_id: "0",
          school_id: undefined,
        };

        if (selectedProgramId) {
          params.program_id = selectedProgramId;
        }

        const res = await getListCourse(params);
        setTemplateCourses(res?.data?.courses || res?.courses || []);
      } catch (error) {
        console.error("Error loading template courses:", error);
        setTemplateCourses([]);
      }
    })();
  }, [selectedProgramId]);

  // TẠO KHÓA HỌC
  const handleCreateCourse = async () => {
    // Validate các trường bắt buộc
    if (!form.name.trim()) {
      alert("Vui lòng nhập tên khóa học.");
      return;
    }
    if (!form.object_title.trim()) {
      alert("Vui lòng nhập tiêu đề khóa học.");
      return;
    }
    if (!form.target.trim()) {
      alert("Vui lòng nhập mục tiêu khóa học.");
      return;
    }
    if (!form.description.trim()) {
      alert("Vui lòng nhập mô tả chi tiết cho khóa học.");
      return;
    }
    if (!selectedProgramId) {
      alert("Vui lòng chọn chương trình.");
      return;
    }

    if (!form.cover.trim()) {
      alert("Vui lòng upload ảnh cover cho khóa học.");
      return;
    }

    setLoadingCreateCourse(true)

    let coverUrl = form.cover;

    // Nếu user upload file từ máy, cover là objectURL => cần upload lên server
    if (form.cover && form.cover.startsWith("blob:")) {
      const fileInput = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      const file = fileInput?.files?.[0];
      if (!file) {
        alert("Vui lòng chọn file ảnh cover.");
        setLoadingCreateCourse(false)
        return;
      }
      try {
        const uploadResponse = await uploadFile(file, "courses/covers");
        if (uploadResponse.error) {
          setLoadingCreateCourse(false)
          throw new Error(uploadResponse.error);
        }
        const fileUrl = uploadResponse?.url || uploadResponse?.data?.url;
        if (!fileUrl) {
          setLoadingCreateCourse(false)
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
        setLoadingCreateCourse(false)
        return;
      }
    }


    try {
      const now = new Date().toISOString();
      const data = {
        name: form.name,
        object_title: form.object_title,
        description: form.description,
        type: "",
        level: "",
        duration: String(form.duration),
        start_date: form.startDate,
        end_date: form.endDate,
        image: coverUrl,
        status: true,
        student_count: 0,
        target: form.target,
        program_id: Number(selectedProgramId), // <-- QUAN TRỌNG
        parent_course_id: form.parent_course_id || 0,
        school: selectedSchoolId
          ? { id: Number(selectedSchoolId), name: selectedSchoolName }
          : { id: 0, name: "" },
        semesters: form.semesters || [],
        created_at: now,
        updated_at: now,
      };
      const res = await CreateCourse(data);
      setCreatedCourseId(res?.data?.id || res?.id || res?.course_id || null);
      setShowSuccess(true);
    } catch (err) {
      console.error("Tạo khóa học thất bại:", err);
    } finally {
      setLoadingCreateCourse(false)
    }
  };

  if (!user) return null;

  return (
    <RoleBasedHeaderSidebar>
      <CreateCourseForm
        form={form}
        setForm={setForm}
        handleCreateCourse={handleCreateCourse}
        showSuccess={showSuccess}
        setShowSuccess={setShowSuccess}
        createdCourseId={createdCourseId}
        router={router}
        skills={skills}
        skillsLoading={skillsLoading}
        startDateError={startDateError}
        // NEW:
        programList={programList}
        selectedProgramId={selectedProgramId}
        setSelectedProgramId={setSelectedProgramId}
        // Template course props
        useTemplateSchedule={useTemplateSchedule}
        setUseTemplateSchedule={setUseTemplateSchedule}
        templateCourses={templateCourses}
        selectedTemplateCourseId={selectedTemplateCourseId}
        setSelectedTemplateCourseId={setSelectedTemplateCourseId}
        selectedTemplateCourseDetail={selectedTemplateCourseDetail}
        setSelectedTemplateCourseDetail={setSelectedTemplateCourseDetail}
        loadingCourseDetail={loadingCourseDetail}
        setLoadingCourseDetail={setLoadingCourseDetail}
        toast={toast}
        // ====== THÊM CÁC PROPS CHO TRƯỜNG HỌC ======
        selectedSchoolId={selectedSchoolId}
        setSelectedSchoolId={setSelectedSchoolId}
        selectedSchoolName={selectedSchoolName}
        setSelectedSchoolName={setSelectedSchoolName}
        // ====== THÊM CÁC PROPS CHO KỲ HỌC ======
        semesterList={semesterList}
        selectedSemesterIds={selectedSemesterIds}
        setSelectedSemesterIds={setSelectedSemesterIds}
        isSemesterDropdownOpen={isSemesterDropdownOpen}
        setIsSemesterDropdownOpen={setIsSemesterDropdownOpen}
        // loading create course
        loadingCreateCourse={loadingCreateCourse}
      />
    </RoleBasedHeaderSidebar>
  );
}
