import Groq from 'groq-sdk';
import type { RadiometricData } from '../types/index';

export async function analyzeGrid(point: RadiometricData, surrounding: RadiometricData[]) {
  const nearby = surrounding.length ? surrounding : [point];
  const averages = {
    potassium: nearby.reduce((sum, p) => sum + p.potassium, 0) / nearby.length,
    thorium: nearby.reduce((sum, p) => sum + p.thorium, 0) / nearby.length,
    uranium: nearby.reduce((sum, p) => sum + p.uranium, 0) / nearby.length,
  };
  const fallback = {
    analysisSource: 'local' as 'ai' | 'local',
    analysis: `This location has potassium ${point.potassium.toFixed(3)}, thorium ${point.thorium.toFixed(3)}, and uranium ${point.uranium.toFixed(3)} in the Naraguta grid. Across ${nearby.length} nearby grid points, the averages are ${averages.potassium.toFixed(3)}, ${averages.thorium.toFixed(3)}, and ${averages.uranium.toFixed(3)}, respectively. These raw grid values require calibration and field verification before interpreting mineral potential.`,
    recommendations: [
      'Confirm the grid calibration and measurement units before interpreting the radiometric values.',
      'Compare the surrounding radiometric pattern with geological mapping and existing survey records.',
      'Collect ground measurements and laboratory samples before estimating tin grade or exploration risk.',
    ],
  };
  if (!process.env.GROQ_API_KEY) return fallback;
  try {
    const client = new Groq({ apiKey: process.env.GROQ_API_KEY, timeout: 12000, maxRetries: 0 });
    const completion = await client.chat.completions.create({
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile', temperature: 0.2,
      max_tokens: 700, response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'Write a concise geological interpretation and 3 practical exploration recommendations for Naraguta grid data. Return JSON with analysis (string) and recommendations (array of strings). These are raw signed values with unspecified units. Do not assign percent or ppm, flip signs, infer measured tin grades, invent model metrics/confidence/risk, or claim known deposits or site conditions. Compare only the supplied values and nearby averages. Mention calibration where necessary. Do not mention spreadsheets, Excel, source filenames, cell addresses, or the word sheet.' },
        { role: 'user', content: JSON.stringify({ point, nearbyPoints: nearby.length, nearbyAverages: averages }) },
      ],
    });
    const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
    if (typeof result.analysis !== 'string' || !result.analysis.trim() || !Array.isArray(result.recommendations) ||
        !result.recommendations.length || !result.recommendations.every((r: unknown) => typeof r === 'string' && r.trim())) return fallback;
    return { analysisSource: 'ai' as const, analysis: result.analysis.slice(0, 4000), recommendations: result.recommendations.slice(0, 5).map((r: string) => r.slice(0, 1000)) };
  } catch {
    return fallback;
  }
}
