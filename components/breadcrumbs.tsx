"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"

interface BreadcrumbItem {
  label: string
  href?: string
}

const routeLabels: Record<string, string> = {
  admin: "Admin",
  users: "User Management",
  roles: "Role Management",
  "data-quality": "Data Quality Threshold",
  ingestion: "Configure Ingestion Rule",
  tagging: "Tagging",
  catalog: "Data Catalog",
  quarantine: "Data Quarantine",
  upload: "Upload",
}

export function Breadcrumbs() {
  const pathname = usePathname()
  const pathSegments = pathname.split("/").filter(Boolean)

  // Don't show breadcrumbs on root/dashboard page only
  if (pathSegments.length === 0) {
    return null
  }

  const breadcrumbItems: BreadcrumbItem[] = []

  // Add home/dashboard
  breadcrumbItems.push({
    label: "Home",
    href: "/",
  })

  // Build breadcrumb items from path segments
  let currentPath = ""
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`
    const isLast = index === pathSegments.length - 1

    breadcrumbItems.push({
      label: routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
      href: isLast ? undefined : currentPath,
    })
  })

  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
      <Home className="h-4 w-4" />
      {breadcrumbItems.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          {index > 0 && <ChevronRight className="h-4 w-4" />}
          {item.href ? (
            <Link href={item.href} className="hover:text-foreground transition-colors duration-200">
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  )
}
