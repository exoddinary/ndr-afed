import { Card } from "@/components/ui/card"

export function StatsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      <Card className="bg-card border border-border p-6 text-center rounded-xl shadow-sm text-card-foreground">
        <div className="text-3xl font-bold text-primary mb-2">127</div>
        <div className="text-muted-foreground font-medium">Total Datasets</div>
      </Card>
      <Card className="bg-card border border-border p-6 text-center rounded-xl shadow-sm text-card-foreground">
        <div className="text-3xl font-bold text-primary mb-2">3</div>
        <div className="text-muted-foreground font-medium">Processing Queues</div>
      </Card>
    </div>
  )
}
