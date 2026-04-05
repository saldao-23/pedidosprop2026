import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { sessionId, sessionEnd, durationSeconds } = await request.json()

    if (!sessionId || !sessionEnd || durationSeconds === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Actualizar sesión
    const { error } = await supabase
      .from("user_sessions")
      .update({
        session_end: sessionEnd,
        duration_seconds: durationSeconds,
      })
      .eq("id", sessionId)

    if (error) {
      console.error("Error updating session:", error)
      return NextResponse.json(
        { error: "Failed to update session" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in session end API:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
