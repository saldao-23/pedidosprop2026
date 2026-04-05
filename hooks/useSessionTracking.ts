"use client"

import { useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"

export function useSessionTracking() {
  const sessionIdRef = useRef<string | null>(null)
  const sessionStartRef = useRef<Date | null>(null)

  useEffect(() => {
    const supabase = createClient()
    let isActive = true

    const startSession = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || !isActive) return

        // Crear nueva sesión
        const { data, error } = await supabase
          .from("user_sessions")
          .insert({
            user_id: user.id,
            session_start: new Date().toISOString(),
          })
          .select()
          .single()

        if (error) {
          console.error("Error starting session:", error)
          return
        }

        if (data) {
          sessionIdRef.current = data.id
          sessionStartRef.current = new Date()
        }
      } catch (error) {
        console.error("Error in startSession:", error)
      }
    }

    const endSession = async () => {
      if (!sessionIdRef.current || !sessionStartRef.current) return

      try {
        const sessionEnd = new Date()
        const durationSeconds = Math.floor(
          (sessionEnd.getTime() - sessionStartRef.current.getTime()) / 1000
        )

        // Actualizar sesión con tiempo de fin y duración
        await supabase
          .from("user_sessions")
          .update({
            session_end: sessionEnd.toISOString(),
            duration_seconds: durationSeconds,
          })
          .eq("id", sessionIdRef.current)

        sessionIdRef.current = null
        sessionStartRef.current = null
      } catch (error) {
        console.error("Error ending session:", error)
      }
    }

    // Iniciar sesión
    startSession()

    // Manejar cierre de página/pestaña
    const handleBeforeUnload = () => {
      // Usar sendBeacon para enviar datos antes de cerrar
      if (sessionIdRef.current && sessionStartRef.current) {
        const sessionEnd = new Date()
        const durationSeconds = Math.floor(
          (sessionEnd.getTime() - sessionStartRef.current.getTime()) / 1000
        )

        // Enviar actualización usando fetch con keepalive
        fetch("/api/session/end", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: sessionIdRef.current,
            sessionEnd: sessionEnd.toISOString(),
            durationSeconds,
          }),
          keepalive: true,
        }).catch(console.error)
      }
    }

    // Manejar cambios de visibilidad (cuando cambian de pestaña)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        endSession()
      } else if (document.visibilityState === "visible" && !sessionIdRef.current) {
        startSession()
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    // Cleanup
    return () => {
      isActive = false
      window.removeEventListener("beforeunload", handleBeforeUnload)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      endSession()
    }
  }, [])
}
