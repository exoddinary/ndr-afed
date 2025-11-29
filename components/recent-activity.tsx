"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Database, Settings, ArrowRight, Clock, AlertTriangle, Send, ChevronRight, X } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { activities } from "@/lib/notifications"


const managementCards = [
  {
    title: "Quarantine Data",
    description: "Monitor data processing pipelines and view detailed logs",
    icon: Database,
    iconColor: "text-red-400",
    buttonText: "View Status",
  },
  {
    title: "Processing Data",
    description: "Monitor data processing pipelines and view detailed logs",
    icon: Settings,
    iconColor: "text-teal-400",
    buttonText: "View Status",
  },
]

export function RecentActivity() {
  const [expandedActivity, setExpandedActivity] = useState<number | null>(null)
  const router = useRouter()

  const getStatusPillStyle = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-600 text-white border-transparent dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30"
      case "processing":
        return "bg-blue-600 text-white border-transparent dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30"
      case "flagged":
        return "bg-yellow-600 text-white border-transparent dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-500/30"
      default:
        return "bg-muted text-white border-transparent dark:bg-slate-500/20 dark:text-slate-400 dark:border-slate-500/30"
    }
  }

  const toggleActivityDetail = (index: number) => {
    setExpandedActivity(expandedActivity === index ? null : index)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <section>
        <h2 className="text-2xl font-semibold text-foreground mb-6">Recent activity</h2>
        <Card className="bg-card border border-border rounded-xl shadow-sm text-card-foreground p-4">
          <div className="space-y-3">
            {activities.map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                <div className="flex flex-col">
                  <span className="text-foreground font-medium text-sm">{activity.title}</span>
                  <span className="text-muted-foreground text-xs">by {activity.author}</span>
                </div>
                <span className="text-muted-foreground text-xs">{activity.time}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-foreground mb-6">Manage your data</h2>
        <div className="space-y-4">
          {managementCards.map((card, index) => {
            const IconComponent = card.icon
            return (
              <Card key={index} className="bg-card border border-border p-6 rounded-xl shadow-sm text-card-foreground">
                <div className="flex items-start gap-4 mb-4">
                  <div className={`p-2 rounded-lg bg-muted ${card.iconColor}`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-2">{card.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{card.description}</p>
                  </div>
                </div>
                <Button
                  className="w-full justify-between bg-primary hover:bg-primary/90 text-primary-foreground border-0"
                  onClick={() => {
                    if (card.title === "Quarantine Data") {
                      router.push("/quarantine")
                    }
                  }}
                >
                  {card.buttonText}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Card>
            )
          })}
        </div>
      </section>
    </div>
  )
}
