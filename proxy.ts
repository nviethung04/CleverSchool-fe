import createMiddleware from "next-intl/middleware";
import { routing } from "./lib/i18n/routing";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const MAINTENANCE_CHECKED_COOKIE = 'maintenance_session_checked';
const PRE_MAINTENANCE_URL_COOKIE = 'pre_maintenance_url';
const FORCE_RECHECK_COOKIE = 'force_recheck'; // Cookie để đánh dấu cần check lại

export default async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const cookieStore = await cookies();

  // Skip middleware for API routes
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  let isMaintenance = false;
  const sessionChecked = cookieStore.get(MAINTENANCE_CHECKED_COOKIE)?.value;
  const forceRecheck = cookieStore.get(FORCE_RECHECK_COOKIE)?.value === 'true';

  // Phát hiện hard reload (F5, Ctrl+R, Ctrl+F5)
  // Cache-Control: no-cache nghĩa là user bấm reload
  const cacheControl = request.headers.get('cache-control');
  const isHardReload =
    (cacheControl?.includes('no-cache') ||
      cacheControl?.includes('max-age=0')) &&
    pathname.includes('/maintenance');

  // CHỈ gọi API khi:
  // 1. Session mới (chưa có cookie session)
  // 2. Có cookie force_recheck (từ button hoặc logic khác)
  const shouldCheckAPI = !sessionChecked || forceRecheck || isHardReload;

  if (shouldCheckAPI) {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/manage/settings/by-key/${process.env.MAINTENANCE_KEY}`,
        {
          cache: 'no-store',
          signal: AbortSignal.timeout(5000),
        }
      );

      if (!res.ok) {
        throw new Error('API request failed');
      }

      const data = await res.json();
      isMaintenance = Boolean(data?.data?.is_active);
    } catch {
      isMaintenance = false;
    }
  } else {
    // Logic để biết maintenance status từ session hiện tại
    isMaintenance = sessionChecked === 'maintenance';
  }

  const isMaintenancePage = pathname === '/maintenance';
  const preUrl = cookieStore.get(PRE_MAINTENANCE_URL_COOKIE)?.value;

  // Redirect VÀO trang maintenance
  if (isMaintenance && !isMaintenancePage) {
    const response = NextResponse.redirect(
      new URL('/maintenance', request.url)
    );
    
    response.cookies.set(PRE_MAINTENANCE_URL_COOKIE, pathname + search, {
      path: '/',
      sameSite: 'lax',
    });
    
    response.cookies.set(MAINTENANCE_CHECKED_COOKIE, 'maintenance', {
      path: '/',
      sameSite: 'lax',
    });
    
    // Xóa force_recheck sau khi đã check
    if (forceRecheck) {
      response.cookies.delete(FORCE_RECHECK_COOKIE);
    }
    
    return response;
  }

  // Redirect RA KHỎI trang maintenance
  if (!isMaintenance && isMaintenancePage) {
    const response = NextResponse.redirect(
      new URL((preUrl || '/'), request.url)
    );
    
    response.cookies.delete(PRE_MAINTENANCE_URL_COOKIE);
    response.cookies.delete(MAINTENANCE_CHECKED_COOKIE);
    
    // Xóa force_recheck sau khi đã check
    if (forceRecheck) {
      response.cookies.delete(FORCE_RECHECK_COOKIE);
    }
    
    return response;
  }

  // Đang ở trang maintenance
  if (isMaintenancePage) {
    const response = NextResponse.next();
    
    if (shouldCheckAPI) {
      response.cookies.set(MAINTENANCE_CHECKED_COOKIE, 'maintenance', {
        path: '/',
        sameSite: 'lax',
      });
      
      // Xóa force_recheck sau khi đã check
      if (forceRecheck) {
        response.cookies.delete(FORCE_RECHECK_COOKIE);
      }
    }
    
    return response;
  }

  // Helper function
  const setSessionCookieIfNeeded = (response: NextResponse) => {
    if (shouldCheckAPI) {
      response.cookies.set(MAINTENANCE_CHECKED_COOKIE, 'active', {
        path: '/',
        sameSite: 'lax',
      });
      
      // Xóa force_recheck sau khi đã check
      if (forceRecheck) {
        response.cookies.delete(FORCE_RECHECK_COOKIE);
      }
    }
    return response;
  };

  // Xử lý locale routing
  if (!pathname.startsWith("/vi") && !pathname.startsWith("/en")) {
    if (
      pathname === "/" ||
      pathname.startsWith("/login") ||
      pathname.startsWith("/reset-password") ||
      pathname.startsWith("/forgot-password")
    ) {
      return setSessionCookieIfNeeded(NextResponse.next());
    }

    const defaultLocale = routing.defaultLocale;
    const redirectUrl = new URL(`/${defaultLocale}${pathname}`, request.url);
    return setSessionCookieIfNeeded(NextResponse.redirect(redirectUrl));
  }

  if (pathname.startsWith("/vi") || pathname.startsWith("/en")) {
    return setSessionCookieIfNeeded(createMiddleware(routing)(request));
  }

  return setSessionCookieIfNeeded(NextResponse.next());
}

export const config = {
  matcher: [
    "/((?!_next|.*\\..*|api|h5p).*)",
  ],
};