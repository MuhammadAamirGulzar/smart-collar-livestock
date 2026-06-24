"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { updateFarm } from "@/lib/farmService"
import type { Farm, User } from "@/lib/types"

interface UpdateFarmModalProps {
  open: boolean
  onClose: () => void
  farm: Farm | null
  owners: User[]
  onFarmUpdated?: () => void
}

export function UpdateFarmModal({ open, onClose, farm, owners, onFarmUpdated }: UpdateFarmModalProps) {
  const [formData, setFormData] = useState({
    ownerId: "",
    farmName: "",
    location: "",
    size: "",
    totalCows: "",
    totalActiveCollars: "",
    totalInactiveCollars: "",
  })

  useEffect(() => {
    if (farm) {
      setFormData({
        ownerId: farm.ownerId || "",
        farmName: farm.name,
        location: farm.location,
        size: farm.size.toString(),
        totalCows: (farm.totalCows || 0).toString(),
        totalActiveCollars: (farm.totalActiveCollars || 0).toString(),
        totalInactiveCollars: (farm.totalInactiveCollars || 0).toString(),
      })
    }
  }, [farm])

  const { firebaseSignedIn } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!firebaseSignedIn) {
      setError("You must be signed in to update a farm.")
      return
    }

    if (farm) {
      setSubmitting(true)
      try {
        await updateFarm(farm.id, {
          name: formData.farmName,
          location: formData.location,
          ownerId: formData.ownerId || undefined,
          size: formData.size ? parseFloat(formData.size) : undefined,
          totalCows: formData.totalCows ? parseInt(formData.totalCows, 10) : undefined,
          totalActiveCollars: formData.totalActiveCollars ? parseInt(formData.totalActiveCollars, 10) : undefined,
          totalInactiveCollars: formData.totalInactiveCollars ? parseInt(formData.totalInactiveCollars, 10) : undefined,
        })
        onClose()
        onFarmUpdated?.()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update farm")
      } finally {
        setSubmitting(false)
      }
    }
  }

  if (!farm) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Update Farm</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-2">
          <div className="space-y-2">
            <Label htmlFor="ownerId">Owner</Label>
            <select
              id="ownerId"
              value={formData.ownerId}
              onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              required
            >
              <option value="">Select Owner</option>
              {owners.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.name}
                </option>
              ))}
            </select>
          </div>

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
              onKeyDown={(e) => {
                if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                  e.preventDefault()
                }
              }}
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
              onKeyDown={(e) => {
                if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '.') {
                  e.preventDefault()
                }
              }}
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
              onKeyDown={(e) => {
                if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '.') {
                  e.preventDefault()
                }
              }}
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
              onKeyDown={(e) => {
                if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '.') {
                  e.preventDefault()
                }
              }}
              placeholder="Enter total inactive collars"
              required
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Updating..." : "Update Farm"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

