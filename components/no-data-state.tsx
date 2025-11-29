import { Card } from "@/components/ui/card"

interface NoDataStateProps {
  title: string
  description?: string
  icon?: string
  className?: string
}

export function NoDataState({ 
  title, 
  description, 
  icon = "bi-database-slash",
  className = "" 
}: NoDataStateProps) {
  return (
    <Card className={`bg-card border border-border rounded-xl shadow-sm text-card-foreground p-8 ${className}`}>
      <div className="flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
          <i className={`${icon} text-2xl text-muted-foreground`} />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-foreground">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground max-w-md">{description}</p>
          )}
        </div>
      </div>
    </Card>
  )
}
