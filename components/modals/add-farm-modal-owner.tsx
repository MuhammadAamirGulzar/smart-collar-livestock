"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Farm } from "@/lib/types"

interface AddFarmModalOwnerProps {
  open: boolean
  onClose: () => void
  ownerId: string
  onAddFarm: (farm: Farm) => void
}

// Ensure the function name matches the import exactly
export function AddFarmModalOwner({ open, onClose, ownerId, onAddFarm }: AddFarmModalOwnerProps) {
  const [formData, setFormData] = useState({
    farmName: "",
    location: "",
    size: "",
    totalCows: "",
    totalActiveCollars: "",
    totalInactiveCollars: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Create the new farm object
    // Casting to 'any' to bypass strict type checks on ID generation for the demo
    const newFarm: any = {
      id: Math.random().toString(36).substr(2, 9),
      ownerId: ownerId,
      farmName: formData.farmName,
      location: formData.location,
      size: Number(formData.size),
      totalCows: Number(formData.totalCows),
      totalActiveCollars: Number(formData.totalActiveCollars),
      totalInactiveCollars: Number(formData.totalInactiveCollars),
      status: "Active",
      createdAt: new Date().toISOString()
    }

    onAddFarm(newFarm)
    onClose()
    setFormData({
      farmName: "",
      location: "",
      size: "",
      totalCows: "",
      totalActiveCollars: "",
      totalInactiveCollars: "",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add New Farm</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-2">
          <div className="space-y-2">
            <Label htmlFor="farmName">Farm Name</Label>
            <Input
              id="farmName"
              value={formData.farmName}
              onChange={(e) => setFormData({ ...formData, farmName: e.target.value })}
              placeholder="Enter farm name"
              pattern="[A-Za-z\s]+"
              title="Farm name cannot contain numbers"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Enter location"
              pattern="[A-Za-z\s]+"
              title="Location cannot contain numbers"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="size">Size (acres)</Label>
            <Input
              id="size"
              type="number"
              min="0"
              step="0.01"
              value={formData.size}
              onChange={(e) => setFormData({ ...formData, size: e.target.value })}
              placeholder="Enter size in acres"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="totalCows">Total Cows</Label>
            <Input
              id="totalCows"
              type="number"
              min="0"
              value={formData.totalCows}
              onChange={(e) => setFormData({ ...formData, totalCows: e.target.value })}
              placeholder="Enter total cows"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="totalActiveCollars">Total Active Collars</Label>
            <Input
              id="totalActiveCollars"
              type="number"
              min="0"
              value={formData.totalActiveCollars}
              onChange={(e) => setFormData({ ...formData, totalActiveCollars: e.target.value })}
              placeholder="Enter total active collars"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="totalInactiveCollars">Total Inactive Collars</Label>
            <Input
              id="totalInactiveCollars"
              type="number"
              min="0"
              value={formData.totalInactiveCollars}
              onChange={(e) => setFormData({ ...formData, totalInactiveCollars: e.target.value })}
              placeholder="Enter total inactive collars"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Add Farm</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}