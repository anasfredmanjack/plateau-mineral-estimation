import Groq from 'groq-sdk';
import type { RadiometricData, AIEstimates } from '../types/index';

export async function analyzeGrid(point: RadiometricData, surrounding: RadiometricData[]) {
  const unavailable = (message: string) => ({ analysisSource: 'unavailable' as const, analysis: '', recommendations: [] as string[], aiEstimates: undefined as AIEstimates | undefined, analysisError: message });
  if (!process.env.GROQ_API_KEY) return unavailable('Groq is not configured. Add GROQ_API_KEY on the server to enable AI analysis.');
  const nearby = surrounding.length ? surrounding : [point];
  const averages = {
    potassium: nearby.reduce((sum, p) => sum + p.potassium, 0) / nearby.length,
    thorium: nearby.reduce((sum, p) => sum + p.thorium, 0) / nearby.length,
    uranium: nearby.reduce((sum, p) => sum + p.uranium, 0) / nearby.length,
  };
  try {
    const client = new Groq({ apiKey: process.env.GROQ_API_KEY, timeout: 30000, maxRetries: 0 });
    const completion = await client.chat.completions.create({
      model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b', temperature: 0.2,
      max_tokens: 3000, response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: `Assess the selected Naraguta location using only its supplied potassium, thorium and uranium readings and nearby averages. Return JSON: {"analysis":string,"recommendations":string[],"confidencePercent":number,"riskLevel":"low"|"medium"|"high","rationale":string}. In analysis, state the selected point's K, Th and U values and compare each against its corresponding nearby average, explaining local variation without assuming deposits. Give 3 recommendations specific to these observations. Confidence is your subjective confidence (0 to 100) in this local radiometric interpretation, not a calibrated probability or confidence in an ore grade. Risk describes uncertainty in following up the observed radiometric pattern, not safety or commercial viability. Always provide confidence and risk, grounding the rationale in this point's readings, nearby sample count and comparison evidence. Do not use a fixed confidence or risk for every location. Readings are raw signed values with unspecified units; preserve signs, do not label them percent or ppm, and do not interpret negative readings as negative concentrations. Do not discuss tin, SnO2, ore grade, or missing tin assays. Do not invent deposits, site conditions or geological causes not established by these inputs. Do not mention Excel, filenames, cell addresses, or the word sheet.` },
        { role: 'user', content: JSON.stringify({ point, nearbyPoints: nearby.length, nearbyAverages: averages }) },
      ],
    });
    if (completion.choices[0]?.finish_reason === 'length') return unavailable('Groq reached the response length limit. Please try the lookup again.');
    const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
    const percent = (v: unknown) => v === null || (typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 100);
    if (typeof result.analysis !== 'string' || !result.analysis.trim() || !Array.isArray(result.recommendations) ||
        !result.recommendations.length || !result.recommendations.every((r: unknown) => typeof r === 'string' && r.trim()) ||
        (result.confidencePercent === null || !percent(result.confidencePercent)) ||
        !['low', 'medium', 'high'].includes(result.riskLevel) || typeof result.rationale !== 'string' || !result.rationale.trim()) {
      return unavailable('Groq returned an incomplete assessment. Try the lookup again.');
    }
    const aiEstimates: AIEstimates = { confidencePercent: result.confidencePercent, riskLevel: result.riskLevel, rationale: result.rationale.slice(0, 2000) };
    return { analysisSource: 'ai' as const, analysis: result.analysis.slice(0, 4000), recommendations: result.recommendations.slice(0, 5).map((r: string) => r.slice(0, 1000)), aiEstimates, analysisError: undefined };
  } catch (error) {
    const status = error instanceof Groq.APIError ? error.status : undefined;
    if (status === 401 || status === 403) return unavailable('Groq authentication failed. Update the server GROQ_API_KEY.');
    if (status === 429) return unavailable('Groq usage limit reached. Please try again later.');
    if (status === 404) return unavailable('The configured Groq model is unavailable. Update the server GROQ_MODEL to a model available to your account.');
    return unavailable('Groq analysis is temporarily unavailable. Please try again.');
  }
}
