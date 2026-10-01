'use client';
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
export default function PredictionPanel({ prediction, analysis, location, loading }: Props) {
  if (loading) return <div className="bg-slate-800 rounded-lg p-6 text-slate-300">Looking up the Naraguta sheet...</div>;
  if (!prediction) return <div className="bg-slate-800 rounded-lg p-6 text-slate-300">Select a location to view its nearest Naraguta grid cell.</div>;
  const match = prediction.sheetMatch;
  return <section className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
    <div className="bg-blue-700 p-4 text-white">
      <h3 className="font-bold text-lg">Naraguta Sheet 168 Values</h3>
      {location && <p>{location.name}</p>}
    </div>
    <div className="p-4 space-y-4 text-slate-300 text-sm">
      <dl className="space-y-2">
        {([['Potassium', prediction.potassium], ['Thorium', prediction.thorium], ['Uranium', prediction.uranium]] as const).map(([name, value]) =>
          <div key={name} className="bg-slate-900 rounded p-3"><dt>{name}</dt><dd className="font-mono text-blue-300 break-all">{String(value)}</dd></div>)}
      </dl>
      <p>Raw sheet values. Units are not specified in the workbook.</p>
      {match && <div className="space-y-2 border-t border-slate-700 pt-3">
        <p className="break-all">Source: {match.source}</p>
        <p>Excel cell: <strong>{match.cell}</strong> in Potassium Grid, Thorium Grid, and Uranium Grid.</p>
        <p>Selected: {match.requestedLat.toFixed(6)}, {match.requestedLng.toFixed(6)}</p>
        <p>Nearest cell centre: {prediction.lat.toFixed(6)}, {prediction.lng.toFixed(6)}</p>
        <p>Distance to cell centre: {match.distanceMetres.toFixed(1)} m</p>
      </div>}
      <p>UTM zone 32N: {prediction.x} E, {prediction.y} N</p>
      <p>{analysis}</p>
    </div>
  </section>;
}
