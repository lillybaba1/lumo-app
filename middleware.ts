
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// This function can be marked `async` if using `await` inside
export function middleware(req: NextRequest) {
  // Authentication is temporarily disabled.
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/admin/:path*', '/login', '/signup'],
};
