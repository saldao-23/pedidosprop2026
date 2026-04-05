"use client"

import { useRouter } from "next/navigation"

interface LogoProps {
  onClick?: () => void
  className?: string
  alt?: string
  size?: "small" | "medium" | "large"
}

export default function Logo({ onClick, className, alt = "PROP", size = "medium" }: LogoProps) {
  const router = useRouter()

  const getSizeClasses = () => {
    switch (size) {
      case "small":
        return "h-8 w-auto" // Para navbar/header
      case "medium":
        return "h-12 w-auto" // Tamaño por defecto
      case "large":
        return "h-16 w-auto md:h-20 md:w-auto" // Para login/registro
      default:
        return className || "h-10 w-auto"
    }
  }

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      const isLoggedIn = localStorage.getItem("isLoggedIn") === "true"
      if (isLoggedIn) {
        router.push("/dashboard")
      } else {
        router.push("/")
      }
    }
  }

  return (
    <div className="cursor-pointer hover:opacity-80 transition-opacity" onClick={handleClick}>
      <img src="/logo.png" alt={alt} className={className || getSizeClasses()} />
    </div>
  )
}
