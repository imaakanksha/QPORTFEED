
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ProcessedIncident, Severity, GroundingSource } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are the QPORT AI Core. Your mission is to parse emergency dispatch data with 100% precision.
Extract: summary (1-sentence), type (FIRE, MEDICAL, POLICE, TRAFFIC, UTILITY), severity (CRITICAL, MAJOR, MINOR), priority_score (1-10), coords (SF-based).
If the input is hazardous or nonsensical, flag it. 
When using search tools, focus on verifying real-time city conditions or location details.
`;

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const processIncidentWithAI = async (
  rawText: string, 
  useGrounding: boolean = true,
  retryCount = 0
): Promise<ProcessedIncident> => {
  const startTime = performance.now();
  
  if (!rawText.trim() || rawText.length < 5) {
    throw new Error("Input invalid.");
  }

  try {
    const config: any = {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          type: { type: Type.STRING },
          severity: { type: Type.STRING },
          priority_score: { type: Type.NUMBER },
          coords: {
            type: Type.OBJECT,
            properties: {
              lat: { type: Type.NUMBER },
              lng: { type: Type.NUMBER }
            },
            required: ['lat', 'lng']
          }
        },
        required: ['summary', 'type', 'severity', 'priority_score', 'coords']
      }
    };

    if (useGrounding) {
      config.tools = [{ googleSearch: {} }];
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: rawText,
      config
    });

    const data = JSON.parse(response.text || '{}');
    const endTime = performance.now();
    
    // Extract grounding sources if available
    const groundingSources: GroundingSource[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web) {
          groundingSources.push({
            title: chunk.web.title || 'Source',
            uri: chunk.web.uri
          });
        }
      });
    }

    return {
      id: `INC-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      summary: data.summary || "Summary unavailable.",
      type: data.type || "OTHER",
      severity: (data.severity as Severity) || Severity.MINOR,
      priority_score: Math.min(10, Math.max(1, data.priority_score || 5)),
      coords: data.coords,
      status: 'ACTIVE',
      processing_latency: Math.round(endTime - startTime),
      grounding_sources: groundingSources
    };
  } catch (err: any) {
    if (retryCount < 3 && (err.status === 429 || !err.status)) {
      const jitter = Math.random() * 1000;
      await delay(Math.pow(2, retryCount) * 1000 + jitter);
      return processIncidentWithAI(rawText, useGrounding, retryCount + 1);
    }

    return {
      id: `ERR-${Date.now().toString(36).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      summary: "System fault in AI parsing logic.",
      type: "OTHER",
      severity: Severity.MAJOR,
      priority_score: 5,
      coords: { lat: 37.7749, lng: -122.4194 },
      status: 'ERROR'
    };
  }
};

export const generateTacticalAnalysis = async (incident: ProcessedIncident): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Provide a tactical response plan for this incident. Focus on safety, efficiency, and resource allocation. Keep it brief (bullet points). Incident: ${JSON.stringify(incident)}`,
      config: {
        thinkingConfig: { thinkingBudget: 2048 },
      }
    });
    return response.text || "Analysis unavailable.";
  } catch (e) {
    console.error("Analysis failed", e);
    return "Tactical analysis unavailable due to network or model constraints.";
  }
};

export const generateAudioAlert = async (text: string): Promise<ArrayBuffer | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: { parts: [{ text }] },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } }
        }
      }
    });

    const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64) return null;

    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  } catch (e) {
    console.error("TTS Failed", e);
    return null;
  }
};

// Export for diagnostics
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: 'ping',
    });
    return true;
  } catch {
    return false;
  }
};
