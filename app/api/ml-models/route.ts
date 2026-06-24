import fs from 'node:fs'
import path from 'node:path'

export async function GET() {
  try {
    const dir = path.join(process.cwd(), 'app', 'ml-api')
    const entries = await fs.promises.readdir(dir)

    const pkls = entries.filter((n) => n.toLowerCase().endsWith('.pkl'))

    // Only return filenames; the UI just needs to display which models exist.
    return Response.json({
      models: pkls.map((file) => ({
        file,
        // Simple display name mapping (best-effort)
        type: file === 'model.pkl' ? 'LSTM' : file.toLowerCase().includes('metric') ? 'Static' : 'Model',
      })),
    })
  } catch (e) {
    return Response.json({ models: [], error: 'Failed to read models folder' }, { status: 500 })
  }
}

