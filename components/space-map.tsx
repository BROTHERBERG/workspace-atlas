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

function esc(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string))
}

export default function SpaceMap({ points }: { points: MapPoint[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const mapRef = useRef<unknown>(null)

  useEffect(() => {
    if (!ref.current || mapRef.current) return
    let cancelled = false
    ;(async () => {
      const L = (await import("leaflet")).default
      if (cancelled || !ref.current) return
      const map = L.map(ref.current, { scrollWheelZoom: false, attributionControl: true })
      mapRef.current = map
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        maxZoom: 19,
      }).addTo(map)

      const latlngs: [number, number][] = []
      for (const p of points) {
        const color = BAND_HEX[p.band] || BAND_HEX["?"]
        const marker = L.circleMarker([p.lat, p.lng], {
          radius: 8,
          color: "#111",
          weight: 1.5,
          fillColor: color,
          fillOpacity: 0.92,
        }).addTo(map)
        latlngs.push([p.lat, p.lng])
        const tags = [
          p.web ? '<span style="color:#ea580c;font-weight:600">web-services lead</span>' : "",
          p.hiringNow ? '<span style="color:#ca8a04;font-weight:600">hiring now</span>' : p.talent ? '<span style="color:#6b7280">talent signal</span>' : "",
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
      if (latlngs.length) map.fitBounds(latlngs, { padding: [40, 40], maxZoom: 11 })
    })()
    return () => {
      cancelled = true
      // @ts-expect-error leaflet map has remove()
      if (mapRef.current) mapRef.current.remove?.()
      mapRef.current = null
    }
  }, [points])

  return (
    <div className="overflow-hidden rounded-xl border-2 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
      <div ref={ref} className="h-[460px] w-full bg-gray-100 2xl:h-[560px]" />
      <div className="flex flex-wrap items-center gap-3 border-t-2 border-black bg-white px-4 py-2.5 text-xs">
        <span className="font-medium text-gray-500">Digital score:</span>
        {[
          ["A", "#10b981"],
          ["B", "#84cc16"],
          ["C", "#f9cb16"],
          ["D", "#f97316"],
          ["F", "#ef4444"],
        ].map(([b, hex]) => (
          <span key={b} className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-full border border-black" style={{ background: hex }} />
            {b}
          </span>
        ))}
        <span className="ml-auto text-gray-400">{points.length} spaces · OpenStreetMap</span>
      </div>
    </div>
  )
}
