"use client"

import type { Animal } from "@/lib/types"
import { GlassmorphicCard } from "@/components/ui/glassmorphic-card"
import { 
  Beef, 
  Calendar, 
  Weight, 
  Activity, 
  Tag, 
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldAlert
} from "lucide-react"
import { cn } from "@/lib/utils"

interface AnimalsTableProps {
  animals: Animal[]
}

// Modernized Status Colors with Borders and subtle gradients
function getStatusColor(status: string): string {
  switch (status) {
    case "healthy":
      return "bg-emerald-100/80 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30"
    case "sick":
      return "bg-rose-100/80 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30"
    case "treated":
      return "bg-amber-100/80 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30"
    case "quarantined":
      return "bg-purple-100/80 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30"
    default:
      return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
  }
}

// Helper to get a cute icon for the status
function getStatusIcon(status: string) {
  switch (status) {
    case "healthy": return <CheckCircle2 size={14} className="mr-1.5" />
    case "sick": return <AlertCircle size={14} className="mr-1.5" />
    case "treated": return <Clock size={14} className="mr-1.5" />
    case "quarantined": return <ShieldAlert size={14} className="mr-1.5" />
    default: return <HelpCircle size={14} className="mr-1.5" />
  }
}

export function AnimalsTable({ animals }: AnimalsTableProps) {
  return (
    <GlassmorphicCard className="overflow-hidden p-0 border-0 shadow-xl">
      {/* Header Section */}
      <div className="p-6 border-b border-gray-100 dark:border-white/5 bg-gradient-to-r from-white/50 to-transparent dark:from-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-lg text-emerald-600 dark:text-emerald-400">
            <Beef size={20} />
          </div>
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">Livestock Inventory</h2>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          {/* Table Head */}
          <thead className="bg-gray-50/80 dark:bg-slate-900/40 text-xs uppercase font-bold text-gray-500 dark:text-gray-400 tracking-wider">
            <tr>
              <th className="py-4 px-6">
                <div className="flex items-center gap-2"><Tag size={14} /> Name</div>
              </th>
              <th className="py-4 px-6">
                <div className="flex items-center gap-2"><Beef size={14} /> Type</div>
              </th>
              <th className="py-4 px-6">
                <div className="flex items-center gap-2"><Calendar size={14} /> Age</div>
              </th>
              <th className="py-4 px-6">
                <div className="flex items-center gap-2"><Weight size={14} /> Weight</div>
              </th>
              <th className="py-4 px-6">
                <div className="flex items-center gap-2"><Activity size={14} /> Status</div>
              </th>
            </tr>
          </thead>
          
          {/* Table Body */}
          <tbody className="divide-y divide-gray-100 dark:divide-white/5 bg-white/40 dark:bg-transparent backdrop-blur-sm">
            {animals.map((animal) => (
              <tr 
                key={animal.id} 
                className="group hover:bg-emerald-50/50 dark:hover:bg-white/5 transition-colors duration-200"
              >
                <td className="py-4 px-6 font-bold text-gray-700 dark:text-gray-200">
                  {animal.name}
                </td>
                <td className="py-4 px-6">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300 capitalize border border-gray-200 dark:border-white/10">
                    {animal.type}
                  </span>
                </td>
                <td className="py-4 px-6 text-gray-600 dark:text-gray-400 font-mono">
                  {animal.age} <span className="text-xs text-gray-400">yrs</span>
                </td>
                <td className="py-4 px-6 text-gray-600 dark:text-gray-400 font-mono">
                  {animal.weight} <span className="text-xs text-gray-400">kg</span>
                </td>
                <td className="py-4 px-6">
                  <span className={cn(
                    "inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border shadow-sm transition-all",
                    getStatusColor(animal.status)
                  )}>
                    {getStatusIcon(animal.status)}
                    <span className="capitalize">{animal.status}</span>
                  </span>
                </td>
              </tr>
            ))}
            
            {animals.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-gray-400 dark:text-gray-500">
                  No animals found in records.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </GlassmorphicCard>
  )
}