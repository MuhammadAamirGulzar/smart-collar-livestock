"use client"

import { useState } from "react"
import type { HealthRecord } from "@/lib/types"
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

interface HealthRecordsManagementTableProps {
  healthRecords: HealthRecord[]
  onUpdate: (record: HealthRecord) => void
  onDelete: (recordId: string) => void
}

export function HealthRecordsManagementTable({ healthRecords, onUpdate, onDelete }: HealthRecordsManagementTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null)

  // Filter health records based on search term
  const filteredRecords = healthRecords.filter((record) => {
    const searchLower = searchTerm.toLowerCase()
    
    return (
      record.collarId.toLowerCase().includes(searchLower) ||
      record.notes.toLowerCase().includes(searchLower) ||
      record.treatment?.toLowerCase().includes(searchLower) ||
      record.veterinarian?.toLowerCase().includes(searchLower)
    )
  })

  const handleDeleteClick = (recordId: string) => {
    setRecordToDelete(recordId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (recordToDelete) {
      onDelete(recordToDelete)
      setDeleteDialogOpen(false)
      setRecordToDelete(null)
    }
  }

  return (
    <>
      <GlassmorphicCard>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Health Records</h2>
          <Input
            placeholder="Search records..."
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
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Notes</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Treatment</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Veterinarian Name</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    No health records found
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="border-b border-white/10 dark:border-white/5 hover:bg-white/5">
                    <td className="py-3 px-4 font-medium text-foreground">{record.collarId}</td>
                    <td className="py-3 px-4 text-foreground">{record.notes}</td>
                    <td className="py-3 px-4 text-foreground">{record.treatment || "N/A"}</td>
                    <td className="py-3 px-4 text-foreground">{record.veterinarian || "N/A"}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onUpdate(record)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteClick(record.id)}
                          className="h-8 w-8 p-0"
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
              This action cannot be undone. This will permanently delete the health record.
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

