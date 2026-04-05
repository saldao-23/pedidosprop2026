"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Settings,
  Plus,
  Edit,
  Shield,
  ShieldOff,
  Trash2,
  Search,
  Copy,
  RefreshCw,
  X,
  CheckCircle,
  AlertTriangle,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Permission {
  id: string
  name: string
  description: string
}

interface Admin {
  id: string
  name: string
  email: string
  phone: string
  password: string
  status: "active" | "blocked"
  permissions: string[]
  createdAt: string
}

const availablePermissions: Permission[] = [
  { id: "manage_users", name: "Gestión de Usuarios", description: "Crear, editar y eliminar usuarios" },
  { id: "manage_orders", name: "Gestión de Pedidos", description: "Ver y administrar pedidos" },
  { id: "view_metrics", name: "Ver Métricas", description: "Acceso a reportes y estadísticas" },
  { id: "manage_admins", name: "Gestión de Administradores", description: "Crear y administrar otros administradores" },
]

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  const [searchTerm, setSearchTerm] = useState("")
  const [editingAdmin, setEditingAdmin] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{
    type: "block" | "delete"
    adminId: string
    adminName: string
  } | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    rol: "user" as "admin" | "user", // Por defecto crear usuarios normales
    permissions: [] as string[],
  })

  // Cargar admins desde Supabase
  useEffect(() => {
    const loadAdmins = async () => {
      try {
        const supabase = createClient()

        // Cargar solo usuarios con rol admin
        const { data: perfilesData, error } = await supabase
          .from("perfiles")
          .select("*")
          .eq("rol", "admin")
          .order("created_at", { ascending: false })

        if (error) {
          console.error("[v0] Error loading admins:", error)
          setLoading(false)
          return
        }

        // Mapear a la estructura de Admin
        const adminsData: Admin[] = (perfilesData || []).map((perfil) => ({
          id: perfil.id,
          name: perfil.nombre || "Sin nombre",
          email: perfil.email,
          phone: perfil.telefono || "Sin teléfono",
          password: "********", // No mostrar contraseña real
          status: "active" as const,
          permissions: ["manage_users", "manage_orders", "view_metrics", "manage_admins"], // Por defecto admin tiene todos los permisos
          createdAt: new Date(perfil.created_at).toISOString().split("T")[0],
        }))

        setAdmins(adminsData)
        setLoading(false)
      } catch (error) {
        console.error("[v0] Error in loadAdmins:", error)
        setLoading(false)
      }
    }

    loadAdmins()
  }, [])

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
    let password = ""
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const filteredAdmins = admins.filter((admin) => admin.email.toLowerCase().includes(searchTerm.toLowerCase()))

  const handleCreateAdmin = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      alert("Por favor completa todos los campos requeridos")
      return
    }

    if (formData.password.length < 6) {
      alert("La contraseña debe tener al menos 6 caracteres")
      return
    }

    try {
      setCreating(true)

      // Llamar al endpoint API para crear el usuario
      const response = await fetch("/api/admin/create-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          rol: formData.rol, // ← Enviar el rol seleccionado
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error("Error creating user:", data)
        alert(data.error || "Error al crear el usuario")
        setCreating(false)
        return
      }

      const tipoUsuario = formData.rol === "admin" ? "Administrador" : "Usuario"

      // Si es admin, agregar al estado local para que aparezca en la lista
      if (formData.rol === "admin") {
        const newAdmin: Admin = {
          id: data.admin.id,
          name: data.admin.name,
          email: data.admin.email,
          phone: data.admin.phone || "Sin teléfono",
          password: formData.password, // Guardar para mostrar (en producción no hacer esto)
          status: "active",
          permissions: ["manage_users", "manage_orders", "view_metrics", "manage_admins"],
          createdAt: new Date().toISOString().split("T")[0],
        }
        setAdmins([newAdmin, ...admins])
      }

      setFormData({ name: "", email: "", phone: "", password: "", rol: "user", permissions: [] })
      setShowCreateForm(false)
      setCreating(false)

      alert(`${tipoUsuario} creado exitosamente`)
    } catch (error) {
      console.error("Error:", error)
      alert("Error al crear el administrador")
      setCreating(false)
    }
  }

  const handleEditAdmin = (adminId: string) => {
    const admin = admins.find((a) => a.id === adminId)
    if (!admin) return

    setAdmins(admins.map((a) => (a.id === adminId ? { ...a, ...formData } : a)))
    setEditingAdmin(null)
    setFormData({ name: "", email: "", phone: "", password: "", rol: "user", permissions: [] })
  }

  const handleToggleBlock = (adminId: string) => {
    setAdmins(
      admins.map((admin) =>
        admin.id === adminId ? { ...admin, status: admin.status === "active" ? "blocked" : "active" } : admin,
      ),
    )
    setConfirmAction(null)
  }

  const handleDeleteAdmin = (adminId: string) => {
    setAdmins(admins.filter((admin) => admin.id !== adminId))
    setConfirmAction(null)
  }

  const startEdit = (admin: Admin) => {
    setFormData({
      name: admin.name,
      email: admin.email,
      phone: admin.phone,
      password: admin.password,
      permissions: admin.permissions,
    })
    setEditingAdmin(admin.id)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">Gestión de Administradores</h1>
          <p className="text-gray-400">Administra roles y permisos de administradores</p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          disabled={loading || creating}
          className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white disabled:opacity-50"
        >
          <Plus className="w-4 h-4 mr-2" />
          Crear Usuario
        </Button>
      </div>

      {showCreateForm && (
        <Card className="bg-[#4a4458] border-gray-600">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#8b5cf6]" />
                Crear Nuevo Usuario
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-white">
                  Nombre
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-[#2d2438] border-gray-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="rol" className="text-white">
                  Tipo de Usuario
                </Label>
                <Select value={formData.rol} onValueChange={(value: "admin" | "user") => setFormData({ ...formData, rol: value })}>
                  <SelectTrigger className="bg-[#2d2438] border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2d2438] border-gray-600">
                    <SelectItem value="user">Usuario Normal</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="email" className="text-white">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-[#2d2438] border-gray-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="phone" className="text-white">
                  Teléfono
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="bg-[#2d2438] border-gray-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="password" className="text-white">
                  Contraseña
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="bg-[#2d2438] border-gray-600 text-white"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData({ ...formData, password: generatePassword() })}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-white mb-3 block">Permisos</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availablePermissions.map((permission) => (
                  <div key={permission.id} className="flex items-start space-x-2">
                    <Checkbox
                      id={permission.id}
                      checked={formData.permissions.includes(permission.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData({
                            ...formData,
                            permissions: [...formData.permissions, permission.id],
                          })
                        } else {
                          setFormData({
                            ...formData,
                            permissions: formData.permissions.filter((p) => p !== permission.id),
                          })
                        }
                      }}
                      className="border-gray-600"
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor={permission.id}
                        className="text-sm font-medium text-white leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {permission.name}
                      </label>
                      <p className="text-xs text-gray-400">{permission.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleCreateAdmin}
                disabled={creating}
                className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white disabled:opacity-50"
              >
                {creating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  `Crear ${formData.rol === "admin" ? "Administrador" : "Usuario"}`
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(false)}
                disabled={creating}
                className="border-gray-600 text-gray-300 hover:bg-gray-700 disabled:opacity-50"
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-[#4a4458] border-gray-600">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-[#2d2438] border-gray-600 text-white"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#4a4458] border-gray-600">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#8b5cf6]" />
            Lista de Administradores ({filteredAdmins.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="text-left py-3 px-4 text-white font-medium">Nombre</th>
                  <th className="text-left py-3 px-4 text-white font-medium">Email</th>
                  <th className="text-left py-3 px-4 text-white font-medium">Teléfono</th>
                  <th className="text-left py-3 px-4 text-white font-medium">Contraseña</th>
                  <th className="text-left py-3 px-4 text-white font-medium">Estado</th>
                  <th className="text-left py-3 px-4 text-white font-medium">Permisos</th>
                  <th className="text-left py-3 px-4 text-white font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredAdmins.map((admin) => (
                  <tr key={admin.id} className="border-b border-gray-700 hover:bg-[#3d3651]">
                    <td className="py-3 px-4">
                      {editingAdmin === admin.id ? (
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="bg-[#2d2438] border-gray-600 text-white text-sm"
                        />
                      ) : (
                        <span className="text-white">{admin.name}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {editingAdmin === admin.id ? (
                        <Input
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="bg-[#2d2438] border-gray-600 text-white text-sm"
                        />
                      ) : (
                        <span className="text-gray-300">{admin.email}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {editingAdmin === admin.id ? (
                        <Input
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="bg-[#2d2438] border-gray-600 text-white text-sm"
                        />
                      ) : (
                        <span className="text-gray-300">{admin.phone}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {editingAdmin === admin.id ? (
                          <div className="flex gap-1">
                            <Input
                              value={formData.password}
                              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                              className="bg-[#2d2438] border-gray-600 text-white text-sm w-24"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setFormData({ ...formData, password: generatePassword() })}
                              className="border-gray-600 text-gray-300 hover:bg-gray-700 p-1"
                            >
                              <RefreshCw className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <span className="text-gray-300 font-mono text-sm">{admin.password}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(admin.password)}
                              className="text-gray-400 hover:text-white p-1"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          admin.status === "active" ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"
                        }`}
                      >
                        {admin.status === "active" ? "Activo" : "Bloqueado"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {admin.permissions.map((permId) => {
                          const perm = availablePermissions.find((p) => p.id === permId)
                          return perm ? (
                            <span key={permId} className="px-2 py-1 bg-[#8b5cf6] text-white text-xs rounded">
                              {perm.name}
                            </span>
                          ) : null
                        })}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        {editingAdmin === admin.id ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditAdmin(admin.id)}
                              className="text-green-400 hover:text-green-300 hover:bg-green-900/20"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingAdmin(null)
                                setFormData({ name: "", email: "", phone: "", password: "", rol: "user", permissions: [] })
                              }}
                              className="text-gray-400 hover:text-gray-300 hover:bg-gray-700"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEdit(admin)}
                              className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setConfirmAction({
                                  type: "block",
                                  adminId: admin.id,
                                  adminName: admin.name,
                                })
                              }
                              className={
                                admin.status === "active"
                                  ? "text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/20"
                                  : "text-green-400 hover:text-green-300 hover:bg-green-900/20"
                              }
                            >
                              {admin.status === "active" ? (
                                <ShieldOff className="w-4 h-4" />
                              ) : (
                                <Shield className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setConfirmAction({
                                  type: "delete",
                                  adminId: admin.id,
                                  adminName: admin.name,
                                })
                              }
                              className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {confirmAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#4a4458] border border-gray-600 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              {confirmAction.type === "delete" ? (
                <AlertTriangle className="w-6 h-6 text-red-400" />
              ) : (
                <Shield className="w-6 h-6 text-yellow-400" />
              )}
              <h3 className="text-lg font-semibold text-white">
                {confirmAction.type === "delete"
                  ? "Confirmar Eliminación"
                  : admins.find((a) => a.id === confirmAction.adminId)?.status === "active"
                    ? "Confirmar Bloqueo"
                    : "Confirmar Desbloqueo"}
              </h3>
            </div>
            <p className="text-gray-300 mb-6">
              {confirmAction.type === "delete"
                ? `¿Estás seguro de que deseas eliminar al administrador "${confirmAction.adminName}"? Esta acción no se puede deshacer.`
                : admins.find((a) => a.id === confirmAction.adminId)?.status === "active"
                  ? `¿Estás seguro de que deseas bloquear al administrador "${confirmAction.adminName}"?`
                  : `¿Estás seguro de que deseas desbloquear al administrador "${confirmAction.adminName}"?`}
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setConfirmAction(null)}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (confirmAction.type === "delete") {
                    handleDeleteAdmin(confirmAction.adminId)
                  } else {
                    handleToggleBlock(confirmAction.adminId)
                  }
                }}
                className={
                  confirmAction.type === "delete"
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : admins.find((a) => a.id === confirmAction.adminId)?.status === "active"
                      ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                      : "bg-green-600 hover:bg-green-700 text-white"
                }
              >
                {confirmAction.type === "delete"
                  ? "Confirmar Eliminación"
                  : admins.find((a) => a.id === confirmAction.adminId)?.status === "active"
                    ? "Confirmar Bloqueo"
                    : "Confirmar Desbloqueo"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
