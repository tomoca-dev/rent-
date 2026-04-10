import { GoogleGenAI, Type } from '@google/genai';
import { PaymentEntity } from '../types';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const heuristicInsight = (payment: PaymentEntity): string => {
  const overdue = payment.status !== 'COLLECTED' && payment.dueDate < new Date().toISOString().split('T')[0];
  const tone = payment.predictedLateProbability && payment.predictedLateProbability > 0.65
    ? 'Elevated lateness probability suggests proactive collection outreach.'
    : 'Payment behavior remains within normal portfolio tolerance.';
  return `${tone} ${overdue ? 'The entity is already overdue and should be escalated to manual follow-up.' : 'No immediate intervention is required.'}`;
};

export const getPaymentIntelligence = async (payment: PaymentEntity): Promise<string> => {
  if (!ai) return heuristicInsight(payment);
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze this commercial tenant payment. Provide a concise property-manager insight in 2 sentences max.
Tenant: ${payment.tenantName}
Property: ${payment.property?.propertyName || 'Unknown'}
Unit: ${payment.unit}
Status: ${payment.status}
Risk score: ${payment.riskScore}
Predicted late probability: ${Math.round((payment.predictedLateProbability || 0) * 100)}%
Behavior insight: ${payment.behaviorInsight || 'N/A'}`,
      config: { temperature: 0.2 },
    });
    return response.text || heuristicInsight(payment);
  } catch {
    return heuristicInsight(payment);
  }
};

export const verifyPaymentProof = async (base64Image: string): Promise<{ verified: boolean; confidence: number; detectedAnomaly?: string }> => {
  if (!ai) {
    return { verified: false, confidence: 0.42, detectedAnomaly: 'AI verification unavailable; send to manual review.' };
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
          { text: 'Review this rent payment proof. Return whether it appears consistent, the confidence, and the biggest anomaly if present.' }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            verified: { type: Type.BOOLEAN },
            confidence: { type: Type.NUMBER },
            detectedAnomaly: { type: Type.STRING }
          },
          required: ['verified', 'confidence']
        }
      }
    });
    return JSON.parse(response.text.trim());
  } catch {
    return { verified: false, confidence: 0.35, detectedAnomaly: 'Unable to verify automatically; manual review required.' };
  }
};
