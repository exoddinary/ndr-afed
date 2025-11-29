"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Calendar, Shield, Briefcase } from "lucide-react"

interface UserData {
  id: number
  name: string
  email: string
  role: string
  status: string
  lastLogin: string
  discipline: string
}

interface UserEditModalProps {
  user: UserData | null
  isOpen: boolean
  onClose: () => void
  onSave: (userData: UserData) => void
  onShowToast?: (message: string) => void // Added toast callback prop
}

const roles = ["System Admin", "Geologist", "TP", "Governance Officer"]
const statuses = ["Active", "Pending"]
const disciplines = [
  "Geology",
  "Geophysics",
  "Reservoir Engineering",
  "Production Engineering",
  "Drilling",
  "Completions",
]

export function UserEditModal({ user, isOpen, onClose, onSave, onShowToast }: UserEditModalProps) {
  const [formData, setFormData] = useState<UserData>({
    id: 0,
    name: "",
    email: "",
    role: "Unassigned",
    status: "Pending",
    lastLogin: "",
    discipline: "Unassigned",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (user) {
      setFormData(user)
      setErrors({})
    }
  }, [user])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Name is required"
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format"
    }

    if (!formData.discipline || formData.discipline === "Unassigned") {
      newErrors.discipline = "Discipline is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (validateForm()) {
      onSave(formData)
      onShowToast?.(`User ${formData.name} has been updated successfully!`)
      onClose()
    }
  }

  const handleInputChange = (field: keyof UserData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }))
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "System Admin":
        return "bg-destructive/20 text-destructive border-destructive/30"
      case "Geologist":
        return "bg-muted text-muted-foreground border-border"
      case "TP":
        return "bg-muted text-muted-foreground border-border"
      case "Governance Officer":
        return "bg-muted text-muted-foreground border-border"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  if (!user) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border border-border text-foreground max-w-2xl custom-scrollbar">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Edit User Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* User Avatar and Basic Info */}
          <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
            <div className="w-16 h-16 rounded-full flex items-center justify-center bg-accent text-accent-foreground text-lg font-medium">
              {formData.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-foreground">{formData.name}</h3>
              <p className="text-muted-foreground">{formData.email}</p>
              <div className="flex items-center gap-2 mt-2">
                {formData.role && (
                  <Badge className={`${getRoleBadgeColor(formData.role)} border text-xs`}>{formData.role}</Badge>
                )}
                <Badge className="bg-muted text-muted-foreground border-border border text-xs">
                  {formData.discipline}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>Last Login: {formData.lastLogin || "Never"}</span>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-2 gap-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" />
                Full Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="bg-input border-border text-foreground w-full" // Added w-full for consistent width
                placeholder="Enter full name"
              />
              {errors.name && <p className="text-destructive text-sm">{errors.name}</p>}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-muted-foreground flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="bg-input border-border text-foreground w-full" // Added w-full for consistent width
                placeholder="Enter email address"
              />
              {errors.email && <p className="text-destructive text-sm">{errors.email}</p>}
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="role" className="text-muted-foreground flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Role
              </Label>
              <Select value={formData.role} onValueChange={(value) => handleInputChange("role", value)}>
                <SelectTrigger className="bg-input border-border text-foreground w-full">
                  {" "}
                  {/* Added w-full for consistent width */}
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Unassigned">Unassigned</SelectItem>
                  {roles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Discipline */}
            <div className="space-y-2">
              <Label htmlFor="discipline" className="text-muted-foreground flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Discipline
              </Label>
              <Select value={formData.discipline} onValueChange={(value) => handleInputChange("discipline", value)}>
                <SelectTrigger className="bg-input border-border text-foreground w-full">
                  {" "}
                  {/* Added w-full for consistent width */}
                  <SelectValue placeholder="Select discipline" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Unassigned">Unassigned</SelectItem>
                  {disciplines.map((discipline) => (
                    <SelectItem key={discipline} value={discipline}>
                      {discipline}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.discipline && <p className="text-destructive text-sm">{errors.discipline}</p>}
            </div>

            {/* Status */}
            <div className="space-y-2 col-span-2">
              {" "}
              {/* Made status full width and removed last login field */}
              <Label htmlFor="status" className="text-muted-foreground">
                Status
              </Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                <SelectTrigger className="bg-input border-border text-foreground w-full max-w-xs">
                  {" "}
                  {/* Added max-w-xs for smaller width */}
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-border text-muted-foreground bg-transparent hover:bg-muted hover:text-foreground"
          >
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
