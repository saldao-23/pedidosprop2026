"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Eye, EyeOff, Lock, CheckCircle } from "lucide-react"
import Logo from "@/components/logo"
import { createClient } from "@/lib/supabase/client"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Verificar si hay una sesión válida de recuperación
    const checkSession = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        setError("Enlace inválido o expirado. Solicita un nuevo enlace de recuperación.")
      }
    }

    checkSession()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()

      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) {
        console.error("Error updating password:", updateError)
        setError("Error al actualizar la contraseña. Inténtalo de nuevo.")
        setIsLoading(false)
        return
      }

      setSuccess(true)

      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        router.push("/")
      }, 3000)
    } catch (error) {
      console.error("Error:", error)
      setError("Error al actualizar la contraseña. Inténtalo de nuevo.")
      setIsLoading(false)
    }
  }

  const handleLogoClick = () => {
    router.push("/")
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#3a3544] flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-8">
              <Logo onClick={handleLogoClick} size="large" />
            </div>
          </div>

          <Card className="bg-[#4a4458]/90 border-[#5a5568]/50 backdrop-blur-sm rounded-2xl">
            <div className="p-8 space-y-6 text-center">
              <div className="flex justify-center">
                <CheckCircle className="w-16 h-16 text-green-500" />
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-white">¡Contraseña actualizada!</h1>
                <p className="text-slate-300">
                  Tu contraseña ha sido actualizada exitosamente. Serás redirigido al inicio de sesión...
                </p>
              </div>

              <Button
                onClick={() => router.push("/")}
                className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white h-14 text-base font-medium rounded-xl"
              >
                Ir al inicio de sesión
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#3a3544] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center mb-8">
            <Logo onClick={handleLogoClick} size="large" />
          </div>
        </div>

        <Card className="bg-[#4a4458]/90 border-[#5a5568]/50 backdrop-blur-sm rounded-2xl">
          <div className="p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="flex justify-center mb-4">
                <Lock className="w-12 h-12 text-[#8b5cf6]" />
              </div>
              <h1 className="text-2xl font-bold text-white">Nueva contraseña</h1>
              <p className="text-slate-300">Ingresa tu nueva contraseña</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Nueva contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-transparent border-2 border-[#8b5cf6] focus:border-[#8b5cf6] text-white placeholder:text-slate-400 h-14 text-base rounded-xl pr-12"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirmar contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-transparent border-2 border-[#8b5cf6] focus:border-[#8b5cf6] text-white placeholder:text-slate-400 h-14 text-base rounded-xl pr-12"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading || !password || !confirmPassword}
                className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] disabled:opacity-50 text-white h-14 text-base font-medium rounded-xl"
              >
                {isLoading ? "Actualizando..." : "Actualizar contraseña"}
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  )
}
