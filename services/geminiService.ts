import { GoogleGenAI, Modality } from "@google/genai";

// FIX: Initialize GoogleGenAI directly, assuming API_KEY is set in the environment as per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const transcriptionModel = 'gemini-2.5-flash';
const summarizationModel = 'gemini-2.5-flash';
const ttsModel = 'gemini-2.5-flash-preview-tts';

export const transcribeAudio = async (base64Audio: string, mimeType: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: transcriptionModel,
            contents: {
                parts: [
                    { inlineData: { data: base64Audio, mimeType } },
                    { text: "Transcribe the following audio file. Provide only the transcribed text as the output." }
                ]
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error in transcribeAudio:", error);
        throw new Error("Failed to transcribe audio. The model may not have been able to process the file.");
    }
};

export const summarizeText = async (textToSummarize: string): Promise<string> => {
    const prompt = `Please provide a concise summary of the following text:\n\n---\n\n${textToSummarize}\n\n---\n\nSummary:`;
    try {
        const response = await ai.models.generateContent({
            model: summarizationModel,
            contents: prompt
        });
        return response.text;
    } catch (error) {
        console.error("Error in summarizeText:", error);
        throw new Error("Failed to summarize text.");
    }
};

export const generateSpeech = async (textToSpeak: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: ttsModel,
            contents: [{ parts: [{ text: textToSpeak }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
            throw new Error("No audio data received from API.");
        }
        return base64Audio;
    } catch (error) {
        console.error("Error in generateSpeech:", error);
        throw new Error("Failed to generate speech from summary.");
    }
};
