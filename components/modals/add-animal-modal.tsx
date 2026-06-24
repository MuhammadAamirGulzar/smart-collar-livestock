"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { addAnimal } from "@/lib/animalService"

interface FarmOption {
  id: string
  name: string
}

interface AddAnimalModalProps {
  open: boolean
  onClose: () => void
  farms: FarmOption[]
  farmId?: string
  onAnimalAdded?: () => void
}

export function AddAnimalModal({ open, onClose, farms, farmId, onAnimalAdded }: AddAnimalModalProps) {
  const { firebaseSignedIn } = useAuth()
  const [formData, setFormData] = useState({
    name: "",
    breed: "",
    collarId: "",
    age: "",
    selectedFarmId: farmId || "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const resetForm = () => {
    setFormData({ name: "", breed: "", collarId: "", age: "", selectedFarmId: farmId || "" })
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const targetFarmId = formData.selectedFarmId || farmId
    if (!targetFarmId) {
      setError("Please select a farm.")
      return
    }

    if (!firebaseSignedIn) {
      setError("You must be signed in to add an animal.")
      return
    }

    setSubmitting(true)
    try {
      await addAnimal(targetFarmId, {
        name: formData.name,
        species: formData.breed,
        collarId: formData.collarId || undefined,
        age: formData.age ? Number(formData.age) : undefined,
      })
      resetForm()
      onClose()
      onAnimalAdded?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add animal")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => { resetForm(); onClose() }}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add New Animal</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-2">
          <div className="space-y-2">
            <Label htmlFor="farm">Farm</Label>
            <select
              id="farm"
              value={formData.selectedFarmId}
              onChange={(e) => setFormData({ ...formData, selectedFarmId: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              required
            >
              <option value="">Select a farm</option>
              {farms.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter animal name (e.g., Gulabi)"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="breed">Breed / Species</Label>
            <Input
              id="breed"
              value={formData.breed}
              onChange={(e) => {
                const value = e.target.value.replace(/[^A-Za-z\s]/g, "")
                setFormData({ ...formData, breed: value })
              }}
              onKeyDown={(e) => {
                if (/[0-9]/.test(e.key)) e.preventDefault()
              }}
              placeholder="Enter breed (e.g., Sahiwal, Holstein)"
              title="Breed cannot contain numbers"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="age">Age (years)</Label>
            <Input
              id="age"
              type="number"
              min="0"
              max="30"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              placeholder="Enter age in years"
              required
            />
          </div>

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

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => { resetForm(); onClose() }}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Adding..." : "Add Animal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
