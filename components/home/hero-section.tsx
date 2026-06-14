import Link from "next/link"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface HeroSectionProps {
  stats: {
    totalStudents: number
    totalCourses: number
    satisfactionRate: number
  }
}

// Server Component
export function HeroSection({ stats }: HeroSectionProps) {
  return (
    <section className="py-16 md:py-24 cloud-bg relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-10 left-10 w-20 h-20 rounded-full bg-cs-yellow opacity-50 animate-bounce"></div>
      <div
        className="absolute bottom-10 right-10 w-16 h-16 rounded-full bg-cs-orange opacity-50 animate-bounce"
        style={{ animationDelay: "0.5s" }}
      ></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              Staging Học tiếng Anh <span className="text-cs-blue">vui vẻ</span> cùng Clever School!
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Hệ thống học tập thông minh giúp người học phát triển kỹ năng tiếng Anh theo lộ trình riêng, phù hợp với khả
              năng và sở thích của từng em.
            </p>

            {/* Stats - Server rendered */}
            <div className="flex gap-6 mb-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-cs-blue">{stats.totalStudents.toLocaleString()}+</div>
                <div className="text-sm text-gray-600">Học sinh</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-cs-green">{stats.totalCourses}+</div>
                <div className="text-sm text-gray-600">Khóa học</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-cs-yellow">{stats.satisfactionRate}%</div>
                <div className="text-sm text-gray-600">Hài lòng</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="rounded-full bg-cs-yellow text-black hover:bg-yellow-400" asChild>
                <Link href="/register">Bắt đầu học ngay</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full border-cs-blue text-cs-blue"
                asChild
              >
                <Link href="/about">Tìm hiểu thêm</Link>
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-cs-green rounded-full opacity-20"></div>
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-cs-blue rounded-full opacity-20"></div>
            <Image
              src="/giaoduc.jpg"
              alt="Người học học tiếng Anh"
              width={500}
              height={400}
              className="rounded-2xl shadow-lg relative z-10"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  )
}
