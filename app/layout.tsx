import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { ModalProvider } from "@/components/modal-context"
import { GlobalModal } from "@/components/global-modal"
import { DrawerProvider } from "@/components/drawer-context"
import { RoleProvider } from "@/components/role-context"
import "./globals.css"
import "mapbox-gl/dist/mapbox-gl.css"
import Script from "next/script"

export const metadata: Metadata = {
  title: "Netherlands NDR",
  description: "Netherlands National Data Room – North Sea exploration & licensing platform",
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
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
          strategy="beforeInteractive"
        />
      </body>
    </html>
  )
}
