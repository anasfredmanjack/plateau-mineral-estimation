'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { 
  Search, 
  MapPin, 
  Layers, 
  Info, 
  BarChart3,
  Download,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import PredictionPanel from './PredictionPanel';
import { reverseGeocode, getNearbyLandmarks, searchLocation } from '@/lib/geocoding';
import { RadiometricData, MineralPrediction, EstimationResponse, StudyAreaBounds, LocationInfo } from '@/types';

// Dynamic import for MapView to avoid SSR issues with Leaflet
const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: function MapLoading() {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  },
});

interface DashboardProps {
  initialData?: {
    bounds: StudyAreaBounds;
    dataPoints: number;
    sample: RadiometricData[];
  };
}

export default function Dashboard({ initialData }: DashboardProps) {
  const [dataPoints, setDataPoints] = useState<RadiometricData[]>(initialData?.sample || []);
  const [bounds, setBounds] = useState<StudyAreaBounds | undefined>(initialData?.bounds);
  const [selectedPoint, setSelectedPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [prediction, setPrediction] = useState<EstimationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [predictions, setPredictions] = useState<MineralPrediction[]>([]);
  const [inputLat, setInputLat] = useState('');
  const [inputLng, setInputLng] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{name: string; lat: number; lng: number}>>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [location, setLocation] = useState<LocationInfo | null>(null);
  const [landmarks, setLandmarks] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Load initial data
  useEffect(() => {
    if (!initialData) {
      fetchData();
    }
  }, [initialData]);
  
  const fetchData = async () => {
    try {
      const response = await fetch('/api/data');
      const data = await response.json();
      if (data.sample) {
        setDataPoints(data.sample);
        setBounds(data.bounds);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };
  
  const handleEstimate = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    setError(null);
    setSelectedPoint({ lat, lng });
    
    try {
      const response = await fetch('/api/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat,
          lng,
          includeSurrounding: true,
          radius: 2,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Estimation failed');
      }
      
      const result: EstimationResponse = await response.json();
      setPrediction(result);
      
      // Get location info and landmarks
      const [locationInfo, nearbyLandmarks] = await Promise.all([
        reverseGeocode(lat, lng),
        Promise.resolve(getNearbyLandmarks(lat, lng))
      ]);
      
      setLocation(locationInfo);
      setLandmarks(nearbyLandmarks);
      
      // Add to predictions list for heatmap
      if (result.prediction) {
        setPredictions(prev => [...prev, result.prediction]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);
  
  const handleMapClick = useCallback((lat: number, lng: number) => {
    setInputLat(lat.toFixed(6));
    setInputLng(lng.toFixed(6));
    handleEstimate(lat, lng);
  }, [handleEstimate]);
  
  const handleManualEstimate = () => {
    const lat = parseFloat(inputLat);
    const lng = parseFloat(inputLng);
    
    if (isNaN(lat) || isNaN(lng)) {
      setError('Please enter valid coordinates');
      return;
    }
    
    handleEstimate(lat, lng);
  };
  
  const exportResults = () => {
    if (!prediction) return;
    
    const exportData = {
      ...prediction,
      location,
      landmarks
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `estimation_${location?.name || selectedPoint?.lat}_${selectedPoint?.lng}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Search for location
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const results = await searchLocation(searchQuery);
      setSearchResults(results);
      setShowSearchResults(true);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const selectSearchResult = (result: {name: string; lat: number; lng: number}) => {
    setSearchQuery(result.name);
    setInputLat(result.lat.toFixed(6));
    setInputLng(result.lng.toFixed(6));
    setShowSearchResults(false);
    handleEstimate(result.lat, result.lng);
  };
  
  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 shadow-lg border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-2 rounded-lg shadow-lg shadow-blue-500/20">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-100">ARUM ALPHA</h1>
                <p className="text-xs text-slate-400">AI-Powered Mineral Estimation System</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-slate-400">Study Area</p>
                <p className="text-sm font-medium text-slate-200">Bukuru, Jos Plateau</p>
              </div>
              <div className="text-right border-l border-slate-600 pl-4">
                <p className="text-xs text-slate-400">Data Points</p>
                <p className="text-sm font-medium text-slate-200">{dataPoints.length.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
          {/* Left Panel - Controls & Input */}
          <div className="lg:col-span-1 space-y-4 overflow-y-auto">
            {/* Location Search */}
            <div className="bg-slate-800 rounded-lg shadow-lg border border-slate-700 p-4">
              <h3 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
                <Search className="w-4 h-4 text-blue-400" />
                Search Location
              </h3>
              
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search Bukuru, Naraguta, Jos..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                />
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-blue-400"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
              
              {showSearchResults && searchResults.length > 0 && (
                <div className="mt-2 border border-slate-600 rounded-lg max-h-40 overflow-y-auto bg-slate-900">
                  {searchResults.map((result, idx) => (
                    <button
                      key={idx}
                      onClick={() => selectSearchResult(result)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-slate-700 border-b border-slate-700 last:border-0 transition-colors"
                    >
                      <p className="font-medium text-slate-200">{result.name}</p>
                      <p className="text-xs text-slate-400">{result.lat.toFixed(4)}°N, {result.lng.toFixed(4)}°E</p>
                    </button>
                  ))}
                </div>
              )}
              
              <p className="text-xs text-slate-500 mt-2">
                Try searching: Bukuru, Naraguta, Rayfield, Gyel
              </p>
            </div>
            
            {/* Coordinate Input */}
            <div className="bg-slate-800 rounded-lg shadow-lg border border-slate-700 p-4">
              <h3 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-400" />
                Enter Coordinates
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Latitude (°N)</label>
                  <input
                    type="number"
                    value={inputLat}
                    onChange={(e) => setInputLat(e.target.value)}
                    placeholder="9.750000"
                    step="0.000001"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Longitude (°E)</label>
                  <input
                    type="number"
                    value={inputLng}
                    onChange={(e) => setInputLng(e.target.value)}
                    placeholder="8.750000"
                    step="0.000001"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <button
                  onClick={handleManualEstimate}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Estimate Mineral Potential
                    </>
                  )}
                </button>
                
                {error && (
                  <div className="bg-red-900/30 border border-red-700 text-red-300 text-sm p-2 rounded-lg">
                    {error}
                  </div>
                )}
              </div>
              
              <p className="text-xs text-slate-500 mt-3">
                Or click directly on the map to select a location.
              </p>
            </div>
            
            {/* Prediction Panel */}
            <PredictionPanel
              prediction={prediction?.prediction || null}
              analysis={prediction?.analysis}
              recommendations={prediction?.recommendations}
              modelMetrics={prediction?.modelMetrics}
              location={location}
              landmarks={landmarks}
              loading={loading}
            />
            
            {/* Map Controls */}
            <div className="bg-slate-800 rounded-lg shadow-lg border border-slate-700 p-4">
              <h3 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                Map Layers
              </h3>
              
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showHeatmap}
                    onChange={(e) => setShowHeatmap(e.target.checked)}
                    className="rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500"
                  />
                  Show Prediction Heatmap
                </label>
              </div>
              
              {predictions.length > 0 && (
                <button
                  onClick={exportResults}
                  className="mt-3 w-full flex items-center justify-center gap-2 text-sm text-blue-400 hover:text-blue-300 py-2 border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export Last Result
                </button>
              )}
            </div>
            
            {/* Legend */}
            <div className="bg-slate-800 rounded-lg shadow-lg border border-slate-700 p-4">
              <h3 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-400" />
                Legend
              </h3>
              
              <div className="space-y-2 text-sm text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500 shadow-sm shadow-red-500/50"></span>
                  <span>High Tin Potential (&gt;0.3%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-yellow-500 shadow-sm shadow-yellow-500/50"></span>
                  <span>Medium Potential (0.15-0.3%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500 shadow-sm shadow-green-500/50"></span>
                  <span>Low Potential (&lt;0.15%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50"></span>
                  <span>Selected Point</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Panel - Map */}
          <div className="lg:col-span-2 bg-slate-800 rounded-lg shadow-lg border border-slate-700 overflow-hidden relative" style={{ minHeight: '400px' }}>
            <MapView
              key={`map-${selectedPoint?.lat}-${selectedPoint?.lng}-${showHeatmap}`}
              dataPoints={dataPoints}
              predictions={predictions}
              selectedPoint={selectedPoint}
              onPointSelect={handleMapClick}
              bounds={bounds}
              showHeatmap={showHeatmap}
            />
          </div>
        </div>
        
        {/* Stats Bar */}
        <div className="mt-4 bg-slate-800 rounded-lg shadow-lg border border-slate-700 p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3 rounded-lg bg-slate-700/50">
              <p className="text-2xl font-bold text-blue-400">{predictions.length}</p>
              <p className="text-xs text-slate-400">Estimations Made</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-700/50">
              <p className="text-2xl font-bold text-green-400">
                {predictions.filter(p => p.predictedGrade > 0.3).length}
              </p>
              <p className="text-xs text-slate-400">High Potential Sites</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-700/50">
              <p className="text-2xl font-bold text-yellow-400">
                {predictions.filter(p => p.predictedGrade > 0.15 && p.predictedGrade <= 0.3).length}
              </p>
              <p className="text-xs text-slate-400">Medium Potential Sites</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-700/50">
              <p className="text-2xl font-bold text-slate-200">
                {predictions.length > 0 
                  ? (predictions.reduce((s, p) => s + p.predictedGrade, 0) / predictions.length * 100).toFixed(2)
                  : '0.00'}%
              </p>
              <p className="text-xs text-slate-400">Average Predicted Grade</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
