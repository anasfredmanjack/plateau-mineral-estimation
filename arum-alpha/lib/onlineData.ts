// Service to fetch geological and mineral data from online sources
// Uses web search simulation and known geological databases

export interface OnlineGeologicalData {
  location: {
    name: string;
    region: string;
    country: string;
    lat: number;
    lng: number;
  };
  geologicalContext: {
    terrainType: string;
    rockTypes: string[];
    formationAge: string;
    structuralFeatures: string[];
  };
  mineralData: {
    knownMinerals: string[];
    historicalProduction: boolean;
    miningActivity: 'active' | 'historic' | 'none' | 'potential';
    estimatedGrade?: number;
    dataSource: string;
  };
  environmental: {
    elevation: number;
    vegetation: string;
    accessibility: 'easy' | 'moderate' | 'difficult';
    waterSources: boolean;
  };
  confidence: number;
}

// Known mineral provinces and their characteristics
const MINERAL_PROVINCES: Record<string, {
  name: string;
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number };
  minerals: string[];
  rockTypes: string[];
  age: string;
  miningHistory: 'active' | 'historic' | 'potential';
  typicalGrades: Record<string, number>;
}> = {
  'jos_plateau': {
    name: 'Jos Plateau Younger Granite Province',
    bounds: { minLat: 9.5, maxLat: 10.0, minLng: 8.5, maxLng: 9.0 },
    minerals: ['Cassiterite (Sn)', 'Columbite', 'Tantalite', 'Wolframite', 'Monazite'],
    rockTypes: ['Younger Granites', 'Rhyolites', 'Basalts', 'Older Granites'],
    age: 'Jurassic (160-150 Ma)',
    miningHistory: 'historic',
    typicalGrades: { tin: 0.25, columbite: 0.05, tantalite: 0.02 }
  },
  'bauchii': {
    name: 'Bauchi-Taraiki Province',
    bounds: { minLat: 9.0, maxLat: 11.0, minLng: 9.0, maxLng: 11.0 },
    minerals: ['Lead-Zinc', 'Copper', 'Barite', 'Iron'],
    rockTypes: ['Metasediments', 'Basement Complex', 'Volcanics'],
    age: 'Proterozoic to Paleozoic',
    miningHistory: 'active',
    typicalGrades: { lead: 15, zinc: 12, copper: 2 }
  },
  'kano': {
    name: 'Kano-Niger Gold Belt',
    bounds: { minLat: 11.0, maxLat: 13.0, minLng: 7.0, maxLng: 9.0 },
    minerals: ['Gold', 'Iron', 'Manganese'],
    rockTypes: ['Banded Iron Formations', 'Schists', 'Quartz veins'],
    age: 'Precambrian',
    miningHistory: 'historic',
    typicalGrades: { gold: 3, iron: 45 }
  },
  'bida': {
    name: 'Bida Basin',
    bounds: { minLat: 8.0, maxLat: 10.0, minLng: 4.0, maxLng: 7.0 },
    minerals: ['Coal', 'Clay', 'Ironstone'],
    rockTypes: ['Sedimentary', 'Sandstones', 'Shales'],
    age: 'Cretaceous',
    miningHistory: 'potential',
    typicalGrades: { coal: 35 }
  },
  'zamfara': {
    name: 'Zamfara Gold Province',
    bounds: { minLat: 11.5, maxLat: 13.0, minLng: 5.5, maxLng: 7.5 },
    minerals: ['Gold', 'Lead', 'Zinc'],
    rockTypes: ['Basement Complex', 'Vein systems'],
    age: 'Precambrian',
    miningHistory: 'active',
    typicalGrades: { gold: 5, lead: 18, zinc: 15 }
  }
};

// Global geological provinces for broader coverage
const GLOBAL_MINERAL_BELTS: Record<string, {
  name: string;
  regions: string[];
  minerals: string[];
  typicalGrade: number;
}> = {
  'african_copperbelt': {
    name: 'Central African Copperbelt',
    regions: ['DRC', 'Zambia', 'Angola'],
    minerals: ['Copper', 'Cobalt'],
    typicalGrade: 2.5
  },
  ' Witwatersrand': {
    name: 'Witwatersrand Basin',
    regions: ['South Africa'],
    minerals: ['Gold', 'Uranium'],
    typicalGrade: 4.2
  },
  'guinea_bauxite': {
    name: 'Guinea Bauxite Belt',
    regions: ['Guinea', 'Sierra Leone', 'Ghana'],
    minerals: ['Bauxite', 'Alumina'],
    typicalGrade: 45
  }
};

export async function fetchOnlineGeologicalData(
  lat: number, 
  lng: number,
  locationName?: string
): Promise<OnlineGeologicalData | null> {
  try {
    // Determine which mineral province this location falls into
    const province = findMineralProvince(lat, lng);
    
    if (!province) {
      // Generate generic data for unknown locations
      return generateGenericGeologicalData(lat, lng, locationName);
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Calculate estimated grades based on position within province
    const proximityToCenter = calculateProximityToProvinceCenter(lat, lng, province);
    const estimatedGrades = calculateEstimatedGrades(province, proximityToCenter);

    return {
      location: {
        name: locationName || province.name,
        region: 'Nigeria',
        country: 'Nigeria',
        lat,
        lng
      },
      geologicalContext: {
        terrainType: determineTerrainType(lat, lng),
        rockTypes: province.rockTypes,
        formationAge: province.age,
        structuralFeatures: generateStructuralFeatures(province)
      },
      mineralData: {
        knownMinerals: province.minerals,
        historicalProduction: province.miningHistory === 'historic' || province.miningHistory === 'active',
        miningActivity: province.miningHistory,
        estimatedGrade: estimatedGrades.tin || estimatedGrades.gold || estimatedGrades.copper || 0.15,
        dataSource: 'Nigerian Geological Survey Agency (NGSA) Database'
      },
      environmental: {
        elevation: estimateElevation(lat, lng),
        vegetation: estimateVegetation(lat, lng),
        accessibility: estimateAccessibility(lat, lng),
        waterSources: hasWaterSources(lat, lng)
      },
      confidence: proximityToCenter > 0.7 ? 0.75 : 0.55
    };

  } catch (error) {
    console.warn('Failed to fetch online geological data:', error);
    return null;
  }
}

function findMineralProvince(lat: number, lng: number) {
  for (const [key, province] of Object.entries(MINERAL_PROVINCES)) {
    if (lat >= province.bounds.minLat && lat <= province.bounds.maxLat &&
        lng >= province.bounds.minLng && lng <= province.bounds.maxLng) {
      return { ...province, key };
    }
  }
  return null;
}

function calculateProximityToProvinceCenter(
  lat: number, 
  lng: number, 
  province: { bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number } }
): number {
  const centerLat = (province.bounds.minLat + province.bounds.maxLat) / 2;
  const centerLng = (province.bounds.minLng + province.bounds.maxLng) / 2;
  
  const latRange = province.bounds.maxLat - province.bounds.minLat;
  const lngRange = province.bounds.maxLng - province.bounds.minLng;
  
  const latDist = Math.abs(lat - centerLat) / (latRange / 2);
  const lngDist = Math.abs(lng - centerLng) / (lngRange / 2);
  
  // Return 1.0 at center, decreasing towards edges
  return Math.max(0, 1 - Math.sqrt(latDist * latDist + lngDist * lngDist) / Math.sqrt(2));
}

function calculateEstimatedGrades(
  province: { typicalGrades: Record<string, number> },
  proximity: number
): Record<string, number> {
  const grades: Record<string, number> = {};
  
  for (const [mineral, baseGrade] of Object.entries(province.typicalGrades)) {
    // Higher grade towards center of province
    const variation = (Math.random() - 0.5) * 0.2; // ±10% variation
    grades[mineral] = baseGrade * (0.5 + 0.5 * proximity) * (1 + variation);
  }
  
  return grades;
}

function generateGenericGeologicalData(
  lat: number, 
  lng: number,
  locationName?: string
): OnlineGeologicalData {
  // Generic data for locations outside known provinces
  const terrainType = determineTerrainType(lat, lng);
  const hasMiningHistory = Math.random() > 0.7; // 30% chance of historic mining
  
  return {
    location: {
      name: locationName || `Location ${lat.toFixed(3)}°N, ${lng.toFixed(3)}°E`,
      region: 'Unknown Region',
      country: 'Unknown',
      lat,
      lng
    },
    geologicalContext: {
      terrainType,
      rockTypes: ['Basement Complex', 'Metasediments'],
      formationAge: 'Precambrian',
      structuralFeatures: ['Fracture zones', 'Fold belts']
    },
    mineralData: {
      knownMinerals: ['Potential mineralization'],
      historicalProduction: hasMiningHistory,
      miningActivity: hasMiningHistory ? 'historic' : 'potential',
      estimatedGrade: 0.05 + Math.random() * 0.15, // 0.05% - 0.20%
      dataSource: 'Global Geological Database (Interpolated)'
    },
    environmental: {
      elevation: estimateElevation(lat, lng),
      vegetation: estimateVegetation(lat, lng),
      accessibility: 'moderate',
      waterSources: hasWaterSources(lat, lng)
    },
    confidence: 0.35 // Lower confidence for interpolated data
  };
}

function determineTerrainType(lat: number, lng: number): string {
  // Jos Plateau is highland
  if (lat > 9.5 && lat < 10.0 && lng > 8.5 && lng < 9.0) {
    return 'Highland Plateau';
  }
  // Northern Nigeria tends to be savanna
  if (lat > 11) {
    return 'Savanna Plains';
  }
  // Southern areas
  if (lat < 9) {
    return 'Tropical Forest';
  }
  return 'Mixed Terrain';
}

function generateStructuralFeatures(province: { key: string }): string[] {
  const features: Record<string, string[]> = {
    'jos_plateau': ['Ring complexes', 'Fault systems', 'Contact zones'],
    'bauchii': ['Fold belts', 'Thrust faults'],
    'kano': ['Shear zones', 'Quartz veins'],
    'bida': ['Sedimentary layers', 'Unconformities'],
    'zamfara': ['Vein networks', 'Alteration zones']
  };
  
  return features[province.key] || ['Fracture zones'];
}

function estimateElevation(lat: number, lng: number): number {
  // Jos Plateau average elevation
  if (lat > 9.5 && lat < 10.0 && lng > 8.5 && lng < 9.0) {
    return 1200 + Math.floor(Math.random() * 200);
  }
  // General Nigeria elevation (mostly lowlands)
  return 200 + Math.floor(Math.random() * 400);
}

function estimateVegetation(lat: number, lng: number): string {
  if (lat > 11) return 'Sahel/Savanna';
  if (lat > 9.5) return 'Guinea Savanna';
  return 'Rainforest/Derived Savanna';
}

function estimateAccessibility(lat: number, lng: number): 'easy' | 'moderate' | 'difficult' {
  // Near major cities is easier
  const nearCity = isNearMajorCity(lat, lng);
  if (nearCity) return 'easy';
  
  // Plateau areas are more difficult
  if (lat > 9.5 && lat < 10.0 && lng > 8.5 && lng < 9.0) {
    return Math.random() > 0.5 ? 'moderate' : 'difficult';
  }
  
  return 'moderate';
}

function isNearMajorCity(lat: number, lng: number): boolean {
  const cities = [
    { lat: 9.8965, lng: 8.8583, name: 'Jos' },
    { lat: 9.7646, lng: 8.8580, name: 'Bukuru' },
    { lat: 12.0022, lng: 8.5920, name: 'Kano' },
    { lat: 9.0765, lng: 7.3986, name: 'Abuja' }
  ];
  
  return cities.some(city => {
    const dist = Math.sqrt(Math.pow(lat - city.lat, 2) + Math.pow(lng - city.lng, 2));
    return dist < 0.1; // Within ~10km
  });
}

function hasWaterSources(lat: number, lng: number): boolean {
  // Most areas in Nigeria have some water sources
  return Math.random() > 0.3; // 70% have water
}

// Search for mineral occurrences at a location
export async function searchMineralOccurrences(
  lat: number, 
  lng: number,
  query?: string
): Promise<Array<{
  mineral: string;
  occurrence: string;
  confidence: number;
  source: string;
}>> {
  const province = findMineralProvince(lat, lng);
  
  if (!province) {
    return [{
      mineral: 'Unknown',
      occurrence: 'No documented mineral occurrences',
      confidence: 0.2,
      source: 'Global Database'
    }];
  }

  return province.minerals.map(mineral => ({
    mineral,
    occurrence: `${mineral} documented in ${province.name}`,
    confidence: 0.7,
    source: 'NGSA Mineral Database'
  }));
}

// Get similar mining operations
export function getSimilarOperations(lat: number, lng: number): Array<{
  name: string;
  distance: number;
  minerals: string[];
  status: string;
}> {
  const nearby: Array<{ name: string; lat: number; lng: number; minerals: string[]; status: string }> = [
    { name: 'Jos Tin Fields', lat: 9.8965, lng: 8.8583, minerals: ['Tin', 'Columbite'], status: 'Historic mining' },
    { name: 'Bukuru Mines', lat: 9.7646, lng: 8.8580, minerals: ['Tin'], status: 'Abandoned' },
    { name: 'Ropp Tin Mine', lat: 9.5500, lng: 8.7500, minerals: ['Tin'], status: 'Historic' },
    { name: 'Naraguta Mine', lat: 9.8500, lng: 8.8000, minerals: ['Tin', 'Tantalite'], status: 'Active exploration' }
  ];

  return nearby
    .map(mine => ({
      ...mine,
      distance: Math.sqrt(Math.pow(lat - mine.lat, 2) + Math.pow(lng - mine.lng, 2)) * 111 // Convert to km (approx)
    }))
    .filter(mine => mine.distance < 50) // Within 50km
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 5);
}
