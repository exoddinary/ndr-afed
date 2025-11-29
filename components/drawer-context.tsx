"use client"

import React, { createContext, useContext, useState } from "react"

interface DrawerContextType {
  isRightDrawerOpen: boolean
  setRightDrawerOpen: (open: boolean) => void
}

const DrawerContext = createContext<DrawerContextType | undefined>(undefined)

export function DrawerProvider({ children }: { children: React.ReactNode }) {
  const [isRightDrawerOpen, setRightDrawerOpen] = useState(false)

  return (
    <DrawerContext.Provider value={{ isRightDrawerOpen, setRightDrawerOpen }}>
      {children}
    </DrawerContext.Provider>
  )
}

export function useDrawer() {
  const context = useContext(DrawerContext)
  if (context === undefined) {
    throw new Error("useDrawer must be used within a DrawerProvider")
  }
  return context
}
