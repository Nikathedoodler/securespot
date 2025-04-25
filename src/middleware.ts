import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");

  console.log("Middleware Check - Token:", token);
  console.log("Middleware Check - Is admin route:", isAdminRoute);
  console.log("Middleware Check - Role:", token?.role);

  if (isAdminRoute) {
    if (!token) {
      console.log("Middleware - No token, redirecting to login");
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Check if user has admin role - use string comparison
    if (token.role !== "ADMIN") {
      console.log(
        "Middleware - Not admin, redirecting to dashboard. Role:",
        token.role
      );
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
