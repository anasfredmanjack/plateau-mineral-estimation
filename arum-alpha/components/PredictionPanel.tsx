'use client';
import { FlaskConical, MapPin, Sparkles, Navigation } from 'lucide-react';
import type { MineralPrediction, ModelMetrics, LocationInfo } from '@/types';
interface Props {
  prediction: MineralPrediction | null;
  analysis?: string;
  recommendations?: string[];
  modelMetrics?: ModelMetrics;
  location?: LocationInfo | null;
  landmarks?: string[];
  loading?: boolean;
}
export default function PredictionPanel({ prediction, location, loading }: Props) {
  if (loading) return <div className="bg-slate-800 rounded-lg shadow-lg border border-slate-700 p-6 animate-pulse" aria-label="Loading grid values">
    <div className="h-4 bg-slate-600 rounded w-3/4 mb-4" />
    <div className="h-8 bg-slate-600 rounded w-1/2 mb-4" />
    <p className="text-sm text-slate-400">Looking up the Naraguta grid...</p>
  </div>;
  if (!prediction) return <div className="bg-slate-800 rounded-lg shadow-lg border border-slate-700 p-6">
    <div className="flex items-center gap-2 text-slate-400 mb-2">
      <MapPin className="w-5 h-5" /><h3 className="font-semibold text-slate-200">No Location Selected</h3>
    </div>
    <p className="text-slate-400 text-sm">Click on the map or enter coordinates to view mineral values.</p>
  </div>;
  return <section className="bg-slate-800 rounded-lg shadow-lg border border-slate-700 overflow-hidden">
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
      <div className="flex items-center gap-2 mb-1"><Sparkles className="w-5 h-5" /><h3 className="font-bold text-lg">Naraguta Grid Values</h3></div>
      {location ? <div><p className="text-white font-semibold text-lg">{location.name}</p>
        <p className="text-blue-100 text-xs">{location.admin2}, {location.admin1}</p></div>
        : <p className="text-blue-100 text-sm">Radiometric mineral data</p>}
    </div>
    <div className="p-4">
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-1"><FlaskConical className="w-4 h-4 text-blue-400" />Radiometric Data</h4>
        <dl className="grid grid-cols-3 gap-2 text-center">
          {([
            ['Potassium', prediction.potassium, 'bg-green-900/30 border-green-700/30 text-green-400'],
            ['Thorium', prediction.thorium, 'bg-yellow-900/30 border-yellow-700/30 text-yellow-400'],
            ['Uranium', prediction.uranium, 'bg-red-900/30 border-red-700/30 text-red-400'],
          ] as const).map(([name, value, color]) => <div key={name} className={`rounded-lg p-2 border ${color}`}>
            <dt className="text-xs text-slate-400 mb-1">{name}</dt>
            <dd className="font-semibold text-sm break-all" title={String(value)}>{value.toFixed(3)}</dd>
          </div>)}
        </dl>
        <p className="text-xs text-slate-400 mt-3">Values from the Naraguta grid file, displayed to three decimal places.</p>
      </div>
      {location && <div className="border-t border-slate-700 pt-4 mb-4">
        <h4 className="flex items-center gap-1 text-slate-300 text-sm font-semibold mb-2"><MapPin className="w-4 h-4 text-blue-400" />Location Details</h4>
        <p className="text-sm text-slate-400">{location.fullAddress}</p>
      </div>}
      <div className="border-t border-slate-700 pt-4">
        <h4 className="flex items-center gap-1 text-slate-300 text-sm font-semibold mb-3"><Navigation className="w-4 h-4 text-blue-400" />Coordinate System</h4>
        <div className="bg-slate-700/30 border border-slate-700 rounded-lg p-3 space-y-2 text-xs text-slate-400">
          <p>Latitude / longitude: WGS 84 (EPSG:4326), decimal degrees.</p>
          <p>Grid: WGS 84 / UTM zone 32N (EPSG:32632), metres.</p>
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700">
            <p>Easting<br /><span className="text-slate-200 font-medium">{prediction.x} m</span></p>
            <p>Northing<br /><span className="text-slate-200 font-medium">{prediction.y} m</span></p>
          </div>
        </div>
      </div>
    </div>
  </section>;
}
