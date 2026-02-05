/**
 * AI Configuration
 * 
 * Central place to configure AI models used throughout the app.
 * Change the model here to update it everywhere.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";

if (!apiKey) {
    console.warn("GEMINI_API_KEY is missing. AI features will not work.");
}

export const genAI = new GoogleGenerativeAI(apiKey || "PENDING_KEY");

// ============================================
// MODEL CONFIGURATION - EDIT THIS TO CHANGE MODEL
// ============================================
export const AI_MODEL = "gemini-2.5-flash-lite";

// Available models (for reference):
// - gemini-2.5-flash-lite (fast, cheaper)
// - gemini-2.0-flash (balanced)
// - gemini-2.0-pro (powerful, slower)
// - gemini-1.5-flash (legacy)
// ============================================

/**
 * Get a configured model instance
 */
export function getModel(options?: {
    systemInstruction?: string;
    tools?: any[];
    temperature?: number;
    maxOutputTokens?: number;
}) {
    const config: any = {
        model: AI_MODEL,
    };

    if (options?.systemInstruction) {
        config.systemInstruction = options.systemInstruction;
    }

    if (options?.tools) {
        config.tools = options.tools;
    }

    if (options?.temperature || options?.maxOutputTokens) {
        config.generationConfig = {};
        if (options.temperature) config.generationConfig.temperature = options.temperature;
        if (options.maxOutputTokens) config.generationConfig.maxOutputTokens = options.maxOutputTokens;
    }

    return genAI.getGenerativeModel(config);
}

console.log(`[AI Config] Using model: ${AI_MODEL}`);
