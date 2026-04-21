"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Mail, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { forgotPassword } from "@/lib/api/auth"

export default function ForgotPasswordPage() {
  const [username, setUsername] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username.trim()) {
      setError("Vui lòng nhập tên đăng nhập hoặc email")
      return
    }

    setIsLoading(true)
    setError("")
    setMessage("")

    try {
      const responseMessage = await forgotPassword(username.trim())
      setMessage(responseMessage)
      setIsSuccess(true)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Có lỗi xảy ra")
      setIsSuccess(false)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg border-0">
          <CardHeader className="space-y-1 text-center">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-full">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Quên mật khẩu?</CardTitle>
            <CardDescription className="text-gray-600">
              Nhập tên đăng nhập hoặc email để nhận liên kết đặt lại mật khẩu
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {!isSuccess ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Tên đăng nhập hoặc Email</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Nhập tên đăng nhập hoặc email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-11"
                    disabled={isLoading}
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full h-11 bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                  {isLoading ? "Đang gửi..." : "Xác nhận"}
                </Button>
              </form>
            ) : (
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center w-16 h-16 mx-auto bg-green-100 rounded-full">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>

                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">{message}</AlertDescription>
                </Alert>

                <div className="text-sm text-gray-600 space-y-2">
                  <p>Vui lòng kiểm tra hộp thư email của bạn và click vào liên kết để đặt lại mật khẩu.</p>
                  <p className="text-xs text-gray-500">Nếu không thấy email, hãy kiểm tra thư mục spam.</p>
                </div>
              </div>
            )}

            <div className="pt-4 border-t">
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Quay lại đăng nhập
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
