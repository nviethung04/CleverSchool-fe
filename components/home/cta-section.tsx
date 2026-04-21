import { Button } from "@/components/ui/button"
import Link from "next/link"

// Server Component
export function CTASection() {
  return (
    <section className="py-16 bg-enspire-blue">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold text-white mb-6">Sẵn sàng cho hành trình học tiếng Anh?</h2>
        <p className="text-white text-lg mb-8 max-w-2xl mx-auto">
          Đăng ký ngay hôm nay để con bạn được trải nghiệm phương pháp học tiếng Anh cá thể hóa hiệu quả nhất
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button size="lg" className="rounded-full bg-enspire-yellow text-black hover:bg-yellow-400" asChild>
            <Link href="/register">Đăng ký miễn phí</Link>
          </Button>
          <Button
            size="lg"
            className="rounded-full bg-enspire-yellow text-black hover:bg-yellow-400 transition-all duration-200 shadow-lg hover:shadow-xl"
            asChild
          >
            <a href="enspireonline://open">Enspire Online</a>
          </Button>
          {/* <Button
            size="lg"
            className="rounded-full bg-enspire-yellow text-black hover:bg-yellow-400 transition-all duration-200 shadow-lg hover:shadow-xl"
            asChild
          >
            <Link href="/interactive-video">Video Tương Tác</Link>
          </Button> */}
        </div>
      </div>
    </section>
  )
}
