import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Proxy Socket.IO requests to backend
  if (pathname.startsWith('/socket.io')) {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
    const targetUrl = new URL(pathname + request.nextUrl.search, backendUrl)
    
    console.log('[MIDDLEWARE] Proxying Socket.IO:', pathname, '→', targetUrl.toString())
    
    return NextResponse.rewrite(targetUrl)
  }

  // Proxy API requests to backend
  if (pathname.startsWith('/api')) {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
    const targetUrl = new URL(pathname + request.nextUrl.search, backendUrl)
    
    console.log('[MIDDLEWARE] Proxying API:', pathname, '→', targetUrl.toString())
    
    return NextResponse.rewrite(targetUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/socket.io/:path*',
    '/api/:path*'
  ]
}
