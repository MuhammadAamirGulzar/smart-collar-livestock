"use client"

import { useState } from "react"
import type { Animal } from "@/lib/types"
import { GlassmorphicCard } from "@/components/ui/glassmorphic-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Trash2 } from "lucide-react"
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

interface AnimalsManagementTableProps {
  animals: Animal[]
  onDelete: (animalId: string) => void
}

export function AnimalsManagementTable({ animals, onDelete }: AnimalsManagementTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [animalToDelete, setAnimalToDelete] = useState<string | null>(null)

  // Filter animals based on search term
  const filteredAnimals = animals.filter((animal) => {
    const searchLower = searchTerm.toLowerCase()
    
    return (
      animal.collarId?.toLowerCase().includes(searchLower) ||
      animal.breed?.toLowerCase().includes(searchLower) ||
      animal.status.toLowerCase().includes(searchLower) ||
      animal.activityLevel?.toLowerCase().includes(searchLower)
    )
  })

  const handleDeleteClick = (animalId: string) => {
    setAnimalToDelete(animalId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (animalToDelete) {
      onDelete(animalToDelete)
      setDeleteDialogOpen(false)
      setAnimalToDelete(null)
    }
  }

  const getActivityLevelColor = (level?: string) => {
    switch (level) {
      case "low":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "normal":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "high":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  return (
    <>
      <GlassmorphicCard>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Animals</h2>
          <Input
            placeholder="Search animals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-white/20 dark:border-white/10">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Collar ID</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Age</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Breed</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Activity Level</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Remove</th>
              </tr>
            </thead>
            <tbody>
              {filteredAnimals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    No animals found
                  </td>
                </tr>
              ) : (
                filteredAnimals.map((animal) => (
                  <tr key={animal.id} className="border-b border-white/10 dark:border-white/5 hover:bg-white/5">
                    <td className="py-3 px-4 font-medium text-foreground">{animal.collarId || "N/A"}</td>
                    <td className="py-3 px-4 text-foreground">{animal.age} yrs</td>
                    <td className="py-3 px-4 text-foreground">{animal.breed || "N/A"}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${getActivityLevelColor(animal.activityLevel)}`}>
                        {animal.activityLevel || "N/A"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={animal.status === "healthy" ? "default" : "destructive"}>
                        {animal.status === "healthy" ? "Healthy" : "Unhealthy"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteClick(animal.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
              This action cannot be undone. This will permanently delete the animal and all associated data.
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

