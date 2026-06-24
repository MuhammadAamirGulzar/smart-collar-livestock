"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/firebase/config"
import { useAuth } from "@/lib/auth-context"
import type { User } from "@/lib/types"

interface UpdateOwnerModalProps {
  open: boolean
  onClose: () => void
  owner: User | null
  onOwnerUpdated?: () => void
}

export function UpdateOwnerModal({ open, onClose, owner, onOwnerUpdated }: UpdateOwnerModalProps) {
  const { firebaseSignedIn } = useAuth()
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    cnic: "",
    contactNumber: "",
    address: "",
    ownerId: "",
  })

  useEffect(() => {
    if (owner) {
      setFormData({
        name: owner.name,
        phone: owner.phone || "",
        cnic: owner.cnic || "",
        contactNumber: owner.contactNumber || "",
        address: owner.address || "",
        ownerId: owner.ownerId || "",
      })
    }
  }, [owner])

  const formatCNIC = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, "")
    // Limit to 13 digits
    const limited = digits.slice(0, 13)
    
    // Add dashes automatically: XXXXX-XXXXXXX-X
    if (limited.length <= 5) {
      return limited
    } else if (limited.length <= 12) {
      return `${limited.slice(0, 5)}-${limited.slice(5)}`
    } else {
      return `${limited.slice(0, 5)}-${limited.slice(5, 12)}-${limited.slice(12)}`
    }
  }

  const formatPhone = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, "")
    // Limit to 11 digits
    return digits.slice(0, 11)
  }

  const handleCNICChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCNIC(e.target.value)
    setFormData({ ...formData, cnic: formatted })
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    setFormData({ ...formData, phone: formatted })
  }

  const handleContactNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    setFormData({ ...formData, contactNumber: formatted })
  }

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!firebaseSignedIn) {
      setError("You must be signed in to update an owner.")
      return
    }

    if (owner) {
      setSubmitting(true)
      try {
        await updateDoc(doc(db, "users", owner.id), {
          name: formData.name,
          phone: formData.phone,
          cnic: formData.cnic,
          contactNumber: formData.contactNumber,
          address: formData.address,
          ownerId: formData.ownerId,
        })

        await updateDoc(doc(db, "farm_owners", owner.id), {
          ownerId: formData.ownerId,
          name: formData.name,
          phone: formData.phone,
          cnic: formData.cnic,
          contactNumber: formData.contactNumber,
          address: formData.address,
        })

        onClose()
        onOwnerUpdated?.()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update owner")
      } finally {
        setSubmitting(false)
      }
    }
  }

  if (!owner) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Update Owner</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-2">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => {
                // Only allow letters and spaces
                const value = e.target.value.replace(/[^A-Za-z\s]/g, "")
                setFormData({ ...formData, name: value })
              }}
              onKeyDown={(e) => {
                // Prevent numbers and special characters
                if (/[0-9]/.test(e.key)) {
                  e.preventDefault()
                }
              }}
              placeholder="Enter owner name"
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
              onChange={handlePhoneChange}
              onKeyDown={(e) => {
                if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '.') {
                  e.preventDefault()
                }
              }}
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
              onChange={handleCNICChange}
              onKeyDown={(e) => {
                if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '.') {
                  e.preventDefault()
                }
              }}
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
              onChange={handleContactNumberChange}
              onKeyDown={(e) => {
                if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '.') {
                  e.preventDefault()
                }
              }}
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
            <Label htmlFor="ownerId">Owner ID</Label>
            <Input
              id="ownerId"
              value={formData.ownerId}
              onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
              placeholder="Enter owner ID (e.g., OWN-001)"
              required
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Updating..." : "Update Owner"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
