import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  let user = null
  try {
    const { data, error } = await supabase.auth.getUser()

    // If user_not_found error, clear cookies and redirect to login
    if (
      error?.message?.includes("User from sub claim in JWT does not exist") ||
      error?.message?.includes("user_not_found")
    ) {
      console.log("[v0] Invalid token detected, clearing session")

      // Create response that clears auth cookies
      const url = request.nextUrl.clone()
      url.pathname = "/"
      const response = NextResponse.redirect(url)

      // Clear all Supabase auth cookies
      const cookiesToClear = request.cookies
        .getAll()
        .filter((cookie) => cookie.name.startsWith("sb-") || cookie.name.includes("auth-token"))

      cookiesToClear.forEach((cookie) => {
        response.cookies.delete(cookie.name)
      })

      return response
    }

    user = data.user
  } catch (error) {
    console.error("[v0] Error getting user:", error)
    // If any other error, clear session and redirect to login
    const url = request.nextUrl.clone()
    url.pathname = "/"
    return NextResponse.redirect(url)
  }

  // Redirect to login if not authenticated and trying to access protected routes
  if (
    !user &&
    !request.nextUrl.pathname.startsWith("/") &&
    !request.nextUrl.pathname.startsWith("/register") &&
    !request.nextUrl.pathname.startsWith("/register-info") &&
    !request.nextUrl.pathname.startsWith("/forgot-password") &&
    request.nextUrl.pathname !== "/"
  ) {
    const url = request.nextUrl.clone()
    url.pathname = "/"
    return NextResponse.redirect(url)
  }

  // Redirect to dashboard if authenticated and trying to access login
  if (user && request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
