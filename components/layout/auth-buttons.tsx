"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"

export function AuthButtons() {

  return (
    <div className="flex items-center gap-3">
      <Button className="rounded-full border-blue text-white" asChild>
        <Link href="/login">Đăng nhập</Link>
      </Button>
    </div>
  )
}