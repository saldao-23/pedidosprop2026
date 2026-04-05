"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Edit, Trash2, ArrowLeft, DoorOpen, User } from "lucide-react"

interface PropertyRequest {
  id: number
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

export default function UserOrdersPage({ params }: { params: { userId: string } }) {
  const [requests, setRequests] = useState<PropertyRequest[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [requestToDelete, setRequestToDelete] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const userName = searchParams.get("userName") || "Usuario"

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
    setTimeout(() => {
      // Simulate loading user's requests
      const mockRequests: PropertyRequest[] = [
        {
          id: 1,
          user: userName,
          whatsapp: "+54 11 1234-5678",
          timestamp: "2024-02-15",
          title: "Casa en zona norte con jardín",
          description:
            "Busco casa de 3 dormitorios con jardín amplio, preferiblemente en zona norte. Importante que tenga cochera para 2 autos.",
          operationType: "Compra",
          propertyType: "Casa",
          creditApproved: true,
          banks: ["Banco Nación", "BBVA"],
          province: "Buenos Aires",
          city: "San Isidro",
          neighborhoods: ["Martínez", "San Isidro Centro"],
          bedrooms: "3 dormitorios",
          currency: "USD ",
          minBudget: "150000",
          maxBudget: "200000",
        },
        {
          id: 2,
          user: userName,
          whatsapp: "+54 11 1234-5678",
          timestamp: "2024-02-10",
          title: "Departamento 2 ambientes en Palermo",
          description: "Departamento moderno en Palermo, preferiblemente con balcón y buena iluminación natural.",
          operationType: "Alquiler",
          propertyType: "Departamento",
          creditApproved: false,
          province: "CABA",
          city: "Buenos Aires",
          neighborhoods: ["Palermo", "Palermo Hollywood"],
          bedrooms: "2 ambientes",
          currency: "ARS ",
          minBudget: "80000",
          maxBudget: "120000",
        },
      ]

      setRequests(mockRequests)
      setLoading(false)
    }, 1000)
  }, [userName])

  const handleEditRequest = (requestId: number) => {
    router.push(`/edit-request/${requestId}`)
  }

  const handleDeleteRequest = (requestId: number) => {
    setRequestToDelete(requestId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (requestToDelete) {
      setRequests(requests.filter((request) => request.id !== requestToDelete))
      setDeleteDialogOpen(false)
      setRequestToDelete(null)
    }
  }

  const handleBackToUsers = () => {
    router.push("/admin/users")
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">Pedidos de {userName}</h1>
          <p className="text-gray-400">Cargando pedidos del usuario...</p>
        </div>
        <Card className="bg-[#4a4458] border-gray-600">
          <CardContent className="p-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8b5cf6] mx-auto mb-4"></div>
              <p className="text-gray-400">Cargando pedidos...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>Panel de Administrador</span>
          <span>/</span>
          <span>Gestión de Usuarios</span>
          <span>/</span>
          <span className="text-white">Pedidos de {userName}</span>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={handleBackToUsers}
            className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Gestión de Usuarios
          </Button>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <User className="w-8 h-8 text-[#8b5cf6]" />
              Pedidos de {userName}
            </h1>
            <p className="text-gray-400">Vista administrativa - Puedes editar y eliminar pedidos</p>
          </div>
        </div>
      </div>

      {/* Requests Grid */}
      {requests.length === 0 ? (
        <Card className="bg-[#4a4458] border-gray-600">
          <CardContent className="p-12">
            <div className="text-center">
              <div className="text-gray-400 text-lg mb-4">Este usuario no tiene pedidos</div>
              <div className="text-gray-500 text-sm">No se encontraron pedidos para este usuario</div>
            </div>
          </CardContent>
        </Card>
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
                          <AvatarFallback className="text-white">{userName.charAt(0).toUpperCase()}</AvatarFallback>
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
                            <AvatarFallback className="text-white">{userName.charAt(0).toUpperCase()}</AvatarFallback>
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
