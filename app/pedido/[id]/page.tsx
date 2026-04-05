"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, MessageCircle, ArrowUp } from "lucide-react"
import Logo from "@/components/logo"
import { createClient } from "@/lib/supabase/client"

interface Operacion {
  id: number
  nombre: string
}

interface Tipologia {
  id: number
  nombre: string
}

interface Moneda {
  id: number
  codigo: string
  nombre: string
}

interface Provincia {
  id: number
  nombre: string
}

interface Ciudad {
  id: number
  provincia_id: number
  nombre: string
}

interface Zona {
  id: number
  ciudad_id: number
  nombre: string
}

interface PedidoWithRelations {
  id: string
  user_name: string
  whatsapp: string | null
  created_at: string
  title: string
  description: string
  operacion_id: number
  tipologia_id: number
  moneda_id: number
  provincia_id: number
  ciudad_id: number
  zona_ids: number[]
  bedrooms: string
  credit_approved: boolean
  banks: string[]
  min_budget: string
  max_budget: string
  order_number: number
  // Relations
  operacion?: Operacion
  tipologia?: Tipologia
  moneda?: Moneda
  provincia?: Provincia
  ciudad?: Ciudad
  zonas?: Zona[]
}

export default function PedidoDetailPage() {
  const router = useRouter()
  const params = useParams()
  const pedidoId = params.id as string

  const [pedido, setPedido] = useState<PedidoWithRelations | null>(null)
  const [loading, setLoading] = useState(true)

  const formatNumber = (num: string | number) => {
    return Number(num).toLocaleString("es-AR")
  }

  const getRelativeTime = (timestamp: string) => {
    if (timestamp.includes("Hace") || timestamp === "Hoy") {
      return timestamp
    }

    const date = new Date(timestamp)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
    const diffInWeeks = Math.floor(diffInDays / 7)
    const diffInMonths = Math.floor(diffInDays / 30)

    if (diffInDays === 0) return "Hoy"
    if (diffInDays === 1) return "Hace 1 día"
    if (diffInDays < 7) return `Hace ${diffInDays} días`
    if (diffInWeeks === 1) return "Hace 1 semana"
    if (diffInWeeks < 4) return `Hace ${diffInWeeks} semanas`
    if (diffInMonths === 1) return "Hace 1 mes"
    return `Hace ${diffInMonths} meses`
  }

  useEffect(() => {
    const loadPedido = async () => {
      try {
        const supabase = createClient()

        const { data: pedidoData, error } = await supabase
          .from("pedidos")
          .select("*")
          .eq("id", pedidoId)
          .single()

        if (error || !pedidoData) {
          console.error("Error loading pedido:", error)
          setLoading(false)
          return
        }

        const [operacionesData, tipologiasData, monedasData, provinciasData, ciudadesData, zonasData] =
          await Promise.all([
            supabase.from("operaciones").select("*"),
            supabase.from("tipologias").select("*"),
            supabase.from("monedas").select("*"),
            supabase.from("provincias").select("*"),
            supabase.from("ciudades").select("*"),
            supabase.from("zonas").select("*"),
          ])

        const operacionesMap = new Map(operacionesData.data?.map((op) => [op.id, op]) || [])
        const tipologiasMap = new Map(tipologiasData.data?.map((tip) => [tip.id, tip]) || [])
        const monedasMap = new Map(monedasData.data?.map((mon) => [mon.id, mon]) || [])
        const provinciasMap = new Map(provinciasData.data?.map((prov) => [prov.id, prov]) || [])
        const ciudadesMap = new Map(ciudadesData.data?.map((ciudad) => [ciudad.id, ciudad]) || [])
        const zonasMap = new Map(zonasData.data?.map((zona) => [zona.id, zona]) || [])

        const zonas = pedidoData.zona_ids
          ? pedidoData.zona_ids.map((id: number) => zonasMap.get(id)).filter(Boolean)
          : []

        const pedidoWithRelations = {
          ...pedidoData,
          operacion: operacionesMap.get(pedidoData.operacion_id),
          tipologia: tipologiasMap.get(pedidoData.tipologia_id),
          moneda: monedasMap.get(pedidoData.moneda_id),
          provincia: provinciasMap.get(pedidoData.provincia_id),
          ciudad: ciudadesMap.get(pedidoData.ciudad_id),
          zonas,
        }

        setPedido(pedidoWithRelations)
        setLoading(false)
      } catch (error) {
        console.error("Error loading pedido:", error)
        setLoading(false)
      }
    }

    if (pedidoId) {
      loadPedido()
    }
  }, [pedidoId])

  const handleWhatsAppContact = () => {
    if (!pedido?.whatsapp) {
      alert("Este usuario no agregó un contacto de WhatsApp")
      return
    }

    const cleanNumber = pedido.whatsapp.replace(/[^\d]/g, "")
    const pedidoUrl = `${window.location.origin}/pedido/${pedido.id}`
    const mensaje = `Hola! Vi tu pedido "${pedido.title}" en pedidosPROP: ${pedidoUrl}`
    const encodedMensaje = encodeURIComponent(mensaje)
    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodedMensaje}`
    window.open(whatsappUrl, "_blank")
  }

  const handleBack = () => {
    router.push("/dashboard")
  }

  const handleLogoClick = () => {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true"
    if (isLoggedIn) {
      router.push("/dashboard")
    } else {
      router.push("/")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#3a3544] flex items-center justify-center">
        <div className="text-white text-xl">Cargando pedido...</div>
      </div>
    )
  }

  if (!pedido) {
    return (
      <div className="min-h-screen bg-[#3a3544]">
        <header className="bg-[#3a3544] border-b border-gray-600 px-4 sm:px-6 py-4">
          <div className="flex items-center">
            <Logo onClick={handleLogoClick} size="small" />
          </div>
        </header>
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="text-white text-2xl mb-4">Pedido no encontrado</div>
          <Button onClick={handleBack} className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#3a3544]">
      {/* Header */}
      <header className="bg-[#3a3544] border-b border-gray-600 px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <Logo onClick={handleLogoClick} size="small" />
          <Button
            onClick={handleBack}
            variant="outline"
            className="bg-transparent border-gray-600 text-white hover:bg-gray-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 sm:px-6 py-8 max-w-4xl mx-auto">
        <Card className="bg-[#4a4458] border-gray-600">
          <CardContent className="py-6 px-6">
            {/* User Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-600">
              <div className="flex items-center gap-3">
                <Avatar className="bg-[#8b5cf6] w-12 h-12">
                  <AvatarFallback className="text-white text-lg">I</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-white font-semibold text-lg">{pedido.user_name}</h3>
                  <p className="text-gray-400 text-sm">{getRelativeTime(pedido.created_at)}</p>
                </div>
              </div>
              <Button
                className={`${
                  pedido.whatsapp
                    ? "bg-[#8b5cf6] hover:bg-[#7c3aed] text-white"
                    : "bg-gray-600 text-gray-400 cursor-not-allowed"
                } flex items-center gap-2 w-full sm:w-auto`}
                onClick={handleWhatsAppContact}
                disabled={!pedido.whatsapp}
              >
                <MessageCircle className="w-4 h-4" />
                Contactar
              </Button>
            </div>

            {/* Title */}
            <div className="mb-4">
              <h1 className="text-white text-2xl font-bold">{pedido.title}</h1>
            </div>

            {/* Description */}
            <div className="mb-6">
              <p className="text-gray-300 text-base leading-relaxed">{pedido.description}</p>
            </div>

            {/* Tags */}
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-gray-700 text-gray-300">{pedido.operacion?.nombre || "N/A"}</Badge>
                <Badge className="bg-gray-700 text-gray-300">{pedido.tipologia?.nombre || "N/A"}</Badge>
                {pedido.bedrooms && (
                  <Badge className="bg-gray-700 text-gray-300 flex items-center gap-1">
                    <ArrowUp className="w-3 h-3" />
                    {pedido.bedrooms}
                  </Badge>
                )}
              </div>
            </div>

            {/* Credit Info */}
            {pedido.credit_approved && (
              <div className="mb-6">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-gray-700 text-gray-300">Apto crédito</Badge>
                  {pedido.banks && pedido.banks.length > 0 && (
                    <>
                      <span className="text-gray-400 text-sm">|</span>
                      {pedido.banks.map((bank: string, index: number) => (
                        <Badge key={index} variant="outline" className="border-[#8b5cf6] text-[#8b5cf6] text-xs">
                          {bank}
                        </Badge>
                      ))}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Location */}
            <div className="mb-4 space-y-3">
              <div className="flex items-center gap-6 text-sm flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Provincia:</span>
                  <Badge variant="outline" className="border-[#8b5cf6] text-[#8b5cf6]">
                    {pedido.provincia?.nombre || "N/A"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Ciudad:</span>
                  <Badge variant="outline" className="border-[#8b5cf6] text-[#8b5cf6]">
                    {pedido.ciudad?.nombre || "N/A"}
                  </Badge>
                </div>
              </div>

              {pedido.zonas && pedido.zonas.length > 0 && (
                <div className="text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-gray-400">Zonas:</span>
                    <div className="flex flex-wrap gap-1 flex-1">
                      {pedido.zonas.map((zona: Zona) => (
                        <Badge key={zona.id} variant="outline" className="border-[#8b5cf6] text-[#8b5cf6] text-xs">
                          {zona.nombre}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Budget */}
            <div className="pt-4 border-t border-gray-600">
              <div className="text-gray-400 text-sm mb-1">Presupuesto</div>
              <div className="text-white font-semibold text-xl">
                {pedido.moneda?.codigo || "N/A"}
                {formatNumber(pedido.min_budget)} - {pedido.moneda?.codigo || "N/A"}
                {formatNumber(pedido.max_budget)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
