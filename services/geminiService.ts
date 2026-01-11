/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import { GoogleGenAI } from "@google/genai";
import { PRODUCTS } from '../constants';

const getSystemInstruction = () => {
  const productContext = PRODUCTS.map(p =>
    `- ${p.name} ($${p.price}): ${p.description}. Features: ${p.features.join(', ')}`
  ).join('\n');

  return `You are the AI Concierge for "Aura", a warm, organic lifestyle tech brand. 
  Your tone is calm, inviting, grounded, and sophisticated. Avoid overly "techy" jargon; prefer words like "natural", "seamless", "warm", and "texture".
  
  Here is our current product catalog:
  ${productContext}
  
  Answer customer questions about specifications, recommendations, and brand philosophy.
  Keep answers concise (under 3 sentences usually) to fit the chat UI. 
  If asked about products not in the list, gently steer them back to Aura products.`;
};

export const sendMessageToGemini = async (history: { role: string, text: string }[], newMessage: string): Promise<string> => {
  try {
    // Robustly attempt to get the API key
    // In Vite, environment variables must be prefixed with VITE_
    // In AI Studio/some sandboxed environments, they might be in process.env or global variables
    const apiKey =
      ((import.meta as any).env?.VITE_GEMINI_API_KEY) ||
      (typeof process !== 'undefined' ? process.env?.API_KEY : undefined) ||
      (typeof process !== 'undefined' ? process.env?.VITE_GEMINI_API_KEY : undefined) ||
      (window as any).GEMINI_API_KEY;

    if (!apiKey) {
      console.warn("Gemini API Key not found. Please set VITE_GEMINI_API_KEY in .env.local");
      return "I'm sorry, I cannot connect to the concierge right now. (Missing API Key)";
    }

    const ai = new GoogleGenAI(apiKey);

    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: getSystemInstruction(),
      },
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.text }]
      }))
    });

    const result = await chat.sendMessage({ message: newMessage });
    return result.text;

  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I apologize, but I seem to be having trouble reaching our archives at the moment.";
  }
};