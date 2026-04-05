"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, TrendingUp, Activity, Clock } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Metrics {
  totalUsers: number
  coeficienteViral: number
  totalPedidos: number
  totalBusquedas: number
  totalWhatsApp: number
  tiempoPromedio: string
}

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<Metrics>({
    totalUsers: 0,
    coeficienteViral: 0,
    totalPedidos: 0,
    totalBusquedas: 0,
    totalWhatsApp: 0,
    tiempoPromedio: "0m 0s",
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const supabase = createClient()
        const now = new Date()

        // 1. Contar usuarios totales
        const { count: totalUsers } = await supabase
          .from("perfiles")
          .select("*", { count: "exact", head: true })
          .eq("rol", "user")

        // 2. Calcular Coeficiente Viral (CV = nuevos esta semana / usuarios semana anterior)
        const startOfThisWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())
        startOfThisWeek.setHours(0, 0, 0, 0)

        const startOfLastWeek = new Date(startOfThisWeek)
        startOfLastWeek.setDate(startOfLastWeek.getDate() - 7)

        // Usuarios nuevos esta semana
        const { count: newUsersThisWeek } = await supabase
          .from("perfiles")
          .select("*", { count: "exact", head: true })
          .eq("rol", "user")
          .gte("created_at", startOfThisWeek.toISOString())

        // Usuarios existentes la semana anterior
        const { count: usersLastWeek } = await supabase
          .from("perfiles")
          .select("*", { count: "exact", head: true })
          .eq("rol", "user")
          .lt("created_at", startOfThisWeek.toISOString())

        const coeficienteViral = usersLastWeek && usersLastWeek > 0
          ? (newUsersThisWeek || 0) / usersLastWeek
          : 0

        // 3. Contar pedidos totales
        const { count: totalPedidos } = await supabase
          .from("pedidos")
          .select("*", { count: "exact", head: true })

        // 4. Contar búsquedas (eventos de tipo 'search')
        const { count: totalBusquedas } = await supabase
          .from("analytics_events")
          .select("*", { count: "exact", head: true })
          .eq("event_type", "search")

        // 5. Contar clics en WhatsApp
        const { count: totalWhatsApp } = await supabase
          .from("analytics_events")
          .select("*", { count: "exact", head: true })
          .eq("event_type", "whatsapp_click")

        // 6. Calcular tiempo promedio de sesión
        const { data: sessions } = await supabase
          .from("user_sessions")
          .select("duration_seconds")
          .not("duration_seconds", "is", null)

        let avgSeconds = 0
        if (sessions && sessions.length > 0) {
          const totalSeconds = sessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0)
          avgSeconds = Math.floor(totalSeconds / sessions.length)
        }

        const minutes = Math.floor(avgSeconds / 60)
        const seconds = avgSeconds % 60
        const tiempoPromedio = `${minutes}m ${seconds}s`

        setMetrics({
          totalUsers: totalUsers || 0,
          coeficienteViral: Math.round(coeficienteViral * 100) / 100,
          totalPedidos: totalPedidos || 0,
          totalBusquedas: totalBusquedas || 0,
          totalWhatsApp: totalWhatsApp || 0,
          tiempoPromedio,
        })

        setLoading(false)
      } catch (error) {
        console.error("Error loading metrics:", error)
        setLoading(false)
      }
    }

    loadMetrics()
  }, [])

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white">Métricas del Sistema</h1>
        <p className="text-gray-400">Visualiza estadísticas y métricas clave de la plataforma</p>
      </div>

      {loading ? (
        <div className="text-white text-center py-10">Cargando métricas...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Total Usuarios */}
          <Card className="bg-[#4a4458] border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2 text-lg">
                <Users className="w-5 h-5 text-[#8b5cf6]" />
                Total Usuarios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">{metrics.totalUsers}</div>
                <p className="text-sm text-gray-400">Usuarios registrados</p>
              </div>
            </CardContent>
          </Card>

          {/* Coeficiente Viral */}
          <Card className="bg-[#4a4458] border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5 text-[#8b5cf6]" />
                Coeficiente Viral
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">{metrics.coeficienteViral}</div>
                <p className="text-sm text-gray-400">Nuevos esta semana / Usuarios semana anterior</p>
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
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Pedidos</span>
                  <span className="text-white font-semibold text-lg">{metrics.totalPedidos}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Búsquedas</span>
                  <span className="text-white font-semibold text-lg">{metrics.totalBusquedas}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Clics WhatsApp</span>
                  <span className="text-white font-semibold text-lg">{metrics.totalWhatsApp}</span>
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
                <div className="text-4xl font-bold text-white mb-2">{metrics.tiempoPromedio}</div>
                <p className="text-sm text-gray-400">Por usuario</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
