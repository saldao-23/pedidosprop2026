"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ArrowLeft, UserPlus, RefreshCw, Users, Edit, Ban, Trash2, Plus, Key } from "lucide-react"
import Logo from "@/components/logo"
import { createClient } from "@/lib/supabase/client"

interface Usuario {
  id: string
  nombre: string
  email: string
  telefono: string
  rol: string
  invitaciones_disponibles: number
  invitaciones_usadas: number
  bloqueado: boolean
  created_at: string
}

export default function AdminUsersPage() {
  const router = useRouter()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [newInvitations, setNewInvitations] = useState<{ [key: string]: number }>({})

  // Estados para el modal de crear usuario
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newUserForm, setNewUserForm] = useState({
    nombre: "",
    email: "",
    telefono: "",
    password: "",
    rol: "user" as "user" | "admin",
    invitaciones: 10
  })

  // Estados para el modal de cambiar contraseña
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    userId: "",
    userName: "",
    newPassword: "",
    confirmPassword: ""
  })

  useEffect(() => {
    const loadUsuarios = async () => {
      try {
        const supabase = createClient()

        // Verificar que el usuario actual es admin
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push("/")
          return
        }

        const { data: perfil } = await supabase
          .from("perfiles")
          .select("rol")
          .eq("id", user.id)
          .single()

        if (!perfil || perfil.rol !== "admin") {
          router.push("/dashboard")
          return
        }

        // Cargar todos los usuarios
        const { data: usuariosData, error } = await supabase
          .from("perfiles")
          .select("*")
          .order("created_at", { ascending: false })

        if (error) {
          console.error("Error loading users:", error)
          return
        }

        // Cargar invitaciones usadas por cada usuario
        const { data: invitacionesData } = await supabase
          .from("invitaciones")
          .select("invitador_id")
          .eq("usado", true)

        // Contar invitaciones usadas por usuario
        const invitacionesPorUsuario: { [key: string]: number } = {}
        if (invitacionesData) {
          invitacionesData.forEach((inv) => {
            invitacionesPorUsuario[inv.invitador_id] = (invitacionesPorUsuario[inv.invitador_id] || 0) + 1
          })
        }

        // Combinar datos
        const usuariosConInvitaciones = (usuariosData || []).map((u) => ({
          ...u,
          invitaciones_usadas: invitacionesPorUsuario[u.id] || 0
        }))

        setUsuarios(usuariosConInvitaciones)
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }

    loadUsuarios()
  }, [router])

  const handleUpdateInvitations = async (userId: string, newValue: number) => {
    if (newValue < 0 || newValue > 999) {
      alert("El valor debe estar entre 0 y 999")
      return
    }

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from("perfiles")
        .update({ invitaciones_disponibles: newValue })
        .eq("id", userId)

      if (error) {
        console.error("Error updating invitations:", error)
        alert("Error al actualizar las invitaciones")
        return
      }

      // Actualizar localmente
      setUsuarios(usuarios.map(u =>
        u.id === userId ? { ...u, invitaciones_disponibles: newValue } : u
      ))

      setEditingUser(null)
      setNewInvitations({})

      alert("Invitaciones actualizadas exitosamente")
    } catch (error) {
      console.error("Error:", error)
      alert("Error al actualizar las invitaciones")
    }
  }

  const handleResetInvitations = async (userId: string) => {
    if (!confirm("¿Estás seguro de reiniciar las invitaciones a 10?")) {
      return
    }

    await handleUpdateInvitations(userId, 10)
  }

  const handleBlockUser = async (userId: string, currentlyBlocked: boolean) => {
    const action = currentlyBlocked ? "desbloquear" : "bloquear"
    if (!confirm(`¿Estás seguro de ${action} este usuario?`)) {
      return
    }

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from("perfiles")
        .update({ bloqueado: !currentlyBlocked })
        .eq("id", userId)

      if (error) {
        console.error("Error blocking/unblocking user:", error)
        alert(`Error al ${action} el usuario`)
        return
      }

      // Actualizar localmente
      setUsuarios(usuarios.map(u =>
        u.id === userId ? { ...u, bloqueado: !currentlyBlocked } : u
      ))

      alert(`Usuario ${action === "bloquear" ? "bloqueado" : "desbloqueado"} exitosamente`)
    } catch (error) {
      console.error("Error:", error)
      alert(`Error al ${action} el usuario`)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.")) {
      return
    }

    try {
      // Llamar al endpoint API para eliminar el usuario
      const response = await fetch("/api/admin/delete-user", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error("Error deleting user:", data)
        alert(data.error || "Error al eliminar el usuario")
        return
      }

      // Actualizar localmente
      setUsuarios(usuarios.filter(u => u.id !== userId))

      alert("Usuario eliminado exitosamente")
    } catch (error) {
      console.error("Error:", error)
      alert("Error al eliminar el usuario")
    }
  }

  const handleCreateUser = async () => {
    if (!newUserForm.nombre || !newUserForm.email || !newUserForm.password) {
      alert("Por favor completa los campos requeridos: nombre, email y contraseña")
      return
    }

    if (newUserForm.password.length < 6) {
      alert("La contraseña debe tener al menos 6 caracteres")
      return
    }

    setCreating(true)

    try {
      const response = await fetch("/api/admin/create-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newUserForm.nombre,
          email: newUserForm.email,
          phone: newUserForm.telefono,
          password: newUserForm.password,
          rol: newUserForm.rol,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || data.details || "Error al crear el usuario")
        return
      }

      // Actualizar invitaciones si es diferente al default
      if (newUserForm.invitaciones !== 10 && data.admin?.id) {
        const supabase = createClient()
        await supabase
          .from("perfiles")
          .update({ invitaciones_disponibles: newUserForm.invitaciones })
          .eq("id", data.admin.id)
      }

      // Agregar el nuevo usuario a la lista
      const nuevoUsuario: Usuario = {
        id: data.admin.id,
        nombre: newUserForm.nombre,
        email: newUserForm.email,
        telefono: newUserForm.telefono,
        rol: newUserForm.rol,
        invitaciones_disponibles: newUserForm.invitaciones,
        invitaciones_usadas: 0,
        bloqueado: false,
        created_at: new Date().toISOString(),
      }

      setUsuarios(prev => [nuevoUsuario, ...prev])
      setCreateDialogOpen(false)
      setNewUserForm({
        nombre: "",
        email: "",
        telefono: "",
        password: "",
        rol: "user",
        invitaciones: 10
      })

      alert("Usuario creado exitosamente")
    } catch (error) {
      console.error("Error:", error)
      alert("Error al crear el usuario")
    } finally {
      setCreating(false)
    }
  }

  const openPasswordDialog = (usuario: Usuario) => {
    setPasswordForm({
      userId: usuario.id,
      userName: usuario.nombre,
      newPassword: "",
      confirmPassword: ""
    })
    setPasswordDialogOpen(true)
  }

  const handleChangePassword = async () => {
    if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
      alert("Por favor completa ambos campos de contraseña")
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("Las contraseñas no coinciden")
      return
    }

    if (passwordForm.newPassword.length < 6) {
      alert("La contraseña debe tener al menos 6 caracteres")
      return
    }

    setChangingPassword(true)

    try {
      const response = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: passwordForm.userId,
          newPassword: passwordForm.newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || data.details || "Error al cambiar la contraseña")
        return
      }

      setPasswordDialogOpen(false)
      setPasswordForm({
        userId: "",
        userName: "",
        newPassword: "",
        confirmPassword: ""
      })

      alert("Contraseña actualizada exitosamente")
    } catch (error) {
      console.error("Error:", error)
      alert("Error al cambiar la contraseña")
    } finally {
      setChangingPassword(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#3a3544] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8b5cf6] mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando usuarios...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#3a3544]">
      {/* Header */}
      <header className="bg-[#3a3544] border-b border-gray-600 px-6 py-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/admin")}
            className="text-white hover:bg-gray-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <div className="flex items-center">
            <Logo onClick={() => router.push("/admin")} size="small" />
          </div>

          <div className="ml-auto">
            <h1 className="text-white text-xl font-semibold">Gestión de Usuarios</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        <Card className="bg-[#4a4458] border-gray-600">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-6 h-6" />
                Usuarios del Sistema ({usuarios.length})
              </CardTitle>
              <Button
                onClick={() => setCreateDialogOpen(true)}
                className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Usuario
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="text-left text-gray-300 py-3 px-4">Nombre</th>
                    <th className="text-left text-gray-300 py-3 px-4">Email</th>
                    <th className="text-left text-gray-300 py-3 px-4">Teléfono</th>
                    <th className="text-left text-gray-300 py-3 px-4">Rol</th>
                    <th className="text-left text-gray-300 py-3 px-4">Estado</th>
                    <th className="text-left text-gray-300 py-3 px-4">Invitaciones</th>
                    <th className="text-left text-gray-300 py-3 px-4">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((usuario) => (
                    <tr key={usuario.id} className="border-b border-gray-600/50 hover:bg-gray-700/30">
                      <td className="py-4 px-4 text-white">{usuario.nombre}</td>
                      <td className="py-4 px-4 text-gray-300 text-sm">{usuario.email}</td>
                      <td className="py-4 px-4 text-gray-300 text-sm">{usuario.telefono || "-"}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            usuario.rol === "admin"
                              ? "bg-purple-500/20 text-purple-300"
                              : "bg-blue-500/20 text-blue-300"
                          }`}
                        >
                          {usuario.rol}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            usuario.bloqueado
                              ? "bg-red-500/20 text-red-300"
                              : "bg-green-500/20 text-green-300"
                          }`}
                        >
                          {usuario.bloqueado ? "Bloqueado" : "Activo"}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {editingUser === usuario.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              max="999"
                              value={newInvitations[usuario.id] ?? usuario.invitaciones_disponibles}
                              onChange={(e) =>
                                setNewInvitations({
                                  ...newInvitations,
                                  [usuario.id]: parseInt(e.target.value) || 0,
                                })
                              }
                              className="w-20 bg-[#3a3544] border-gray-600 text-white"
                            />
                            <Button
                              size="sm"
                              onClick={() =>
                                handleUpdateInvitations(
                                  usuario.id,
                                  newInvitations[usuario.id] ?? usuario.invitaciones_disponibles
                                )
                              }
                              className="bg-green-600 hover:bg-green-700"
                            >
                              ✓
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingUser(null)
                                setNewInvitations({})
                              }}
                              className="border-gray-600"
                            >
                              ✗
                            </Button>
                          </div>
                        ) : (
                          <div className="flex flex-col">
                            <span className="text-white font-semibold">
                              {Math.max((usuario.invitaciones_disponibles || 0) - usuario.invitaciones_usadas, 0)}
                            </span>
                            <span className="text-gray-400 text-xs">
                              ({usuario.invitaciones_usadas} usadas de {usuario.invitaciones_disponibles || 0})
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2 flex-wrap">
                          {editingUser !== usuario.id && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => setEditingUser(usuario.id)}
                                className="bg-[#8b5cf6] hover:bg-[#7c3aed]"
                                title="Editar invitaciones"
                              >
                                <UserPlus className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleResetInvitations(usuario.id)}
                                className="border-gray-600 hover:bg-gray-700"
                                title="Reiniciar a 10"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openPasswordDialog(usuario)}
                                className="border-gray-600 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300"
                                title="Cambiar contraseña"
                              >
                                <Key className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleBlockUser(usuario.id, usuario.bloqueado)}
                                className={`border-gray-600 ${
                                  usuario.bloqueado
                                    ? "bg-green-600/20 hover:bg-green-600/30 text-green-300"
                                    : "bg-orange-600/20 hover:bg-orange-600/30 text-orange-300"
                                }`}
                                title={usuario.bloqueado ? "Desbloquear usuario" : "Bloquear usuario"}
                              >
                                <Ban className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteUser(usuario.id)}
                                className="border-gray-600 bg-red-600/20 hover:bg-red-600/30 text-red-300"
                                title="Eliminar usuario"
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

            {usuarios.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No hay usuarios registrados</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Información adicional */}
        <Card className="bg-[#4a4458] border-gray-600 mt-6">
          <CardContent className="pt-6">
            <div className="text-gray-300 space-y-2 text-sm">
              <p>
                <strong className="text-white">Nota:</strong> Las invitaciones disponibles representan
                el límite total que cada usuario puede usar.
              </p>
              <p>
                <strong className="text-white">Editar:</strong> Haz clic en el ícono de usuario para
                cambiar el número de invitaciones disponibles.
              </p>
              <p>
                <strong className="text-white">Reiniciar:</strong> Haz clic en el ícono de reinicio para
                establecer las invitaciones a 10 (valor por defecto).
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal para crear usuario */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-[#4a4458] border-gray-600 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Crear Nuevo Usuario</DialogTitle>
            <DialogDescription className="text-gray-400">
              Completa los datos para crear un nuevo usuario en el sistema.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nombre" className="text-white">
                Nombre <span className="text-red-400">*</span>
              </Label>
              <Input
                id="nombre"
                value={newUserForm.nombre}
                onChange={(e) => setNewUserForm({ ...newUserForm, nombre: e.target.value })}
                placeholder="Nombre de la inmobiliaria"
                className="bg-[#3a3544] border-gray-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">
                Email <span className="text-red-400">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={newUserForm.email}
                onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                placeholder="email@ejemplo.com"
                className="bg-[#3a3544] border-gray-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono" className="text-white">
                Telefono
              </Label>
              <Input
                id="telefono"
                value={newUserForm.telefono}
                onChange={(e) => setNewUserForm({ ...newUserForm, telefono: e.target.value })}
                placeholder="+54 9 11 1234-5678"
                className="bg-[#3a3544] border-gray-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">
                Contrasena <span className="text-red-400">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                value={newUserForm.password}
                onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                placeholder="Minimo 6 caracteres"
                className="bg-[#3a3544] border-gray-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">Rol</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={newUserForm.rol === "user" ? "default" : "outline"}
                  onClick={() => setNewUserForm({ ...newUserForm, rol: "user" })}
                  className={newUserForm.rol === "user"
                    ? "bg-[#8b5cf6] text-white"
                    : "border-gray-600 text-white hover:bg-gray-700"
                  }
                >
                  Usuario
                </Button>
                <Button
                  type="button"
                  variant={newUserForm.rol === "admin" ? "default" : "outline"}
                  onClick={() => setNewUserForm({ ...newUserForm, rol: "admin" })}
                  className={newUserForm.rol === "admin"
                    ? "bg-[#8b5cf6] text-white"
                    : "border-gray-600 text-white hover:bg-gray-700"
                  }
                >
                  Administrador
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="invitaciones" className="text-white">
                Invitaciones disponibles
              </Label>
              <Input
                id="invitaciones"
                type="number"
                min="0"
                max="999"
                value={newUserForm.invitaciones}
                onChange={(e) => setNewUserForm({ ...newUserForm, invitaciones: parseInt(e.target.value) || 0 })}
                className="bg-[#3a3544] border-gray-600 text-white w-24"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              className="border-gray-600 text-white hover:bg-gray-700"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateUser}
              disabled={creating}
              className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white"
            >
              {creating ? "Creando..." : "Crear Usuario"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para cambiar contraseña */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="bg-[#4a4458] border-gray-600 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Cambiar Contraseña</DialogTitle>
            <DialogDescription className="text-gray-400">
              Cambiar contraseña para: <span className="text-white font-medium">{passwordForm.userName}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-white">
                Nueva Contraseña <span className="text-red-400">*</span>
              </Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder="Minimo 6 caracteres"
                className="bg-[#3a3544] border-gray-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-white">
                Confirmar Contraseña <span className="text-red-400">*</span>
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                placeholder="Repite la contraseña"
                className="bg-[#3a3544] border-gray-600 text-white"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPasswordDialogOpen(false)}
              className="border-gray-600 text-white hover:bg-gray-700"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={changingPassword}
              className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white"
            >
              {changingPassword ? "Cambiando..." : "Cambiar Contraseña"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
