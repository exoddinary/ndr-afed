import { Badge } from "@/components/ui/badge"
import { UserPlus, Database, Bot } from "lucide-react"

export function HeroSection() {
  // Feature flag: hide the entire hero section
  const showHero = false

  if (!showHero) return null

  const processSteps = [
    {
      icon: Database,
      title: "Ingest Data",
      description: "Bring your data and create your first map",
      status: "pending"
    },
    {
      icon: Bot,
      title: "Ask SEEK AI about Wells",
      description: "Use natural language to query well data, metadata, locations, and status — get instant answers.",
      status: "pending"
    }
  ]

  return (
    <div className="mb-8">
      <h1 className="text-2xl font-semibold text-foreground mb-2">Welcome to SEEK AI</h1>
      <p className="text-muted-foreground mb-8">
        Get started by creating stunning maps and bringing your spatial data to life! Enrich your analysis with our Data Observatory, build powerful apps, and more — you'll be soon turning your location data into powerful insights.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {processSteps.map((step, index) => {
          const IconComponent = step.icon
          return (
            <div key={index} className="border-2 border-dashed border-border rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg border-2 border-dashed border-primary/30">
                  <IconComponent className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-sm font-semibold text-foreground">{step.title}</h3>
                    {step.status === "active" && (
                      <Badge variant="outline" className="text-xs border-dashed border-primary/50 text-primary bg-transparent">
                        Active
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
