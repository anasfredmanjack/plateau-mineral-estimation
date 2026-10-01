import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import proj4 from 'proj4';
import type { RadiometricData, StudyAreaBounds } from '../types/index';
import metadata from '../data/naraguta.json';

// Workbook export only: never substitute guessed GRD offsets or random values.
export const sheetMetadata = metadata;
const utm32 = '+proj=utm +zone=32 +datum=WGS84 +units=m +no_defs';
export function utmToLatLng(x: number, y: number) {
  const [lng, lat] = proj4(utm32, 'EPSG:4326', [x, y]);
  return { lat, lng };
}
export function latLngToUtm(lat: number, lng: number) {
  const [x, y] = proj4('EPSG:4326', utm32, [lng, lat]);
  return { x, y };
}
const cache = new Map<string, RadiometricData[]>();
export function loadAllRadiometricData(dataDir = './data'): RadiometricData[] {
  const file = path.resolve(dataDir, 'naraguta.bin');
  const cached = cache.get(file);
  if (cached) return cached;
  const bytes = fs.readFileSync(file);
  if (bytes.length !== metadata.nx * metadata.ny * 24 ||
      createHash('sha256').update(bytes).digest('hex') !== metadata.dataSha256) {
    throw new Error('Naraguta workbook data is incomplete or corrupt. Re-run the workbook importer.');
  }
  const data: RadiometricData[] = [];
  for (let row = 0; row < metadata.ny; row++) {
    for (let col = 0; col < metadata.nx; col++) {
      const x = metadata.minX + col * metadata.spacing;
      const y = metadata.minY + row * metadata.spacing;
      const offset = (row * metadata.nx + col) * 24;
      data.push({ x, y, ...utmToLatLng(x, y),
        potassium: bytes.readDoubleLE(offset), thorium: bytes.readDoubleLE(offset + 8),
        uranium: bytes.readDoubleLE(offset + 16) });
    }
  }
  cache.set(file, data);
  return data;
}
export function getStudyAreaBounds(): StudyAreaBounds {
  const half = metadata.spacing / 2;
  const corners = [metadata.minX - half, metadata.maxX + half].flatMap(x =>
    [metadata.minY - half, metadata.maxY + half].map(y => utmToLatLng(x, y)));
  return { minX: metadata.minX, maxX: metadata.maxX, minY: metadata.minY, maxY: metadata.maxY,
    minLat: Math.min(...corners.map(p => p.lat)), maxLat: Math.max(...corners.map(p => p.lat)),
    minLng: Math.min(...corners.map(p => p.lng)), maxLng: Math.max(...corners.map(p => p.lng)) };
}
export function findNearestDataPoint(data: RadiometricData[], lat: number, lng: number): RadiometricData | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  const { x, y } = latLngToUtm(lat, lng);
  const half = metadata.spacing / 2;
  if (!Number.isFinite(x) || !Number.isFinite(y) || x < metadata.minX - half || x >= metadata.maxX + half ||
      y < metadata.minY - half || y >= metadata.maxY + half) return null;
  const col = Math.round((x - metadata.minX) / metadata.spacing);
  const row = Math.round((y - metadata.minY) / metadata.spacing);
  return data[row * metadata.nx + col] ?? null;
}
export function findPointsInRadius(data: RadiometricData[], lat: number, lng: number, radiusKm: number) {
  const { x, y } = latLngToUtm(lat, lng);
  return data.filter(p => Math.hypot(p.x - x, p.y - y) <= radiusKm * 1000);
}
export function getSheetMatch(point: RadiometricData, lat: number, lng: number) {
  const col = Math.round((point.x - metadata.minX) / metadata.spacing) + 2;
  const row = Math.round((point.y - metadata.minY) / metadata.spacing) + 2;
  let letters = '', n = col;
  while (n > 0) { n--; letters = String.fromCharCode(65 + n % 26) + letters; n = Math.floor(n / 26); }
  const { x, y } = latLngToUtm(lat, lng);
  return { source: metadata.source, cell: `${letters}${row}`, requestedLat: lat, requestedLng: lng,
    distanceMetres: Math.hypot(point.x - x, point.y - y), units: metadata.units };
}
