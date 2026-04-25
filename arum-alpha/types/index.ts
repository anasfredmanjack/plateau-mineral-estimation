export interface RadiometricData {
  x: number;
  y: number;
  lat: number;
  lng: number;
  potassium: number;
  thorium: number;
  uranium: number;
}

export interface MineralPrediction {
  lat: number;
  lng: number;
  x: number;
  y: number;
  predictedGrade: number;
  confidence: number;
  mineralType: string;
  potassium: number;
  thorium: number;
  uranium: number;
  kThUratio: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface ModelMetrics {
  rmse: number;
  mae: number;
  r2: number;
  mape: number;
}

export interface EstimationRequest {
  lat: number;
  lng: number;
  includeSurrounding?: boolean;
  radius?: number;
}

export interface EstimationResponse {
  prediction: MineralPrediction;
  surroundingPoints?: MineralPrediction[];
  modelMetrics: ModelMetrics;
  analysis: string;
  recommendations: string[];
}

export interface StudyAreaBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface LocationInfo {
  name: string;
  admin1: string;
  admin2: string;
  admin3: string;
  country: string;
  fullAddress: string;
  placeType: string;
}
