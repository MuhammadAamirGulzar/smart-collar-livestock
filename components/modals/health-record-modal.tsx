"use client"

import type React from "react"

import { useState } from "react"
import { GlassmorphicCard } from "@/components/ui/glassmorphic-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface HealthRecordModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
}

export function HealthRecordModal({ isOpen, onClose, onSubmit }: HealthRecordModalProps) {
  const [formData, setFormData] = useState({
    animalName: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
    treatment: "",
    veterinarian: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    setFormData({
      animalName: "",
      date: new Date().toISOString().split("T")[0],
      notes: "",
      treatment: "",
      veterinarian: "",
    })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <GlassmorphicCard className="w-full max-w-md">
        <h2 className="text-2xl font-bold text-foreground mb-6">Add Health Record</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Animal Name</label>
            <Input
              type="text"
              placeholder="Select animal"
              value={formData.animalName}
              onChange={(e) => setFormData({ ...formData, animalName: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Date</label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Notes</label>
            <textarea
              placeholder="Health check notes..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              rows={3}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Treatment (if any)</label>
            <Input
              type="text"
              placeholder="Treatment applied"
              value={formData.treatment}
              onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Veterinarian Name</label>
            <Input
              type="text"
              placeholder="Veterinarian name"
              value={formData.veterinarian}
              onChange={(e) => setFormData({ ...formData, veterinarian: e.target.value })}
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">
              Save Record
            </Button>
            <Button type="button" variant="outline" className="flex-1 bg-transparent" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </GlassmorphicCard>
    </div>
  )
}
