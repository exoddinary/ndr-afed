"use client"

import React from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { useRole } from "./role-context"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type SidebarItem = {
  title: string
  href: string
  icon?: string
  iconSrc?: string
  badge?: string
  badgeColor?: string
  // Optional scale to slightly adjust icon visual width/height
  iconScale?: number
}

type SidebarSection = {
  title: string
  items: SidebarItem[]
}

const getSidebarSections = (role: string): SidebarSection[] => {
  const baseSections: SidebarSection[] = [
    {
      title: "HOME",
      items: [
        {
          title: "Home",
          href: "/",
          iconSrc: "/icons/homepage-sidebar.svg",
        },
      ],
    },
    {
      title: "DATA LINK",
      items: [
        {
          title: "Data Quarantine",
          href: "/quarantine",
          iconSrc: "/icons/data_quarantine.svg",
          iconScale: 0.94,
        },
        {
          title: "Upload",
          href: "/upload",
          iconSrc: "/icons/upload-sidebar.svg",
          iconScale: 0.94,
        },
        {
          title: "Ingestion History",
          href: "/data-link/ingestion-history",
          iconSrc: "/icons/activitylog-icon.svg",
          iconScale: 0.94,
        },
      ],
    },
    {
      title: "CATALOG",
      items: [
        {
          title: "Well Data",
          href: "/catalog",
          iconSrc: "/icons/catalog.svg",
          iconScale: 0.94,
        },
        {
          title: "Map Data",
          href: "/catalog?tab=map",
          iconSrc: "/icons/map-sidebar.svg",
          iconScale: 0.94,
        },
      ],
    },
  ]

  if (role === "Reviewer") {
    return [
      ...baseSections,
      {
        title: "REVIEW DATA",
        items: [
          {
            title: "Pending Reviews",
            href: "/admin/review/pending",
            icon: "bi-clipboard-check",
            badge: "1",
            badgeColor: "bg-red-500",
          },
        ],
      },
      {
        title: "USER MANAGEMENT",
        items: [
          {
            title: "My Profile",
            href: "/profile",
            icon: "bi-person",
          },
        ],
      },
    ]
  }

  if (role === "Admin") {
    return [
      ...baseSections,
      {
        title: "USER MANAGEMENT",
        items: [
          {
            title: "Users",
            href: "/admin/users",
            iconSrc: "/icons/user-management.svg",
          },
          {
            title: "Role Management",
            href: "/admin/roles",
            iconSrc: "/icons/rolemanagement-icon.svg",
          },
          {
            title: "Activity Log",
            href: "/admin/activity",
            iconSrc: "/icons/activitylog-icon.svg",
          },
        ],
      },
      {
        title: "DATA MANAGEMENT",
        items: [
          {
            title: "Data Quality",
            href: "/admin/data-quality",
            iconSrc: "/icons/dataquality-icon.svg",
          },
          {
            title: "Change Approvals",
            href: "/admin/change-approvals",
            icon: "bi-check-circle",
          },
          {
            title: "Ingestion Rules",
            href: "/admin/ingestion",
            iconSrc: "/icons/ingestionrules-icon.svg",
          },
          {
            title: "Source Data",
            href: "/admin/tagging/source",
            iconSrc: "/icons/datasource-icon.svg",
          },
          {
            title: "Discipline",
            href: "/admin/tagging/discipline",
            iconSrc: "/icons/discipline-icon.svg",
          },
          {
            title: "Shapefile",
            href: "/admin/tagging/shapefiles",
            iconSrc: "/icons/shapefiles-icon.svg",
          },
        ],
      },
    ]
  } else {
    // Viewer and Geologist roles
    return [
      ...baseSections,
      {
        title: "USER MANAGEMENT",
        items: [
          {
            title: "My Profile",
            href: "/profile",
            icon: "bi-person",
          },
        ],
      },
    ]
  }
}

interface SidebarProps {
  isOpen?: boolean
  onCollapseChange?: (isCollapsed: boolean) => void
}

export function Sidebar({ isOpen = true, onCollapseChange }: SidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { currentRole } = useRole()
  const sidebarSections = getSidebarSections(currentRole)
  const isGEB = pathname.startsWith("/geb")
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [rankOpen, setRankOpen] = useState(true)
  const [showCollapsedRankMenu, setShowCollapsedRankMenu] = useState(false)
  const [collapsedRankTop, setCollapsedRankTop] = useState<number | null>(null)

  // Keep collapse state aligned with GEB vs non-GEB when navigating between routes
  // GEB: open by default; others: collapsed by default
  React.useEffect(() => {
    const next = true
    setIsCollapsed(next)
    onCollapseChange?.(next)
    // close floating menu on route change
    setShowCollapsedRankMenu(false)
  }, [isGEB, onCollapseChange])

  // close floating menu when clicking outside
  React.useEffect(() => {
    if (!showCollapsedRankMenu) return
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest?.('#collapsed-rank-trigger') && !target.closest?.('#collapsed-rank-menu')) {
        setShowCollapsedRankMenu(false)
      }
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [showCollapsedRankMenu])

  const handleCollapseToggle = () => {
    const newCollapsedState = !isCollapsed
    setIsCollapsed(newCollapsedState)
    onCollapseChange?.(newCollapsedState)
  }

  return (
    <>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css" />
      <TooltipProvider delayDuration={0}>
        <aside
          className={cn(
            "fixed left-0 top-0 z-50 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
            isCollapsed ? "w-16" : "w-64",
          )}
        >
          <div className="flex flex-col h-full">
            <div className="px-3 py-4 border-b border-sidebar-border flex items-center justify-center w-full relative">
              {!isCollapsed && (
                <h1 className="text-sidebar-foreground font-semibold text-lg tracking-wide absolute left-3">{isGEB ? "SEEK-GEB" : "SEEK"}</h1>
              )}
              <button onClick={handleCollapseToggle} className="text-sidebar-foreground/60 hover:text-sidebar-foreground p-1 rounded">
                <i className={cn("bi text-sm", isCollapsed ? "bi-chevron-right" : "bi-chevron-left")} />
              </button>
            </div>

            <nav className="flex-1 py-4 overflow-y-auto custom-scrollbar">
              {isGEB ? (
                <div className="space-y-6">
                  {/* RANKING section */}
                  <div>
                    {!isCollapsed && (
                      <h3 className="px-6 mb-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">RANKING</h3>
                    )}
                    <div className="px-2 space-y-2">
                      {/* Home (back to main site) */}
                      <Link
                        href="/"
                        className={cn(
                          "flex items-center rounded-lg transition-all duration-200 text-sm relative group",
                          isCollapsed ? "size-9 justify-center p-0 mx-auto" : "gap-2.5 px-2.5 py-2",
                          pathname === "/" ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg" : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                        )}
                        title={isCollapsed ? "Home" : undefined}
                      >
                        {isCollapsed ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <i className="bi bi-house text-base" />
                            </TooltipTrigger>
                            <TooltipContent side="right" align="center">Home</TooltipContent>
                          </Tooltip>
                        ) : (
                          <>
                            <i className="bi bi-house text-base" />
                            <span className="font-medium">Home</span>
                          </>
                        )}
                      </Link>

                      {/* Ranking group */}
                      {isCollapsed ? (
                        <div>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                id="collapsed-rank-trigger"
                                type="button"
                                onClick={(e) => {
                                  const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect()
                                  setCollapsedRankTop(rect.top + rect.height / 2)
                                  setShowCollapsedRankMenu((v) => !v)
                                }}
                                className="flex items-center size-9 justify-center p-0 mx-auto rounded-lg transition-all duration-200 text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                              >
                                <i className="bi bi-bar-chart-line text-base" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="right" align="center">Ranking</TooltipContent>
                          </Tooltip>
                          {showCollapsedRankMenu && (
                            <div
                              id="collapsed-rank-menu"
                              className="fixed left-16 -translate-y-1/2 bg-popover text-popover-foreground shadow-lg rounded-md py-2 w-56 border border-border z-[200]"
                              style={{ top: collapsedRankTop ?? 80 }}
                            >
                              <div className="px-3 pb-2 text-xs font-semibold text-muted-foreground">Ranking</div>
                              {[
                                { label: "Geological", href: "/geb/ranking/subsurface" },
                                { label: "Above Ground", href: "/geb/ranking/above-ground" },
                                { label: "Combined Ranking", href: "/geb/ranking/combined" },
                                { label: "Resource Density", href: "/geb/ranking/resources-density" },
                                { label: "Frontier Basin", href: "/geb/ranking/frontier-basin" },
                              ].map((it) => (
                                <Link
                                  key={it.href}
                                  href={it.href}
                                  className={cn(
                                    "block px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                                    pathname === it.href && "bg-accent text-accent-foreground"
                                  )}
                                  onClick={() => setShowCollapsedRankMenu(false)}
                                >
                                  {it.label}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setRankOpen((v) => !v)}
                          className="w-full text-left flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-200 text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                        >
                          <i className="bi bi-bar-chart-line text-base" />
                          <span className="font-medium flex-1">Ranking</span>
                          <i className={cn("bi text-xs", rankOpen ? "bi-chevron-up" : "bi-chevron-down")} />
                        </button>
                      )}

                      {/* Ranking subitems */}
                      {!isCollapsed && rankOpen && (
                        <div className="pl-6 space-y-1">
                          {[
                            // Keep hrefs (routes) the same; only labels and order change
                            { label: "Geological", href: "/geb/ranking/subsurface" },
                            { label: "Above Ground", href: "/geb/ranking/above-ground" },
                            { label: "Combined Ranking", href: "/geb/ranking/combined" },
                            { label: "Resource Density", href: "/geb/ranking/resources-density" },
                            { label: "Frontier Basin", href: "/geb/ranking/frontier-basin" },
                          ].map((it) => (
                            <Link
                              key={it.href}
                              href={it.href}
                              className={cn(
                                "block rounded-md px-2 py-1.5 text-sm",
                                pathname === it.href ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                              )}
                            >
                              {it.label}
                            </Link>
                          ))}
                        </div>
                      )}

                      {/* Basin */}
                      <Link
                        href="/geb/basin"
                        className={cn(
                          "flex items-center rounded-lg transition-all duration-200 text-sm relative group",
                          isCollapsed ? "size-9 justify-center p-0 mx-auto" : "gap-2.5 px-2.5 py-2",
                          pathname === "/geb/basin" ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg" : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                        )}
                        title={isCollapsed ? "Basin" : undefined}
                      >
                        {isCollapsed ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <i className="bi bi-database text-base" />
                            </TooltipTrigger>
                            <TooltipContent side="right" align="center">Basin</TooltipContent>
                          </Tooltip>
                        ) : (
                          <>
                            <i className="bi bi-database text-base" />
                            <span className="font-medium">Basin</span>
                          </>
                        )}
                      </Link>
                      <Link
                        href="/geb/workspace/gde-play-fairway"
                        className={cn(
                          "flex items-center rounded-lg transition-all duration-200 text-sm relative group",
                          isCollapsed ? "size-9 justify-center p-0 mx-auto" : "gap-2.5 px-2.5 py-2",
                          pathname === "/geb/workspace/gde-play-fairway" ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg" : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                        )}
                        title={isCollapsed ? "GDE & Play Fairway" : undefined}
                      >
                        {isCollapsed ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <i className="bi bi-map text-base" />
                            </TooltipTrigger>
                            <TooltipContent side="right" align="center">GDE & Play Fairway</TooltipContent>
                          </Tooltip>
                        ) : (
                          <>
                            <i className="bi bi-map text-base" />
                            <span className="font-medium">GDE & Play Fairway</span>
                          </>
                        )}
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                // Default sidebar
                <>
                  {sidebarSections.map((section, idx) => (
                    <div key={section.title} className="mb-6">
                      {!isCollapsed && (
                        <h3 className="px-6 mb-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
                          {section.title}
                        </h3>
                      )}
                      <div className="space-y-2 px-2">
                        {section.items.map((item) => {
                          // Active state: handle routes with query params like /catalog?tab=map
                          let isActive = pathname === item.href
                          if (item.href.startsWith("/catalog")) {
                            const tab = searchParams.get("tab")
                            if (item.href === "/catalog") {
                              isActive = pathname === "/catalog" && tab !== "map"
                            } else if (item.href === "/catalog?tab=map") {
                              isActive = pathname === "/catalog" && tab === "map"
                            }
                          }

                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              prefetch={item.href.includes("?tab=map") ? false : undefined}
                              className={cn(
                                "flex items-center rounded-lg transition-all duration-200 text-sm relative group",
                                isCollapsed ? "size-9 justify-center p-0 mx-auto" : "gap-2.5 px-2.5 py-2",
                                isActive
                                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg"
                                  : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                              )}
                              title={isCollapsed ? item.title : undefined}
                            >
                              {item.iconSrc ? (
                                isCollapsed ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span
                                        aria-hidden
                                        className="h-5 w-5 inline-block"
                                        style={{
                                          backgroundColor: "currentColor",
                                          WebkitMaskImage: `url(${item.iconSrc})`,
                                          maskImage: `url(${item.iconSrc})`,
                                          WebkitMaskRepeat: "no-repeat",
                                          maskRepeat: "no-repeat",
                                          WebkitMaskSize: "contain",
                                          maskSize: "contain",
                                          WebkitMaskPosition: "center",
                                          maskPosition: "center",
                                          transform: item.iconScale ? `scale(${item.iconScale})` : undefined,
                                          opacity: 1,
                                        }}
                                      />
                                    </TooltipTrigger>
                                    <TooltipContent side="right" align="center">{item.title}</TooltipContent>
                                  </Tooltip>
                                ) : (
                                  <span
                                    aria-hidden
                                    className="h-5 w-5 inline-block"
                                    style={{
                                      backgroundColor: "currentColor",
                                      WebkitMaskImage: `url(${item.iconSrc})`,
                                      maskImage: `url(${item.iconSrc})`,
                                      WebkitMaskRepeat: "no-repeat",
                                      maskRepeat: "no-repeat",
                                      WebkitMaskSize: "contain",
                                      maskSize: "contain",
                                      WebkitMaskPosition: "center",
                                      maskPosition: "center",
                                      transform: item.iconScale ? `scale(${item.iconScale})` : undefined,
                                      opacity: 1,
                                    }}
                                  />
                                )
                              ) : (
                                isCollapsed ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <i
                                        className={cn("text-base transition-all duration-200", item.icon)}
                                        style={{
                                          fontSize: "18px",
                                          textShadow: "0 0 1px currentColor",
                                          fontWeight: "500",
                                        }}
                                      />
                                    </TooltipTrigger>
                                    <TooltipContent side="right" align="center">{item.title}</TooltipContent>
                                  </Tooltip>
                                ) : (
                                  <i
                                    className={cn("text-base transition-all duration-200", item.icon)}
                                    style={{
                                      fontSize: "18px",
                                      textShadow: "0 0 1px currentColor",
                                      fontWeight: "500",
                                    }}
                                  />
                                )
                              )}

                              {!isCollapsed && (
                                <>
                                  <span className="font-medium">{item.title}</span>
                                  {item.badge && (
                                    <span
                                      className={cn(
                                        "ml-auto px-1.5 py-0.5 text-xs font-semibold text-white rounded-full",
                                        item.badgeColor || "bg-teal-500",
                                      )}
                                    >
                                      {item.badge}
                                    </span>
                                  )}
                                </>
                              )}

                              {isCollapsed && null}
                            </Link>
                          )
                        })}
                      </div>

                      {/* Collapsed sidebar section divider */}
                      {isCollapsed && idx < sidebarSections.length - 1 && (
                        <div className="my-3 flex items-center justify-center">
                          <div className="h-[2px] w-8 bg-sidebar-border rounded-full" />
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}
            </nav>
          </div>
        </aside>
      </TooltipProvider>
    </>
  )
}
