import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  // You can add auth, redirects, headers, etc. here.
  return NextResponse.next();
}
