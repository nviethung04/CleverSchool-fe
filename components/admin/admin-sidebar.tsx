"use client";

import type React from "react";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/context/auth-context";
import { useAdminSidebarSafe } from "@/lib/context/sidebar-context";
import { apiLogoutServer } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Clipboard,
  BookOpen,
  ChevronDown,
  ChevronRight,
  ChevronFirst,
  ChevronLast,
  FileText,
  LayoutDashboard,
  LogOut,
  School,
  Settings,
  Users,
  BookOpenCheck,
  MessageSquare,
  Bell,
  HelpCircle,
  Presentation,
  FileStack,
  User,
  Menu,
  X,
  Globe,
  Check,
  DownloadCloud,
  ClipboardList,
  SlidersHorizontal,
  Calendar,
  Star,
  BookMarked,
} from "lucide-react";
import { GetUserLogin } from "@/lib/api/users";
import { BRAND_COLORS } from "@/lib/constants/colors";
import { useTranslations } from "next-intl";
import { filterSidebarItems } from "@/lib/nav/filter-nav";
import NotificationPermissionButton from "../notification-permission-button";
import { useMounted } from "@/hooks/use-mounted";
import { isSchoolManager } from "@/lib/auth/roles";

type SidebarItem = {
  icon: React.ReactNode;
  label: string;
  href: string;
  submenu?: {
    label: string;
    href: string;
    icon: React.ReactNode;
  }[];
};

export function AdminSidebar() {
  const { user: authUser, logout } = useAuth();
  const mounted = useMounted();
  const pathname = usePathname();
  const params = useParams();
  const locale = params?.locale || "vi"; // Default to 'vi' if no locale
  const t = useTranslations("sidebar");
  const schoolManager = isSchoolManager(authUser);

  const sidebarItems: SidebarItem[] = [
    {
      icon: <LayoutDashboard className="h-5 w-5" />,
      label: t("overview"),
      href: `/${locale}/admin/dashboard`,
    },
    {
      icon: <DownloadCloud className="h-5 w-5" />,
      label: t("export"),
      href: `/${locale}/admin/export`,
    },
    {
      icon: <Users className="h-5 w-5" />,
      label: t("userManagement"),
      href: `/${locale}/admin/users/list`,
    },
    {
      icon: <School className="h-5 w-5" />,
      label: t("schoolManagement"),
      href: `/${locale}/admin/schools`,
    },
    ...(schoolManager
      ? []
      : [
        {
          icon: <Clipboard className="h-5 w-5" />,
          label: t("subjectManagement"),
          href: `/${locale}/admin/subjects`,
        },
        {
          icon: <FileStack className="h-5 w-5" />,
          label: t("programManagement"),
          href: `/${locale}/manage/programs`,
        },
      ]),
    {
      icon: <BookOpen className="h-5 w-5" />,
      label: t("courseManagement"),
      href: `/${locale}/manage/courses`,
    },
    ...(schoolManager
      ? []
      : [
        {
          icon: <FileText className="h-5 w-5" />,
          label: t("learningMaterials"),
          href: `/${locale}/manage/lessons`,
          submenu: [
            {
              icon: <FileText className="h-5 w-5" />,
              label: t("lessonManagement"),
              href: `/${locale}/manage/lessons`,
            },
            {
              icon: <BookOpenCheck className="h-5 w-5" />,
              label: t("assignmentManagement"),
              href: `/${locale}/admin/assignments`,
            },
            {
              icon: <FileStack className="h-5 w-5" />,
              label: t("questionBank"),
              href: `/${locale}/manage/question-bank`,
            },
            {
              icon: <Presentation className="h-5 w-5" />,
              label: t("lectureManagement"),
              href: `/${locale}/admin/lecture-bank`,
            },
            {
              icon: <BookMarked className="h-5 w-5" />,
              label: t("flashcardManagement"),
              href: `/${locale}/admin/flashcard`,
            },
            {
              icon: <FileText className="h-5 w-5" />,
              label: t("h5p"),
              href: `/${locale}/admin/h5p`,
            },
            {
              icon: <HelpCircle className="h-5 w-5" />,
              label: t("mediaManagement"),
              href: `/${locale}/admin/images`,
            },
          ],
        },
      ]),
    ...(schoolManager
      ? []
      : [
        {
          icon: <Star className="h-5 w-5" />,
          label: t("criteriaValuate"),
          href: `/${locale}/admin/criteria-assessment`,
          submenu: [
            {
              icon: <SlidersHorizontal className="h-5 w-5" />,
              label: t("criteriaAssessment"),
              href: `/${locale}/admin/criteria-assessment`,
            },
            {
              icon: <ClipboardList className="h-5 w-5" />,
              label: t("criteriaReport"),
              href: `/${locale}/admin/criteria-report`,
            },
          ],
        },
        {
          icon: <Calendar className="h-5 w-5" />,
          label: t("semesterManagement"),
          href: `/${locale}/admin/semesters`,
        },
        {
          icon: <Settings className="h-5 w-5" />,
          label: t("settings"),
          href: `/${locale}/admin/settings`,
        },
      ]),
    ...(schoolManager
      ? []
      : [
        {
          icon: <MessageSquare className="h-5 w-5" />,
          label: t("feedback"),
          href: `/${locale}/admin/feedback`,
        },
      ]),
    {
      icon: <Bell className="h-5 w-5" />,
      label: t("notices"),
      href: `/${locale}/admin/notices`,
    },
  ];

  const filteredSidebarItems = filterSidebarItems(sidebarItems);

  // Use safe hook that won't throw if context is unavailable
  const sidebarContext = useAdminSidebarSafe();

  // Fallback values if context is not available (e.g., when used in admin layout)
  const expanded = sidebarContext?.expanded ?? true;
  const setExpanded = sidebarContext?.setExpanded ?? (() => { });
  const isMobile = sidebarContext?.isMobile ?? false;
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(
    "/manage/lessons"
  );
  const [user, setUser] = useState<any>(null);
  const [darkMode, setDarkMode] = useState(false);

  // Check if we're on mobile and handle responsive behavior
  useEffect(() => {
    const checkIfMobile = () => {
      const isMobileView = window.innerWidth < 1024;
      if (isMobileView && setExpanded) {
        setExpanded(false);
      }
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);

    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, [setExpanded]);

  // Open submenu if current path is in a submenu
  useEffect(() => {
    filteredSidebarItems.forEach((item) => {
      if (item.submenu) {
        const isInSubmenu = item.submenu.some(
          (subItem) =>
            pathname === subItem.href ||
            pathname?.startsWith(`${subItem.href}/`)
        );
        if (isInSubmenu) {
          setOpenSubmenu(item.href);
        }
      }
    });
  }, [pathname]);

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

  const toggleSubmenu = (href: string) => {
    setOpenSubmenu(openSubmenu === href ? null : href);
  };

  const handleLogout = async () => {
    await apiLogoutServer();
    logout();
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Build path with selected locale, preserving current path after locale segment
  const getLocalePath = (targetLocale: string) => {
    const current = pathname || "/";
    const withoutLocale = current.replace(/^\/(vi|en)(?=\/|$)/, "");
    const suffix = withoutLocale || "/";
    return `/${targetLocale}${suffix}`;
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && expanded && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setExpanded(false)}
        />
      )}

      <aside
        className={cn(
          "fixed lg:relative flex h-[100dvh] flex-col overflow-y-auto border-r transition-all duration-300 z-50",
          isMobile
            ? "left-0 top-0 w-[17.5rem]"
            : expanded
              ? "w-[17.5rem]"
              : "w-20",
          isMobile && !expanded && "transform -translate-x-full"
        )}
        style={{
          background: BRAND_COLORS.navy,
          borderRight: `1px solid ${BRAND_COLORS.navy}40`,
          boxShadow: `8px 0 32px -8px ${BRAND_COLORS.navy}30`,
        }}
      >
        {/* Header */}
        <div
          className={cn(
            "flex h-16 items-center border-b px-4",
            expanded ? "justify-between" : "justify-center"
          )}
          style={{
            borderBottom: `1px solid ${BRAND_COLORS.navy}40`,
            background: `rgba(255,255,255,0.1)`,
            backdropFilter: "blur(10px)",
          }}
        >
          {expanded ? (
            <Link
              href={`/${locale}/admin/dashboard`}
              className="flex items-center gap-2"
            >
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg shadow-lg"
                style={{ backgroundColor: BRAND_COLORS.orange }}
              >
                <span className="text-sm font-bold text-white">L</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Clever School
              </span>
            </Link>
          ) : (
            <Link
              href={`/${locale}/admin/dashboard`}
              className="flex items-center justify-center"
            >
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg shadow-lg"
                style={{ backgroundColor: BRAND_COLORS.orange }}
              >
                <span className="text-sm font-bold text-white">E</span>
              </div>
            </Link>
          )}

          {/* Mobile Close Button */}
          {isMobile && expanded && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setExpanded(false)}
              className="h-8 w-8 rounded-full text-white/70 hover:bg-white/20 hover:text-white backdrop-blur-sm lg:hidden"
            >
              <X className="h-4 w-4" />
            </Button>
          )}

          {/* Desktop Collapse Button when expanded */}
          {expanded && !isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setExpanded(!expanded)}
              className="h-8 w-8 rounded-full text-white/70 hover:bg-white/20 hover:text-white backdrop-blur-sm"
            >
              <ChevronFirst className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Search Bar */}
        {/* {expanded && (
          <div className="px-4 py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm py-2.5 pl-10 pr-4 text-sm transition-all focus:outline-none focus:ring-2 focus:border-white/40 text-white placeholder-white/60"
              />
            </div>
          </div>
        )} */}

        {/* Navigation */}
        <div className="flex-1 overflow-hidden px-4 pb-4 pt-2">
          <div className="flex h-full flex-col">
            {/* <p className="mt-3 mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-white/60">
              Menu
            </p> */}
            <nav className="flex-1 space-y-1 overflow-y-auto pr-2 scrollbar-thin">
              <TooltipProvider delayDuration={0}>
                {filteredSidebarItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname?.startsWith(`${item.href}/`);
                  const hasSubmenu = item.submenu && item.submenu.length > 0;
                  const isSubmenuOpen = openSubmenu === item.href;
                  const isSubmenuActive =
                    hasSubmenu &&
                    item.submenu?.some(
                      (subItem) =>
                        pathname === subItem.href ||
                        pathname?.startsWith(`${subItem.href}/`)
                    );

                  return (
                    <div key={item.href}>
                      <Tooltip delayDuration={expanded ? 1000 : 0}>
                        <TooltipTrigger asChild>
                          {hasSubmenu ? (
                            <button
                              onClick={() => toggleSubmenu(item.href)}
                              className={cn(
                                "group flex w-full items-center gap-x-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300",
                                isActive || isSubmenuActive
                                  ? "text-white shadow-lg border-l-4"
                                  : "text-white/70 hover:text-white hover:bg-white/10",
                                !expanded && "justify-center px-2"
                              )}
                              style={
                                isActive || isSubmenuActive
                                  ? {
                                    backgroundColor: `${BRAND_COLORS.yellow}20`,
                                    borderLeftColor: BRAND_COLORS.yellow,
                                    backdropFilter: "blur(10px)",
                                  }
                                  : {}
                              }
                            >
                              <div className="flex items-center justify-center">
                                {item.icon}
                              </div>
                              {expanded && (
                                <>
                                  <span className="flex-1 text-left">
                                    {item.label}
                                  </span>
                                  {isSubmenuOpen ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </>
                              )}
                            </button>
                          ) : (
                            <Link
                              href={item.href}
                              className={cn(
                                "group flex items-center gap-x-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300",
                                isActive
                                  ? "text-white shadow-lg border-l-4"
                                  : "text-white/70 hover:text-white hover:bg-white/10",
                                !expanded && "justify-center px-2"
                              )}
                              style={
                                isActive
                                  ? {
                                    backgroundColor: `${BRAND_COLORS.yellow}20`,
                                    borderLeftColor: BRAND_COLORS.yellow,
                                    backdropFilter: "blur(10px)",
                                  }
                                  : {}
                              }
                            >
                              <div className="flex items-center justify-center">
                                {item.icon}
                              </div>
                              {expanded && <span>{item.label}</span>}
                            </Link>
                          )}
                        </TooltipTrigger>
                        {!expanded && (
                          <TooltipContent
                            side="right"
                            className="border border-white/20 bg-black/80 backdrop-blur-sm text-white shadow-xl rounded-xl"
                          >
                            {item.label}
                          </TooltipContent>
                        )}
                      </Tooltip>

                      {hasSubmenu && isSubmenuOpen && expanded && (
                        <div className="ml-4 mt-1 space-y-1">
                          {item.submenu?.map((subItem) => {
                            const isSubItemActive =
                              pathname === subItem.href ||
                              pathname?.startsWith(`${subItem.href}/`);

                            return (
                              <Link
                                key={subItem.href}
                                href={subItem.href}
                                className={cn(
                                  "flex items-center gap-x-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300",
                                  isSubItemActive
                                    ? "text-white shadow-lg border-l-4"
                                    : "text-white/70 hover:text-white hover:bg-white/10"
                                )}
                                style={
                                  isSubItemActive
                                    ? {
                                      backgroundColor: `${BRAND_COLORS.orange}20`,
                                      borderLeftColor: BRAND_COLORS.orange,
                                      backdropFilter: "blur(10px)",
                                    }
                                    : {}
                                }
                              >
                                <div className="flex items-center justify-center w-4 h-4">
                                  {subItem.icon}
                                </div>
                                <span className="text-left">
                                  {subItem.label}
                                </span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </TooltipProvider>
            </nav>
          </div>
        </div>

        {/* Footer */}
        <div
          className="border-t px-4 py-4"
          style={{
            borderTop: `1px solid ${BRAND_COLORS.navy}40`,
            background: `rgba(255,255,255,0.05)`,
            backdropFilter: "blur(10px)",
          }}
        >
          {/* Dark Mode Toggle */}
          {/* <div className="mb-4 flex items-center justify-between">
            {expanded && (
              <div className="flex items-center gap-2">
                {darkMode ? (
                  <Moon className="h-4 w-4 text-white/70" />
                ) : (
                  <Sun className="h-4 w-4" style={{ color: BRAND_COLORS.yellow }} />
                )}
                <span className="text-sm font-medium text-white/80">
                  {darkMode ? "Dark Mode" : "Light Mode"}
                </span>
              </div>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className={cn(
                "h-8 w-8 rounded-full text-white/70 hover:bg-white/20 hover:text-white",
                !expanded && "mx-auto"
              )}
            >
              {darkMode ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          </div> */}

          {/* Expand Button for collapsed state */}
          {!expanded && !isMobile && (
            <div className="mb-4 flex justify-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setExpanded(!expanded)}
                className="h-8 w-8 rounded-full text-white/70 hover:bg-white/20 hover:text-white"
              >
                <ChevronLast className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Notification Permission Button */}
          {/* <div className={cn("px-3 mb-2", !expanded && "flex justify-center")}>
            <NotificationPermissionButton />
          </div> */}

          {/* User Profile */}
          {mounted ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 p-3 rounded-xl hover:bg-white/10 backdrop-blur-sm transition-all duration-200",
                  !expanded && "justify-center"
                )}
              >
                <Avatar className="h-8 w-8 ring-2 ring-white/50">
                  <AvatarImage
                    src={user?.avatar || "/avatar-kid.png"}
                    alt={user?.name || "Admin"}
                  />
                  <AvatarFallback
                    className="text-white text-sm font-semibold"
                    style={{ backgroundColor: BRAND_COLORS.purple }}
                  >
                    {user?.name ? user.name.charAt(0).toUpperCase() : "AD"}
                  </AvatarFallback>
                </Avatar>
                {expanded && (
                  <div className="flex flex-col items-start text-left">
                    <span className="text-sm font-semibold text-white">
                      {user?.name || "Admin"}
                    </span>
                    <span className="text-xs text-white/60">
                      {user?.email || "admin@example.com"}
                    </span>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-56 shadow-xl border border-slate-200 bg-white/95 backdrop-blur-sm rounded-2xl"
              align="end"
              forceMount
            >
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold leading-none text-slate-900">
                    {user?.name || "Admin"}
                  </p>
                  <p className="text-xs leading-none text-slate-500">
                    {user?.email || "admin@example.com"}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-200" />
              <DropdownMenuItem asChild>
                <Link
                  href="/admin/profile"
                  className="flex items-center w-full text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-colors"
                >
                  <User className="mr-2 h-4 w-4" />
                  <span>{t("accountDetails")}</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-200" />
              {/* Language Switcher - compact professional UI */}
              <div className="px-2 py-1.5">
                <div className="flex items-center gap-2 text-slate-600 mb-2">
                  <Globe className="mr-2 h-4 w-4" />
                  <span className="text-xs font-medium">{t("language")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={getLocalePath("vi")}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors",
                      locale === "vi"
                        ? "bg-blue-50 border-blue-200 text-blue-700"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                    )}
                  >
                    <span>{t("vietnamese")}</span>
                    {locale === "vi" && <Check className="h-3.5 w-3.5" />}
                  </Link>
                  <Link
                    href={getLocalePath("en")}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors",
                      locale === "en"
                        ? "bg-blue-50 border-blue-200 text-blue-700"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                    )}
                  >
                    <span>{t("english")}</span>
                    {locale === "en" && <Check className="h-3.5 w-3.5" />}
                  </Link>
                </div>
              </div>
              <DropdownMenuSeparator className="bg-slate-200" />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer flex items-center w-full text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl transition-colors"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>{t("logout")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          ) : (
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 p-3 rounded-xl",
                !expanded && "justify-center"
              )}
              type="button"
              aria-hidden
              tabIndex={-1}
            >
              <Avatar className="h-8 w-8 ring-2 ring-white/50">
                <AvatarImage
                  src={user?.avatar || "/avatar-kid.png"}
                  alt={user?.name || "Admin"}
                />
                <AvatarFallback
                  className="text-white text-sm font-semibold"
                  style={{ backgroundColor: BRAND_COLORS.purple }}
                >
                  {user?.name ? user.name.charAt(0).toUpperCase() : "AD"}
                </AvatarFallback>
              </Avatar>
            </Button>
          )}
        </div>
      </aside>
    </>
  );
}

// Mobile Menu Button component để sử dụng trong layout
export function MobileMenuButton() {
  const sidebarContext = useAdminSidebarSafe();
  const setExpanded = sidebarContext?.setExpanded ?? (() => { });
  const isMobile = sidebarContext?.isMobile ?? false;

  if (!isMobile) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setExpanded(true)}
      className="h-8 w-8 rounded-full text-slate-600 hover:bg-white/20 hover:text-slate-900 lg:hidden"
    >
      <Menu className="h-4 w-4" />
    </Button>
  );
}
