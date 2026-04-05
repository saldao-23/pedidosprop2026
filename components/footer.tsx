import Logo from "./logo"
import { Instagram } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-[#3a3544] border-t border-gray-600 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Desktop layout */}
        <div className="hidden md:flex items-center justify-between">
          {/* Logo a la izquierda */}
          <div className="flex-shrink-0">
            <Logo size="small" />
          </div>

          {/* Texto centrado */}
          <div className="flex-1 text-center">
            <p className="text-gray-400 text-sm">
              © 2025 pedidosPROP – Todos los derechos reservados
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Powered by{" "}
              <a
                href="https://wa.me/573001558509?text=Hola%2C%20estoy%20interesado%20en%20tus%20servicios"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#8b5cf6] hover:text-[#7c3aed] transition-colors underline"
              >
                CrompelSolutions
              </a>
            </p>
          </div>

          {/* Instagram y soporte a la derecha */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <a
              href="https://instagram.com/pedidosprop"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-400 hover:text-purple-400 transition-colors"
            >
              <Instagram className="h-5 w-5" />
            </a>
            <a
              href="mailto:soporte@pedidosprop.ar"
              className="text-gray-400 hover:text-lime-400 transition-colors text-sm"
            >
              soporte@pedidosprop.ar
            </a>
          </div>
        </div>

        {/* Mobile layout */}
        <div className="md:hidden flex flex-col items-center gap-4 text-center">
          {/* Logo */}
          <Logo size="small" />

          {/* Texto de copyright */}
          <p className="text-gray-400 text-sm">© 2025 pedidosPROP – Todos los derechos reservados</p>
          <p className="text-gray-500 text-xs">
            Powered by{" "}
            <a
              href="https://wa.me/573001558509?text=Hola%2C%20estoy%20interesado%20en%20tus%20servicios"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#8b5cf6] hover:text-[#7c3aed] transition-colors underline"
            >
              CrompelSolutions
            </a>
          </p>

          {/* Instagram y soporte */}
          <div className="flex flex-col items-center gap-2">
            <a
              href="https://instagram.com/pedidosprop"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-400 hover:text-purple-400 transition-colors"
            >
              <Instagram className="h-5 w-5" />
              <span className="text-sm">Instagram</span>
            </a>
            <a
              href="mailto:soporte@pedidosprop.ar"
              className="text-gray-400 hover:text-lime-400 transition-colors text-sm"
            >
              soporte@pedidosprop.ar
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
