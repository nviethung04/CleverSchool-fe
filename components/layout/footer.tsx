import Image from "next/image";
import Link from "next/link";
import { Logo } from "../logo";

// Server Component
export function Footer() {
  return (
    <footer
      className="text-white py-12 relative"
      style={{
        backgroundImage: 'url("/about/footer.png")',
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <Logo width={150} height={50} className="h-10 w-auto mb-4" />
            <p className="text-gray-400">
              Hệ thống học tập cá thể hóa hàng đầu cho người học Việt Nam
            </p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4">Liên kết</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-gray-400 hover:text-white">
                  Về chúng tôi
                </Link>
              </li>
              <li>
                <Link
                  href="/courses"
                  className="text-gray-400 hover:text-white"
                >
                  Khóa học
                </Link>
              </li>
              <li>
                <Link
                  href="/teaching-staff"
                  className="text-gray-400 hover:text-white"
                >
                  Đội ngũ giáo viên
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-gray-400 hover:text-white"
                >
                  Liên hệ
                </Link>
              </li>
              <li>
                <Link
                  href="/"
                  className="text-gray-400 hover:text-white"
                >
                  Trang chủ
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4">Hỗ trợ</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/faq" className="text-gray-400 hover:text-white">
                  Câu hỏi thường gặp
                </Link>
              </li>
              <li>
                <Link
                  href="/support"
                  className="text-gray-400 hover:text-white"
                >
                  Trung tâm hỗ trợ
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-gray-400 hover:text-white"
                >
                  Chính sách bảo mật
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-400 hover:text-white">
                  Điều khoản sử dụng
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4">Liên hệ</h3>
            <ul className="space-y-2">
              <li className="text-gray-400">Email: 2251172361@e.tlu.edu.vn</li>
              <li className="text-gray-400">Hotline: 0369589101</li>
              <li className="text-gray-400">Địa chỉ: Hà Nội, Việt Nam</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 text-center text-gray-400">
          <p>
            © {new Date().getFullYear()} Clever School. Tất cả các quyền được bảo lưu.
          </p>
        </div>
      </div>
    </footer>
  );
}
