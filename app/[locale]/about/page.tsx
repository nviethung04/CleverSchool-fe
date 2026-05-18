"use client";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import Image from "next/image";

export default function AboutPage() {
  const youtubeVideoId = "e2XM9vzJG-4";
  const youtubeEmbedUrl = `https://www.youtube.com/embed/${youtubeVideoId}?start=4`;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
        {/* Top Section: Video + Story */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12 md:mb-16">
          {/* Video Section - Left */}
          <div className="w-full">
            <div
              className="relative w-full"
              style={{ paddingBottom: "56.25%" }}
            >
              <iframe
                className="absolute top-0 left-0 w-full h-full rounded-lg shadow-lg"
                src={youtubeEmbedUrl}
                title="Clever School Education Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>

          {/* Story Section - Right */}
          <div className="flex flex-col justify-center">
            <h2 className="text-3xl md:text-4xl font-bold text-[#003A8C] mb-6">
              Câu chuyện của chúng tôi
            </h2>
            <div className="space-y-4 text-[#003A8C] leading-relaxed">
              <p>
                <strong>
                  <span className="text-[#FF870D]">
                    Học viện Anh ngữ Clever School
                  </span>
                </strong>{" "}
                tiền thân là Vietedutech được thành lập năm 2006. Sau gần 15 năm
                xây dựng và phát triển, Clever School đã cung cấp nhiều khóa học Ngoại
                ngữ và phương pháp giảng dạy chất lượng cao, đào tạo cho hàng
                trăm ngàn lượt học sinh và học viên từ mầm non, tiểu học, THCS…
                và các khóa học ngoại ngữ chuyên ngành chất lượng cao cho người
                lớn. Với đội ngũ Quản lý và giáo viên chuyên nghiệp, đạt chuẩn,
                Clever School luôn tự hào và cam kết chất lượng đào tạo, đáp ứng nhu
                cầu của người học.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Section: Vision, Mission, Core Values */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {/* Vision Box */}
          <div className="bg-white rounded-xl p-6 md:p-8 shadow-md border-2 border-[#EEB31D] hover:shadow-lg transition-shadow">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center overflow-hidden">
                <Image
                  src="/about/icon1.png"
                  alt="Tầm nhìn"
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </div>
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-[#003A8C] mb-4 text-center">
              TẦM NHÌN
            </h3>
            <p className="text-[#003A8C] text-center leading-relaxed">
              Clever School định hướng phát triển trở thành Tập đoàn Giáo dục và Công
              nghệ hàng đầu trong khu vực, với triết lý giáo dục phương tây, giá
              trị phương đông.
            </p>
          </div>

          {/* Mission Box */}
          <div className="bg-white rounded-xl p-6 md:p-8 shadow-md border-2 border-[#A5C54B] hover:shadow-lg transition-shadow">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center overflow-hidden">
                <Image
                  src="/about/icon2.png"
                  alt="Sứ mệnh"
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </div>
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-[#003A8C] mb-4 text-center">
              SỨ MỆNH
            </h3>
            <p className="text-[#003A8C] text-center leading-relaxed">
              Kiến tạo và cung cấp cho xã hội các sản phẩm hoàn thiện, chất
              lượng cao phục vụ phát triển và hội nhập của đất nước.
            </p>
          </div>

          {/* Core Values Box */}
          <div className="bg-white rounded-xl p-6 md:p-8 shadow-md border-2 border-[#44C7F4] hover:shadow-lg transition-shadow">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                <Image
                  src="/about/icon3.png"
                  alt="Giá trị cốt lõi"
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </div>
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-[#003A8C] mb-4 text-center">
              GIÁ TRỊ CỐT LÕI
            </h3>
            <p className="text-[#003A8C] text-center leading-relaxed">
              Tận tâm, Thấu hiểu, Trách nhiệm và Truyền cảm hứng.
            </p>
          </div>
        </div>

        {/* Why Choose Us Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12 md:mb-16 mt-12 md:mt-16">
          {/* Image Section - Left */}
          <div className="w-full">
            <div className="relative w-full h-full min-h-[400px] rounded-lg overflow-hidden">
              <Image
                src="/about/image1.png"
                alt="Clever School Education"
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* Content Section - Right */}
          <div className="flex flex-col justify-center">
            <h2 className="text-3xl md:text-4xl font-bold text-[#003A8C] mb-6">
              Vì sao chọn chúng tôi
            </h2>
            <div className="space-y-4 text-[#003A8C] leading-relaxed mb-8">
              <p>
                <strong>
                  <span className="text-[#FF870D]">Clever School</span>
                </strong>{" "}
                là nhà cung cấp dịch vụ tư vấn, giảng dạy hàng đầu luôn làm hài
                lòng đối tác và các nhà đầu tư với giải pháp tối ưu cho các yêu
                cầu cụ thể của khách hàng; đảm bảo chất lượng dịch vụ và chi phí
                hợp lý. Chúng tôi coi công việc của đối tác là của chính mình và
                tìm mọi giải pháp đảm bảo chất lượng và mong đợi của khách hàng.
                Đội ngũ quản lý tốt nghiệp ở nước ngoài và nhân viên giỏi ngoại
                ngữ, thành thạo công nghệ, sáng tạo, đổi mới luôn đáp ứng tốt
                các yêu cầu công việc của các cơ quan và nhà trường. Chúng tôi
                luôn khuyến khích các ý tưởng sáng tạo, đáp ứng linh hoạt yêu
                cầu của các cơ quan và nhà trường. Chúng tôi cam kết chất lượng
                dịch vụ và thông tin tư vấn của chúng tôi chân thực, thực tiễn,
                đáng tin cậy để tối ưu hóa kết quả của chương trình, dự án.
                Chúng tôi luôn lắng nghe và đồng hành cùng các cơ quan, nhà
                trường trong suốt quá trình từ khi hình thành dự án tới khi
                triển khai và sau khi hoàn tất dự án, đảm bảo tính bền vững của
                dự án. Sẵn sàng cam kết đầu ra của sản phẩm.
              </p>
            </div>

            {/* Features with Icons */}
            <div className="grid grid-cols-3 gap-4">
              {/* Professional */}
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 mb-3 flex items-center justify-center">
                  <Image
                    src="/about/icon4.png"
                    alt="Chuyên nghiệp"
                    width={64}
                    height={64}
                    className="object-contain"
                  />
                </div>
                <p className="text-[#E98724] font-semibold">Chuyên nghiệp</p>
              </div>

              {/* Creative */}
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 mb-3 flex items-center justify-center">
                  <Image
                    src="/about/icon5.png"
                    alt="Sáng tạo"
                    width={64}
                    height={64}
                    className="object-contain"
                  />
                </div>
                <p className="text-[#A5C54B] font-semibold">Sáng tạo</p>
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

        {/* Development Strategy Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12 md:mb-16 mt-12 md:mt-16">
          {/* Content Section - Left */}
          <div className="flex flex-col justify-center">
            <h2 className="text-3xl md:text-4xl font-bold text-[#003A8C] mb-6">
              Chiến lược phát triển
            </h2>
            <ul className="space-y-3 text-[#003A8C] leading-relaxed mb-6">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>
                  Đội ngũ cán bộ giáo viên tâm huyết, trình độ chuyên môn cao.
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>
                  Luôn đổi mới, đi đầu trong ứng dụng công nghệ, phương pháp
                  mới, nghiên cứu khoa học.
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>
                  Cung cấp các khóa đào tạo chất lượng quốc tế cho các giáo
                  viên.
                </span>
              </li>
            </ul>

            {/* Small Icons */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 mb-2 flex items-center justify-center">
                  <Image
                    src="/about/icon7.png"
                    alt="Chất lượng"
                    width={48}
                    height={48}
                    className="object-contain"
                  />
                </div>
                <p className="text-[#A5C54B] text-sm font-semibold">
                  Chất lượng
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 mb-2 flex items-center justify-center">
                  <Image
                    src="/about/icon8.png"
                    alt="Khoa học"
                    width={48}
                    height={48}
                    className="object-contain"
                  />
                </div>
                <p className="text-[#44C7F4] text-sm font-semibold">Khoa học</p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 mb-2 flex items-center justify-center">
                  <Image
                    src="/about/icon9.png"
                    alt="Thành đạt"
                    width={48}
                    height={48}
                    className="object-contain"
                  />
                </div>
                <p className="text-[#8880B4] text-sm font-semibold">
                  Thành đạt
                </p>
              </div>
            </div>
          </div>

          {/* Image Section - Right */}
          <div className="w-full">
            <div className="relative w-full h-full min-h-[400px] rounded-lg overflow-hidden">
              <Image
                src="/about/image2.png"
                alt="Chiến lược phát triển"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>

        {/* Working Principles Section */}
        <div className="mb-12 md:mb-16 mt-12 md:mt-16">
          <div className="text-center mb-8">
            <h3 className="text-xl md:text-2xl italic font-medium text-[#003A8C] mb-2">
              Nguyên tắc làm việc
            </h3>
            <h2 className="text-3xl md:text-4xl font-bold text-[#003A8C]">
              Chúng tôi luôn xem trọng quy tắc làm việc
            </h2>
          </div>

          {/* Three Boxes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {/* Box 1 - Benefits for Students */}
            <div className="bg-white rounded-xl p-6 md:p-8 shadow-md border-2 border-[#8880B4] hover:shadow-lg transition-shadow">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-[rgba(191,179,255,0.2)] flex items-center justify-center overflow-hidden">
                  <Image
                    src="/about/icon10.png"
                    alt="Lợi ích cho học viên"
                    width={32}
                    height={32}
                    className="object-contain"
                  />
                </div>
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-[#003A8C] text-center">
                Lợi ích cho học viên
              </h3>
            </div>

            {/* Box 2 - Creativity */}
            <div className="bg-white rounded-xl p-6 md:p-8 shadow-md border-2 border-[#44C7F4] hover:shadow-lg transition-shadow">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-[rgba(110,218,255,0.2)] flex items-center justify-center overflow-hidden">
                  <Image
                    src="/about/icon11.png"
                    alt="Sáng tạo"
                    width={32}
                    height={32}
                    className="object-contain"
                  />
                </div>
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-[#003A8C] text-center">
                Sáng tạo
              </h3>
            </div>

            {/* Box 3 - Best Achievements */}
            <div className="bg-white rounded-xl p-6 md:p-8 shadow-md border-2 border-[#A5C54B] hover:shadow-lg transition-shadow">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-[rgba(203,255,55,0.2)] flex items-center justify-center overflow-hidden">
                  <Image
                    src="/about/icon12.png"
                    alt="Thành tích tốt nhất"
                    width={32}
                    height={32}
                    className="object-contain"
                  />
                </div>
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-[#003A8C] text-center">
                Thành tích tốt nhất
              </h3>
            </div>
          </div>
        </div>

        {/* Partners Section */}
        <div className="mb-12 md:mb-16 mt-12 md:mt-16">
          {/* Domestic Partners */}
          <div className="mb-12 md:mb-16">
            <h2 className="text-xl md:text-2xl italic font-medium text-[#003A8C] mb-2 text-center">
              Đối tác trong nước
            </h2>
            <p className="text-[#003A8C] font-bold text-center text-3xl md:text-4xl mb-8">
              Những đối tác trong nước đã liên kết với Clever School
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-6 md:gap-8">
              {/* Images 48-55 for Domestic Partners */}
              {[48, 49, 50, 51, 52, 53, 54, 55].map((num) => (
                <div
                  key={`domestic-${num}`}
                  className="flex items-center justify-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <Image
                    src={`/about/image ${num}.png`}
                    alt="Đối tác trong nước"
                    width={150}
                    height={100}
                    className="object-contain max-h-24"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* International Partners */}
          <div>
            <h2 className="text-xl md:text-2xl italic font-medium text-[#003A8C] mb-2 text-center">
              Đối tác nước ngoài
            </h2>
            <p className="text-[#003A8C] font-bold text-center text-3xl md:text-4xl mb-8">
              Những đối tác nước ngoài đã liên kết với Clever School
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 md:gap-8">
              {/* Images 56-61 for International Partners */}
              {[56, 57, 58, 59, 60, 61].map((num) => (
                <div
                  key={`international-${num}`}
                  className="flex items-center justify-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <Image
                    src={`/about/image ${num}.png`}
                    alt="Đối tác nước ngoài"
                    width={150}
                    height={100}
                    className="object-contain max-h-24"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Clever School System Section */}
        <div className="mb-12 md:mb-16 mt-12 md:mt-16">
          {/* Title Section */}
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-[#003A8C] mb-2">
              Hệ thống quản lý học tập toàn diện
            </h2>
            <h3 className="text-3xl md:text-4xl font-bold text-[#FF870D] mb-6">
              Clever School
            </h3>
            <p className="text-[#003A8C] text-lg md:text-xl max-w-4xl mx-auto leading-relaxed font-semibold">
              <strong>
                <span className="text-[#FF870D]">Clever School</span>
              </strong>{" "}
              kết nối học sinh, giáo viên, nhà trường và phụ huynh, giúp tối ưu
              việc giảng dạy, học tập và quản lý chỉ trong một nền tảng duy
              nhất.
            </p>
          </div>

          {/* Images Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* Left Image - Classroom */}
            <div className="flex flex-col">
              <div className="relative w-full h-[300px] md:h-[400px] rounded-lg overflow-hidden shadow-lg border-2 border-[#CCF487]">
                <Image
                  src="/about/image3.jpg"
                  alt="Clever School được sử dụng trong lớp học"
                  fill
                  className="object-cover"
                />
              </div>
              <p className="text-[#003A8C] text-center mt-4 italic font-medium text-lg">
                Clever School được sử dụng trong lớp học
              </p>
            </div>

            {/* Right Image - Individual Study */}
            <div className="flex flex-col">
              <div className="relative w-full h-[300px] md:h-[400px] rounded-lg overflow-hidden shadow-lg border-2 border-[#FFBE78]">
                <Image
                  src="/about/image4.jpg"
                  alt="Học sinh sử dụng Clever School trên máy tính cá nhân"
                  fill
                  className="object-cover"
                />
              </div>
              <p className="text-[#003A8C] text-center mt-4 italic font-medium text-lg">
                Học sinh sử dụng Clever School trên máy tính cá nhân
              </p>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-12 md:mb-16 mt-12 md:mt-16">
          {/* Descriptive Text */}
          <div className="text-center mb-8">
            <p className="text-[#003A8C] text-lg md:text-xl max-w-5xl mx-auto leading-relaxed font-semibold">
              <strong>
                <span className="text-[#FF870D]">Học sinh</span>
              </strong>{" "}
              dễ dàng truy cập vào bài tập về nhà, theo dõi điểm số và tiến độ
              học tập, so sánh kết quả với bạn bè qua bảng xếp hạng, và ôn tập
              hiệu quả với hệ thống bài giảng số sinh động.
            </p>
          </div>

          {/* Three Feature Panels */}
          <div className="space-y-6 md:space-y-8">
            {/* Top Row - 2 Images */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {/* Panel 1 - Tablet Study */}
              <div className="flex flex-col">
                <div className="relative w-full h-[300px] md:h-[400px] rounded-lg overflow-hidden shadow-lg border-2 border-[#7ED4FF]">
                  <Image
                    src="/about/image5.jpg"
                    alt="Học sinh ôn bài và làm bài tập qua máy tính bảng"
                    fill
                    className="object-cover"
                  />
                </div>
                <p className="text-[#003A8C] text-center mt-4 italic font-medium text-lg">
                  Học sinh ôn bài và làm bài tập qua máy tính bảng
                </p>
              </div>

              {/* Panel 2 - Progress Report */}
              <div className="flex flex-col">
                <div className="relative w-full h-[300px] md:h-[400px] rounded-lg overflow-hidden shadow-lg border-2 border-[#CCF487]">
                  <Image
                    src="/about/image6.webp"
                    alt="Bảng cáo cáo tiến độ và điểm số"
                    fill
                    className="object-cover"
                  />
                </div>
                <p className="text-[#003A8C] text-center mt-4 italic font-medium text-lg">
                  Bảng cáo cáo tiến độ và điểm số
                </p>
              </div>
            </div>

            {/* Bottom Row - 1 Image Centered */}
            <div className="flex justify-center">
              <div className="flex flex-col w-full md:w-1/2">
                <div className="relative w-full h-[300px] md:h-[400px] rounded-lg overflow-hidden shadow-lg border-2 border-[#FFBE78]">
                  <Image
                    src="/about/image7.webp"
                    alt="Hình ảnh slide bài giảng"
                    fill
                    className="object-cover"
                  />
                </div>
                <p className="text-[#003A8C] text-center mt-4 italic font-medium text-lg">
                  Hình ảnh slide bài giảng
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Teachers Section */}
        <div className="mb-12 md:mb-16 mt-12 md:mt-16">
          {/* Descriptive Text */}
          <div className="text-center mb-8">
            <p className="text-[#003A8C] text-lg md:text-xl max-w-5xl mx-auto leading-relaxed font-semibold">
              <strong>
                <span className="text-[#FF870D]">Giáo viên</span>
              </strong>{" "}
              giảng dạy trực tuyến, quản lý bài giảng, theo dõi tiến độ và điểm
              số của từng học sinh.
            </p>
          </div>

          {/* Two Images Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* Left Image - Class Progress */}
            <div className="flex flex-col">
              <div className="relative w-full h-[300px] md:h-[400px] rounded-lg overflow-hidden shadow-lg border-2 border-[#FF870D]">
                <Image
                  src="/about/image8.jpg"
                  alt="Giáo viên xem theo dõi tiến độ học tập của từng lớp"
                  fill
                  className="object-cover"
                />
              </div>
              <p className="text-[#003A8C] text-center mt-4 italic font-medium text-lg">
                Giáo viên xem theo dõi tiến độ học tập của từng lớp
              </p>
            </div>

            {/* Right Image - Student Performance */}
            <div className="flex flex-col">
              <div className="relative w-full h-[300px] md:h-[400px] rounded-lg overflow-hidden shadow-lg border-2 border-[#A5C54B]">
                <Image
                  src="/about/image9.jpg"
                  alt="Giáo viên xem chi tiết chất lượng làm bài tập của từng học sinh"
                  fill
                  className="object-cover"
                />
              </div>
              <p className="text-[#003A8C] text-center mt-4 italic font-medium text-lg">
                Giáo viên xem chi tiết chất lượng làm bài tập của từng học sinh
              </p>
            </div>
          </div>
        </div>

        {/* Management Dashboard Section */}
        <div className="mb-12 md:mb-16 mt-12 md:mt-16">
          {/* Title Section */}
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-[#003A8C] mb-4">
              Ban giám hiệu và bộ phận chuyên môn
            </h2>
            <p className="text-[#003A8C] text-lg md:text-xl max-w-4xl mx-auto leading-relaxed">
              Theo dõi chất lượng giảng dạy và học tập
            </p>
          </div>

          {/* Two Dashboard Images - Stacked Vertically */}
          <div className="space-y-6 md:space-y-8">
            {/* Dashboard 1 */}
            <div className="flex flex-col">
              <div className="relative w-full h-[700px] md:h-[800px] rounded-lg overflow-hidden shadow-lg border-2 border-[#FFBE78]">
                <Image
                  src="/about/image10.webp"
                  alt="Giao diện báo cáo tổng quan"
                  fill
                  className="object-cover"
                />
              </div>
              <p className="text-[#003A8C] text-center mt-4 italic font-medium text-lg">
                Giao diện báo cáo tổng quan
              </p>
            </div>

            {/* Dashboard 2 */}
            <div className="flex flex-col">
              <div className="relative w-full h-[700px] md:h-[800px] rounded-lg overflow-hidden shadow-lg border-2 border-[#CCF487]">
                <Image
                  src="/about/image11.webp"
                  alt="Giao diện báo cáo tổng quan"
                  fill
                  className="object-cover"
                />
              </div>
              <p className="text-[#003A8C] text-center mt-4 italic font-medium text-lg">
                Giao diện báo cáo tổng quan
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
