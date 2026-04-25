import { NextRequest, NextResponse } from 'next/server';
import { estimateMineralPotential } from '@/lib/groq';
import { 
  loadAllRadiometricData, 
  findNearestDataPoint, 
  findPointsInRadius 
} from '@/lib/grdParser';
import { EstimationRequest, EstimationResponse } from '@/types';

// Config for static export
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Cache radiometric data
let cachedData: ReturnType<typeof loadAllRadiometricData> | null = null;

function getData() {
  if (!cachedData) {
    cachedData = loadAllRadiometricData('./data');
  }
  return cachedData;
}

export async function POST(request: NextRequest): Promise<NextResponse<EstimationResponse | { error: string }>> {
  try {
    const body: EstimationRequest = await request.json();
    
    // Validate input
    if (typeof body.lat !== 'number' || typeof body.lng !== 'number') {
      return NextResponse.json(
        { error: 'Invalid coordinates. lat and lng must be numbers.' },
        { status: 400 }
      );
    }
    
    // Load radiometric data
    const data = getData();
    
    // Find nearest data point
    const nearest = findNearestDataPoint(data, body.lat, body.lng);
    
    if (!nearest) {
      return NextResponse.json(
        { error: 'No radiometric data available for this location' },
        { status: 404 }
      );
    }
    
    // Find surrounding points if requested
    let surrounding: typeof data = [];
    if (body.includeSurrounding) {
      const radius = body.radius || 2; // Default 2km
      surrounding = findPointsInRadius(data, body.lat, body.lng, radius);
    }
    
    // Get AI estimation
    const result = await estimateMineralPotential(nearest, surrounding.length > 0 ? surrounding : undefined);
    
    // Get surrounding predictions if requested
    let surroundingPredictions = undefined;
    if (body.includeSurrounding && surrounding.length > 0) {
      const surroundingResults = await Promise.all(
        surrounding.slice(0, 10).map(p => estimateMineralPotential(p))
      );
      surroundingPredictions = surroundingResults.map(r => r.prediction);
    }
    
    const response: EstimationResponse = {
      prediction: result.prediction,
      surroundingPoints: surroundingPredictions,
      modelMetrics: result.modelMetrics,
      analysis: result.analysis,
      recommendations: result.recommendations,
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Estimation error:', error);
    return NextResponse.json(
      { error: 'Failed to process estimation request' },
      { status: 500 }
    );
  }
}

// Also support GET for simple testing
export async function GET(): Promise<NextResponse<{ status: string; dataPoints: number }>> {
  try {
    const data = getData();
    return NextResponse.json({
      status: 'API is running',
      dataPoints: data.length,
    });
  } catch (error) {
    return NextResponse.json({
      status: 'Error loading data',
      dataPoints: 0,
    }, { status: 500 });
  }
}
