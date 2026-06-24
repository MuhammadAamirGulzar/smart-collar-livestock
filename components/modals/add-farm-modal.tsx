"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Farm, User } from "@/lib/types"

interface AddFarmModalProps {
  open: boolean
  onClose: () => void
  owners: User[]
  // 1. THIS PROP WAS MISSING
  onAddFarm: (farm: Farm) => void
}

export function AddFarmModal({ open, onClose, owners, onAddFarm }: AddFarmModalProps) {
  const [formData, setFormData] = useState({
    farmName: "",
    ownerId: "",
    location: "",
    size: "",
    totalCows: "",
    totalActiveCollars: "",
    totalInactiveCollars: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // 2. CREATE THE FARM OBJECT
    const newFarm: any = {
      id: Math.random().toString(36).substr(2, 9),
      ownerId: formData.ownerId || (owners.length > 0 ? owners[0].id : "owner-1"),
      farmName: formData.farmName,
      location: formData.location,
      size: Number(formData.size),
      totalCows: Number(formData.totalCows),
      totalActiveCollars: Number(formData.totalActiveCollars),
      totalInactiveCollars: Number(formData.totalInactiveCollars),
      status: "Active",
      createdAt: new Date().toISOString()
    }

    // 3. SEND IT BACK TO THE PAGE
    onAddFarm(newFarm)
    
    // 4. RESET AND CLOSE
    setFormData({
      farmName: "",
      ownerId: "",
      location: "",
      size: "",
      totalCows: "",
      totalActiveCollars: "",
      totalInactiveCollars: "",
    })
    onClose()
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
              required
              placeholder="Enter farm name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="owner">Farm Owner</Label>
            <Select 
              value={formData.ownerId} 
              onValueChange={(value) => setFormData({ ...formData, ownerId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an owner" />
              </SelectTrigger>
              <SelectContent>
                {owners.map((owner) => (
                  <SelectItem key={owner.id} value={owner.id}>
                    {owner.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              required
              placeholder="Enter location"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="size">Size (acres)</Label>
            <Input
              id="size"
              type="number"
              value={formData.size}
              onChange={(e) => setFormData({ ...formData, size: e.target.value })}
              required
              placeholder="Enter size in acres"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalCows">Total Cows</Label>
              <Input
                id="totalCows"
                type="number"
                value={formData.totalCows}
                onChange={(e) => setFormData({ ...formData, totalCows: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="activeCollars">Active Collars</Label>
              <Input
                id="activeCollars"
                type="number"
                value={formData.totalActiveCollars}
                onChange={(e) => setFormData({ ...formData, totalActiveCollars: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="inactiveCollars">Inactive Collars</Label>
            <Input
              id="inactiveCollars"
              type="number"
              value={formData.totalInactiveCollars}
              onChange={(e) => setFormData({ ...formData, totalInactiveCollars: e.target.value })}
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