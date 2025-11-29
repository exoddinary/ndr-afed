"use client"

import { useEffect } from "react"
import { X, CheckCircle } from "lucide-react"
import { Card } from "@/components/ui/card"

interface Toast {
  id: string
  message: string
  type: "success" | "error" | "info"
}

interface ToastNotificationProps {
  toasts: Toast[]
  onRemoveToast: (id: string) => void
}

export function ToastNotification({ toasts, onRemoveToast }: ToastNotificationProps) {
  useEffect(() => {
    toasts.forEach((toast) => {
      const timer = setTimeout(() => {
        onRemoveToast(toast.id)
      }, 4000) // Auto-remove after 4 seconds

      return () => clearTimeout(timer)
    })
  }, [toasts, onRemoveToast])

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Card
          key={toast.id}
          className="bg-slate-800 border-slate-700 p-4 min-w-[300px] shadow-lg animate-in slide-in-from-right-full"
        >
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-teal-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-white text-sm font-medium">{toast.message}</p>
            </div>
            <button
              onClick={() => onRemoveToast(toast.id)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </Card>
      ))}
    </div>
  )
}
