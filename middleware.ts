import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
    const hasSessionCookie =
        request.cookies.has("next-auth.session-token") ||
        request.cookies.has("__Secure-next-auth.session-token");

    if (!hasSessionCookie) {
        const loginUrl = new URL("/auth/login", request.url);
        loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);

        return NextResponse.redirect(loginUrl);
    }

    const token = await getToken({
        req: request,
        secret: process.env.NEXT_AUTH_SECRETE,
    });

    if (token?.sub || token?.email) {
        return NextResponse.next();
    }

    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);

    return NextResponse.redirect(loginUrl);
}

export const config = {
    matcher: ["/", "/dashboard/:path*"],
};
