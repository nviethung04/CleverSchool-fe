"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import {
  LucideBell,
  LucideMenu,
  LucideMessageSquare,
  LucideUser,
  LucideLogOut,
  LucideSettings,
  LucideBookOpen,
  LucideGraduationCap,
  LucideClipboardList,
  LucideHelpCircle,
  LucidePlaySquare,
  LucideChevronDown,
  LucideHome,
  LucideBook,
  MessageSquare,
  ChartBar,
  Check,
  Globe,
  X,
} from "lucide-react";
import { apiLogoutServer } from "@/lib/api/auth";
import { useAuth } from "@/lib/context/auth-context";
import { useEffect, useState } from "react";
import { GetUserLogin } from "@/lib/api/users";
import { useTypedTranslations } from "@/lib/i18n/client";

import { Logo } from "./logo";
import { getGravatarUrl } from "@/utils/avatar";
import NotificationPermissionButton from "./notification-permission-button";
import { filterNavByHref } from "@/lib/nav/filter-nav";
import { useMounted } from "@/hooks/use-mounted";

export function TeacherDashboardHeader() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const mounted = useMounted();
  const params = useParams();
  const locale = params?.locale || "vi";
  const t = useTypedTranslations("teacherHeader");
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileResourcesOpen, setMobileResourcesOpen] = useState(false);

  // Đã có user từ context, không cần fetch lại
  // const [user, setUser] = useState<any>(null);
  // useEffect(() => { ... }, []);
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
    if (!user) {
      setAvatarUrl("");
      return;
    }
    if (user.avatar) {
      setAvatarUrl(user.avatar);
      return;
    }
    const gravatarKey = `gravatar_${user.email || user.id || user.name}`;
    if (typeof window !== "undefined") {
      let url = sessionStorage.getItem(gravatarKey);
      if (!url) {
        url = getGravatarUrl(user.email || user.name, 128);
        sessionStorage.setItem(gravatarKey, url);
      }
      setAvatarUrl(url);
    } else {
      setAvatarUrl(""); // SSR: không render avatar
    }
  }, [user]);

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
    if (pathname?.includes('/teacher/profile')) {
      return t("menu.profile");
    }

    const allMenuItems = [
      ...navItems,
      ...resourceItems,
    ];

    const currentItem = allMenuItems.find((item) => isActive(item.href));
    return currentItem?.label || t("nav.home");
  };

  const navItems = filterNavByHref([
    {
      href: `/${locale}/teacher/weekly-lessons`,
      label: t("nav.home"),
      icon: LucideGraduationCap,
    },
    {
      href: `/${locale}/teacher/reports`,
      label: t("nav.reports"),
      icon: ChartBar,
    },
    {
      href: `/${locale}/teacher/courses`,
      label: t("nav.courses"),
      icon: LucideBook,
    },
    {
      href: `/${locale}/teacher/feedback`,
      label: t("nav.feedback"),
      icon: MessageSquare,
    },
  ]);

  const resourceItems = filterNavByHref([
    {
      href: `/${locale}/teacher/lessons`,
      label: t("resources.lessons"),
      icon: LucideBookOpen,
      color: "blue",
    },
    {
      href: `/${locale}/teacher/assignments`,
      label: t("resources.assignments"),
      icon: LucideClipboardList,
      color: "orange",
    },
    {
      href: `/${locale}/teacher/question-bank`,
      label: t("resources.questionBank"),
      icon: LucideHelpCircle,
      color: "purple",
    },
    {
      href: `/${locale}/teacher/lecture-bank`,
      label: t("resources.lectureBank"),
      icon: LucidePlaySquare,
      color: "green",
    },
  ]);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60",
          mobileOpen ? "z-30" : "z-50" // khi mở menu thì header nằm dưới overlay
        )}
      >
        <div className="container mx-auto px-2 md:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo Section - Minimalist */}
            <div className="flex items-center gap-8">
              {/* Mobile menu button */}
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
                <span className="hidden sm:inline text-[15px] font-semibold text-[#33408F] leading-tight flex-1 min-w-0">
                  {getCurrentPageName()}
                </span>
              </div>

              <Link href="" className="hidden xl:flex items-center gap-3 group">
                {/* <Image
                    src="/Logo1.png"
                    alt="Clever School Logo"
                    width={120}
                    height={32}
                    className="h-8 w-auto group-hover:scale-105 transition-transform duration-300"
                  /> */}
                <Logo
                  width={120}
                  height={32}
                  className="h-8 w-auto group-hover:scale-105 transition-transform duration-300"
                />
              </Link>

              {/* Desktop Navigation - Clean */}
              <nav className="hidden xl:flex items-center gap-2">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${isActive(item.href)
                      ? "bg-emerald-50 text-emerald-700 shadow-sm"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                ))}

                {resourceItems.length > 0 && !mounted && (
                  <Button
                    variant="ghost"
                    className="px-4 py-2.5 text-sm font-medium text-gray-600 flex items-center gap-2 rounded-lg"
                    type="button"
                    aria-hidden
                    tabIndex={-1}
                  >
                    <LucideBookOpen className="h-4 w-4" />
                    {t("resources.title")}
                    <LucideChevronDown className="h-4 w-4" />
                  </Button>
                )}

                {resourceItems.length > 0 && mounted && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 flex items-center gap-2 rounded-lg transition-all duration-200"
                      >
                        <LucideBookOpen className="h-4 w-4" />
                        {t("resources.title")}
                        <LucideChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="w-56 mt-2 shadow-xl border-0 bg-white rounded-xl p-2"
                    >
                      {resourceItems.map((item, index) => (
                        <div key={item.href}>
                          <DropdownMenuItem
                            asChild
                            className="rounded-lg p-0 focus:bg-transparent"
                          >
                            <Link
                              href={item.href}
                              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors w-full"
                            >
                              <div
                                className={`w-8 h-8 bg-${item.color}-100 rounded-lg flex items-center justify-center`}
                              >
                                <item.icon
                                  className={`h-4 w-4 text-${item.color}-600`}
                                />
                              </div>
                              <span className="font-medium text-gray-900 text-sm">
                                {item.label}
                              </span>
                            </Link>
                          </DropdownMenuItem>
                          {index < resourceItems.length - 1 && (
                            <DropdownMenuSeparator className="my-1" />
                          )}
                        </div>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </nav>
            </div>

            {/* Action Buttons - Minimalist */}
            <div className="flex items-center gap-3">
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
              <span className="text-lg font-semibold mr-2 text-[#33408F] hidden md:inline-block">
                {user ? (
                  user?.name || t("user.fallbackName")
                ) : (
                  <Skeleton className="h-4 w-[60px] rounded-full bg-gray-200" />
                )}
              </span>

              {/* Notification Permission Button */}
              {/* <NotificationPermissionButton /> */}

              {mounted ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-11 w-11 rounded-full p-0 hover:ring-4 hover:ring-emerald-100 transition-all"
                  >
                    <Avatar className="h-10 w-10">
                      {user ? (
                        <>
                          <AvatarImage
                            src={avatarUrl}
                            alt={user?.name || t("user.fallbackName")}
                          />
                          <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-green-600 text-white font-bold text-lg">
                            {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                          </AvatarFallback>
                        </>
                      ) : (
                        <Skeleton className="h-10 w-10 rounded-full" />
                      )}
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-64 mt-2 shadow-xl border-0 bg-white rounded-xl p-2"
                  align="end"
                  forceMount
                >
                  <div className="p-3 pb-2">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        {user ? (
                          <>
                            <AvatarImage
                              src={user?.avatar || "/avatar-kid.png"}
                              alt={user?.name || "User"}
                            />
                            <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-green-600 text-white font-bold text-lg">
                              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
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
                              {user?.name || t("user.fallbackName")}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {user?.email || t("user.fallbackEmail")}
                            </p>
                            <p className="text-xs text-emerald-600 font-medium mt-0.5">
                              {t("user.roleTeacher")}
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
                    className="rounded-lg p-0 focus:bg-transparent"
                  >
                    <Link
                      href={`/${locale}/teacher/profile`}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors w-full"
                    >
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <LucideUser className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium">
                        {t("menu.profile")}
                      </span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="my-1" />

                  <DropdownMenuItem
                    asChild
                    className="rounded-lg p-0 focus:bg-transparent"
                  >
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 transition-colors w-full text-left"
                    >
                      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                        <LucideLogOut className="h-4 w-4 text-red-600" />
                      </div>
                      <span className="text-sm font-medium text-red-600">
                        {t("menu.logout")}
                      </span>
                    </button>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              ) : (
                <Button
                  variant="ghost"
                  className="relative h-11 w-11 rounded-full p-0"
                  type="button"
                  aria-hidden
                  tabIndex={-1}
                >
                  <Avatar className="h-10 w-10">
                    {user ? (
                      <>
                        <AvatarImage
                          src={avatarUrl}
                          alt={user?.name || t("user.fallbackName")}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-green-600 text-white font-bold text-lg">
                          {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                        </AvatarFallback>
                      </>
                    ) : (
                      <Skeleton className="h-10 w-10 rounded-full" />
                    )}
                  </Avatar>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Overlay + Mobile Navigation */}
      {mobileOpen && (
        <>
          {/* Overlay che toàn bộ trang */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={() => {
              setMobileOpen(false);
              setMobileResourcesOpen(false);
            }}
          />

          {/* Sidebar */}
          <div className="min-h-screen xl:hidden fixed inset-y-0 left-0 w-64 bg-white/95 backdrop-blur shadow-lg animate-in fade-in slide-in-from-left duration-200 z-50 flex flex-col">
            {/* Logo */}
            <Link
              href={``}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-4 py-4 border-b border-slate-200"
            >
              <Logo
                width={200}
                height={56}
                className="h-9 w-auto transition-transform duration-200 group-hover:scale-105"
              />
            </Link>

            {/* Menu Items */}
            <nav className="flex-1 px-2 py-4 flex flex-col gap-1 border-b border-slate-200 overflow-y-auto">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "w-full rounded-md px-3 py-3 mb-3 text-base font-medium flex items-center gap-3 border-b border-slate-200 transition-colors",
                    isActive(item.href)
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-emerald-700"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="flex-1">{item.label}</span>
                  {isActive(item.href) && (
                    <span className="h-2 w-2 rounded-full bg-emerald-700" />
                  )}
                </Link>
              ))}

              {resourceItems.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setMobileResourcesOpen((currentValue) => !currentValue)
                    }
                    className={cn(
                      "w-full rounded-md px-3 py-3 mb-3 text-base font-medium flex items-center gap-3 border-b border-slate-200 transition-colors",
                      mobileResourcesOpen
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-slate-600 hover:bg-slate-100 hover:text-emerald-700"
                    )}
                  >
                    <LucideBookOpen className="h-5 w-5" />
                    <span>{t("resources.title")}</span>
                    <LucideChevronDown
                      className={cn(
                        "h-4 w-4 ml-auto transition-transform",
                        mobileResourcesOpen && "rotate-180"
                      )}
                    />
                  </button>
                  {mobileResourcesOpen && (
                    <div className="animate-in fade-in slide-in-from-left duration-300">
                      {resourceItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => {
                            setMobileOpen(false);
                            setMobileResourcesOpen(false);
                          }}
                          className={cn(
                            "w-full rounded-md px-3 py-2 mb-1 text-sm flex items-center justify-between gap-2 pl-8 transition-colors",
                            isActive(item.href)
                              ? "bg-emerald-50 text-emerald-600"
                              : "text-slate-600 hover:bg-slate-100 hover:text-emerald-700"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <item.icon className="h-4 w-4 text-emerald-600" />
                            <span>{item.label}</span>
                          </div>
                          {isActive(item.href) && (
                            <span className="h-2 w-2 rounded-full bg-emerald-700" />
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              )}
            </nav>

            {/* Close Button */}
            <Button
              variant="ghost"
              className="m-3 flex items-center gap-2 px-3 py-2 rounded-md text-slate-600 hover:text-red-600 hover:bg-slate-100 transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              <X className="h-5 w-5" />
              <span>{t("nav.close")}</span>
            </Button>
          </div>
        </>
      )}
    </>
  );
}
