"use client"

import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export function EatingBehaviorView() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-12">
      
      {/* Section Header */}
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight">Eating Behavior Analysis</h2>
        <p className="text-muted-foreground">
          Analysis of acceleration magnitude (ACC_MAG) during feeding periods.
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
                src="/behaviors/eat-cow1.jpeg" 
                alt="Cow 1 Eating Graph" 
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
                src="/behaviors/eat-cow2.jpeg" 
                alt="Cow 2 Eating Graph" 
                fill 
                className="object-contain" 
              />
            </div>
          </CardContent>
        </Card>

        {/* Cow 3 */}
        <Card>
          <CardHeader>
            <CardTitle>Cow #003</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-[16/9] w-full border rounded-lg overflow-hidden bg-white">
              <Image 
                src="/behaviors/eat-cow3.jpeg" 
                alt="Cow 3 Eating Graph" 
                fill 
                className="object-contain" 
              />
            </div>
          </CardContent>
        </Card>

        {/* Cow 4 */}
        <Card>
          <CardHeader>
            <CardTitle>Cow #004</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-[16/9] w-full border rounded-lg overflow-hidden bg-white">
              <Image 
                src="/behaviors/eat-cow4.jpeg" 
                alt="Cow 4 Eating Graph" 
                fill 
                className="object-contain" 
              />
            </div>
          </CardContent>
        </Card>

        {/* Cow 5 */}
        <Card>
          <CardHeader>
            <CardTitle>Cow #005</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-[16/9] w-full border rounded-lg overflow-hidden bg-white">
              <Image 
                src="/behaviors/eat-cow5.jpeg" 
                alt="Cow 5 Eating Graph" 
                fill 
                className="object-contain" 
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* COMBINED GRAPH - Amber Theme for Eating */}
      <Card className="border-amber-100 shadow-md">
        <CardHeader className="bg-amber-50/50">
          <CardTitle className="text-amber-900">Herd Eating Overview (All Cows)</CardTitle>
          <CardDescription className="text-amber-700/80">Combined population feeding distribution</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="relative aspect-[21/9] w-full border rounded-lg overflow-hidden bg-white">
            <Image 
              src="/behaviors/eat-all.jpeg" 
              alt="All Cows Eating Graph" 
              fill 
              className="object-contain" 
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}