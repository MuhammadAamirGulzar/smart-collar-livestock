"use client"

import { useState } from "react"
import type { Farm, User } from "@/lib/types"
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

interface FarmsManagementTableProps {
  farms: Farm[]
  users: User[]
  onUpdate: (farm: Farm) => void
  onDelete: (farmId: string) => void
}

export function FarmsManagementTable({ farms, users, onUpdate, onDelete }: FarmsManagementTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [farmToDelete, setFarmToDelete] = useState<string | null>(null)

  // Filter farms based on search term
  const filteredFarms = farms.filter((farm) => {
    const owner = users.find((u) => u.id === farm.ownerId)
    const searchLower = searchTerm.toLowerCase()
    
    return (
      farm.name.toLowerCase().includes(searchLower) ||
      farm.location.toLowerCase().includes(searchLower) ||
      owner?.name.toLowerCase().includes(searchLower)
    )
  })

  const handleDeleteClick = (farmId: string) => {
    setFarmToDelete(farmId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (farmToDelete) {
      onDelete(farmToDelete)
      setDeleteDialogOpen(false)
      setFarmToDelete(null)
    }
  }

  return (
    <>
      <GlassmorphicCard>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">All Farms</h2>
          <Input
            placeholder="Search farms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-white/20 dark:border-white/10">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Farm Name</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Owner Name</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Location</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Total Cows</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Active Collars</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Inactive Collars</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFarms.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    No farms found
                  </td>
                </tr>
              ) : (
                filteredFarms.map((farm) => {
                  const owner = users.find((u) => u.id === farm.ownerId)
                  
                  return (
                    <tr key={farm.id} className="border-b border-white/10 dark:border-white/5 hover:bg-white/5">
                      <td className="py-3 px-4 font-medium text-foreground">{farm.name}</td>
                      <td className="py-3 px-4 text-foreground">{owner?.name || "N/A"}</td>
                      <td className="py-3 px-4 text-foreground">{farm.location}</td>
                      <td className="py-3 px-4 text-foreground">{farm.totalCows || 0}</td>
                      <td className="py-3 px-4 text-foreground">{farm.totalActiveCollars || 0}</td>
                      <td className="py-3 px-4 text-foreground">{farm.totalInactiveCollars || 0}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onUpdate(farm)}
                            className="h-8 w-8 p-0"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(farm.id)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
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
              This action cannot be undone. This will permanently delete the farm and all associated data.
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

