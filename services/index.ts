import * as realService from './geminiService';
import * as mockService from './mockGeminiService';
// FIX: Removed non-existent 'IndividualAnalysisData' type and added required types for new analysis functions.
import type { ChatMessage, StoredConversation, AnalysisData, AIType, TrajectoryAnalysisData, HiddenPotentialData, SkillMatchingResult } from '../types';

// This file intelligently switches between the real API service and a mock service.
// This allows the app to be functional in preview environments (where serverless functions don't run)
// and fully operational in production (like on Vercel).

// Vite injects environment variables into `import.meta.env`.
// We check for this object and its properties safely to avoid errors in environments where Vite isn't running.
const env = (import.meta as any).env || {};

// isProduction is true only if the build is a production build (e.g., `vite build`).
// Vercel sets `env.PROD` to true during its build process.
const isProduction = env.PROD === true;

const service = isProduction ? realService : mockService;

console.log(`[Service Initialized] Using ${isProduction ? 'REAL' : 'MOCK'} service. (isProduction: ${isProduction})`);

// Re-export all functions from the selected service.
export const checkServerStatus = (): Promise<{status: string}> => service.checkServerStatus();

export const getStreamingChatResponse = (messages: ChatMessage[], aiType: AIType, aiName: string): Promise<ReadableStream<Uint8Array> | null> => service.getStreamingChatResponse(messages, aiType, aiName);

export const generateSummary = (chatHistory: ChatMessage[], aiType: AIType, aiName: string): Promise<string> => service.generateSummary(chatHistory, aiType, aiName);

export const reviseSummary = (originalSummary: string, correctionRequest: string): Promise<string> => service.reviseSummary(originalSummary, correctionRequest);

export const analyzeConversations = (summaries: StoredConversation[]): Promise<AnalysisData> => service.analyzeConversations(summaries);

// FIX: Removed the non-existent 'analyzeIndividualConversations' and added exports for new individual analysis functions.
export const analyzeTrajectory = (conversations: StoredConversation[], userId: string): Promise<TrajectoryAnalysisData> => service.analyzeTrajectory(conversations, userId);

export const findHiddenPotential = (conversations: StoredConversation[], userId: string): Promise<HiddenPotentialData> => service.findHiddenPotential(conversations, userId);

export const generateSummaryFromText = (textToAnalyze: string): Promise<string> => service.generateSummaryFromText(textToAnalyze);

export const performSkillMatching = (conversations: StoredConversation[]): Promise<SkillMatchingResult> => service.performSkillMatching(conversations);