import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  GetCourseScheduleByWeek,
  UpdateCourseSchedule,
} from "@/lib/api/courses";
import { useParams } from "next/navigation";
import { Edit } from "lucide-react";
import type { Chapter } from "@/lib/api/chapters";

// Schedule Modal để hiển thị danh sách tất cả bài học trong khóa học với drag & drop
function ScheduleModal({
  open,
  chapters,
  onClose,
  duration,
  courseId,
}: {
  open: boolean;
  chapters: Chapter[];
  onClose: () => void;
  duration?: number;
  courseId: string | number;
}) {
  const [draggedLesson, setDraggedLesson] = useState<any>(null);
  const [weekAssignments, setWeekAssignments] = useState<{
    [key: number]: any[];
  }>({});
  const [semesters, setSemesters] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [localSemesters, setLocalSemesters] = useState<any[]>([]);
  const params = useParams();
  const locale = params?.locale || "vi";

  // Fetch week schedules from API when modal opens
  useEffect(() => {
    if (open && courseId) {
      setLoading(true);
      GetCourseScheduleByWeek(String(courseId))
        .then((response) => {
          // Xử lý response mới với cấu trúc semesters
          if (
            response?.data?.semesters &&
            Array.isArray(response.data.semesters)
          ) {
            setSemesters(response.data.semesters);
            setLocalSemesters(response.data.semesters);
          } else if (response?.data?.weeks) {
            // Fallback cho cấu trúc cũ (backward compatibility)
            const fallbackSemester = {
              id: "default",
              name: "Học kỳ mặc định",
              description: "",
              start_date: "",
              end_date: "",
              weeks: response.data.weeks,
            };
            setSemesters([fallbackSemester]);
            setLocalSemesters([fallbackSemester]);
          }
        })
        .catch((error) => {
          console.error("❌ Schedule API Error:", error);
          setSemesters([]);
          setLocalSemesters([]);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, courseId]);

  // Tạo danh sách tất cả bài học từ các chương
  const allLessons = chapters.reduce((acc: any[], chapter: Chapter) => {
    if (chapter.lessons && chapter.lessons.length > 0) {
      const chapterLessons = chapter.lessons.map(
        (lesson: any, index: number) => ({
          chapterTitle: chapter.title,
          chapterIndex: chapters.indexOf(chapter) + 1,
          lessonIndex: index + 1,
          lesson: lesson,
          lessonTitle:
            typeof lesson === "object" && lesson.title
              ? lesson.title
              : `Bài học #${lesson}`,
          lessonDescription:
            typeof lesson === "object" && lesson.description
              ? lesson.description
              : "",
          lessonId:
            typeof lesson === "object" && lesson.id ? lesson.id : lesson,
          uniqueId: `${chapter.id}-${index}`, // ID duy nhất cho mỗi lesson
        })
      );
      return [...acc, ...chapterLessons];
    }
    return acc;
  }, []);

  // Lấy tất cả các tuần từ tất cả các học kỳ
  const allWeeks = localSemesters.flatMap((semester) => semester.weeks || []);

  // Tính toán danh sách lessons chưa được gán vào tuần nào
  const assignedLessonIds = allWeeks.flatMap((week) =>
    (week.schedules || []).map((schedule: any) =>
      String(schedule.lesson_id || schedule.lesson?.id)
    )
  );
  const unassignedLessons = allLessons.filter(
    (lesson) => !assignedLessonIds.includes(String(lesson.lessonId))
  );

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, lesson: any) => {
    setDraggedLesson(lesson);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, weekId: number) => {
    e.preventDefault();
    if (draggedLesson) {
      // Tìm tuần trong tất cả các học kỳ
      let foundWeek: any = null;
      let semesterIndex = -1;
      let weekIndex = -1;

      for (let sIdx = 0; sIdx < localSemesters.length; sIdx++) {
        const semester = localSemesters[sIdx];
        const wIdx = (semester.weeks || []).findIndex(
          (week: any) => week.week_id === weekId
        );
        if (wIdx !== -1) {
          foundWeek = semester.weeks[wIdx];
          semesterIndex = sIdx;
          weekIndex = wIdx;
          break;
        }
      }

      if (!foundWeek || semesterIndex === -1 || weekIndex === -1) return;

      const lesson = draggedLesson;
      const newSchedule = {
        id: 0,
        scheduled_date: foundWeek.start_date,
        week_id: weekId,
        week_number: foundWeek.week_number,
        lesson: {
          id: lesson.lessonId,
          title: lesson.lessonTitle,
          description: lesson.lessonDescription || "",
        },
        chapter: {
          id: lesson.chapterId || lesson.chapter?.id || "",
          title: lesson.chapterTitle,
          description: lesson.chapter?.description || "",
        },
        course: {
          id: Number(courseId),
          name: "",
          description: "",
        },
        lesson_id: lesson.lessonId,
        lesson_title: lesson.lessonTitle,
        chapter_title: lesson.chapterTitle,
      };

      const updatedSemesters = [...localSemesters];
      updatedSemesters[semesterIndex] = {
        ...updatedSemesters[semesterIndex],
        weeks: [...updatedSemesters[semesterIndex].weeks],
      };
      updatedSemesters[semesterIndex].weeks[weekIndex] = {
        ...foundWeek,
        schedules: [...(foundWeek.schedules || []), newSchedule],
      };
      setLocalSemesters(updatedSemesters);
      setDraggedLesson(null);
    }
  };

  const handleRemoveFromWeek = (weekId: number, lessonId: string | number) => {
    // Tìm tuần trong tất cả các học kỳ
    let semesterIndex = -1;
    let weekIndex = -1;

    for (let sIdx = 0; sIdx < localSemesters.length; sIdx++) {
      const semester = localSemesters[sIdx];
      const wIdx = (semester.weeks || []).findIndex(
        (week: any) => week.week_id === weekId
      );
      if (wIdx !== -1) {
        semesterIndex = sIdx;
        weekIndex = wIdx;
        break;
      }
    }

    if (semesterIndex === -1 || weekIndex === -1) return;

    const updatedSemesters = [...localSemesters];
    const semester = updatedSemesters[semesterIndex];
    const week = semester.weeks[weekIndex];

    updatedSemesters[semesterIndex] = {
      ...semester,
      weeks: [...semester.weeks],
    };
    updatedSemesters[semesterIndex].weeks[weekIndex] = {
      ...week,
      schedules: (week.schedules || []).filter(
        (schedule: any) =>
          String(schedule.lesson_id || schedule.lesson?.id) !== String(lessonId)
      ),
    };
    setLocalSemesters(updatedSemesters);
  };

  const handleSaveSchedule = async () => {
    const totalLessons = allLessons.length;
    const assignedLessons = allWeeks.flatMap(
      (week) => week.schedules || []
    ).length;
    // if (assignedLessons < totalLessons) {
    //   alert(
    //     `Vẫn còn ${
    //       totalLessons - assignedLessons
    //     } bài học chưa được gán vào tuần. Vui lòng gán tất cả bài học trước khi lưu.`
    //   );
    //   return;
    // }
    setIsSaving(true);
    try {
      // Flatten tất cả các tuần từ tất cả các học kỳ để gửi lên API
      const allWeeksData = localSemesters.flatMap(
        (semester) => semester.weeks || []
      );

      const scheduleData = {
        course_id: Number(courseId),
        weeks: allWeeksData.map((week) => ({
          week_id: week.week_id,
          week_number_in_year: week.week_number_in_year,
          week_number: week.week_number,
          start_date: week.start_date,
          end_date: week.end_date,
          schedules: (week.schedules || []).map((schedule: any) => ({
            id: schedule.id || 0,
            scheduled_date: schedule.scheduled_date || week.start_date,
            week_id: week.week_id,
            week_number: week.week_number,
            lesson: {
              id: schedule.lesson?.id || schedule.lesson_id,
              title: schedule.lesson?.title || schedule.lesson_title || "",
              description: schedule.lesson?.description || "",
            },
            course: {
              id: Number(courseId),
              name: schedule.course?.name || "",
              description: schedule.course?.description || "",
            },
          })),
        })),
      };
      await UpdateCourseSchedule(scheduleData);
      alert("Lưu lịch trình thành công!");
      const response = await GetCourseScheduleByWeek(String(courseId));
      // Xử lý response mới với cấu trúc semesters
      if (response?.data?.semesters && Array.isArray(response.data.semesters)) {
        setSemesters(response.data.semesters);
        setLocalSemesters(response.data.semesters);
      } else if (response?.data?.weeks) {
        // Fallback cho cấu trúc cũ
        const fallbackSemester = {
          id: "default",
          name: "Học kỳ mặc định",
          description: "",
          start_date: "",
          end_date: "",
          weeks: response.data.weeks,
        };
        setSemesters([fallbackSemester]);
        setLocalSemesters([fallbackSemester]);
      }
    } catch (error) {
      alert("Lưu lịch trình thất bại!");
    } finally {
      setIsSaving(false);
    }
  };

  return open ? (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0 flex-wrap gap-2">
          <h3 className="font-bold text-xl sm:text-2xl text-cs-blue">
            Lịch trình khóa học
          </h3>
          <div className="flex gap-2">
            <Button
              onClick={handleSaveSchedule}
              // disabled={isSaving || unassignedLessons.length > 0}
              className="bg-cs-green hover:bg-cs-green/90"
              title={
                unassignedLessons.length > 0
                  ? `Vui lòng gán ${unassignedLessons.length} bài học còn lại trước khi lưu`
                  : ""
              }
            >
              {isSaving ? "Đang lưu..." : "Lưu lịch trình"}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Đóng
            </Button>
          </div>
        </div>
        {allLessons.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <p className="text-lg">Chưa có bài học nào trong khóa học</p>
              <p className="text-sm mt-2">
                Hãy thêm chương và bài học để tạo lịch trình
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Content - Scrollable with fixed height */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 min-h-0">
              {/* Left side - Semesters and Weeks */}
              <div className="flex flex-col min-h-0">
                <h4 className="font-semibold text-md sm:text-lg mb-4 text-gray-800 flex-shrink-0">
                  Lịch trình theo học kỳ ({allWeeks.length} tuần)
                </h4>
                <div
                  className="flex-1 space-y-4 overflow-y-auto min-h-0"
                  style={{ maxHeight: "calc(90vh - 200px)" }}
                  onWheel={(e) => e.stopPropagation()}
                >
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin h-8 w-8 border-4 border-cs-green border-t-transparent rounded-full"></div>
                      <span className="ml-2">Đang tải lịch trình...</span>
                    </div>
                  ) : localSemesters.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">
                      <p>Chưa có lịch trình học kỳ nào</p>
                    </div>
                  ) : (
                    localSemesters.map((semester) => (
                      <div
                        key={semester.id}
                        className="border-2 border-solid border-cs-blue rounded-lg p-4 bg-blue-50/30 flex-shrink-0"
                      >
                        {/* Semester Header */}
                        <div className="mb-3 pb-2 border-b border-cs-blue/30">
                          <h5 className="font-bold text-lg text-cs-blue">
                            {semester.name}
                          </h5>
                          {semester.description && (
                            <p className="text-xs text-gray-600 mt-1">
                              {semester.description}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {semester.start_date && semester.end_date
                              ? `${semester.start_date} → ${semester.end_date}`
                              : ""}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {semester.weeks?.length || 0} tuần học
                          </p>
                        </div>

                        {/* Weeks in Semester */}
                        <div className="space-y-3">
                          {(semester.weeks || []).map((week: any) => (
                            <div
                              key={week.week_id}
                              className="border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-[120px] hover:border-cs-green hover:bg-green-50/50 transition-colors flex-shrink-0 bg-white"
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDrop(e, week.week_id)}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <h6 className="font-semibold text-cs-green">
                                    Tuần {week.week_number} (Tuần{" "}
                                    {week.week_number_in_year}/
                                    {new Date(week.end_date).getFullYear()})
                                  </h6>
                                  <p className="text-xs text-gray-500">
                                    {week.start_date} → {week.end_date}
                                  </p>
                                </div>
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                  {week.schedules?.length || 0} bài học
                                </span>
                              </div>
                              <div className="space-y-2">
                                {week.schedules?.map(
                                  (schedule: any, index: number) => (
                                    <div
                                      key={`${week.week_id}-${index}`}
                                      className="bg-white border rounded-lg p-2 text-sm shadow-sm"
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                          <div
                                            className="font-medium text-gray-800 truncate"
                                            title={
                                              schedule.lesson?.title ||
                                              schedule.lesson_title ||
                                              `Bài học #${
                                                schedule.lesson_id ||
                                                schedule.lesson?.id
                                              }`
                                            }
                                          >
                                            {schedule.lesson?.title ||
                                              schedule.lesson_title ||
                                              `Bài học #${
                                                schedule.lesson_id ||
                                                schedule.lesson?.id
                                              }`}
                                          </div>
                                          <div
                                            className="text-xs text-gray-500 truncate"
                                            title={`Chương: ${
                                              schedule.chapter?.title ||
                                              schedule.chapter_title ||
                                              "Không có tên chương"
                                            }`}
                                          >
                                            Chương:{" "}
                                            {schedule.chapter?.title ||
                                              schedule.chapter_title ||
                                              "Không có tên chương"}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="p-1 h-6 w-6 text-blue-500 hover:bg-blue-50"
                                            onClick={() =>
                                              window.open(
                                                `/${locale}/manage/lessons/${
                                                  schedule.lesson_id ||
                                                  schedule.lesson?.id
                                                }?course_id=${courseId}`,
                                                "_blank"
                                              )
                                            }
                                            title="Chỉnh sửa bài học"
                                          >
                                            <Edit className="h-3 w-3" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="p-1 h-6 w-6 text-red-500 hover:bg-red-50"
                                            onClick={() =>
                                              handleRemoveFromWeek(
                                                week.week_id,
                                                schedule.lesson_id ||
                                                  schedule.lesson?.id
                                              )
                                            }
                                            title="Xóa bài học khỏi tuần"
                                          >
                                            ×
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  )
                                )}
                                {(!week.schedules ||
                                  week.schedules.length === 0) && (
                                  <div className="text-center text-gray-400 text-sm py-4">
                                    Kéo bài học vào đây
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              {/* Right side - Available Lessons */}
              <div className="flex flex-col border-t sm:border-t-0 sm:border-l pt-6 sm:pt-0 sm:pl-6 min-h-0">
                <h4 className="font-semibold text-md sm:text-lg mb-4 text-gray-800 flex-shrink-0">
                  Danh sách bài học ({unassignedLessons.length} chưa được gán)
                </h4>
                <div
                  className="flex-1 space-y-3 overflow-y-auto min-h-0"
                  style={{ maxHeight: "calc(90vh - 200px)" }}
                  onWheel={(e) => e.stopPropagation()}
                >
                  {unassignedLessons.map((lesson, index) => (
                    <div
                      key={lesson.uniqueId}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lesson)}
                      className="flex flex-wrap items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-move bg-white shadow-sm hover:shadow-md flex-shrink-0"
                    >
                      <div className="flex-shrink-0 w-10 text-center">
                        <div className="bg-cs-blue text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            Chương {lesson.chapterIndex}: {lesson.chapterTitle}
                          </span>
                        </div>
                        <h4 className="font-semibold text-base text-gray-800 mb-1">
                          Bài {lesson.lessonIndex}: {lesson.lessonTitle}
                        </h4>
                        {lesson.lessonDescription && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {lesson.lessonDescription}
                          </p>
                        )}
                      </div>
                      <div className="flex-shrink-0 flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            window.open(
                              `/${locale}/manage/lessons/${lesson.lessonId}?course_id=${courseId}`,
                              "_blank"
                            )
                          }
                        >
                          Xem chi tiết
                        </Button>
                        <div className="text-xs text-gray-400 flex items-center">
                          🖱️ Kéo để gán
                        </div>
                      </div>
                    </div>
                  ))}
                  {unassignedLessons.length === 0 && (
                    <div className="text-center text-gray-400 py-8">
                      <p className="text-lg">
                        Tất cả bài học đã được gán vào tuần học
                      </p>
                      <p className="text-sm mt-2">
                        Bạn có thể kéo bài học từ các tuần về đây để thay đổi
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Footer - Fixed */}
            <div className="border-t bg-gray-50 px-6 py-4 flex-shrink-0">
              <div className="flex flex-col sm:flex-row gap-2 justify-between items-center text-sm text-gray-600">
                <span>
                  Tổng cộng: <strong>{allLessons.length} bài học</strong> trong{" "}
                  <strong>{chapters.length} chương</strong>
                </span>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  {unassignedLessons.length > 0 && (
                    <span className="text-amber-600 font-medium">
                      ⚠️ Còn {unassignedLessons.length} bài học chưa được gán
                    </span>
                  )}
                  <span>
                    Thời gian: <strong>{allWeeks.length} tuần</strong> trong{" "}
                    <strong>{localSemesters.length} học kỳ</strong>
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  ) : null;
}

export default ScheduleModal;
