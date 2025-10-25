
import type React from 'react';

export const STORAGE_VERSION = 1;

export interface StoredData {
  version: number;
  data: StoredConversation[];
}

// --- NEW ---
// User information for authentication and display
export interface UserInfo {
  id: string;      // Unique identifier, e.g., 'user_17...'
  nickname: string; // Auto-generated memorable name, e.g., 'Brave Lion'
  pin: string;     // 4-digit PIN for authentication
}
// --- END NEW ---

export enum MessageAuthor {
  USER = 'user',
  AI = 'ai',
}

export interface ChatMessage {
  author: MessageAuthor;
  text: string;
}

export type AIType = 'human' | 'dog';

export interface StoredConversation {
  id: number;
  userId: string;
  aiName: string;
  aiType: AIType;
  aiAvatar: string; // e.g. 'human_female_1', 'dog_poodle_1'
  messages: ChatMessage[];
  summary: string;
  date: string;
  status: 'completed' | 'interrupted';
}

export interface AIAssistant {
  id: string;
  type: AIType;
  title: string;
  nameOptions: string[];
  description: string;
  avatarComponent: React.ReactElement;
}

// Types for structured analysis
export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface AnalysisData {
  keyMetrics: {
    totalConsultations: number;
    commonIndustries: string[];
  };
  commonChallenges: ChartDataPoint[];
  careerAspirations: ChartDataPoint[];
  commonStrengths: string[];
  overallInsights: string; // Markdown text for summary
  keyTakeaways: string[];
}


// Types for Skill Matching feature
export interface RecommendedRole {
  role: string;
  reason: string;
  matchScore: number; // A score from 0 to 100
}

export interface SkillToDevelop {
  skill: string;
  reason: string;
}

export interface LearningResource {
  title: string;
  type: 'course' | 'book' | 'article' | 'video';
  provider: string;
}

export interface SkillMatchingResult {
  keyTakeaways: string[];
  analysisSummary: string; // Markdown text
  recommendedRoles: RecommendedRole[];
  skillsToDevelop: SkillToDevelop[];
  learningResources: LearningResource[];
}

// --- NEW TYPES FOR SPLIT INDIVIDUAL ANALYSIS ---

export interface ConsultationEntry {
    dateTime: string;
    estimatedDurationMinutes: number;
}

// 1. Trajectory Analysis
export interface TrajectoryAnalysisData {
    keyTakeaways: string[];
    userId: string;
    totalConsultations: number;
    consultations: ConsultationEntry[];
    keyThemes: string[];
    detectedStrengths: string[];
    areasForDevelopment: string[];
    suggestedNextSteps: string[];
    overallSummary: string; // Markdown
}

// 2. Hidden Potential Analysis
export interface HiddenPotentialData {
    hiddenSkills: SkillToDevelop[];
}

// --- REFACTORED STATE MANAGEMENT ---
export type AnalysisStatus = 'idle' | 'loading' | 'error' | 'success';
export type AnalysisType = 'trajectory' | 'skillMatching' | 'hiddenPotential';

/**
 * A robust, unified type to handle the status, data, and error for any analysis.
 * This is the new standard for managing asynchronous analysis state.
 * @template T The type of the successful data payload.
 */
export interface AnalysisStateItem<T> {
  status: AnalysisStatus;
  data: T | null;
  error: string | null;
}

/**
 * The complete state for all individual analyses performed in the AdminView.
 */
export type AnalysesState = {
  trajectory: AnalysisStateItem<TrajectoryAnalysisData>;
  skillMatching: AnalysisStateItem<SkillMatchingResult>;
  hiddenPotential: AnalysisStateItem<HiddenPotentialData>;
};

// --- LEGACY TYPE for ShareReportModal compatibility ---
// This will be phased out later but is kept for now to avoid refactoring the report generator.
export interface UserAnalysisCache {
    trajectory?: (TrajectoryAnalysisData | { error: string });
    skillMatching?: (SkillMatchingResult | { error: string });
    hiddenPotential?: (HiddenPotentialData | { error: string });
}
