"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePathname, useParams } from "next/navigation";
import {
  User,
  LogOut,
  Check,
  LucideMenu,
  X,
  Home,
  BookOpen,
  BarChart3,
  Trophy,
  MessageCircle,
} from "lucide-react";
import { apiLogoutServer } from "@/lib/api/auth";
import { useAuth } from "@/lib/context/auth-context";
import { useEffect, useState } from "react";
import { GetUserLogin } from "@/lib/api/users";
import { Logo } from "./logo";
import { getGravatarUrl } from "@/utils/avatar";
import { useTypedTranslations } from "@/lib/i18n/client";
import Image from "next/image";

export function DashboardHeader() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [holidayPopupOpen, setHolidayPopupOpen] = useState(false);
  const [orientation, setOrientation] = useState<"landscape" | "portrait">("landscape");
  const params = useParams();
  const locale = params?.locale || "vi";
  const t = useTypedTranslations("studentHeader");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await GetUserLogin();
        const apiUser = res?.data?.user || res?.user || res?.data;
        setUser(apiUser);
      } catch (err) {
        setUser(null);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (holidayPopupOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [holidayPopupOpen]);

  useEffect(() => {
    const updateOrientation = () => {
      setOrientation(window.innerWidth > window.innerHeight ? "landscape" : "portrait");
    };

    updateOrientation();
    window.addEventListener("resize", updateOrientation);

    return () => {
      window.removeEventListener("resize", updateOrientation);
    };
  }, []);

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + "/");
  };

  const handleLogout = async () => {
    // Xóa gravatar cache khi logout
    if (typeof window !== "undefined" && user) {
      const gravatarKey = `gravatar_${user.email || user.id || user.name}`;
      sessionStorage.removeItem(gravatarKey);
    }
    await apiLogoutServer();
    logout();
  };

  const getLocalePath = (targetLocale: string) => {
    const current = pathname || "/";
    const withoutLocale = current.replace(/^\/(vi|en)(?=\/|$)/, "");
    const suffix = withoutLocale || "/";
    return `/${targetLocale}${suffix}`;
  };

  const getCurrentPageName = () => {
    if (pathname?.includes('/profile')) {
      return t("menu.profile");
    }

    const menuItems = [
      { href: `/${locale}/assignments`, label: t("nav.home"), icon: Home },
      { href: `/${locale}/courses`, label: t("nav.courses"), icon: BookOpen },
      {
        href: `/${locale}/progress-report`,
        label: t("nav.reports"),
        icon: BarChart3,
      },
      { href: `/${locale}/ranking`, label: t("nav.ranking"), icon: Trophy },
      {
        href: `/${locale}/feedback`,
        label: t("nav.feedback"),
        icon: MessageCircle,
      },
    ];

    const currentItem = menuItems.find((item) => isActive(item.href));
    return currentItem?.label || t("nav.home");
  };

  function getAvatarUrl(user: any) {
    if (!user) return getGravatarUrl("User", 128);
    if (user.avatar) return user.avatar;
    // Dùng email hoặc id hoặc name để tạo key duy nhất
    const gravatarKey = `gravatar_${user.email || user.id || user.name}`;
    if (typeof window !== "undefined") {
      let url = sessionStorage.getItem(gravatarKey);
      if (!url) {
        url = getGravatarUrl(user.email || user.name, 128);
        sessionStorage.setItem(gravatarKey, url);
      }
      return url;
    }
    return getGravatarUrl(user.email || user.name, 128);
  }

  return (
    <>
      {/* Header */}
      <header
        className={cn(
          "sticky top-0 w-full border-b bg-white/90 backdrop-blur shadow-sm",
          mobileOpen ? "z-30" : "z-50" // khi mở menu thì header nằm dưới overlay
        )}
      >
        <div className="container mx-auto px-1 md:px-2 py-2">
          <div className="flex items-center justify-between">
            {/* Logo Section */}
            <div className="flex items-center gap-6">
              {/* Mobile menu button and current page name */}
              <div className="xl:hidden flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
                  onClick={() => setMobileOpen((currentValue) => !currentValue)}
                  aria-label="Toggle navigation"
                >
                  {mobileOpen ? (
                    <X className="h-6 w-6 text-gray-700" />
                  ) : (
                    <LucideMenu className="h-6 w-6 text-gray-700" />
                  )}
                </Button>
                {/* Current page name - responsive text */}
                <span className="hidden sm:inline text-[15px] font-semibold text-[#33408F] leading-tight flex-1 min-w-0">
                  {getCurrentPageName()}
                </span>
              </div>

              {/* Desktop logo */}
              <Link
                href={`/${locale}/assignments`}
                className="hidden xl:flex items-center gap-2 group"
              >
                <Logo
                  width={100}
                  height={28}
                  className="h-7 w-auto group-hover:scale-105 transition-transform duration-200"
                />
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden xl:flex items-center gap-2 md:gap-4 lg:gap-6">
                {[
                  {
                    href: `/${locale}/assignments`,
                    label: t("nav.home"),
                    icon: Home,
                  },
                  {
                    href: `/${locale}/courses`,
                    label: t("nav.courses"),
                    icon: BookOpen,
                  },
                  {
                    href: `/${locale}/progress-report`,
                    label: t("nav.reports"),
                    icon: BarChart3,
                  },
                  {
                    href: `/${locale}/ranking`,
                    label: t("nav.ranking"),
                    icon: Trophy,
                  },
                  {
                    href: `/${locale}/feedback`,
                    label: t("nav.feedback"),
                    icon: MessageCircle,
                  },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`text-[15px] font-medium relative px-3 py-2 rounded-lg flex items-center gap-2 transition-all duration-200
                      ${isActive(item.href)
                        ? "text-[#33408F] bg-blue-50 shadow-sm border border-blue-100"
                        : "text-slate-600 hover:text-[#33408F] hover:bg-blue-50/50"
                      }
                    `}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
            {/* Action Buttons - Minimalist */}
            <div className="flex items-center gap-3">
              {/* Holiday Icon */}
              <button
                onClick={() => setHolidayPopupOpen(true)}
                className="relative h-[55px] w-[55px] flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Holiday"
              >
                <Image
                  src="/holiday/icon_2026.png"
                  alt="Holiday"
                  width={55}
                  height={55}
                  className="object-contain"
                />
              </button>
              {/* Total Star and Exp Display */}
              {user && (
                <div className="hidden sm:flex items-center gap-3">
                  {/* Total Star */}
                  <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-gradient-to-br from-yellow-50 to-orange-50 border border-[#FF9000]">
                    <img
                      src="/images/star.png"
                      alt="Star"
                      className="h-5 w-5 object-contain"
                    />
                    <span className="text-sm font-bold text-yellow-600">
                      {user.total_star ?? "0"}
                    </span>
                  </div>
                  {/* Total Exp */}
                  <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 border border-[#A4D33D]">
                    <img
                      src="/images/exp.png"
                      alt="Experience"
                      className="h-5 w-5 object-contain"
                    />
                    <span className="text-sm font-bold text-green-600">
                      {user.total_exp ?? 0}
                    </span>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1 text-xs shadow-sm">
                <Link
                  href={getLocalePath("vi")}
                  className={cn(
                    "flex items-center gap-1 rounded-full px-2 py-0.5 font-medium transition-colors",
                    locale === "vi"
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  <span>Vietnamese</span>
                  {locale === "vi" && <Check className="h-3 w-3" />}
                </Link>
                <span className="text-slate-300">|</span>
                <Link
                  href={getLocalePath("en")}
                  className={cn(
                    "flex items-center gap-1 rounded-full px-2 py-0.5 font-medium transition-colors",
                    locale === "en"
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  <span>English</span>
                  {locale === "en" && <Check className="h-3 w-3" />}
                </Link>
              </div>
              {/* User Menu - Modern */}
              <span className="hidden 2xl:inline-block w-fit text-[15px] font-semibold text-[#33408F] text-right">
                {user ? (
                  user.name
                ) : (
                  <Skeleton className="h-4 w-[60px] rounded-full bg-gray-200" />
                )}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-11 w-11 rounded-full p-0 flex items-center transition-all shadow border border-slate-200 hover:shadow-md"
                  >
                    <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                      {user ? (
                        <>
                          <AvatarImage
                            src={getAvatarUrl(user)}
                            alt={user?.name || "User"}
                          />
                          <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-green-600 text-white font-bold text-lg">
                            {user?.name
                              ? user.name.charAt(0).toUpperCase()
                              : "U"}
                          </AvatarFallback>
                        </>
                      ) : (
                        <Skeleton className="h-10 w-10 rounded-full" />
                      )}
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-64 mt-2 shadow-2xl border-0 bg-white rounded-2xl p-2 animate-fadeIn"
                  align="end"
                  forceMount
                >
                  <div className="p-3 pb-2">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 border-2 border-white shadow">
                        {user ? (
                          <>
                            <AvatarImage
                              src={getAvatarUrl(user)}
                              alt={user?.name || "User"}
                            />
                            <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-green-600 text-white font-bold text-lg">
                              {user?.name
                                ? user.name.charAt(0).toUpperCase()
                                : "U"}
                            </AvatarFallback>
                          </>
                        ) : (
                          <Skeleton className="h-12 w-12 rounded-full" />
                        )}
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        {user ? (
                          <>
                            <p className="text-sm font-bold text-gray-900 truncate">
                              {user?.name || "User"}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {user?.email || "user@email.com"}
                            </p>
                            <p className="text-xs text-blue-600 font-medium mt-0.5">
                              {t("user.roleStudent")}
                            </p>
                          </>
                        ) : (
                          <>
                            <Skeleton className="h-4 w-24 mb-1 rounded" />
                            <Skeleton className="h-3 w-32 mb-1 rounded" />
                            <Skeleton className="h-3 w-16 rounded" />
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <DropdownMenuSeparator className="my-1" />

                  <DropdownMenuItem
                    asChild
                    className="rounded-lg p-0 focus:bg-transparent group"
                  >
                    <Link
                      href={`/${locale}/profile`}
                      className="flex items-center gap-3 p-3 rounded-lg transition-colors w-full group-hover:bg-blue-50"
                    >
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium">
                        {t("menu.profile")}
                      </span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    asChild
                    className="rounded-lg p-0 focus:bg-transparent group"
                  >
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 p-3 rounded-lg transition-colors w-full text-left group-hover:bg-red-50"
                    >
                      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                        <LogOut className="h-4 w-4 text-red-600" />
                      </div>
                      <span className="text-sm font-medium text-red-600">
                        {t("menu.logout")}
                      </span>
                    </button>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Overlay + Mobile Navigation */}
      {mobileOpen && (
        <>
          {/* Overlay che toàn bộ trang */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={() => setMobileOpen(false)}
          />

          {/* Sidebar */}
          <div className="h-[100dvh] md:hidden fixed inset-y-0 left-0 w-64 bg-white/95 backdrop-blur shadow-lg animate-in fade-in slide-in-from-left duration-200 z-50 flex flex-col overflow-hidden">
            {/* Logo */}
            <div className="flex-shrink-0 flex flex-row items-center justify-between border-b border-slate-200">
              <Link
                href={`/${locale}/assignments`}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-4 py-4"
              >
                <Logo
                  width={200}
                  height={56}
                  className="h-9 w-auto transition-transform duration-200 group-hover:scale-105"
                />
              </Link>

              <Button
                variant="ghost"
                className="flex items-center gap-2 px-5 py-5 text-slate-600 hover:text-red-600 hover:bg-slate-100 transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Total Star and Exp Display - Mobile */}
            {user && (
              <div className="flex-shrink-0 px-4 py-3 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  {/* Total Star */}
                  <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-br from-yellow-50 to-orange-50 border border-[#FF9000] flex-1">
                    <img
                      src="/images/star.png"
                      alt="Star"
                      className="h-5 w-5 object-contain"
                    />
                    <span className="text-sm font-bold text-yellow-600">
                      {user.total_star ?? "0"}
                    </span>
                  </div>
                  {/* Total Exp */}
                  <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 border border-[#A4D33D] flex-1">
                    <img
                      src="/images/exp.png"
                      alt="Experience"
                      className="h-5 w-5 object-contain"
                    />
                    <span className="text-sm font-bold text-green-600">
                      {user.total_exp ?? 0}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Menu Items */}
            <nav className="flex-1 px-2 py-4 flex flex-col gap-1 overflow-y-auto">
              {[
                {
                  href: `/${locale}/assignments`,
                  label: t("nav.home"),
                  icon: Home,
                },
                {
                  href: `/${locale}/courses`,
                  label: t("nav.courses"),
                  icon: BookOpen,
                },
                {
                  href: `/${locale}/progress-report`,
                  label: t("nav.reports"),
                  icon: BarChart3,
                },
                {
                  href: `/${locale}/ranking`,
                  label: t("nav.ranking"),
                  icon: Trophy,
                },
                {
                  href: `/${locale}/feedback`,
                  label: t("nav.feedback"),
                  icon: MessageCircle,
                },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "w-full rounded-md px-3 py-3 mb-3 text-base font-medium flex items-center gap-3 border-b border-slate-200 transition-colors",
                    isActive(item.href)
                      ? "bg-blue-50 text-[#33408F]"
                      : "text-slate-600 hover:bg-slate-100 hover:text-[#33408F]"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="flex-1">{item.label}</span>
                  {isActive(item.href) && (
                    <span className="h-2 w-2 rounded-full bg-[#33408F]" />
                  )}
                </Link>
              ))}
            </nav>
          </div>
        </>
      )}

      {/* Holiday Popup */}
      {holidayPopupOpen && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setHolidayPopupOpen(false)}
        >
          <div 
            className="relative max-w-[98vw] max-h-[98vh] w-auto h-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={orientation === "landscape" ? "/holiday/tet2026_ngang.png" : "/holiday/tet2026_doc.png"}
              alt="Chúc mừng năm mới 2026"
              width={orientation === "landscape" ? 3000 : 2000}
              height={orientation === "landscape" ? 1500 : 3000}
              className="w-auto h-auto max-w-[98vw] max-h-[98vh] object-contain rounded-lg"
              style={{
                width: orientation === "landscape" ? "98vw" : "auto",
                height: orientation === "portrait" ? "98vh" : "auto",
                maxWidth: "98vw",
                maxHeight: "98vh"
              }}
              priority
            />
            <button
              onClick={() => setHolidayPopupOpen(false)}
              className="absolute top-4 right-4 z-50 rounded-full bg-black/50 hover:bg-black/70 text-white p-2 transition-colors"
              aria-label="Đóng"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
