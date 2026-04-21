"use client";

import { useState, useEffect, useRef } from "react";
import AssignmentsPageSimplified from "@/app/[locale]/assignments/components/assignments-page";
import {
  getWeeks,
  getExamsByWeek,
  type Week,
  type Course,
} from "@/lib/api/students";
import { getListCourse } from "@/lib/api/dashboard";
import { useRouter, useSearchParams } from "next/navigation";
import { sortByNumberAndAlphabetFromSecondGeneric } from "@/lib/utils";

export default function AssignmentsPageContainer() {
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<Week | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [courseOptions, setCourseOptions] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseChangeByUserRef = useRef(false);

  // Load weeks on component mount
  useEffect(() => {
    loadCourses();
  }, []);

  // Đọc courseId từ URL chỉ 1 lần lúc mount để tránh bị revert khi user đổi khóa
  const didInitCourseFromUrlRef = useRef(false);
  useEffect(() => {
    if (didInitCourseFromUrlRef.current) return;
    const courseIdParam = searchParams.get("courseId");
    if (courseIdParam && !selectedCourseId) {
      setSelectedCourseId(courseIdParam);
    }
    didInitCourseFromUrlRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Bỏ đồng bộ theo weeks để tránh set state trùng dẫn tới gọi API lặp

  // Load exams when selected week or course changes
  useEffect(() => {
    if (selectedWeek && selectedCourseId) {
      loadExamsByWeek(selectedWeek.id, selectedCourseId);
    }
  }, [selectedWeek, selectedCourseId]);

  // Load weeks when course changes (chỉ reset về tuần hiện tại nếu do user đổi khóa)
  useEffect(() => {
    if (selectedCourseId) {
      const shouldReset = courseChangeByUserRef.current === true;
      courseChangeByUserRef.current = false;
      loadWeeks(selectedCourseId, shouldReset);
    }
  }, [selectedCourseId]);

  const loadCourses = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getListCourse();
      const payload: any = response?.data ?? response;
      let list: Array<{ id: string; name: string }> = [];
      if (Array.isArray(payload)) list = payload;
      else if (Array.isArray(payload?.courses)) list = payload.courses;
      setCourseOptions(list);
      // Khởi tạo courseId lần đầu: nếu URL chưa có, set state; URL sẽ được đồng bộ trong loadWeeks
      if (list.length > 0) {
        const courseIdParam = searchParams.get("courseId");
        const initialCourseId =
          courseIdParam && courseIdParam !== ""
            ? courseIdParam
            : sortByNumberAndAlphabetFromSecondGeneric(list, i => i.name, true)[0].id.toString();

        if (initialCourseId !== selectedCourseId) {
          setSelectedCourseId(initialCourseId);
        }
      }
    } catch (err) {
      setError("Có lỗi xảy ra khi tải danh sách khóa học");
      console.error("Error loading course list:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadWeeks = async (
    courseId?: string | null,
    resetToCurrentWeek = false
  ) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getWeeks(courseId ?? undefined);

      if (response.code === 200) {
        setWeeks(response.data.weeks);
        if (response.data.weeks.length > 0) {
          const params = new URLSearchParams(window.location.search);
          const weekParam = params.get("week");
          const currentWeekObj = getCurrentWeek(response.data.weeks);
          let targetWeek: Week | null = null;

          if (resetToCurrentWeek || !weekParam) {
            targetWeek = currentWeekObj || response.data.weeks[0];
          } else {
            const targetNumber = parseInt(weekParam, 10);
            if (!Number.isNaN(targetNumber)) {
              targetWeek =
                response.data.weeks.find(
                  (w: any) =>
                    ((w as any).number ?? w.week_number) === targetNumber
                ) || null;
            }
            if (!targetWeek)
              targetWeek = currentWeekObj || response.data.weeks[0];
          }

          if (targetWeek) {
            setSelectedWeek(targetWeek);
            const weekNumber = String(
              (targetWeek as any).number ?? (targetWeek as any).week_number
            );
            params.set("week", weekNumber);
            const cid = courseId ?? selectedCourseId;
            if (cid) params.set("courseId", cid);
            router.replace(`?${params.toString()}`);
          }
        }
      } else {
        setError(response.error || "Không thể tải danh sách tuần học");
      }
    } catch (err) {
      setError("Có lỗi xảy ra khi tải dữ liệu");
      console.error("Error loading weeks:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadExamsByWeek = async (weekId: string, courseId?: string | null) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getExamsByWeek(
        weekId,
        50,
        1,
        undefined,
        undefined,
        courseId || undefined
      );

      if (response.code === 200) {
        const payload: any = response.data;
        let mappedCourses: any[] = [];
        if (Array.isArray(payload?.courses)) {
          mappedCourses = payload.courses.map((course: any) => ({
            ...course,
            lessons: (course.lessons || []).map((lesson: any) => ({
              ...lesson,
              exams: Array.isArray(lesson.exams) ? lesson.exams : [],
              homeworks: Array.isArray(lesson.homeworks)
                ? lesson.homeworks
                : [],
            })),
          }));
        } else if (Array.isArray(payload?.lessons)) {
          // API returns a single course object
          const singleCourse = {
            id: payload.id,
            name: payload.name,
            description: payload.description,
            status: payload.status,
            subject_name: payload.subject_name,
            type: payload.type,
            image: payload.image,
            level: payload.level,
            target: payload.target,
            lessons: (payload.lessons || []).map((lesson: any) => ({
              ...lesson,
              exams: Array.isArray(lesson.exams) ? lesson.exams : [],
              homeworks: Array.isArray(lesson.homeworks)
                ? lesson.homeworks
                : [],
            })),
          } as any;
          mappedCourses = [singleCourse];
        }
        setCourses(mappedCourses);
      } else {
        setError(response.error || "Không thể tải dữ liệu bài học");
      }
    } catch (err) {
      setError("Có lỗi xảy ra khi tải dữ liệu bài học");
      console.error("Error loading exams by week:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentWeek = (weeksList: Week[]): Week | null => {
    const now = new Date();
    const currentWeek = weeksList.find((week) => {
      const startDate = new Date(week.start_date);
      const endDate = new Date(week.end_date);
      endDate.setHours(23, 59, 59, 999); // Kết thúc vào cuối ngày
      return now >= startDate && now <= endDate;
    });
    return currentWeek || null;
  };

  const handleCourseFilterChange = (courseId: string) => {
    // Update selected course and reload weeks with course_id
    // Reset về tuần hiện tại khi chuyển đổi khóa học
    courseChangeByUserRef.current = true;
    setSelectedCourseId(courseId);
  };

  const handleWeekChange = (weekId: string) => {
    // Set state trực tiếp + cập nhật URL 1 lần
    const params = new URLSearchParams(window.location.search);
    const week = weeks.find((w) => w.id === weekId) || null;
    if (week) setSelectedWeek(week);
    const weekNumber = week
      ? String((week as any).number ?? (week as any).week_number)
      : weekId;
    params.set("week", weekNumber);
    if (selectedCourseId) params.set("courseId", selectedCourseId);
    router.replace(`?${params.toString()}`);
  };

  const handlePreviousWeek = () => {
    if (!selectedWeek) return;
    const currentIndex = weeks.findIndex((w) => w.id === selectedWeek.id);
    if (currentIndex > 0) {
      handleWeekChange(weeks[currentIndex - 1].id);
    }
  };

  const handleNextWeek = () => {
    if (!selectedWeek) return;
    const currentIndex = weeks.findIndex((w) => w.id === selectedWeek.id);
    if (currentIndex < weeks.length - 1) {
      handleWeekChange(weeks[currentIndex + 1].id);
    }
  };

  return (
    <AssignmentsPageSimplified
      weeks={weeks}
      selectedWeek={selectedWeek}
      courses={courses}
      selectedCourseId={selectedCourseId}
      courseOptions={sortByNumberAndAlphabetFromSecondGeneric(courseOptions, item => item.name, true)}
      isLoading={isLoading}
      error={error}
      onWeekChange={handleWeekChange}
      onPreviousWeek={handlePreviousWeek}
      onNextWeek={handleNextWeek}
      onCourseFilterChange={handleCourseFilterChange}
    />
  );
}
