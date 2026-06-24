"use client"

import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export function RestingBehaviorView() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight">Resting Behavior Analysis</h2>
        <p className="text-muted-foreground">
          Analysis of acceleration magnitude (ACC_MAG) during resting periods.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cow 1 (.jpeg) */}
        <Card>
          <CardHeader>
            <CardTitle>Cow #001</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-[16/9] w-full border rounded-lg overflow-hidden bg-white">
              <Image 
                src="/behaviors/rest-cow1.jpeg" 
                alt="Cow 1 Graph" 
                fill 
                className="object-contain" 
              />
            </div>
          </CardContent>
        </Card>

        {/* Cow 2 (.png) - THIS WAS THE ISSUE */}
        <Card>
          <CardHeader>
            <CardTitle>Cow #002</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-[16/9] w-full border rounded-lg overflow-hidden bg-white">
              <Image 
                src="/behaviors/rest-cow2.jpeg" 
                alt="Cow 2 Graph" 
                fill 
                className="object-contain" 
              />
            </div>
          </CardContent>
        </Card>

        {/* Cow 3 (.jpeg) */}
        <Card>
          <CardHeader>
            <CardTitle>Cow #003</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-[16/9] w-full border rounded-lg overflow-hidden bg-white">
              <Image 
                src="/behaviors/rest-cow3.jpeg" 
                alt="Cow 3 Graph" 
                fill 
                className="object-contain" 
              />
            </div>
          </CardContent>
        </Card>

        {/* Cow 4 (.jpeg) */}
        <Card>
          <CardHeader>
            <CardTitle>Cow #004</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-[16/9] w-full border rounded-lg overflow-hidden bg-white">
              <Image 
                src="/behaviors/rest-cow4.jpeg" 
                alt="Cow 4 Graph" 
                fill 
                className="object-contain" 
              />
            </div>
          </CardContent>
        </Card>
      </div>

       {/* Cow 5 (.jpeg) */}
        <Card>
          <CardHeader>
            <CardTitle>Cow #005</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-[16/9] w-full border rounded-lg overflow-hidden bg-white">
              <Image 
                src="/behaviors/rest-cow5.jpeg" 
                alt="Cow 5 Graph" 
                fill 
                className="object-contain" 
              />
            </div>
          </CardContent>
        </Card>

      {/* COMBINED GRAPH (.jpeg) */}
      <Card className="border-indigo-100 shadow-md">
        <CardHeader className="bg-indigo-50/50">
          <CardTitle className="text-indigo-900">Herd Overview (All Cows)</CardTitle>
          <CardDescription>Combined population distribution</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="relative aspect-[21/9] w-full border rounded-lg overflow-hidden bg-white">
            <Image 
              src="/behaviors/rest-all.jpeg" 
              alt="All Cows Graph" 
              fill 
              className="object-contain" 
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}