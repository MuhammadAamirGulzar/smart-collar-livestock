import type { Farm, User } from "@/lib/types"
import { GlassmorphicCard } from "@/components/ui/glassmorphic-card"

interface FarmsTableProps {
  farms: Farm[]
  users?: User[]
}

export function FarmsTable({ farms, users = [] }: FarmsTableProps) {
  return (
    <GlassmorphicCard>
      <h2 className="text-lg font-semibold mb-4 text-foreground">Farms</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-white/20 dark:border-white/10">
            <tr>
              <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Name</th>
              <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Owner Name</th>
              <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Location</th>
              <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Total Cows</th>
              <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Total Active Collars</th>
              <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Created</th>
            </tr>
          </thead>
          <tbody>
            {farms.map((farm) => {
              const owner = users.find((u) => u.id === farm.ownerId)
              
              return (
                <tr key={farm.id} className="border-b border-white/10 dark:border-white/5 hover:bg-white/5">
                  <td className="py-3 px-4 font-medium text-foreground">{farm.name}</td>
                  <td className="py-3 px-4 text-foreground">{owner?.name || "N/A"}</td>
                  <td className="py-3 px-4 text-foreground">{farm.location}</td>
                  <td className="py-3 px-4 text-foreground">{farm.totalCows || 0}</td>
                  <td className="py-3 px-4 text-foreground">{farm.totalActiveCollars || 0}</td>
                  <td className="py-3 px-4 text-muted-foreground">{new Date(farm.createdAt).toLocaleDateString()}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </GlassmorphicCard>
  )
}
