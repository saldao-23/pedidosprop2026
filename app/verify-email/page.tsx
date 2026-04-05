"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail } from "lucide-react"
import Logo from "@/components/logo"

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || ""

  const handleLogoClick = () => {
    router.push("/")
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
          <div className="p-8 space-y-6 text-center">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-[#8b5cf6]/20 rounded-full flex items-center justify-center">
                <Mail className="w-10 h-10 text-[#8b5cf6]" />
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-white">¡Verifica tu email!</h1>
              <p className="text-slate-300">
                Hemos enviado un email de verificación a:
              </p>
              <p className="text-[#8b5cf6] font-semibold text-lg">{email}</p>
            </div>

            <div className="bg-[#3d3a47] border border-[#5a5568] rounded-lg p-4 text-left space-y-3">
              <p className="text-sm text-slate-300">
                <strong className="text-white">Pasos para continuar:</strong>
              </p>
              <ol className="text-sm text-slate-300 space-y-2 list-decimal list-inside">
                <li>Revisa tu bandeja de entrada</li>
                <li>Abre el email de pedidosPROP</li>
                <li>Haz clic en el enlace de verificación</li>
                <li>Serás redirigido al dashboard automáticamente</li>
              </ol>
              <p className="text-xs text-gray-400 mt-3">
                Si no recibes el email en unos minutos, revisa tu carpeta de spam o correo no deseado.
              </p>
            </div>

            <div className="pt-4 space-y-3">
              <Button
                onClick={() => router.push("/")}
                className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white h-12 text-base font-medium rounded-xl"
              >
                Volver al inicio de sesión
              </Button>
              <p className="text-xs text-gray-400">
                Una vez verificado tu email, podrás iniciar sesión
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
