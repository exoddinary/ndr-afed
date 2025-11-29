"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import { usePathname } from "next/navigation"
import { Sidebar } from "./sidebar"
import { Header } from "./header"
import { Breadcrumbs } from "./breadcrumbs"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useDrawer } from "./drawer-context"

interface LayoutWrapperProps {
  children: React.ReactNode
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname()
  const { isRightDrawerOpen, setRightDrawerOpen } = useDrawer()
  const isAdminRoute = pathname.startsWith("/admin")
  const isDashboard = pathname === "/"
  const isUploadPage = pathname === "/upload"
  const isProfilePage = pathname === "/profile"
  const isCatalogPage = pathname.startsWith("/catalog")
  const isCatalogRoot = pathname === "/catalog"
  const isQuarantinePage = pathname === "/quarantine"
  const isDataLinkRoute = pathname.startsWith("/data-link")
  const isAnalyticsPage = pathname.startsWith("/analytics")
  const isAIGeospatialPage = pathname === "/ai-geospatial"
  const isGEBPage = pathname.startsWith("/geb")
  const showSidebar = isDashboard || isAdminRoute || isUploadPage || isProfilePage || isCatalogPage || isQuarantinePage || isDataLinkRoute || isAnalyticsPage || isGEBPage
  const showNavigation = true

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true)
  
  // Force sidebar to collapse when right drawer is open on the catalog ROOT only
  const effectiveSidebarCollapsed = isRightDrawerOpen && isCatalogRoot ? true : isSidebarCollapsed
  
  // Auto-collapse sidebar when right drawer opens on catalog ROOT only
  useEffect(() => {
    if (isRightDrawerOpen && isCatalogRoot && !isSidebarCollapsed) {
      setIsSidebarCollapsed(true)
    }
  }, [isRightDrawerOpen, isCatalogRoot, isSidebarCollapsed])

  // Reset right drawer when navigating away from the catalog ROOT
  useEffect(() => {
    if (!isCatalogRoot && isRightDrawerOpen) {
      setRightDrawerOpen(false)
    }
  }, [pathname, isCatalogRoot, isRightDrawerOpen, setRightDrawerOpen])

  // Special layout for AI Geospatial page - full screen with header only
  if (isAIGeospatialPage) {
    return (
      <div className="h-screen w-screen overflow-hidden flex flex-col">
        <Header showNavigation={showNavigation} titleOverride={isGEBPage ? "SEEK-GEB" : undefined} />
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    )
  }

  return (
    <div className={cn((isDashboard || isGEBPage) ? "h-screen overflow-hidden" : "min-h-screen", isDashboard ? "bg-transparent" : "bg-background")}> 
      {showSidebar && (
        <Suspense fallback={null}>
          {isGEBPage ? (
            <div className="hidden lg:block">
              <Sidebar onCollapseChange={setIsSidebarCollapsed} />
            </div>
          ) : (
            <Sidebar onCollapseChange={setIsSidebarCollapsed} />
          )}
        </Suspense>
      )}

      <div
        className={cn(
          (isDashboard || isGEBPage) ? "flex flex-col h-full transition-all duration-300" : "flex flex-col min-h-screen transition-all duration-300",
          showSidebar
            ? effectiveSidebarCollapsed
              ? (isGEBPage ? "lg:ml-16" : "ml-16")
              : (isGEBPage ? "lg:ml-64" : "ml-64")
            : "",
          // Only push content when the right drawer is open on the catalog ROOT
          isRightDrawerOpen && isCatalogRoot ? "mr-96" : "mr-0"
        )}
      >
        {isGEBPage ? (
          // On GEB routes, hide the global green header on tablet/mobile and keep it only on desktop
          <div className="hidden lg:block">
            <Header showNavigation={showNavigation} titleOverride="SEEK-GEB" />
          </div>
        ) : (
          <Header showNavigation={showNavigation} titleOverride={undefined} />
        )}

        <main className={cn(showSidebar ? "flex-1 w-full min-h-0" : "container mx-auto px-6 py-8 max-w-4xl", (isDashboard || isGEBPage) && "overflow-hidden")}> 
          {showSidebar ? (
            <div className={cn(
              isGEBPage ? "w-full mx-auto" : "w-full max-w-[1400px] mx-auto",
              isDashboard ? "px-6" : (isGEBPage ? "px-0 py-0" : "p-6"),
              // allow child pages to use height for internal scroll
              (isDashboard || isGEBPage) && "flex flex-col h-full min-h-0"
            )}>
              {/* Back to Analytics above breadcrumb on analytics subpages */}
              {isAnalyticsPage && pathname !== "/analytics" && (
                <div className="mt-2">
                  <Link href="/analytics">
                    <Button variant="outline" size="sm" className="mb-2">Back to Analytics</Button>
                  </Link>
                </div>
              )}
              {!isCatalogPage && !isGEBPage && <Breadcrumbs />}
              {children}
            </div>
          ) : (
            <>
              {isAdminRoute && <Breadcrumbs />}
              {children}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
