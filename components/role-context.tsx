"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

type UserRole = "Admin" | "Viewer" | "Geologist" | "Reviewer"

interface RoleContextType {
  currentRole: UserRole
  setCurrentRole: (role: UserRole) => void
}

const RoleContext = createContext<RoleContextType | undefined>(undefined)

export function RoleProvider({ children }: { children: ReactNode }) {
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    if (typeof window !== "undefined") {
      const savedRole = localStorage.getItem("currentRole") as UserRole
      return savedRole || "Admin"
    }
    return "Admin"
  })

  const handleSetCurrentRole = (role: UserRole) => {
    setCurrentRole(role)
    if (typeof window !== "undefined") {
      localStorage.setItem("currentRole", role)
    }
  }

  return (
    <RoleContext.Provider value={{ currentRole, setCurrentRole: handleSetCurrentRole }}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  const context = useContext(RoleContext)
  if (context === undefined) {
    throw new Error("useRole must be used within a RoleProvider")
  }
  return context
}
