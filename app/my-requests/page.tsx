"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Edit, Trash2, Plus, DoorOpen } from "lucide-react"
import Logo from "@/components/logo"
import { createClient } from "@/lib/supabase/client"

interface PropertyRequest {
  id: number | string
  user: string
  whatsapp: string | null
  timestamp: string
  title: string
  description: string
  operationType: string
  propertyType: string
  creditApproved: boolean
  banks?: string[]
  province: string
  city: string
  neighborhoods: string[]
  bedrooms: string
  currency: string
  minBudget: string
  maxBudget: string
  orderNumber?: string
}

export default function MyRequests() {
  const [requests, setRequests] = useState<PropertyRequest[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [requestToDelete, setRequestToDelete] = useState<number | string | null>(null)
  const router = useRouter()

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
    const loadMyRequests = async () => {
      try {
        const supabase = createClient()

        // Obtener usuario actual
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
          console.error("Error getting user:", userError)
          setRequests([])
          return
        }

        // Cargar SOLO los pedidos del usuario actual
        const { data: supabaseRequests, error } = await supabase
          .from("pedidos")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (error) {
          console.error("Error loading requests from Supabase:", error)
          setRequests([])
          return
        }

        // Transformar datos de Supabase al formato esperado
        const transformedRequests = supabaseRequests.map((request) => ({
          id: request.id,
          user: request.user_name,
          whatsapp: request.whatsapp,
          timestamp: request.created_at,
          title: request.title,
          description: request.description,
          operationType: request.operation_type,
          propertyType: request.property_type,
          creditApproved: request.credit_approved,
          banks: request.banks || [],
          province: request.province,
          city: request.city,
          neighborhoods: request.neighborhoods || [],
          bedrooms: request.bedrooms || "",
          currency: request.currency,
          minBudget: request.min_budget,
          maxBudget: request.max_budget,
          orderNumber: request.order_number?.toString(),
        }))

        setRequests(transformedRequests)
      } catch (error) {
        console.error("Error loading requests:", error)
        setRequests([])
      }
    }

    loadMyRequests()

    const handleFocus = () => {
      loadMyRequests()
    }

    window.addEventListener("focus", handleFocus)

    return () => {
      window.removeEventListener("focus", handleFocus)
    }
  }, [])

  const handleLogoClick = () => {
    router.push("/dashboard")
  }

  const handleCreateRequest = () => {
    router.push("/create-request")
  }

  const handleEditRequest = (requestId: number | string) => {
    router.push(`/edit-request/${requestId}`)
  }

  const handleDeleteRequest = (requestId: number | string) => {
    setRequestToDelete(requestId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (requestToDelete) {
      try {
        const supabase = createClient()

        const { error } = await supabase.from("pedidos").delete().eq("id", requestToDelete)

        if (error) {
          console.error("Error deleting request from Supabase:", error)
          alert("Error al eliminar el pedido. Inténtalo de nuevo.")
          return
        }

        setRequests(requests.filter((request) => request.id !== requestToDelete))
        setDeleteDialogOpen(false)
        setRequestToDelete(null)
      } catch (error) {
        console.error("Error deleting request:", error)
        alert("Error al eliminar el pedido. Inténtalo de nuevo.")
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#3a3544]">
      {/* Header */}
      <header className="bg-[#3a3544] border-b border-gray-600 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Navigation */}
          <div className="flex items-center gap-8">
            <div className="flex items-center">
              <Logo onClick={handleLogoClick} size="small" />
            </div>

            <nav className="flex items-center gap-6">
              <button className="text-[#8b5cf6] font-medium" onClick={() => router.push("/my-requests")}>
                Mis pedidos
              </button>
            </nav>
          </div>

          {/* Action Button */}
          <div className="flex items-center gap-3">
            <Button className="bg-[#65a30d] hover:bg-[#4d7c0f] text-white" onClick={handleCreateRequest}>
              <Plus className="w-4 h-4 mr-2" />
              Realizar un pedido
            </Button>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <div className="px-6 py-6">
        <div className="max-w-6xl mx-auto">
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Mis pedidos</h1>
            <p className="text-gray-400">Gestiona todos tus pedidos publicados</p>
          </div>

          {/* Requests Grid */}
          {requests.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-4">No tienes pedidos publicados</div>
              <div className="text-gray-500 text-sm mb-6">Crea tu primer pedido para comenzar a recibir propuestas</div>
              <Button className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white" onClick={handleCreateRequest}>
                <Plus className="w-4 h-4 mr-2" />
                Crear mi primer pedido
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {requests.map((request) => (
                <div key={request.id} className="relative">
                  {/* Action buttons positioned outside the card */}
                  <div className="absolute -top-2 -right-2 z-10 flex gap-1">
                    <Button
                      size="sm"
                      className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white p-2 h-8 w-8 rounded-full shadow-lg"
                      onClick={() => handleEditRequest(request.id)}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      className="bg-gray-600 hover:bg-gray-500 text-white p-2 h-8 w-8 rounded-full shadow-lg"
                      onClick={() => handleDeleteRequest(request.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>

                  <Card className="bg-[#4a4458] border-gray-600 overflow-hidden">
                    <CardContent className="py-4 px-6 overflow-hidden">
                      <div className="flex flex-col md:flex-row gap-4 overflow-hidden relative">
                        {/* Header section - User info in one row (horizontal only) */}
                        <div className="hidden md:flex md:items-center md:w-full md:mb-4 md:absolute md:top-0 md:left-0 md:right-0 md:px-6 md:py-2">
                          <div className="flex items-center gap-3">
                            <Avatar className="bg-[#8b5cf6] shrink-0">
                              <AvatarFallback className="text-white">I</AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="text-white font-semibold">{request.user}</h3>
                              <p className="text-gray-400 text-sm">{getRelativeTime(request.timestamp)}</p>
                            </div>
                          </div>
                        </div>

                        {/* Mobile layout - keep original structure */}
                        <div className="flex flex-col md:hidden">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <Avatar className="bg-[#8b5cf6] shrink-0">
                                <AvatarFallback className="text-white">I</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <h3 className="text-white font-semibold break-words">{request.user}</h3>
                                <p className="text-gray-400 text-sm break-words whitespace-normal text-wrap">
                                  {getRelativeTime(request.timestamp)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex-1 min-w-0 md:pr-32 md:mt-16">
                          <div className="mb-2 overflow-hidden">
                            <h4 className="text-white text-lg font-semibold leading-6 break-words whitespace-normal text-wrap">
                              {request.title}
                            </h4>
                          </div>

                          <div className="mb-3 overflow-hidden">
                            <p className="text-gray-300 text-sm leading-5 break-words whitespace-normal text-wrap">
                              {request.description}
                            </p>
                          </div>

                          <div className="mb-3 overflow-hidden">
                            <div className="flex flex-wrap gap-2">
                              <Badge className="bg-gray-700 text-gray-300 break-words">{request.operationType}</Badge>
                              <Badge className="bg-gray-700 text-gray-300 break-words">{request.propertyType}</Badge>
                              {request.bedrooms && (
                                <Badge className="bg-gray-700 text-gray-300 flex items-center gap-1">
                                  <DoorOpen className="w-3 h-3" />
                                  {request.bedrooms}
                                </Badge>
                              )}
                            </div>
                          </div>

                          {request.creditApproved && (
                            <div className="overflow-hidden">
                              <div className="flex items-center gap-1 flex-wrap">
                                <Badge className="bg-gray-700 text-gray-300">Apto crédito</Badge>
                                {request.banks && request.banks.length > 0 && (
                                  <span className="text-gray-400 text-sm">|</span>
                                )}
                                {request.banks &&
                                  request.banks.map((bank: string, index: number) => (
                                    <Badge
                                      key={index}
                                      variant="outline"
                                      className="border-[#8b5cf6] text-[#8b5cf6] text-xs"
                                    >
                                      {bank}
                                    </Badge>
                                  ))}
                              </div>
                            </div>
                          )}

                          <div className="mb-3 overflow-hidden">
                            <div className="text-sm mb-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-gray-400">Provincia:</span>
                                <Badge className="bg-gray-700 text-gray-300 break-words">{request.province}</Badge>
                                <span className="text-gray-400">Ciudad:</span>
                                <Badge className="bg-gray-700 text-gray-300 break-words">{request.city}</Badge>
                              </div>
                            </div>

                            {request.neighborhoods && request.neighborhoods.length > 0 && (
                              <div className="text-sm">
                                <div className="flex items-start gap-2 md:pr-48">
                                  <span className="text-gray-400 shrink-0">Zonas:</span>
                                  <div className="flex flex-wrap gap-1 flex-1">
                                    {request.neighborhoods.map((neighborhood: string, index: number) => (
                                      <Badge
                                        key={index}
                                        variant="outline"
                                        className="border-[#8b5cf6] text-[#8b5cf6] break-words text-xs"
                                      >
                                        {neighborhood}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="absolute bottom-4 right-6 md:block hidden">
                          <div className="text-right min-w-0">
                            <div className="text-gray-400 text-sm mb-1">Presupuesto</div>
                            <div className="text-white font-semibold break-words">
                              {request.currency}
                              {formatNumber(request.minBudget)} - {request.currency}
                              {formatNumber(request.maxBudget)}
                            </div>
                          </div>
                        </div>

                        <div className="md:hidden">
                          <div className="text-right min-w-0">
                            <div className="text-gray-400 text-sm mb-1">Presupuesto</div>
                            <div className="text-white font-semibold break-words">
                              {request.currency}
                              {formatNumber(request.minBudget)} - {request.currency}
                              {formatNumber(request.maxBudget)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-[#4a4458] border-gray-600 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Eliminar pedido</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-300">
              ¿Estás seguro de que quieres eliminar este pedido? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                className="bg-transparent border-gray-600 text-white hover:bg-gray-600"
                onClick={() => setDeleteDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button className="bg-red-500 hover:bg-red-600 text-white" onClick={confirmDelete}>
                Eliminar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
