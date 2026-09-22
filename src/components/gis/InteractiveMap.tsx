"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface MineGisData {
  id: string;
  name: string;
  location: string;
  riskStatus: "critical" | "high" | "medium" | "low" | "safe";
  riskScore: number;
  complianceScore: number;
  workersOnSite: number;
  type: string;
  status: string;
  latitude: number;
  longitude: number;
}

export interface ZoneGisData {
  name: string;
  lat: number;
  lng: number;
  color: string;
  desc: string;
}

interface InteractiveMapProps {
  mines: MineGisData[];
  activeLayers: {
    mines: boolean;
    zones: boolean;
    satellite: boolean;
  };
  singleMineMode?: boolean;
  center?: [number, number];
  zoom?: number;
  zonesList?: ZoneGisData[];
}

const getRiskColorHex = (risk: string) => {
  const colors = {
    critical: "#dc2626", // Red
    high: "#ef4444",     // Red-Orange
    medium: "#eab308",   // Yellow
    low: "#f97316",      // Orange
    safe: "#22c55e",     // Green
  };
  return colors[risk as keyof typeof colors] || "#6b7280";
};

// Component to dynamically fit bounds to show all markers in multi-mine mode
function MapBoundsSetter({ mines, singleMineMode }: { mines: MineGisData[]; singleMineMode?: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (!singleMineMode && mines.length > 0) {
      const bounds = L.latLngBounds(mines.map(m => [m.latitude, m.longitude]));
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [mines, map, singleMineMode]);
  return null;
}

// Component to center map on single mine
function SingleMineCenterer({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function InteractiveMap({
  mines,
  activeLayers,
  singleMineMode = false,
  center,
  zoom,
  zonesList = [],
}: InteractiveMapProps) {
  const effectiveCenter: [number, number] = center || (singleMineMode && mines[0]
    ? [mines[0].latitude, mines[0].longitude]
    : [22.3, 80.0]);
  const effectiveZoom = zoom || (singleMineMode ? 13 : 5);

  const osmUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  const osmAttr = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  const satelliteUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
  const satelliteAttr = "Tiles &copy; Esri &mdash; Source: Esri, USDA, USGS, and the GIS User Community";

  return (
    <div className="h-full w-full relative z-0">
      <MapContainer
        center={effectiveCenter}
        zoom={effectiveZoom}
        className="h-full w-full min-h-[480px]"
        zoomControl={true}
      >
        <TileLayer
          url={activeLayers.satellite ? satelliteUrl : osmUrl}
          attribution={activeLayers.satellite ? satelliteAttr : osmAttr}
        />

        {!singleMineMode ? (
          <MapBoundsSetter mines={mines} singleMineMode={singleMineMode} />
        ) : (
          <SingleMineCenterer center={effectiveCenter} zoom={effectiveZoom} />
        )}

        {/* Multi-mine national macro zones */}
        {!singleMineMode && activeLayers.zones && (
          <>
            <Circle
              center={[23.6102, 85.2799]}
              radius={100000}
              pathOptions={{ fillColor: "#dc2626", fillOpacity: 0.12, color: "#dc2626", weight: 1.5 }}
            />
            <Circle
              center={[20.9517, 85.0985]}
              radius={80000}
              pathOptions={{ fillColor: "#ef4444", fillOpacity: 0.12, color: "#ef4444", weight: 1.5 }}
            />
            <Circle
              center={[22.9734, 78.6569]}
              radius={110000}
              pathOptions={{ fillColor: "#eab308", fillOpacity: 0.1, color: "#eab308", weight: 1.5 }}
            />
            <Circle
              center={[21.2787, 81.8661]}
              radius={70000}
              pathOptions={{ fillColor: "#22c55e", fillOpacity: 0.08, color: "#22c55e", weight: 1.5 }}
            />
          </>
        )}

        {/* Single-mine local operational zones */}
        {singleMineMode && activeLayers.zones && zonesList.map((z, idx) => (
          <Circle
            key={idx}
            center={[z.lat, z.lng]}
            radius={700}
            pathOptions={{ fillColor: z.color, fillOpacity: 0.22, color: z.color, weight: 2 }}
          >
            <Popup>
              <div className="p-2 space-y-1 text-sm font-sans">
                <div className="flex items-center justify-between border-b pb-1 gap-2">
                  <span className="font-bold text-gray-900">{z.name}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: z.color }}>
                    ZONE
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1">{z.desc}</p>
                <p className="text-[11px] font-mono text-gray-400 mt-0.5">{z.lat.toFixed(4)}° N, {z.lng.toFixed(4)}° E</p>
              </div>
            </Popup>
          </Circle>
        ))}

        {/* Dynamic Mine Markers */}
        {activeLayers.mines &&
          mines.map((mine) => (
            <CircleMarker
              key={mine.id}
              center={[mine.latitude, mine.longitude]}
              radius={singleMineMode ? 12 : 9}
              pathOptions={{
                fillColor: getRiskColorHex(mine.riskStatus),
                color: "#ffffff",
                weight: singleMineMode ? 3 : 2,
                fillOpacity: 0.95,
              }}
            >
              <Popup>
                <div className="p-2 space-y-1 text-sm font-sans">
                  <div className="flex items-center justify-between border-b pb-1 gap-4">
                    <span className="font-bold text-gray-900">{mine.name}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white capitalize" style={{ backgroundColor: getRiskColorHex(mine.riskStatus) }}>
                      {mine.riskStatus}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    <p><strong>State:</strong> {mine.location}</p>
                    <p><strong>Mine Type:</strong> {mine.type.toUpperCase()}</p>
                    <p><strong>Compliance:</strong> {mine.complianceScore}%</p>
                    <p><strong>Workers:</strong> {mine.workersOnSite}</p>
                    <p><strong>Coordinates:</strong> {mine.latitude.toFixed(4)}° N, {mine.longitude.toFixed(4)}° E</p>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
      </MapContainer>
    </div>
  );
}
