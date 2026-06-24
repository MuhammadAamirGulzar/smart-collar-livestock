"use client"

import { useState } from "react"

type SetupStep = "users" | "data"

function StepCard({
  title,
  description,
  buttonLabel,
  endpoint,
  disabled,
}: {
  title: string
  description: string
  buttonLabel: string
  endpoint: string
  disabled?: boolean
}) {
  const [logs, setLogs] = useState<string[]>([])
  const [running, setRunning] = useState(false)
  const [success, setSuccess] = useState<boolean | null>(null)

  const run = async () => {
    setRunning(true)
    setLogs(["Calling server..."])
    setSuccess(null)

    try {
      const res = await fetch(endpoint, { method: "POST" })
      const data = await res.json()
      setLogs(data.logs ?? ["No logs returned."])
      setSuccess(data.success ?? false)
    } catch (err) {
      setLogs((prev) => [
        ...prev,
        `Network error: ${err instanceof Error ? err.message : String(err)}`,
      ])
      setSuccess(false)
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-bold mb-1">{title}</h2>
      <p className="text-gray-500 text-sm mb-4">{description}</p>

      <button
        onClick={run}
        disabled={running || disabled}
        className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
      >
        {running ? "Running..." : buttonLabel}
      </button>

      {logs.length > 0 && (
        <pre
          className={`mt-4 p-4 text-xs rounded-lg overflow-auto max-h-64 whitespace-pre-wrap ${
            success === true
              ? "bg-gray-900 text-green-400"
              : success === false
                ? "bg-gray-900 text-red-400"
                : "bg-gray-900 text-yellow-300"
          }`}
        >
          {logs.join("\n")}
        </pre>
      )}
    </div>
  )
}

export default function SetupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
      <div className="max-w-lg w-full space-y-6">
        <div className="text-center mb-2">
          <h1 className="text-2xl font-bold">One-Time Project Setup</h1>
          <p className="text-gray-500 text-sm mt-1">
            Requires <code className="bg-gray-100 px-1 rounded">serviceAccountKey.json</code> in project root.
            Delete <code className="bg-gray-100 px-1 rounded">app/setup-users/</code> and{" "}
            <code className="bg-gray-100 px-1 rounded">app/api/</code> routes when done.
          </p>
        </div>

        <StepCard
          title="Step 0 — Deploy Firestore Rules"
          description="Deploys the security rules from firestore.rules to your Firebase project. Required for Firestore reads/writes to work."
          buttonLabel="Deploy Firestore Rules"
          endpoint="/api/deploy-rules"
        />

        <StepCard
          title="Step 1 — Create User Profiles"
          description="Signs in each user from users.md and creates their Firestore profiles (users, farm_owners, executive_managers collections)."
          buttonLabel="Create User Profiles"
          endpoint="/api/setup-users"
        />

        <StepCard
          title="Step 2 — Seed Farm Data"
          description="Creates farms, animals, and sample sensor readings in Firestore. Links farms to the owner and assigns the manager."
          buttonLabel="Seed Farms, Animals & Readings"
          endpoint="/api/seed-data"
        />
      </div>
    </div>
  )
}
