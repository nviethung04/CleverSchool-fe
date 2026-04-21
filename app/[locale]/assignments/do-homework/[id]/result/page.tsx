"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Target, CheckCircle2 } from "lucide-react";
import { useTypedTranslations } from "@/lib/i18n/client";
import { AudioEffects } from "@/lib/utils/audio-utils";

interface FlyingStar {
  id: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

interface FlyingExp {
  id: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export default function ExamResultPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTypedTranslations("homeworkResult");
  const from = searchParams.get("from");
  const homeworkId = params.id as string;
  const locale = params?.locale || "vi";
  const hasManualScoring = searchParams.get("has_manual_scoring") === "true";
  const weekParam = searchParams.get("week");
  const courseIdParam = searchParams.get("courseId");

  // Đọc ratio từ localStorage thay vì URL params để bảo mật
  const [ratio, setRatio] = useState<number | undefined>(undefined);
  const [completionRate, setCompletionRate] = useState<number | undefined>(
    undefined
  );
  const [star, setStar] = useState<number | undefined>(undefined);
  const [exp, setExp] = useState<number | undefined>(undefined);

  // Bước 1: Đọc total_star và total_exp từ localStorage
  const [totalStars, setTotalStars] = useState<number>(0);
  const [displayedStars, setDisplayedStars] = useState<number>(0); // Số star đang hiển thị (tăng dần)
  const [totalExp, setTotalExp] = useState<number>(0);
  const [displayedExp, setDisplayedExp] = useState<number>(0); // Số exp đang hiển thị (tăng dần)

  // State cho animation
  const [flyingStars, setFlyingStars] = useState<FlyingStar[]>([]);
  const [flyingExps, setFlyingExps] = useState<FlyingExp[]>([]);
  const [isCollecting, setIsCollecting] = useState(false);
  const [shouldAnimateCounter, setShouldAnimateCounter] = useState(false);
  const [hasCollected, setHasCollected] = useState(false);
  const [isCountingUp, setIsCountingUp] = useState(false); // Đang trong quá trình count up
  const [hasTriggeredShake, setHasTriggeredShake] = useState(false); // Đã trigger animation lắc chưa

  // Bước 3: Đánh dấu vị trí "nguồn sao" (reward vừa nhận)
  const starSourceRef = useRef<HTMLDivElement>(null);
  const expSourceRef = useRef<HTMLDivElement>(null);

  // Bước 2: Tạo vị trí "điểm đến" cho sao bay - container
  const starDestinationRef = useRef<HTMLDivElement>(null);

  // Ref cho star icon - điểm đến thực sự của sao bay
  const starIconRef = useRef<HTMLDivElement>(null);
  const expIconRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedRatio = localStorage.getItem(`homework_${homeworkId}_ratio`);
    const storedCompletionRate = localStorage.getItem(
      `homework_${homeworkId}_completion_rate`
    );
    const storedStar = localStorage.getItem(`homework_${homeworkId}_star`);
    const storedExp = localStorage.getItem(`homework_${homeworkId}_exp`);
    const storedTotalStar = localStorage.getItem(
      `homework_${homeworkId}_total_star`
    );
    const storedTotalExp = localStorage.getItem(
      `homework_${homeworkId}_total_exp`
    );

    if (storedRatio !== null) {
      const parsedRatio = Number(storedRatio);
      if (!Number.isNaN(parsedRatio)) {
        setRatio(parsedRatio);
      }
      localStorage.removeItem(`homework_${homeworkId}_ratio`);
    }

    if (storedCompletionRate !== null) {
      const parsedCompletionRate = Number(storedCompletionRate);
      if (!Number.isNaN(parsedCompletionRate)) {
        setCompletionRate(parsedCompletionRate);
      }
      localStorage.removeItem(`homework_${homeworkId}_completion_rate`);
    }

    if (storedStar !== null) {
      const parsedStar = Number(storedStar);
      if (!Number.isNaN(parsedStar)) {
        setStar(parsedStar);
      }
      localStorage.removeItem(`homework_${homeworkId}_star`);
    }

    if (storedExp !== null) {
      const parsedExp = Number(storedExp);
      if (!Number.isNaN(parsedExp)) {
        setExp(parsedExp);
      }
      localStorage.removeItem(`homework_${homeworkId}_exp`);
    }

    if (storedTotalStar !== null) {
      const parsedTotalStar = Number(storedTotalStar);
      if (!Number.isNaN(parsedTotalStar)) {
        // Tính giá trị ban đầu: total_star - star (trừ đi số star vừa nhận)
        const starValue =
          storedStar !== null && !Number.isNaN(Number(storedStar))
            ? Number(storedStar)
            : 0;
        const initialStars = Math.max(0, parsedTotalStar - starValue);
        // Lưu giá trị ban đầu vào totalStars (sẽ cộng thêm star khi collect)
        setTotalStars(initialStars);
        setDisplayedStars(initialStars);
      }
      localStorage.removeItem(`homework_${homeworkId}_total_star`);
    }

    if (storedTotalExp !== null) {
      const parsedTotalExp = Number(storedTotalExp);
      if (!Number.isNaN(parsedTotalExp)) {
        // Tính giá trị ban đầu: total_exp - exp (trừ đi số exp vừa nhận)
        const expValue =
          storedExp !== null && !Number.isNaN(Number(storedExp))
            ? Number(storedExp)
            : 0;
        const initialExp = Math.max(0, parsedTotalExp - expValue);
        // Lưu giá trị ban đầu vào totalExp (sẽ cộng thêm exp khi collect)
        setTotalExp(initialExp);
        setDisplayedExp(initialExp);
      }
      localStorage.removeItem(`homework_${homeworkId}_total_exp`);
    }

    // Play success sound when result page loads
    const playSuccessSound = () => {
      AudioEffects.complete();
    };

    // Delay sound to sync with animation
    const timer = setTimeout(playSuccessSound, 800);

    return () => clearTimeout(timer);
  }, [homeworkId]);

  // Effect để tăng dần số star khi totalStars thay đổi
  useEffect(() => {
    if (totalStars !== displayedStars && !isCountingUp) {
      setIsCountingUp(true);
      const startValue = displayedStars;
      const endValue = totalStars;
      const duration = 1000; // 1 giây để tăng
      const steps = Math.min(Math.abs(endValue - startValue), 50); // Tối đa 50 bước
      const stepDuration = duration / steps;
      const increment = (endValue - startValue) / steps;

      let currentStep = 0;
      const timer = setInterval(() => {
        currentStep++;
        const newValue = Math.round(startValue + increment * currentStep);
        setDisplayedStars(newValue);

        if (currentStep >= steps) {
          setDisplayedStars(endValue);
          setIsCountingUp(false);
          clearInterval(timer);
        }
      }, stepDuration);

      return () => clearInterval(timer);
    }
  }, [totalStars]); // Chỉ theo dõi totalStars

  // Effect để tăng dần số exp khi totalExp thay đổi
  useEffect(() => {
    if (totalExp !== displayedExp && !isCountingUp) {
      const startValue = displayedExp;
      const endValue = totalExp;
      const duration = 1000; // 1 giây để tăng
      const steps = Math.min(Math.abs(endValue - startValue), 50); // Tối đa 50 bước
      const stepDuration = duration / steps;
      const increment = (endValue - startValue) / steps;

      let currentStep = 0;
      const timer = setInterval(() => {
        currentStep++;
        const newValue = Math.round(startValue + increment * currentStep);
        setDisplayedExp(newValue);

        if (currentStep >= steps) {
          setDisplayedExp(endValue);
          clearInterval(timer);
        }
      }, stepDuration);

      return () => clearInterval(timer);
    }
  }, [totalExp]); // Chỉ theo dõi totalExp

  // Effect để trigger animation lắc sau khi count up xong 0.5s
  useEffect(() => {
    if (!isCountingUp && hasCollected && !hasTriggeredShake) {
      // Đợi 0.5s sau khi count up xong
      const timer = setTimeout(() => {
        setShouldAnimateCounter(true);
        setHasTriggeredShake(true);
        // Sau 1s thì tắt animation lắc
        setTimeout(() => {
          setShouldAnimateCounter(false);
        }, 1000);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isCountingUp, hasCollected, hasTriggeredShake]);

  // Bước 5-7: Khi bấm Collect → lấy tọa độ DOM thật → Tạo animation "sao bay" → Sau khi animation kết thúc mới cộng sao
  const handleCollectStars = () => {
    if (!star || star <= 0 || isCollecting) return;

    setIsCollecting(true);

    // Bước 5: Lấy tọa độ DOM thật cho star
    const starSourceElement = starSourceRef.current;
    const starIconElement = starIconRef.current; // Lấy vị trí của star icon thay vì container

    if (!starSourceElement || !starIconElement) {
      setIsCollecting(false);
      return;
    }

    const starSourceRect = starSourceElement.getBoundingClientRect();
    const starIconRect = starIconElement.getBoundingClientRect();

    const starStartX = starSourceRect.left + starSourceRect.width / 2;
    const starStartY = starSourceRect.top + starSourceRect.height / 2;
    const starEndX = starIconRect.left + starIconRect.width / 2; // Điểm đến là center của star icon
    const starEndY = starIconRect.top + starIconRect.height / 2;

    // Bước 6: Tạo animation "sao bay" - Bay nhiều sao theo số lượng
    // Tính số sao bay: tối đa 30 sao, nhưng nếu star nhỏ hơn 30 thì bay đúng số đó
    const starCount = Math.min(star, 30);
    const starsToFly: FlyingStar[] = [];

    for (let i = 0; i < starCount; i++) {
      starsToFly.push({
        id: Date.now() + i, // Đảm bảo unique ID
        startX: starStartX + (Math.random() - 0.5) * 60,
        startY: starStartY + (Math.random() - 0.5) * 60,
        endX: starEndX,
        endY: starEndY,
      });
    }

    // Tạo animation "exp bay" nếu có exp
    let expsToFly: FlyingExp[] = [];
    if (exp && exp > 0) {
      const expSourceElement = expSourceRef.current;
      const expIconElement = expIconRef.current;

      if (expSourceElement && expIconElement) {
        const expSourceRect = expSourceElement.getBoundingClientRect();
        const expIconRect = expIconElement.getBoundingClientRect();

        const expStartX = expSourceRect.left + expSourceRect.width / 2;
        const expStartY = expSourceRect.top + expSourceRect.height / 2;
        const expEndX = expIconRect.left + expIconRect.width / 2;
        const expEndY = expIconRect.top + expIconRect.height / 2;

        const expCount = Math.min(exp, 30);
        for (let i = 0; i < expCount; i++) {
          expsToFly.push({
            id: Date.now() + 10000 + i, // Đảm bảo unique ID khác với star
            startX: expStartX + (Math.random() - 0.5) * 60,
            startY: expStartY + (Math.random() - 0.5) * 60,
            endX: expEndX,
            endY: expEndY,
          });
        }
      }
    }

    // Set flying stars và exps trước - dùng requestAnimationFrame để đảm bảo DOM đã sẵn sàng
    requestAnimationFrame(() => {
      setFlyingStars(starsToFly);
      if (expsToFly.length > 0) {
        setFlyingExps(expsToFly);
      }
    });

    // Bước 7: Sau khi animation kết thúc mới cộng sao và exp
    setTimeout(() => {
      setTotalStars((prev) => prev + star);
      if (exp) {
        setTotalExp((prev) => prev + exp);
      }
      setFlyingStars([]);
      setFlyingExps([]);
      setIsCollecting(false);
      setHasCollected(true); // Đánh dấu đã collect xong (để trigger count up)
    }, 1300); // Tăng lên 1.3s để đảm bảo animation hoàn thành
  };

  const handleOkClick = () => {
    // Play navigation sound when clicking OK button
    AudioEffects.navigate();

    if (from === "lesson-detail") {
      const courseId = courseIdParam || searchParams.get("courseId");
      const lessonId = searchParams.get("lessonId");
      if (courseId && lessonId) {
        let url = `/${locale}/courses/${courseId}/lesson/${lessonId}?tab=homework`;
        if (weekParam) {
          url += `&week=${weekParam}`;
        }
        if (courseId) {
          url += `&courseId=${courseId}`;
        }
        router.push(url);
      } else {
        let url = `/${locale}/assignments`;
        if (weekParam) {
          url += `?week=${weekParam}`;
        }
        if (courseId) {
          url += `${url.includes("?") ? "&" : "?"}courseId=${courseId}`;
        }
        router.push(url);
      }
    } else if (from === "progress-report") {
      // Set flag để trang progress-report biết cần xóa localStorage sau khi load xong
      try {
        sessionStorage.setItem("should_clear_progress_filters", "true");
      } catch (error) {
        console.error("Error setting clear flag:", error);
      }
      router.push(`/${locale}/progress-report`);
    } else {
      let url = `/${locale}/assignments`;
      if (weekParam) {
        url += `?week=${weekParam}`;
      }
      if (courseIdParam) {
        url += `${url.includes("?") ? "&" : "?"}courseId=${courseIdParam}`;
      }
      router.push(url);
    }
  };

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const isMobileDevice =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );
      const isMobileScreen = window.innerWidth <= 768;
      setIsMobile(isMobileDevice || isMobileScreen);
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);

    return () => {
      window.removeEventListener("resize", checkDevice);
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-8 relative">
      {/* Bước 2: Tạo vị trí "điểm đến" cho sao bay - Star Counter ở góc phải trên */}
      <motion.div
        ref={starDestinationRef}
        className="
    fixed top-4 right-4 z-50
    flex items-center gap-7
  "
        style={{ position: "fixed" }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4, type: "spring" }}
      >
        {/* Star Counter */}
        <motion.div
          className="
            relative
            flex items-center
            bg-white
            rounded-full
            pl-12 pr-5 py-2
            border border-[#FF9000]
            shadow-[0_4px_10px_rgba(255,144,0,0.25)]
          "
        >
          {/* Star icon – đè lên pill */}
          <motion.div
            ref={starIconRef}
            className="
              absolute
              -left-6
              flex items-center justify-center
            "
            style={{ transformOrigin: "center center" }}
            animate={
              shouldAnimateCounter
                ? {
                    rotate: [0, -10, 10, -10, 10, 0],
                    scale: [1, 1.2, 1.1, 1.2, 1.1, 1],
                    x: 0,
                    y: 0,
                  }
                : isCollecting
                ? {
                    scale: [1, 1.15, 1, 1.15, 1],
                    x: 0,
                    y: 0,
                  }
                : {
                    x: 0,
                    y: 0,
                    scale: 1,
                    rotate: 0,
                  }
            }
            transition={
              isCollecting
                ? {
                    duration: 0.4,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }
                : shouldAnimateCounter
                ? {
                    duration: 1,
                    ease: "easeOut",
                  }
                : {
                    duration: 0.3,
                    ease: "easeOut",
                  }
            }
          >
            <Image
              src="/images/star.png"
              alt="Star"
              width={50}
              height={50}
              className="drop-shadow-[0_3px_3px_rgba(0,0,0,0.35)]"
            />
          </motion.div>

          {/* Text */}
          <motion.span
            className="
              flex 
              justify-center
              text-lg
              font-bold
              text-[#FF9000]
              min-w-[4rem]
              text-right
              tracking-wide
            "
            animate={
              shouldAnimateCounter
                ? {
                    scale: [1, 1.25, 1.1, 1.25, 1],
                    y: [0, -4, 0],
                  }
                : {}
            }
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {displayedStars.toLocaleString()}
          </motion.span>
        </motion.div>

        {/* Exp Counter */}
        {displayedExp > 0 && (
          <motion.div
            className="
              relative
              flex items-center
              bg-white
              rounded-full
              pl-12 pr-5 py-2
              border border-[#A4D33D]
              shadow-[0_4px_10px_rgba(164,211,61,0.25)]
            "
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4, type: "spring" }}
          >
            {/* Exp icon – đè lên pill */}
            <motion.div
              ref={expIconRef}
              className="
                absolute
                -left-6
                flex items-center justify-center
              "
              style={{ transformOrigin: "center center" }}
              animate={
                shouldAnimateCounter
                  ? {
                      rotate: [0, -10, 10, -10, 10, 0],
                      scale: [1, 1.2, 1.1, 1.2, 1.1, 1],
                      x: 0,
                      y: 0,
                    }
                  : isCollecting
                  ? {
                      scale: [1, 1.15, 1, 1.15, 1],
                      x: 0,
                      y: 0,
                    }
                  : {
                      x: 0,
                      y: 0,
                      scale: 1,
                      rotate: 0,
                    }
              }
              transition={
                isCollecting
                  ? {
                      duration: 0.4,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "easeInOut",
                    }
                  : shouldAnimateCounter
                  ? {
                      duration: 1,
                      ease: "easeOut",
                    }
                  : {
                      duration: 0.3,
                      ease: "easeOut",
                    }
              }
            >
              <Image
                src="/images/exp.png"
                alt="Exp"
                width={34}
                height={34}
                className="drop-shadow-[0_3px_3px_rgba(0,0,0,0.35)]"
              />
            </motion.div>

            {/* Text */}
            <motion.span
              className="
                flex 
                justify-center
                text-lg
                font-bold
                text-[#A4D33D]
                min-w-[4rem]
                text-right
                tracking-wide
              "
              animate={
                shouldAnimateCounter
                  ? {
                      scale: [1, 1.25, 1.1, 1.25, 1],
                      y: [0, -4, 0],
                    }
                  : {}
              }
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              {displayedExp.toLocaleString()}
            </motion.span>
          </motion.div>
        )}
      </motion.div>

      {/* Bước 6: Animation "sao bay" - Bay nhiều sao theo số lượng */}
      {flyingStars.length > 0 && (
        <AnimatePresence>
          {flyingStars.map((flyingStar, index) => (
            <motion.div
              key={flyingStar.id}
              className="fixed z-[60] pointer-events-none"
              initial={{
                x: flyingStar.startX - 16,
                y: flyingStar.startY - 16,
                scale: 1,
                opacity: 1,
                rotate: 0,
              }}
              animate={{
                x: flyingStar.endX - 16,
                y: flyingStar.endY - 16,
                scale: [1, 1.4, 1.2, 0.8, 0.5],
                opacity: [1, 1, 1, 0.8, 0],
                rotate: [0, 90, 180, 270, 360],
              }}
              exit={{
                opacity: 0,
                scale: 0,
              }}
              transition={{
                duration: 1.2,
                ease: [0.25, 0.46, 0.45, 0.94],
                delay: index * 0.015, // Delay nhỏ để sao bay gần như đồng thời
              }}
              style={{
                willChange: "transform, opacity",
                left: 0,
                top: 0,
              }}
            >
              <Image
                src="/images/star.png"
                alt="Flying Star"
                width={32}
                height={32}
                className="drop-shadow-lg"
                priority
                unoptimized
              />
            </motion.div>
          ))}
        </AnimatePresence>
      )}

      {/* Animation "exp bay" - Bay nhiều exp theo số lượng */}
      {flyingExps.length > 0 && (
        <AnimatePresence>
          {flyingExps.map((flyingExp, index) => (
            <motion.div
              key={flyingExp.id}
              className="fixed z-[60] pointer-events-none"
              initial={{
                x: flyingExp.startX - 16,
                y: flyingExp.startY - 16,
                scale: 1,
                opacity: 1,
                rotate: 0,
              }}
              animate={{
                x: flyingExp.endX - 16,
                y: flyingExp.endY - 16,
                scale: [1, 1.4, 1.2, 0.8, 0.5],
                opacity: [1, 1, 1, 0.8, 0],
                rotate: [0, 90, 180, 270, 360],
              }}
              exit={{
                opacity: 0,
                scale: 0,
              }}
              transition={{
                duration: 1.2,
                ease: [0.25, 0.46, 0.45, 0.94],
                delay: index * 0.015, // Delay nhỏ để exp bay gần như đồng thời
              }}
              style={{
                willChange: "transform, opacity",
                left: 0,
                top: 0,
              }}
            >
              <Image
                src="/images/exp.png"
                alt="Flying Exp"
                width={32}
                height={32}
                className="drop-shadow-lg"
                priority
                unoptimized
              />
            </motion.div>
          ))}
        </AnimatePresence>
      )}

      {/* Main Content Card */}
      <motion.div
        className="p-12 max-w-3xl w-full relative overflow-hidden"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{ minHeight: "500px" }}
      >
        {/* Decorative Elements Inside Card */}
        {/* UFO - Top Right */}
        <motion.div
          className="absolute top-20 right-28 z-0"
          animate={{ x: [0, 15, 0], y: [0, -8, 0] }}
          transition={{
            duration: 4,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        >
          <Image
            src="/images/ufo.png"
            alt="UFO"
            width={140}
            height={83}
            className="opacity-80"
          />
        </motion.div>

        {/* Stars Inside Card */}
        <motion.div
          className="absolute top-16 left-16 z-0"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{
            duration: 2,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        ></motion.div>

        {/* Bottom Stars - repositioned to match the image */}
        <motion.div
          className="absolute bottom-16 right-20 z-0"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{
            duration: 2.5,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: 0.5,
          }}
        ></motion.div>

        <motion.div
          className="absolute bottom-40 right-20 z-0"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{
            duration: 3,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: 1,
          }}
        ></motion.div>

        {/* Title */}
        <motion.div
          className="text-center mb-4 relative z-10"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-[#32428D]">
            {t("exerciseCompleted")}
          </h1>
        </motion.div>

        {/* Content Area */}
        <div className="flex justify-center z-10">
          {/* Robot Character - Bottom Left */}
          {!isMobile && (
            <motion.div
              className="absolute bottom-16 left-8 flex-shrink-0"
              initial={{ scale: 0, x: -50 }}
              animate={{ scale: 1, x: 0 }}
              transition={{
                delay: 0.4,
                duration: 0.6,
                type: "spring",
                stiffness: 200,
              }}
            >
              <Image
                src="/images/robot-sparkle.png"
                alt="Happy Robot"
                width={150}
                height={150}
                className="drop-shadow-lg"
              />
            </motion.div>
          )}

          {/* Score and Time Section - Centered */}
          <motion.div
            className="flex-1 max-w-md"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            {/* Card */}
            <div className="bg-white rounded-[3rem] p-8 shadow-sm">
              {/* Congratulations */}
              <div className="text-center">
                {/* Score display - Hiển thị Tỉ lệ hoàn thành và Tỉ lệ làm đúng trong 1 container chia 2 cột */}
                {(typeof completionRate === "number" &&
                  !Number.isNaN(completionRate)) ||
                (typeof ratio === "number" && !Number.isNaN(ratio)) ? (
                  <div className="flex flex-col items-center justify-center mb-4">
                    {/* Text labels - ở ngoài background */}
                    <div className="flex items-center gap-6 mb-2 -ml-4">
                      {typeof completionRate === "number" &&
                        !Number.isNaN(completionRate) && (
                          <p className="text-[#0078FF] text-lg font-semibold">
                            {t("completionRateLabel")}
                          </p>
                        )}
                      {typeof ratio === "number" && !Number.isNaN(ratio) && (
                        <p className="text-[#0078FF] text-lg font-semibold">
                          {t("accuracyRateLabel")}
                        </p>
                      )}
                    </div>
                    {/* Container có background chứa 2 giá trị */}
                    <div
                      className="
                        flex items-center
                        bg-[#EBFEFF]
                        rounded-full
                        px-6
                        gap-6
                      "
                    >
                      {/* Tỉ lệ hoàn thành - Cột trái */}
                      {typeof completionRate === "number" &&
                        !Number.isNaN(completionRate) && (
                          <>
                            <div className="flex items-center gap-3">
                              <CheckCircle2
                                className="w-7 h-7 text-[#0078FF]"
                                strokeWidth={2.5}
                              />
                              <span className="text-[#0078FF] text-3xl font-bold">
                                {Math.round(completionRate)}%
                              </span>
                            </div>
                            {/* Đường kẻ phân cách */}
                            {typeof ratio === "number" &&
                              !Number.isNaN(ratio) && (
                                <div className="h-16 w-px bg-[#0078FF] opacity-30"></div>
                              )}
                          </>
                        )}
                      {/* Tỉ lệ làm đúng - Cột phải */}
                      {typeof ratio === "number" && !Number.isNaN(ratio) && (
                        <div className="flex items-center gap-3">
                          <Target
                            className="w-7 h-7 text-[#0078FF]"
                            strokeWidth={2.5}
                          />
                          <span className="text-[#0078FF] text-3xl font-bold">
                            {Math.round(ratio)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}

                {/* Star display (icon + value) */}
                <p className="text-[#32428D] text-xl font-bold mb-1">
                  {t("yourRewards")}
                </p>
                {typeof star === "number" && !Number.isNaN(star) && (
                  <div className="flex flex-col items-center gap-3">
                    {/* Bước 3: Đánh dấu vị trí "nguồn sao" (reward vừa nhận) */}
                    <div className="flex items-center gap-3">
                      <div
                        ref={starSourceRef}
                        className="
                          inline-flex items-center justify-center gap-2
                          bg-[#FFFFEA]
                          border border-[#FF9000]
                          px-4 py-1
                          rounded-full
                        "
                      >
                        <Image
                          src="/images/star.png"
                          alt="Star"
                          width={32}
                          height={32}
                          className="drop-shadow-md"
                        />
                        <span className="text-xl font-bold text-[#FD9B1A]">
                          {star}
                        </span>
                      </div>
                      {typeof exp === "number" && !Number.isNaN(exp) && (
                        <div
                          ref={expSourceRef}
                          className="
                            inline-flex items-center justify-center gap-2
                            bg-[#F5FFE3]
                            border border-[#A4D33D]
                            px-4 py-1
                            rounded-full
                          "
                        >
                          <Image
                            src="/images/exp.png"
                            alt="Exp"
                            width={20}
                            height={20}
                            className="drop-shadow-md"
                          />
                          <span className="text-xl font-bold text-[#A4D33D]">
                            {exp}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Teacher note - chỉ hiển thị khi has_manual_scoring = true */}
                {hasManualScoring && (
                  <p className="text-sm text-gray-600 mt-4">
                    {t("teacherWillCheckSoon")}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* OK Button - Thay đổi thành nút Thu thập nếu chưa collect, Hoàn thành nếu đã collect */}
        <div className="flex justify-center">
          <motion.div
            className="mt-8 relative z-10"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.5 }}
          >
            {typeof star === "number" &&
            !Number.isNaN(star) &&
            !hasCollected ? (
              // Nút Thu thập (thay thế nút Hoàn thành ban đầu)
              <motion.button
                onClick={handleCollectStars}
                disabled={isCollecting}
                className={`bg-[#4285F4] hover:bg-[#3367D6] text-white font-bold py-4 rounded-full text-xl shadow-lg transition-all duration-200
                  ${isMobile ? "px-10" : "px-16"}
                `}
                whileHover={{ scale: isCollecting ? 1 : 1.05 }}
                whileTap={{ scale: isCollecting ? 1 : 0.95 }}
              >
                {isCollecting ? "Đang thu thập..." : "Thu thập"}
              </motion.button>
            ) : (
              // Nút Hoàn thành (sau khi đã collect hoặc không có star)
              <motion.button
                onClick={handleOkClick}
                className={`bg-[#4285F4] hover:bg-[#3367D6] text-white font-bold py-4 rounded-full text-xl shadow-lg transition-all duration-200 
                  ${isMobile ? "px-10" : "px-16"}
                `}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {t("complete")}
              </motion.button>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
