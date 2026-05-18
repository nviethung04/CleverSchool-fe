"use client";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import Image from "next/image";

export default function TeachingStaffPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
        {/* Title Section at Top */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-[#FF870D] mb-3">
            Đội ngũ giáo viên Clever School
          </h1>
          <h2 className="text-2xl md:text-3xl font-bold text-[#003A8C]">
            Chuyên nghiệp, tận tâm, và đầy kinh nghiệm
          </h2>
        </div>

        {/* Top Section: Image + Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12 md:mb-16">
          {/* Image Section - Left */}
          <div className="w-full">
            <div className="relative w-full h-full min-h-[400px] rounded-lg overflow-hidden border-2 border-[#FF870D]">
              <Image
                src="/teaching-staff/image1.jpg"
                alt="Đội ngũ giáo viên Clever School"
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* Content Section - Right */}
          <div className="flex flex-col justify-center">
            <div className="space-y-4 text-[#003A8C] leading-relaxed mb-8 font-medium">
              <p>
                <strong>
                  <span className="text-[#FF870D]">Tại Clever School,</span>
                </strong>{" "}
                chúng tôi tự hào sở hữu đội ngũ giáo viên xuất sắc đến từ Việt
                Nam và quốc tế. Mỗi thầy cô đều là những người tận tâm, am hiểu
                giáo dục hiện đại, và luôn sẵn sàng đồng hành cùng học viên trên
                hành trình chinh phục tri thức.
              </p>
            </div>

            {/* Feature Icons */}
            <div className="grid grid-cols-3 gap-4">
              {/* Excellent */}
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 mb-3 flex items-center justify-center">
                  <Image
                    src="/teaching-staff/icon1.png"
                    alt="Xuất sắc"
                    width={64}
                    height={64}
                    className="object-contain"
                  />
                </div>
                <p className="text-[#FF870D] font-semibold">Xuất sắc</p>
              </div>

              {/* Modern */}
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 mb-3 flex items-center justify-center">
                  <Image
                    src="/about/icon5.png"
                    alt="Hiện đại"
                    width={64}
                    height={64}
                    className="object-contain"
                  />
                </div>
                <p className="text-[#A5C54B] font-semibold">Hiện đại</p>
              </div>

              {/* Dedicated */}
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 mb-3 flex items-center justify-center">
                  <Image
                    src="/about/icon6.png"
                    alt="Tận tâm"
                    width={64}
                    height={64}
                    className="object-contain"
                  />
                </div>
                <p className="text-[#44C7F4] font-semibold">Tận tâm</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Large Image */}
        <div className="mb-12 md:mb-16">
          <div className="relative w-full h-[600px] md:h-[700px] rounded-lg overflow-hidden shadow-lg border-2 border-[#A5C54B]">
            <Image
              src="/teaching-staff/image2.jpg"
              alt="Giáo viên và học sinh Clever School"
              fill
              className="object-cover"
            />
          </div>
        </div>

        {/* Strength of Team Section */}
        <div className="mb-12 md:mb-16 mt-12 md:mt-16">
          {/* Title */}
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-2">
              <span className="text-[#003A8C]">Sức mạnh đội ngũ </span>
              <span className="text-[#FF870D]">Clever School</span>
            </h2>
          </div>

          {/* Statistics Sections */}
          <div className="space-y-8 md:space-y-12 max-w-5xl mx-auto">
            {/* Section 1: Vietnamese Teachers */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr] items-center gap-4 md:gap-6">
              <div className="pr-4 md:pr-8">
                <div className="text-6xl md:text-7xl font-bold text-[#FF870D] mb-2">
                  200+
                </div>
                <div className="text-xl md:text-2xl font-semibold text-[#003A8C]">
                  Giáo viên Việt Nam
                </div>
              </div>
              <div className="text-[#003A8C] leading-relaxed text-lg font-semibold pl-4 md:pl-8">
                Giáo viên có chuyên môn vững vàng, giàu kinh nghiệm thực tế và
                hiểu rõ phong cách học tập của học sinh Việt Nam.
              </div>
            </div>

            {/* Section 2: Foreign Teachers */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr] items-center gap-4 md:gap-6">
              <div className="pr-4 md:pr-8">
                <div className="text-6xl md:text-7xl font-bold text-[#A5C54B] mb-2">
                  100+
                </div>
                <div className="text-xl md:text-2xl font-semibold text-[#003A8C]">
                  Giáo viên nước ngoài
                </div>
              </div>
              <div className="text-[#003A8C] leading-relaxed text-lg font-semibold pl-4 md:pl-8">
                Đến từ các quốc gia nói tiếng Anh như Anh, Mỹ, Úc, Canada và Nam
                Phi,... với nhiều năm kinh nghiệm giảng dạy tiếng Anh tại Việt
                Nam.
              </div>
            </div>

            {/* Section 3: Academic Qualifications */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr] items-center gap-4 md:gap-6">
              <div className="pr-4 md:pr-8">
                <div className="flex items-baseline gap-2 mb-2">
                  <div className="text-6xl md:text-7xl font-bold text-[#7ED4FF]">
                    5%
                  </div>
                  <span className="text-4xl md:text-5xl font-bold text-[#003A8C]">
                    &
                  </span>
                  <div className="text-6xl md:text-7xl font-bold text-[#9B59B6]">
                    95%
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="text-xl md:text-2xl font-semibold text-[#003A8C]">
                    Thạc sĩ
                  </div>
                  <div className="text-xl md:text-2xl font-semibold text-[#003A8C]">
                    Cử nhân
                  </div>
                </div>
              </div>
              <div className="text-[#003A8C] leading-relaxed text-lg font-semibold pl-4 md:pl-8">
                5% đội ngũ giáo viên có bằng Thạc sĩ – 95% có bằng Cử nhân, với
                trình độ chuyên môn cao, đảm bảo chất lượng giảng dạy đạt chuẩn.
              </div>
            </div>

            {/* Section 4: Full-time Teachers */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr] items-center gap-4 md:gap-6">
              <div className="pr-4 md:pr-8">
                <div className="text-6xl md:text-7xl font-bold text-[#FF870D] mb-2">
                  85%
                </div>
                <div className="text-xl md:text-2xl font-semibold text-[#003A8C]">
                  Giáo viên toàn thời gian
                </div>
              </div>
              <div className="text-[#003A8C] leading-relaxed text-lg font-semibold pl-4 md:pl-8">
                Luôn tận tâm, thấu hiểu và theo dõi sát sao tình hình học tập
                của mỗi học sinh, đảm bảo hiệu quả và chất lượng học tập.
              </div>
            </div>
          </div>
        </div>

        {/* Expert Team Section */}
        {/* Title */}
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-2">
            <span className="text-[#003A8C]">
              Đội ngũ
              <strong>
                <span className="text-[#FF870D]"> chuyên gia</span>
              </strong>{" "}
              từ:
            </span>
          </h2>
        </div>

        {/* Logo Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto mb-8 md:mb-12">
          {/* Logo 1 - Hanoi University */}
          <div className="bg-white rounded-xl p-6 md:p-8 shadow-md flex flex-col items-center">
            <div className="w-24 h-24 md:w-32 md:h-32 mb-4 flex items-center justify-center">
              <Image
                src="/teaching-staff/logo1.png"
                alt="Đại học Hà Nội"
                width={128}
                height={128}
                className="object-contain"
              />
            </div>
            <p className="text-[#003A8C] font-semibold text-lg md:text-xl text-center">
              Đại học Hà Nội
            </p>
          </div>

          {/* Logo 2 - IEUK */}
          <div className="bg-white rounded-xl p-6 md:p-8 shadow-md flex flex-col items-center">
            <div className="w-24 h-24 md:w-32 md:h-32 mb-4 flex items-center justify-center">
              <Image
                src="/teaching-staff/logo2.png"
                alt="IEUK - Imperial English UK"
                width={128}
                height={128}
                className="object-contain"
              />
            </div>
            <p className="text-[#003A8C] font-semibold text-lg md:text-xl text-center">
              IEUK - Imperial English UK
            </p>
          </div>
        </div>

        {/* Description Text */}
        <div className="text-center mb-8 md:mb-12 max-w-4xl mx-auto">
          <p className="text-[#003A8C] text-lg md:text-xl leading-relaxed font-semibold">
            Các chuyên gia học thuật hàng đầu hỗ trợ xây dựng chương trình, đào
            tạo và phát triển năng lực giảng dạy cho toàn bộ giáo viên Clever School.
          </p>
        </div>

        {/* Training Image */}
        <div className="mb-12 md:mb-16">
          <div className="relative w-full h-[800px] md:h-[900px] rounded-lg overflow-hidden shadow-lg border-2 border-[#FF870D]">
            <Image
              src="/teaching-staff/image3.jpg"
              alt="Giáo viên và học sinh Clever School"
              fill
              className="object-cover"
            />
          </div>
        </div>

        <div className="mb-12 md:mb-16">
          <div className="relative w-full h-[800px] md:h-[900px] rounded-lg overflow-hidden shadow-lg border-2 border-[#8ADCF8]">
            <Image
              src="/teaching-staff/image4.jpg"
              alt="Giáo viên và học sinh Clever School"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
