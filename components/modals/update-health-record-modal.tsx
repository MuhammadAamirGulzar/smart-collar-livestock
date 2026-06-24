"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { HealthRecord } from "@/lib/types"

interface UpdateHealthRecordModalProps {
  open: boolean
  onClose: () => void
  record: HealthRecord | null
}

export function UpdateHealthRecordModal({ open, onClose, record }: UpdateHealthRecordModalProps) {
  const [formData, setFormData] = useState({
    collarId: "",
    notes: "",
    treatment: "",
    veterinarian: "",
  })

  useEffect(() => {
    if (record) {
      setFormData({
        collarId: record.collarId,
        notes: record.notes,
        treatment: record.treatment || "",
        veterinarian: record.veterinarian || "",
      })
    }
  }, [record])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Handle form submission
    console.log("Health record updated:", formData)
    onClose()
  }

  if (!record) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Update Health Record</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-2">
          <div className="space-y-2">
            <Label htmlFor="collarId">Collar ID</Label>
            <Input
              id="collarId"
              value={formData.collarId}
              onChange={(e) => setFormData({ ...formData, collarId: e.target.value.toUpperCase() })}
              placeholder="Enter collar ID (e.g., COL-001)"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Enter health notes"
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="treatment">Treatment</Label>
            <Input
              id="treatment"
              value={formData.treatment}
              onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
              placeholder="Enter treatment (optional)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="veterinarian">Veterinarian Name</Label>
            <Input
              id="veterinarian"
              value={formData.veterinarian}
              onChange={(e) => {
                // Only allow letters and spaces
                const value = e.target.value.replace(/[^A-Za-z\s.]/g, "")
                setFormData({ ...formData, veterinarian: value })
              }}
              onKeyDown={(e) => {
                // Prevent numbers
                if (/[0-9]/.test(e.key)) {
                  e.preventDefault()
                }
              }}
              placeholder="Enter veterinarian name"
              title="Name cannot contain numbers"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Update Record</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

