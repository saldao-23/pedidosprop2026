"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Search, Users, Copy, Check, Plus, User, UserPlus, Menu, MessageCircle, ArrowUp } from "lucide-react"
import Logo from "@/components/logo"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

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
  user_id: string
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
  perfil?: {
    logo_url: string | null
  }
}

export default function Dashboard() {
  const [showFilters, setShowFilters] = useState(true)
  const [invitationsLeft, setInvitationsLeft] = useState(10)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [inviteLink, setInviteLink] = useState("")
  const [linkCopied, setLinkCopied] = useState(false)
  const [requests, setRequests] = useState<PedidoWithRelations[]>([])
  const [filteredRequests, setFilteredRequests] = useState<PedidoWithRelations[]>([])
  const [filters, setFilters] = useState({
    operacionId: null as number | null,
    tipologiaId: null as number | null,
    monedaId: null as number | null,
    minBudget: "",
    maxBudget: "",
    provinciaId: null as number | null,
    ciudadId: null as number | null,
    zonaIds: [] as number[],
    bedrooms: "",
  })

  // Catalog data
  const [operaciones, setOperaciones] = useState<Operacion[]>([])
  const [tipologias, setTipologias] = useState<Tipologia[]>([])
  const [monedas, setMonedas] = useState<Moneda[]>([])
  const [provincias, setProvincias] = useState<Provincia[]>([])
  const [ciudades, setCiudades] = useState<Ciudad[]>([])
  const [zonas, setZonas] = useState<Zona[]>([])
  const [isLoadingCiudades, setIsLoadingCiudades] = useState(false)
  const [isLoadingZonas, setIsLoadingZonas] = useState(false)

  const [budgetError, setBudgetError] = useState("")
  const [neighborhoodSearch, setNeighborhoodSearch] = useState("")
  const [showNeighborhoodDropdown, setShowNeighborhoodDropdown] = useState(false)
  const neighborhoodDropdownRef = useRef<HTMLDivElement>(null)

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const [displayedRequests, setDisplayedRequests] = useState<PedidoWithRelations[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const observerRef = useRef<HTMLDivElement>(null)
  const ITEMS_PER_PAGE = 20

  const router = useRouter()
  const searchParams = useSearchParams()
  const highlightedPedidoId = searchParams.get("pedido")

  const formatNumber = (num: string | number) => {
    return Number(num).toLocaleString("es-AR")
  }

  const formatInputNumber = (value: string) => {
    const number = value.replace(/\D/g, "")
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
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

  const validateBudgets = (min: string, max: string) => {
    if (min && max) {
      const minNum = Number.parseInt(min.replace(/\./g, ""))
      const maxNum = Number.parseInt(max.replace(/\./g, ""))
      if (maxNum < minNum) {
        setBudgetError("El presupuesto máximo no puede ser menor al mínimo")
        return false
      }
    }
    setBudgetError("")
    return true
  }

  const validateZoneSearch = (input: string): boolean => {
    const validPattern = /^[a-zA-Z0-9\s]*$/
    return validPattern.test(input) && input.length <= 30
  }

  const handleFilterChange = (key: string, value: string | number | null) => {
    const newFilters = { ...filters, [key]: value }

    // Reset dependent filters when parent changes
    if (key === "provinciaId") {
      newFilters.ciudadId = null
      newFilters.zonaIds = []
      if (value) {
        localStorage.setItem("lastFilterProvinciaId", value.toString())
      }
      localStorage.removeItem("lastFilterCiudadId")
    } else if (key === "ciudadId") {
      newFilters.zonaIds = []
      if (value) {
        localStorage.setItem("lastFilterCiudadId", value.toString())
      }
    }

    setFilters(newFilters)

    // Validate budgets
    if (key === "minBudget" || key === "maxBudget") {
      const min = key === "minBudget" ? (value as string) : newFilters.minBudget
      const max = key === "maxBudget" ? (value as string) : newFilters.maxBudget
      validateBudgets(min, max)
    }
  }

  // Load saved filter provincia/ciudad from localStorage
  useEffect(() => {
    const savedProvinciaId = localStorage.getItem("lastFilterProvinciaId")
    const savedCiudadId = localStorage.getItem("lastFilterCiudadId")

    if (savedProvinciaId) {
      setFilters(prev => ({ ...prev, provinciaId: Number(savedProvinciaId) }))
    }
    if (savedCiudadId) {
      setFilters(prev => ({ ...prev, ciudadId: Number(savedCiudadId) }))
    }
  }, [])

  // Cargar invitaciones disponibles del usuario
  useEffect(() => {
    const loadInvitations = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          const { data: perfil } = await supabase
            .from("perfiles")
            .select("invitaciones_disponibles")
            .eq("id", user.id)
            .single()

          if (perfil) {
            // Contar invitaciones usadas del usuario
            const { count: usadas } = await supabase
              .from("invitaciones")
              .select("*", { count: "exact", head: true })
              .eq("invitador_id", user.id)
              .eq("usado", true)

            // Total inicial menos las usadas
            const maxInvitaciones = perfil.invitaciones_disponibles || 10
            const disponibles = Math.max(maxInvitaciones - (usadas || 0), 0)

            setInvitationsLeft(disponibles)
          }
        }
      } catch (error) {
        console.error("Error loading invitations:", error)
      }
    }

    loadInvitations()
  }, [])

  useEffect(() => {
    const loadCatalogData = async () => {
      const supabase = createClient()

      try {
        // Cargar operaciones
        const { data: operacionesData } = await supabase.from("operaciones").select("*").order("nombre")
        if (operacionesData) setOperaciones(operacionesData)

        // Cargar tipologías
        const { data: tipologiasData } = await supabase.from("tipologias").select("*").order("nombre")
        if (tipologiasData) setTipologias(tipologiasData)

        // Cargar monedas
        const { data: monedasData } = await supabase.from("monedas").select("*").order("codigo")
        if (monedasData) setMonedas(monedasData)

        // Cargar provincias
        const { data: provinciasData } = await supabase.from("provincias").select("*").order("nombre")
        if (provinciasData) setProvincias(provinciasData)
      } catch (error) {
        console.error("Error loading catalog data:", error)
      }
    }

    loadCatalogData()
  }, [])

  useEffect(() => {
    const loadCiudades = async () => {
      if (!filters.provinciaId) {
        setCiudades([])
        return
      }

      setIsLoadingCiudades(true)
      const supabase = createClient()

      try {
        const { data: ciudadesData } = await supabase
          .from("ciudades")
          .select("*")
          .eq("provincia_id", filters.provinciaId)
          .order("nombre")

        if (ciudadesData) setCiudades(ciudadesData)
      } catch (error) {
        console.error("Error loading cities:", error)
      } finally {
        setIsLoadingCiudades(false)
      }
    }

    loadCiudades()
  }, [filters.provinciaId])

  useEffect(() => {
    const loadZonas = async () => {
      if (!filters.ciudadId) {
        setZonas([])
        return
      }

      setIsLoadingZonas(true)
      const supabase = createClient()

      try {
        const { data: zonasData } = await supabase
          .from("zonas")
          .select("*")
          .eq("ciudad_id", filters.ciudadId)
          .order("nombre")

        if (zonasData) setZonas(zonasData)
      } catch (error) {
        console.error("Error loading zones:", error)
      } finally {
        setIsLoadingZonas(false)
      }
    }

    loadZonas()
  }, [filters.ciudadId])

  useEffect(() => {
    const loadRequests = async () => {
      try {
        const supabase = createClient()

        // Cargar TODOS los pedidos (para que vean las tasaciones de otros usuarios)
        const { data: supabaseRequests, error } = await supabase
          .from("pedidos")
          .select("*")
          .order("created_at", { ascending: false })

        if (error) {
          console.error("Error loading requests from Supabase:", error)
          setRequests([])
          setFilteredRequests([])
          return
        }

        if (!supabaseRequests || supabaseRequests.length === 0) {
          setRequests([])
          setFilteredRequests([])
          return
        }

        const [operacionesData, tipologiasData, monedasData, provinciasData, ciudadesData, zonasData, perfilesData] =
          await Promise.all([
            supabase.from("operaciones").select("*"),
            supabase.from("tipologias").select("*"),
            supabase.from("monedas").select("*"),
            supabase.from("provincias").select("*"),
            supabase.from("ciudades").select("*"),
            supabase.from("zonas").select("*"),
            supabase.from("perfiles").select("id, logo_url"),
          ])

        const operacionesMap = new Map(operacionesData.data?.map((op) => [op.id, op]) || [])
        const tipologiasMap = new Map(tipologiasData.data?.map((tip) => [tip.id, tip]) || [])
        const monedasMap = new Map(monedasData.data?.map((mon) => [mon.id, mon]) || [])
        const provinciasMap = new Map(provinciasData.data?.map((prov) => [prov.id, prov]) || [])
        const ciudadesMap = new Map(ciudadesData.data?.map((ciudad) => [ciudad.id, ciudad]) || [])
        const zonasMap = new Map(zonasData.data?.map((zona) => [zona.id, zona]) || [])
        const perfilesMap = new Map(perfilesData.data?.map((perfil) => [perfil.id, perfil]) || [])

        const requestsWithRelations = supabaseRequests.map((request) => {
          const zonas = request.zona_ids ? request.zona_ids.map((id: number) => zonasMap.get(id)).filter(Boolean) : []
          const perfil = perfilesMap.get(request.user_id)

          return {
            ...request,
            operacion: operacionesMap.get(request.operacion_id),
            tipologia: tipologiasMap.get(request.tipologia_id),
            moneda: monedasMap.get(request.moneda_id),
            provincia: provinciasMap.get(request.provincia_id),
            ciudad: ciudadesMap.get(request.ciudad_id),
            zonas,
            perfil: perfil ? { logo_url: perfil.logo_url } : null,
          }
        })

        setRequests(requestsWithRelations)
        setFilteredRequests(requestsWithRelations)
      } catch (error) {
        console.error("Error loading requests:", error)
        setRequests([])
        setFilteredRequests([])
      }
    }

    loadRequests()

    const handleFocus = () => {
      loadRequests()
    }

    window.addEventListener("focus", handleFocus)

    return () => {
      window.removeEventListener("focus", handleFocus)
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (neighborhoodDropdownRef.current && !neighborhoodDropdownRef.current.contains(event.target as Node)) {
        setShowNeighborhoodDropdown(false)
      }
    }

    if (showNeighborhoodDropdown) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showNeighborhoodDropdown])

  const handleProfileClick = () => {
    router.push("/profile")
  }

  const handleCreateRequest = () => {
    router.push("/create-request")
  }

  const handleLogoClick = () => {
    router.push("/dashboard")
  }

  const generateInviteLink = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        alert("Debes iniciar sesión")
        return
      }

      // Verificar invitaciones disponibles
      const { data: perfil } = await supabase
        .from("perfiles")
        .select("invitaciones_disponibles")
        .eq("id", user.id)
        .single()

      if (!perfil) {
        alert("Error al cargar el perfil")
        return
      }

      // Contar invitaciones usadas
      const { count: usadas } = await supabase
        .from("invitaciones")
        .select("*", { count: "exact", head: true })
        .eq("invitador_id", user.id)
        .eq("usado", true)

      const maxInvitaciones = perfil.invitaciones_disponibles || 10
      const disponibles = Math.max(maxInvitaciones - (usadas || 0), 0)

      if (disponibles <= 0) {
        alert("No tienes invitaciones disponibles")
        return
      }

      // Generar código único
      const uniqueId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

      // Guardar invitación en la base de datos
      const { error: inviteError } = await supabase
        .from("invitaciones")
        .insert({
          codigo: uniqueId,
          invitador_id: user.id,
          usado: false
        })

      if (inviteError) {
        console.error("Error creating invitation:", inviteError)
        alert("Error al crear la invitación")
        return
      }

      // NO decrementar todavía - se decrementa cuando el invitado confirme su email

      const link = `${window.location.origin}/register?invite=${uniqueId}`
      setInviteLink(link)
      setInviteDialogOpen(true)
    } catch (error) {
      console.error("Error generating invite link:", error)
      alert("Error al generar el enlace de invitación")
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy: ", err)
    }
  }

  const handleWhatsAppContact = async (phoneNumber: string | null, pedidoId: string, pedidoTitle: string) => {
    if (!phoneNumber) {
      alert("Este usuario no agregó un contacto de WhatsApp")
      return
    }

    // Registrar evento de clic en WhatsApp
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        await supabase.from("analytics_events").insert({
          user_id: user.id,
          event_type: "whatsapp_click",
          metadata: {
            pedido_id: pedidoId,
            pedido_title: pedidoTitle
          }
        })
      }
    } catch (error) {
      console.error("Error registrando clic WhatsApp:", error)
    }

    const cleanNumber = phoneNumber.replace(/[^\d]/g, "")
    const pedidoUrl = `${window.location.origin}/pedido/${pedidoId}`
    const mensaje = `Hola! Vi tu pedido "${pedidoTitle}" en pedidosPROP: ${pedidoUrl}`
    const encodedMensaje = encodeURIComponent(mensaje)
    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodedMensaje}`
    window.open(whatsappUrl, "_blank")
  }

  const getFilteredRequests = () => {
    return requests.filter((request) => {
      if (filters.operacionId && request.operacion_id !== filters.operacionId) {
        return false
      }

      if (filters.tipologiaId && request.tipologia_id !== filters.tipologiaId) {
        return false
      }

      if (filters.monedaId && request.moneda_id !== filters.monedaId) {
        return false
      }

      if (filters.minBudget || filters.maxBudget) {
        const requestMin = Number.parseInt(request.min_budget)
        const requestMax = Number.parseInt(request.max_budget)
        const filterMin = filters.minBudget ? Number.parseInt(filters.minBudget.replace(/\./g, "")) : 0
        const filterMax = filters.maxBudget
          ? Number.parseInt(filters.maxBudget.replace(/\./g, ""))
          : Number.POSITIVE_INFINITY

        if (requestMax < filterMin || requestMin > filterMax) {
          return false
        }
      }

      if (filters.provinciaId && request.provincia_id !== filters.provinciaId) {
        return false
      }

      if (filters.ciudadId && request.ciudad_id !== filters.ciudadId) {
        return false
      }

      if (filters.zonaIds.length > 0) {
        const hasMatchingZone = filters.zonaIds.some((zonaId) => request.zona_ids?.includes(zonaId))
        if (!hasMatchingZone) {
          return false
        }
      }

      if (filters.bedrooms && filters.bedrooms !== "M") {
        const filterBedrooms = Number.parseInt(filters.bedrooms.replace("+", ""))
        const requestBedrooms = request.bedrooms ? Number.parseInt(request.bedrooms) : 0
        if (requestBedrooms < filterBedrooms) {
          return false
        }
      }

      return true
    })
  }

  const loadMoreRequests = useCallback(() => {
    if (isLoading || !hasMore) return

    setIsLoading(true)

    setTimeout(() => {
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
      const endIndex = startIndex + ITEMS_PER_PAGE
      const newRequests = filteredRequests.slice(startIndex, endIndex)

      if (newRequests.length === 0) {
        setHasMore(false)
      } else {
        setDisplayedRequests((prev) => [...prev, ...newRequests])
        setCurrentPage((prev) => prev + 1)
      }

      setIsLoading(false)
    }, 500)
  }, [currentPage, filteredRequests, isLoading, hasMore])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMoreRequests()
        }
      },
      { threshold: 0.1 },
    )

    if (observerRef.current) {
      observer.observe(observerRef.current)
    }

    return () => observer.disconnect()
  }, [loadMoreRequests, hasMore, isLoading])

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  useEffect(() => {
    setDisplayedRequests(filteredRequests.slice(0, ITEMS_PER_PAGE))
    setCurrentPage(2)
    setHasMore(filteredRequests.length > ITEMS_PER_PAGE)
  }, [filteredRequests])

  // Scroll automático al pedido destacado
  useEffect(() => {
    if (highlightedPedidoId && displayedRequests.length > 0) {
      setTimeout(() => {
        const element = document.getElementById(`pedido-${highlightedPedidoId}`)
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" })
        }
      }, 500)
    }
  }, [highlightedPedidoId, displayedRequests])

  const handleSearch = async () => {
    if (budgetError) return
    const filtered = getFilteredRequests()
    setFilteredRequests(filtered)

    // Registrar evento de búsqueda
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        await supabase.from("analytics_events").insert({
          user_id: user.id,
          event_type: "search",
          metadata: {
            filters: {
              operacion: filters.operacionId,
              tipologia: filters.tipologiaId,
              provincia: filters.provinciaId,
              ciudad: filters.ciudadId,
            }
          }
        })
      }
    } catch (error) {
      console.error("Error registrando búsqueda:", error)
    }
  }

  const handleClearFilters = () => {
    setFilters({
      operacionId: null,
      tipologiaId: null,
      monedaId: null,
      minBudget: "",
      maxBudget: "",
      provinciaId: null,
      ciudadId: null,
      zonaIds: [],
      bedrooms: "",
    })
    setBudgetError("")
    setNeighborhoodSearch("")
    setFilteredRequests(requests)
  }

  const getAvailableZones = () => {
    if (!filters.ciudadId) return []

    let availableZones = zonas

    if (neighborhoodSearch) {
      availableZones = availableZones.filter((z) => z.nombre.toLowerCase().includes(neighborhoodSearch.toLowerCase()))
    }

    return availableZones.slice(0, 5)
  }

  const handleZoneSelect = (zona: Zona) => {
    if (!filters.zonaIds.includes(zona.id) && filters.zonaIds.length < 5) {
      handleFilterChange("zonaIds", [...filters.zonaIds, zona.id])
    } else if (filters.zonaIds.length >= 5) {
      alert("Máximo 5 zonas permitidas")
    }
    setNeighborhoodSearch("")
    setShowNeighborhoodDropdown(false)
  }

  const removeZone = (zonaId: number) => {
    handleFilterChange(
      "zonaIds",
      filters.zonaIds.filter((id) => id !== zonaId),
    )
  }

  const getSelectedZones = () => {
    return zonas.filter((z) => filters.zonaIds.includes(z.id))
  }

  return (
    <div className="min-h-screen bg-[#3a3544] overflow-x-hidden max-w-full">
      {/* Header */}
      <header className="bg-[#3a3544] border-b border-gray-600 px-4 sm:px-6 py-4 overflow-x-hidden">
        <div className="flex items-center justify-between gap-4 max-w-full">
          <div className="flex items-center gap-4 sm:gap-8 min-w-0 flex-1">
            <div className="flex items-center shrink-0">
              <Logo onClick={handleLogoClick} size="small" />
            </div>

            <nav className="hidden lg:flex items-center gap-6">
              <button
                className="text-white hover:text-[#8b5cf6] transition-colors"
                onClick={() => router.push("/my-requests")}
              >
                Mis pedidos
              </button>
            </nav>
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white relative" onClick={generateInviteLink}>
                  <Users className="w-4 h-4 mr-2" />
                  Invitar colegas
                  <Badge className="ml-2 bg-white text-[#8b5cf6] text-xs px-2 py-1">{invitationsLeft}</Badge>
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#4a4458] border-gray-600 text-white">
                <DialogHeader>
                  <DialogTitle className="text-white">Invitar Colega</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-gray-300">
                    Comparte este enlace con tu colega para que pueda registrarse en pedidosPROP:
                  </p>
                  <div className="flex items-center gap-2">
                    <Input value={inviteLink} readOnly className="bg-[#3a3544] border-gray-600 text-white" />
                    <Button
                      onClick={copyToClipboard}
                      variant="outline"
                      size="icon"
                      className="border-gray-600 hover:bg-gray-600 bg-transparent"
                    >
                      {linkCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-400">Te quedan {invitationsLeft} invitaciones disponibles.</p>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              className="bg-orange-500 hover:bg-orange-600 text-white"
              onClick={() => window.open("https://forms.gle/zxLvdiztiaCZeiY39", "_blank")}
            >
              <Plus className="w-4 h-4 mr-2" />
              Sugerir mejoras
            </Button>

            <Button className="bg-[#65a30d] hover:bg-[#4d7c0f] text-white" onClick={handleCreateRequest}>
              <Plus className="w-4 h-4 mr-2" />
              Realizar un pedido
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-gray-700" onClick={handleProfileClick}>
              <User className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex lg:hidden items-center gap-2">
            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="icon"
                  className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white relative"
                  onClick={generateInviteLink}
                >
                  <UserPlus className="w-4 h-4" />
                  <Badge className="absolute -top-1 -right-1 bg-white text-[#8b5cf6] text-xs px-1 py-0 min-w-[16px] h-4 flex items-center justify-center rounded-full">
                    {invitationsLeft}
                  </Badge>
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#4a4458] border-gray-600 text-white">
                <DialogHeader>
                  <DialogTitle className="text-white">Invitar Colega</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-gray-300">
                    Comparte este enlace con tu colega para que pueda registrarse en pedidosPROP:
                  </p>
                  <div className="flex items-center gap-2">
                    <Input value={inviteLink} readOnly className="bg-[#3a3544] border-gray-600 text-white" />
                    <Button
                      onClick={copyToClipboard}
                      variant="outline"
                      size="icon"
                      className="border-gray-600 hover:bg-gray-600 bg-transparent"
                    >
                      {linkCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-400">Te quedan {invitationsLeft} invitaciones disponibles.</p>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              size="icon"
              className="bg-orange-500 hover:bg-orange-600 text-white"
              onClick={() => window.open("https://forms.gle/zxLvdiztiaCZeiY39", "_blank")}
            >
              <Plus className="w-4 h-4" />
            </Button>

            <Button size="icon" className="bg-[#65a30d] hover:bg-[#4d7c0f] text-white" onClick={handleCreateRequest}>
              <Plus className="w-4 h-4" />
            </Button>

            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-gray-700">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-[#3a3548] border-gray-600 text-white w-80">
                <div className="flex flex-col space-y-6 mt-6">
                  <nav className="flex flex-col space-y-4">
                    <button
                      className="text-white hover:text-[#8b5cf6] transition-colors text-left py-2 px-4 rounded hover:bg-gray-700"
                      onClick={() => {
                        router.push("/my-requests")
                        setSidebarOpen(false)
                      }}
                    >
                      Mis pedidos
                    </button>

                    <button
                      className="text-white hover:text-orange-500 transition-colors text-left py-2 px-4 rounded hover:bg-gray-700"
                      onClick={() => {
                        window.open("https://forms.gle/zxLvdiztiaCZeiY39", "_blank")
                        setSidebarOpen(false)
                      }}
                    >
                      Sugerir mejoras
                    </button>
                  </nav>

                  <div className="border-t border-gray-600 pt-4">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-white hover:bg-gray-700"
                      onClick={() => {
                        handleProfileClick()
                        setSidebarOpen(false)
                      }}
                    >
                      <User className="w-5 h-5 mr-3" />
                      Perfil
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Filters Section */}
      <div className="px-4 sm:px-6 py-4 sm:py-6 border-b border-gray-600 overflow-x-hidden">
        <div className="space-y-4 max-w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-white flex-wrap">
            <span className="text-sm sm:text-base shrink-0">Busco un pedido de</span>
            <Select
              value={filters.operacionId?.toString() || ""}
              onValueChange={(value) => handleFilterChange("operacionId", value ? Number(value) : null)}
            >
              <SelectTrigger className="w-full sm:w-40 bg-[#4a4458] border-gray-600 text-white [&>span]:text-gray-300">
                <SelectValue placeholder="Operación" />
              </SelectTrigger>
              <SelectContent className="bg-[#4a4458] border-gray-600">
                {operaciones.map((operacion) => (
                  <SelectItem key={operacion.id} value={operacion.id.toString()}>
                    {operacion.nombre.charAt(0).toUpperCase() + operacion.nombre.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm sm:text-base shrink-0">de</span>
            <Select
              value={filters.tipologiaId?.toString() || ""}
              onValueChange={(value) => handleFilterChange("tipologiaId", value ? Number(value) : null)}
            >
              <SelectTrigger className="w-full sm:w-40 bg-[#4a4458] border-gray-600 text-white [&>span]:text-gray-300">
                <SelectValue placeholder="Tipología" />
              </SelectTrigger>
              <SelectContent className="bg-[#4a4458] border border-gray-600 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                {tipologias.map((tipologia) => (
                  <SelectItem key={tipologia.id} value={tipologia.id.toString()}>
                    {tipologia.nombre.charAt(0).toUpperCase() + tipologia.nombre.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-white flex-wrap">
            <span className="text-sm sm:text-base shrink-0">con presupuesto entre</span>
            <Select
              value={filters.monedaId?.toString() || ""}
              onValueChange={(value) => handleFilterChange("monedaId", value ? Number(value) : null)}
            >
              <SelectTrigger className="w-20 bg-[#4a4458] border-gray-600 text-white [&>span]:text-gray-300">
                <SelectValue placeholder="USD" />
              </SelectTrigger>
              <SelectContent className="bg-[#4a4458] border border-gray-600 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                {monedas.map((moneda) => (
                  <SelectItem key={moneda.id} value={moneda.id.toString()}>
                    {moneda.codigo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex flex-col w-full sm:w-auto">
              <Input
                placeholder="Mínimo"
                value={filters.minBudget}
                onChange={(e) => {
                  const formatted = formatInputNumber(e.target.value)
                  const numericValue = formatted.replace(/\./g, "")
                  if (numericValue.length <= 9) {
                    handleFilterChange("minBudget", formatted)
                  }
                }}
                className={`w-full sm:w-32 bg-[#4a4458] border-gray-600 text-white placeholder:text-gray-400 ${budgetError ? "border-red-500" : ""}`}
              />
            </div>
            <span className="text-sm sm:text-base shrink-0">y</span>
            <div className="flex flex-col w-full sm:w-auto">
              <Input
                placeholder="Máximo"
                value={filters.maxBudget}
                onChange={(e) => {
                  const formatted = formatInputNumber(e.target.value)
                  const numericValue = formatted.replace(/\./g, "")
                  if (numericValue.length <= 9) {
                    handleFilterChange("maxBudget", formatted)
                  }
                }}
                className={`w-full sm:w-32 bg-[#4a4458] border-gray-600 text-white placeholder:text-gray-400 ${budgetError ? "border-red-500" : ""}`}
              />
            </div>
          </div>

          {budgetError && <div className="text-red-400 text-sm">{budgetError}</div>}

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-white flex-wrap">
            <span className="text-sm sm:text-base shrink-0">en</span>
            <Select
              value={filters.provinciaId?.toString() || ""}
              onValueChange={(value) => handleFilterChange("provinciaId", value ? Number(value) : null)}
            >
              <SelectTrigger className="w-full sm:w-40 bg-[#4a4458] border-gray-600 text-white [&>span]:text-gray-300">
                <SelectValue placeholder="Provincia" />
              </SelectTrigger>
              <SelectContent className="bg-[#4a4458] border border-gray-600 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                {provincias.map((provincia) => (
                  <SelectItem key={provincia.id} value={provincia.id.toString()}>
                    {provincia.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.ciudadId?.toString() || ""}
              onValueChange={(value) => handleFilterChange("ciudadId", value ? Number(value) : null)}
              disabled={!filters.provinciaId || isLoadingCiudades}
            >
              <SelectTrigger
                className={`w-full sm:w-40 bg-[#4a4458] border-gray-600 text-white [&>span]:text-gray-300 ${!filters.provinciaId || isLoadingCiudades ? "opacity-50" : ""}`}
              >
                <SelectValue placeholder={isLoadingCiudades ? "Cargando..." : "Ciudad"} />
              </SelectTrigger>
              <SelectContent className="bg-[#4a4458] border border-gray-600 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                {ciudades.map((ciudad) => (
                  <SelectItem key={ciudad.id} value={ciudad.id.toString()}>
                    {ciudad.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative w-full sm:w-80" ref={neighborhoodDropdownRef}>
              <div className="flex items-center">
                <Input
                  placeholder={filters.provinciaId && filters.ciudadId ? "Buscar zonas..." : "Zonas"}
                  value={neighborhoodSearch}
                  onChange={(e) => {
                    const value = e.target.value

                    if (value.length <= 30 && /^[a-zA-Z0-9\s]*$/.test(value)) {
                      setNeighborhoodSearch(value)
                      // Mostrar dropdown solo cuando hay texto
                      if (value.length > 0) {
                        setShowNeighborhoodDropdown(true)
                      } else {
                        setShowNeighborhoodDropdown(false)
                      }
                    }
                  }}
                  onFocus={() => {
                    if (neighborhoodSearch.length > 0) {
                      setShowNeighborhoodDropdown(true)
                    }
                  }}
                  disabled={!filters.provinciaId || !filters.ciudadId || isLoadingZonas}
                  className={`w-full bg-[#4a4458] border-gray-600 text-white placeholder:text-gray-400 ${!filters.provinciaId || !filters.ciudadId || isLoadingZonas ? "opacity-50" : ""}`}
                  maxLength={30}
                />
                <Search className="w-4 h-4 text-gray-400 ml-2 shrink-0" />
              </div>
              {neighborhoodSearch && (
                <div className="text-xs text-gray-400 mt-1">{neighborhoodSearch.length}/30 caracteres</div>
              )}

              {showNeighborhoodDropdown && neighborhoodSearch && filters.provinciaId && filters.ciudadId && !isLoadingZonas && (
                <div
                  className="absolute top-full left-0 right-0 mt-1 bg-[#4a4458] border border-gray-600 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto"
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#8b5cf6 #4a4458'
                  }}
                >
                  <style jsx>{`
                    div::-webkit-scrollbar {
                      width: 8px;
                    }
                    div::-webkit-scrollbar-track {
                      background: #4a4458;
                      border-radius: 4px;
                    }
                    div::-webkit-scrollbar-thumb {
                      background: #8b5cf6;
                      border-radius: 4px;
                    }
                    div::-webkit-scrollbar-thumb:hover {
                      background: #7c3aed;
                    }
                  `}</style>
                  {getAvailableZones().map((zona) => (
                    <button
                      key={zona.id}
                      className="w-full text-left px-3 py-2 text-white hover:bg-[#8b5cf6] text-sm"
                      onClick={() => handleZoneSelect(zona)}
                    >
                      {zona.nombre}
                    </button>
                  ))}
                  {neighborhoodSearch && getAvailableZones().length === 0 && (
                    <div className="px-3 py-2 text-gray-400 text-sm">No se encontraron zonas</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {filters.zonaIds.length > 0 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <span className="text-gray-400 text-sm shrink-0">Zonas seleccionadas ({filters.zonaIds.length}/5):</span>
              <div className="flex flex-wrap gap-2 max-w-full">
                {getSelectedZones().map((zona) => (
                  <Badge
                    key={zona.id}
                    variant="outline"
                    className="border-[#8b5cf6] text-[#8b5cf6] cursor-pointer hover:bg-[#8b5cf6] hover:text-white break-words"
                    onClick={() => removeZone(zona.id)}
                  >
                    {zona.nombre} ×
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-white flex-wrap">
            <span className="text-sm sm:text-base shrink-0">con un mínimo de</span>
            <div className="flex flex-wrap gap-2">
              {["M", "1+", "2+", "3+", "4+", "5+"].map((bedroom) => (
                <button
                  key={bedroom}
                  onClick={() => handleFilterChange("bedrooms", filters.bedrooms === bedroom ? "" : bedroom)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    filters.bedrooms === bedroom
                      ? "bg-[#8b5cf6] text-white shadow-md"
                      : "bg-[#4a4458] text-gray-300 border border-gray-600 hover:bg-[#5a5468] hover:border-gray-500"
                  }`}
                >
                  {bedroom}
                </button>
              ))}
            </div>
            <span className="text-sm sm:text-base shrink-0">dormitorios/privados</span>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
            <Button
              variant="outline"
              className="bg-[#4a4458] border-gray-600 text-white hover:bg-gray-600 w-full sm:w-auto"
              onClick={handleClearFilters}
            >
              Limpiar filtros
            </Button>
            <Button
              className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white w-full sm:w-auto"
              disabled={!!budgetError}
              onClick={handleSearch}
            >
              Buscar
            </Button>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="px-4 sm:px-6 py-4 sm:py-6 overflow-x-hidden">
        {displayedRequests.length === 0 && !isLoading ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">No se encontraron pedidos</div>
            <div className="text-gray-500 text-sm">
              {Object.values(filters).some(
                (filter) => filter !== "" && filter !== null && (Array.isArray(filter) ? filter.length > 0 : true),
              )
                ? "Intenta ajustar los filtros de búsqueda para encontrar más resultados"
                : "No hay pedidos disponibles en este momento"}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {displayedRequests.map((request) => (
              <Card
                key={request.id}
                id={`pedido-${request.id}`}
                className={`overflow-hidden transition-all duration-300 ${
                  highlightedPedidoId === request.id
                    ? "bg-[#5a4f68] border-[#8b5cf6] border-2 shadow-lg shadow-[#8b5cf6]/50"
                    : "bg-[#4a4458] border-gray-600"
                }`}
              >
                <CardContent className="py-4 px-6 overflow-hidden">
                  <div className="flex flex-col md:flex-row gap-4 overflow-hidden relative">
                    {/* Header section - User info and contact button in one row (horizontal only) */}
                    <div className="hidden md:flex md:justify-between md:items-center md:w-full md:mb-4 md:absolute md:top-0 md:left-0 md:right-0 md:px-6 md:py-2">
                      <div className="flex items-center gap-3">
                        <Avatar className="bg-[#8b5cf6] shrink-0">
                          {request.perfil?.logo_url ? (
                            <img
                              src={request.perfil.logo_url}
                              alt={request.user_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <AvatarFallback className="text-white">
                              {request.user_name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-white font-semibold">{request.user_name}</h3>
                          </div>
                          <p className="text-gray-400 text-sm">{getRelativeTime(request.created_at)}</p>
                        </div>
                      </div>
                      <Button
                        className={`${
                          request.whatsapp
                            ? "bg-[#8b5cf6] hover:bg-[#7c3aed] text-white"
                            : "bg-gray-600 text-gray-400 cursor-not-allowed"
                        } flex items-center gap-2`}
                        onClick={() => handleWhatsAppContact(request.whatsapp, request.id, request.title)}
                        disabled={!request.whatsapp}
                      >
                        <MessageCircle className="w-4 h-4" />
                        Contactar
                      </Button>
                    </div>

                    {/* Mobile layout - keep original structure */}
                    <div className="flex flex-col md:hidden">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <Avatar className="bg-[#8b5cf6] shrink-0">
                            {request.perfil?.logo_url ? (
                              <img
                                src={request.perfil.logo_url}
                                alt={request.user_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <AvatarFallback className="text-white">
                                {request.user_name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-white font-semibold break-words">{request.user_name}</h3>
                            </div>
                            <p className="text-gray-400 text-sm break-words">{getRelativeTime(request.created_at)}</p>
                          </div>
                        </div>
                        <Button
                          className={`${
                            request.whatsapp
                              ? "bg-[#8b5cf6] hover:bg-[#7c3aed] text-white"
                              : "bg-gray-600 text-gray-400 cursor-not-allowed"
                          } flex items-center gap-2 shrink-0`}
                          onClick={() => handleWhatsAppContact(request.whatsapp, request.id, request.title)}
                          disabled={!request.whatsapp}
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span className="hidden sm:inline">Contactar</span>
                        </Button>
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
                          <Badge className="bg-gray-700 text-gray-300 break-words">
                            {request.operacion?.nombre || "N/A"}
                          </Badge>
                          <Badge className="bg-gray-700 text-gray-300 break-words">
                            {request.tipologia?.nombre || "N/A"}
                          </Badge>
                          {request.bedrooms && (
                            <Badge className="bg-gray-700 text-gray-300 flex items-center gap-1">
                              <ArrowUp className="w-3 h-3" />
                              {request.bedrooms}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {request.credit_approved && (
                        <div className="mb-3 overflow-hidden">
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

                      <div className="mb-2 overflow-hidden">
                        <div className="flex items-center gap-6 text-sm flex-wrap">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-gray-400 shrink-0">Provincia:</span>
                            <Badge variant="outline" className="border-[#8b5cf6] text-[#8b5cf6] break-words">
                              {request.provincia?.nombre || "N/A"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-gray-400 shrink-0">Ciudad:</span>
                            <Badge variant="outline" className="border-[#8b5cf6] text-[#8b5cf6] break-words">
                              {request.ciudad?.nombre || "N/A"}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="overflow-hidden">
                        {request.zonas && request.zonas.length > 0 && (
                          <div className="text-sm">
                            <div className="flex items-start gap-2 md:pr-48">
                              <span className="text-gray-400 shrink-0">Zonas:</span>
                              <div className="flex flex-wrap gap-1 flex-1">
                                {request.zonas.map((zona: Zona) => (
                                  <Badge
                                    key={zona.id}
                                    variant="outline"
                                    className="border-[#8b5cf6] text-[#8b5cf6] break-words text-xs"
                                  >
                                    {zona.nombre}
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
                          {request.moneda?.codigo || "N/A"}
                          {formatNumber(request.min_budget)} - {request.moneda?.codigo || "N/A"}
                          {formatNumber(request.max_budget)}
                        </div>
                      </div>
                    </div>

                    <div className="md:hidden">
                      <div className="text-right min-w-0">
                        <div className="text-gray-400 text-sm mb-1">Presupuesto</div>
                        <div className="text-white font-semibold break-words">
                          {request.moneda?.codigo || "N/A"}
                          {formatNumber(request.min_budget)} - {request.moneda?.codigo || "N/A"}
                          {formatNumber(request.max_budget)}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div ref={observerRef} className="h-10 flex items-center justify-center">
        {isLoading && (
          <div className="flex items-center gap-2 text-gray-400">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
            <span>Cargando más pedidos...</span>
          </div>
        )}
        {!hasMore && displayedRequests.length > 0 && (
          <div className="text-gray-500 text-sm">No hay más pedidos para mostrar</div>
        )}
      </div>

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white p-3 rounded-full shadow-lg transition-all duration-300 z-50"
          aria-label="Volver arriba"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}
