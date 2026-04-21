import Link from "next/link"
import Image from "next/image"
import { AuthButtons } from "./auth-buttons"
import { Logo } from "../logo"

// Server Component
export function Header() {
  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/">
            <Logo width={150} height={50} className="h-10 w-auto"/>
          </Link>
        </div>
        <AuthButtons />
      </div>
    </header>
  )
}
