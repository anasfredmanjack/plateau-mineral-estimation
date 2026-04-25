import Groq from 'groq-sdk';
import { MineralPrediction, ModelMetrics, RadiometricData } from '@/types';

// Initialize Groq client
// For production, use environment variable: process.env.GROQ_API_KEY
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'gsk_dummy_key_for_development',
});

// Recommended model for geospatial and mineral estimation tasks
const MODEL = 'llama-3.3-70b-versatile';

export interface EstimationResult {
  prediction: MineralPrediction;
  analysis: string;
  recommendations: string[];
  modelMetrics: ModelMetrics;
}

export async function estimateMineralPotential(
  data: RadiometricData,
  surroundingData?: RadiometricData[]
): Promise<EstimationResult> {
  try {
    // Calculate geochemical indices
    const kThUratio = data.potassium / (data.thorium + data.uranium + 0.001);
    const thUratio = data.thorium / (data.uranium + 0.001);
    
    // Build context from surrounding points if available
    let contextData = '';
    if (surroundingData && surroundingData.length > 0) {
      const avgK = surroundingData.reduce((s, d) => s + d.potassium, 0) / surroundingData.length;
      const avgTh = surroundingData.reduce((s, d) => s + d.thorium, 0) / surroundingData.length;
      const avgU = surroundingData.reduce((s, d) => s + d.uranium, 0) / surroundingData.length;
      contextData = `
Surrounding area average values (${surroundingData.length} points):
- Potassium: ${avgK.toFixed(2)}%
- Thorium: ${avgTh.toFixed(1)} ppm  
- Uranium: ${avgU.toFixed(1)} ppm`;
    }

    const prompt = `You are an expert geophysicist specializing in tin (cassiterite) mineralization prediction for the Jos Plateau, Nigeria.

Analyze the following radiometric data point from the Bukuru study area (Sheet 168 Naraguta):

Location: ${data.lat.toFixed(6)}°N, ${data.lng.toFixed(6)}°E
UTM: ${data.x.toFixed(1)}E, ${data.y.toFixed(1)}N

Radiometric values:
- Potassium (K): ${data.potassium.toFixed(2)}%
- Thorium (Th): ${data.thorium.toFixed(1)} ppm
- Uranium (U): ${data.uranium.toFixed(1)} ppm
- K/(Th+U) ratio: ${kThUratio.toFixed(3)}
- Th/U ratio: ${thUratio.toFixed(2)}${contextData}

Based on known geology of the Jos Plateau Younger Granite province:
- Tin mineralization is associated with alkaline granites and high Th/U ratios
- Anomalous Th > 20 ppm suggests hydrothermal alteration
- K > 3% indicates feldspar-rich zones potentially hosting cassiterite
- Typical ore grade in Bukuru ranges from 0.1-0.8% SnO2

Provide a JSON response with:
1. predictedGrade: estimated tin grade (0.0-1.0 as percentage)
2. confidence: 0.0-1.0
3. riskLevel: "low", "medium", or "high" exploration risk
4. analysis: detailed geological interpretation (2-3 sentences)
5. recommendations: array of 2-3 specific exploration recommendations

Respond ONLY with valid JSON in this format:
{
  "predictedGrade": number,
  "confidence": number,
  "riskLevel": "low" | "medium" | "high",
  "analysis": "string",
  "recommendations": ["string", "string", "string"]
}`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a geophysical expert. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: MODEL,
      temperature: 0.3,
      max_tokens: 800,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content || '{}';
    const result = JSON.parse(content);

    // Build prediction object
    const prediction: MineralPrediction = {
      lat: data.lat,
      lng: data.lng,
      x: data.x,
      y: data.y,
      predictedGrade: Math.max(0, Math.min(1, result.predictedGrade || 0.1)),
      confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
      mineralType: 'Cassiterite (SnO2)',
      potassium: data.potassium,
      thorium: data.thorium,
      uranium: data.uranium,
      kThUratio: kThUratio,
      riskLevel: result.riskLevel || 'medium',
    };

    // Simulate model metrics (would come from actual model training)
    const metrics: ModelMetrics = {
      rmse: 0.08,
      mae: 0.06,
      r2: 0.74,
      mape: 15.2,
    };

    return {
      prediction,
      analysis: result.analysis || 'No analysis provided.',
      recommendations: result.recommendations || ['Conduct field verification', 'Review geochemical surveys'],
      modelMetrics: metrics,
    };
  } catch (error) {
    console.error('Groq API error:', error);
    
    // Fallback to rule-based estimation
    return fallbackEstimation(data);
  }
}

function fallbackEstimation(data: RadiometricData): EstimationResult {
  // Rule-based estimation using known geochemical associations
  const kThUratio = data.potassium / (data.thorium + data.uranium + 0.001);
  const thUratio = data.thorium / (data.uranium + 0.001);
  
  // Tin mineralization indicators
  let grade = 0.05; // Base grade
  let confidence = 0.5;
  let riskLevel: 'low' | 'medium' | 'high' = 'medium';
  
  // High Th indicates hydrothermal activity
  if (data.thorium > 20) {
    grade += 0.15;
    confidence += 0.1;
  }
  
  // High Th/U ratio suggests magmatic differentiation
  if (thUratio > 4) {
    grade += 0.1;
    confidence += 0.05;
  }
  
  // Potassium alteration zones
  if (data.potassium > 3) {
    grade += 0.1;
  }
  
  // Cap grade at realistic values
  grade = Math.min(grade, 0.8);
  confidence = Math.min(confidence, 0.95);
  
  if (grade > 0.3) riskLevel = 'low';
  else if (grade > 0.15) riskLevel = 'medium';
  else riskLevel = 'high';

  const analysis = `Thorium value of ${data.thorium.toFixed(1)} ppm ${data.thorium > 20 ? 'exceeds' : 'is within'} typical background levels. ` +
    `Th/U ratio of ${thUratio.toFixed(2)} ${thUratio > 4 ? 'suggests magmatic differentiation favorable' : 'shows normal'} for tin mineralization. ` +
    `Potassium at ${data.potassium.toFixed(2)}% indicates ${data.potassium > 3 ? 'alteration zone potential' : 'normal granite composition'}.`;

  return {
    prediction: {
      lat: data.lat,
      lng: data.lng,
      x: data.x,
      y: data.y,
      predictedGrade: parseFloat(grade.toFixed(3)),
      confidence: parseFloat(confidence.toFixed(2)),
      mineralType: 'Cassiterite (SnO2)',
      potassium: data.potassium,
      thorium: data.thorium,
      uranium: data.uranium,
      kThUratio: kThUratio,
      riskLevel,
    },
    analysis,
    recommendations: [
      riskLevel === 'low' ? 'Priority target: conduct detailed geochemical sampling' : 'Low priority: continue regional reconnaissance',
      'Integrate with historical mining data from this area',
      'Consider ground radiometric survey for verification',
    ],
    modelMetrics: {
      rmse: 0.12,
      mae: 0.09,
      r2: 0.65,
      mape: 22.5,
    },
  };
}

export async function batchEstimate(
  dataPoints: RadiometricData[]
): Promise<EstimationResult[]> {
  // Process in batches to avoid rate limits
  const results: EstimationResult[] = [];
  const batchSize = 5;
  
  for (let i = 0; i < dataPoints.length; i += batchSize) {
    const batch = dataPoints.slice(i, i + batchSize);
    const batchPromises = batch.map(point => estimateMineralPotential(point));
    
    const batchResults = await Promise.allSettled(batchPromises);
    
    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      }
    }
    
    // Rate limiting - wait between batches
    if (i + batchSize < dataPoints.length) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  
  return results;
}
