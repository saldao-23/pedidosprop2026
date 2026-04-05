"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Camera } from "lucide-react"
import Logo from "@/components/logo"
import { createClient } from "@/lib/supabase/client"
import { sanitizeName, sanitizePhone, isSafeInput } from "@/lib/validation"

interface CountryCode {
  id: number
  code: string
  flag: string
  country: string
}

export default function Profile() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [showNotification, setShowNotification] = useState(false)
  const [loading, setLoading] = useState(true)
  const [countryCodes, setCountryCodes] = useState<CountryCode[]>([])
  const [formData, setFormData] = useState({
    companyName: "",
    email: "",
    countryCode: "+54",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  })

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const supabase = createClient()

        // Cargar códigos de país desde la base de datos
        const { data: countryCodesData } = await supabase
          .from("country_codes")
          .select("*")
          .order("country")

        if (countryCodesData) {
          setCountryCodes(countryCodesData)
        }

        // Obtener usuario actual
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
          console.error("Error getting user:", userError)
          router.push("/")
          return
        }

        // Cargar perfil desde Supabase
        const { data: perfil, error: perfilError } = await supabase
          .from("perfiles")
          .select("*")
          .eq("id", user.id)
          .single()

        if (perfilError) {
          console.error("Error loading profile:", perfilError)
          setLoading(false)
          return
        }

        // Parsear teléfono (separar código de país y número)
        const phoneNumber = perfil.telefono || ""
        let countryCode = "+54"
        let phone = ""

        // Detectar código de país de la base de datos de códigos
        if (phoneNumber.startsWith("+")) {
          // Cargar códigos de país para hacer match correcto
          const { data: codes } = await supabase
            .from("country_codes")
            .select("code")
            .order("code", { ascending: false }) // Ordenar de más largo a más corto

          if (codes) {
            // Buscar el código que coincida (empezando por los más largos)
            const sortedCodes = codes
              .map(c => c.code)
              .sort((a, b) => b.length - a.length) // Más largos primero

            for (const code of sortedCodes) {
              if (phoneNumber.startsWith(code)) {
                countryCode = code
                phone = phoneNumber.substring(code.length).trim()
                break
              }
            }
          }

          // Si no encontró ningún código, usar el método anterior como fallback
          if (!phone) {
            const match = phoneNumber.match(/^(\+\d{1,4})(.*)$/)
            if (match) {
              countryCode = match[1]
              phone = match[2].trim()
            }
          }
        } else {
          // Si no empieza con +, asumir que todo es el número
          phone = phoneNumber
        }

        setFormData({
          companyName: perfil.nombre || "",
          email: perfil.email || "",
          countryCode: countryCode,
          phoneNumber: phone,
          password: "",
          confirmPassword: "",
        })

        // Cargar logo desde la base de datos
        if (perfil.logo_url) {
          setProfileImage(perfil.logo_url)
        }

        setLoading(false)
      } catch (error) {
        console.error("Error in loadProfile:", error)
        setLoading(false)
      }
    }

    loadProfile()
  }, [router])

  const handleSave = async () => {
    // Validaciones de seguridad
    const sanitizedName = sanitizeName(formData.companyName)
    const sanitizedPhoneNumber = sanitizePhone(formData.phoneNumber)

    if (!sanitizedName || sanitizedName.length < 2) {
      alert("Nombre de empresa inválido (mínimo 2 caracteres)")
      return
    }

    if (!isSafeInput(formData.companyName) || !isSafeInput(formData.phoneNumber)) {
      alert("Caracteres no permitidos detectados")
      return
    }

    try {
      const supabase = createClient()

      // Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        alert("Error: No hay usuario autenticado")
        return
      }

      // Combinar código de país y número sanitizado
      const fullPhone = `${formData.countryCode}${sanitizedPhoneNumber}`

      // Actualizar perfil en Supabase
      const { error: perfilError } = await supabase
        .from("perfiles")
        .update({
          nombre: sanitizedName,
          telefono: fullPhone,
        })
        .eq("id", user.id)

      if (perfilError) {
        console.error("Error updating profile:", perfilError)
        alert("Error al guardar el perfil")
        return
      }

      // IMPORTANTE: Actualizar también todas las tasaciones del usuario con el nuevo nombre y WhatsApp
      const { error: pedidosError } = await supabase
        .from("pedidos")
        .update({
          user_name: formData.companyName,
          whatsapp: fullPhone,
        })
        .eq("user_id", user.id)

      if (pedidosError) {
        console.error("Error updating pedidos:", pedidosError)
        // No mostrar error al usuario, ya que el perfil sí se actualizó
      }

      // Guardar en localStorage para compatibilidad
      localStorage.setItem("userWhatsApp", fullPhone)
      localStorage.setItem("userName", formData.companyName)

      console.log("Profile data saved successfully:", formData)

      setShowNotification(true)
      setTimeout(() => {
        router.push("/dashboard")
      }, 1500)
    } catch (error) {
      console.error("Error saving profile data:", error)
      alert("Error al guardar el perfil")
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()

    try {
      // Cerrar sesión en Supabase
      await supabase.auth.signOut()

      // Limpiar localStorage
      localStorage.removeItem("isLoggedIn")
      localStorage.removeItem("userWhatsApp")
      localStorage.removeItem("userName")

      // Redirigir al login
      router.push("/")
      router.refresh()
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
      // Aún así intentar redirigir
      router.push("/")
    }
  }

  const handleLogoClick = () => {
    router.push("/dashboard")
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        alert("Error: No hay usuario autenticado")
        return
      }

      // Mostrar preview local inmediatamente
      const reader = new FileReader()
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      // Subir archivo a Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/logo.${fileExt}`

      // Eliminar logo anterior si existe
      await supabase.storage.from('logos').remove([fileName])

      // Subir nuevo logo
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        console.error("Error uploading logo:", uploadError)
        alert("Error al subir el logo")
        return
      }

      // Obtener URL pública del logo
      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(fileName)

      // Actualizar perfil con la URL del logo
      const { error: updateError } = await supabase
        .from("perfiles")
        .update({ logo_url: publicUrl })
        .eq("id", user.id)

      if (updateError) {
        console.error("Error updating logo_url:", updateError)
        alert("Error al guardar la URL del logo")
        return
      }

      // Actualizar estado con la URL pública
      setProfileImage(publicUrl)

      console.log("Logo uploaded successfully:", publicUrl)
    } catch (error) {
      console.error("Error in handleImageUpload:", error)
      alert("Error al procesar el logo")
    }
  }

  const triggerImageUpload = () => {
    fileInputRef.current?.click()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#3a3544] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8b5cf6] mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#3a3544]">
      {showNotification && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          ¡Información guardada exitosamente!
        </div>
      )}

      {/* Header */}
      <header className="bg-[#3a3544] border-b border-gray-600 px-6 py-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-white hover:bg-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <div className="flex items-center">
            <Logo onClick={handleLogoClick} size="small" />
          </div>
        </div>
      </header>

      {/* Profile Content */}
      <div className="flex justify-center px-6 py-12">
        <Card className="w-full max-w-md bg-[#4a4458] border-gray-600">
          <CardContent className="p-8">
            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="text-white text-2xl font-semibold mb-2">Perfil</h1>
              <div className="w-16 h-1 bg-[#8b5cf6] mx-auto rounded"></div>
            </div>

            {/* Profile Image */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div
                  className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={triggerImageUpload}
                >
                  {profileImage ? (
                    <img
                      src={profileImage || "/placeholder.svg"}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg className="w-10 h-10 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17l2.5-3.21L14.5 17H9zm4.5-6L16 8.5 19 13h-5.5z" />
                    </svg>
                  )}
                </div>
                <div
                  className="absolute -bottom-1 -right-1 bg-[#8b5cf6] rounded-full p-2 cursor-pointer hover:bg-[#7c3aed] transition-colors"
                  onClick={triggerImageUpload}
                >
                  <Camera className="w-4 h-4 text-white" />
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Company Name Display */}
            <div className="text-center mb-6">
              <h2 className="text-white text-lg font-semibold">{formData.companyName}</h2>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              {/* Company Name Input */}
              <Input
                value={formData.companyName}
                onChange={(e) => handleInputChange("companyName", e.target.value)}
                className="bg-[#4a4458] border-[#8b5cf6] text-white placeholder:text-gray-400"
                placeholder="Nombre de la empresa"
              />

              {/* Email Input */}
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="bg-[#4a4458] border-[#8b5cf6] text-white placeholder:text-gray-400"
                placeholder="Email"
              />

              {/* WhatsApp Number */}
              <div>
                <label className="text-white text-sm mb-2 block">Número de WhatsApp para contacto:</label>
                <p className="text-gray-400 text-xs mb-2">* El número no debe incluir el 0 ni el 15</p>
                <div className="flex gap-2">
                  <Select
                    value={formData.countryCode}
                    onValueChange={(value) => handleInputChange("countryCode", value)}
                  >
                    <SelectTrigger className="w-[100px] bg-[#4a4458] border-gray-600 text-white">
                      <SelectValue>
                        {formData.countryCode}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-[#4a4458] border-gray-600 max-h-60 overflow-y-auto">
                      {countryCodes.map((country, index) => (
                        <SelectItem key={`${country.code}-${country.country}-${index}`} value={country.code}>
                          {country.code} - {country.country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                    className="flex-1 bg-[#4a4458] border-gray-600 text-white placeholder:text-gray-400"
                    placeholder="1122223333"
                  />
                </div>
              </div>

              {/* Password */}
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                className="bg-[#4a4458] border-[#8b5cf6] text-white placeholder:text-gray-400"
                placeholder="Contraseña"
              />

              {/* Confirm Password */}
              <Input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                className="bg-[#4a4458] border-[#8b5cf6] text-white placeholder:text-gray-400"
                placeholder="Confirmar contraseña"
              />
            </div>

            {/* Save Button */}
            <Button onClick={handleSave} className="w-full mt-6 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white">
              Guardar información
            </Button>

            {/* Logout Button */}
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full mt-4 bg-[#4a4458] border-gray-600 text-white hover:bg-gray-600"
            >
              Cerrar sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
