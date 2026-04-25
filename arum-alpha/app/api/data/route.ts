import { NextResponse } from 'next/server';
import { loadAllRadiometricData, getStudyAreaBounds } from '@/lib/grdParser';
import { RadiometricData, StudyAreaBounds } from '@/types';

// Config for static export
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface DataResponse {
  bounds: StudyAreaBounds;
  dataPoints: number;
  sample: RadiometricData[];
  grid: {
    nx: number;
    ny: number;
  };
}

export async function GET(): Promise<NextResponse<DataResponse | { error: string }>> {
  try {
    const data = loadAllRadiometricData('./data');
    const bounds = getStudyAreaBounds();
    
    // Return a subset for visualization (max 1000 points)
    const sampleSize = Math.min(data.length, 1000);
    const step = Math.floor(data.length / sampleSize);
    const sample = [];
    
    for (let i = 0; i < data.length; i += step) {
      sample.push(data[i]);
      if (sample.length >= sampleSize) break;
    }
    
    // Estimate grid dimensions
    const nx = Math.sqrt(data.length * ((bounds.maxX - bounds.minX) / (bounds.maxY - bounds.minY)));
    const ny = data.length / nx;
    
    const response: DataResponse = {
      bounds,
      dataPoints: data.length,
      sample,
      grid: {
        nx: Math.round(nx),
        ny: Math.round(ny),
      },
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Data API error:', error);
    return NextResponse.json(
      { error: 'Failed to load radiometric data' },
      { status: 500 }
    );
  }
}
