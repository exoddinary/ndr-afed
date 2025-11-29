"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Shield, Users, Database, Settings, FileText, X } from "lucide-react"

interface Role {
  id: number
  name: string
  description: string
  userCount: number
  permissions: {
    userManagement: boolean
    dataAccess: boolean
    systemConfig: boolean
    reporting: boolean
    // User Management details
    addUserRole: boolean
    editUserRole: boolean
    viewUsers: boolean
    viewAuditLogs: boolean
    viewDQThresholdList: boolean
    updateDQThresholds: boolean
    addUser: boolean
    editUser: boolean
    deleteUser: boolean
    // Ingestion details
    viewQuarantine: boolean
    resolveQuarantine: boolean
    verifyQuarantine: boolean
    // Data Catalog details
    viewCatalog: boolean
    modifyCatalog: boolean
    verifyCatalogModification: boolean
    filterBrowseCatalog: boolean
  }
  isActive: boolean
  createdDate: string
}

interface RoleEditModalProps {
  role: Role | null
  isOpen: boolean
  onClose: () => void
  onSave: (role: Role) => void
}

export function RoleEditModal({ role, isOpen, onClose, onSave }: RoleEditModalProps) {
  const [formData, setFormData] = useState<Role | null>(null)

  useEffect(() => {
    if (role) {
      setFormData({ ...role })
    }
  }, [role])

  const handleSave = () => {
    if (formData) {
      onSave(formData)
      onClose()
    }
  }

  const handlePermissionChange = (permission: keyof Role["permissions"], value: boolean) => {
    if (formData) {
      const updatedPermissions = { ...formData.permissions }
      updatedPermissions[permission] = value

      // Parent-child logic
      if (permission === "userManagement") {
        // Toggle all User Management children
        const userMgmtChildren = ["addUserRole", "editUserRole", "viewUsers", "viewAuditLogs", "viewDQThresholdList", "updateDQThresholds", "addUser", "editUser", "deleteUser"] as const
        userMgmtChildren.forEach(child => {
          updatedPermissions[child] = value
        })
      } else if (permission === "dataAccess") {
        // Toggle all Ingestion children
        const ingestionChildren = ["viewQuarantine", "resolveQuarantine", "verifyQuarantine"] as const
        ingestionChildren.forEach(child => {
          updatedPermissions[child] = value
        })
      } else if (permission === "systemConfig") {
        // Toggle all System Configuration children
        const systemChildren = ["viewDQThresholdList", "updateDQThresholds"] as const
        systemChildren.forEach(child => {
          updatedPermissions[child] = value
        })
      } else if (permission === "reporting") {
        // Toggle all Data Catalog children
        const catalogChildren = ["viewCatalog", "modifyCatalog", "verifyCatalogModification", "filterBrowseCatalog"] as const
        catalogChildren.forEach(child => {
          updatedPermissions[child] = value
        })
      }

      setFormData({
        ...formData,
        permissions: updatedPermissions,
      })
    }
  }

  const getRoleIcon = (roleName: string) => {
    switch (roleName) {
      case "System Admin":
        return <Shield className="h-5 w-5 text-destructive" />
      case "Geologist":
        return <Database className="h-5 w-5 text-primary" />
      case "TP":
        return <Settings className="h-5 w-5 text-primary" />
      case "Governance Officer":
        return <FileText className="h-5 w-5 text-primary" />
      default:
        return <Shield className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getPermissionCount = (permissions: Role["permissions"]) => {
    const childKeys: Array<keyof Role["permissions"]> = [
      // User Management details
      "addUserRole",
      "editUserRole",
      "viewUsers",
      "viewAuditLogs",
      "viewDQThresholdList",
      "updateDQThresholds",
      "addUser",
      "editUser",
      "deleteUser",
      // Ingestion details
      "viewQuarantine",
      "resolveQuarantine",
      "verifyQuarantine",
      // Data Catalog details
      "viewCatalog",
      "modifyCatalog",
      "verifyCatalogModification",
      "filterBrowseCatalog",
    ]
    return childKeys.reduce((acc, key) => acc + (permissions[key] ? 1 : 0), 0)
  }

  if (!formData) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border border-border text-foreground max-h-[90vh] overflow-y-auto custom-scrollbar !w-auto sm:!max-w-5xl md:!max-w-6xl">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="text-xl font-semibold">Edit Role</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Left Column */}
          <div className="md:col-span-2 space-y-6">
            {/* Role Header Card */}
            <div className="bg-muted rounded-lg p-4 border border-border">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
                  {getRoleIcon(formData.name)}
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-foreground">{formData.name}</h3>
                  <Badge variant="outline" className="text-muted-foreground/80 border-border text-xs px-2 py-1 mt-2 w-fit">
                    {getPermissionCount(formData.permissions)}/16 Permission
                  </Badge>
                </div>
              </div>
            </div>

            {/* Role Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Role Information</h4>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-muted-foreground">Role Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-input border-border text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-muted-foreground">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-input border-border text-foreground min-h-[80px]"
                  />
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Status</h4>
              <div className="flex items-center justify-between bg-muted rounded-lg p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Role Status</p>
                  <p className="text-xs font-normal text-muted-foreground/80">Enable or disable this role</p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(value) => setFormData({ ...formData, isActive: value })}
                    className="data-[state=checked]:bg-primary"
                  />
                  <span className={formData.isActive ? "text-primary" : "text-muted-foreground"}>
                    {formData.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="md:col-span-3">
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Permissions</h4>
              <Accordion type="single" collapsible defaultValue="user-management" className="bg-muted rounded-lg border border-border">
                <AccordionItem value="user-management" className="px-4">
                  <div className="flex items-center justify-between">
                    <AccordionTrigger className="py-4 pr-2 hover:no-underline">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-destructive rounded-full" />
                        <div className="text-left">
                          <p className="text-foreground font-medium">User Management</p>
                          <p className="text-muted-foreground/80 text-xs font-normal">Create, edit, and manage user accounts</p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <Switch
                      checked={formData.permissions.userManagement}
                      onCheckedChange={(value) => handlePermissionChange("userManagement", value)}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>
                  <AccordionContent className="pb-4">
                    <div className="text-sm text-foreground space-y-2">
                      <div className="flex items-center justify-between pl-7">
                        <span>Add User Role</span>
                        <Switch checked={formData.permissions.addUserRole} onCheckedChange={(v) => handlePermissionChange("addUserRole", v)} className="data-[state=checked]:bg-primary/80 data-[state=unchecked]:bg-muted/50" />
                      </div>
                      <div className="flex items-center justify-between pl-7">
                        <span>Edit User Role</span>
                        <Switch checked={formData.permissions.editUserRole} onCheckedChange={(v) => handlePermissionChange("editUserRole", v)} className="data-[state=checked]:bg-primary/80 data-[state=unchecked]:bg-muted/50" />
                      </div>
                      <div className="flex items-center justify-between pl-7">
                        <span>View List of Users</span>
                        <Switch checked={formData.permissions.viewUsers} onCheckedChange={(v) => handlePermissionChange("viewUsers", v)} className="data-[state=checked]:bg-primary/80 data-[state=unchecked]:bg-muted/50" />
                      </div>
                      <div className="flex items-center justify-between pl-7">
                        <span>View Audit Logs (filterable)</span>
                        <Switch checked={formData.permissions.viewAuditLogs} onCheckedChange={(v) => handlePermissionChange("viewAuditLogs", v)} className="data-[state=checked]:bg-primary/80 data-[state=unchecked]:bg-muted/50" />
                      </div>
                      <div className="flex items-center justify-between pl-7">
                        <span>View Data Quality Threshold List</span>
                        <Switch checked={formData.permissions.viewDQThresholdList} onCheckedChange={(v) => handlePermissionChange("viewDQThresholdList", v)} className="data-[state=checked]:bg-primary/80 data-[state=unchecked]:bg-muted/50" />
                      </div>
                      <div className="flex items-center justify-between pl-7">
                        <span>Update Data Quality Thresholds</span>
                        <Switch checked={formData.permissions.updateDQThresholds} onCheckedChange={(v) => handlePermissionChange("updateDQThresholds", v)} className="data-[state=checked]:bg-primary/80 data-[state=unchecked]:bg-muted/50" />
                      </div>
                      <div className="flex items-center justify-between pl-7">
                        <span>Add User</span>
                        <Switch checked={formData.permissions.addUser} onCheckedChange={(v) => handlePermissionChange("addUser", v)} className="data-[state=checked]:bg-primary/80 data-[state=unchecked]:bg-muted/50" />
                      </div>
                      <div className="flex items-center justify-between pl-7">
                        <span>Edit User</span>
                        <Switch checked={formData.permissions.editUser} onCheckedChange={(v) => handlePermissionChange("editUser", v)} className="data-[state=checked]:bg-primary/80 data-[state=unchecked]:bg-muted/50" />
                      </div>
                      <div className="flex items-center justify-between pl-7">
                        <span>Delete User</span>
                        <Switch checked={formData.permissions.deleteUser} onCheckedChange={(v) => handlePermissionChange("deleteUser", v)} className="data-[state=checked]:bg-primary/80 data-[state=unchecked]:bg-muted/50" />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="data-access" className="px-4">
                  <div className="flex items-center justify-between">
                    <AccordionTrigger className="py-4 pr-2 hover:no-underline">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-primary rounded-full" />
                        <div className="text-left">
                          <p className="text-foreground font-medium">Ingestion</p>
                          <p className="text-muted-foreground/80 text-xs font-normal">Manage quarantine datasets</p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <Switch
                      checked={formData.permissions.dataAccess}
                      onCheckedChange={(value) => handlePermissionChange("dataAccess", value)}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>
                  <AccordionContent className="pb-4">
                    <div className="text-sm text-foreground space-y-2">
                      <div className="flex items-center justify-between pl-7">
                        <span>View Quarantine Dataset</span>
                        <Switch checked={formData.permissions.viewQuarantine} onCheckedChange={(v) => handlePermissionChange("viewQuarantine", v)} className="data-[state=checked]:bg-primary/80 data-[state=unchecked]:bg-muted/50" />
                      </div>
                      <div className="flex items-center justify-between pl-7">
                        <span>Resolve Quarantine Dataset</span>
                        <Switch checked={formData.permissions.resolveQuarantine} onCheckedChange={(v) => handlePermissionChange("resolveQuarantine", v)} className="data-[state=checked]:bg-primary/80 data-[state=unchecked]:bg-muted/50" />
                      </div>
                      <div className="flex items-center justify-between pl-7">
                        <span>Verify Quarantine Dataset</span>
                        <Switch checked={formData.permissions.verifyQuarantine} onCheckedChange={(v) => handlePermissionChange("verifyQuarantine", v)} className="data-[state=checked]:bg-primary/80 data-[state=unchecked]:bg-muted/50" />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="system-config" className="px-4">
                  <div className="flex items-center justify-between">
                    <AccordionTrigger className="py-4 pr-2 hover:no-underline">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-primary rounded-full" />
                        <div className="text-left">
                          <p className="text-foreground font-medium">System Configuration</p>
                          <p className="text-muted-foreground/80 text-xs font-normal">Configure system settings and parameters</p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <Switch
                      checked={formData.permissions.systemConfig}
                      onCheckedChange={(value) => handlePermissionChange("systemConfig", value)}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>
                  <AccordionContent className="pb-4">
                    <div className="text-sm text-foreground space-y-2">
                      <div className="flex items-center justify-between pl-7">
                        <span>Manage Data Quality Thresholds</span>
                        <Switch checked={formData.permissions.viewDQThresholdList} onCheckedChange={(v) => handlePermissionChange("viewDQThresholdList", v)} className="data-[state=checked]:bg-primary/80 data-[state=unchecked]:bg-muted/50" />
                      </div>
                      <div className="flex items-center justify-between pl-7">
                        <span>Update Configuration</span>
                        <Switch checked={formData.permissions.updateDQThresholds} onCheckedChange={(v) => handlePermissionChange("updateDQThresholds", v)} className="data-[state=checked]:bg-primary/80 data-[state=unchecked]:bg-muted/50" />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="reporting" className="px-4">
                  <div className="flex items-center justify-between">
                    <AccordionTrigger className="py-4 pr-2 hover:no-underline">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-primary rounded-full" />
                        <div className="text-left">
                          <p className="text-foreground font-medium">Data Catalog</p>
                          <p className="text-muted-foreground/80 text-xs font-normal">View and manage data catalog</p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <Switch
                      checked={formData.permissions.reporting}
                      onCheckedChange={(value) => handlePermissionChange("reporting", value)}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>
                  <AccordionContent className="pb-4">
                    <div className="text-sm text-foreground space-y-2">
                      <div className="flex items-center justify-between pl-7">
                        <span>View Catalog</span>
                        <Switch checked={formData.permissions.viewCatalog} onCheckedChange={(v) => handlePermissionChange("viewCatalog", v)} className="data-[state=checked]:bg-primary/80 data-[state=unchecked]:bg-muted/50" />
                      </div>
                      <div className="flex items-center justify-between pl-7">
                        <span>Data Catalog Modification</span>
                        <Switch checked={formData.permissions.modifyCatalog} onCheckedChange={(v) => handlePermissionChange("modifyCatalog", v)} className="data-[state=checked]:bg-primary/80 data-[state=unchecked]:bg-muted/50" />
                      </div>
                      <div className="flex items-center justify-between pl-7">
                        <span>Verify Data Catalog Modification</span>
                        <Switch checked={formData.permissions.verifyCatalogModification} onCheckedChange={(v) => handlePermissionChange("verifyCatalogModification", v)} className="data-[state=checked]:bg-primary/80 data-[state=unchecked]:bg-muted/50" />
                      </div>
                      <div className="flex items-center justify-between pl-7">
                        <span>Filtering and Browsing Data Catalog</span>
                        <Switch checked={formData.permissions.filterBrowseCatalog} onCheckedChange={(v) => handlePermissionChange("filterBrowseCatalog", v)} className="data-[state=checked]:bg-primary/80 data-[state=unchecked]:bg-muted/50" />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-6 border-t border-border">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-border text-muted-foreground hover:bg-muted bg-transparent"
          >
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
