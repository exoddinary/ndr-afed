"use client"

import { AlertTriangle, XCircle, ZoomIn, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ConflictPanel() {
  const conflicts = [
    { id: 1, type: 'error', well: 'Well K-1', message: 'logged shale but polygon = sand-rich shoreface' },
    { id: 2, type: 'error', well: 'Well M-4', message: 'benthic forams = outer shelf' },
    { id: 3, type: 'warning', well: 'Well P-2', message: 'thickness 180 m vs isopach 420 m' },
  ]

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="h-8 flex items-center px-3 border-b border-gray-200 bg-gray-50 justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Conflict & QC Log</span>
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-900/50 text-[10px] font-bold text-red-400">3</span>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-0">
        <table className="w-full text-left text-xs font-mono border-collapse">
          <tbody>
            {conflicts.map((conflict) => (
              <tr key={conflict.id} className="border-b border-gray-200 hover:bg-gray-50 group">
                <td className="py-2 pl-3 w-8">
                  {conflict.type === 'error' ? (
                    <XCircle className="w-3.5 h-3.5 text-red-500" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  )}
                </td>
                <td className="py-2 px-2 font-bold text-slate-700 w-24 whitespace-nowrap">
                  {conflict.well}
                </td>
                <td className="py-2 px-2 text-slate-600">
                  {conflict.message}
                </td>
                <td className="py-2 pr-3 text-right opacity-0 group-hover:opacity-100 transition-opacity w-32">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-gray-100 text-slate-500 hover:text-teal-600" title="Resolve">
                      <Check className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-gray-100 text-slate-500 hover:text-slate-700" title="Ignore">
                      <X className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-gray-100 text-slate-500 hover:text-blue-600" title="Zoom to">
                      <ZoomIn className="w-3 h-3" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
