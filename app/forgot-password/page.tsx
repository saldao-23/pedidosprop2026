"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Mail, CheckCircle } from "lucide-react"
import Logo from "@/components/logo"
import { createClient } from "@/lib/supabase/client"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (resetError) {
        console.error("Error sending recovery email:", resetError)
        setError("Error al enviar el email. Verifica que el correo sea correcto.")
        setIsLoading(false)
        return
      }

      setEmailSent(true)
      setIsLoading(false)
    } catch (error) {
      console.error("Error:", error)
      setError("Error al enviar el email. Inténtalo de nuevo.")
      setIsLoading(false)
    }
  }

  const handleLogoClick = () => {
    router.push("/")
  }

  if (emailSent) {
    return (
      <div className="min-h-screen bg-[#3a3544] flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-8">
              <Logo onClick={handleLogoClick} size="large" />
            </div>
          </div>

          {/* Success Message */}
          <Card className="bg-[#4a4458]/90 border-[#5a5568]/50 backdrop-blur-sm rounded-2xl">
            <div className="p-8 space-y-6 text-center">
              <div className="flex justify-center">
                <CheckCircle className="w-16 h-16 text-green-500" />
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-white">¡Email enviado!</h1>
                <p className="text-slate-300">Hemos enviado las instrucciones para recuperar tu contraseña a:</p>
                <p className="text-[#8b5cf6] font-semibold">{email}</p>
              </div>

              <div className="bg-[#3d3a47] border border-[#5a5568] rounded-lg p-4 text-sm text-slate-300">
                <p className="mb-2">
                  <strong>Revisa tu bandeja de entrada</strong> y sigue las instrucciones del email.
                </p>
                <p>Si no recibes el email en unos minutos, revisa tu carpeta de spam.</p>
              </div>

              <Button
                onClick={() => router.push("/")}
                className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white h-14 text-base font-medium rounded-xl"
              >
                Volver al inicio de sesión
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
        {/* Logo */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-8">
            <Logo onClick={handleLogoClick} size="large" />
          </div>
        </div>

        {/* Recovery Form */}
        <Card className="bg-[#4a4458]/90 border-[#5a5568]/50 backdrop-blur-sm rounded-2xl">
          <div className="p-8 space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="flex justify-center mb-4">
                <Mail className="w-12 h-12 text-[#8b5cf6]" />
              </div>
              <h1 className="text-2xl font-bold text-white">Recuperar contraseña</h1>
              <p className="text-slate-300">
                Ingresa tu email y te enviaremos las instrucciones para recuperar tu contraseña
              </p>
            </div>

            {/* Recovery Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative">
                <Input
                  type="email"
                  placeholder="Ingresa tu email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-transparent border-2 border-[#8b5cf6] focus:border-[#8b5cf6] text-white placeholder:text-slate-400 h-14 text-base rounded-xl"
                  required
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading || !email}
                className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] disabled:opacity-50 text-white h-14 text-base font-medium rounded-xl"
              >
                {isLoading ? "Enviando..." : "Enviar instrucciones"}
              </Button>
            </form>

            {/* Footer Links */}
            <div className="text-center">
              <button
                onClick={() => router.push("/")}
                className="text-slate-300 hover:text-[#8b5cf6] transition-colors flex items-center justify-center gap-2 mx-auto"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver al inicio de sesión
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
