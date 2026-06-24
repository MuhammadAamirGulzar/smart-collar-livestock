"use client"

import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export function MountingBehaviorView() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-12">
      
      {/* Section Header */}
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight">Mounting Behavior Analysis</h2>
        <p className="text-muted-foreground">
          Analysis of acceleration magnitude (ACC_MAG) during mounting/estrus activity.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cow 1 */}
        <Card>
          <CardHeader>
            <CardTitle>Cow #001</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-[16/9] w-full border rounded-lg overflow-hidden bg-white">
              <Image 
                src="/behaviors/mount-cow1.jpeg" 
                alt="Cow 1 Mounting Graph" 
                fill 
                className="object-contain" 
              />
            </div>
          </CardContent>
        </Card>

        {/* Cow 2 */}
        <Card>
          <CardHeader>
            <CardTitle>Cow #002</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-[16/9] w-full border rounded-lg overflow-hidden bg-white">
              <Image 
                src="/behaviors/mount-cow2.jpeg" 
                alt="Cow 2 Mounting Graph" 
                fill 
                className="object-contain" 
              />
            </div>
          </CardContent>
        </Card>

      </div>

      {/* COMBINED GRAPH - Rose/Red Theme for Mounting/Estrus */}
      <Card className="border-rose-100 shadow-md">
        <CardHeader className="bg-rose-50/50">
          <CardTitle className="text-rose-900">Herd Mounting Overview (All Cows)</CardTitle>
          <CardDescription className="text-rose-700/80">Combined population mounting distribution</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="relative aspect-[21/9] w-full border rounded-lg overflow-hidden bg-white">
            <Image 
              src="/behaviors/mount-all.jpeg" 
              alt="All Cows Mounting Graph" 
              fill 
              className="object-contain" 
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}