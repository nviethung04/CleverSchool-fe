import Image from "next/image"

// Server Component
export function LearningPathSection() {
  return (
    <section className="py-16 cloud-bg">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-4">Lộ trình học tập trực quan</h2>
        <p className="text-center text-gray-600 max-w-2xl mx-auto mb-12">
          Theo dõi sự tiến bộ và phát triển kỹ năng của người học qua lộ trình học tập được thiết kế riêng
        </p>
        <div className="bg-white rounded-3xl shadow-lg p-6 max-w-4xl mx-auto">
          <Image
            src="/hethong.jpg"
            alt="Lộ trình học tập"
            width={900}
            height={500}
            className="w-full h-auto rounded-2xl"
          />
        </div>
      </div>
    </section>
  )
}
