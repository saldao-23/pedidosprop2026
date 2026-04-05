"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Check, UserPlus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Logo from "@/components/logo"
import { createClient } from "@/lib/supabase/client"

export default function RegisterInfoPage() {
  const router = useRouter()
  const [isFirstUser, setIsFirstUser] = useState(false)
  const [checkingFirstUser, setCheckingFirstUser] = useState(true)

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
  }, [])

  const openInstagram = () => {
    window.open("https://www.instagram.com/pedidosprop/", "_blank")
  }

  const handleLogoClick = () => {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true"
    if (isLoggedIn) {
      router.push("/dashboard")
    } else {
      router.push("/")
    }
  }

  if (checkingFirstUser) {
    return (
      <div className="min-h-screen bg-[#3a3544] flex items-center justify-center">
        <div className="text-white text-lg">Cargando...</div>
      </div>
    )
  }

  if (isFirstUser) {
    return (
      <div className="min-h-screen bg-[#3a3544] flex items-center justify-center p-4">
        <div className="w-full max-w-2xl space-y-8">
          {/* Logo */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-8">
              <Logo onClick={handleLogoClick} size="large" />
            </div>
          </div>

          {/* First User Card */}
          <Card className="bg-[#4a4458]/90 border-[#5a5568]/50 backdrop-blur-sm rounded-2xl">
            <div className="p-8 space-y-8">
              {/* Header */}
              <div className="text-center space-y-4">
                <div className="flex justify-center mb-4">
                  <div className="bg-[#8b5cf6] rounded-full p-4">
                    <UserPlus className="w-12 h-12 text-white" />
                  </div>
                </div>
                <h1 className="text-4xl font-bold text-white">¡Bienvenido!</h1>
                <div className="w-16 h-1 bg-[#8b5cf6] mx-auto rounded-full"></div>
                <p className="text-lg text-slate-300 leading-relaxed">
                  Eres el primer usuario del sistema.
                  <br />
                  Serás registrado automáticamente como{" "}
                  <span className="text-[#8b5cf6] font-semibold">administrador</span>.
                </p>
              </div>

              {/* Benefits section */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white text-center">Como administrador podrás:</h2>

                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-[#8b5cf6] rounded-full p-1 mt-1 flex-shrink-0">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-slate-300 leading-relaxed">Generar códigos de invitación para otros usuarios</p>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-[#8b5cf6] rounded-full p-1 mt-1 flex-shrink-0">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-slate-300 leading-relaxed">Gestionar todos los pedidos del sistema</p>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-[#8b5cf6] rounded-full p-1 mt-1 flex-shrink-0">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      Acceder a todas las funcionalidades administrativas
                    </p>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <div className="text-center space-y-6">
                <Button
                  onClick={() => router.push("/register")}
                  className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white px-8 py-6 rounded-xl font-medium text-lg"
                >
                  Crear cuenta de administrador
                </Button>
              </div>

              {/* Back to login link */}
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

  return (
    <div className="min-h-screen bg-[#3a3544] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-8">
            <Logo onClick={handleLogoClick} size="large" />
          </div>
        </div>

        {/* Registration Info Card */}
        <Card className="bg-[#4a4458]/90 border-[#5a5568]/50 backdrop-blur-sm rounded-2xl">
          <div className="p-8 space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold text-white">¡IMPORTANTE!</h1>
              <div className="w-16 h-1 bg-[#8b5cf6] mx-auto rounded-full"></div>
              <p className="text-lg text-slate-300 leading-relaxed">
                Para formar parte de esta red exclusiva de inmobiliarias
                <br />
                tenés que conseguir que otro colega te invite.
              </p>
            </div>

            {/* How to get invitation section */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white text-center">¿Cómo conseguir una invitación?</h2>

              <div className="space-y-4">
                {/* Bullet point 1 */}
                <div className="flex items-start gap-4">
                  <div className="bg-[#8b5cf6] rounded-full p-1 mt-1 flex-shrink-0">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Pedile a colegas que están registrados en pedidosPROP que te envíen una invitación.
                  </p>
                </div>

                {/* Bullet point 2 */}
                <div className="flex items-start gap-4">
                  <div className="bg-[#8b5cf6] rounded-full p-1 mt-1 flex-shrink-0">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-slate-300 leading-relaxed">Preguntá en los grupos de inmobiliarias en WhatsApp</p>
                </div>

                {/* Bullet point 3 */}
                <div className="flex items-start gap-4">
                  <div className="bg-[#8b5cf6] rounded-full p-1 mt-1 flex-shrink-0">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Contactanos por Instagram, decinos de qué Provincia sos, y te comunicaremos con un colega que ya
                    esté registrado.
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom message */}
            <div className="text-center space-y-6">
              <p className="text-slate-300 leading-relaxed">
                ¡Sumate a pedidosPROP y transformá la forma en que buscás
                <br />
                propiedades para tus clientes!
              </p>

              <Button
                onClick={openInstagram}
                className="bg-[#8b5cf6] hover:bg-[#8b5cf6] text-white px-8 py-3 rounded-xl font-medium"
              >
                Instagram
              </Button>
            </div>

            {/* Back to login link */}
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
