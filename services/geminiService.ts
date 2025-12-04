import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateAiTask = async (taskType: string) => {
  try {
    const model = 'gemini-2.5-flash';
    
    let prompt = "";
    if (taskType === 'Sentiment') {
      prompt = "Generate a short customer review (1-2 sentences) about a tech product that is ambiguous in sentiment. The user needs to classify it.";
    } else if (taskType === 'Correction') {
      prompt = "Generate a sentence with subtle grammatical errors or awkward phrasing for a professional email context.";
    } else {
      prompt = "Generate two short paragraphs on the topic of 'Remote Work'. Paragraph A should be formal, Paragraph B should be casual.";
    }

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            content: { type: Type.STRING },
            instructions: { type: Type.STRING },
            sampleAnswer: { type: Type.STRING }
          }
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      content: "Error generating task content. Please try again.",
      instructions: "System offline.",
      sampleAnswer: "N/A"
    };
  }
};