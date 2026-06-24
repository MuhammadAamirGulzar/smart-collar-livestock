import { NextRequest, NextResponse } from "next/server";
import { getReadingsByTimeRange } from "@/lib/readingService";
import { getAnimalsByFarm } from "@/lib/animalService";
import type { Reading } from "@/lib/readingService";
import type { Animal } from "@/lib/types";
import { randomUUID } from "crypto";

// Load the latest pkl from the repo path (server-only)
// NOTE: This uses Python inference in-process is not feasible with pkl.
// Instead, we approximate activityLevel/status from Firestore latest reading category.

function latestReadingForAnimal(readings: Reading[]) {
  if (readings.length === 0) return null;
  return readings
    .slice()
    .sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis())
    .at(-1);
}

function activityFromCategory(category?: string): Animal["activityLevel"] {
  const c = (category ?? "").toLowerCase();
  if (c === "walking" || c === "eating") return "high";
  if (c === "resting" || c === "rumination" || c === "grazing") return "normal";
  return "low";
}

function statusFromLatestCategory(category?: string): Animal["status"] {
  const c = (category ?? "").toLowerCase();
  // Simple rule: if latest category looks "resting/rumination/grazing" -> healthy else sick.
  // If your ML output provides a better label mapping, replace this mapping.
  const healthyCats = new Set(["resting", "rumination", "grazing"]);
  return healthyCats.has(c) ? "healthy" : "sick";
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const farmId: string | undefined = body?.farmId;
  if (!farmId) {
    return NextResponse.json({ error: "farmId is required" }, { status: 400 });
  }

  const animals = await getAnimalsByFarm(farmId);

  // For each animal, fetch readings in a small recent window.
  // Latest reading is what you asked for.
  const now = Date.now();
  const start = new Date(now - 1000 * 60 * 60 * 24 * 30); // last 30 days

  const results: Array<{
    animalId: string;
    activityLevel?: Animal["activityLevel"];
    status: Animal["status"];
    latestCategory?: string;
  }> = [];

  await Promise.all(
    animals.map(async (a) => {
      const readings = await getReadingsByTimeRange(a.animalId, start, now);
      const latest = latestReadingForAnimal(readings);
      const latestCategory = latest?.category;
      const activityLevel = activityFromCategory(String(latestCategory));
      const status = statusFromLatestCategory(String(latestCategory));
      results.push({
        animalId: a.animalId,
        activityLevel,
        status,
        latestCategory: latestCategory,
      });
    }),
  );

  return NextResponse.json({ results });
}

