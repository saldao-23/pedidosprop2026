// Funciones de sanitización y validación de seguridad

// Sanitizar texto - elimina caracteres peligrosos para XSS
export const sanitizeText = (input: string): string => {
  if (!input) return ""
  return input
    .replace(/[<>]/g, "") // Eliminar < y >
    .replace(/javascript:/gi, "") // Eliminar javascript:
    .replace(/on\w+=/gi, "") // Eliminar event handlers
    .trim()
}

// Sanitizar para HTML - escapa caracteres especiales
export const escapeHtml = (input: string): string => {
  if (!input) return ""
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
  }
  return input.replace(/[&<>"']/g, (char) => map[char] || char)
}

// Validar email
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return emailRegex.test(email) && email.length <= 254
}

// Validar teléfono (solo números, +, -, espacios)
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[0-9+\-\s()]{6,20}$/
  return phoneRegex.test(phone)
}

// Sanitizar teléfono - solo mantiene números
export const sanitizePhone = (phone: string): string => {
  return phone.replace(/[^\d]/g, "")
}

// Validar nombre (letras, números, espacios, algunos caracteres especiales)
export const isValidName = (name: string): boolean => {
  const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s.,'&-]{1,100}$/
  return nameRegex.test(name)
}

// Sanitizar nombre
export const sanitizeName = (name: string): string => {
  if (!name) return ""
  return name
    .replace(/[<>{}[\]\\]/g, "") // Eliminar caracteres peligrosos
    .slice(0, 100) // Limitar longitud
    .trim()
}

// Validar contraseña (mínimo 6 caracteres)
export const isValidPassword = (password: string): boolean => {
  return password.length >= 6 && password.length <= 128
}

// Validar título (sin caracteres peligrosos)
export const isValidTitle = (title: string): boolean => {
  const titleRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s.,!?¡¿'"()-]{1,40}$/
  return titleRegex.test(title)
}

// Sanitizar título
export const sanitizeTitle = (title: string): string => {
  if (!title) return ""
  return title
    .replace(/[<>{}[\]\\]/g, "")
    .slice(0, 40)
    .trim()
}

// Validar descripción
export const isValidDescription = (description: string): boolean => {
  return description.length >= 1 && description.length <= 400
}

// Sanitizar descripción
export const sanitizeDescription = (description: string): string => {
  if (!description) return ""
  return description
    .replace(/[<>{}[\]\\]/g, "")
    .slice(0, 400)
    .trim()
}

// Validar número (presupuesto)
export const isValidBudget = (budget: string): boolean => {
  const num = budget.replace(/\./g, "").replace(/,/g, "")
  return /^\d{1,12}$/.test(num)
}

// Sanitizar número
export const sanitizeNumber = (num: string): string => {
  return num.replace(/[^\d]/g, "").slice(0, 12)
}

// Validar zona/barrio
export const isValidZone = (zone: string): boolean => {
  const zoneRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s-]{1,30}$/
  return zoneRegex.test(zone)
}

// Sanitizar zona
export const sanitizeZone = (zone: string): string => {
  if (!zone) return ""
  return zone
    .replace(/[<>{}[\]\\'"]/g, "")
    .slice(0, 30)
    .trim()
    .toLowerCase()
}

// Validar banco
export const isValidBank = (bank: string): boolean => {
  const bankRegex = /^[a-zA-Z0-9\s]{1,10}$/
  return bankRegex.test(bank)
}

// Sanitizar banco
export const sanitizeBank = (bank: string): string => {
  if (!bank) return ""
  return bank
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .slice(0, 10)
    .trim()
}

// Detectar posibles inyecciones SQL
export const hasSqlInjection = (input: string): boolean => {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE)\b)/i,
    /(--|;|\/\*|\*\/)/,
    /(\bOR\b|\bAND\b).*=/i,
  ]
  return sqlPatterns.some(pattern => pattern.test(input))
}

// Detectar posibles XSS
export const hasXss = (input: string): boolean => {
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
  ]
  return xssPatterns.some(pattern => pattern.test(input))
}

// Validación general de entrada segura
export const isSafeInput = (input: string): boolean => {
  if (!input) return true
  return !hasSqlInjection(input) && !hasXss(input)
}

// Sanitización general
export const sanitizeInput = (input: string, maxLength: number = 255): string => {
  if (!input) return ""
  return input
    .replace(/[<>{}[\]\\]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "")
    .slice(0, maxLength)
    .trim()
}
