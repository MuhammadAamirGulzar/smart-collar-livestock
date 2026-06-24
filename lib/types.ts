export type UserRole = "superadmin" | "owner" | "executive-manager"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  farmId?: string // for owner and executive-manager
  status?: "active" | "inactive"
  phone?: string
  cnic?: string
  contactNumber?: string
  address?: string
  ownerId?: string
}

export interface Farm {
  id: string
  name: string
  location: string
  size: number // in acres
  createdAt: string
  ownerId?: string
  totalCows?: number
  totalActiveCollars?: number
  totalInactiveCollars?: number
}

export interface Animal {
  id: string
  farmId: string
  name: string
  type: "cattle" | "sheep" | "goat" | "pig" | "chicken"
  age: number
  weight: number
  status: "healthy" | "sick" | "treated" | "quarantined"
  inEstrus?: boolean
  collarId?: string
  breed?: string
  currentTemperature?: number
  activityLevel?: "low" | "normal" | "high"
  averageTemperature?: number
}

export interface HealthRecord {
  id: string
  animalId: string
  collarId: string
  date: string
  notes: string
  treatment?: string
  veterinarian?: string
}

export interface Employee {
  id: string
  farmId: string
  name: string
  email: string
  phone?: string
  role: "executive-manager" | "worker"
  joinDate: string
}
