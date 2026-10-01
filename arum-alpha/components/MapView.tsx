'use client';
import { useEffect } from 'react';
import { MapContainer, TileLayer, useMap, CircleMarker, Tooltip, LayersControl, useMapEvents, Rectangle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { RadiometricData, MineralPrediction, StudyAreaBounds } from '@/types';
interface Props {
  dataPoints: RadiometricData[];
  predictions?: MineralPrediction[];
  selectedPoint?: { lat: number; lng: number } | null;
  onPointSelect?: (lat: number, lng: number) => void;
  bounds?: StudyAreaBounds;
  showHeatmap?: boolean;
}
function MapControls({ bounds, selectedPoint, onPointSelect }: Pick<Props, 'bounds' | 'selectedPoint' | 'onPointSelect'>) {
  const map = useMap();
  useMapEvents({ click(e) { onPointSelect?.(e.latlng.lat, e.latlng.lng); } });
  useEffect(() => {
    if (bounds) map.fitBounds([[bounds.minLat, bounds.minLng], [bounds.maxLat, bounds.maxLng]], { padding: [30, 30] });
  }, [bounds, map]);
  useEffect(() => {
    if (selectedPoint) map.panTo([selectedPoint.lat, selectedPoint.lng]);
  }, [selectedPoint, map]);
  return null;
}
function Values({ point }: { point: RadiometricData }) {
  return <div><strong>K:</strong> {String(point.potassium)}<br />
    <strong>Th:</strong> {String(point.thorium)}<br />
    <strong>U:</strong> {String(point.uranium)}<br />Units unspecified in source workbook.</div>;
}
export default function MapView({ dataPoints, predictions, selectedPoint, onPointSelect, bounds, showHeatmap = true }: Props) {
  return <MapContainer center={[9.75, 8.75]} zoom={11} style={{ height: '100%', width: '100%', minHeight: 400 }}>
    <LayersControl position="topright">
      <LayersControl.BaseLayer checked name="OpenStreetMap">
        <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      </LayersControl.BaseLayer>
      <LayersControl.BaseLayer name="Satellite">
        <TileLayer attribution="Esri World Imagery" url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
      </LayersControl.BaseLayer>
    </LayersControl>
    <MapControls bounds={bounds} selectedPoint={selectedPoint} onPointSelect={onPointSelect} />
    {bounds && <Rectangle bounds={[[bounds.minLat, bounds.minLng], [bounds.maxLat, bounds.maxLng]]} pathOptions={{ color: '#3b82f6', weight: 2, fillOpacity: 0.02 }}>
      <Tooltip>Approximate Naraguta Sheet 168 extent</Tooltip>
    </Rectangle>}
    {showHeatmap && dataPoints.map((point, i) => <CircleMarker key={i} center={[point.lat, point.lng]} radius={3}
      pathOptions={{ color: '#94a3b8', weight: 1, fillOpacity: 0.5 }}
      eventHandlers={{ click: (event) => { event.originalEvent.stopPropagation(); onPointSelect?.(point.lat, point.lng); } }} bubblingMouseEvents={false}>
      <Tooltip><Values point={point} /></Tooltip>
    </CircleMarker>)}
    {predictions?.map((point, i) => <CircleMarker key={`match-${i}`} center={[point.lat, point.lng]} radius={6}
      pathOptions={{ color: '#22d3ee', weight: 2 }} bubblingMouseEvents={false}
      eventHandlers={{ click: () => onPointSelect?.(point.lat, point.lng) }}>
      <Tooltip>Matched cell {point.sheetMatch?.cell}<Values point={point} /></Tooltip>
    </CircleMarker>)}
    {selectedPoint && <CircleMarker center={[selectedPoint.lat, selectedPoint.lng]} radius={10}
      pathOptions={{ color: '#3b82f6', weight: 3 }}><Tooltip>Selected location</Tooltip></CircleMarker>}
  </MapContainer>;
}
