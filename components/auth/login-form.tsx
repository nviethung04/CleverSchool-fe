"use client";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { LoginField } from "@/components/auth/login-field";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/context/auth-context";
import { useForm } from "@/lib/hooks/use-form";
import { useState, useEffect } from "react";

export function LoginForm() {
  const { login, isLoading, error, isAuthenticated, user } = useAuth();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale || "vi";

  const {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
    setValues,
  } = useForm({
    initialValues: {
      username: "",
      password: "",
    },
    onSubmit: async (values) => {
      try {
        // Only pass username and password to login function
        await login(values.username, values.password);

        // Save credentials if rememberMe is checked
        if (rememberMe) {
          const credentialsToSave = {
            username: values.username,
            password: values.password, // Note: In production, consider security implications
            rememberMe: true,
          };
          localStorage.setItem(
            "rememberedCredentials",
            JSON.stringify(credentialsToSave)
          );
        } else {
          // Remove saved credentials if rememberMe is not checked
          localStorage.removeItem("rememberedCredentials");
        }
        setLocalError(null); // Clear local error on success
      } catch (error: any) {
        const beError = error?.response?.data?.error;
        setLocalError(beError || "Đã xảy ra lỗi. Vui lòng thử lại.");
        console.error("Login failed:", error);
      }
    },
    validate: (values) => {
      const errors: any = {};
      if (!values.username) errors.username = "Tên đăng nhập là bắt buộc";
      if (!values.password) errors.password = "Mật khẩu là bắt buộc";
      return errors;
    },
  });

  // Redirect authenticated users
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.type === "student") {
        router.push(`/${locale}/assignments`);
      } else if (user.type === "teacher") {
        router.push(`/${locale}/teacher/weekly-lessons`);
      } else if (user.type === "admin") {
        router.push(`/${locale}/admin/dashboard`);
      }
    }
  }, [isAuthenticated, user, router, locale]);

  // Load saved credentials on component mount
  useEffect(() => {
    const savedCredentials = localStorage.getItem("rememberedCredentials");
    if (savedCredentials) {
      try {
        const {
          username,
          password,
          rememberMe: savedRememberMe,
        } = JSON.parse(savedCredentials);
        if (username || password) {
          // Auto-fill the form with saved credentials
          setValues({
            username: username || "",
            password: password || "",
          });
        }
        setRememberMe(savedRememberMe || false);
      } catch (error) {
        // If there's an error parsing, clear the corrupted data
        localStorage.removeItem("rememberedCredentials");
      }
    }
  }, [setValues]);

  // Handle rememberMe checkbox change
  const handleRememberMeChange = (checked: boolean) => {
    setRememberMe(checked);

    // If unchecked, remove saved credentials immediately
    if (!checked) {
      localStorage.removeItem("rememberedCredentials");
    }
  };

  if (isAuthenticated) {
    return (
      <Card className="w-full max-w-md border-Clever School-purple">
        <CardContent className="p-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Đang chuyển hướng...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {(localError || error) && (
        <Alert
          variant="destructive"
          className="mb-4 w-full max-w-md font-semibold text-center"
        >
          <AlertDescription>{localError || error}</AlertDescription>
        </Alert>
      )}

      {redirectUrl && (
        <Alert className="mb-4 w-full max-w-md">
          <AlertDescription>Vui lòng đăng nhập để tiếp tục</AlertDescription>
        </Alert>
      )}

      <Card className="w-full max-w-md border-Clever School-purple">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Đăng nhập</CardTitle>
          <CardDescription className="text-center">
            Nhập thông tin đăng nhập của bạn để truy cập hệ thống
          </CardDescription>
        </CardHeader>
        <CardContent className="w-full">
          <form onSubmit={handleSubmit} className="w-full">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <LoginField
                  id="username"
                  name="username"
                  label="Tên đăng nhập"
                  testId="login-field-account"
                  type="text"
                  value={values.username}
                  onChange={handleChange}
                  disabled={isLoading || isSubmitting}
                  autoComplete="username"
                  enterKeyHint="next"
                />
                {errors.username && (
                  <p className="text-sm text-red-500">{errors.username}</p>
                )}
              </div>
              <div className="grid gap-2">
                <LoginField
                  id="password"
                  name="password"
                  label="Mật khẩu"
                  testId="login-field-password"
                  type={showPassword ? "text" : "password"}
                  value={values.password}
                  onChange={handleChange}
                  disabled={isLoading || isSubmitting}
                  autoComplete="current-password"
                  enterKeyHint="done"
                  suffix={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading || isSubmitting}
                      aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  }
                />
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password}</p>
                )}
                {/* <Link
                  href="/forgot-password"
                  className="text-sm text-Clever School-purple hover:underline text-right"
                >
                  Quên mật khẩu?
                </Link> */}
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rememberMe"
                  checked={rememberMe}
                  onCheckedChange={handleRememberMeChange}
                  disabled={isLoading || isSubmitting}
                />
                <Label
                  htmlFor="rememberMe"
                  className="text-sm font-normal cursor-pointer"
                >
                  Ghi nhớ đăng nhập
                </Label>
              </div>
            </div>
            <CardFooter className="flex flex-col gap-4 mt-4 w-full p-0">
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || isSubmitting}
              >
                {isLoading || isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang đăng nhập...
                  </>
                ) : (
                  "Đăng nhập"
                )}
              </Button>
              {/* <div className="text-center text-sm">
                Chưa có tài khoản?{" "}
                <Link
                  href="/register"
                  className="text-Clever School-purple hover:underline"
                >
                  Đăng ký ngay
                </Link>
              </div> */}
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
