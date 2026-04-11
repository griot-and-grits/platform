import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { auth } from '@/auth';

const authDisabled = process.env.ADMIN_AUTH_DISABLED === 'true';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (!pathname.startsWith('/admin') || authDisabled) {
        return NextResponse.next();
    }

    if (pathname.startsWith('/admin/sign-in')) {
        return NextResponse.next();
    }

    const session = await auth();

    if (!session) {
        const signInUrl = new URL('/admin/sign-in', request.url);
        signInUrl.searchParams.set('callbackUrl', request.nextUrl.href);

        return NextResponse.redirect(signInUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*'],
};
