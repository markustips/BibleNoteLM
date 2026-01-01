
import { GoogleGenAI, Type, Modality } from "@google/genai";

const apiKey = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey });

export const GeminiService = {
  /**
   * Generates a reflection for a specific Bible verse.
   */
  async generateVerseReflection(verseText: string, reference: string): Promise<string> {
    try {
      if (!apiKey) return "API Key not configured.";
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Read this Bible verse (${reference}): "${verseText}". 
        Write a short, encouraging 2-sentence reflection applicable to modern daily life.`,
      });
      return response.text || "Could not generate reflection.";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Unable to generate reflection at this time.";
    }
  },

  /**
   * Summarizes a sermon transcript into structured JSON.
   */
  async summarizeSermon(transcript: string): Promise<any> {
    try {
       if (!apiKey) return null;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Analyze the following sermon transcript and provide a structured summary in JSON format.
        Transcript: ${transcript}`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING, description: "A catchy title for the sermon" },
                    keyPoints: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "3 key takeaways"
                    },
                    practicalApplications: {
                         type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "1-2 practical applications"
                    },
                    discussionQuestions: {
                         type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "2-3 discussion questions"
                    }
                }
            }
        }
      });
      return response.text ? JSON.parse(response.text) : null;
    } catch (error) {
      console.error("Gemini Error:", error);
      return null;
    }
  },

  /**
   * Explains a bible passage.
   */
  async explainPassage(passage: string): Promise<string> {
    try {
       if (!apiKey) return "API Key not configured.";

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Provide a historical context and theological insight for the following passage. Keep it concise (under 100 words). Passage: ${passage}`,
      });
      return response.text || "No insight available.";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Unable to generate insights.";
    }
  },

  /**
   * Simulates transcribing audio by sending a base64 blob to Gemini.
   */
  async transcribeAudio(base64Audio: string, mimeType: string): Promise<string> {
    try {
       if (!apiKey) return "API Key not configured.";

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Audio
              }
            },
            {
              text: "Transcribe this audio clip accurately."
            }
          ]
        }
      });
      return response.text || "Transcription failed.";
    } catch (error) {
      console.error("Gemini Transcription Error:", error);
      return "Error transcribing audio. Ensure the clip is not too long.";
    }
  },

  /**
   * Generates speech for a given text using Gemini TTS.
   */
  async generateSpeech(text: string, voice: 'Charon' | 'Kore' | 'Puck' | 'Fenrir' | 'Zephyr' = 'Charon'): Promise<string | null> {
    try {
      if (!apiKey) return null;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice },
            },
          },
        },
      });

      return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
    } catch (error) {
      console.error("Gemini TTS Error:", error);
      return null;
    }
  },

  /**
   * Summarizes a text note into key points.
   */
  async summarizeText(text: string): Promise<string> {
    try {
      if (!apiKey) return "API Key not configured.";

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Summarize the following note in 2-3 concise sentences, highlighting the main points:\n\n${text}`,
      });
      return response.text || "Could not generate summary.";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Unable to generate summary at this time.";
    }
  }
};
