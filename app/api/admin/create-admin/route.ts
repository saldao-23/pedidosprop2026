import { createClient, createAdminClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
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

    // Obtener datos del body
    const { name, email, phone, password, rol = "user" } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    // Validar rol
    if (rol !== "admin" && rol !== "user") {
      return NextResponse.json({ error: "Rol inválido" }, { status: 400 })
    }

    // Validar contraseña (mínimo 6 caracteres)
    if (password.length < 6) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 })
    }

    // Usar el cliente de admin para crear el usuario
    const adminClient = createAdminClient()

    // Crear usuario en Auth
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirmar email
      user_metadata: {
        nombre: name,
        telefono: phone || "",
      },
    })

    if (authError) {
      console.error("Error creating auth user:", authError)
      return NextResponse.json(
        {
          error: "Error al crear usuario",
          details: authError.message,
        },
        { status: 500 }
      )
    }

    if (!authData.user) {
      return NextResponse.json({ error: "No se pudo crear el usuario" }, { status: 500 })
    }

    // Crear perfil con el rol especificado
    const { error: perfilError } = await supabase.from("perfiles").insert({
      id: authData.user.id,
      nombre: name,
      email: email,
      telefono: phone || "",
      rol: rol, // ← Usar el rol que viene del parámetro (admin o user)
    })

    if (perfilError) {
      console.error("Error creating profile:", perfilError)
      // Intentar eliminar el usuario de auth si falla la creación del perfil
      await adminClient.auth.admin.deleteUser(authData.user.id).catch(() => {})
      return NextResponse.json(
        {
          error: "Error al crear el perfil",
          details: perfilError.message,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Administrador creado exitosamente",
      admin: {
        id: authData.user.id,
        name: name,
        email: email,
        phone: phone || "",
      },
    })
  } catch (error) {
    console.error("Error en create-admin:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    )
  }
}
