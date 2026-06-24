"use client"

import { useState } from "react"
import type { User } from "@/lib/types"
import { GlassmorphicCard } from "@/components/ui/glassmorphic-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Pencil, Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface OwnersManagementTableProps {
  owners: User[]
  onUpdate: (owner: User) => void
  onDelete: (ownerId: string) => void
}

export function OwnersManagementTable({ owners, onUpdate, onDelete }: OwnersManagementTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [ownerToDelete, setOwnerToDelete] = useState<string | null>(null)

  // Filter owners based on search term
  const filteredOwners = owners.filter((owner) => {
    const searchLower = searchTerm.toLowerCase()
    
    return (
      owner.name.toLowerCase().includes(searchLower) ||
      owner.phone?.toLowerCase().includes(searchLower) ||
      owner.cnic?.toLowerCase().includes(searchLower) ||
      owner.ownerId?.toLowerCase().includes(searchLower) ||
      owner.address?.toLowerCase().includes(searchLower)
    )
  })

  const handleDeleteClick = (ownerId: string) => {
    setOwnerToDelete(ownerId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (ownerToDelete) {
      onDelete(ownerToDelete)
      setDeleteDialogOpen(false)
      setOwnerToDelete(null)
    }
  }

  return (
    <>
      <GlassmorphicCard>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Owners List</h2>
          <Input
            placeholder="Search owners..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-white/20 dark:border-white/10">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Owner Name</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Phone</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">CNIC</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Contact Number</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Address</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Owner ID</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOwners.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    No owners found
                  </td>
                </tr>
              ) : (
                filteredOwners.map((owner) => (
                  <tr key={owner.id} className="border-b border-white/10 dark:border-white/5 hover:bg-white/5">
                    <td className="py-3 px-4 font-medium text-foreground">{owner.name}</td>
                    <td className="py-3 px-4 text-foreground">{owner.phone || "N/A"}</td>
                    <td className="py-3 px-4 text-foreground">{owner.cnic || "N/A"}</td>
                    <td className="py-3 px-4 text-foreground">{owner.contactNumber || "N/A"}</td>
                    <td className="py-3 px-4 text-foreground">{owner.address || "N/A"}</td>
                    <td className="py-3 px-4 text-foreground">{owner.ownerId || "N/A"}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onUpdate(owner)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClick(owner.id)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassmorphicCard>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the owner and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
