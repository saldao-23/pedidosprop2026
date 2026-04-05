"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, TrendingUp, Activity, Clock, ArrowUp } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Metrics {
  totalUsers: number
  viralCoefficient: number
  totalPedidos: number
  totalSearches: number
  totalWhatsAppClicks: number
  avgSessionTime: string
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<Metrics>({
    totalUsers: 0,
    viralCoefficient: 0,
    totalPedidos: 0,
    totalSearches: 0,
    totalWhatsAppClicks: 0,
    avgSessionTime: "0m 0s",
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const supabase = createClient()

        // 1. Total de usuarios
        const { count: totalUsers } = await supabase
          .from("perfiles")
          .select("*", { count: "exact", head: true })

        // 2. Total de pedidos
        const { count: totalPedidos } = await supabase
          .from("pedidos")
          .select("*", { count: "exact", head: true })

        // 3. Eventos de analytics
        const { data: analyticsData } = await supabase
          .from("analytics_events")
          .select("event_type")

        const totalSearches = analyticsData?.filter(e => e.event_type === "search").length || 0
        const totalWhatsAppClicks = analyticsData?.filter(e => e.event_type === "whatsapp_click").length || 0

        // 4. Tiempo promedio de sesión
        const { data: sessionsData } = await supabase
          .from("user_sessions")
          .select("duration_seconds")
          .not("duration_seconds", "is", null)

        let avgSessionTime = "0m 0s"
        if (sessionsData && sessionsData.length > 0) {
          const totalSeconds = sessionsData.reduce((sum, session) => sum + (session.duration_seconds || 0), 0)
          const avgSeconds = Math.floor(totalSeconds / sessionsData.length)
          const minutes = Math.floor(avgSeconds / 60)
          const seconds = avgSeconds % 60
          avgSessionTime = `${minutes}m ${seconds}s`
        }

        // 5. Coeficiente viral (invitaciones usadas / usuarios totales)
        const { count: invitacionesUsadas } = await supabase
          .from("invitaciones")
          .select("*", { count: "exact", head: true })
          .eq("usado", true)

        const viralCoefficient = totalUsers && totalUsers > 0
          ? parseFloat(((invitacionesUsadas || 0) / totalUsers).toFixed(2))
          : 0

        setMetrics({
          totalUsers: totalUsers || 0,
          viralCoefficient,
          totalPedidos: totalPedidos || 0,
          totalSearches,
          totalWhatsAppClicks,
          avgSessionTime,
        })
      } catch (error) {
        console.error("Error loading metrics:", error)
      } finally {
        setLoading(false)
      }
    }

    loadMetrics()
  }, [])

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8b5cf6] mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando métricas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white">Panel de Administración</h1>
        <p className="text-gray-400">Gestiona usuarios, administradores y visualiza métricas del sistema</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Usuarios registrados */}
        <Card className="bg-[#4a4458] border-gray-600">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2 text-lg">
              <Users className="w-5 h-5 text-[#8b5cf6]" />
              Usuarios registrados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">{metrics.totalUsers}</div>
            </div>
          </CardContent>
        </Card>

        {/* Coeficiente viral */}
        <Card className="bg-[#4a4458] border-gray-600">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2 text-lg">
              <TrendingUp className="w-5 h-5 text-[#8b5cf6]" />
              Coeficiente viral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">{metrics.viralCoefficient}</div>
              <div className="flex items-center justify-center gap-1 text-gray-400">
                <ArrowUp className="w-4 h-4" />
                <span className="text-sm">Tendencia</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actividad de la plataforma */}
        <Card className="bg-[#4a4458] border-gray-600">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2 text-lg">
              <Activity className="w-5 h-5 text-[#8b5cf6]" />
              Actividad de la plataforma
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Gráfico de barras simple */}
              <div className="flex items-end justify-between gap-2 h-20">
                <div className="flex flex-col items-center gap-2">
                  <div
                    className="w-8 bg-[#8b5cf6] rounded-t"
                    style={{ height: `${Math.max(8, (metrics.totalPedidos / Math.max(metrics.totalPedidos, metrics.totalSearches, metrics.totalWhatsAppClicks, 1)) * 60)}px` }}
                  ></div>
                  <span className="text-xs text-gray-400">Pedidos</span>
                  <span className="text-sm font-semibold text-white">{metrics.totalPedidos}</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div
                    className="w-8 bg-[#8b5cf6] rounded-t"
                    style={{ height: `${Math.max(8, (metrics.totalSearches / Math.max(metrics.totalPedidos, metrics.totalSearches, metrics.totalWhatsAppClicks, 1)) * 60)}px` }}
                  ></div>
                  <span className="text-xs text-gray-400">Búsquedas</span>
                  <span className="text-sm font-semibold text-white">{metrics.totalSearches}</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div
                    className="w-8 bg-[#8b5cf6] rounded-t"
                    style={{ height: `${Math.max(8, (metrics.totalWhatsAppClicks / Math.max(metrics.totalPedidos, metrics.totalSearches, metrics.totalWhatsAppClicks, 1)) * 60)}px` }}
                  ></div>
                  <span className="text-xs text-gray-400">WhatsApp</span>
                  <span className="text-sm font-semibold text-white">{metrics.totalWhatsAppClicks}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tiempo promedio de sesión */}
        <Card className="bg-[#4a4458] border-gray-600">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2 text-lg">
              <Clock className="w-5 h-5 text-[#8b5cf6]" />
              Tiempo promedio de sesión
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">{metrics.avgSessionTime}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Welcome Message */}
      <Card className="bg-[#4a4458] border-gray-600">
        <CardHeader>
          <CardTitle className="text-white">Bienvenido al Panel de Administración</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-300">Desde aquí puedes gestionar todos los aspectos de la plataforma pedidos PROP.</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-300">
              <Users className="w-4 h-4 text-[#8b5cf6]" />
              <span>Gestiona usuarios y sus pedidos</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <Activity className="w-4 h-4 text-[#8b5cf6]" />
              <span>Administra roles y permisos</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <TrendingUp className="w-4 h-4 text-[#8b5cf6]" />
              <span>Visualiza métricas y estadísticas</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
