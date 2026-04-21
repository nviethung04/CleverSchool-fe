import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  MessageCircle,
  HelpCircle,
  BookOpen,
  Users,
  Home,
  Send,
  Facebook,
  Youtube,
} from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "support" });

  return {
    title: "Hỗ trợ - Enspire LMS",
    description:
      "Trung tâm hỗ trợ Enspire LMS - Liên hệ với chúng tôi để được giải đáp thắc mắc và hỗ trợ sử dụng hệ thống",
  };
}

export default function SupportPage() {
  const t = useTranslations("support");

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden dark:from-blue-900 dark:to-indigo-900 py-8 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.1))]"></div>
        <div className="relative max-w-7xl mx-auto">
          {/* Header with Back Button and Title */}
          <div className="flex items-center justify-between mb-3">
            <Button
              asChild
              variant="ghost"
              className="text-blue-700 hover:bg-white/10 hover:text-blue-500"
            >
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                Về trang chủ
              </Link>
            </Button>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-700 tracking-tight">
              Trung tâm Hỗ trợ
            </h1>

            {/* Spacer for alignment */}
            <div className="w-[140px]"></div>
          </div>

          {/* Center Badge */}
          <div className="text-center">
            <Badge
              variant="secondary"
              className="text-xs px-3 py-1.5 bg-blue-200 backdrop-blur-sm text-black border-blue-300 hover:bg-blue-300"
            >
              Luôn sẵn sàng hỗ trợ bạn
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-12 -mt-8">
        {/* Introduction Card */}
        <Card className="mb-8 shadow-xl backdrop-blur-sm bg-white/95 dark:bg-gray-800/95">
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <HelpCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">
                  Chúng tôi có thể giúp gì cho bạn?
                </CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Đội ngũ hỗ trợ của Enspire LMS luôn sẵn sàng giải đáp mọi thắc
                  mắc và hỗ trợ bạn sử dụng hệ thống một cách hiệu quả nhất.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Contact Information */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <Phone className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-2xl">Thông tin liên hệ</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Hotline */}
              <div className="flex items-start gap-4 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <Phone className="w-5 h-5 text-green-600 dark:text-green-400 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1">
                    Hotline
                  </p>
                  <a
                    href="tel:1900xxxx"
                    className="text-green-600 dark:text-green-400 hover:underline text-lg font-semibold"
                  >
                    1900 599 989
                  </a>
                </div>
              </div>

              {/* Email */}
              {/* <div className="flex items-start gap-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1">
                    Email
                  </p>
                  <a
                    href="mailto:support@enspire.edu.vn"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    support@enspire.edu.vn
                  </a>
                </div>
              </div> */}

              {/* Address */}
              <div className="flex items-start gap-4 p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                <MapPin className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1">
                    Địa chỉ
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    Trung tâm anh ngữ Enspire, 80A Láng Hạ, Đống Đa
                    <br />
                    Thành phố Hà Nội, Việt Nam
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Working Hours */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                  <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <CardTitle className="text-2xl">Giờ làm việc</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      Thứ Hai - Thứ Sáu
                    </span>
                    <span className="text-gray-700 dark:text-gray-300">
                      8:30 - 18:00
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      Thứ Bảy
                    </span>
                    <span className="text-gray-700 dark:text-gray-300">
                      8:30 - 12:00
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      Chủ Nhật
                    </span>
                    <span className="text-red-600 dark:text-red-400 font-semibold">
                      Nghỉ
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <Card className="mb-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                <MessageCircle className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <CardTitle className="text-2xl">Câu hỏi thường gặp</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* FAQ 1 */}
              <div>
                <div className="text-lg font-semibold px-4 py-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4">
                  <div className="flex items-center gap-3">
                    <HelpCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <span>Làm thế nào để đăng ký tài khoản?</span>
                  </div>
                </div>
                <div className="px-4">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    Bạn có thể đăng ký tài khoản bằng cách click vào nút "Đăng
                    ký" trên trang chủ. Điền đầy đủ thông tin cá nhân và email
                    hợp lệ. Hệ thống sẽ gửi email xác nhận đến địa chỉ bạn đã
                    đăng ký.
                  </p>
                </div>
              </div>

              {/* FAQ 2 */}
              <div>
                <div className="text-lg font-semibold px-4 py-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4">
                  <div className="flex items-center gap-3">
                    <HelpCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <span>Tôi quên mật khẩu, phải làm sao?</span>
                  </div>
                </div>
                <div className="px-4">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    Click vào "Quên mật khẩu?" ở trang đăng nhập. Nhập email đã
                    đăng ký và làm theo hướng dẫn trong email để thiết lập mật
                    khẩu mới.
                  </p>
                </div>
              </div>

              {/* FAQ 3 */}
              <div>
                <div className="text-lg font-semibold px-4 py-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4">
                  <div className="flex items-center gap-3">
                    <HelpCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <span>Làm thế nào để tham gia khóa học?</span>
                  </div>
                </div>
                <div className="px-4">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    Sau khi đăng nhập, vào mục "Khóa học" và chọn khóa học bạn
                    muốn tham gia. Click "Đăng ký khóa học" hoặc liên hệ với
                    giáo viên/quản trị viên để được thêm vào khóa học.
                  </p>
                </div>
              </div>

              {/* FAQ 4 */}
              <div>
                <div className="text-lg font-semibold px-4 py-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4">
                  <div className="flex items-center gap-3">
                    <HelpCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <span>Tôi gặp lỗi kỹ thuật, phải làm gì?</span>
                  </div>
                </div>
                <div className="px-4">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    Vui lòng chụp ảnh màn hình lỗi và gửi qua email
                    support@enspire.edu.vn hoặc gọi hotline. Đội ngũ kỹ thuật sẽ
                    hỗ trợ bạn ngay lập tức.
                  </p>
                </div>
              </div>

              {/* FAQ 5 */}
              <div>
                <div className="text-lg font-semibold px-4 py-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4">
                  <div className="flex items-center gap-3">
                    <HelpCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <span>Hệ thống hỗ trợ những thiết bị nào?</span>
                  </div>
                </div>
                <div className="px-4">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                    Enspire LMS hỗ trợ đầy đủ trên các thiết bị:
                  </p>
                  <ul className="space-y-2 ml-4">
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600 dark:text-indigo-400 mt-1">
                        •
                      </span>
                      <span className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        Desktop/Laptop (Windows, MacOS, Linux)
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600 dark:text-indigo-400 mt-1">
                        •
                      </span>
                      <span className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        Tablet (iPad, Android Tablet)
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600 dark:text-indigo-400 mt-1">
                        •
                      </span>
                      <span className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        Smartphone (iOS, Android)
                      </span>
                    </li>
                  </ul>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                    Khuyến nghị: Sử dụng trình duyệt Chrome, Firefox, hoặc
                    Safari phiên bản mới nhất.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resources Section */}
        {/* <Card className="mb-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/30">
                <BookOpen className="w-6 h-6 text-teal-600 dark:text-teal-400" />
              </div>
              <CardTitle className="text-2xl">Tài liệu hướng dẫn</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-teal-600 dark:text-teal-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                      Dành cho Học sinh
                    </h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                      Hướng dẫn sử dụng hệ thống, tham gia lớp học, làm bài tập
                      và kiểm tra.
                    </p>
                    <Button
                      variant="link"
                      className="p-0 h-auto text-teal-600 dark:text-teal-400"
                    >
                      Xem hướng dẫn →
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                      Dành cho Giáo viên
                    </h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                      Hướng dẫn tạo khóa học, quản lý lớp học, chấm bài và đánh
                      giá học sinh.
                    </p>
                    <Button
                      variant="link"
                      className="p-0 h-auto text-blue-600 dark:text-blue-400"
                    >
                      Xem hướng dẫn →
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                      Dành cho Quản trị viên
                    </h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                      Hướng dẫn quản lý hệ thống, người dùng, và cấu hình nâng
                      cao.
                    </p>
                    <Button
                      variant="link"
                      className="p-0 h-auto text-purple-600 dark:text-purple-400"
                    >
                      Xem hướng dẫn →
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <HelpCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                      Video hướng dẫn
                    </h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                      Thư viện video hướng dẫn chi tiết từng tính năng của hệ
                      thống.
                    </p>
                    <Button
                      variant="link"
                      className="p-0 h-auto text-amber-600 dark:text-amber-400"
                    >
                      Xem video →
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card> */}

        {/* Contact Form Banner */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Send className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-2xl">Gửi yêu cầu hỗ trợ</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="p-6 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                Không tìm thấy câu trả lời bạn cần? Gửi yêu cầu hỗ trợ và chúng
                tôi sẽ liên hệ với bạn trong thời gian sớm nhất.
              </p>
              <div className="flex gap-3">
                {/* <Button className="bg-blue-600 hover:bg-blue-700">
                  <Mail className="w-4 h-4 mr-2" />
                  Gửi email hỗ trợ
                </Button> */}
                <Button variant="outline">
                  <Phone className="w-4 h-4 mr-2" />
                  Gọi hotline
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
