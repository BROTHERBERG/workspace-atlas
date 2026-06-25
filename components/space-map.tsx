"use client"

import { useEffect, useRef } from "react"
import "leaflet/dist/leaflet.css"

export interface MapPoint {
  id: number
  name: string
  slug: string
  lat: number
  lng: number
  band: string
  score: number | null
  web: boolean
  talent: boolean
  hiringNow: boolean
  neighborhood: string | null
  city: string
}

const BAND_HEX: Record<string, string> = {
  A: "#10b981",
  B: "#84cc16",
  C: "#f9cb16",
  D: "#f97316",
  F: "#ef4444",
  "?": "#9ca3af",
}

// Calgary downtown — the default view (most spaces cluster here)
const CALGARY: [number, number] = [51.045, -114.062]

function esc(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string))
}

// rough great-circle distance in km
function distKm(a: [number, number], b: [number, number]) {
  const R = 6371
  const dLat = ((b[0] - a[0]) * Math.PI) / 180
  const dLng = ((b[1] - a[1]) * Math.PI) / 180
  const la1 = (a[0] * Math.PI) / 180
  const la2 = (b[0] * Math.PI) / 180
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(x))
}

export default function SpaceMap({
  points,
  center,
  zoom,
}: {
  points: MapPoint[]
  center?: [number, number]
  zoom?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const mapRef = useRef<unknown>(null)

  useEffect(() => {
    if (!ref.current || mapRef.current) return
    let cancelled = false
    ;(async () => {
      const L = (await import("leaflet")).default
      if (cancelled || !ref.current) return
      const map = L.map(ref.current, { scrollWheelZoom: true }).setView(
        center ?? CALGARY,
        center ? zoom ?? 11 : 12,
      )
      mapRef.current = map
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: "&copy; OpenStreetMap &copy; CARTO",
        maxZoom: 19,
      }).addTo(map)

      for (const p of points) {
        const color = BAND_HEX[p.band] || BAND_HEX["?"]
        const marker = L.circleMarker([p.lat, p.lng], {
          radius: 8,
          color: "#000",
          weight: 1.5,
          fillColor: color,
          fillOpacity: 0.95,
        }).addTo(map)
        const tags = [
          p.web ? '<span style="color:#fb923c;font-weight:600">web-services lead</span>' : "",
          p.hiringNow ? '<span style="color:#eab308;font-weight:600">hiring now</span>' : p.talent ? '<span style="color:#9ca3af">talent signal</span>' : "",
        ].filter(Boolean).join(" · ")
        marker.bindPopup(
          `<div style="font-family:ui-sans-serif,system-ui;min-width:180px">
             <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
               <strong style="font-size:13px">${esc(p.name)}</strong>
               <span style="background:${color};color:#000;border:1px solid #000;border-radius:4px;padding:1px 5px;font-weight:700;font-size:12px">${p.band} ${p.score ?? "—"}</span>
             </div>
             <div style="color:#6b7280;font-size:11px;margin-top:2px">${esc(p.neighborhood || p.city)}</div>
             ${tags ? `<div style="font-size:11px;margin-top:4px">${tags}</div>` : ""}
             <a href="/spaces/${p.id}" style="display:inline-block;margin-top:6px;font-size:12px;font-weight:600;color:#111">View intel →</a>
           </div>`,
        )
      }

      // Auto-zoom to the viewer's location — but only if they're near the market
      // (so a far-away viewer, e.g. Derek in Dubai, still lands on Calgary, not an empty map).
      if (typeof navigator !== "undefined" && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (cancelled) return
            const here: [number, number] = [pos.coords.latitude, pos.coords.longitude]
            const nearest = points.reduce((m, p) => Math.min(m, distKm(here, [p.lat, p.lng])), Infinity)
            if (nearest <= 250) {
              map.flyTo(here, 13, { duration: 1.2 })
              L.circleMarker(here, { radius: 7, color: "#fff", weight: 2, fillColor: "#3b82f6", fillOpacity: 1 })
                .addTo(map)
                .bindPopup('<strong style="font-size:12px">You are here</strong>')
            }
          },
          () => {},
          { enableHighAccuracy: false, timeout: 6000, maximumAge: 300000 },
        )
      }
    })()
    return () => {
      cancelled = true
      // @ts-expect-error leaflet map has remove()
      if (mapRef.current) mapRef.current.remove?.()
      mapRef.current = null
    }
  }, [points, center, zoom])

  return (
    <div className="overflow-hidden rounded-xl border-2 border-black shadow-[5px_5px_0px_0px_rgba(249,203,22,0.6)]">
      <div ref={ref} className="h-[460px] w-full bg-[#1f1f1f] 2xl:h-[580px]" />
      <div className="flex flex-wrap items-center gap-3 border-t-2 border-black bg-[#1f1f1f] px-4 py-2.5 text-xs text-gray-300">
        <span className="font-medium text-gray-400">Digital score:</span>
        {[
          ["A", "#10b981"],
          ["B", "#84cc16"],
          ["C", "#f9cb16"],
          ["D", "#f97316"],
          ["F", "#ef4444"],
        ].map(([b, hex]) => (
          <span key={b} className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-full border border-white/40" style={{ background: hex }} />
            {b}
          </span>
        ))}
        <span className="ml-auto text-gray-500">scroll to zoom · {points.length} spaces · OpenStreetMap</span>
      </div>
    </div>
  )
}
