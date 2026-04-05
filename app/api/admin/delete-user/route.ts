import { createClient, createAdminClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verificar que el usuario actual es admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { data: perfil } = await supabase
      .from("perfiles")
      .select("rol")
      .eq("id", user.id)
      .single()

    if (!perfil || perfil.rol !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    // Obtener el ID del usuario a eliminar del body
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "userId requerido" }, { status: 400 })
    }

    // No permitir que el admin se elimine a sí mismo
    if (userId === user.id) {
      return NextResponse.json({ error: "No puedes eliminarte a ti mismo" }, { status: 400 })
    }

    // Usar el cliente de admin con SERVICE_ROLE_KEY para eliminar
    const adminClient = createAdminClient()

    // Eliminar el usuario de auth usando admin API
    // Esto también eliminará automáticamente el perfil si hay CASCADE configurado
    const { error: authError } = await adminClient.auth.admin.deleteUser(userId)

    if (authError) {
      console.error("Error deleting auth user:", authError)
      return NextResponse.json(
        {
          error: "Error al eliminar el usuario",
          details: authError.message,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Usuario eliminado exitosamente",
    })
  } catch (error) {
    console.error("Error en delete-user:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    )
  }
}
