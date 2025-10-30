import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Allow access to login page
  if (pathname === "/login") {
    return NextResponse.next();
  }
  
  // Check authentication for protected routes
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  
  // Role-based access control - STRICT: no default to admin
  const userRole = session.user.role;
  
  // If no role defined, treat as unauthorized
  if (!userRole) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  
  // Define admin-only routes (brokers cannot access these)
  const adminOnlyRoutes = [
    '/projects',
    '/campaigns', 
    '/brokers',
    '/settings',
    '/audit',
    '/activities'
  ];
  
  // Check if broker is trying to access admin-only routes
  if (userRole === 'broker') {
    // Redirect broker from root/dashboard to broker leads
    if (pathname === '/' || pathname === '/leads' || pathname === '/pipeline' || pathname === '/reports') {
      const brokerPath = pathname === '/' ? '/broker/leads' : `/broker${pathname}`;
      return NextResponse.redirect(new URL(brokerPath, request.url));
    }
    
    // Block access to admin-only routes
    const isAdminRoute = adminOnlyRoutes.some(route => pathname.startsWith(route));
    if (isAdminRoute) {
      return NextResponse.redirect(new URL("/broker/leads", request.url));
    }
  }
  
  // Redirect admins from broker routes to admin routes
  if (userRole === 'admin' && pathname.startsWith('/broker')) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/leads/:path*", "/pipeline/:path*", "/projects/:path*", "/activities/:path*", "/reports/:path*", "/campaigns/:path*", "/brokers/:path*", "/settings/:path*", "/audit/:path*", "/broker/:path*", "/login"],
};