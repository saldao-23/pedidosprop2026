"use client"

import Logo from "@/components/logo"
import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faHourglassHalf } from "@fortawesome/free-solid-svg-icons"
import { createClient } from "@/lib/supabase/client"
import { sanitizeTitle, sanitizeDescription, sanitizeZone, sanitizeBank, isSafeInput } from "@/lib/validation"

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

export default function CreateRequest() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [showNotification, setShowNotification] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [operacionId, setOperacionId] = useState<number | null>(null)
  const [tipologiaId, setTipologiaId] = useState<number | null>(null)
  const [monedaId, setMonedaId] = useState<number | null>(null)
  const [minBudget, setMinBudget] = useState("")
  const [maxBudget, setMaxBudget] = useState("")
  const [provinciaId, setProvinciaId] = useState<number | null>(null)
  const [ciudadId, setCiudadId] = useState<number | null>(null)
  const [selectedZonas, setSelectedZonas] = useState<Zona[]>([])
  const [neighborhoodInput, setNeighborhoodInput] = useState("")
  const [showNeighborhoodDropdown, setShowNeighborhoodDropdown] = useState(false)
  const [bedrooms, setBedrooms] = useState("")

  const [operaciones, setOperaciones] = useState<Operacion[]>([])
  const [tipologias, setTipologias] = useState<Tipologia[]>([])
  const [monedas, setMonedas] = useState<Moneda[]>([])
  const [provincias, setProvincias] = useState<Provincia[]>([])
  const [ciudades, setCiudades] = useState<Ciudad[]>([])
  const [zonas, setZonas] = useState<Zona[]>([])
  const [isLoadingCiudades, setIsLoadingCiudades] = useState(false)
  const [isLoadingZonas, setIsLoadingZonas] = useState(false)

  // Step 2 form data
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [creditApproved, setCreditApproved] = useState(false)
  const [banks, setBanks] = useState<string[]>([])
  const [bankInput, setBankInput] = useState("")

  const isOperationTypeEnabled = true
  const isPropertyTypeEnabled = operacionId !== null
  const isCurrencyEnabled = tipologiaId !== null
  const isMinBudgetEnabled = monedaId !== null
  const isMaxBudgetEnabled = minBudget !== ""
  const isProvinceEnabled = maxBudget !== ""
  const isCityEnabled = provinciaId !== null
  const isNeighborhoodsEnabled = ciudadId !== null
  const isBedroomsEnabled = ciudadId !== null

  const isBudgetValid = () => {
    if (!minBudget || !maxBudget) return true
    const min = Number.parseFloat(minBudget)
    const max = Number.parseFloat(maxBudget)
    return max >= min
  }

  const isStep1Complete =
    operacionId && tipologiaId && monedaId && minBudget && maxBudget && provinciaId && ciudadId && isBudgetValid()

  const isStep2Complete = title.trim() !== "" && description.trim() !== ""

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
      if (!provinciaId) {
        setCiudades([])
        return
      }

      setIsLoadingCiudades(true)
      const supabase = createClient()

      try {
        const { data: ciudadesData } = await supabase
          .from("ciudades")
          .select("*")
          .eq("provincia_id", provinciaId)
          .order("nombre")

        if (ciudadesData) setCiudades(ciudadesData)
      } catch (error) {
        console.error("Error loading cities:", error)
      } finally {
        setIsLoadingCiudades(false)
      }
    }

    loadCiudades()
  }, [provinciaId])

  useEffect(() => {
    const loadZonas = async () => {
      if (!ciudadId) {
        setZonas([])
        return
      }

      setIsLoadingZonas(true)
      const supabase = createClient()

      try {
        const { data: zonasData } = await supabase.from("zonas").select("*").eq("ciudad_id", ciudadId).order("nombre")

        if (zonasData) setZonas(zonasData)
      } catch (error) {
        console.error("Error loading zones:", error)
      } finally {
        setIsLoadingZonas(false)
      }
    }

    loadZonas()
  }, [ciudadId])

  const validateZoneInput = (input: string): boolean => {
    const validPattern = /^[a-zA-Z0-9\s]*$/
    return validPattern.test(input) && input.length <= 30
  }

  const getAvailableZones = () => {
    if (!neighborhoodInput.trim()) return []

    const searchTerm = neighborhoodInput.toLowerCase()
    return zonas.filter(
      (zona) =>
        zona.nombre.toLowerCase().includes(searchTerm) &&
        !selectedZonas.find((selected) => selected.id === zona.id)
    )
  }

  const handleZoneSelect = (zona: Zona) => {
    setSelectedZonas(prev => {
      if (prev.length >= 5) {
        alert("Máximo 5 zonas permitidas")
        return prev
      }
      if (prev.find((z) => z.id === zona.id)) {
        return prev
      }
      return [...prev, zona]
    })

    setNeighborhoodInput("")
    setShowNeighborhoodDropdown(false)
  }

  const handleNeighborhoodKeyPress = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && neighborhoodInput.trim() && ciudadId) {
      e.preventDefault()
      const trimmedInput = neighborhoodInput.trim().toLowerCase()

      if (!validateZoneInput(trimmedInput)) {
        alert("Las zonas solo pueden contener letras, números y espacios, con un máximo de 30 caracteres")
        return
      }

      // Verificar si la zona ya existe
      let existingZona = zonas.find((z) => z.nombre.toLowerCase() === trimmedInput)

      if (!existingZona) {
        // Crear nueva zona en Supabase
        const supabase = createClient()
        try {
          const { data: newZona, error } = await supabase
            .from("zonas")
            .insert({
              ciudad_id: ciudadId,
              nombre: trimmedInput,
            })
            .select()
            .single()

          if (error) throw error
          if (newZona) {
            existingZona = newZona
            setZonas(prev => [...prev, newZona])
          }
        } catch (error) {
          console.error("Error creating zone:", error)
          alert("Error al crear la zona")
          return
        }
      }

      // Agregar zona a la selección si no está ya seleccionada
      if (existingZona) {
        const zonaToAdd = existingZona
        setSelectedZonas(prev => {
          if (prev.length >= 5) {
            alert("Máximo 5 zonas permitidas")
            return prev
          }
          if (prev.find((z) => z.id === zonaToAdd.id)) {
            return prev
          }
          return [...prev, zonaToAdd]
        })
      }

      setNeighborhoodInput("")
      setShowNeighborhoodDropdown(false)
    }
  }

  const removeNeighborhood = (zona: Zona, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    setSelectedZonas(prev => prev.filter((z) => z.id !== zona.id))
  }

  const validateBankInput = (input: string): boolean => {
    const validPattern = /^[a-zA-Z0-9\s]*$/
    return validPattern.test(input) && input.length <= 10
  }

  const handleBankInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value

    if (value.length <= 10 && /^[a-zA-Z0-9\s]*$/.test(value)) {
      setBankInput(value)
    }
  }

  const handleBankKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && bankInput.trim()) {
      e.preventDefault()
      const trimmedInput = bankInput.trim()

      if (!validateBankInput(trimmedInput)) {
        alert("Los bancos solo pueden contener letras, números y espacios, con un máximo de 10 caracteres")
        return
      }

      if (!banks.includes(trimmedInput) && banks.length < 2) {
        setBanks([...banks, trimmedInput])
        setBankInput("")
      } else if (banks.length >= 2) {
        alert("Máximo 2 bancos permitidos")
      } else {
        setBankInput("")
      }
    }
  }

  const removeBank = (bank: string) => {
    setBanks(banks.filter((b) => b !== bank))
  }

  const handleLogoClick = () => {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true"
    if (isLoggedIn) {
      router.push("/dashboard")
    } else {
      router.push("/")
    }
  }

  const handleContinue = () => {
    if (isStep1Complete) {
      setCurrentStep(2)
    }
  }

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1)
    } else {
      router.push("/dashboard")
    }
  }

  const handlePublish = async () => {
    if (isStep2Complete && !isSaving) {
      setIsSaving(true)

      // Validaciones de seguridad
      const sanitizedTitle = sanitizeTitle(title)
      const sanitizedDescription = sanitizeDescription(description)
      const sanitizedBanks = banks.map(b => sanitizeBank(b))

      if (!isSafeInput(title) || !isSafeInput(description)) {
        alert("Caracteres no permitidos detectados en título o descripción")
        setIsSaving(false)
        return
      }

      if (!sanitizedTitle || sanitizedTitle.length < 3) {
        alert("El título debe tener al menos 3 caracteres válidos")
        setIsSaving(false)
        return
      }

      if (!sanitizedDescription || sanitizedDescription.length < 10) {
        alert("La descripción debe tener al menos 10 caracteres válidos")
        setIsSaving(false)
        return
      }

      try {
        const supabase = createClient()

        // Obtener usuario actual
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          alert("Debes iniciar sesión para crear un pedido")
          router.push("/")
          return
        }

        const { data, error } = await supabase
          .from("pedidos")
          .insert({
            user_id: user.id,
            user_name: localStorage.getItem("userName") || "Inmobiliaria",
            whatsapp: localStorage.getItem("userWhatsApp") || null,
            title: sanitizedTitle,
            description: sanitizedDescription,
            operacion_id: operacionId,
            tipologia_id: tipologiaId,
            moneda_id: monedaId,
            min_budget: minBudget,
            max_budget: maxBudget,
            provincia_id: provinciaId,
            ciudad_id: ciudadId,
            zona_ids: selectedZonas.map((z) => z.id),
            bedrooms,
            credit_approved: creditApproved,
            banks: creditApproved ? sanitizedBanks : [],
            // Mantener campos legacy para compatibilidad
            operation_type: operaciones.find((o) => o.id === operacionId)?.nombre || "",
            property_type: tipologias.find((t) => t.id === tipologiaId)?.nombre || "",
            currency: monedas.find((m) => m.id === monedaId)?.codigo || "",
            province: provincias.find((p) => p.id === provinciaId)?.nombre || "",
            city: ciudades.find((c) => c.id === ciudadId)?.nombre || "",
            neighborhoods: selectedZonas.map((z) => z.nombre),
          })

        if (error) {
          console.error("Error saving to Supabase:", error)
          alert("Error al guardar el pedido. Inténtalo de nuevo.")
          setIsSaving(false)
          return
        }

        // Mostrar notificación y redirigir rápidamente
        setShowNotification(true)

        setTimeout(() => {
          router.push("/dashboard")
        }, 800)
      } catch (error) {
        console.error("Error creating request:", error)
        alert("Error al crear el pedido. Inténtalo de nuevo.")
      } finally {
        setIsSaving(false)
      }
    }
  }

  const formatNumber = (value: string) => {
    const num = value.replace(/\D/g, "")
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  }

  const handleMinBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "")
    const limitedValue = value.length > 9 ? value.slice(0, 9) : value
    setMinBudget(limitedValue)
  }

  const handleMaxBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "")
    const limitedValue = value.length > 9 ? value.slice(0, 9) : value
    setMaxBudget(limitedValue)
  }

  const handleNeighborhoodInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value

    if (value.length <= 30 && /^[a-zA-Z0-9\s]*$/.test(value)) {
      setNeighborhoodInput(value)
      // Mostrar dropdown solo cuando hay texto
      if (value.length > 0) {
        setShowNeighborhoodDropdown(true)
      } else {
        setShowNeighborhoodDropdown(false)
      }
    }
  }

  const handleProvinceChange = (value: string) => {
    const provinciaIdNum = Number(value)
    setProvinciaId(provinciaIdNum)
    setCiudadId(null) // Reset city when province changes
    setSelectedZonas([]) // Reset zones when province changes
    localStorage.setItem("lastProvinciaId", value)
    localStorage.removeItem("lastCiudadId") // Clear saved city when province changes
  }

  const handleCityChange = (value: string) => {
    const ciudadIdNum = Number(value)
    setCiudadId(ciudadIdNum)
    setSelectedZonas([]) // Reset zones when city changes
    localStorage.setItem("lastCiudadId", value)
  }

  // Load saved provincia/ciudad from localStorage
  useEffect(() => {
    const savedProvinciaId = localStorage.getItem("lastProvinciaId")
    const savedCiudadId = localStorage.getItem("lastCiudadId")

    if (savedProvinciaId) {
      setProvinciaId(Number(savedProvinciaId))
    }
    if (savedCiudadId) {
      setCiudadId(Number(savedCiudadId))
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#3a3544]">
      {/* Notification */}
      {showNotification && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          ¡Pedido publicado exitosamente!
        </div>
      )}

      {/* Header */}
      <header className="bg-[#3a3544] border-b border-gray-600 px-6 py-4">
        <div className="flex items-center">
          <Logo onClick={handleLogoClick} size="small" />
        </div>
      </header>

      <div className="px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Title and Steps */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-4">
              Realizar un pedido
              <div className="w-16 h-1 bg-[#8b5cf6] mx-auto mt-2"></div>
            </h1>

            {/* Step indicators */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                  currentStep >= 1 ? "bg-[#8b5cf6]" : "bg-gray-600"
                }`}
              >
                1
              </div>
              <div className={`w-16 h-1 ${currentStep >= 2 ? "bg-[#8b5cf6]" : "bg-gray-600"}`}></div>
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                  currentStep >= 2 ? "bg-[#8b5cf6]" : "bg-gray-600"
                }`}
              >
                2
              </div>
            </div>
          </div>

          {currentStep === 1 && (
            <div className="space-y-6">
              {/* First Row */}
              <div className="flex items-center gap-4 text-white flex-wrap">
                <span>Realizo pedido de</span>
                <Select
                  value={operacionId?.toString() || ""}
                  onValueChange={(value) => setOperacionId(Number(value))}
                  disabled={!isOperationTypeEnabled}
                >
                  <SelectTrigger className="w-48 bg-[#4a4458] border-gray-600 text-white">
                    <SelectValue placeholder="Tipo de operación" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#4a4458] border-gray-600">
                    {operaciones.map((operacion) => (
                      <SelectItem key={operacion.id} value={operacion.id.toString()}>
                        {operacion.nombre.charAt(0).toUpperCase() + operacion.nombre.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span>de</span>
                <Select
                  value={tipologiaId?.toString() || ""}
                  onValueChange={(value) => setTipologiaId(Number(value))}
                  disabled={!isPropertyTypeEnabled}
                >
                  <SelectTrigger className="w-48 bg-[#4a4458] border-gray-600 text-white">
                    <SelectValue placeholder="Tipología" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#4a4458] border-gray-600">
                    {tipologias.map((tipologia) => (
                      <SelectItem key={tipologia.id} value={tipologia.id.toString()}>
                        {tipologia.nombre.charAt(0).toUpperCase() + tipologia.nombre.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Second Row */}
              <div className="flex items-center gap-4 text-white flex-wrap">
                <span>con presupuesto entre</span>
                <Select
                  value={monedaId?.toString() || ""}
                  onValueChange={(value) => setMonedaId(Number(value))}
                  disabled={!isCurrencyEnabled}
                >
                  <SelectTrigger className="w-24 bg-[#4a4458] border-gray-600 text-white">
                    <SelectValue placeholder="Moneda" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#4a4458] border-gray-600">
                    {monedas.map((moneda) => (
                      <SelectItem key={moneda.id} value={moneda.id.toString()}>
                        {moneda.codigo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Mínimo"
                  value={minBudget ? formatNumber(minBudget) : ""}
                  onChange={handleMinBudgetChange}
                  disabled={!isMinBudgetEnabled}
                  className="w-32 bg-[#4a4458] border-gray-600 text-white placeholder:text-gray-400 disabled:opacity-50"
                />
                <span>y</span>
                <Input
                  placeholder="Máximo"
                  value={maxBudget ? formatNumber(maxBudget) : ""}
                  onChange={handleMaxBudgetChange}
                  disabled={!isMaxBudgetEnabled}
                  className="w-32 bg-[#4a4458] border-gray-600 text-white placeholder:text-gray-400 disabled:opacity-50"
                />
                {!isBudgetValid() && (
                  <span className="text-red-400 text-sm">El máximo debe ser mayor o igual al mínimo</span>
                )}
              </div>

              {/* Third Row */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-white">
                <span className="hidden sm:inline">en</span>
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                  <div className="w-full sm:w-48">
                    <label className="text-sm text-gray-400 mb-1 block sm:hidden">Provincia</label>
                    <Select
                      value={provinciaId?.toString() || ""}
                      onValueChange={handleProvinceChange}
                      disabled={!isProvinceEnabled}
                    >
                      <SelectTrigger className="w-full bg-[#4a4458] border-gray-600 text-white">
                        <SelectValue placeholder="Provincia" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#4a4458] border-gray-600">
                        {provincias.map((provincia) => (
                          <SelectItem key={provincia.id} value={provincia.id.toString()}>
                            {provincia.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-full sm:w-48">
                    <label className="text-sm text-gray-400 mb-1 block sm:hidden">Ciudad</label>
                    <Select
                      value={ciudadId?.toString() || ""}
                      onValueChange={handleCityChange}
                      disabled={!isCityEnabled || isLoadingCiudades}
                    >
                      <SelectTrigger className="w-full bg-[#4a4458] border-gray-600 text-white">
                        <SelectValue placeholder={isLoadingCiudades ? "Cargando..." : "Ciudad"} />
                      </SelectTrigger>
                      <SelectContent className="bg-[#4a4458] border-gray-600">
                        {ciudades.map((ciudad) => (
                          <SelectItem key={ciudad.id} value={ciudad.id.toString()}>
                            {ciudad.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Zonas - ahora al lado de ciudad en desktop, debajo en móvil */}
                <div className="flex-1 w-full sm:min-w-[200px] relative">
                  <label className="text-sm text-gray-400 mb-1 block sm:hidden">Zonas (opcional)</label>
                  <Input
                    placeholder={`Buscar o crear zona (${selectedZonas.length}/5)`}
                    value={neighborhoodInput}
                    onChange={handleNeighborhoodInputChange}
                    onKeyPress={handleNeighborhoodKeyPress}
                    onFocus={() => {
                      if (neighborhoodInput.length > 0) {
                        setShowNeighborhoodDropdown(true)
                      }
                    }}
                    disabled={!isNeighborhoodsEnabled || selectedZonas.length >= 5 || isLoadingZonas}
                    className="w-full bg-[#4a4458] border-gray-600 text-white placeholder:text-gray-400 disabled:opacity-50"
                    maxLength={30}
                  />
                  {neighborhoodInput && (
                    <div className="text-xs text-gray-400 mt-1">{neighborhoodInput.length}/30 caracteres</div>
                  )}

                  {/* Dropdown de sugerencias */}
                  {showNeighborhoodDropdown && neighborhoodInput && ciudadId && !isLoadingZonas && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-[#4a4458] border border-gray-600 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                      {getAvailableZones().map((zona) => (
                        <button
                          key={zona.id}
                          type="button"
                          className="w-full text-left px-3 py-2 text-white hover:bg-[#8b5cf6] text-sm"
                          onClick={() => handleZoneSelect(zona)}
                        >
                          {zona.nombre}
                        </button>
                      ))}
                      {neighborhoodInput && getAvailableZones().length === 0 && (
                        <div className="px-3 py-2 text-gray-400 text-sm">
                          No se encontraron zonas. Presiona Enter para crear "{neighborhoodInput}"
                        </div>
                      )}
                    </div>
                  )}

                  {/* Display neighborhood tags */}
                  {selectedZonas.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedZonas.map((zona) => (
                        <Badge
                          key={zona.id}
                          variant="outline"
                          className="border-[#8b5cf6] text-[#8b5cf6] flex items-center gap-1"
                        >
                          {zona.nombre}
                          <X
                            className="w-3 h-3 cursor-pointer hover:text-red-400"
                            onClick={(e) => removeNeighborhood(zona, e)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Fourth Row - Dormitorios */}
              <div className="flex items-center gap-4 text-white flex-wrap">
                <span>con un mínimo de</span>
                <div className="flex gap-2">
                  {["M", "1+", "2+", "3+", "4+", "5+"].map((rooms) => (
                    <Button
                      key={rooms}
                      variant={bedrooms === rooms ? "default" : "outline"}
                      size="sm"
                      disabled={!isBedroomsEnabled}
                      onClick={() => setBedrooms(bedrooms === rooms ? "" : rooms)}
                      className={`${
                        bedrooms === rooms
                          ? "bg-[#8b5cf6] text-white"
                          : "bg-[#4a4458] border-gray-600 text-white hover:bg-[#8b5cf6] hover:border-[#8b5cf6]"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {rooms}
                    </Button>
                  ))}
                </div>
                <span>dormitorios/privados <span className="text-gray-400">(opcional)</span></span>
              </div>

              {/* Continue Button */}
              <div className="flex justify-center pt-8">
                <Button
                  onClick={handleContinue}
                  disabled={!isStep1Complete}
                  className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white px-16 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continuar
                </Button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6 max-w-2xl mx-auto">
              {/* Title Field */}
              <div>
                <Input
                  placeholder='Título: Ej: "Busco urgente para mudarme en 30 días!"'
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={40}
                  className="w-full h-12 bg-[#4a4458] border-[#8b5cf6] text-white placeholder:text-gray-400 text-lg py-4 overflow-hidden whitespace-nowrap text-ellipsis"
                />
                <div className="text-xs text-gray-400 mt-1">{title.length}/40 caracteres (máximo 1 línea)</div>
              </div>

              {/* Description Field */}
              <div>
                <Textarea
                  placeholder='Descripción del pedido. Ej: "Quiero que los dormitorios estén en la planta alta. Quiero que sea casa esquina"'
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={400}
                  rows={5}
                  className="w-full bg-[#4a4458] border-[#8b5cf6] text-white placeholder:text-gray-400 resize-none leading-relaxed"
                />
                <div className="text-xs text-gray-400 mt-1">{description.length}/400 caracteres (máximo 5 líneas)</div>
              </div>

              {/* Credit Approved Checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="credit-approved"
                  checked={creditApproved}
                  onCheckedChange={setCreditApproved}
                  className="border-gray-400 data-[state=checked]:bg-[#8b5cf6] data-[state=checked]:border-[#8b5cf6]"
                />
                <label htmlFor="credit-approved" className="text-white text-lg">
                  Apto crédito
                </label>
              </div>

              {creditApproved && (
                <div className="space-y-3">
                  <div>
                    <Input
                      placeholder={`Bancos (opcional) - Presiona Enter para agregar (${banks.length}/2)`}
                      value={bankInput}
                      onChange={handleBankInputChange}
                      onKeyPress={handleBankKeyPress}
                      disabled={banks.length >= 2}
                      className="w-full bg-[#4a4458] border-[#8b5cf6] text-white placeholder:text-gray-400 disabled:opacity-50"
                      maxLength={10}
                    />
                    {bankInput && <div className="text-xs text-gray-400 mt-1">{bankInput.length}/10 caracteres</div>}
                  </div>

                  {/* Display bank chips */}
                  {banks.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {banks.map((bank, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="border-[#8b5cf6] text-[#8b5cf6] flex items-center gap-1"
                        >
                          {bank}
                          <X className="w-3 h-3 cursor-pointer hover:text-red-400" onClick={() => removeBank(bank)} />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-8">
                <Button
                  onClick={handleBack}
                  variant="outline"
                  className="flex-1 bg-[#8b5cf6] border-[#8b5cf6] text-white hover:bg-[#7c3aed] py-3 text-lg"
                  disabled={isSaving}
                >
                  Anterior
                </Button>
                <Button
                  onClick={handlePublish}
                  disabled={!isStep2Complete || isSaving}
                  className="flex-1 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <FontAwesomeIcon icon={faHourglassHalf} className="mr-2 animate-spin" />
                      Publicando...
                    </>
                  ) : "Publicar"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
