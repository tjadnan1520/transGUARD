import { GoogleGenAI } from "@google/genai";
import env from "./env.js";

const gemini = new GoogleGenAI({
    apiKey: env.geminiApiKey
});

export default gemini;