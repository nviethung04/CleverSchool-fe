"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type React from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth } from "@/lib/context/auth-context";
import { useTypedTranslations } from "@/lib/i18n/client";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Play,
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  BookOpen,
  FileText,
  Headphones,
  Eye,
  Info,
  Clock,
  AlertTriangle,
  Download,
  ExternalLink,
  PenTool,
  Users,
  CheckCircle,
  Loader2,
  RotateCcw,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { getLectureRoute, getEditLectureRoute } from "@/lib/utils/route-utils";
import { GetLessonDetail } from "@/lib/api/lessons";
import { UpdateHomework, AssignHomework } from "@/lib/api/homeworks";
import { UpdateExam, AssignExam } from "@/lib/api/exams";
import { GetCourseDetail } from "@/lib/api/courses";
import EyeTrackingWidget from "@/components/eye-tracking-widget";
import { useEyeTracking } from "@/lib/context/eye-tracking-context";
import { postH5PContentScore } from "@/lib/api/h5p";
import { useSetting } from "@/hooks/use-setting";
import { useTranslations } from "next-intl";

interface LessonPlanPart {
  id: number;
  title: string;
  file_type: string;
  link_type?: string;
  link?: string;
  file?: string;
  time: number;
  guide_teacher?: string;
  guide_student?: string;
  tag?: string;
  cover_image?: string;
  sort_position?: number;
}

interface LessonPlan {
  id: number;
  name: string;
  description?: string;
  cover_image?: string;
  total_time?: number;
  status: number;
  lesson_id?: string | number;
}

interface PreviewLectureProps {
  lessonPlanId: string;
  lessonId?: string;
  courseId?: string | number;
  lessonPlan: LessonPlan | null;
  lessonParts: LessonPlanPart[];
  loading: boolean;
  error: string | null;
  onAssignHomework?: (
    homeworkId: string,
    homeworkTitle: string
  ) => Promise<void>;
  onAssignExam?: (examId: string, examTitle: string) => Promise<void>;
  loadingAssignments?: boolean;
  onCompleteLesson?: () => Promise<void>;
  isCompleting?: boolean;
  isCompleted?: boolean;
}

export default function PreviewLecture({
  lessonPlanId,
  lessonId,
  courseId,
  lessonPlan,
  lessonParts,
  loading,
  error,
  onAssignHomework,
  onAssignExam,
  loadingAssignments = false,
  onCompleteLesson,
  isCompleting = false,
  isCompleted = false,
}: PreviewLectureProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user, token } = useAuth();
  const {
    registerContentController,
    unregisterContentController,
    setActiveContentType: setContextActiveContentType,
    isWarning,
  } = useEyeTracking();
  const { isEnabled: isFocusDetectionEnabled } = useSetting("focus_detection");
  const t = useTypedTranslations("previewLecture");
  const tCommon = useTranslations("common");

  // Handle back navigation
  const handleBackNavigation = useCallback(() => {
    // Check if there's a referrer (previous page)
    if (
      typeof window !== "undefined" &&
      document.referrer &&
      document.referrer !== window.location.href
    ) {
      // Try to go back to previous page
      router.back();
    } else {
      // Fallback navigation based on user type
      const locale = window.location.pathname.split("/")[1] || "vi";

      switch (user?.type) {
        case "student":
          router.push(`/${locale}/assignments`);
          break;
        case "teacher":
          router.push(`/${locale}/teacher/weekly-lessons`);
          break;
        case "admin":
          router.push(`/${locale}/admin/dashboard`);
          break;
        default:
          // Default fallback
          router.push(`/${locale}/dashboard`);
      }
    }
  }, [router, user?.type]);

  // Sort lesson parts by sort_position
  const sortedLessonParts = useMemo(() => {
    if (!lessonParts || lessonParts.length === 0) return [];
    return [...lessonParts].sort((a, b) => {
      const positionA = a.sort_position ?? 999999;
      const positionB = b.sort_position ?? 999999;
      return positionA - positionB;
    });
  }, [lessonParts]);

  const [currentSection, setCurrentSection] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  // Timer state
  const [elapsedTimes, setElapsedTimes] = useState<number[]>([]);
  const [isTimerActive, setIsTimerActive] = useState(false); // TEMPORARILY DISABLED FOR TESTING
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [isContentFullscreen, setIsContentFullscreen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const pdfRef = useRef<HTMLIFrameElement>(null);
  const presentationRef = useRef<HTMLIFrameElement>(null);
  const youtubeRef = useRef<HTMLIFrameElement>(null);
  const htmlRef = useRef<HTMLIFrameElement>(null);

  const [activeContentType, setActiveContentType] = useState<string>("unknown");
  const [showFullscreenControls, setShowFullscreenControls] = useState(false);
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  // Content control refs
  const h5pInstanceRef = useRef<any>(null);
  const h5pContentIdRef = useRef<string | null>(null);
  const h5pElementRef = useRef<{
    routeId: string;
    element: React.ReactElement;
  } | null>(null);

  // H5P Player (client-side only)
  const H5PPlayerUI = dynamic(
    () =>
      import("@lumieducation/h5p-react").then((mod) => ({
        default: mod.H5PPlayerUI,
      })),
    {
      ssr: false,
      loading: () => <div>Loading H5P Player...</div>,
    }
  );

  // Memoized H5P element to avoid re-initialization on state changes
  // (declared later after callbacks are defined)
  let getH5PElement: (routeId: string) => React.ReactElement;

  const loadContentCallback = useCallback(
    async (contentId: string) => {
      try {
        const url = `/h5p/${contentId}/play`;

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(url, {
          method: "GET",
          headers,
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const playerModel = await response.json();
        return playerModel;
      } catch (error) {
        console.error("Failed to load H5P content:", error);
        throw error;
      }
    },
    [token]
  );

  const handleInitialized = useCallback((contentId: string) => {
    console.log(`H5P content ${contentId} đã khởi tạo thành công`);
    h5pContentIdRef.current = contentId;

    // Tìm H5P instance trong window object
    const findH5PInstance = () => {
      if (typeof window !== "undefined" && (window as any).H5P) {
        const instances = (window as any).H5P.instances;
        if (instances && instances.length > 0) {
          h5pInstanceRef.current = instances[0];
          console.log("H5P instance found:", h5pInstanceRef.current);
        }
      }
    };

    // Thử tìm instance ngay lập tức và sau đó với delay
    findH5PInstance();
    setTimeout(findH5PInstance, 1000);
    setTimeout(findH5PInstance, 3000);
  }, []);

  const parseISODurationToSeconds = (duration: string): number => {
    // duration ví dụ: "PT6.46S", "PT2M30S", "PT1H5M10S"
    const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?/;
    const match = regex.exec(duration);

    if (!match) return 0;

    const hours = parseFloat(match[1] || "0");
    const minutes = parseFloat(match[2] || "0");
    const seconds = parseFloat(match[3] || "0");

    return hours * 3600 + minutes * 60 + seconds;
  };

  const handlexAPIStatement = async (statement: any) => {
    console.log("xAPI Statement:", statement);

    if (statement?.verb?.id === "http://adlnet.gov/expapi/verbs/completed") {
      const score = statement?.result?.score?.raw ?? 0;
      const maxScore = statement?.result?.score?.max ?? 0;

      // thời gian hoàn thành (unix 10 số = seconds, integer)
      const finished = Math.floor(Date.now() / 1000);

      // duration tính bằng giây từ ISO 8601
      const durationIso = statement?.result?.duration ?? "PT0S";
      const durationSeconds = parseISODurationToSeconds(durationIso);

      // opened = finished - duration (ép int)
      const opened = Math.floor(finished - durationSeconds);

      try {
        await postH5PContentScore({
          contentId: statement?.object?.id ?? "",
          score: String(score),
          maxScore: String(maxScore),
          opened: String(opened), // unix timestamp (seconds, int)
          finished: String(finished), // unix timestamp (seconds, int)
        });
      } catch (err) {
        console.error("Lỗi khi gửi content-score:", err);
      }
    }
  };

  // Now define getH5PElement after callbacks exist (create once per routeId)
  getH5PElement = useCallback(
    (routeId: string) => {
      if (
        h5pElementRef.current?.routeId === routeId &&
        h5pElementRef.current.element
      ) {
        return h5pElementRef.current.element;
      }
      const element = (
        <H5PPlayerUI
          key={routeId}
          contentId={routeId || ""}
          loadContentCallback={loadContentCallback}
          onInitialized={handleInitialized}
          onxAPIStatement={handlexAPIStatement}
        />
      );
      h5pElementRef.current = { routeId, element };
      return element;
    },
    [H5PPlayerUI, loadContentCallback, handleInitialized, handlexAPIStatement]
  );

  // Video control functions
  const pauseVideo = useCallback(() => {
    if (videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause();
    }
  }, []);

  const resumeVideo = useCallback(() => {
    if (videoRef.current && videoRef.current.paused) {
      videoRef.current.play().catch(console.error);
    }
  }, []);

  // H5P control functions
  const pauseH5P = useCallback(() => {
    try {
      // Cách 1: Sử dụng API của instance
      if (h5pInstanceRef.current && h5pInstanceRef.current.pause) {
        h5pInstanceRef.current.pause();
        return;
      }
      // Cách 2: Tìm video trong iframe của H5P (Interactive Video)
      const h5pIframe = document.querySelector(
        'iframe.h5p-iframe, iframe[id^="h5p-iframe-"]'
      ) as HTMLIFrameElement | null;
      const innerDoc =
        h5pIframe?.contentDocument ||
        h5pIframe?.contentWindow?.document ||
        null;
      const innerVideo = innerDoc?.querySelector(
        "video"
      ) as HTMLVideoElement | null;
      if (innerVideo && !innerVideo.paused) {
        innerVideo.pause();
        return;
      }
      // Cách 3: Thử lấy instance trực tiếp từ window.H5P nếu ref chưa có
      try {
        const winAny = window as any;
        const inst = winAny?.H5P?.instances?.[0];
        if (inst?.pause) {
          inst.pause();
          h5pInstanceRef.current = inst;
          return;
        }
      } catch {}
    } catch (error) {
      console.error("Error pausing H5P:", error);
    }
  }, []);

  const resumeH5P = useCallback(() => {
    try {
      // Cách 1: Sử dụng API của instance
      if (h5pInstanceRef.current && h5pInstanceRef.current.play) {
        h5pInstanceRef.current.play();
        return;
      }
      // Cách 2: Tìm video trong iframe của H5P (Interactive Video)
      const h5pIframe = document.querySelector(
        'iframe.h5p-iframe, iframe[id^="h5p-iframe-"]'
      ) as HTMLIFrameElement | null;
      const innerDoc =
        h5pIframe?.contentDocument ||
        h5pIframe?.contentWindow?.document ||
        null;
      const innerVideo = innerDoc?.querySelector(
        "video"
      ) as HTMLVideoElement | null;
      if (innerVideo && innerVideo.paused) {
        innerVideo.play().catch(() => undefined);
        return;
      }
      // Cách 3: Thử lấy instance trực tiếp từ window.H5P nếu ref chưa có
      try {
        const winAny = window as any;
        const inst = winAny?.H5P?.instances?.[0];
        if (inst?.play) {
          inst.play();
          h5pInstanceRef.current = inst;
          return;
        }
      } catch {}
    } catch (error) {
      console.error("Error resuming H5P:", error);
    }
  }, []);

  // YouTube control functions via Iframe API (postMessage)
  const getYoutubeApiUrl = useCallback((embedUrl: string) => {
    if (!embedUrl) return "";
    const url = new URL(convertYoutubeUrl(embedUrl));
    // ensure enablejsapi and origin are present
    url.searchParams.set("enablejsapi", "1");
    try {
      const origin = window.location.origin;
      url.searchParams.set("origin", origin);
    } catch {}
    return url.toString();
  }, []);

  const postToYoutube = useCallback((command: string) => {
    const frame = youtubeRef.current;
    if (!frame || !frame.contentWindow) return;
    try {
      frame.contentWindow.postMessage(
        JSON.stringify({ event: "command", func: command, args: [] }),
        "*"
      );
    } catch (e) {
      console.error("Error posting message to YouTube iframe", e);
    }
  }, []);

  const pauseYoutube = useCallback(() => {
    postToYoutube("pauseVideo");
  }, [postToYoutube]);

  const resumeYoutube = useCallback(() => {
    postToYoutube("playVideo");
  }, [postToYoutube]);

  // Assignment-related state
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  // State for lesson data from API
  const [lessonDataFromAPI, setLessonDataFromAPI] = useState<any>(null);
  const [loadingLessonData, setLoadingLessonData] = useState(false);
  const [resolvedLessonId, setResolvedLessonId] = useState<string | null>(null);
  const [effectiveCourseId, setEffectiveCourseId] = useState<number | undefined>(
    courseId ? Number(courseId) : undefined
  );
  const [canShowAssignmentButton, setCanShowAssignmentButton] = useState(false);
  // State for assigning loading (declare only once!)
  const [assigningIds, setAssigningIds] = useState<Set<string>>(new Set());
  // State for course detail
  const [courseDetail, setCourseDetail] = useState<any>(null);
  const [loadingCourseDetail, setLoadingCourseDetail] = useState(false);
  const [bookUrl, setBookUrl] = useState<string | null>(null);

  // Handler for assigning homework
  const handleAssignHomework = async (
    homeworkId: string,
    homeworkTitle: string
  ) => {
    setAssigningIds((prev) => new Set(prev).add(`homework_${homeworkId}`));
    try {
      const lessonId = resolveLessonId(); // ✅ Dùng hàm resolveLessonId thay vì lesson?.id
      if (!lessonId) {
        throw new Error("Lesson ID is not available");
      }

      if (!effectiveCourseId) {
        throw new Error("course_id is required");
      }

      await AssignHomework(homeworkId, Number(lessonId), {
        is_assigned: true,
        course_id: effectiveCourseId,
      });

      toast({
        title: tCommon("success"),
        description: t("successAssignHomeWork", { title: homeworkTitle }),
      });
      patchAssignmentStatus("homework", homeworkId, true);
      await fetchLessonDataFromAPI();
    } catch (err) {
      toast({
        title: tCommon("error"),
        description: t("errorAssignHomeWork"),
        variant: "destructive",
      });
    } finally {
      setAssigningIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(`homework_${homeworkId}`);
        return newSet;
      });
    }
  };

  // Handler for unassigning homework
  const handleUnassignHomework = async (
    homeworkId: string,
    homeworkTitle: string
  ) => {
    setAssigningIds((prev) => new Set(prev).add(`homework_${homeworkId}`));
    try {
      const lessonId = resolveLessonId(); // ✅ Dùng hàm resolveLessonId thay vì lesson?.id
      if (!lessonId) {
        throw new Error("Lesson ID is not available");
      }

      if (!effectiveCourseId) {
        throw new Error("course_id is required");
      }

      await AssignHomework(homeworkId, Number(lessonId), {
        is_assigned: false,
        course_id: effectiveCourseId,
      });

      toast({
        title: tCommon("success"),
        description: t("successUndoAssignHomeWork", { title: homeworkTitle }),
      });
      patchAssignmentStatus("homework", homeworkId, false);
      await fetchLessonDataFromAPI();
    } catch (err) {
      toast({
        title: tCommon("error"),
        description: t("errorUndoAssignHomeWork"),
        variant: "destructive",
      });
    } finally {
      setAssigningIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(`homework_${homeworkId}`);
        return newSet;
      });
    }
  };

  // Handler for assigning exam
  const handleAssignExam = async (examId: string, examTitle: string) => {
    setAssigningIds((prev) => new Set(prev).add(`exam_${examId}`));
    try {
      const lessonId = resolveLessonId();
      if (!lessonId) {
        throw new Error("Lesson ID is not available");
      }

      if (!effectiveCourseId) {
        throw new Error("course_id is required");
      }

      await AssignExam(examId, Number(lessonId), {
        is_assigned: true,
        course_id: effectiveCourseId,
      });

      toast({
        title: tCommon("success"),
        description: t("successAssignExam", { title: examTitle }),
      });
      patchAssignmentStatus("exam", examId, true);
      await fetchLessonDataFromAPI();
    } catch (err) {
      toast({
        title: tCommon("error"),
        description: t("errorAssignExam"),
        variant: "destructive",
      });
    } finally {
      setAssigningIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(`exam_${examId}`);
        return newSet;
      });
    }
  };

  // Handler for unassigning exam
  const handleUnassignExam = async (examId: string, examTitle: string) => {
    setAssigningIds((prev) => new Set(prev).add(`exam_${examId}`));
    try {
      const lessonId = resolveLessonId();
      if (!lessonId) {
        throw new Error("Lesson ID is not available");
      }

      if (!effectiveCourseId) {
        throw new Error("course_id is required");
      }

      await AssignExam(examId, Number(lessonId), {
        is_assigned: false,
        course_id: effectiveCourseId,
      });

      toast({
        title: tCommon("success"),
        description: t("successUndoAssignExam", { title: examTitle }),
      });
      patchAssignmentStatus("exam", examId, false);
      await fetchLessonDataFromAPI();
    } catch (err) {
      toast({
        title: tCommon("error"),
        description: t("errorUndoAssignExam"),
        variant: "destructive",
      });
    } finally {
      setAssigningIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(`exam_${examId}`);
        return newSet;
      });
    }
  };

  // Resolve lessonId from available sources
  const resolveLessonId = () => {
    console.log("resolveLessonId called with:", { lessonId, lessonPlan });

    // 1. Use lessonId if provided directly (from query parameter)
    if (lessonId) {
      console.log("Using lessonId from query param:", lessonId);
      return lessonId;
    }

    // 2. Try to get from lessonPlan data
    if (lessonPlan?.lesson_id) {
      console.log("Using lessonPlan.lesson_id:", lessonPlan.lesson_id);
      return lessonPlan.lesson_id.toString();
    }

    console.log("No lessonId found");
    return null;
  };

  // Check if we can show assignment button
  const checkCanShowAssignmentButton = () => {
    const resolvedId = resolveLessonId();
    setResolvedLessonId(resolvedId);
    // Chỉ hiển thị nút cho admin và teacher, và phải có lessonId
    const canShow =
      (user?.type === "admin" || user?.type === "teacher") && !!resolvedId;
    setCanShowAssignmentButton(canShow);
  };

  // Update when dependencies change
  useEffect(() => {
    checkCanShowAssignmentButton();
  }, [lessonId, lessonPlan, user]);

  useEffect(() => {
    if (courseId) {
      const parsed = Number(courseId);
      setEffectiveCourseId(parsed);
      if (resolvedLessonId && typeof window !== "undefined") {
        sessionStorage.setItem(
          `lesson_course_${resolvedLessonId}`,
          String(parsed)
        );
      }
      return;
    }

    if (resolvedLessonId && typeof window !== "undefined") {
      const stored = sessionStorage.getItem(`lesson_course_${resolvedLessonId}`);
      if (stored) {
        setEffectiveCourseId(Number(stored));
      }
    }
  }, [courseId, resolvedLessonId]);

  // Fetch course detail to get book_url
  useEffect(() => {
    const fetchCourseDetail = async () => {
      if (!courseId) {
        setBookUrl(null);
        return;
      }

      setLoadingCourseDetail(true);
      try {
        const response = await GetCourseDetail(courseId.toString());
        const courseData = response.data || response;
        setCourseDetail(courseData);
        setBookUrl(courseData.program.book_url || null);
      } catch (error) {
        console.error("Error fetching course detail:", error);
        setCourseDetail(null);
        setBookUrl(null);
      } finally {
        setLoadingCourseDetail(false);
      }
    };

    fetchCourseDetail();
  }, [courseId]);

  // Register content controllers
  useEffect(() => {
    // Register video controller
    registerContentController("video", {
      pause: pauseVideo,
      resume: resumeVideo,
    });

    // Register H5P controller
    registerContentController("h5p", {
      pause: pauseH5P,
      resume: resumeH5P,
    });

    // Register YouTube controller
    registerContentController("youtube", {
      pause: pauseYoutube,
      resume: resumeYoutube,
    });

    // Cleanup on unmount
    return () => {
      unregisterContentController("video");
      unregisterContentController("h5p");
      unregisterContentController("youtube");
    };
  }, [
    registerContentController,
    unregisterContentController,
    pauseVideo,
    resumeVideo,
    pauseH5P,
    resumeH5P,
    pauseYoutube,
    resumeYoutube,
  ]);

  // Initialize elapsed times array based on number of parts
  useEffect(() => {
    if (sortedLessonParts.length > 0) {
      setElapsedTimes(sortedLessonParts.map(() => 0));
    }
  }, [sortedLessonParts.length]);

  // Sync active content type to EyeTracking context whenever section changes
  useEffect(() => {
    const section = sortedLessonParts[currentSection];
    if (!section) return;
    const url = section.link || section.file || "";
    const type = getContentType(
      url,
      section.file_type,
      section.link_type || ""
    );
    if (type === "video" || type === "h5p" || type === "youtube") {
      setContextActiveContentType(type as any);
    } else {
      setContextActiveContentType(null as any);
    }
  }, [currentSection, sortedLessonParts]);

  // React to warning changes: pause/resume current content directly
  useEffect(() => {
    const section = sortedLessonParts[currentSection];
    if (!section) return;
    const url = section.link || section.file || "";
    const type = getContentType(
      url,
      section.file_type,
      section.link_type || ""
    );

    if (type === "video") {
      if (isWarning) {
        pauseVideo();
      } else {
        resumeVideo();
      }
    } else if (type === "h5p") {
      if (isWarning) {
        pauseH5P();
      } else {
        resumeH5P();
      }
    } else if (type === "youtube") {
      if (isWarning) {
        pauseYoutube();
      } else {
        resumeYoutube();
      }
    }
  }, [
    isWarning,
    currentSection,
    sortedLessonParts,
    pauseVideo,
    resumeVideo,
    pauseH5P,
    resumeH5P,
    pauseYoutube,
    resumeYoutube,
  ]);

  // Timer effect
  useEffect(() => {
    console.log("Timer effect triggered:", {
      currentSection,
      isTimerActive,
      sortedLessonPartsLength: sortedLessonParts.length,
    });

    if (isTimerActive && sortedLessonParts.length > 0) {
      timerRef.current = setInterval(() => {
        console.log("Timer tick - updating elapsedTimes");
        setElapsedTimes((prevTimes) => {
          const newTimes = [...prevTimes];
          newTimes[currentSection] = (newTimes[currentSection] || 0) + 1; // Add 1 second
          return newTimes;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentSection, isTimerActive, sortedLessonParts.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        handlePrevious();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentSection]);

  // Listen for fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      const active = Boolean(document.fullscreenElement);
      setIsFullscreen(active);
      if (!active) {
        setIsContentFullscreen(false);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Xử lý toàn màn hình cho từng loại nội dung cụ thể
  const handleTypeSpecificFullscreen = (contentType: string) => {
    // Lưu loại nội dung đang active
    setActiveContentType(contentType);

    // Xử lý toàn màn hình dựa trên loại nội dung
    switch (contentType) {
      case "video":
        if (videoRef.current) {
          if (!document.fullscreenElement) {
            videoRef.current.requestFullscreen().catch((err) => {
              console.error(
                `Error attempting to enable video fullscreen: ${err.message}`
              );
            });
          }
        }
        break;

      case "pdf":
        if (pdfRef.current) {
          if (!document.fullscreenElement) {
            pdfRef.current.requestFullscreen().catch((err) => {
              console.error(
                `Error attempting to enable PDF fullscreen: ${err.message}`
              );
            });
          }
        }
        break;

      case "powerpoint":
        if (presentationRef.current) {
          if (!document.fullscreenElement) {
            presentationRef.current.requestFullscreen().catch((err) => {
              console.error(
                `Error attempting to enable presentation fullscreen: ${err.message}`
              );
            });
          }
        }
        break;
      case "pptx":
        if (presentationRef.current) {
          if (!document.fullscreenElement) {
            presentationRef.current.requestFullscreen().catch((err) => {
              console.error(
                `Error attempting to enable presentation fullscreen: ${err.message}`
              );
            });
          }
        }
        break;

      case "youtube":
        if (youtubeRef.current) {
          if (!document.fullscreenElement) {
            youtubeRef.current.requestFullscreen().catch((err) => {
              console.error(
                `Error attempting to enable YouTube fullscreen: ${err.message}`
              );
            });
          }
        }
        break;

      case "html":
        if (htmlRef.current) {
          if (!document.fullscreenElement) {
            htmlRef.current.requestFullscreen().catch((err) => {
              console.error(
                `Error attempting to enable HTML fullscreen: ${err.message}`
              );
            });
          }
        }
        break;

      case "h5p":
        // Sử dụng chế độ toàn màn hình mặc định cho H5P
        handleContentFullscreen();
        break;

      default:
        // Sử dụng chế độ toàn màn hình mặc định
        handleContentFullscreen();
        break;
    }
  };

  // Hiển thị/ẩn điều khiển khi ở chế độ toàn màn hình
  const showControls = useCallback(() => {
    setShowFullscreenControls(true);

    // Xóa timeout cũ nếu có
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }

    // Tự động ẩn điều khiển sau 3 giây
    const timeout = setTimeout(() => {
      setShowFullscreenControls(false);
    }, 3000);

    setControlsTimeout(timeout);
  }, [controlsTimeout]);

  // Xử lý sự kiện di chuyển chuột để hiển thị điều khiển
  const handleMouseMove = useCallback(() => {
    if (document.fullscreenElement) {
      showControls();
    }
  }, [showControls]);

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const handleNext = useCallback(() => {
    if (currentSection < sortedLessonParts.length - 1) {
      setCurrentSection(currentSection + 1);
    }
  }, [currentSection, sortedLessonParts.length]);

  const handlePrevious = useCallback(() => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  }, [currentSection]);

  const handleContentFullscreen = () => {
    if (!isContentFullscreen) {
      if (contentRef.current) {
        if (contentRef.current.requestFullscreen) {
          contentRef.current.requestFullscreen().catch((err) => {
            console.error(
              `Error attempting to enable content fullscreen: ${err.message}`
            );
          });
        }
      }
      setIsContentFullscreen(true);
      setActiveContentType("general"); // Đánh dấu là chế độ toàn màn hình chung
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsContentFullscreen(false);
      setActiveContentType("unknown"); // Reset loại nội dung khi thoát toàn màn hình
    }
  };

  const toggleTimer = () => {
    setIsTimerActive(!isTimerActive);
  };

  // Format time from seconds to MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  // Check if time is exceeded for a section
  const isTimeExceeded = (sectionIndex: number) => {
    if (!sortedLessonParts[sectionIndex]) return false;
    const durationInSeconds = Number(sortedLessonParts[sectionIndex].time) * 60;
    return elapsedTimes[sectionIndex] > durationInSeconds;
  };

  // Calculate progress percentage for a section
  const calculateProgress = (sectionIndex: number) => {
    if (!sortedLessonParts[sectionIndex]) return 0;
    const durationInSeconds = Number(sortedLessonParts[sectionIndex].time) * 60;
    const progress = (elapsedTimes[sectionIndex] / durationInSeconds) * 100;
    return Math.min(progress, 100); // Cap at 100%
  };

  // Chuyển đổi URL YouTube thông thường thành URL nhúng (embed URL)
  const convertYoutubeUrl = (url: string): string => {
    if (!url) return "";

    // Kiểm tra nếu đã là URL nhúng
    if (url.includes("youtube.com/embed/")) {
      return url;
    }

    // Xử lý URL dạng youtube.com/watch?v=VIDEO_ID
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);

    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }

    // Trả về URL gốc nếu không thể chuyển đổi
    return url;
  };

  // Kiểm tra xem URL có phải là URL YouTube không
  const isYoutubeUrl = (url: string): boolean => {
    if (!url) return false;
    return url.includes("youtube.com") || url.includes("youtu.be");
  };

  // Kiểm tra xem URL có phải là URL Google Slides không
  const isGoogleSlidesUrl = (url: string): boolean => {
    if (!url) return false;
    return (
      url.includes("docs.google.com/presentation") ||
      url.includes("docs.google.com/presentation/d/e/") ||
      url.includes("docs.google.com/presentation/d/") ||
      url.includes("docs.google.com/presentation/pub")
    );
  };

  // Chuyển đổi URL Google Slides thành URL nhúng
  const convertGoogleSlidesUrl = (url: string): string => {
    if (!url) return "";

    // Nếu đã là URL nhúng (pubembed), giữ nguyên
    if (url.includes("/pubembed")) {
      return url;
    }

    // Nếu là URL chia sẻ thông thường, chuyển đổi thành URL nhúng
    if (url.includes("docs.google.com/presentation/d/")) {
      // Kiểm tra nếu là URL có định dạng đặc biệt (đã xuất bản)
      if (url.includes("/pub")) {
        return (
          url.replace("/pub", "/pubembed") +
          "?start=false&loop=false&delayms=3000"
        );
      }

      // Nếu là URL thông thường, thêm /embed vào
      if (
        !url.includes("/edit") &&
        !url.includes("/preview") &&
        !url.includes("/embed")
      ) {
        return url + "/embed";
      }

      // Nếu là URL edit hoặc preview, chuyển thành embed
      return url.replace("/edit", "/embed").replace("/preview", "/embed");
    }

    // Trả về URL gốc nếu không thể chuyển đổi
    return url;
  };

  // Kiểm tra loại file từ URL hoặc tên file
  const getContentType = (
    url: string,
    fileType: string,
    linkType: string
  ): string => {
    if (!url && !fileType && !linkType) return "unknown";

    // Kiểm tra từ linkType trước
    if (linkType === "powerpoint" || linkType === "googleSlides") {
      return linkType;
    }
    if (linkType === "h5p") return "h5p";

    // Nếu là YouTube URL
    if (isYoutubeUrl(url)) return "youtube";

    // Nếu là Google Slides URL
    if (isGoogleSlidesUrl(url)) return "googleSlides";

    // Kiểm tra từ đuôi file
    const lowerUrl = url.toLowerCase();

    // H5P: nếu URL trỏ tới máy chủ H5P hoặc gói .h5p
    if (lowerUrl.includes("/h5p/") || lowerUrl.endsWith(".h5p")) return "h5p";

    if (lowerUrl.endsWith(".pdf")) return "pdf";
    if (lowerUrl.endsWith(".pptx") || lowerUrl.endsWith(".ppt")) return "pptx";
    if (lowerUrl.endsWith(".docx") || lowerUrl.endsWith(".doc")) return "docx";
    if (lowerUrl.endsWith(".zip") || lowerUrl.endsWith(".raz"))
      return "archive";
    if (lowerUrl.endsWith(".html") || lowerUrl.endsWith(".htm")) return "html";
    if (
      lowerUrl.endsWith(".mp4") ||
      lowerUrl.endsWith(".webm") ||
      lowerUrl.endsWith(".avi") ||
      lowerUrl.endsWith(".mov")
    )
      return "video";
    if (
      lowerUrl.endsWith(".mp3") ||
      lowerUrl.endsWith(".wav") ||
      lowerUrl.endsWith(".ogg")
    )
      return "audio";
    if (
      lowerUrl.endsWith(".jpg") ||
      lowerUrl.endsWith(".jpeg") ||
      lowerUrl.endsWith(".png") ||
      lowerUrl.endsWith(".gif") ||
      lowerUrl.endsWith(".webp")
    )
      return "image";

    // Nếu không xác định được từ URL, sử dụng fileType
    if (fileType === "video") return "video";
    if (fileType === "slides") return "pptx";
    if (fileType === "document") return "pdf";
    if (fileType === "image") return "image";
    if (fileType === "audio") return "audio";
    if (fileType === "html") return "html";

    return "unknown";
  };

  console.log("Rendering loading or no content state");

  const isInFullscreen = isFullscreen || isContentFullscreen;

  // Thêm các class CSS cho điều khiển toàn màn hình
  const fullscreenControlsClass = cn(
    "absolute bottom-0 left-0 right-0 p-2 flex items-center justify-between transition-all duration-300",
    {
      "opacity-100": showFullscreenControls,
      "opacity-0": !showFullscreenControls && isInFullscreen,
    }
  );

  const videoControlsClass = cn(
    fullscreenControlsClass,
    "bg-black/70 text-white"
  );

  const documentControlsClass = cn(
    fullscreenControlsClass,
    "bg-white/90 shadow-md"
  );

  // Render content based on content type
  const renderContent = () => {
    if (
      loading ||
      sortedLessonParts.length === 0 ||
      !sortedLessonParts[currentSection]
    ) {
      return (
        <div className="aspect-video bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg flex items-center justify-center">
          <div className="text-center space-y-4">
            {loading ? (
              <>
                <div className="w-12 h-12 mx-auto">
                  <div className="absolute inset-0 rounded-full border-3 border-slate-200"></div>
                  <div className="absolute inset-0 rounded-full border-3 border-t-blue-500 animate-spin"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-slate-200 rounded-full mx-auto animate-pulse"></div>
                  <div className="h-3 w-48 bg-slate-200 rounded-full mx-auto animate-pulse"></div>
                </div>
              </>
            ) : error ? (
              <>
                <div className="w-12 h-12 mx-auto rounded-full bg-red-50 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-slate-800">
                    {t("errors.loadContent")}
                  </h3>
                  <p className="text-xs text-slate-500">{error}</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-slate-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-slate-800">
                    {t("empty.noContentTitle")}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {t("empty.noContentDesc")}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      );
    }

    const section = sortedLessonParts[currentSection];
    const url = section.link || section.file || "";
    const contentType = getContentType(
      url,
      section.file_type,
      section.link_type || ""
    );

    // Hiển thị nội dung dựa trên loại nội dung
    switch (contentType) {
      case "h5p": {
        const routeId =
          section.link && section.link.includes("/")
            ? section.link.split("/").pop() || ""
            : "";
        if (!routeId) {
          return (
            <div className="aspect-video bg-white rounded-lg overflow-hidden border relative flex items-center justify-center p-6">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2">
                  Không thể hiển thị H5P
                </h3>
                <p className="text-sm text-slate-600">
                  Không tìm thấy contentId hợp lệ từ URL: {url}
                </p>
              </div>
            </div>
          );
        }

        return (
          <div
            className="aspect-video bg-white rounded-lg overflow-hidden border relative"
            onMouseMove={handleMouseMove}
          >
            <div className="w-full h-full overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {getH5PElement(routeId)}
            </div>
          </div>
        );
      }
      case "youtube":
        return (
          <div
            className="aspect-video bg-black rounded-lg overflow-hidden relative"
            onMouseMove={handleMouseMove}
          >
            <iframe
              ref={youtubeRef}
              className="w-full h-full"
              src={getYoutubeApiUrl(url)}
              title={`YouTube video - ${section.title}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>

            {/* Nút toàn màn hình cho YouTube */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleTypeSpecificFullscreen("youtube")}
              className="absolute bottom-4 right-4 bg-black/50 hover:bg-black/70 text-white z-10"
              aria-label={t("aria.fullscreen")}
            >
              <Maximize className="h-5 w-5" />
            </Button>

            {/* Điều khiển khi ở chế độ toàn màn hình */}
            {isInFullscreen && activeContentType === "youtube" && (
              <div className={videoControlsClass}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={currentSection === 0}
                  className="text-white"
                >
                  <ArrowLeft className="h-5 w-5 mr-1" />{" "}
                  {t("controls.prevSection")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => document.exitFullscreen()}
                  className="text-white"
                >
                  <Minimize className="h-5 w-5 mr-1" />{" "}
                  {t("controls.exitFullscreen")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNext}
                  disabled={currentSection === sortedLessonParts.length - 1}
                  className="text-white"
                >
                  {t("controls.nextSection")}{" "}
                  <ArrowRight className="h-5 w-5 ml-1" />
                </Button>
              </div>
            )}
          </div>
        );

      case "video":
        return (
          <div
            className="aspect-video bg-black rounded-lg overflow-hidden relative"
            onMouseMove={handleMouseMove}
          >
            <video
              ref={videoRef}
              className="w-full h-full"
              controls
              src={url}
              title={section.title}
            />

            {/* Nút toàn màn hình cho video */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleTypeSpecificFullscreen("video")}
              className="absolute bottom-4 right-4 bg-black/50 hover:bg-black/70 text-white z-10"
              aria-label={t("aria.fullscreen")}
            >
              <Maximize className="h-5 w-5" />
            </Button>

            {/* Điều khiển khi ở chế độ toàn màn hình */}
            {isInFullscreen && activeContentType === "video" && (
              <div className={videoControlsClass}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={currentSection === 0}
                  className="text-white"
                >
                  <ArrowLeft className="h-5 w-5 mr-1" />{" "}
                  {t("controls.prevSection")}
                </Button>
                <h3 className="text-lg font-medium">{section.title}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNext}
                  disabled={currentSection === sortedLessonParts.length - 1}
                  className="text-white"
                >
                  {t("controls.nextSection")}{" "}
                  <ArrowRight className="h-5 w-5 ml-1" />
                </Button>
              </div>
            )}
          </div>
        );

      case "pdf":
        return (
          <div
            className="aspect-video bg-white rounded-lg overflow-hidden border relative"
            onMouseMove={handleMouseMove}
          >
            <iframe
              ref={pdfRef}
              src={url}
              title={`PDF - ${section.title}`}
              className="w-full h-full"
              allowFullScreen
            ></iframe>

            {/* Nút toàn màn hình cho PDF */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleTypeSpecificFullscreen("pdf")}
              className="absolute top-2 right-2 bg-white/80 hover:bg-white z-10"
              aria-label={t("aria.fullscreen")}
            >
              <Maximize className="h-5 w-5" />
            </Button>

            {/* Nút tải xuống */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => window.open(url, "_blank")}
              className="absolute top-2 right-12 bg-white/80 hover:bg-white z-10"
              aria-label="Tải xuống"
            >
              <Download className="h-5 w-5" />
            </Button>

            {/* Điều khiển khi ở chế độ toàn màn hình */}
            {isInFullscreen && activeContentType === "pdf" && (
              <div className={documentControlsClass}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={currentSection === 0}
                >
                  <ArrowLeft className="h-5 w-5 mr-1" />{" "}
                  {t("controls.prevSection")}
                </Button>
                <div className="text-center">
                  <h3 className="text-sm font-medium">{section.title}</h3>
                  <p className="text-xs text-gray-500">{t("labels.pdfDoc")}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
                  disabled={currentSection === sortedLessonParts.length - 1}
                >
                  {t("controls.nextSection")}{" "}
                  <ArrowRight className="h-5 w-5 ml-1" />
                </Button>
              </div>
            )}
          </div>
        );

      case "powerpoint":
        return (
          <div
            className="aspect-video bg-white rounded-lg overflow-hidden border relative"
            onMouseMove={handleMouseMove}
          >
            <iframe
              ref={presentationRef}
              src={url}
              title={`PowerPoint - ${section.title}`}
              className="w-full h-full"
              allow="fullscreen; autoplay; clipboard-write; encrypted-media; accelerometer; gyroscope"
              allowFullScreen
            ></iframe>
            {/* Điều khiển khi ở chế độ toàn màn hình */}
            {isInFullscreen &&
              activeContentType === "powerpoint" && (
                <div className={documentControlsClass}>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => document.exitFullscreen()}
                    className="absolute top-2 right-2 bg-white/80 hover:bg-white z-10"
                    aria-label={t("aria.exitFullscreen")}
                  >
                    <Minimize className="h-5 w-5" />
                  </Button>
                </div>
              )}
          </div>
        );

      case "pptx":
        return (
          <div className="aspect-video bg-white rounded-lg overflow-hidden border relative">
            <iframe
              src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
                url
              )}`}
              title={`PowerPoint - ${section.title}`}
              className="w-full h-full"
              allowFullScreen
            ></iframe>
          </div>
        );

      case "docx":
        return (
          <div className="aspect-video bg-white rounded-lg overflow-hidden border relative">
            <iframe
              src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
                url
              )}`}
              title={`Document - ${section.title}`}
              className="w-full h-full"
            ></iframe>

            {/* Nút tải xuống */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => window.open(url, "_blank")}
              className="absolute top-2 right-2 bg-white/80 hover:bg-white z-10"
              aria-label="Tải xuống"
            >
              <Download className="h-5 w-5" />
            </Button>
          </div>
        );

      case "archive":
        return (
          <div className="aspect-video bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg flex items-center justify-center p-8">
            <div className="w-full max-w-md text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Download className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-medium mb-4">{section.title}</h3>
              <p className="text-sm text-gray-600 mb-6">
                File nén chứa tài liệu và nội dung bài học
              </p>
              <Button
                onClick={() => window.open(url, "_blank")}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-full"
              >
                <Download className="h-4 w-4 mr-2" /> Tải xuống file
              </Button>
            </div>
          </div>
        );

      case "image":
        return (
          <div className="aspect-video bg-white rounded-lg overflow-hidden border relative flex items-center justify-center">
            <div className="relative w-full h-full">
              <Image
                src={url || section.cover_image || ""}
                alt={section.title}
                fill
                className="object-contain"
              />
            </div>

            {/* Nút tải xuống */}
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                window.open(url || section.cover_image || "", "_blank")
              }
              className="absolute top-2 right-2 bg-white/80 hover:bg-white z-10"
              aria-label="Tải xuống"
            >
              <Download className="h-5 w-5" />
            </Button>
          </div>
        );

      case "audio":
        return (
          <div className="aspect-video bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg flex items-center justify-center p-8">
            <div className="w-full max-w-md">
              <h3 className="text-xl font-medium mb-4 text-center">
                {section.title}
              </h3>
              <audio controls className="w-full" src={url}>
                Your browser does not support the audio element.
              </audio>
              {section.cover_image && (
                <div className="mt-4 relative aspect-video w-full max-w-sm mx-auto">
                  <Image
                    src={section.cover_image || "/placeholder.svg"}
                    alt={section.title}
                    fill
                    className="object-contain rounded-md"
                  />
                </div>
              )}

              {/* Nút tải xuống */}
              <div className="mt-4 text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(url, "_blank")}
                  className="bg-white/80 hover:bg-white"
                >
                  <Download className="h-4 w-4 mr-2" /> Tải xuống audio
                </Button>
              </div>
            </div>
          </div>
        );

      case "html":
        return (
          <div
            className="aspect-video bg-white rounded-lg overflow-hidden border relative"
            onMouseMove={handleMouseMove}
          >
            <iframe
              ref={htmlRef}
              src={url}
              title={`HTML - ${section.title}`}
              className="w-full h-full"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
              allowFullScreen
            ></iframe>

            {/* Nút toàn màn hình cho HTML */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleTypeSpecificFullscreen("html")}
              className="absolute top-2 right-2 bg-white/80 hover:bg-white z-10"
              aria-label={t("aria.fullscreen")}
            >
              <Maximize className="h-5 w-5" />
            </Button>

            {/* Nút mở trong tab mới */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => window.open(url, "_blank")}
              className="absolute top-2 right-12 bg-white/80 hover:bg-white z-10"
              aria-label="Mở trong tab mới"
            >
              <ExternalLink className="h-5 w-5" />
            </Button>

            {/* Điều khiển khi ở chế độ toàn màn hình */}
            {isInFullscreen && activeContentType === "html" && (
              <div className={documentControlsClass}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={currentSection === 0}
                >
                  <ArrowLeft className="h-5 w-5 mr-1" />{" "}
                  {t("controls.prevSection")}
                </Button>
                <div className="text-center">
                  <h3 className="text-sm font-medium">{section.title}</h3>
                  <p className="text-xs text-gray-500">HTML Document</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
                  disabled={currentSection === sortedLessonParts.length - 1}
                >
                  {t("controls.nextSection")}{" "}
                  <ArrowRight className="h-5 w-5 ml-1" />
                </Button>
              </div>
            )}
          </div>
        );

      default:
        // Nếu không xác định được loại nội dung, thử hiển thị dựa trên file_type
        switch (section.file_type) {
          case "interactive":
            return (
              <div className="aspect-video bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg overflow-auto border p-6">
                {url ? (
                  <iframe
                    src={url}
                    title={`Interactive - ${section.title}`}
                    className="w-full h-full border-none"
                    allowFullScreen
                  ></iframe>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <h3 className="text-xl font-medium mb-2">
                        {section.title}
                      </h3>
                      <p>Hoạt động tương tác</p>
                      <p className="text-sm text-gray-500 mt-2">
                        {section.tag && (
                          <span className="inline-block bg-gray-100 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2">
                            {section.tag.split(",").join(", ")}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );

          default:
            // Fallback nếu không xác định được loại nội dung
            return (
              <div className="aspect-video bg-gray-50 rounded-lg flex items-center justify-center p-6">
                <div className="text-center">
                  <h3 className="text-xl font-medium mb-2">{section.title}</h3>
                  <p>Loại nội dung: {section.file_type || "Không xác định"}</p>
                  {section.tag && (
                    <p className="text-sm text-gray-500 mt-2">
                      Tags: {section.tag.split(",").join(", ")}
                    </p>
                  )}
                  {url && (
                    <div className="mt-4">
                      <Button
                        variant="outline"
                        onClick={() => window.open(url, "_blank")}
                        className="bg-blue-50 hover:bg-blue-100"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" /> Mở nội dung
                        trong tab mới
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
        }
    }
  };

  // Render notes for teacher and student - Minimalist Design
  const renderNotes = () => {
    if (!sortedLessonParts[currentSection]) return null;

    const section = sortedLessonParts[currentSection];
    const hasTeacherNotes =
      section.guide_teacher && section.guide_teacher.trim();
    const hasStudentNotes =
      section.guide_student && section.guide_student.trim();

    if (!hasTeacherNotes && !hasStudentNotes) return null;

    return (
      <div className="mb-8">
        <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-slate-200/60 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200/60 bg-gradient-to-r from-slate-50/50 to-white/50">
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"></div>
              <h3 className="text-sm font-medium text-slate-700">
                {t("notes.title")}
              </h3>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {hasTeacherNotes && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <PenTool className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium text-slate-700">
                      {t("notes.teacherNotes")}
                    </span>
                  </div>
                  <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-100/50">
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {section.guide_teacher}
                    </p>
                  </div>
                </div>
              )}

              {hasStudentNotes && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm font-medium text-slate-700">
                      {t("notes.studentGuidance")}
                    </span>
                  </div>
                  <div className="bg-emerald-50/50 rounded-lg p-4 border border-emerald-100/50">
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {section.guide_student}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Get section icon based on file_type
  const getSectionIcon = (fileType: string) => {
    switch (fileType) {
      case "video":
        return <Play className="h-4 w-4" />;
      case "slides":
        return <FileText className="h-4 w-4" />;
      case "audio":
        return <Headphones className="h-4 w-4" />;
      case "document":
        return <FileText className="h-4 w-4" />;
      case "image":
        return <Eye className="h-4 w-4" />;
      case "interactive":
        return <BookOpen className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  useEffect(() => {
    // Xử lý phím tắt khi ở chế độ toàn màn hình
    const handleFullscreenKeyDown = (e: KeyboardEvent) => {
      if (document.fullscreenElement) {
        // Hiển thị điều khiển khi nhấn phím bất kỳ
        showControls();

        // Xử lý phím tắt
        switch (e.key) {
          case "Escape": // ESC đã được xử lý mặc định để thoát toàn màn hình
            break;
          case "ArrowLeft":
            handlePrevious();
            break;
          case "ArrowRight":
            handleNext();
            break;
          case "Space":
            // Tạm dừng/tiếp tục video nếu đang xem video
            if (activeContentType === "video" && videoRef.current) {
              if (videoRef.current.paused) {
                videoRef.current.play();
              } else {
                videoRef.current.pause();
              }
              e.preventDefault(); // Ngăn không cho trang cuộn
            }
            break;
        }
      }
    };

    window.addEventListener("keydown", handleFullscreenKeyDown);
    return () => {
      window.removeEventListener("keydown", handleFullscreenKeyDown);
    };
  }, [activeContentType, showControls, handlePrevious, handleNext]);

  // Thêm useEffect để xử lý cleanup cho timeout
  useEffect(() => {
    return () => {
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }
    };
  }, [controlsTimeout]);

  // Fetch lesson data when modal opens
  const fetchLessonDataFromAPI = useCallback(async () => {
    if (!resolvedLessonId) return;

    setLoadingLessonData(true);
    try {
      let courseIdForFetch = effectiveCourseId;

      const response = await GetLessonDetail(
        resolvedLessonId,
        courseIdForFetch
      );
      let lessonDetail = response.data || response;

      if (!courseIdForFetch && lessonDetail?.schedules?.length > 0) {
        const scheduleWithCourse = lessonDetail.schedules.find(
          (schedule: any) => schedule?.course_id
        );
        if (scheduleWithCourse?.course_id) {
          courseIdForFetch = Number(scheduleWithCourse.course_id);
          setEffectiveCourseId(courseIdForFetch);
          if (typeof window !== "undefined") {
            sessionStorage.setItem(
              `lesson_course_${resolvedLessonId}`,
              String(courseIdForFetch)
            );
          }
          const refetch = await GetLessonDetail(
            resolvedLessonId,
            courseIdForFetch
          );
          lessonDetail = refetch.data || refetch;
        }
      }

      setLessonDataFromAPI({
        title: lessonDetail.title,
        homeworks: lessonDetail.homeworks || [],
        exams: lessonDetail.exams || [],
      });
    } catch (error) {
      console.error("Error fetching lesson detail:", error);
      setLessonDataFromAPI(null);
    } finally {
      setLoadingLessonData(false);
    }
  }, [resolvedLessonId, effectiveCourseId]);

  const patchAssignmentStatus = (
    type: "homework" | "exam",
    id: string,
    isAssigned: boolean
  ) => {
    setLessonDataFromAPI((prev: any) => {
      if (!prev) return prev;
      const key = type === "homework" ? "homeworks" : "exams";
      return {
        ...prev,
        [key]: (prev[key] || []).map((item: any) =>
          String(item.id) === String(id)
            ? {
                ...item,
                is_assigned: isAssigned,
                assigned_at: isAssigned ? item.assigned_at : null,
              }
            : item
        ),
      };
    });
  };

  // Refresh assignment list when dialog is open and tab regains focus
  useEffect(() => {
    if (!assignmentDialogOpen || !resolvedLessonId) return;

    const refreshAssignments = () => {
      if (document.visibilityState === "visible") {
        fetchLessonDataFromAPI();
      }
    };

    window.addEventListener("focus", refreshAssignments);
    document.addEventListener("visibilitychange", refreshAssignments);
    return () => {
      window.removeEventListener("focus", refreshAssignments);
      document.removeEventListener("visibilitychange", refreshAssignments);
    };
  }, [assignmentDialogOpen, resolvedLessonId, fetchLessonDataFromAPI]);

  const handleAssignmentDialogChange = (open: boolean) => {
    setAssignmentDialogOpen(open);
    if (open && resolvedLessonId) {
      fetchLessonDataFromAPI();
    }
  };

  // Handle assignment dialog open
  const handleAssignmentDialogOpen = () => {
    handleAssignmentDialogChange(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 animate-spin"></div>
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-slate-800">
              Đang tải bài giảng
            </h3>
            <p className="text-sm text-slate-500">
              Vui lòng đợi trong giây lát...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || sortedLessonParts.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-8 shadow-xl">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-50 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800 mb-3">
              Không thể tải bài giảng
            </h2>
            <p className="text-slate-600 mb-6 leading-relaxed">
              {error ||
                "Không tìm thấy dữ liệu bài giảng hoặc bài giảng không có nội dung."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleBackNavigation}
                className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white px-6 py-2 rounded-full font-medium"
              >
                <Undo2 className="h-4 w-4 mr-2" />
                Quay lại
              </Button>
              <Button
                onClick={() => router.push(getLectureRoute(user))}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-2 rounded-full font-medium"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay lại danh sách
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      {user?.type === "student" && isFocusDetectionEnabled && (
        <EyeTrackingWidget width={260} height={180} />
      )}
      {/* Minimalist Top Navigation */}
      <div className="px-8 py-6">
        <div className="max-w-8xl mx-auto flex flex-col gap-4">
          {/* Back button */}
          {typeof window !== "undefined" && window.history.length > 1 && <Button
            variant="ghost"
            size="sm"
            onClick={router.back}
            className="w-fit text-gray-600 hover:text-gray-800 font-semibold justify-start"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("actions.back")}
          </Button>}
          {/* Lesson Info and Actions Button Section */}
          <div className="flex flex-col xl:flex-row space-y-4 xl:space-y-0 justify-between">
            {/* Left: Simple lesson info */}
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full"></div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-lg font-medium text-slate-800">
                    {lessonPlan?.name || "Xem trước bài giảng"}
                  </h1>
                  {isCompleted ? (
                    <div className="flex items-center space-x-1 px-2 py-1 bg-emerald-50 rounded-full border border-emerald-200">
                      <CheckCircle className="h-3 w-3 text-emerald-600" />
                      <span className="text-xs font-medium text-emerald-700">
                        {t("status.completed")}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1 px-2 py-1 bg-slate-100 rounded-full border border-slate-200">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span className="text-xs font-medium text-slate-600">
                        {t("status.notCompleted")}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-4 text-sm text-slate-500 font-light">
                  <span>
                    {lessonParts[currentSection]?.title || "Không có tiêu đề"}
                  </span>
                  <span>•</span>
                  <span>
                    Phần {currentSection + 1}/{sortedLessonParts.length}
                  </span>
                  <span>•</span>
                  <span>
                    {lessonParts[currentSection] &&
                      formatTime(elapsedTimes[currentSection] || 0)}{" "}
                    / {lessonParts[currentSection]?.time}:00
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Minimal action buttons */}
            <div className="flex flex-col space-y-2 md:space-y-0 md:flex-row md:items-center md:space-x-3">
              <div className="flex items-center space-x-1 bg-slate-50 rounded-full p-1 w-fit">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleTimer}
                  className="h-8 px-3 text-base font-medium text-slate-600 hover:text-slate-900 hover:bg-white rounded-full"
                >
                  <Clock className="h-3.5 w-3.5 mr-1.5" />
                  {isTimerActive ? t("controls.pause") : t("controls.resume")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNotes(!showNotes)}
                  className="h-8 px-3 text-base font-medium text-slate-600 hover:text-slate-900 hover:bg-white rounded-full"
                >
                  <Info className="h-3.5 w-3.5 mr-1.5" />
                  {showNotes
                    ? t("controls.hideNotes")
                    : t("controls.showNotes")}
                </Button>
              </div>
              <div className="flex flex-row max-sm:flex-col gap-2 w-fit">
                {canShowAssignmentButton && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAssignmentDialogOpen}
                    className="h-9 px-4 bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700 rounded-full font-medium text-base"
                    disabled={loadingLessonData}
                  >
                    <Users className="h-3.5 w-3.5 mr-2" />
                    {loadingLessonData ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                        {t("actions.loading")}
                      </>
                    ) : (
                      t("actions.assignHomework")
                    )}
                  </Button>
                )}
                {bookUrl && (user?.type === "admin" || user?.type === "teacher") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(bookUrl, "_blank")}
                    className="h-9 px-4 bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700 rounded-full font-medium text-base"
                    disabled={loadingCourseDetail}
                  >
                    <BookOpen className="h-3.5 w-3.5 mr-2" />
                    {loadingCourseDetail ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                        {t("actions.loading")}
                      </>
                    ) : (
                      t("actions.viewBook")
                    )}
                  </Button>
                )}
                {user?.type === "admin" && (
                  <Button
                    onClick={() =>
                      lessonPlan &&
                      router.push(
                        getEditLectureRoute(user, lessonPlanId, courseId)
                      )
                    }
                    className="h-9 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full font-medium text-base shadow-sm"
                    disabled={!lessonPlan}
                  >
                    {t("actions.edit")}
                  </Button>
                )}
                {onCompleteLesson && (
                  <Button
                    onClick={onCompleteLesson}
                    className={`h-9 px-4 rounded-full font-medium text-base shadow-sm transition-all duration-200 ${
                      isCompleted
                        ? "bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white hover:shadow-md"
                        : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white hover:shadow-md"
                    }`}
                    disabled={isCompleting}
                  >
                    {isCompleting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                        {isCompleted
                          ? t("actions.undoing")
                          : t("actions.completing")}
                      </>
                    ) : isCompleted ? (
                      <>
                        <RotateCcw className="h-3.5 w-3.5 mr-2" />
                        {t("actions.undoComplete")}
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-3.5 w-3.5 mr-2" />
                        {t("actions.completeLesson")}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar - Compact Design */}
      <div className="bg-white/70 backdrop-blur-sm border-b border-slate-200/50 py-3 px-8">
        <div className="max-w-7xl mx-auto">
          {/* Modern progress bar */}
          <div className="relative">
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="flex h-full">
                {sortedLessonParts.map((part, index) => {
                  const totalDuration = sortedLessonParts.reduce(
                    (acc, p) => acc + Number(p.time),
                    0
                  );
                  const width = (Number(part.time) / totalDuration) * 100;
                  const progress = calculateProgress(index);
                  const isActive = index === currentSection;
                  const isExceeded = isTimeExceeded(index);

                  return (
                    <div
                      key={part.id}
                      className={`h-full relative transition-all duration-300 ${
                        index > currentSection
                          ? "bg-slate-200"
                          : index < currentSection
                          ? "bg-slate-300"
                          : "bg-slate-200"
                      }`}
                      style={{ width: `${width}%` }}
                    >
                      <div
                        className={`absolute top-0 left-0 h-full transition-all duration-500 ease-out ${
                          isExceeded
                            ? "bg-gradient-to-r from-red-400 to-red-500"
                            : isActive
                            ? "bg-gradient-to-r from-emerald-400 to-blue-500"
                            : "bg-gradient-to-r from-emerald-300 to-blue-400"
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section markers */}
            <div className="flex justify-between mt-2">
              {sortedLessonParts.map((part, index) => {
                const isActive = index === currentSection;
                const isExceeded = isTimeExceeded(index);

                return (
                  <button
                    key={part.id}
                    onClick={() => setCurrentSection(index)}
                    className={`flex flex-col items-center space-y-1 transition-all duration-200 hover:scale-105 group ${
                      isActive ? "opacity-100" : "opacity-60 hover:opacity-90"
                    }`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                        isActive
                          ? "bg-gradient-to-r from-emerald-400 to-blue-500 shadow-sm"
                          : "bg-slate-300 group-hover:bg-slate-400"
                      }`}
                    />
                    <div
                      className={`text-xs font-medium transition-colors duration-200 max-w-40 text-center truncate ${
                        isActive
                          ? "text-slate-800"
                          : "text-slate-500 group-hover:text-slate-700"
                      }`}
                    >
                      {part.title}
                    </div>
                    {isExceeded && (
                      <AlertTriangle className="w-2.5 h-2.5 text-red-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main content - Compact Layout */}
      <div className="flex-1 py-6 px-8">
        <div className="max-w-7xl mx-auto">
          {/* Teacher and student notes */}
          {showNotes && renderNotes()}

          {/* Content area with elegant navigation */}
          <div className="relative flex items-center justify-center">
            {/* Previous button - Floating style */}
            <Button
              variant="ghost"
              onClick={handlePrevious}
              disabled={currentSection === 0}
              className={cn(
                "absolute left-0 z-10 h-12 w-12 rounded-full transition-all duration-200",
                "bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl",
                "border border-slate-200/60 hover:border-slate-300",
                "text-slate-600 hover:text-slate-900",
                "disabled:opacity-30 disabled:cursor-not-allowed",
                "hover:scale-105 active:scale-95"
              )}
              aria-label="Phần trước"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            {/* Content container - Clean and centered */}
            <div className="w-full max-w-7xl mx-20">
              <div
                ref={contentRef}
                className="aspect-[16/9] w-full relative rounded-xl overflow-hidden shadow-lg ring-1 ring-slate-200/60"
              >
                <div className="w-full h-full bg-white">{renderContent()}</div>
              </div>
            </div>

            {/* Next button - Floating style */}
            <Button
              variant="ghost"
              onClick={handleNext}
              disabled={currentSection === lessonParts.length - 1}
              className={cn(
                "absolute right-0 z-10 h-12 w-12 rounded-full transition-all duration-200",
                "bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl",
                "border border-slate-200/60 hover:border-slate-300",
                "text-slate-600 hover:text-slate-900",
                "disabled:opacity-30 disabled:cursor-not-allowed",
                "hover:scale-105 active:scale-95"
              )}
              aria-label="Phần tiếp theo"
            >
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Assignment Dialog - Minimalist Design */}
      <Dialog
        open={assignmentDialogOpen}
        onOpenChange={handleAssignmentDialogChange}
      >
        <DialogContent className="max-w-5xl max-h-[90vh] sm:max-h-[85vh] overflow-hidden bg-white/95 backdrop-blur-md border border-slate-200/60 flex flex-col">
          <DialogHeader className="pb-4 sm:pb-6 border-b border-slate-200/60 flex-shrink-0">
            <div className="flex items-start sm:items-center space-x-3">
              <div className="w-2 h-2 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-full flex-shrink-0 mt-1 sm:mt-0"></div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-lg sm:text-xl font-semibold text-slate-800">
                  {t("dialog.assignTitle")}
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-slate-600 mt-1">
                  {t("dialog.assignSubtitle")}{" "}
                  <span className="font-medium truncate block sm:inline">
                    {lessonDataFromAPI?.title || t("actions.loading")}
                  </span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 py-6 min-h-0">
            {loadingLessonData ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <div className="w-12 h-12 mx-auto">
                    <div className="absolute inset-0 rounded-full border-3 border-slate-200"></div>
                    <div className="absolute inset-0 rounded-full border-3 border-t-blue-500 animate-spin"></div>
                  </div>
                  <p className="text-sm text-slate-600">
                    {t("dialog.loadingLessonData")}
                  </p>
                </div>
              </div>
            ) : lessonDataFromAPI ? (
              <div className="space-y-8">
                {/* Homework Section */}
                {lessonDataFromAPI.homeworks?.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800">
                          {t("dialog.homeworkSectionTitle")}
                        </h3>
                        <p className="text-sm text-slate-500">
                          {t("dialog.homeworkCount", {
                            count: lessonDataFromAPI.homeworks.length,
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4">
                      {lessonDataFromAPI.homeworks.map((homework: any) => {
                        const isAssigned = homework.is_assigned || false;
                        return (
                          <div
                            key={homework.id}
                            className={`group rounded-xl border transition-all duration-200 ${
                              isAssigned
                                ? "border-slate-200 bg-slate-50/50"
                                : "border-orange-200 bg-orange-50/30 hover:bg-orange-50/50"
                            }`}
                          >
                            <div className="p-4 sm:p-6">
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                <div className="flex-1 space-y-3">
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                    <h4
                                      className={`font-medium text-sm sm:text-base ${
                                        isAssigned
                                          ? "text-slate-600"
                                          : "text-slate-800"
                                      }`}
                                    >
                                      {homework.title || homework.name}
                                    </h4>
                                    {(isAssigned ||
                                      assigningIds.has(
                                        `homework_${homework.id}`
                                      )) && (
                                      <div className="flex items-center space-x-1 px-2 py-1 bg-emerald-50 rounded-full border border-emerald-200 self-start">
                                        {assigningIds.has(
                                          `homework_${homework.id}`
                                        ) ? (
                                          <>
                                            <Loader2 className="h-3 w-3 text-emerald-600 animate-spin" />
                                            <span className="text-xs font-medium text-emerald-700">
                                              {t("dialog.assigning")}
                                            </span>
                                          </>
                                        ) : (
                                          <>
                                            <CheckCircle className="h-3 w-3 text-emerald-600" />
                                            <span className="text-xs font-medium text-emerald-700">
                                              {t("dialog.assigned")}
                                            </span>
                                          </>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  {homework.description && (
                                    <p
                                      className={`text-sm leading-relaxed ${
                                        isAssigned
                                          ? "text-slate-500"
                                          : "text-slate-600"
                                      }`}
                                    >
                                      {homework.description}
                                    </p>
                                  )}

                                  <div
                                    className={`flex flex-wrap items-center gap-2 sm:gap-4 text-xs ${
                                      isAssigned
                                        ? "text-slate-400"
                                        : "text-slate-500"
                                    }`}
                                  >
                                    <span>
                                      {t("dialog.createdAt")}{" "}
                                      {homework.created_at
                                        ? new Date(
                                            homework.created_at
                                          ).toLocaleDateString("vi-VN")
                                        : "N/A"}
                                    </span>
                                    {homework.max_score && (
                                      <span>
                                        {t("dialog.maxScore")}:{" "}
                                        {homework.max_score}
                                      </span>
                                    )}
                                    {homework.questionCount !== undefined && (
                                      <span>
                                        {t("dialog.questionCount")}:{" "}
                                        {homework.questionCount}
                                      </span>
                                    )}
                                    {isAssigned && homework.assigned_at && (
                                      <span>
                                        {t("dialog.assignedAt")}{" "}
                                        {new Date(
                                          homework.assigned_at
                                        ).toLocaleDateString("vi-VN")}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <Button
                                  size="sm"
                                  className={`transition-all duration-200 self-start ${
                                    isAssigned
                                      ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-sm hover:shadow-md"
                                      : "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-sm hover:shadow-md"
                                  }`}
                                  disabled={assigningIds.has(
                                    `homework_${homework.id}`
                                  )}
                                  onClick={() => {
                                    if (!isAssigned) {
                                      handleAssignHomework(
                                        homework.id,
                                        homework.title || homework.name
                                      );
                                    } else {
                                      handleUnassignHomework(
                                        homework.id,
                                        homework.title || homework.name
                                      );
                                    }
                                  }}
                                >
                                  {assigningIds.has(
                                    `homework_${homework.id}`
                                  ) ? (
                                    <>
                                      <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                      {isAssigned
                                        ? t("dialog.unassigning")
                                        : t("dialog.assigning")}
                                    </>
                                  ) : isAssigned ? (
                                    <>
                                      <RotateCcw className="h-3 w-3 mr-2" />
                                      {t("actions.undoAssign")}
                                    </>
                                  ) : (
                                    t("actions.assignHomework")
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Exam Section */}
                {lessonDataFromAPI.exams?.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                        <PenTool className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800">
                          {t("dialog.examSectionTitle")}
                        </h3>
                        <p className="text-sm text-slate-500">
                          {t("dialog.examCount", {
                            count: lessonDataFromAPI.exams.length,
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4">
                      {lessonDataFromAPI.exams.map((exam: any) => {
                        const isAssigned = exam.is_assigned || false;
                        return (
                          <div
                            key={exam.id}
                            className={`group rounded-xl border transition-all duration-200 ${
                              isAssigned
                                ? "border-slate-200 bg-slate-50/50"
                                : "border-blue-200 bg-blue-50/30 hover:bg-blue-50/50"
                            }`}
                          >
                            <div className="p-4 sm:p-6">
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                <div className="flex-1 space-y-3">
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                    <h4
                                      className={`font-medium text-sm sm:text-base ${
                                        isAssigned
                                          ? "text-slate-600"
                                          : "text-slate-800"
                                      }`}
                                    >
                                      {exam.title || exam.name}
                                    </h4>
                                    {(isAssigned ||
                                      assigningIds.has(`exam_${exam.id}`)) && (
                                      <div className="flex items-center space-x-1 px-2 py-1 bg-emerald-50 rounded-full border border-emerald-200 self-start">
                                        {assigningIds.has(`exam_${exam.id}`) ? (
                                          <>
                                            <Loader2 className="h-3 w-3 text-emerald-600 animate-spin" />
                                            <span className="text-xs font-medium text-emerald-700">
                                              Đang giao...
                                            </span>
                                          </>
                                        ) : (
                                          <>
                                            <CheckCircle className="h-3 w-3 text-emerald-600" />
                                            <span className="text-xs font-medium text-emerald-700">
                                              Đã giao
                                            </span>
                                          </>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  {exam.description && (
                                    <p
                                      className={`text-sm leading-relaxed ${
                                        isAssigned
                                          ? "text-slate-500"
                                          : "text-slate-600"
                                      }`}
                                    >
                                      {exam.description}
                                    </p>
                                  )}

                                  <div
                                    className={`flex flex-wrap items-center gap-2 sm:gap-4 text-xs ${
                                      isAssigned
                                        ? "text-slate-400"
                                        : "text-slate-500"
                                    }`}
                                  >
                                    <span>
                                      {t("dialog.createdAt")}{" "}
                                      {exam.created_at
                                        ? new Date(
                                            exam.created_at
                                          ).toLocaleDateString("vi-VN")
                                        : "N/A"}
                                    </span>
                                    {exam.time_limit && (
                                      <span>
                                        {t("dialog.timeLimit")}:{" "}
                                        {exam.time_limit} {t("dialog.minutes")}
                                      </span>
                                    )}
                                    {exam.max_score && (
                                      <span>
                                        {t("dialog.maxScore")}: {exam.max_score}
                                      </span>
                                    )}
                                    {exam.questionCount !== undefined && (
                                      <span>
                                        {t("dialog.questionCount")}:{" "}
                                        {exam.questionCount}
                                      </span>
                                    )}
                                    {isAssigned && exam.assigned_at && (
                                      <span>
                                        {t("dialog.assignedAt")}{" "}
                                        {new Date(
                                          exam.assigned_at
                                        ).toLocaleDateString("vi-VN")}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <Button
                                  size="sm"
                                  className={`transition-all duration-200 self-start ${
                                    isAssigned
                                      ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-sm hover:shadow-md"
                                      : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-sm hover:shadow-md"
                                  }`}
                                  disabled={assigningIds.has(`exam_${exam.id}`)}
                                  onClick={() => {
                                    if (!isAssigned) {
                                      handleAssignExam(
                                        exam.id,
                                        exam.title || exam.name
                                      );
                                    } else {
                                      handleUnassignExam(
                                        exam.id,
                                        exam.title || exam.name
                                      );
                                    }
                                  }}
                                >
                                  {assigningIds.has(`exam_${exam.id}`) ? (
                                    <>
                                      <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                      {isAssigned
                                        ? "Đang hoàn tác..."
                                        : "Đang giao..."}
                                    </>
                                  ) : isAssigned ? (
                                    <>
                                      <RotateCcw className="h-3 w-3 mr-2" />
                                      Hoàn tác giao bài
                                    </>
                                  ) : (
                                    "Giao bài kiểm tra"
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* No assignments message */}
                {(!lessonDataFromAPI?.homeworks ||
                  lessonDataFromAPI.homeworks.length === 0) &&
                  (!lessonDataFromAPI?.exams ||
                    lessonDataFromAPI.exams.length === 0) && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                        <FileText className="h-8 w-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-800 mb-2">
                        {t("dialog.noAssignmentsTitle")}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {t("dialog.noAssignmentsDesc")}
                      </p>
                    </div>
                  )}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
                  <AlertTriangle className="h-8 w-8 text-red-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-800 mb-2">
                  {t("dialog.loadFailedTitle")}
                </h3>
                <p className="text-sm text-slate-500">
                  {t("dialog.loadFailedDesc")}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
