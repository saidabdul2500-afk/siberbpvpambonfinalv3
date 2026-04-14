
import { GoogleGenAI, Type } from "@google/genai";

// Lazy initialization to prevent crash if API key is missing
let aiInstance: any = null;

const getAI = () => {
  if (!aiInstance) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      console.warn("Gemini API Key is missing. AI features will be disabled.");
      return null;
    }
    aiInstance = new GoogleGenAI(apiKey);
  }
  return aiInstance;
};

export const suggestMaterials = async (trainingTitle: string, vocation: string) => {
  const ai = getAI();
  if (!ai) return [];
  
  try {
    const model = ai.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              quantity: { type: Type.NUMBER },
              unit: { type: Type.STRING },
              spec: { type: Type.STRING }
            },
            required: ["name", "quantity", "unit", "spec"]
          }
        }
      }
    });

    const result = await model.generateContent(`Berikan daftar saran bahan pelatihan yang dibutuhkan untuk topik: "${trainingTitle}" dalam bidang kejuruan: "${vocation}". Berikan item yang sangat relevan dengan praktik kejuruan tersebut.`);
    const response = await result.response;
    return JSON.parse(response.text() || '[]');
  } catch (error) {
    console.error("Gemini Suggestion Error:", error);
    return [];
  }
};

export const extractMaterialsFromFile = async (base64Data: string, mimeType: string) => {
  const ai = getAI();
  if (!ai) return [];

  try {
    const model = ai.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              quantity: { type: Type.NUMBER },
              unit: { type: Type.STRING },
              spec: { type: Type.STRING },
              keterangan: { type: Type.STRING }
            },
            required: ["name", "quantity", "unit", "spec"]
          }
        }
      }
    });

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      },
      {
        text: "Ekstrak data daftar bahan pelatihan dari file ini. Fokus pada kolom: Nama Barang, Spesifikasi, Satuan, Jumlah, dan Keterangan (atau Ket). Jika ada header, abaikan dan ambil isinya saja."
      }
    ]);

    const response = await result.response;
    return JSON.parse(response.text() || '[]');
  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    return [];
  }
};
