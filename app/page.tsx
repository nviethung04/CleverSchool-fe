"use client"
import { Suspense, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/context/auth-context"
import { HeroSection } from "@/components/home/hero-section"
import { FeaturesSection } from "@/components/home/features-section"
import { LearningPathSection } from "@/components/home/learning-path-section"
import { TestimonialsSection } from "@/components/home/testimonials-section"
import { CTASection } from "@/components/home/cta-section"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"
import { useParams } from "next/navigation";
//
// Client function để get data (thay thế server function)
function getHomePageData() {
  return {
    stats: {
      totalStudents: 10000,
      totalCourses: 50,
      satisfactionRate: 98,
    },
    features: [
      {
        id: 1,
        icon: "BookOpen",
        title: "Lộ trình học cá nhân hóa",
        description: "Nội dung học tập được điều chỉnh theo trình độ và tốc độ học của từng người học",
        color: "blue",
      },
      {
        id: 2,
        icon: "BarChart",
        title: "Theo dõi tiến độ trực quan",
        description: "Phụ huynh và giáo viên dễ dàng theo dõi sự tiến bộ của người học qua biểu đồ và báo cáo chi tiết",
        color: "green",
      },
      {
        id: 3,
        icon: "Users",
        title: "Tương tác xã hội",
        description: "Người học có thể kết nối, giao tiếp và học tập cùng bạn bè trong môi trường an toàn",
        color: "yellow",
      },
      {
        id: 4,
        icon: "Gamepad2",
        title: "Học qua trò chơi",
        description: "Các trò chơi học tập giúp người học tiếp thu kiến thức một cách vui vẻ và hiệu quả",
        color: "orange",
      },
    ],
    testimonials: [
      {
        id: 1,
        name: "Nguyễn Thị Mai",
        role: "Phụ huynh học sinh lớp 3",
        content:
          "Con tôi rất thích học tiếng Anh trên web LMS. Các bài học được thiết kế phù hợp với khả năng của con, giúp con tiến bộ rõ rệt chỉ sau 3 tháng.",
        color: "blue",
      },
      {
        id: 2,
        name: "Trần Văn Hùng",
        role: "Phụ huynh học sinh lớp 5",
        content:
          "Tôi rất hài lòng với cách hệ thống theo dõi và báo cáo tiến độ học tập của con. Tôi có thể dễ dàng biết con đang học gì và cần hỗ trợ ở đâu.",
        color: "green",
      },
      {
        id: 3,
        name: "Lê Thị Hương",
        role: "Phụ huynh học sinh lớp 2",
        content:
          "Các trò chơi học tập trên hệ thống rất hấp dẫn, con tôi thường xuyên đòi được học tiếng Anh mỗi ngày. Đây là điều mà trước đây tôi chưa từng thấy.",
        color: "yellow",
      },
    ],
  }
}

// Client Component chính với logic authentication
export default function HomePage() {
  const { isAuthenticated, user, isLoading } = useAuth()
  const router = useRouter()
  const params = useParams();
  const locale = params?.locale || "vi";

  // Logic redirect nếu đã authenticated
  useEffect(() => {
    console.log("HomePage: isAuthenticated =", isAuthenticated, "user =", user, "isLoading =", isLoading);

    if (!isLoading && isAuthenticated && user) {
      console.log("HomePage: User đã đăng nhập, redirecting theo role:", user.type);

      // Redirect theo role của user
      if (user.type === "student") {
        router.replace(`/${locale}/assignments`);
      } else if (user.type === "teacher") {
        router.replace(`/${locale}/teacher/weekly-lessons`);
      } else if (user.type === "admin") {
        router.replace(`/${locale}/admin/dashboard`);
      }
    }
  }, [isAuthenticated, user, isLoading, router]);

  // Hiển thị loading khi đang kiểm tra auth hoặc đã login (đang redirect)
  if (isLoading || (isAuthenticated && user)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-4">
          {isLoading ? "Đang kiểm tra đăng nhập..." : "Đang chuyển hướng..."}
        </p>
      </div>
    )
  }

  // Nếu chưa đăng nhập, hiển thị trang chủ bình thường
  const data = getHomePageData()

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow">
        <HeroSection stats={data.stats} />

        <Suspense fallback={<LoadingSkeleton type="features" />}>
          <FeaturesSection features={data.features} />
        </Suspense>

        <Suspense fallback={<LoadingSkeleton type="learning-path" />}>
          <LearningPathSection />
        </Suspense>

        <Suspense fallback={<LoadingSkeleton type="testimonials" />}>
          <TestimonialsSection testimonials={data.testimonials} />
        </Suspense>

        <CTASection />
      </main>

      <Footer />
    </div>
  )
}
