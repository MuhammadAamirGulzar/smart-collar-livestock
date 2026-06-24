import { NextResponse } from "next/server"
import { readFileSync, existsSync } from "fs"
import { join } from "path"

async function getAccessToken(): Promise<string> {
  const keyPath = join(process.cwd(), "serviceAccountKey.json")
  if (!existsSync(keyPath)) {
    throw new Error("serviceAccountKey.json not found")
  }
  const sa = JSON.parse(readFileSync(keyPath, "utf-8"))

  const now = Math.floor(Date.now() / 1000)
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url")
  const payload = Buffer.from(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/firebase https://www.googleapis.com/auth/cloud-platform",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  ).toString("base64url")

  const crypto = await import("crypto")
  const sign = crypto.createSign("RSA-SHA256")
  sign.update(`${header}.${payload}`)
  const signature = sign.sign(sa.private_key, "base64url")
  const jwt = `${header}.${payload}.${signature}`

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  })
  if (!tokenRes.ok) {
    throw new Error(`Token exchange failed: ${await tokenRes.text()}`)
  }
  const tokenData = await tokenRes.json()
  return tokenData.access_token
}

export async function POST() {
  const logs: string[] = []
  try {
    const keyPath = join(process.cwd(), "serviceAccountKey.json")
    const sa = JSON.parse(readFileSync(keyPath, "utf-8"))
    const projectId = sa.project_id

    const rulesPath = join(process.cwd(), "firestore.rules")
    if (!existsSync(rulesPath)) {
      throw new Error("firestore.rules not found in project root")
    }
    const rulesSource = readFileSync(rulesPath, "utf-8")
    logs.push(`Read firestore.rules (${rulesSource.length} chars)`)

    const accessToken = await getAccessToken()
    logs.push("Obtained access token")

    // Step 1: Create a new ruleset
    const createRes = await fetch(
      `https://firebaserules.googleapis.com/v1/projects/${projectId}/rulesets`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source: {
            files: [{ name: "firestore.rules", content: rulesSource }],
          },
        }),
      },
    )
    if (!createRes.ok) {
      const errText = await createRes.text()
      throw new Error(`Failed to create ruleset: ${errText}`)
    }
    const ruleset = await createRes.json()
    const rulesetName = ruleset.name
    logs.push(`Created ruleset: ${rulesetName}`)

    // Step 2: Release the ruleset — try update first, then create if not found
    const releaseName = `projects/${projectId}/releases/cloud.firestore`
    let releaseRes = await fetch(
      `https://firebaserules.googleapis.com/v1/${releaseName}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          release: { name: releaseName, rulesetName },
        }),
      },
    )
    if (releaseRes.status === 404) {
      logs.push("No existing release found, creating new one...")
      releaseRes = await fetch(
        `https://firebaserules.googleapis.com/v1/projects/${projectId}/releases`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: releaseName,
            rulesetName,
          }),
        },
      )
    }
    if (!releaseRes.ok) {
      const errText = await releaseRes.text()
      throw new Error(`Failed to release ruleset: ${errText}`)
    }
    logs.push("Released ruleset to cloud.firestore — rules are now live!")

    return NextResponse.json({ success: true, logs })
  } catch (err) {
    logs.push(`ERROR: ${err instanceof Error ? err.message : String(err)}`)
    return NextResponse.json({ success: false, logs }, { status: 500 })
  }
}
