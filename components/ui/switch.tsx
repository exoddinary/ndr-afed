"use client"

import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border shadow-xs transition-all outline-none focus-visible:ring-[3px]",
        // Track background & outline for better light-mode visibility
        "data-[state=unchecked]:bg-background data-[state=checked]:bg-primary/20",
        // Track border color themed to brand
        "border-primary/50 data-[state=checked]:border-primary",
        // Focus ring themed
        "focus-visible:border-primary focus-visible:ring-primary/40",
        // Dark mode subtlety
        "dark:data-[state=unchecked]:bg-input/80",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block size-4 rounded-full ring-0 transition-transform",
          // Thumb position
          "data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0",
          // Light mode thumb colors: OFF = brand, ON = background (white)
          "data-[state=unchecked]:bg-primary data-[state=checked]:bg-background",
          // Dark mode overrides remain as-is
          "dark:data-[state=unchecked]:bg-foreground dark:data-[state=checked]:bg-primary-foreground",
          // Add an outline to the thumb in brand color
          "border border-primary"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
