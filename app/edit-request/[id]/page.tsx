"use client"

import Logo from "@/components/logo"
import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { sanitizeTitle, sanitizeDescription, sanitizeBank, isSafeInput } from "@/lib/validation"

interface PropertyRequest {
  id: number | string
  orderNumber?: number
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
}

export default function EditRequest() {
  const router = useRouter()
  const params = useParams()
  const requestId = params.id

  const [currentStep, setCurrentStep] = useState(1)
  const [showNotification, setShowNotification] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const [operationType, setOperationType] = useState("")
  const [propertyType, setPropertyType] = useState("")
  const [currency, setCurrency] = useState("")
  const [minBudget, setMinBudget] = useState("")
  const [maxBudget, setMaxBudget] = useState("")
  const [province, setProvince] = useState("")
  const [city, setCity] = useState("")
  const [neighborhoods, setNeighborhoods] = useState<string[]>([])
  const [neighborhoodInput, setNeighborhoodInput] = useState("")
  const [bedrooms, setBedrooms] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [creditApproved, setCreditApproved] = useState(false)
  const [banks, setBanks] = useState<string[]>([])
  const [bankInput1, setBankInput1] = useState("")
  const [bankInput2, setBankInput2] = useState("")

  const isOperationTypeEnabled = true
  const isPropertyTypeEnabled = operationType !== ""
  const isCurrencyEnabled = propertyType !== ""
  const isMinBudgetEnabled = currency !== ""
  const isMaxBudgetEnabled = minBudget !== ""
  const isProvinceEnabled = maxBudget !== ""
  const isCityEnabled = province !== ""
  const isNeighborhoodsEnabled = city !== ""
  const isBedroomsEnabled = city !== ""

  const isBudgetValid = () => {
    if (!minBudget || !maxBudget) return true
    const min = Number.parseFloat(minBudget)
    const max = Number.parseFloat(maxBudget)
    return max >= min
  }

  const isStep1Complete =
    operationType && propertyType && currency && minBudget && maxBudget && province && city && isBudgetValid()

  const isStep2Complete = title.trim() !== "" && description.trim() !== ""

  useEffect(() => {
    const loadRequestData = async () => {
      try {
        const supabase = createClient()

        const { data: supabaseRequest, error } = await supabase.from("pedidos").select("*").eq("id", requestId).single()

        if (error) {
          console.error("Error loading request from Supabase:", error)
          router.push("/my-requests")
          return
        }

        if (supabaseRequest) {
          setOperationType(supabaseRequest.operation_type)
          setPropertyType(supabaseRequest.property_type)
          setCurrency(supabaseRequest.currency)
          setMinBudget(supabaseRequest.min_budget)
          setMaxBudget(supabaseRequest.max_budget)
          setProvince(supabaseRequest.province)
          setCity(supabaseRequest.city)
          setNeighborhoods(supabaseRequest.neighborhoods || [])
          setBedrooms(supabaseRequest.bedrooms || "")
          setTitle(supabaseRequest.title)
          setDescription(supabaseRequest.description)
          setCreditApproved(supabaseRequest.credit_approved)
          const existingBanks = supabaseRequest.banks || []
          setBanks(existingBanks)
          setBankInput1(existingBanks[0] || "")
          setBankInput2(existingBanks[1] || "")
          setLoading(false)
        } else {
          router.push("/my-requests")
        }
      } catch (error) {
        console.error("Error loading request:", error)
        router.push("/my-requests")
      }
    }

    loadRequestData()
  }, [requestId, router])

  const validateZoneInput = (input: string): boolean => {
    const validPattern = /^[a-zA-Z0-9\s]*$/
    return validPattern.test(input) && input.length <= 30
  }

  const handleNeighborhoodKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && neighborhoodInput.trim()) {
      e.preventDefault()
      const trimmedInput = neighborhoodInput.trim().toLowerCase()

      if (!validateZoneInput(trimmedInput)) {
        alert("Las zonas solo pueden contener letras, números y espacios, con un máximo de 30 caracteres")
        return
      }

      if (!neighborhoods.includes(trimmedInput) && neighborhoods.length < 5) {
        setNeighborhoods([...neighborhoods, trimmedInput])
      } else if (neighborhoods.length >= 5) {
        alert("Máximo 5 zonas permitidas")
      }
      setNeighborhoodInput("")
    }
  }

  const handleNeighborhoodInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value

    if (value.length <= 30 && /^[a-zA-Z0-9\s]*$/.test(value)) {
      setNeighborhoodInput(value.toLowerCase())
    }
  }

  const removeNeighborhood = (neighborhood: string) => {
    setNeighborhoods(neighborhoods.filter((n) => n !== neighborhood))
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
      router.push("/my-requests")
    }
  }

  const validateBankInput = (input: string): boolean => {
    const validPattern = /^[a-zA-Z0-9\s]*$/
    return validPattern.test(input) && input.length <= 10
  }

  const handleBankInput1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value.length <= 10 && /^[a-zA-Z0-9\s]*$/.test(value)) {
      setBankInput1(value)
      updateBanksArray(value, bankInput2)
    }
  }

  const handleBankInput2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value.length <= 10 && /^[a-zA-Z0-9\s]*$/.test(value)) {
      setBankInput2(value)
      updateBanksArray(bankInput1, value)
    }
  }

  const updateBanksArray = (bank1: string, bank2: string) => {
    const newBanks = [bank1, bank2].filter((bank) => bank.trim() !== "")
    setBanks(newBanks)
  }

  const clearBank1 = () => {
    setBankInput1("")
    updateBanksArray("", bankInput2)
  }

  const clearBank2 = () => {
    setBankInput2("")
    updateBanksArray(bankInput1, "")
  }

  const handleSave = async () => {
    if (isStep2Complete && !isSaving) {
      setIsSaving(true)

      // Validaciones de seguridad
      const sanitizedTitle = sanitizeTitle(title)
      const sanitizedDescription = sanitizeDescription(description)
      const sanitizedBanks = banks.map(b => sanitizeBank(b))

      if (!isSafeInput(title) || !isSafeInput(description)) {
        alert("Caracteres no permitidos detectados")
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

        const { data, error } = await supabase
          .from("pedidos")
          .update({
            title: sanitizedTitle,
            description: sanitizedDescription,
            operation_type: operationType,
            property_type: propertyType,
            currency,
            min_budget: minBudget,
            max_budget: maxBudget,
            province,
            city,
            neighborhoods,
            bedrooms,
            credit_approved: creditApproved,
            banks: sanitizedBanks,
            updated_at: new Date().toISOString(),
          })
          .eq("id", requestId)
          .select()

        if (error) {
          console.error("Error updating in Supabase:", error)
          alert("Error al actualizar el pedido. Inténtalo de nuevo.")
          return
        }

        console.log("Pedido actualizado exitosamente en Supabase:", data)
        setShowNotification(true)

        setTimeout(() => {
          router.push("/my-requests")
        }, 2000)
      } catch (error) {
        console.error("Error updating request:", error)
        alert("Error al actualizar el pedido. Inténtalo de nuevo.")
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#3a3544] flex items-center justify-center">
        <div className="text-white text-lg">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#3a3544]">
      <header className="bg-[#3a3544] border-b border-gray-600 px-6 py-4">
        <div className="flex items-center">
          <Logo onClick={handleLogoClick} className="h-10 w-auto" />
        </div>
      </header>

      <div className="px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-4">
              Editar pedido
              <div className="w-16 h-1 bg-[#8b5cf6] mx-auto mt-2"></div>
            </h1>

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
              <div className="flex items-center gap-4 text-white flex-wrap">
                <span>Realizo pedido de</span>
                <Select value={operationType} onValueChange={setOperationType} disabled={!isOperationTypeEnabled}>
                  <SelectTrigger className="w-48 bg-[#4a4458] border-gray-600 text-white">
                    <SelectValue placeholder="Tipo de operación" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#4a4458] border-gray-600">
                    <SelectItem value="compra">Compra</SelectItem>
                    <SelectItem value="alquiler">Alquiler</SelectItem>
                    <SelectItem value="permuta">Permuta</SelectItem>
                    <SelectItem value="alquiler-temporario">Alquiler temporario</SelectItem>
                  </SelectContent>
                </Select>
                <span>de</span>
                <Select value={propertyType} onValueChange={setPropertyType} disabled={!isPropertyTypeEnabled}>
                  <SelectTrigger className="w-48 bg-[#4a4458] border-gray-600 text-white">
                    <SelectValue placeholder="Tipología" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#4a4458] border-gray-600">
                    <SelectItem value="casa">Casa</SelectItem>
                    <SelectItem value="departamento">Departamento</SelectItem>
                    <SelectItem value="local">Local</SelectItem>
                    <SelectItem value="oficina">Oficina</SelectItem>
                    <SelectItem value="terreno">Terreno</SelectItem>
                    <SelectItem value="campo">Campo</SelectItem>
                    <SelectItem value="galpon">Galpón</SelectItem>
                    <SelectItem value="cochera">Cochera</SelectItem>
                    <SelectItem value="block-unidades">Block de unidades</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-4 text-white flex-wrap">
                <span>con presupuesto entre</span>
                <Select value={currency} onValueChange={setCurrency} disabled={!isCurrencyEnabled}>
                  <SelectTrigger className="w-24 bg-[#4a4458] border-gray-600 text-white">
                    <SelectValue placeholder="Moneda" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#4a4458] border-gray-600">
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="ARS">ARS</SelectItem>
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

              <div className="flex items-center gap-4 text-white flex-wrap">
                <span>en</span>
                <Select value={province} onValueChange={setProvince} disabled={!isProvinceEnabled}>
                  <SelectTrigger className="w-48 bg-[#4a4458] border-gray-600 text-white">
                    <SelectValue placeholder="Provincia" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#4a4458] border-gray-600">
                    <SelectItem value="buenos-aires">Buenos Aires</SelectItem>
                    <SelectItem value="cordoba">Córdoba</SelectItem>
                    <SelectItem value="santa-fe">Santa Fe</SelectItem>
                    <SelectItem value="mendoza">Mendoza</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={city} onValueChange={setCity} disabled={!isCityEnabled}>
                  <SelectTrigger className="w-48 bg-[#4a4458] border-gray-600 text-white">
                    <SelectValue placeholder="Ciudad" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#4a4458] border-gray-600">
                    <SelectItem value="caba">CABA</SelectItem>
                    <SelectItem value="la-plata">La Plata</SelectItem>
                    <SelectItem value="mar-del-plata">Mar del Plata</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex-1 min-w-64">
                  <Input
                    placeholder={`Zonas (opcional) - Presiona Enter para agregar (${neighborhoods.length}/5)`}
                    value={neighborhoodInput}
                    onChange={handleNeighborhoodInputChange}
                    onKeyPress={handleNeighborhoodKeyPress}
                    disabled={!isNeighborhoodsEnabled || neighborhoods.length >= 5}
                    className="w-full bg-[#4a4458] border-gray-600 text-white placeholder:text-gray-400 disabled:opacity-50"
                    maxLength={30}
                  />
                  {neighborhoodInput && (
                    <div className="text-xs text-gray-400 mt-1">{neighborhoodInput.length}/30 caracteres</div>
                  )}
                  {neighborhoods.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {neighborhoods.map((neighborhood, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="border-[#8b5cf6] text-[#8b5cf6] flex items-center gap-1"
                        >
                          {neighborhood}
                          <X
                            className="w-3 h-3 cursor-pointer hover:text-red-400"
                            onClick={() => removeNeighborhood(neighborhood)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

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
                <span>
                  dormitorios/privados <span className="text-gray-400">(opcional)</span>
                </span>
              </div>

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
                <div className="space-y-4 p-4 bg-[#4a4458] rounded-lg border border-gray-600">
                  <div className="text-white text-sm font-medium">Bancos (máximo 2)</div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Banco 1"
                        value={bankInput1}
                        onChange={handleBankInput1Change}
                        maxLength={10}
                        className="flex-1 bg-[#3a3544] border-gray-600 text-white placeholder:text-gray-400"
                      />
                      {bankInput1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={clearBank1}
                          className="text-gray-400 hover:text-red-400 p-1"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    {bankInput1 && <div className="text-xs text-gray-400">{bankInput1.length}/10 caracteres</div>}

                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Banco 2 (opcional)"
                        value={bankInput2}
                        onChange={handleBankInput2Change}
                        maxLength={10}
                        className="flex-1 bg-[#3a3544] border-gray-600 text-white placeholder:text-gray-400"
                      />
                      {bankInput2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={clearBank2}
                          className="text-gray-400 hover:text-red-400 p-1"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    {bankInput2 && <div className="text-xs text-gray-400">{bankInput2.length}/10 caracteres</div>}
                  </div>

                  {banks.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {banks.map((bank, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="border-[#8b5cf6] text-[#8b5cf6] bg-[#8b5cf6]/10"
                        >
                          {bank}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="text-xs text-gray-400">
                    Solo se permiten letras, números y espacios. Máximo 10 caracteres por banco.
                  </div>
                </div>
              )}

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
                  onClick={handleSave}
                  disabled={!isStep2Complete || isSaving}
                  className="flex-1 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? "Guardando..." : "Guardar cambios"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
