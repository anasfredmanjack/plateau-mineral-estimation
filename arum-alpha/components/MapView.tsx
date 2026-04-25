'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, useMap, CircleMarker, Tooltip, LayersControl, useMapEvents, Rectangle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RadiometricData, MineralPrediction, StudyAreaBounds } from '@/types';

// Fix Leaflet default markers
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';

interface MapViewProps {
  dataPoints: RadiometricData[];
  predictions?: MineralPrediction[];
  selectedPoint?: { lat: number; lng: number } | null;
  onPointSelect?: (lat: number, lng: number) => void;
  bounds?: StudyAreaBounds;
  showHeatmap?: boolean;
}

// Custom hook for map bounds
function MapBounds({ bounds }: { bounds?: StudyAreaBounds }) {
  const map = useMap();
  
  useEffect(() => {
    if (bounds) {
      const corner1 = L.latLng(bounds.minLat, bounds.minLng);
      const corner2 = L.latLng(bounds.maxLat, bounds.maxLng);
      map.fitBounds(L.latLngBounds(corner1, corner2), { padding: [50, 50] });
    }
  }, [map, bounds]);
  
  return null;
}

// Click handler for map
function MapClickHandler({ onClick }: { onClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Heatmap layer component
function HeatmapLayer({ 
  predictions, 
  show 
}: { 
  predictions?: MineralPrediction[]; 
  show: boolean;
}) {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const layerRef = useRef<L.Layer | null>(null);
  
  useEffect(() => {
    if (!show || !predictions || predictions.length === 0) {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
      return;
    }
    
    // Create canvas layer
    const CanvasLayer = L.GridLayer.extend({
      initialize: function(this: any, options: any) {
        L.Util.setOptions(this, options);
      },
      createTile: function(this: any, coords: any) {
        const tile = document.createElement('canvas');
        const tileSize = this.getTileSize();
        tile.setAttribute('width', String(tileSize.x));
        tile.setAttribute('height', String(tileSize.y));
        const ctx = tile.getContext('2d');
        if (!ctx) return tile;
        
        // Convert tile coords to lat/lng for the origin of this tile
        const tileSouthWest = map.unproject(
          [coords.x * tileSize.x, (coords.y + 1) * tileSize.y], 
          coords.z
        );
        const tileNorthEast = map.unproject(
          [(coords.x + 1) * tileSize.x, coords.y * tileSize.y], 
          coords.z
        );
        const tileBounds = L.latLngBounds(tileSouthWest, tileNorthEast);
        
        // Draw heatmap points that fall in or near this tile
        predictions.forEach(pred => {
          const predLatLng = L.latLng(pred.lat, pred.lng);
          
          // Check if point is near this tile
          if (!tileBounds.contains(predLatLng) && 
              !tileBounds.extend(predLatLng).getCenter().equals(tileBounds.getCenter())) {
            // Skip if far from this tile
            const center = tileBounds.getCenter();
            const dist = center.distanceTo(predLatLng);
            if (dist > 5000) return; // Skip if > 5km from tile center
          }
          
          // Project to pixel coordinates
          const tilePoint = map.project(predLatLng, coords.z);
          const tileOrigin = map.project(tileSouthWest, coords.z);
          const x = tilePoint.x - tileOrigin.x;
          const y = tilePoint.y - tileOrigin.y;
          
          if (x >= -50 && x <= tileSize.x + 50 && y >= -50 && y <= tileSize.y + 50) {
            // Color based on grade
            const grade = pred.predictedGrade;
            const alpha = Math.min(0.6, grade * 0.8);
            
            let color: string;
            if (grade > 0.3) color = `rgba(220, 38, 38, ${alpha})`; // Red - high
            else if (grade > 0.15) color = `rgba(234, 179, 8, ${alpha})`; // Yellow - medium
            else color = `rgba(34, 197, 94, ${alpha})`; // Green - low
            
            ctx.beginPath();
            ctx.arc(x, y, 15 + grade * 20, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.fill();
          }
        });
        
        return tile;
      }
    });
    
    const layer = new (CanvasLayer as any)({
      opacity: 0.7,
      attribution: 'Mineral Prediction Heatmap',
    });
    
    layer.addTo(map);
    layerRef.current = layer;
    
    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
      }
    };
  }, [map, predictions, show]);
  
  return null;
}

export default function MapView({ 
  dataPoints, 
  predictions, 
  selectedPoint,
  onPointSelect,
  bounds,
  showHeatmap = true,
}: MapViewProps) {
  const [mounted, setMounted] = useState(false);
  const center = bounds 
    ? [(bounds.minLat + bounds.maxLat) / 2, (bounds.minLng + bounds.maxLng) / 2] 
    : [9.75, 8.75]; // Default to Jos Plateau
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const getMarkerColor = useCallback((k: number, th: number, u: number) => {
    // Color based on Th anomaly (indicator of tin potential)
    if (th > 25) return '#dc2626'; // High potential - red
    if (th > 18) return '#eab308'; // Medium - yellow
    return '#22c55e'; // Low - green
  }, []);
  
  const getPredictionColor = useCallback((grade: number) => {
    if (grade > 0.3) return '#dc2626'; // High
    if (grade > 0.15) return '#eab308'; // Medium
    return '#22c55e'; // Low
  }, []);
  
  if (!mounted) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-500 text-sm">Loading map...</p>
        </div>
      </div>
    );
  }
  
  return (
    <MapContainer
      center={center as [number, number]}
      zoom={12}
      style={{ height: '100%', width: '100%', minHeight: '400px' }}
      scrollWheelZoom={true}
      key={`map-container-${mounted}`}
    >
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="OpenStreetMap">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        </LayersControl.BaseLayer>
        
        <LayersControl.BaseLayer name="Satellite">
          <TileLayer
            attribution='&copy; Google'
            url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
          />
        </LayersControl.BaseLayer>
        
        <LayersControl.BaseLayer name="Terrain">
          <TileLayer
            attribution='&copy; Google'
            url="https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}"
          />
        </LayersControl.BaseLayer>
      </LayersControl>
      
      <MapBounds bounds={bounds} />
      <MapClickHandler onClick={onPointSelect} />
      
      {/* Study area boundary */}
      {bounds && (
        <Rectangle
          bounds={[[bounds.minLat, bounds.minLng], [bounds.maxLat, bounds.maxLng]]}
          pathOptions={{ color: 'blue', weight: 2, fillOpacity: 0.05 }}
        >
          <Tooltip direction="top" offset={[0, -10]}>
            Study Area: Naraguta Sheet 168
          </Tooltip>
        </Rectangle>
      )}
      
      {/* Data points - radiometric measurements */}
      {dataPoints.map((point, idx) => (
        <CircleMarker
          key={`data-${idx}`}
          center={[point.lat, point.lng]}
          radius={4}
          pathOptions={{
            color: getMarkerColor(point.potassium, point.thorium, point.uranium),
            fillColor: getMarkerColor(point.potassium, point.thorium, point.uranium),
            fillOpacity: 0.6,
            weight: 1,
          }}
        >
          <Tooltip direction="top" offset={[0, -10]}>
            <div className="text-sm">
              <strong>Location:</strong> {point.lat.toFixed(4)}°N, {point.lng.toFixed(4)}°E<br/>
              <strong>K:</strong> {point.potassium.toFixed(2)}%<br/>
              <strong>Th:</strong> {point.thorium.toFixed(1)} ppm<br/>
              <strong>U:</strong> {point.uranium.toFixed(1)} ppm
            </div>
          </Tooltip>
        </CircleMarker>
      ))}
      
      {/* Prediction markers */}
      {predictions?.map((pred, idx) => (
        <CircleMarker
          key={`pred-${idx}`}
          center={[pred.lat, pred.lng]}
          radius={8 + pred.predictedGrade * 15}
          pathOptions={{
            color: getPredictionColor(pred.predictedGrade),
            fillColor: getPredictionColor(pred.predictedGrade),
            fillOpacity: 0.7,
            weight: 2,
          }}
        >
          <Tooltip direction="top" offset={[0, -10]} className="bg-white">
            <div className="text-sm p-1">
              <strong className="text-gray-800">Predicted Grade:</strong> 
              <span className="font-bold" style={{ color: getPredictionColor(pred.predictedGrade) }}>
                {(pred.predictedGrade * 100).toFixed(2)}%
              </span><br/>
              <strong>Confidence:</strong> {(pred.confidence * 100).toFixed(0)}%<br/>
              <strong>Risk:</strong> {pred.riskLevel}<br/>
              <strong>Th/U Ratio:</strong> {pred.kThUratio.toFixed(2)}
            </div>
          </Tooltip>
        </CircleMarker>
      ))}
      
      {/* Selected point marker */}
      {selectedPoint && (
        <CircleMarker
          center={[selectedPoint.lat, selectedPoint.lng]}
          radius={12}
          pathOptions={{
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.5,
            weight: 3,
          }}
        />
      )}
      
      {/* Heatmap overlay */}
      {showHeatmap && <HeatmapLayer predictions={predictions} show={showHeatmap} />}
    </MapContainer>
  );
}
