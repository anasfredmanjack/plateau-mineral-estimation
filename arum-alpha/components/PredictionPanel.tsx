'use client';
import { useState } from 'react';
import { FlaskConical, MapPin, Sparkles, Navigation, CheckCircle, Activity, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import type { MineralPrediction, LocationInfo, AIEstimates } from '@/types';
interface Props {
  prediction: MineralPrediction | null;
  analysis?: string;
  analysisSource?: 'ai' | 'cached-ai' | 'unavailable';
  aiEstimates?: AIEstimates;
  analysisError?: string;
  recommendations?: string[];

  location?: LocationInfo | null;
  landmarks?: string[];
  loading?: boolean;
}
export default function PredictionPanel({ prediction, analysis, recommendations, aiEstimates, analysisError, location, loading }: Props) {
  const [showRiskExplanation, setShowRiskExplanation] = useState(false);
  const risk = aiEstimates?.riskLevel;
  const riskStyle = risk === 'low' ? 'text-green-400 bg-green-400/20 border-green-400/30' : risk === 'medium' ? 'text-yellow-400 bg-yellow-400/20 border-yellow-400/30' : risk === 'high' ? 'text-red-400 bg-red-400/20 border-red-400/30' : 'text-slate-400 bg-slate-700/30 border-slate-600';
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
      <div className="flex items-center gap-2 mb-1"><Sparkles className="w-5 h-5" /><h3 className="font-bold text-lg">AI Mineral Estimation</h3></div>
      {location ? <div><p className="text-white font-semibold text-lg">{location.name}</p>
        <p className="text-blue-100 text-xs">{location.admin2}, {location.admin1}</p></div>
        : <p className="text-blue-100 text-sm">Radiometric mineral data</p>}
    </div>
    <div className="p-4">
      <div className="mb-4">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 rounded-lg p-3 border border-blue-700/50">
            <div className="flex items-center gap-1 text-sm text-slate-400 mb-1"><Activity className="w-4 h-4 text-blue-400" />Confidence</div>
            <p className="text-xl font-bold text-blue-300">{aiEstimates?.confidencePercent != null ? `${aiEstimates.confidencePercent.toFixed(0)}%` : 'Awaiting AI'}</p>
          </div>
          <div className={`rounded-lg p-3 border ${riskStyle}`}>
            <div className="flex items-center gap-1 text-sm mb-1"><AlertTriangle className="w-4 h-4" />Risk Level</div>
            <p className="text-xl font-bold">{risk ? `${risk.charAt(0).toUpperCase()}${risk.slice(1)} Risk` : 'Awaiting AI'}</p>
          </div>
        </div>
        {aiEstimates && <div className="mb-3">
          <button type="button" aria-expanded={showRiskExplanation} onClick={() => setShowRiskExplanation(!showRiskExplanation)} className="w-full bg-slate-700/50 hover:bg-slate-700 text-sm text-slate-300 py-2 px-3 rounded flex items-center justify-between">Risk Assessment Factors{showRiskExplanation ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</button>
          {showRiskExplanation && <p className="text-sm text-slate-400 mt-2">{aiEstimates.rationale}</p>}
        </div>}
        <p className="text-xs text-slate-400 mt-2">Confidence is the model’s self-assessment.</p>
        {analysisError && <p role="status" className="text-sm text-amber-300 mt-2">{analysisError}</p>}
      </div>
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
        <div className="mt-3 space-y-2 text-xs text-slate-400">
          {([
            ['Potassium', 'K', prediction.potassium],
            ['Thorium', 'Th', prediction.thorium],
            ['Uranium', 'U', prediction.uranium],
          ] as const).map(([name, symbol, value], index, minerals) => {
            const others = minerals.filter((_, otherIndex) => otherIndex !== index);
            const ratios: [string, number][] = [
              ...others.map(([, otherSymbol, otherValue]): [string, number] => [`${symbol}/${otherSymbol}`, otherValue]),
              [`${symbol}/(${others.map(([, otherSymbol]) => otherSymbol).join('+')})`, others.reduce((sum, [, , otherValue]) => sum + otherValue, 0)],
            ];
            return <div key={symbol} className="rounded-lg bg-slate-700/30 p-2">
              <p className="font-medium text-slate-300 mb-1">{name} ratios</p>
              <dl className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {ratios.map(([label, denominator]) => <div key={label}>
                  <dt>{label}</dt>
                  <dd className="text-slate-200 break-all">{denominator !== 0 && Number.isFinite(value / denominator) ? (value / denominator).toFixed(3) : 'Undefined'}</dd>
                </div>)}
              </dl>
            </div>;
          })}
          <p className="text-slate-500">Ratios of raw grid values. K = potassium, Th = thorium, U = uranium. A zero denominator is shown as Undefined.</p>
        </div>
        <p className="text-xs text-slate-400 mt-3">Values from the Naraguta grid file, displayed to three decimal places.</p>
      </div>
      {location && <div className="border-t border-slate-700 pt-4 mb-4">
        <h4 className="flex items-center gap-1 text-slate-300 text-sm font-semibold mb-2"><MapPin className="w-4 h-4 text-blue-400" />Location Details</h4>
        <p className="text-sm text-slate-400">{location.fullAddress}</p>
      </div>}
      {analysis && <div className="border-t border-slate-700 pt-4 mb-4">
        <h4 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-1"><Sparkles className="w-4 h-4 text-blue-400" />AI Analysis</h4>
        <p className="text-xs text-blue-300 mb-2">Generated by Groq — verify with field evidence</p>
        <p className="text-sm text-slate-400 leading-relaxed">{analysis}</p>
      </div>}
      {!!recommendations?.length && <div className="border-t border-slate-700 pt-4 mb-4">
        <h4 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-400" />Recommendations</h4>
        <ol className="space-y-2">{recommendations.map((rec, i) => <li key={i} className="flex items-start gap-2 text-sm text-slate-400"><span className="w-5 h-5 flex items-center justify-center shrink-0 rounded-full bg-blue-900/50 text-blue-300 border border-blue-700/30 text-xs">{i + 1}</span>{rec}</li>)}</ol>
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
