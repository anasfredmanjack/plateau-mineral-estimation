import { NextRequest, NextResponse } from 'next/server';
import { loadAllRadiometricData, findNearestDataPoint, findPointsInRadius, getSheetMatch } from '@/lib/grdParser';
import type { EstimationResponse, MineralPrediction, RadiometricData } from '@/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export async function POST(request: NextRequest) {
  let body;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON request.' }, { status: 400 });
  }
  if (!body || !Number.isFinite(body.lat) || !Number.isFinite(body.lng) ||
      Math.abs(body.lat) > 90 || Math.abs(body.lng) > 180 ||
      (body.radius !== undefined && (!Number.isFinite(body.radius) || body.radius <= 0 || body.radius > 10))) {
    return NextResponse.json({ error: 'Enter valid latitude (-90 to 90), longitude (-180 to 180), and radius (up to 10 km).' }, { status: 400 });
  }
  try {
    const data = loadAllRadiometricData();
    const nearest = findNearestDataPoint(data, body.lat, body.lng);
    if (!nearest) return NextResponse.json({ error: 'No Naraguta Sheet 168 data at this location. Select a point inside the sheet coverage.' }, { status: 404 });
    const makeResult = (p: RadiometricData): MineralPrediction => ({ ...p, mineralType: 'Naraguta radiometric grid',
      dataSource: 'radiometric', sheetMatch: getSheetMatch(p, body.lat, body.lng) });
    const result: EstimationResponse = {
      prediction: makeResult(nearest),
      surroundingPoints: body.includeSurrounding ? findPointsInRadius(data, body.lat, body.lng, body.radius ?? 2)
        .sort((a, b) => Math.hypot(a.x - nearest.x, a.y - nearest.y) - Math.hypot(b.x - nearest.x, b.y - nearest.y))
        .slice(0, 10).map(makeResult) : undefined,
      analysis: 'Values are copied from the nearest cell in the supplied Naraguta workbook. Signs are preserved. The workbook does not specify data units or provide measured tin grades.',
      recommendations: ['Use the displayed Excel cell and UTM coordinates to compare all three grid sheets.'],
    };
    return NextResponse.json(result);
  } catch (error) {
    console.error('Naraguta lookup failed:', error);
    return NextResponse.json({ error: 'Unable to load the Naraguta workbook data.' }, { status: 500 });
  }
}
export async function GET() {
  try { return NextResponse.json({ status: 'API is running', dataPoints: loadAllRadiometricData().length }); }
  catch { return NextResponse.json({ status: 'Error loading data', dataPoints: 0 }, { status: 500 }); }
}
