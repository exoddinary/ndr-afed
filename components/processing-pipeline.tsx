import { Card } from "@/components/ui/card"
import { Upload, RefreshCw, CheckCircle, Database, BarChart3, CheckCircle2 } from "lucide-react"

const pipelineSteps = [
  {
    title: "File Upload",
    description: "Secure transfer of shapefile components to processing servers",
    icon: Upload,
    iconColor: "text-blue-400",
  },
  {
    title: "Format Conversion",
    description: "Convert shapefiles to GeoJSON format for web compatibility",
    icon: RefreshCw,
    iconColor: "text-teal-400",
  },
  {
    title: "Validation",
    description: "Verify file integrity and required shapefile components (.shp, .dbf, .shx, .prj)",
    icon: CheckCircle,
    iconColor: "text-blue-400",
  },
  {
    title: "Catalog Integration",
    description: "Store in PostGIS database and add metadata to searchable catalog",
    icon: Database,
    iconColor: "text-teal-400",
  },
  {
    title: "Geometry Processing",
    description: "Analyze spatial data, extract geometry types and coordinate systems",
    icon: BarChart3,
    iconColor: "text-blue-400",
  },
  {
    title: "Ready for Analysis",
    description: "Data is now available for spatial analysis and visualization",
    icon: CheckCircle2,
    iconColor: "text-green-400",
  },
]

export function ProcessingPipeline() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Processing Pipeline Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {pipelineSteps.map((step, index) => {
          const IconComponent = step.icon
          return (
            <Card key={step.title} className="bg-slate-800/50 border-slate-700 p-6">
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg bg-slate-700/50 ${step.iconColor}`}>
                  <IconComponent className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{step.description}</p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
