import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
// import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import Footer from "../components/footer"
import "./globals.css"

export const metadata: Metadata = {
  title: "pedidosPROP - Plataforma Inmobiliaria",
  description: "Plataforma web para inmobiliarias - Pedidos de compra, alquiler, permuta y alquiler temporario",
  generator: "v0.app",
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body
        className={`font-sans ${GeistSans.variable} ${GeistMono.variable} overflow-x-hidden max-w-full min-h-screen flex flex-col`}
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('unhandledrejection', function(event) {
                if (event.reason && typeof event.reason === 'string') {
                  const reason = event.reason.toLowerCase();
                  if (reason.includes('metamask') || 
                      reason.includes('ethereum') || 
                      reason.includes('wallet') ||
                      reason.includes('failed to connect') ||
                      reason.includes('user rejected') ||
                      reason.includes('extension')) {
                    console.warn('Ignored browser extension error:', event.reason);
                    event.preventDefault();
                    return;
                  }
                }
                
                // Also handle object-type errors from extensions
                if (event.reason && typeof event.reason === 'object' && event.reason.message) {
                  const message = event.reason.message.toLowerCase();
                  if (message.includes('metamask') || 
                      message.includes('ethereum') || 
                      message.includes('wallet') ||
                      message.includes('failed to connect') ||
                      message.includes('user rejected')) {
                    console.warn('Ignored browser extension error:', event.reason.message);
                    event.preventDefault();
                    return;
                  }
                }
              });
              
              window.addEventListener('error', function(event) {
                if (event.error && event.error.message) {
                  const message = event.error.message.toLowerCase();
                  if (message.includes('metamask') || 
                      message.includes('ethereum') || 
                      message.includes('wallet') ||
                      message.includes('failed to connect')) {
                    console.warn('Ignored browser extension error:', event.error.message);
                    event.preventDefault();
                    return false;
                  }
                }
              });
            `,
          }}
        />
        <div className="flex-1 flex flex-col">
          <Suspense fallback={null}>{children}</Suspense>
        </div>
        <Footer />
        {/* <Analytics /> */}
      </body>
    </html>
  )
}
