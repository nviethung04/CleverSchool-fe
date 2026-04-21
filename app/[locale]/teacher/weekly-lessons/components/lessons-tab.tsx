"use client";

import { useEffect, useState, useCallback } from "react";
import { useTypedTranslations, useCurrentLocale } from "@/lib/i18n/client";
import { useTabQueryString } from "@/hooks/use-tab-query-string";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Eye,
  GraduationCap,
  FileText,
  BookOpenCheck,
  ClipboardList,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { GetLessonDetail } from "@/lib/api/lessons";
import { getListCourse } from "@/lib/api/dashboard";
import { getWeeks } from "@/lib/api/students";
import { GetScheduleByWeek } from "@/lib/api/courses";
import { sortByNumberAndAlphabetFromSecondGeneric } from "@/lib/utils";

// Helper function to group lessons by course and fetch lesson details
async function groupLessonsByCourse(schedules: any[], weekData?: any) {
  if (!schedules || schedules.length === 0) {
    return [];
  }

  const lessonsByCourse = schedules.reduce((acc: any, schedule: any) => {
    const courseId = schedule.course.id;
    if (!acc[courseId]) {
      acc[courseId] = {
        course: { ...schedule.course },
        lessons: [],
      };
    }
    acc[courseId].lessons.push({
      ...schedule.lesson,
      scheduled_date: schedule.scheduled_date,
      week_number: weekData?.number || schedule.week_number, // Sử dụng week.number nếu có
    });
    return acc;
  }, {});

  const result = await Promise.all(
    Object.values(lessonsByCourse).map(async (courseData: any) => {
      const detailedLessons = await Promise.all(
        courseData.lessons.map(async (lesson: any) => {
          try {
            const res = await GetLessonDetail(lesson.id, courseData.course.id);
            const lessonDetail = res.data || res;
            return {
              ...lesson,
              chapter: lessonDetail.chapter || {},
              lesson_plans: lessonDetail.lesson_plans || [],
              homeworks: lessonDetail.homeworks || [],
              exams: lessonDetail.exams || [],
              exercises: lessonDetail.exercises || [],
            };
          } catch (error) {
            console.error(
              `Error fetching lesson detail for ${lesson.id}:`,
              error
            );
            return {
              ...lesson,
              lesson_plans: [],
              homeworks: [],
              exams: [],
              exercises: [],
            };
          }
        })
      );
      return {
        ...courseData,
        lessons: detailedLessons,
      };
    })
  );
  return result;
}

const getDisplayWeekNumber = (weekNumber: number) => weekNumber;

export function LessonsTab() {
  const t = useTypedTranslations("lessonsTab");
  const currentLocale = useCurrentLocale();
  
  // Sử dụng hook với namespace "lessons"
  const { getValue, setParams } = useTabQueryString("lessons");

  // State management
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [weeks, setWeeks] = useState<any[]>([]);
  const [selectedWeekId, setSelectedWeekId] = useState<string>("");
  const [currentWeekLessons, setCurrentWeekLessons] = useState<any[]>([]);
  const [filteredWeekLessons, setFilteredWeekLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper function for locale-aware date formatting with weekday (for lesson cards)
  const formatDateWithWeekday = (
    date: Date,
    options?: Intl.DateTimeFormatOptions
  ) => {
    try {
      return new Intl.DateTimeFormat(currentLocale, {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        ...options,
      }).format(date);
    } catch {
      return date.toLocaleDateString();
    }
  };

  // Helper function to create consistent week display format
  const createWeekDisplay = (week: any) => {
    const startDate = `${new Date(week.start_date)
      .getDate()
      .toString()
      .padStart(2, "0")}/${(new Date(week.start_date).getMonth() + 1)
      .toString()
      .padStart(2, "0")}`;

    const endDate = `${new Date(week.end_date)
      .getDate()
      .toString()
      .padStart(2, "0")}/${(new Date(week.end_date).getMonth() + 1)
      .toString()
      .padStart(2, "0")}`;

    return t("weekFormat", {
      week: getDisplayWeekNumber(week.number), // Sử dụng week.number thay vì week.week_number
      startDate,
      endDate,
    });
  };

  // Fetch courses
  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await getListCourse();

      // Check different possible response structures
      let coursesData: any[] = [];
      if (
        response.data &&
        response.data.courses &&
        Array.isArray(response.data.courses)
      ) {
        coursesData = response.data.courses;
      } else if (response.data && Array.isArray(response.data)) {
        coursesData = response.data;
      } else if (Array.isArray(response)) {
        coursesData = response;
      }

      if (coursesData.length > 0) {
        setCourses(coursesData);

        // Ưu tiên đọc courseId từ URL với namespace "lessons", nếu không có thì dùng course đầu tiên
        const urlCourseId = getValue("courseId");
        const courseToSelect = urlCourseId
          ? coursesData.find((c: any) => c.id.toString() === urlCourseId)
          : null;

        const finalCourseId = courseToSelect
          ? courseToSelect.id.toString()
          : sortByNumberAndAlphabetFromSecondGeneric(coursesData, i => i.name, true)[0].id.toString();

        setSelectedCourseId(finalCourseId);

        // Update courseId vào URL với namespace nếu chưa có
        if (!urlCourseId) {
          setParams({ courseId: finalCourseId });
        }
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch weeks based on selected course
  const fetchWeeks = useCallback(async (courseId: string) => {
    try {
      setLoading(true);
      const response = await getWeeks(courseId);

      let weeksData: any[] = [];
      if (response.data && response.data.weeks) {
        weeksData = response.data.weeks;
      }

      if (weeksData.length > 0) {
        setWeeks(weeksData);

        let weekToSelect: any = null;

        // Kiểm tra xem có week nào trong URL không
        const weekParam = getValue("week");
        if (weekParam) {
          const weekFromUrl = weeksData.find(
            (w: any) => w.number.toString() === weekParam
          );
          if (weekFromUrl) {
            weekToSelect = weekFromUrl;
          }
        }

        // Nếu không có trong URL, tìm tuần hiện tại theo ngày hôm nay
        if (!weekToSelect) {
          const today = new Date();
          const actualCurrentWeek = weeksData.find((week: any) => {
            const weekStart = new Date(week.start_date);
            const weekEnd = new Date(week.end_date);
            return today >= weekStart && today <= weekEnd;
          });
          weekToSelect = actualCurrentWeek || weeksData[0];
        }

        if (weekToSelect) {
          setSelectedWeekId(weekToSelect.id);
          // Update URL với week number
          const currentWeekInUrl = getValue("week");
          const currentCourseInUrl = getValue("courseId");
          if (currentWeekInUrl !== weekToSelect.number.toString() || currentCourseInUrl !== courseId) {
            setParams({
              week: weekToSelect.number.toString(),
              courseId: courseId
            });
          }
        }
      }
    } catch (error) {
      console.error("Error fetching weeks:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch schedule based on course and week
  const fetchSchedule = async (courseId: string, weekId: string) => {
    try {
      setLoading(true);
      const response = await GetScheduleByWeek(courseId, weekId);

      // Support both shapes:
      // 1) { data: { weeks: [{ schedules: [...] }] } }
      // 2) { data: { schedules: [...], week_number, ... } }
      const payload = response?.data;
      let weekData: any = null;
      if (
        payload?.weeks &&
        Array.isArray(payload.weeks) &&
        payload.weeks.length > 0
      ) {
        weekData = payload.weeks[0];
      } else if (payload?.schedules) {
        weekData = payload; // already the week object with schedules
      }

      if (weekData?.schedules && Array.isArray(weekData.schedules)) {
        const selectedWeek = weeks.find((week) => week.id === weekId);
        const groupedLessons = await groupLessonsByCourse(
          weekData.schedules,
          selectedWeek
        );
        setCurrentWeekLessons(groupedLessons);
      } else {
        setCurrentWeekLessons([]);
      }
    } catch (error) {
      console.error("Error fetching schedule:", error);
      setCurrentWeekLessons([]);
    } finally {
      setLoading(false);
    }
  };

  // Function to update URL with week parameter với namespace
  const updateWeekInURL = useCallback(
    (weekId: string) => {
      // Find week by id to get the number
      const week = weeks.find((w) => w.id === weekId);
      const weekNumber = week?.number || weekId;
      // Giữ lại courseId khi update week
      setParams({
        week: weekNumber.toString(),
        courseId: selectedCourseId || undefined
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [weeks, selectedCourseId]
  );

  // Initialize data on component mount - chỉ chạy một lần
  useEffect(() => {
    fetchCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch weeks when course changes
  useEffect(() => {
    if (selectedCourseId) {
      fetchWeeks(selectedCourseId);
    }
  }, [selectedCourseId]);

  // Update courseId vào URL khi course thay đổi (tách riêng để tránh loop)
  useEffect(() => {
    if (selectedCourseId && courses.length > 0) {
      const currentUrlCourseId = getValue("courseId");
      if (currentUrlCourseId !== selectedCourseId) {
        setParams({ courseId: selectedCourseId });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourseId, courses.length]);

  // Fetch schedule when both course and week are selected
  // Lưu ý: Không update URL ở đây vì onChange handlers đã handle rồi
  useEffect(() => {
    if (selectedCourseId && selectedWeekId && weeks.length > 0) {
      fetchSchedule(selectedCourseId, selectedWeekId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourseId, selectedWeekId]);

  useEffect(() => {
    const savedCourseId = localStorage.getItem("LESSON_COURSE_ID");
    const savedWeekNumber = localStorage.getItem("LESSON_WEEK_NUMBER");

    // Chỉ restore khi đã load xong danh sách weeks & courses
    if (savedCourseId && savedWeekNumber && weeks.length > 0) {
      // Set lại course
      setSelectedCourseId(savedCourseId);

      // Tìm week theo number
      const matchedWeek = weeks.find(
        (week) => week.number.toString() === savedWeekNumber
      );

      if (matchedWeek) {
        setSelectedWeekId(matchedWeek.id);
        updateWeekInURL(matchedWeek.id); // bonus: update lên URL
      }

      // cleanup để không ảnh hưởng lần sau
      localStorage.removeItem("LESSON_COURSE_ID");
      localStorage.removeItem("LESSON_WEEK_NUMBER");
    }
  }, [weeks, courses]);

  // Filter lessons by selected course (no longer needed since we filter at API level)
  useEffect(() => {
    setFilteredWeekLessons(currentWeekLessons);
  }, [currentWeekLessons]);

  return (
    <div>
      {/* Header with Week Selector */}
      <div className="flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t("title")}
          </h1>
          <p className="text-gray-600">{t("subtitle")}</p>
        </div>

        <div className="flex flex-col md:flex-row md:items-end gap-4 w-auto max-w-fit">
          {/* Course Filter Dropdown */}
          <div className="flex flex-col gap-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">
                  {t("filters.course")}:
                </span>
                <Select
                  value={selectedCourseId}
                  onValueChange={(value) => {
                    setSelectedCourseId(value);
                    setParams({ courseId: value });
                  }}
                >
                  <SelectTrigger className="w-48 rounded-xl border-gray-200 focus:border-emerald-300 focus:ring-emerald-200 text-sm">
                    <SelectValue
                      placeholder={
                        loading ? t("loading") : t("filters.selectCourse")
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-gray-200">
                    {sortByNumberAndAlphabetFromSecondGeneric(courses, item => item.name, true).map((course: any) => (
                      <SelectItem
                        key={course.id}
                        value={course.id.toString()}
                        className="rounded-xl text-sm"
                      >
                        {course.name} ({course.object_title})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Week Controls */}
          <div className="flex flex-col gap-2">
            {/* Back to Current Week Button */}
            {(() => {
              // Find current week (today's date)
              const today = new Date();
              const actualCurrentWeek = weeks.find((week: any) => {
                const weekStart = new Date(week.start_date);
                const weekEnd = new Date(week.end_date);
                return today >= weekStart && today <= weekEnd;
              });

              if (!actualCurrentWeek) return null;

              // Only show button if currently selected week is different from actual current week
              if (selectedWeekId && actualCurrentWeek.id !== selectedWeekId) {
                return (
                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-xs font-medium border-blue-400 text-blue-700 hover:bg-blue-50 transition-all duration-200"
                      onClick={() => {
                        setSelectedWeekId(actualCurrentWeek.id);
                        updateWeekInURL(actualCurrentWeek.id);
                      }}
                      disabled={loading}
                    >
                      <Calendar className="h-3 w-3 mr-1" />
                      {t("actions.backToCurrentWeek")}
                    </Button>
                  </div>
                );
              }
              return null;
            })()}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-gray-200 hover:border-gray-300 p-2"
                  onClick={() => {
                    const currentIndex = weeks.findIndex(
                      (week: any) => week.id === selectedWeekId
                    );
                    if (currentIndex > 0) {
                      const prevWeekId = weeks[currentIndex - 1].id;
                      setSelectedWeekId(prevWeekId);
                      updateWeekInURL(prevWeekId);
                    }
                  }}
                  disabled={loading || weeks.length === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <Select
                  value={selectedWeekId}
                  onValueChange={(value) => {
                    setSelectedWeekId(value);
                    updateWeekInURL(value);
                  }}
                >
                  <SelectTrigger className="w-64 rounded-xl border-gray-200 focus:border-emerald-300 focus:ring-emerald-200 text-sm">
                    <SelectValue
                      placeholder={
                        loading ? t("loading") : t("filters.selectWeek")
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-gray-200">
                    {weeks.map((week: any) => {
                      const weekDisplay = createWeekDisplay(week);
                      return (
                        <SelectItem
                          key={week.id}
                          value={week.id}
                          className="rounded-xl text-sm"
                        >
                          {weekDisplay}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-gray-200 hover:border-gray-300 p-2"
                  onClick={() => {
                    const currentIndex = weeks.findIndex(
                      (week: any) => week.id === selectedWeekId
                    );
                    if (currentIndex < weeks.length - 1) {
                      const nextWeekId = weeks[currentIndex + 1].id;
                      setSelectedWeekId(nextWeekId);
                      updateWeekInURL(nextWeekId);
                    }
                  }}
                  disabled={loading || weeks.length === 0}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="">
        {loading ? (
          <div className="text-center py-12 text-gray-500">
            <div className="animate-pulse">{t("loading")}</div>
          </div>
        ) : filteredWeekLessons.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {t("emptyState.noLessons")}
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              {t("emptyState.noLessonsForSelectedCourse")}
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {filteredWeekLessons.map((courseData: any) => (
              <div
                key={courseData.course.id}
                className="bg-gray-50 rounded-2xl p-6 border border-gray-100"
              >
                <div className="flex items-center gap-3 mb-4">
                  {(() => {
                    const match = /^(.*?)(\s*\(([^)]+)\))?$/.exec(
                      courseData.course.name || ""
                    );
                    const mainName = match
                      ? match[1].trim()
                      : courseData.course.name;
                    const badge = courseData.course.object_title;
                    return (
                      <>
                        <Badge
                          variant="secondary"
                          className="bg-blue-100 text-blue-700 hover:bg-blue-200 text-base font-semibold px-4 py-2 rounded-xl"
                        >
                          {mainName}
                        </Badge>
                        {badge && (
                          <Badge
                            variant="secondary"
                            className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-base font-semibold px-4 py-2 rounded-xl ml-2"
                          >
                            {badge}
                          </Badge>
                        )}
                      </>
                    );
                  })()}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courseData.lessons.map((lesson: any) => (
                    <Card
                      key={lesson.id}
                      className="bg-white rounded-3xl border border-gray-200 hover:border-emerald-300 hover:shadow-xl transition-all duration-300 group overflow-hidden flex flex-col h-full"
                    >
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center group-hover:bg-emerald-200 transition-colors flex-shrink-0">
                              <FileText className="h-6 w-6 text-emerald-600" />
                            </div>
                            {(() => {
                              const match = /^(.*?)(\s*\(([^)]+)\))?$/.exec(
                                lesson.title || ""
                              );
                              const mainTitle = match
                                ? match[1].trim()
                                : lesson.title;
                              const badge = match && match[3] ? match[3] : null;
                              return (
                                <>
                                  <CardTitle className="text-xl font-bold text-gray-900 line-clamp-2 leading-tight mb-0">
                                    {mainTitle}
                                  </CardTitle>
                                </>
                              );
                            })()}
                          </div>
                          <div className="flex flex-col gap-2 items-end">
                            <Badge
                              variant="outline"
                              className="bg-gray-50 text-gray-600 hover:bg-gray-100 text-xs"
                            >
                              {t("weekBadge", {
                                week: getDisplayWeekNumber(lesson.week_number), // week_number đã được set từ week.number trong groupLessonsByCourse
                              })}
                            </Badge>
                          </div>
                        </div>
                        {lesson.chapter?.title && (
                          <div className="text-xs text-amber-600 font-semibold mb-2">
                            {t("chapter")}: {lesson.chapter.title}
                          </div>
                        )}
                        {lesson.description && (
                          <CardDescription className="text-sm text-gray-600 mb-4 line-clamp-2 whitespace-pre-line">
                            {lesson.description}
                          </CardDescription>
                        )}

                        <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-2xl p-3 mb-4">
                          <Calendar className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                          <span className="font-medium">
                            {formatDateWithWeekday(
                              new Date(lesson.scheduled_date)
                            )}
                          </span>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-0 pb-4 space-y-4 flex-1">
                        <div className="space-y-3">
                          {lesson.lesson_plans?.length > 0 && (
                            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-2xl border border-orange-100">
                              <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <BookOpenCheck className="h-4 w-4 text-orange-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-orange-700">
                                  {t("lessonPlan.title")}
                                </div>
                                <div className="text-xs text-orange-600 flex justify-between">
                                  <span className="truncate">
                                    {lesson.lesson_plans[0].name}
                                  </span>
                                  <span>
                                    {lesson.lesson_plans[0]?.is_complete
                                      ? t("lessonPlan.completed")
                                      : t("lessonPlan.notCompleted")}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {lesson.homeworks?.length > 0 && (
                            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-2xl border border-green-100">
                              <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <ClipboardList className="h-4 w-4 text-green-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-green-700">
                                  {t("homework.title", {
                                    count: lesson.homeworks.length,
                                  })}
                                </div>
                                <div className="text-xs text-green-600 truncate">
                                  {(() => {
                                    const assignedCount =
                                      lesson.homeworks.filter(
                                        (hw: any) => hw.is_assigned
                                      ).length;
                                    const totalCount = lesson.homeworks.length;
                                    return t("homework.assignedCount", {
                                      assigned: assignedCount,
                                      total: totalCount,
                                    });
                                  })()}
                                </div>
                              </div>
                            </div>
                          )}

                          {lesson.exercises?.length > 0 && (
                            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-2xl border border-purple-100">
                              <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <FileText className="h-4 w-4 text-purple-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-purple-700">
                                  {t("exercise.title", {
                                    count: lesson.exercises.length,
                                  })}
                                </div>
                                <div className="text-xs text-purple-600 truncate">
                                  {(() => {
                                    const assignedCount =
                                      lesson.exercises.filter(
                                        (exercise: any) => exercise.is_assigned
                                      ).length;
                                    const totalCount = lesson.exercises.length;
                                    return t("exercise.assignedCount", {
                                      assigned: assignedCount,
                                      total: totalCount,
                                    });
                                  })()}
                                </div>
                              </div>
                            </div>
                          )}

                          {lesson.exams?.length > 0 && (
                            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-2xl border border-blue-100">
                              <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <FileText className="h-4 w-4 text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-blue-700">
                                  {t("exam.title", {
                                    count: lesson.exams.length,
                                  })}
                                </div>
                                <div className="text-xs text-blue-600 truncate">
                                  {(() => {
                                    const assignedCount = lesson.exams.filter(
                                      (exam: any) => exam.is_assigned
                                    ).length;
                                    const totalCount = lesson.exams.length;
                                    return t("exam.assignedCount", {
                                      assigned: assignedCount,
                                      total: totalCount,
                                    });
                                  })()}
                                </div>
                              </div>
                            </div>
                          )}

                          {!lesson.lesson_plans?.length &&
                            !lesson.homeworks?.length &&
                            !lesson.exams?.length &&
                            !lesson.exercises?.length && (
                              <div className="text-center py-4 text-gray-400 text-sm">
                                {t("emptyContent")}
                              </div>
                            )}
                        </div>
                      </CardContent>

                      <CardFooter className="pt-0 pb-6 px-6 mt-auto">
                        <div className="flex gap-3 w-full">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 rounded-2xl border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-200"
                            onClick={() => {
                              localStorage.setItem(
                                "LESSON_COURSE_ID",
                                courseData.course.id
                              );
                              localStorage.setItem(
                                "LESSON_WEEK_NUMBER",
                                lesson.week_number
                              );
                              window.open(
                                `/${currentLocale}/teacher/lessons/${lesson.id}?from=weekly-lessons&course_id=${courseData.course.id}`,
                                "_blank"
                              )
                            }}
                          >
                            <Eye className="[@media(max-width:400px)]:hidden h-4 w-4 mr-2" />
                            {t("actions.details")}
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl transition-all duration-200"
                            onClick={() => {
                              localStorage.setItem(
                                "LESSON_COURSE_ID",
                                courseData.course.id
                              );
                              localStorage.setItem(
                                "LESSON_WEEK_NUMBER",
                                lesson.week_number
                              );
                              const lectureId = lesson.lesson_plans?.[0]?.id;
                              if (lectureId) {
                                if (typeof window !== "undefined") {
                                  sessionStorage.setItem(
                                    `lessonData_${lectureId}`,
                                    JSON.stringify(lesson)
                                  );
                                }
                                // Pass lesson_id as query parameter
                                const previewUrl = `/${currentLocale}/manage/lecture-bank/preview/${lectureId}?lesson_id=${lesson.id}&course_id=${courseData.course.id}`;
                                window.open(
                                  previewUrl,
                                  "_blank"
                                )
                              } else {
                                alert(t("errors.noLectureFound"));
                              }
                            }}
                            disabled={!lesson.lesson_plans?.length}
                          >
                            <GraduationCap className="[@media(max-width:400px)]:hidden h-4 w-4 mr-2" />
                            {t("actions.teach")}
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
