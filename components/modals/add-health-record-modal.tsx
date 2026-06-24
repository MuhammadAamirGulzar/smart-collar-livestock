"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/lib/auth-context"
import { addHealthRecord } from "@/lib/healthRecordService"

interface CollarOption {
  collarId: string
  animalName: string
  farmId: string
}

interface AddHealthRecordModalProps {
  open: boolean
  onClose: () => void
  collars: CollarOption[]
  onRecordAdded?: () => void
}

export function AddHealthRecordModal({ open, onClose, collars, onRecordAdded }: AddHealthRecordModalProps) {
  const { firebaseSignedIn } = useAuth()
  const [formData, setFormData] = useState({
    collarId: "",
    notes: "",
    treatment: "",
    veterinarian: "",
    date: new Date().toISOString().split("T")[0],
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const resetForm = () => {
    setFormData({
      collarId: "",
      notes: "",
      treatment: "",
      veterinarian: "",
      date: new Date().toISOString().split("T")[0],
    })
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!firebaseSignedIn) {
      setError("You must be signed in to add a health record.")
      return
    }

    if (!formData.collarId) {
      setError("Please select a collar ID.")
      return
    }

    const selected = collars.find((c) => c.collarId === formData.collarId)
    if (!selected) {
      setError("Invalid collar selection.")
      return
    }

    setSubmitting(true)
    try {
      await addHealthRecord({
        farmId: selected.farmId,
        collarId: formData.collarId,
        notes: formData.notes,
        treatment: formData.treatment,
        veterinarian: formData.veterinarian,
        date: formData.date,
      })
      resetForm()
      onClose()
      onRecordAdded?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add health record")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => { resetForm(); onClose() }}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Health Record</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-2">
          <div className="space-y-2">
            <Label htmlFor="collarId">Collar ID</Label>
            <select
              id="collarId"
              value={formData.collarId}
              onChange={(e) => setFormData({ ...formData, collarId: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              required
            >
              <option value="">Select a collar</option>
              {collars.map((c) => (
                <option key={c.collarId} value={c.collarId}>
                  {c.collarId} — {c.animalName}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
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
                const value = e.target.value.replace(/[^A-Za-z\s.]/g, "")
                setFormData({ ...formData, veterinarian: value })
              }}
              onKeyDown={(e) => {
                if (/[0-9]/.test(e.key)) e.preventDefault()
              }}
              placeholder="Enter veterinarian name"
              title="Name cannot contain numbers"
              required
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => { resetForm(); onClose() }}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Adding..." : "Add Record"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
