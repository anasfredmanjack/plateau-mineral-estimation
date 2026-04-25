'use client';

import { useState } from 'react';
import { 
  MapPin, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  FlaskConical,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';
import { MineralPrediction, ModelMetrics, LocationInfo } from '@/types';

interface PredictionPanelProps {
  prediction: MineralPrediction | null;
  analysis?: string;
  recommendations?: string[];
  modelMetrics?: ModelMetrics;
  location?: LocationInfo | null;
  landmarks?: string[];
  loading?: boolean;
}

export default function PredictionPanel({
  prediction,
  analysis,
  recommendations,
  modelMetrics,
  location,
  landmarks,
  loading = false,
}: PredictionPanelProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showRiskExplanation, setShowRiskExplanation] = useState(false);
  
  // Enhanced risk assessment
  const getRiskAssessment = (risk: string, grade: number, th: number) => {
    const assessments = {
      low: {
        title: 'Low Risk',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        borderColor: 'border-green-200',
        icon: '✓',
        description: 'Favorable conditions detected',
        factors: [
          grade > 0.3 ? 'High predicted grade' : null,
          th > 20 ? 'Elevated thorium levels' : null,
          'Accessible terrain',
          'Historic mining data available'
        ].filter(Boolean)
      },
      medium: {
        title: 'Medium Risk',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        borderColor: 'border-yellow-200',
        icon: '◐',
        description: 'Moderate potential, further investigation needed',
        factors: [
          'Moderate radiometric readings',
          'Requires ground verification',
          'Consider geophysical survey',
          grade > 0.15 ? 'Promising grade indicators' : 'Low grade readings'
        ].filter(Boolean)
      },
      high: {
        title: 'High Risk',
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        borderColor: 'border-red-200',
        icon: '✕',
        description: 'Unfavorable exploration conditions',
        factors: [
          'Low radiometric values',
          grade < 0.1 ? 'Insufficient grade estimates' : null,
          'Distant from known deposits',
          'Consider alternative targets'
        ].filter(Boolean)
      }
    };
    return assessments[risk as keyof typeof assessments] || assessments.medium;
  };
  
  if (loading) {
    return (
      <div className="bg-slate-800 rounded-lg shadow-lg border border-slate-700 p-6 animate-pulse">
        <div className="h-4 bg-slate-600 rounded w-3/4 mb-4"></div>
        <div className="h-8 bg-slate-600 rounded w-1/2 mb-4"></div>
        <div className="space-y-3">
          <div className="h-3 bg-slate-600 rounded"></div>
          <div className="h-3 bg-slate-600 rounded w-5/6"></div>
        </div>
      </div>
    );
  }
  
  if (!prediction) {
    return (
      <div className="bg-slate-800 rounded-lg shadow-lg border border-slate-700 p-6">
        <div className="flex items-center gap-2 text-slate-400 mb-2">
          <MapPin className="w-5 h-5" />
          <h3 className="font-semibold text-slate-200">No Location Selected</h3>
        </div>
        <p className="text-slate-400 text-sm">
          Click on the map or enter coordinates to get a mineral estimation.
        </p>
      </div>
    );
  }
  
  const gradePercent = (prediction.predictedGrade * 100).toFixed(2);
  const confidencePercent = (prediction.confidence * 100).toFixed(0);
  
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-400 bg-green-400/20 border-green-400/30';
      case 'medium': return 'text-yellow-400 bg-yellow-400/20 border-yellow-400/30';
      case 'high': return 'text-red-400 bg-red-400/20 border-red-400/30';
      default: return 'text-slate-400 bg-slate-400/20 border-slate-400/30';
    }
  };
  
  const getGradeColor = (grade: number) => {
    if (grade > 0.3) return 'text-red-400';
    if (grade > 0.15) return 'text-yellow-400';
    return 'text-green-400';
  };
  
  return (
    <div className="bg-slate-800 rounded-lg shadow-lg border border-slate-700 overflow-hidden">
      {/* Header with Location */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5" />
          <h3 className="font-bold text-lg">AI Mineral Estimation</h3>
        </div>
        {location ? (
          <div>
            <p className="text-white font-semibold text-lg">{location.name}</p>
            <p className="text-blue-100 text-xs">
              {location.admin2}, {location.admin1}
            </p>
          </div>
        ) : (
          <p className="text-blue-100 text-sm">
            {prediction.mineralType} Potential
          </p>
        )}
      </div>
      
      <div className="p-4">
        {/* Grade Display */}
        <div className="mb-6 text-center">
          <div className={`text-5xl font-bold ${getGradeColor(prediction.predictedGrade)} mb-2 drop-shadow-lg`}>
            {gradePercent}%
          </div>
          <p className="text-slate-400 text-sm">Predicted Tin (SnO₂) Grade</p>
          
          {/* Grade Bar */}
          <div className="mt-3 h-3 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                prediction.predictedGrade > 0.3 ? 'bg-red-500' : 
                prediction.predictedGrade > 0.15 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(prediction.predictedGrade * 100 * 2, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>Low</span>
            <span>Medium</span>
            <span>High</span>
          </div>
        </div>
        
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 rounded-lg p-3 border border-blue-700/50">
            <div className="flex items-center gap-1 text-blue-400 text-xs mb-1">
              <Activity className="w-3 h-3" />
              Confidence
            </div>
            <p className="font-bold text-xl text-blue-300">{confidencePercent}%</p>
          </div>
          
          <div className={`rounded-lg p-3 border ${getRiskColor(prediction.riskLevel)}`}>
            <div className="flex items-center gap-1 text-slate-400 text-xs mb-1">
              <AlertTriangle className="w-3 h-3" />
              Risk Level
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">
                {getRiskAssessment(prediction.riskLevel, prediction.predictedGrade, prediction.thorium).icon}
              </span>
              <span className={`font-bold ${getRiskAssessment(prediction.riskLevel, prediction.predictedGrade, prediction.thorium).color}`}>
                {getRiskAssessment(prediction.riskLevel, prediction.predictedGrade, prediction.thorium).title}
              </span>
            </div>
          </div>
        </div>
        
        {/* Risk Explanation */}
        <div className="mb-4">
          <button
            onClick={() => setShowRiskExplanation(!showRiskExplanation)}
            className="w-full text-left text-sm text-slate-300 hover:text-slate-100 flex items-center justify-between py-2 px-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <span>{getRiskAssessment(prediction.riskLevel, prediction.predictedGrade, prediction.thorium).description}</span>
            {showRiskExplanation ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          {showRiskExplanation && (
            <div className="mt-2 p-3 bg-slate-700/30 rounded-lg text-sm border border-slate-700">
              <p className="font-medium text-slate-300 mb-2">Risk Assessment Factors:</p>
              <ul className="space-y-1">
                {getRiskAssessment(prediction.riskLevel, prediction.predictedGrade, prediction.thorium).factors.map((factor, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                    {factor}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        {/* Radiometric Values */}
        <div className="border-t border-slate-700 pt-4 mb-4">
          <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-1">
            <FlaskConical className="w-4 h-4 text-blue-400" />
            Radiometric Data
          </h4>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-green-900/30 rounded-lg p-2 border border-green-700/30">
              <p className="text-xs text-slate-400">Potassium</p>
              <p className="font-semibold text-green-400">{prediction.potassium.toFixed(2)}%</p>
            </div>
            <div className="bg-yellow-900/30 rounded-lg p-2 border border-yellow-700/30">
              <p className="text-xs text-slate-400">Thorium</p>
              <p className="font-semibold text-yellow-400">{prediction.thorium.toFixed(1)} ppm</p>
            </div>
            <div className="bg-red-900/30 rounded-lg p-2 border border-red-700/30">
              <p className="text-xs text-slate-400">Uranium</p>
              <p className="font-semibold text-red-400">{prediction.uranium.toFixed(1)} ppm</p>
            </div>
          </div>
          <div className="mt-2 text-center">
            <span className="text-xs text-slate-500">K/(Th+U) Ratio: </span>
            <span className="font-medium text-slate-300">{prediction.kThUratio.toFixed(3)}</span>
          </div>
        </div>
        
        {/* Location Details */}
        <div className="border-t border-slate-700 pt-4 mb-4">
          <div className="flex items-center gap-1 text-slate-400 text-xs mb-2">
            <MapPin className="w-3 h-3" />
            Location Details
          </div>
          
          {location && (
            <div className="mb-3">
              <p className="text-sm font-medium text-slate-200">{location.fullAddress}</p>
              <p className="text-xs text-slate-500 mt-1">
                Place type: <span className="capitalize">{location.placeType}</span>
              </p>
            </div>
          )}
          
          {/* Landmarks */}
          {landmarks && landmarks.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-slate-500 mb-1">Nearby Landmarks:</p>
              <div className="flex flex-wrap gap-1">
                {landmarks.map((landmark, idx) => (
                  <span 
                    key={idx}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-900/30 text-blue-300 text-xs rounded-full border border-blue-700/30"
                  >
                    <span className="w-1 h-1 bg-blue-400 rounded-full"></span>
                    {landmark}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <div className="pt-2 border-t border-slate-700/50">
            <p className="text-xs text-slate-500">
              Coordinates: {prediction.lat.toFixed(6)}°N, {prediction.lng.toFixed(6)}°E
            </p>
            <p className="text-xs text-slate-600">
              UTM: {prediction.x.toFixed(0)}E, {prediction.y.toFixed(0)}N
            </p>
          </div>
        </div>
        
        {/* AI Analysis */}
        {analysis && (
          <div className="border-t border-slate-700 pt-4 mb-4">
            <h4 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-blue-400" />
              AI Analysis
            </h4>
            <p className="text-sm text-slate-400 leading-relaxed">{analysis}</p>
          </div>
        )}
        
        {/* Recommendations */}
        {recommendations && recommendations.length > 0 && (
          <div className="border-t border-slate-700 pt-4 mb-4">
            <h4 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-400" />
              Recommendations
            </h4>
            <ul className="space-y-2">
              {recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-slate-400">
                  <span className="inline-block w-5 h-5 bg-blue-900/50 text-blue-300 rounded-full text-xs flex items-center justify-center shrink-0 mt-0.5 border border-blue-700/30">
                    {idx + 1}
                  </span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Model Metrics (Collapsible) */}
        {modelMetrics && (
          <div className="border-t border-slate-700 pt-2">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200 w-full justify-between"
            >
              <span className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                Model Performance
              </span>
              {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {showDetails && (
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm bg-slate-700/30 p-3 rounded-lg border border-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">RMSE:</span>
                  <span className="font-medium text-slate-300">{modelMetrics.rmse.toFixed(3)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">MAE:</span>
                  <span className="font-medium text-slate-300">{modelMetrics.mae.toFixed(3)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">R²:</span>
                  <span className="font-medium text-slate-300">{modelMetrics.r2.toFixed(3)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">MAPE:</span>
                  <span className="font-medium text-slate-300">{modelMetrics.mape.toFixed(1)}%</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
