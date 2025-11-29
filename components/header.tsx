"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown, Shield, Eye, Microscope, ClipboardCheck, Bell, Check } from "lucide-react"
import { activities as allActivities, Activity } from "@/lib/notifications"
import React from "react"
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"
import Image from "next/image"
import { useRole } from "./role-context"

interface HeaderProps {
  showNavigation?: boolean
  titleOverride?: string
}

export function Header({ showNavigation = false, titleOverride }: HeaderProps) {
  const { currentRole, setCurrentRole } = useRole()
  const [notifications, setNotifications] = React.useState<Activity[]>(allActivities)

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })))
  }

  const roleIcons = {
    Admin: Shield,
    Viewer: Eye,
    Geologist: Microscope,
    Reviewer: ClipboardCheck,
  }

  const RoleIcon = roleIcons[currentRole]

  
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-teal-600 dark:bg-slate-900/95 text-white dark:text-inherit backdrop-blur supports-[backdrop-filter]:bg-teal-600/95 dark:supports-[backdrop-filter]:bg-slate-900/60">
      <div className="w-full px-6 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image 
              src="/seek-logo.png" 
              alt="SEEK Logo" 
              width={32} 
              height={32}
              className="w-8 h-8"
            />
            <span className="text-white font-semibold text-xl font-inter tracking-wide">{titleOverride ?? "SEEK"}</span>
          </Link>

          {/* Navigation hidden as requested */}

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative flex items-center justify-center w-9 h-9 rounded-full text-white/90 dark:text-slate-300 hover:text-white hover:bg-teal-700/40 dark:hover:bg-slate-800"
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-[26rem] p-0 bg-card border-border rounded-xl shadow-lg text-card-foreground"
              >
                <div className="px-4 py-3 flex items-center justify-between border-b border-border">
                  <h4 className="text-base font-semibold">Notifications</h4>
                  <Button variant="link" className="text-sm text-teal-500 hover:text-teal-400 p-0 h-auto" onClick={markAllAsRead}>
                    <Check className="h-4 w-4 mr-1" />
                    Mark all as read
                  </Button>
                </div>
                <div className="max-h-96 overflow-y-auto p-2">
                  <div className="space-y-2">
                    {notifications.slice(0, 10).map((n, i) => {
                      const Icon = n.icon
                      return (
                        <div
                          key={i}
                          className="p-3 rounded-lg flex items-start gap-3 transition-colors cursor-pointer hover:bg-teal-500/10 dark:hover:bg-teal-500/15"
                        >
                          <div
                            className={`mt-1 w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center ${n.iconColor.replace("text-", "bg-")}/10`}
                          >
                            <Icon className={`h-4 w-4 ${n.iconColor}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold text-foreground">{n.title}</p>
                              <p className="text-xs text-muted-foreground">{n.time}</p>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              The submission by <span className="font-medium text-foreground/80">{n.author}</span> has been updated.
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 text-white/90 dark:text-slate-300 hover:text-white hover:bg-teal-700/40 dark:hover:bg-slate-800"
                >
                  <RoleIcon className="h-4 w-4" />
                  <span className="text-sm">{currentRole}</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                <DropdownMenuItem
                  onClick={() => setCurrentRole("Admin")}
                  className="text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700 cursor-pointer"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Admin
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setCurrentRole("Viewer")}
                  className="text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700 cursor-pointer"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Viewer
                </DropdownMenuItem>
                {/** Geologist role removed from admin console selector */}
                <DropdownMenuItem
                  onClick={() => setCurrentRole("Reviewer")}
                  className="text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700 cursor-pointer"
                >
                  <ClipboardCheck className="h-4 w-4 mr-2" />
                  Reviewer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              className="flex items-center gap-2 text-white/90 dark:text-slate-300 hover:text-white hover:bg-teal-700/40 dark:hover:bg-slate-800"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder-user.png" alt="Azli" />
                <AvatarFallback className="bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300">AZ</AvatarFallback>
              </Avatar>
              <span className="font-medium">Azli</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
