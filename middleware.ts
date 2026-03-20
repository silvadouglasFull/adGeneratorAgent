import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const NEXT_AUTH_PUBLIC_API_PATHS = [
    "/api/auth/signin",
    "/api/auth/signout",
    "/api/auth/callback",
    "/api/auth/session",
    "/api/auth/csrf",
    "/api/auth/providers",
    "/api/auth/error",
    "/api/auth/verify-request",
];

function hasFileExtension(pathname: string): boolean {
    return /\.[a-zA-Z0-9]+$/.test(pathname);
}

export function isPublicPath(pathname: string): boolean {
    if (
        NEXT_AUTH_PUBLIC_API_PATHS.some(
            (path) => pathname === path || pathname.startsWith(`${path}/`)
        )
    ) {
        return true;
    }

    if (pathname.startsWith("/_next")) {
        return true;
    }

    if (pathname === "/favicon.ico" || pathname === "/site.webmanifest") {
        return true;
    }

    if (hasFileExtension(pathname)) {
        return true;
    }

    return false;
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (isPublicPath(pathname)) {
        return NextResponse.next();
    }

    const token = await getToken({
        req: request,
        secret: process.env.NEXT_AUTH_SECRETE,
    });

    if (token) {
        return NextResponse.next();
    }

    if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const loginUrl = new URL("/api/auth/signin", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);

    return NextResponse.redirect(loginUrl);
}

export const config = {
    matcher: ["/((?!_next/static|_next/image).*)"],
};
