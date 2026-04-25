import Dashboard from '@/components/Dashboard';
import { loadAllRadiometricData, getStudyAreaBounds } from '@/lib/grdParser';

export default function Home() {
  // Load data on server for initial render
  let initialData;
  try {
    const data = loadAllRadiometricData('./data');
    const bounds = getStudyAreaBounds();
    
    // Return subset for initial render
    const sampleSize = Math.min(data.length, 1000);
    const step = Math.floor(data.length / sampleSize);
    const sample = [];
    for (let i = 0; i < data.length; i += step) {
      sample.push(data[i]);
      if (sample.length >= sampleSize) break;
    }
    
    initialData = {
      bounds,
      dataPoints: data.length,
      sample,
    };
  } catch (error) {
    console.error('Failed to load initial data:', error);
    initialData = undefined;
  }

  return <Dashboard initialData={initialData} />;
}
