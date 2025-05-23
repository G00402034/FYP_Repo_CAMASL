import { NextResponse } from 'next/server';

export function middleware(req) {
  const { pathname } = req.nextUrl;

 
  if (pathname === '/' || pathname === '/scores') {
    const loggedInUser = req.cookies.get('loggedInUser')?.value;
    
    if (!loggedInUser) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/scores'],
};