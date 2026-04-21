import { Suspense } from "react"
import { LoginForm } from "@/components/auth/login-form"
import { LoginSkeleton } from "@/components/auth/login-skeleton"
import Link from "next/link"
import Image from "next/image"
import { Logo } from "@/components/logo"

export default function LoginPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 bg-cover bg-center"
      style={{ backgroundImage: 'url("/BG_login.png")' }}
    >
      <div className="mb-8">
        <Link href="/">
          <Logo  width={200} height={60} className="h-16 w-auto"/>
        </Link>
      </div>

      <Suspense fallback={<LoginSkeleton />}>
        <LoginForm />
      </Suspense>

      <div className="mt-8 text-center text-sm text-gray-500">
        <p>© {new Date().getFullYear()} LMS. Tất cả các quyền được bảo lưu.</p>
      </div>
    </div>
  );
}
