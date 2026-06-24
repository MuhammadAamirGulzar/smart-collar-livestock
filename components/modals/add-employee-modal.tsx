"use client"

import { useState } from "react"
import { doc, updateDoc, arrayUnion } from "firebase/firestore"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { db } from "@/firebase/config"
import type { Farm, Employee } from "@/lib/types"

interface AddEmployeeModalProps {
  open: boolean
  onClose: () => void
  farms: Farm[]
  existingEmployees: Employee[]
  onEmployeeAdded?: () => void
}

export function AddEmployeeModal({ open, onClose, farms, existingEmployees, onEmployeeAdded }: AddEmployeeModalProps) {
  const { firebaseSignedIn } = useAuth()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    cnic: "",
    contactNumber: "",
    address: "",
    farmId: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [showManagerAlert, setShowManagerAlert] = useState(false)

  const formatCNIC = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 13)
    if (digits.length <= 5) return digits
    if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`
    return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`
  }

  const formatPhone = (value: string) => value.replace(/\D/g, "").slice(0, 11)

  const preventNonDigitKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (["-", "e", "E", "+", "."].includes(e.key)) e.preventDefault()
  }

  const resetForm = () => {
    setFormData({ name: "", email: "", password: "", phone: "", cnic: "", contactNumber: "", address: "", farmId: "" })
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!firebaseSignedIn) {
      setError("You must be signed in to add an employee.")
      return
    }

    if (!formData.farmId) {
      setError("Please select a farm.")
      return
    }

    const farmHasManager = existingEmployees.some(
      (emp) => emp.farmId === formData.farmId && emp.role === "executive-manager",
    )
    if (farmHasManager) {
      setShowManagerAlert(true)
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/register-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          role: "executive_manager",
          phone: formData.phone,
          cnic: formData.cnic,
          contactNumber: formData.contactNumber,
          address: formData.address,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to register employee")

      const empUid = data.uid as string

      await updateDoc(doc(db, "farms", formData.farmId), {
        employees: arrayUnion(empUid),
      })
      await updateDoc(doc(db, "executive_managers", empUid), {
        assignedFarms: arrayUnion(formData.farmId),
      })

      resetForm()
      onClose()
      onEmployeeAdded?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register employee")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={() => { resetForm(); onClose() }}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter password (min 6 characters)"
                minLength={6}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^A-Za-z\s]/g, "")
                  setFormData({ ...formData, name: value })
                }}
                onKeyDown={(e) => { if (/[0-9]/.test(e.key)) e.preventDefault() }}
                placeholder="Enter employee name"
                title="Name cannot contain numbers"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone (11 digits)</Label>
              <Input
                id="phone"
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                onKeyDown={preventNonDigitKeys}
                placeholder="03001234567"
                maxLength={11}
                pattern="\d{11}"
                title="Phone number must be exactly 11 digits"
                required
              />
              <p className="text-xs text-muted-foreground">{formData.phone.length}/11 digits</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cnic">CNIC (13 digits)</Label>
              <Input
                id="cnic"
                type="text"
                value={formData.cnic}
                onChange={(e) => setFormData({ ...formData, cnic: formatCNIC(e.target.value) })}
                onKeyDown={preventNonDigitKeys}
                placeholder="12345-6789012-3"
                maxLength={15}
                pattern="\d{5}-\d{7}-\d{1}"
                title="CNIC must be 13 digits (format: 12345-6789012-3)"
                required
              />
              <p className="text-xs text-muted-foreground">Auto-formatted: {formData.cnic.replace(/\D/g, "").length}/13 digits</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactNumber">Contact Number (11 digits)</Label>
              <Input
                id="contactNumber"
                type="text"
                value={formData.contactNumber}
                onChange={(e) => setFormData({ ...formData, contactNumber: formatPhone(e.target.value) })}
                onKeyDown={preventNonDigitKeys}
                placeholder="03001234567"
                maxLength={11}
                pattern="\d{11}"
                title="Contact number must be exactly 11 digits"
                required
              />
              <p className="text-xs text-muted-foreground">{formData.contactNumber.length}/11 digits</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter address"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="farmId">Assign to Farm</Label>
              <select
                id="farmId"
                value={formData.farmId}
                onChange={(e) => setFormData({ ...formData, farmId: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
              >
                <option value="">Select a farm</option>
                {farms.map((farm) => (
                  <option key={farm.id} value={farm.id}>{farm.name}</option>
                ))}
              </select>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => { resetForm(); onClose() }}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Registering..." : "Add Employee"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showManagerAlert} onOpenChange={setShowManagerAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Manager Already Assigned</AlertDialogTitle>
            <AlertDialogDescription>
              This farm already has an Executive Manager assigned. Please select a different farm or remove the existing manager first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogAction onClick={() => setShowManagerAlert(false)}>
            OK
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
