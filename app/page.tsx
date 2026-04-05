"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Eye, EyeOff } from "lucide-react"
import Logo from "@/components/logo"
import { createClient } from "@/lib/supabase/client"
import { isValidEmail, isSafeInput } from "@/lib/validation"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const trimmedEmail = email.trim().toLowerCase()

    if (!isValidEmail(trimmedEmail)) {
      setError("Email inválido")
      setIsLoading(false)
      return
    }

    if (!isSafeInput(email)) {
      setError("Caracteres no permitidos")
      setIsLoading(false)
      return
    }

    const supabase = createClient()

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      })

      if (authError) throw authError

      if (data.user) {
        // Obtener el perfil del usuario para verificar su rol y WhatsApp
        const { data: perfil, error: perfilError } = await supabase
          .from("perfiles")
          .select("rol, telefono, nombre")
          .eq("id", data.user.id)
          .single()

        if (perfilError) {
          console.error("[v0] Error al obtener perfil:", perfilError)
          throw new Error("Error al obtener información del usuario")
        }

        // Guardar WhatsApp en localStorage para usar al crear pedidos
        if (perfil?.telefono) {
          localStorage.setItem("userWhatsApp", perfil.telefono)
        }

        // Guardar nombre de usuario
        if (perfil?.nombre) {
          localStorage.setItem("userName", perfil.nombre)
        }

        // Guardar rol de usuario
        if (perfil?.rol) {
          localStorage.setItem("userRole", perfil.rol)
        }

        // Marcar como autenticado
        localStorage.setItem("isLoggedIn", "true")

        console.log("[v0] Login exitoso, rol:", perfil?.rol)

        // Redirigir según el rol
        if (perfil?.rol === "admin") {
          router.push("/admin")
        } else {
          router.push("/dashboard")
        }
      }
    } catch (error: unknown) {
      console.error("[v0] Error en login:", error)
      setError(error instanceof Error ? error.message : "Error al iniciar sesión")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#3a3544] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-8">
            <Logo size="large" />
          </div>
        </div>

        {/* Login Form */}
        <Card className="bg-[#4a4458]/90 border-[#5a5568]/50 backdrop-blur-sm rounded-2xl">
          <div className="p-8 space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-white">Iniciar sesión</h1>
              <p className="text-slate-300">Ingresa los datos de tu cuenta</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-4">
                <div className="relative">
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-transparent border-2 border-[#8b5cf6] focus:border-[#8b5cf6] text-white placeholder:text-slate-400 h-14 text-base rounded-xl"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-transparent border-2 border-[#8b5cf6] focus:border-[#8b5cf6] text-white placeholder:text-slate-400 h-14 text-base rounded-xl pr-12"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-sm text-red-200">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] disabled:opacity-50 text-white h-14 text-base font-medium rounded-xl"
              >
                {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
              </Button>
            </form>

            {/* Footer Links */}
            <div className="space-y-4 text-center">
              <div className="text-slate-300">
                ¿No tenés una cuenta?{" "}
                <button
                  onClick={() => router.push("/register-info")}
                  className="text-white underline hover:text-[#8b5cf6] transition-colors"
                >
                  Regístrate
                </button>
              </div>

              <div className="border-t border-slate-500 pt-4">
                <button
                  onClick={() => router.push("/forgot-password")}
                  className="text-slate-300 hover:text-[#8b5cf6] transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
