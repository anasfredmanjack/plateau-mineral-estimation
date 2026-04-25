// Geocoding service for reverse geocoding coordinates to location names
// Uses OpenStreetMap Nominatim API (free, no API key required)

export interface LocationInfo {
  name: string;
  admin1: string; // State/Province
  admin2: string; // Local Government Area / County
  admin3: string; // Ward / District
  country: string;
  fullAddress: string;
  placeType: string;
}

// Known locations in Jos Plateau study area
const KNOWN_LOCATIONS: Record<string, LocationInfo> = {
  'bukuru': {
    name: 'Bukuru',
    admin1: 'Plateau State',
    admin2: 'Jos South',
    admin3: 'Bukuru Ward',
    country: 'Nigeria',
    fullAddress: 'Bukuru, Jos South, Plateau State, Nigeria',
    placeType: 'town'
  },
  'naraguta': {
    name: 'Naraguta',
    admin1: 'Plateau State',
    admin2: 'Jos North',
    admin3: 'Naraguta Ward',
    country: 'Nigeria',
    fullAddress: 'Naraguta, Jos North, Plateau State, Nigeria',
    placeType: 'area'
  },
  'jos': {
    name: 'Jos',
    admin1: 'Plateau State',
    admin2: 'Jos North',
    admin3: 'Jos Township',
    country: 'Nigeria',
    fullAddress: 'Jos, Plateau State, Nigeria',
    placeType: 'city'
  },
  'rayfield': {
    name: 'Rayfield',
    admin1: 'Plateau State',
    admin2: 'Jos South',
    admin3: 'Rayfield Ward',
    country: 'Nigeria',
    fullAddress: 'Rayfield, Jos South, Plateau State, Nigeria',
    placeType: 'suburb'
  },
  'gyel': {
    name: 'Gyel',
    admin1: 'Plateau State',
    admin2: 'Jos South',
    admin3: 'Gyel Ward',
    country: 'Nigeria',
    fullAddress: 'Gyel, Jos South, Plateau State, Nigeria',
    placeType: 'village'
  },
  'du': {
    name: 'Du',
    admin1: 'Plateau State',
    admin2: 'Jos South',
    admin3: 'Du District',
    country: 'Nigeria',
    fullAddress: 'Du, Jos South, Plateau State, Nigeria',
    placeType: 'village'
  },
  'zawan': {
    name: 'Zawan',
    admin1: 'Plateau State',
    admin2: 'Jos South',
    admin3: 'Zawan Ward',
    country: 'Nigeria',
    fullAddress: 'Zawan, Jos South, Plateau State, Nigeria',
    placeType: 'village'
  },
  'sabon_barki': {
    name: 'Sabon Barki',
    admin1: 'Plateau State',
    admin2: 'Jos South',
    admin3: 'Sabon Barki Ward',
    country: 'Nigeria',
    fullAddress: 'Sabon Barki, Jos South, Plateau State, Nigeria',
    placeType: 'area'
  }
};

// Coordinate boundaries for known areas (approximate)
const LOCATION_BOUNDS: Array<{
  name: string;
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}> = [
  { name: 'bukuru', minLat: 9.70, maxLat: 9.85, minLng: 8.75, maxLng: 8.90 },
  { name: 'naraguta', minLat: 9.85, maxLat: 9.95, minLng: 8.75, maxLng: 8.85 },
  { name: 'jos', minLat: 9.85, maxLat: 10.00, minLng: 8.80, maxLng: 8.95 },
  { name: 'rayfield', minLat: 9.72, maxLat: 9.78, minLng: 8.82, maxLng: 8.88 },
  { name: 'gyel', minLat: 9.65, maxLat: 9.72, minLng: 8.78, maxLng: 8.85 },
  { name: 'du', minLat: 9.68, maxLat: 9.75, minLng: 8.72, maxLng: 8.78 },
  { name: 'zawan', minLat: 9.60, maxLat: 9.68, minLng: 8.80, maxLng: 8.88 },
  { name: 'sabon_barki', minLat: 9.75, maxLat: 9.82, minLng: 8.70, maxLng: 8.78 }
];

export async function reverseGeocode(lat: number, lng: number): Promise<LocationInfo> {
  // First check if coordinates fall within known areas
  const localMatch = findLocalLocation(lat, lng);
  if (localMatch) {
    return localMatch;
  }
  
  // Fall back to Nominatim API for unknown locations
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'ARUM-ALPHA-Mineral-Estimation/1.0'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Geocoding API error');
    }
    
    const data = await response.json();
    
    return {
      name: data.name || data.address?.village || data.address?.suburb || data.address?.town || 'Unknown Location',
      admin1: data.address?.state || data.address?.region || 'Plateau State',
      admin2: data.address?.county || data.address?.locality || 'Jos Area',
      admin3: data.address?.suburb || data.address?.village || 'Unknown Ward',
      country: data.address?.country || 'Nigeria',
      fullAddress: data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      placeType: data.type || 'unknown'
    };
  } catch (error) {
    console.warn('Reverse geocoding failed:', error);
    
    // Return generic location based on coordinates
    return {
      name: `Location ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`,
      admin1: 'Plateau State',
      admin2: 'Jos Area',
      admin3: 'Unknown',
      country: 'Nigeria',
      fullAddress: `Coordinates: ${lat.toFixed(6)}°N, ${lng.toFixed(6)}°E`,
      placeType: 'coordinates'
    };
  }
}

function findLocalLocation(lat: number, lng: number): LocationInfo | null {
  for (const bound of LOCATION_BOUNDS) {
    if (lat >= bound.minLat && lat <= bound.maxLat && 
        lng >= bound.minLng && lng <= bound.maxLng) {
      return KNOWN_LOCATIONS[bound.name] || null;
    }
  }
  return null;
}

export function getNearbyLandmarks(lat: number, lng: number): string[] {
  const landmarks: string[] = [];
  
  // Calculate distance to known mining areas
  const distances = LOCATION_BOUNDS.map(bound => {
    const centerLat = (bound.minLat + bound.maxLat) / 2;
    const centerLng = (bound.minLng + bound.maxLng) / 2;
    const dist = Math.sqrt(
      Math.pow(lat - centerLat, 2) + Math.pow(lng - centerLng, 2)
    );
    return { name: bound.name, distance: dist };
  });
  
  // Sort by distance and get closest
  distances.sort((a, b) => a.distance - b.distance);
  
  const closest = distances[0];
  if (closest && closest.distance < 0.05) { // Within ~5km
    const location = KNOWN_LOCATIONS[closest.name];
    if (location) {
      landmarks.push(`${location.name} area`);
    }
  }
  
  // Add geological context
  if (lat > 9.75 && lat < 9.85 && lng > 8.75 && lng < 8.90) {
    landmarks.push('Younger Granite Province');
    landmarks.push('Tin-bearing zone');
  }
  
  if (lat > 9.70 && lat < 9.80 && lng > 8.80 && lng < 8.90) {
    landmarks.push('Historic mining district');
  }
  
  return landmarks;
}

// Search for locations by name
export async function searchLocation(query: string): Promise<Array<{name: string; lat: number; lng: number}>> {
  const normalizedQuery = query.toLowerCase().trim();
  
  // Check local database first
  const localMatches = Object.entries(KNOWN_LOCATIONS)
    .filter(([key, loc]) => 
      loc.name.toLowerCase().includes(normalizedQuery) ||
      loc.admin2.toLowerCase().includes(normalizedQuery)
    )
    .map(([key, loc]) => {
      // Get approximate center from bounds
      const bound = LOCATION_BOUNDS.find(b => b.name === key);
      return {
        name: loc.fullAddress,
        lat: bound ? (bound.minLat + bound.maxLat) / 2 : 9.75,
        lng: bound ? (bound.minLng + bound.maxLng) / 2 : 8.80
      };
    });
  
  if (localMatches.length > 0) {
    return localMatches;
  }
  
  // Fall back to Nominatim search
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}, Plateau State, Nigeria&limit=5`,
      {
        headers: {
          'User-Agent': 'ARUM-ALPHA-Mineral-Estimation/1.0'
        }
      }
    );
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    return data.map((item: any) => ({
      name: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon)
    }));
  } catch (error) {
    console.warn('Location search failed:', error);
    return [];
  }
}
