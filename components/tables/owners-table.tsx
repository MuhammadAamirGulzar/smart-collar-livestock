import type { User, Farm, Animal } from "@/lib/types"
import { GlassmorphicCard } from "@/components/ui/glassmorphic-card"
import { Badge } from "@/components/ui/badge"

interface OwnersTableProps {
  users: User[]
  farms: Farm[]
  animals: Animal[]
}

export function OwnersTable({ users, farms, animals }: OwnersTableProps) {
  // Filter to get only owners
  const owners = users.filter((user) => user.role === "owner")

  return (
    <GlassmorphicCard>
      <h2 className="text-lg font-semibold mb-4 text-foreground">Users / Owners</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-white/20 dark:border-white/10">
            <tr>
              <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Owner Name</th>
              <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Farm Name</th>
              <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Total Animals</th>
              <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {owners.map((owner) => {
              const farm = farms.find((f) => f.id === owner.farmId)
              const farmAnimals = animals.filter((a) => a.farmId === owner.farmId)
              
              return (
                <tr key={owner.id} className="border-b border-white/10 dark:border-white/5 hover:bg-white/5">
                  <td className="py-3 px-4 font-medium text-foreground">{owner.name}</td>
                  <td className="py-3 px-4 text-foreground">{farm?.name || "N/A"}</td>
                  <td className="py-3 px-4 text-foreground">{farmAnimals.length}</td>
                  <td className="py-3 px-4">
                    <Badge variant={owner.status === "active" ? "default" : "secondary"}>
                      {owner.status === "active" ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </GlassmorphicCard>
  )
}
