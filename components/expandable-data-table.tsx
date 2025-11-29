"use client"

import React, { useState } from "react"
import { ChevronDown, ChevronRight, Search, MoreHorizontal, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type DepthValues = {
  mMDDF?: number | string
  mTVDSS?: number | string
  ftMDDF?: number | string
  ftTVDSS?: number | string
}

interface DataProperty {
  id: string
  name: string
  uploadedValue: string | DepthValues
  comparedValue: string | DepthValues
  comparedDate?: string
  action: "append" | "overwrite" | "skip" | "delete"
  flag: "exact" | "near match" | "AI match" | "rule based"
  status: "approve" | "pending" | "reject" | "none"
  source?: "IHS" | "Rystad"
}

interface DataRow {
  id: number
  fileName: string
  uwi: string
  isExpanded: boolean
  isSelected: boolean
  properties: DataProperty[]
}

const mockData: DataRow[] = [
  {
    id: 1,
    fileName: "GDE Line 2_.xlsx",
    uwi: "Semangkok-A2",
    isExpanded: false,
    isSelected: false,
    properties: [
      {
        id: "1",
        name: "Top Depth",
        uploadedValue: { mMDDF: 1200, mTVDSS: -1125, ftMDDF: 3937, ftTVDSS: -3691 },
        comparedValue: { mMDDF: 1185, mTVDSS: -1100, ftMDDF: 3890, ftTVDSS: -3600 },
        comparedDate: "2024-01-10",
        action: "append",
        flag: "near match",
        status: "approve",
        source: "IHS",
      },
      {
        id: "2",
        name: "Bottom Depth",
        uploadedValue: "4,200 m",
        comparedValue: "4,185 m",
        comparedDate: "2024-01-09",
        action: "append",
        flag: "AI match",
        status: "pending",
        source: "Rystad",
      },
      {
        id: "3",
        name: "Top Depth",
        uploadedValue: "1,550 m",
        comparedValue: "1,500 m",
        comparedDate: "2024-01-08",
        action: "append",
        flag: "rule based",
        status: "reject",
        source: "IHS",
      },
      {
        id: "4",
        name: "Porosity",
        uploadedValue: "18%",
        comparedValue: "17%",
        comparedDate: "2024-01-06",
        action: "append",
        flag: "rule based",
        status: "approve",
        source: "Rystad",
      },
      {
        id: "5",
        name: "Coordinate",
        uploadedValue: "Lat 2.345, Lon 112.567",
        comparedValue: "Lat 2.346, Lon 112.568",
        comparedDate: "2024-01-05",
        action: "append",
        flag: "exact",
        status: "approve",
        source: "IHS",
      },
      {
        id: "6",
        name: "Lithology",
        uploadedValue: "Sandstone",
        comparedValue: "Silty Sandstone",
        comparedDate: "2024-01-04",
        action: "append",
        flag: "near match",
        status: "none",
        source: "IHS",
      },
    ],
  },
  {
    id: 2,
    fileName: "GDE Line 2_.xlsx",
    uwi: "Semangkok-A2",
    isExpanded: false,
    isSelected: false,
    properties: [
      {
        id: "7",
        name: "Water Depth",
        uploadedValue: "3,180 m",
        comparedValue: "3,150 m",
        comparedDate: "2024-01-10",
        action: "overwrite",
        flag: "AI match",
        status: "none",
        source: "Rystad",
      },
    ],
  },
  {
    id: 3,
    fileName: "GDE Line 2_.xlsx",
    uwi: "Semangkok-A2",
    isExpanded: false,
    isSelected: false,
    properties: [
      {
        id: "8",
        name: "Water Depth",
        uploadedValue: "3,170 m",
        comparedValue: "3,150 m",
        comparedDate: "2024-01-07",
        action: "skip",
        flag: "AI match",
        status: "none",
        source: "IHS",
      },
    ],
  },
  {
    id: 4,
    fileName: "GDE Line 2_.xlsx",
    uwi: "Semangkok-A2",
    isExpanded: false,
    isSelected: false,
    properties: [
      {
        id: "9",
        name: "Coordinate",
        uploadedValue: "Lat 2.345, Lon 112.567",
        comparedValue: "Lat 2.346, Lon 112.568",
        comparedDate: "2024-01-05",
        action: "delete",
        flag: "near match",
        status: "none",
        source: "Rystad",
      },
    ],
  },
  {
    id: 5,
    fileName: "GDE Line 2_.xlsx",
    uwi: "Semangkok-A2",
    isExpanded: false,
    isSelected: false,
    properties: [
      {
        id: "10",
        name: "Bottom Depth",
        uploadedValue: "4,250 m",
        comparedValue: "4,185 m",
        comparedDate: "2024-01-09",
        action: "append",
        flag: "rule based",
        status: "none",
        source: "IHS",
      },
    ],
  },
]

export function ExpandableDataTable() {
  // Simple token formatter for toasts like: "Replacements completed: {overwrite} overwrite, {delete} delete"
  const formatWithTokens = (template: string, tokens: Record<string, string | number>) => {
    return template.replace(/\{(\w+)\}/g, (_, key) => String(tokens[key] ?? `{${key}}`))
  }
  // Expand all rows by default on initial render
  const [data, setData] = useState<DataRow[]>(() => mockData.map((r) => ({ ...r, isExpanded: true })))
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAll, setSelectedAll] = useState(false)
  const [prevActions, setPrevActions] = useState<Record<string, DataProperty["action"] | undefined>>({})
  // Track per-subrow actions for structured Top Depth keys so actions apply one-by-one
  const [subActions, setSubActions] = useState<Record<string, "overwrite" | "delete" | undefined>>({})
  
  // Format date from YYYY-MM-DD to D MMM YYYY
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }).format(date)
    } catch (e) {
      return dateString
    }
  }

  // Aggregate remaining actions across all rows to determine if "Confirm Action" can be enabled
  // Compute inline here so this block does not depend on functions declared later (avoids TDZ issues)
  const totalRemainingActions = React.useMemo(() => {
    // local helper to avoid referencing isDepthValues before it's declared
    const isDepth = (val: any) =>
      val && typeof val === "object" && ("mMDDF" in val || "mTVDSS" in val || "ftMDDF" in val || "ftTVDSS" in val)

    const removedNames = new Set(["Bottom Depth", "Top Depth", "Porosity", "Coordinate", "Lithology"])
    let pending = 0
    for (const row of data) {
      for (const p of row.properties) {
        const structured = isDepth((p as any).uploadedValue) || isDepth((p as any).comparedValue)

        if (removedNames.has(p.name)) {
          if (p.name === "Top Depth" && structured) {
            const keys: (keyof DepthValues)[] = ["mMDDF", "mTVDSS", "ftMDDF", "ftTVDSS"]
            for (const k of keys) {
              const key = `${row.id}-${p.id}-${String(k)}`
              const acted = subActions[key] === "overwrite" || subActions[key] === "delete"
              if (!acted) pending += 1
            }
          }
          continue
        }

        if (structured) {
          const keys: (keyof DepthValues)[] = ["mMDDF", "mTVDSS", "ftMDDF", "ftTVDSS"]
          for (const k of keys) {
            const key = `${row.id}-${p.id}-${String(k)}`
            const acted = subActions[key] === "overwrite" || subActions[key] === "delete"
            if (!acted) pending += 1
          }
        } else {
          const acted = p.action === "overwrite" || p.action === "delete"
          if (!acted) pending += 1
        }
      }
    }
    return pending
  }, [data, subActions])

  // Count how many actions are selected (delete/overwrite) to decide enablement without referencing below declarations
  const selectedActionCount = React.useMemo(() => {
    let count = 0
    for (const row of data) {
      for (const p of row.properties) {
        if (p.action === 'delete' || p.action === 'overwrite') count += 1
      }
    }
    // include sub-row actions
    Object.values(subActions).forEach((act) => {
      if (act === 'delete' || act === 'overwrite') count += 1
    })
    return count
  }, [data, subActions])

  const canConfirm = totalRemainingActions === 0 && selectedActionCount > 0

  // Modal + Toast state
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [showToast, setShowToast] = useState<string | null>(null)

  // Count selected actions for confirmation summary (delete & overwrite)
  const actionSummary = React.useMemo(() => {
    let deleteCount = 0
    let overwriteCount = 0
    // Count property-level actions
    for (const row of data) {
      for (const p of row.properties) {
        if (p.action === 'delete') deleteCount += 1
        if (p.action === 'overwrite') overwriteCount += 1
      }
    }
    // Count sub-row actions (Top Depth structured keys)
    Object.values(subActions).forEach((act) => {
      if (act === 'delete') deleteCount += 1
      if (act === 'overwrite') overwriteCount += 1
    })
    return { deleteCount, overwriteCount }
  }, [data, subActions])

  const handleConfirmActions = () => {
    // Simulate applying actions...
    setConfirmOpen(false)
    setShowToast(
      formatWithTokens(
        "Replacements completed: {overwrite} overwrite, {delete} delete",
        { overwrite: actionSummary.overwriteCount, delete: actionSummary.deleteCount },
      ),
    )
    // Auto hide toast
    setTimeout(() => setShowToast(null), 3000)
  }

  const toggleRowExpansion = (id: number) => {
    setData((prev) => prev.map((row) => (row.id === id ? { ...row, isExpanded: !row.isExpanded } : row)))
  }

  // Editable uploaded value updaters
  const updateUploadedValue = (rowId: number, propertyId: string, newVal: string) => {
    setData((prev) =>
      prev.map((row) =>
        row.id === rowId
          ? {
              ...row,
              properties: row.properties.map((p) =>
                p.id === propertyId ? { ...p, uploadedValue: newVal } : p,
              ),
            }
          : row,
      ),
    )
  }

  const updateUploadedDepthValue = (
    rowId: number,
    propertyId: string,
    key: keyof DepthValues,
    newVal: string,
  ) => {
    setData((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row
        return {
          ...row,
          properties: row.properties.map((p) => {
            if (p.id !== propertyId) return p
            const curr = (isDepthValues(p.uploadedValue) ? p.uploadedValue : {}) as DepthValues
            return {
              ...p,
              uploadedValue: {
                ...curr,
                [key]: newVal,
              },
            }
          }),
        }
      }),
    )
  }

  const isDepthValues = (val: any): val is DepthValues =>
    val && typeof val === "object" && ("mMDDF" in val || "mTVDSS" in val || "ftMDDF" in val || "ftTVDSS" in val)

  const toggleRowSelection = (id: number) => {
    setData((prev) => prev.map((row) => (row.id === id ? { ...row, isSelected: !row.isSelected } : row)))
  }

  const toggleSelectAll = () => {
    const newSelectedAll = !selectedAll
    setSelectedAll(newSelectedAll)
    setData((prev) => prev.map((row) => ({ ...row, isSelected: newSelectedAll })))
  }

  // Helpers for Top Depth sub-rows (mMDDF, mTVDSS, ftMDDF, ftTVDSS)
  const subKey = (rowId: number, propertyId: string, k: keyof DepthValues) => `${rowId}-${propertyId}-${String(k)}`
  const setSubAction = (rowId: number, propertyId: string, k: keyof DepthValues, action: "overwrite" | "delete") => {
    setSubActions((m) => ({ ...m, [subKey(rowId, propertyId, k)]: action }))
  }
  const undoSubAction = (rowId: number, propertyId: string, k: keyof DepthValues) => {
    setSubActions((m) => {
      const clone = { ...m }
      delete clone[subKey(rowId, propertyId, k)]
      return clone
    })
  }

  // Count pending actions for items we actually render in the expanded section so the badge matches UI.
  // - Skip removedNames entirely, EXCEPT "Top Depth" when structured (we render its keys as sub-rows).
  // - For structured values we count per key (mMDDF, mTVDSS, ftMDDF, ftTVDSS).
  // - For normal properties, count 1 if action is not overwrite/delete.
  const getNeededCount = (row: DataRow) => {
    const removedNames = new Set(["Bottom Depth", "Top Depth", "Porosity", "Coordinate", "Lithology"])
    let pending = 0
    for (const p of row.properties) {
      const structured = isDepthValues(p.uploadedValue) || isDepthValues(p.comparedValue)
      if (removedNames.has(p.name)) {
        if (p.name === "Top Depth" && structured) {
          const keys: (keyof DepthValues)[] = ["mMDDF", "mTVDSS", "ftMDDF", "ftTVDSS"]
          for (const k of keys) {
            const key = subKey(row.id, p.id, k)
            const acted = subActions[key] === "overwrite" || subActions[key] === "delete"
            if (!acted) pending += 1
          }
        }
        continue
      }

      if (structured) {
        const keys: (keyof DepthValues)[] = ["mMDDF", "mTVDSS", "ftMDDF", "ftTVDSS"]
        for (const k of keys) {
          const key = subKey(row.id, p.id, k)
          const acted = subActions[key] === "overwrite" || subActions[key] === "delete"
          if (!acted) pending += 1
        }
      } else {
        const acted = p.action === "overwrite" || p.action === "delete"
        if (!acted) pending += 1
      }
    }
    return pending
  }

  const updatePropertyAction = (rowId: number, propertyId: string, newAction: string) => {
    // store previous action for undo
    setPrevActions((m) => {
      const key = `${rowId}-${propertyId}`
      // find current action
      const row = data.find((r) => r.id === rowId)
      const prop = row?.properties.find((p) => p.id === propertyId)
      const current = prop?.action
      return { ...m, [key]: current }
    })

    setData((prev) =>
      prev.map((row) =>
        row.id === rowId
          ? {
              ...row,
              properties: row.properties.map((prop) =>
                prop.id === propertyId ? { ...prop, action: newAction as any } : prop,
              ),
            }
          : row,
      ),
    )
  }

  const undoPropertyAction = (rowId: number, propertyId: string) => {
    const key = `${rowId}-${propertyId}`
    const previous = prevActions[key]
    setData((prev) =>
      prev.map((row) =>
        row.id === rowId
          ? {
              ...row,
              properties: row.properties.map((prop) =>
                prop.id === propertyId ? { ...prop, action: (previous as any) } : prop,
              ),
            }
          : row,
      ),
    )
    setPrevActions((m) => {
      const clone = { ...m }
      delete clone[key]
      return clone
    })
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "approve":
        return "default"
      case "pending":
        return "secondary"
      case "reject":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getFlagBadgeVariant = (flag: string) => {
    switch (flag) {
      case "exact":
        return "default"
      case "near match":
        return "secondary"
      case "AI match":
        return "outline"
      case "rule based":
        return "outline"
      default:
        return "outline"
    }
  }

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-sm text-[#FF474A]">
            <div className="w-4 h-4 rounded-full bg-[#FF474A]/10 flex items-center justify-center">
              <span className="text-xs text-[#FF474A]">!</span>
            </div>
            200 deduplication found.
          </div>
        </div>
        <div className="flex items-center gap-3 justify-end">
          <Button variant="outline" size="sm" className="h-8">
            Cancel
          </Button>
          {canConfirm ? (
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  className="h-8 bg-teal-600 hover:bg-teal-700 text-white"
                >
                  Confirm Action
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-background border-border">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-xl">Apply changes to quarantine</AlertDialogTitle>
                  <AlertDialogDescription>
                    You are about to update the quarantine list. This will remove duplicates and overwrite existing records.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="mt-3 rounded-md border border-border bg-muted/50 p-3 space-y-2">
                  <div className="text-sm text-foreground">{actionSummary.deleteCount} Deletion</div>
                  <div className="text-sm text-foreground">{actionSummary.overwriteCount} Overwrite</div>
                  <div className="pt-2 mt-2 border-t border-border text-xs text-muted-foreground">
                    Total affected items: {actionSummary.deleteCount + actionSummary.overwriteCount}
                  </div>
                </div>

                <div className="mt-3 text-xs text-muted-foreground">
                  Review your selections in the table. Applying these changes cannot be undone.
                </div>

                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleConfirmActions}>Confirm</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button
              size="sm"
              className="h-8 bg-muted text-muted-foreground border border-border cursor-not-allowed opacity-70"
              disabled
            >
              Confirm Action
            </Button>
          )}
        </div>
      </div>

      {/* Local toast */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50 rounded-md bg-[#111827] text-white px-4 py-2 shadow-lg">
          {showToast}
        </div>
      )}

      {/* Filters and Table in one card */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {/* Search panel */}
        <div className="flex items-center gap-4 p-4 border-b border-border">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-input border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <Select defaultValue="all-file">
            <SelectTrigger className="w-32 bg-input border-border text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background border-border">
              <SelectItem value="all-file">All File</SelectItem>
              <SelectItem value="file-a">File A</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all-action">
            <SelectTrigger className="w-32 bg-input border-border text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background border-border">
              <SelectItem value="all-action">All Action</SelectItem>
              <SelectItem value="append">Append</SelectItem>
              <SelectItem value="overwrite">Overwrite</SelectItem>
              <SelectItem value="skip">Skip</SelectItem>
              <SelectItem value="delete">Delete</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all-status">
            <SelectTrigger className="w-32 bg-input border-border text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background border-border">
              <SelectItem value="all-status">All Status</SelectItem>
              <SelectItem value="approve">Approve</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="reject">Reject</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 text-sm">
            <span>View List by:</span>
            <Select defaultValue="10">
              <SelectTrigger className="w-16 bg-input border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-32 min-w-32">File Name</TableHead>
                <TableHead className="w-32 min-w-32">UWI</TableHead>
                <TableHead className="w-32 min-w-32">Properties</TableHead>
                <TableHead className="w-48 min-w-48">Uploaded Data</TableHead>
                <TableHead className="w-32 min-w-32">Compared Data</TableHead>
                <TableHead className="w-24 min-w-24">Source</TableHead>
                <TableHead className="w-24 min-w-24">Flag</TableHead>
                <TableHead className="w-32 min-w-32">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <React.Fragment key={row.id}>
                  {/* Main Row */}
                  <TableRow className="border-b">
                    <TableCell>
                      <div className="group relative inline-block">
                        <span className="truncate max-w-[120px] inline-block">
                          {row.fileName.length > 12 ? `${row.fileName.substring(0, 9)}...` : row.fileName}
                        </span>
                        {row.fileName.length > 12 && (
                          <div className="absolute z-10 invisible group-hover:visible bg-background text-foreground px-2 py-1 rounded shadow-lg border border-border -mt-1 ml-1">
                            {row.fileName}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {String(1000009500 + row.id)}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRowExpansion(row.id)}
                          className="p-0 h-auto"
                        >
                          {row.isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      {row.properties.length > 1 ? (
                        <div className="flex items-center gap-1">
                          <span>{isDepthValues(row.properties[0]?.uploadedValue) ? 'Top Depth' : row.properties[0].name}</span>
                          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                        </div>
                      ) : (
                        (isDepthValues(row.properties[0]?.uploadedValue) ? 'Top Depth' : row.properties[0]?.name)
                      )}
                    </TableCell>
                    <TableCell>
                      {isDepthValues(row.properties[0]?.uploadedValue) ? (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 text-blue-500 border border-blue-500/20 text-xs rounded-full">
                          <MoreHorizontal className="w-3 h-3" />
                          Multiple data
                        </div>
                      ) : (
                        <Input
                          value={String(row.properties[0]?.uploadedValue ?? "")}
                          onChange={(e) => updateUploadedValue(row.id, row.properties[0]!.id, e.target.value)}
                          className="w-full bg-input border-border text-foreground"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {isDepthValues(row.properties[0]?.comparedValue) ? (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 text-blue-500 border border-blue-500/20 text-xs rounded-full">
                          <MoreHorizontal className="w-3 h-3" />
                          Multiple data
                        </div>
                      ) : String(row.properties[0]?.comparedValue ?? "")}
                      {!isDepthValues(row.properties[0]?.comparedValue) && row.properties.length > 1 && (
                        <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-blue-500/10 text-blue-500 border border-blue-500/20 text-xs rounded-full">
                          <MoreHorizontal className="w-3 h-3" />
                          Multiple data
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-foreground text-sm">{row.properties[0]?.source ?? '-'}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getFlagBadgeVariant(row.properties[0]?.flag)}>{row.properties[0]?.flag}</Badge>
                    </TableCell>
                    <TableCell>
                      {/* Parent action cell shows remaining actions with a small number circle */}
                      {(() => {
                        // Count pending actions including per-key for Top Depth structured values
                        const neededCount = getNeededCount(row)
                        return (
                          <div className="flex items-center justify-end gap-2 text-sm">
                            {neededCount > 0 ? (
                              <>
                                <span className="inline-flex items-center justify-center h-5 min-w-5 rounded-full px-2 text-xs bg-red-500 text-white">
                                  {neededCount}
                                </span>
                                <span className="text-foreground">Action Needed</span>
                                <button
                                  className="underline underline-offset-2 text-primary hover:text-primary/80"
                                  onClick={() => (!row.isExpanded ? toggleRowExpansion(row.id) : null)}
                                >
                                  View
                                </button>
                              </>
                            ) : (
                              <span className="text-green-500 font-medium">Done</span>
                            )}
                          </div>
                        )
                      })()}
                    </TableCell>
                  </TableRow>

                  {/* Expanded Rows (include primary property so it can be actioned) */}
                  {row.isExpanded &&
                    row.properties.flatMap((property) => {
                      const removedNames = new Set(["Bottom Depth", "Top Depth", "Porosity", "Coordinate", "Lithology"])
                      if (removedNames.has(property.name)) {
                        // Render Top Depth as structured keys only when structured values exist; otherwise skip
                        if (!(property.name === 'Top Depth' && (isDepthValues(property.uploadedValue) || isDepthValues(property.comparedValue)))) {
                          return [] as any
                        }
                      }
                      if (isDepthValues(property.uploadedValue) || isDepthValues(property.comparedValue)) {
                        const keys: (keyof DepthValues)[] = ["mMDDF", "mTVDSS", "ftMDDF", "ftTVDSS"]
                        return keys.map((k) => (
                          <TableRow key={`${row.id}-${property.id}-${String(k)}`} className="bg-muted/30">
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                            <TableCell className="pl-8">{k}</TableCell>
                            <TableCell>
                              <Input
                                value={String(((property.uploadedValue as any)?.[k] ?? ""))}
                                onChange={(e) => updateUploadedDepthValue(row.id, property.id, k, e.target.value)}
                                className="w-full bg-input border-border text-foreground"
                              />
                            </TableCell>
                            <TableCell>
                              <div className="text-foreground text-sm">{(property.comparedValue as any)?.[k] ?? "-"}</div>
                              {property.comparedDate && (
                                <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-muted/50 text-muted-foreground text-xs rounded-full">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(property.comparedDate)}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className="text-foreground text-sm">{property.source ?? '-'}</span>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getFlagBadgeVariant(property.flag)}>{property.flag}</Badge>
                            </TableCell>
                            <TableCell>
                              {(() => {
                                const act = subActions[subKey(row.id, property.id, k)]
                                if (act === 'overwrite' || act === 'delete') {
                                  return (
                                    <div className="flex items-center justify-end gap-2 text-sm">
                                      <span className="font-medium capitalize">{act}.</span>
                                      <button
                                        className="underline underline-offset-2 text-primary hover:text-primary/80"
                                        onClick={() => undoSubAction(row.id, property.id, k)}
                                      >
                                        Undo?
                                      </button>
                                    </div>
                                  )
                                }
                                return (
                                  <div className="flex gap-2 justify-end">
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => setSubAction(row.id, property.id, k, 'delete')}
                                    >
                                      Delete
                                    </Button>
                                    <Button
                                      variant="default"
                                      size="sm"
                                      onClick={() => setSubAction(row.id, property.id, k, 'overwrite')}
                                    >
                                      Overwrite
                                    </Button>
                                  </div>
                                )
                              })()}
                            </TableCell>
                          </TableRow>
                        ))
                      }
                      // Non-depth properties render as single row (retain), except removedNames which we skipped
                      return (
                        <TableRow key={`${row.id}-${property.id}`} className="bg-muted/30">
                          <TableCell></TableCell>
                          <TableCell></TableCell>
                          <TableCell className="pl-8">{property.name}</TableCell>
                          <TableCell>
                            <Input
                              value={String(property.uploadedValue)}
                              onChange={(e) => updateUploadedValue(row.id, property.id, e.target.value)}
                              className="w-full bg-input border-border text-foreground"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="text-foreground text-sm">{String(property.comparedValue)}</div>
                            {property.comparedDate && (
                              <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-muted/50 text-muted-foreground text-xs rounded-full">
                                <Calendar className="w-3 h-3" />
                                {formatDate(property.comparedDate)}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-foreground text-sm">{property.source ?? '-'}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getFlagBadgeVariant(property.flag)}>{property.flag}</Badge>
                          </TableCell>
                          <TableCell>
                            {property.action === 'overwrite' || property.action === 'delete' ? (
                              <div className="flex items-center justify-end gap-2 text-sm">
                                <span className="font-medium capitalize">{property.action}.</span>
                                <button
                                  className="underline underline-offset-2 text-primary hover:text-primary/80"
                                  onClick={() => undoPropertyAction(row.id, property.id)}
                                >
                                  Undo?
                                </button>
                              </div>
                            ) : (
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => updatePropertyAction(row.id, property.id, 'delete')}
                                >
                                  Delete
                                </Button>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => updatePropertyAction(row.id, property.id, 'overwrite')}
                                >
                                  Overwrite
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                </React.Fragment>
              ))}
            </TableBody>
        </Table>
        </div>
      </div>
    </div>
  )
}
