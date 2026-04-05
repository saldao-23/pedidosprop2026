"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import Logo from "@/components/logo"
import { createClient } from "@/lib/supabase/client"
import { sanitizeName, sanitizePhone, isValidEmail, isValidPassword, isSafeInput } from "@/lib/validation"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    companyName: "",
    email: "",
    whatsapp: "",
    password: "",
    confirmPassword: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inviteCode, setInviteCode] = useState("")
  const [isFirstUser, setIsFirstUser] = useState(false)
  const [checkingFirstUser, setCheckingFirstUser] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const checkFirstUser = async () => {
      const supabase = createClient()

      // Verificar si hay usuarios en la base de datos
      const { count, error } = await supabase.from("perfiles").select("*", { count: "exact", head: true })

      if (error) {
        console.error("[v0] Error al verificar usuarios:", error)
      }

      // Si no hay usuarios, es el primer usuario
      setIsFirstUser(count === 0)
      setCheckingFirstUser(false)
    }

    checkFirstUser()

    const invite = searchParams.get("invite")
    if (invite) {
      setInviteCode(invite)
    }
  }, [searchParams])

  useEffect(() => {
    if (!checkingFirstUser && !isFirstUser && !inviteCode) {
      // Solo redirigir si no es el primer usuario y no tiene código de invitación
      router.push("/register-info")
    }
  }, [checkingFirstUser, isFirstUser, inviteCode, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Validaciones de seguridad
    const sanitizedName = sanitizeName(formData.companyName)
    const sanitizedPhone = sanitizePhone(formData.whatsapp)
    const email = formData.email.trim().toLowerCase()

    if (!isValidEmail(email)) {
      setError("Email inválido")
      setIsLoading(false)
      return
    }

    if (!isValidPassword(formData.password)) {
      setError("La contraseña debe tener entre 6 y 128 caracteres")
      setIsLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden")
      setIsLoading(false)
      return
    }

    if (!sanitizedName || sanitizedName.length < 2) {
      setError("Nombre de empresa inválido")
      setIsLoading(false)
      return
    }

    if (!isSafeInput(formData.companyName) || !isSafeInput(formData.whatsapp)) {
      setError("Caracteres no permitidos detectados")
      setIsLoading(false)
      return
    }

    const supabase = createClient()

    try {
      // Validar código de invitación si existe (pero NO marcar como usada todavía)
      if (inviteCode) {
        const { data: invitacion, error: inviteError } = await supabase
          .from("invitaciones")
          .select("invitador_id, usado")
          .eq("codigo", inviteCode)
          .single()

        if (inviteError || !invitacion) {
          setError("Código de invitación inválido")
          setIsLoading(false)
          return
        }

        // Verificar si ya fue usada
        if (invitacion.usado) {
          setError("Este código de invitación ya fue utilizado")
          setIsLoading(false)
          return
        }

        // Verificar si el invitador todavía tiene invitaciones disponibles
        const { data: invitador } = await supabase
          .from("perfiles")
          .select("invitaciones_disponibles")
          .eq("id", invitacion.invitador_id)
          .single()

        if (!invitador) {
          setError("Error al validar el código de invitación")
          setIsLoading(false)
          return
        }

        // Contar invitaciones ya usadas del invitador
        const { count: usadas } = await supabase
          .from("invitaciones")
          .select("*", { count: "exact", head: true })
          .eq("invitador_id", invitacion.invitador_id)
          .eq("usado", true)

        const maxInvitaciones = invitador.invitaciones_disponibles || 10
        const disponibles = Math.max(maxInvitaciones - (usadas || 0), 0)

        // Si ya no tiene invitaciones disponibles
        if (disponibles <= 0) {
          setError("Este código de invitación ya no está disponible. El usuario que te invitó alcanzó su límite de invitaciones.")
          setIsLoading(false)
          return
        }
      }

      // Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: formData.password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
          data: {
            nombre: sanitizedName,
            telefono: sanitizedPhone,
          },
        },
      })

      if (authError) throw authError

      if (authData.user) {
        // Determinar el rol antes de todo
        const rol = isFirstUser ? "admin" : "user"

        // Esperar un momento para que el trigger de Supabase cree el perfil
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Verificar si el perfil fue creado por el trigger
        const { data: existingProfile } = await supabase
          .from("perfiles")
          .select("id")
          .eq("id", authData.user.id)
          .single()

        // Si no existe el perfil, crearlo manualmente
        if (!existingProfile) {
          const { error: perfilError } = await supabase.from("perfiles").insert({
            id: authData.user.id,
            nombre: formData.companyName,
            email: formData.email,
            telefono: formData.whatsapp,
            rol: rol,
            referido_por: inviteCode || null,
          })

          if (perfilError) {
            console.error("[v0] Error al crear perfil:", perfilError)
            console.error("[v0] Detalles del error:", JSON.stringify(perfilError, null, 2))

            // Intentar eliminar el usuario de auth si falla la creación del perfil
            await supabase.auth.admin.deleteUser(authData.user.id).catch(() => {})

            throw new Error(`Database error saving new user: ${perfilError.message || 'Unknown error'}`)
          }
        }

        // 🔥 SOLUCIÓN NUCLEAR: Procesar invitación INMEDIATAMENTE
        if (inviteCode) {
          try {
            const { data: resultInvitacion, error: invitacionError } = await supabase
              .rpc('procesar_invitacion_inmediata', {
                p_usuario_id: authData.user.id,
                p_codigo_invitacion: inviteCode
              })

            if (invitacionError) {
              console.error("[v0] Error procesando invitación:", invitacionError)
            } else {
              console.log("[v0] Invitación procesada:", resultInvitacion)
            }
          } catch (inviteError) {
            console.error("[v0] Error al procesar invitación:", inviteError)
            // No bloqueamos el registro si falla el procesamiento de invitación
          }
        }

        console.log("[v0] Registro exitoso, rol asignado:", rol)

        // Redirigir a pantalla de verificación de email
        router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`)
      }
    } catch (error: unknown) {
      console.error("[v0] Error en registro:", error)
      setError(error instanceof Error ? error.message : "Error al registrar usuario")
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleLogoClick = () => {
    router.push("/")
  }

  if (checkingFirstUser) {
    return (
      <div className="min-h-screen bg-[#3a3544] flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    )
  }

  if (!isFirstUser && !inviteCode) {
    return null // Will redirect to register-info
  }

  return (
    <div className="min-h-screen bg-[#3a3544] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-8">
            <Logo onClick={handleLogoClick} size="large" className="w-20 h-20" />
          </div>
        </div>

        {/* Registration Form */}
        <Card className="bg-[#4a4458]/90 border-[#5a5568]/50 backdrop-blur-sm rounded-2xl">
          <div className="p-8 space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-white">
                {isFirstUser ? "Crear cuenta de administrador" : "Crear cuenta"}
              </h1>
              <p className="text-slate-300">
                {isFirstUser
                  ? "Serás el primer usuario y tendrás privilegios de administrador"
                  : "Completa tus datos para registrarte"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                placeholder="Nombre de la inmobiliaria"
                value={formData.companyName}
                onChange={(e) => handleInputChange("companyName", e.target.value)}
                className="bg-transparent border-2 border-[#8b5cf6] focus:border-[#8b5cf6] text-white placeholder:text-slate-400 h-12 rounded-xl"
                required
                disabled={isLoading}
              />

              <Input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="bg-transparent border-2 border-[#8b5cf6] focus:border-[#8b5cf6] text-white placeholder:text-slate-400 h-12 rounded-xl"
                required
                disabled={isLoading}
              />

              <Input
                placeholder="WhatsApp (ej: +54 11 1234-5678)"
                value={formData.whatsapp}
                onChange={(e) => handleInputChange("whatsapp", e.target.value)}
                className="bg-transparent border-2 border-[#8b5cf6] focus:border-[#8b5cf6] text-white placeholder:text-slate-400 h-12 rounded-xl"
                required
                disabled={isLoading}
              />

              <Input
                type="password"
                placeholder="Contraseña"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                className="bg-transparent border-2 border-[#8b5cf6] focus:border-[#8b5cf6] text-white placeholder:text-slate-400 h-12 rounded-xl"
                required
                disabled={isLoading}
              />

              <Input
                type="password"
                placeholder="Confirmar contraseña"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                className="bg-transparent border-2 border-[#8b5cf6] focus:border-[#8b5cf6] text-white placeholder:text-slate-400 h-12 rounded-xl"
                required
                disabled={isLoading}
              />

              {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-sm text-red-200">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] disabled:opacity-50 text-white h-12 text-base font-medium rounded-xl"
              >
                {isLoading ? "Registrando..." : isFirstUser ? "Crear cuenta de administrador" : "Crear cuenta"}
              </Button>
            </form>

            <div className="text-center pt-4 border-t border-slate-500">
              <button
                onClick={() => router.push("/")}
                className="text-slate-400 hover:text-[#8b5cf6] transition-colors underline"
              >
                ← Volver al inicio de sesión
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
