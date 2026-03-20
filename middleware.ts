import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/auth"];
const PUBLIC_API_PREFIXES = ["/api/auth"];
const PROTECTED_API_PREFIXES = ["/api/agent", "/api/costs"];

function hasFileExtension(pathname: string): boolean {
    return /\.[a-zA-Z0-9]+$/.test(pathname);
}

export function isPublicPath(pathname: string): boolean {
    if (PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
        return true;
    }

    if (PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
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

function isProtectedApiPath(pathname: string): boolean {
    return PROTECTED_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
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

    if (isProtectedApiPath(pathname)) {
        return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const loginUrl = new URL("/auth", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);

    return NextResponse.redirect(loginUrl);
}

export const config = {
    matcher: ["/((?!_next/static|_next/image).*)"],
};
