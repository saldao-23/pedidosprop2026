"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Users, Settings, BarChart3, Menu, LogOut, UserCog } from "lucide-react"
import Logo from "@/components/logo"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in and is admin
    const isLoggedIn = localStorage.getItem("isLoggedIn")
    const userRole = localStorage.getItem("userRole")

    if (!isLoggedIn || userRole !== "admin") {
      router.push("/")
      return
    }
  }, [router])

  const handleLogout = async () => {
    const { createClient } = await import("@/lib/supabase/client")
    const supabase = createClient()

    try {
      // Cerrar sesión en Supabase
      await supabase.auth.signOut()

      // Limpiar localStorage
      localStorage.removeItem("isLoggedIn")
      localStorage.removeItem("userRole")
      localStorage.removeItem("userWhatsApp")
      localStorage.removeItem("userName")
      localStorage.removeItem("userProfile")
      localStorage.removeItem("userProfileImage")

      // Redirigir al login
      router.push("/")
      router.refresh()
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
      router.push("/")
    }
  }

  const handleLogoClick = () => {
    router.push("/admin")
  }

  const menuItems = [
    {
      icon: UserCog,
      label: "Gestión de Usuarios",
      href: "/admin/users",
    },
    {
      icon: Settings,
      label: "Administradores",
      href: "/admin/admins",
    },
    {
      icon: BarChart3,
      label: "Métricas",
      href: "/admin/metrics",
    },
  ]

  return (
    <div className="min-h-screen bg-[#3a3544]">
      {/* Fixed Horizontal Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#2d2a36] border-b border-gray-600">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center space-x-4">
              <Logo onClick={handleLogoClick} size="small" />
              <div className="hidden sm:block text-sm text-gray-400">Panel de Administración</div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {menuItems.map((item) => (
                <Button
                  key={item.href}
                  variant="ghost"
                  className="text-white hover:bg-[#8b5cf6] hover:text-white px-4 py-2"
                  onClick={() => router.push(item.href)}
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.label}
                </Button>
              ))}
              <Button
                variant="ghost"
                className="text-red-400 hover:bg-red-500 hover:text-white px-4 py-2 ml-4"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar sesión
              </Button>
            </nav>

            {/* Mobile Menu */}
            <div className="md:hidden">
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white hover:bg-gray-700">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="bg-[#2d2a36] border-gray-600 text-white w-80">
                  <div className="flex flex-col h-full">
                    <div className="py-4 border-b border-gray-600">
                      <div className="text-sm text-gray-400">Panel de Administración</div>
                    </div>

                    <nav className="flex-1 py-4 space-y-2">
                      {menuItems.map((item) => (
                        <Button
                          key={item.href}
                          variant="ghost"
                          className="w-full justify-start text-white hover:bg-[#8b5cf6] hover:text-white"
                          onClick={() => {
                            router.push(item.href)
                            setSidebarOpen(false)
                          }}
                        >
                          <item.icon className="w-5 h-5 mr-3" />
                          {item.label}
                        </Button>
                      ))}
                    </nav>

                    <div className="py-4 border-t border-gray-600">
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-red-400 hover:bg-red-500 hover:text-white"
                        onClick={handleLogout}
                      >
                        <LogOut className="w-5 h-5 mr-3" />
                        Cerrar sesión
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with top padding for fixed header */}
      <div className="pt-20">{children}</div>
    </div>
  )
}
