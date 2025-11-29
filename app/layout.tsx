import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { ModalProvider } from "@/components/modal-context"
import { GlobalModal } from "@/components/global-modal"
import { DrawerProvider } from "@/components/drawer-context"
import { RoleProvider } from "@/components/role-context"
import "./globals.css"
import "mapbox-gl/dist/mapbox-gl.css"

export const metadata: Metadata = {
  title: "Indonesia VDR",
  description: "Geological data processing platform",
}

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-sans" })

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.className} ${inter.variable}`} suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <ModalProvider>
            <RoleProvider>
              <DrawerProvider>
                {children}
                <GlobalModal />
              </DrawerProvider>
            </RoleProvider>
          </ModalProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
