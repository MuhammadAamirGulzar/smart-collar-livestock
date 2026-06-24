import { GlassmorphicCard } from "@/components/ui/glassmorphic-card"
import type { Animal } from "@/lib/types"

interface AnimalDetailProps {
  animal: Animal
}

export function AnimalDetail({ animal }: AnimalDetailProps) {
  return (
    <GlassmorphicCard>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{animal.name}</h1>
          <p className="text-muted-foreground mt-1 capitalize">{animal.type}</p>
        </div>
        <div
          className={`px-4 py-2 rounded-full font-semibold text-sm capitalize ${
            animal.status === "healthy"
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              : animal.status === "sick"
                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
          }`}
        >
          {animal.status}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Age</p>
          <p className="text-2xl font-bold text-foreground">{animal.age}</p>
          <p className="text-xs text-muted-foreground">years</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-1">Weight</p>
          <p className="text-2xl font-bold text-foreground">{animal.weight}</p>
          <p className="text-xs text-muted-foreground">kg</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-1">Type</p>
          <p className="text-2xl font-bold text-foreground capitalize">{animal.type}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-1">ID</p>
          <p className="text-lg font-mono text-foreground">{animal.id}</p>
        </div>
      </div>
    </GlassmorphicCard>
  )
}
