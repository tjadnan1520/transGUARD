import dotenv from "dotenv";

dotenv.config();

const env = {
    nodeEnv: process.env.NODE_ENV || "development",
    port: Number(process.env.PORT) || 8000,
    geminiApiKey: process.env.GEMINI_API_KEY || ""
};

export default env;
