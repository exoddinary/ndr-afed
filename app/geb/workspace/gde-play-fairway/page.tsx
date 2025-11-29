import { GDEWorkspace } from "@/components/geb/workspace/gde-workspace"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home } from "lucide-react"

export default function GDEPlayFairwayPage() {
  return (
    <div className="h-screen w-full overflow-hidden bg-gray-50 text-slate-900 relative">
      {/* Back to Home Button */}
      <div className="absolute top-4 left-4 z-50">
        <Link href="/">
          <Button variant="outline" size="sm" className="bg-white/90 backdrop-blur shadow-sm hover:bg-white border-slate-200 text-slate-700">
            <Home className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>
      </div>
      
      <GDEWorkspace />
    </div>
  )
}
