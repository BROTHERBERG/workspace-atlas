import * as fs from 'fs'
import * as path from 'path'
import { RadarSignal } from './types'

const RADAR_DIR = path.join(process.cwd(), 'data', 'radar')
const SIGNALS_FILE = path.join(RADAR_DIR, 'signals.json')

export function radarDir(): string {
  if (!fs.existsSync(RADAR_DIR)) fs.mkdirSync(RADAR_DIR, { recursive: true })
  return RADAR_DIR
}

export function loadSignals(): RadarSignal[] {
  if (!fs.existsSync(SIGNALS_FILE)) return []
  try {
    return JSON.parse(fs.readFileSync(SIGNALS_FILE, 'utf-8'))
  } catch {
    return []
  }
}

export function saveSignals(signals: RadarSignal[]): void {
  radarDir()
  fs.writeFileSync(SIGNALS_FILE, JSON.stringify(signals, null, 2))
}

/**
 * Merge a fresh scan into the existing store.
 *
 * - New ids are added with firstSeen = now.
 * - Existing ids get lastSeen = now and status reset to active.
 * - Existing job postings that were NOT seen this scan are marked closed,
 *   but ONLY if the board they came from responded successfully this run
 *   (a fetch failure must never look like "all their jobs closed").
 * - News signals are never auto-closed; they age out by date in the UI.
 */
export function mergeScan(
  existing: RadarSignal[],
  fresh: RadarSignal[],
  succeededBoardPrefixes: string[],
  now: string
): { merged: RadarSignal[]; added: number; closed: number; refreshed: number } {
  const byId = new Map(existing.map((s) => [s.id, s]))
  const freshIds = new Set(fresh.map((s) => s.id))
  let added = 0
  let refreshed = 0

  for (const signal of fresh) {
    const prior = byId.get(signal.id)
    if (prior) {
      byId.set(signal.id, { ...prior, ...signal, firstSeen: prior.firstSeen, lastSeen: now, status: 'active' })
      refreshed++
    } else {
      byId.set(signal.id, { ...signal, firstSeen: now, lastSeen: now, status: 'active' })
      added++
    }
  }

  let closed = 0
  for (const [id, signal] of byId) {
    if (signal.type !== 'job_posting' || signal.status === 'closed' || freshIds.has(id)) continue
    const boardScanned = succeededBoardPrefixes.some((prefix) => id.startsWith(prefix))
    if (boardScanned) {
      byId.set(id, { ...signal, status: 'closed' })
      closed++
    }
  }

  return { merged: Array.from(byId.values()), added, closed, refreshed }
}
