/**
 * Preflection Engine
 * Dynamic query-adaptive prompt and inference parameter generation
 */

import { SpinVector, computeSpinVector } from "./superarray.js";
import { TickPhase } from "./vbc.js";

// ============================================================================
// INFERENCE PARAMETERS
// ============================================================================

export interface InferenceParams {
  temperature: number;        // [0,2] - creativity vs. determinism
  topP: number;               // [0,1] - nucleus sampling
  topK: number;               // [1,100] - token filtering
  maxTokens: number;          // Response length limit
  presencePenalty: number;    // [-2,2] - penalize used tokens
  frequencyPenalty: number;   // [-2,2] - penalize repeated tokens
  stopSequences: string[];    // Custom stop sequences
}

// ============================================================================
// PREFLECTION PROFILE
// ============================================================================

export interface PreflectionProfile {
  id: string;
  name: string;
  description: string;

  // Prompt engineering
  systemPromptTemplate: string;
  contextWindowStrategy: 'full' | 'recent' | 'relevant' | 'hierarchical';
  memoryDepth: number;        // How many atoms to retrieve
  dimensionFocus: string[];   // Which Superarray dimensions to emphasize

  // Inference tuning
  baseParams: InferenceParams;
  adaptiveParams: boolean;    // Auto-tune params based on query

  // VBC integration
  preferredPhase?: TickPhase;
  axisWeights?: Record<string, number>;

  // Meta
  tags: string[];
}

// ============================================================================
// QUERY ANALYSIS
// ============================================================================

export interface QueryAnalysis {
  queryType: QueryType;
  complexity: number;         // [0,1]
  specificity: number;        // [0,1]
  creativityRequired: number; // [0,1]
  urgency: number;            // [0,1]
  riskLevel: number;          // [0,1]
  spinVector: SpinVector;
  keywords: string[];
  entities: string[];
  intent: string;
}

export type QueryType =
  | 'factual'           // Straightforward information request
  | 'analytical'        // Requires reasoning and analysis
  | 'creative'          // Needs imagination and novelty
  | 'exploratory'       // Open-ended investigation
  | 'procedural'        // Step-by-step instructions
  | 'troubleshooting'   // Debugging and problem-solving
  | 'conversational'    // Casual chat
  | 'planning'          // Strategic planning
  | 'critique'          // Evaluation and feedback
  | 'synthesis';        // Combine multiple sources

// ============================================================================
// DEFAULT PROFILES
// ============================================================================

export const DEFAULT_PROFILES: Record<string, PreflectionProfile> = {
  balanced: {
    id: 'balanced',
    name: 'Balanced',
    description: 'General-purpose adaptive profile',
    systemPromptTemplate: 'You are a helpful AI assistant. Provide clear, accurate, and thoughtful responses.',
    contextWindowStrategy: 'relevant',
    memoryDepth: 10,
    dimensionFocus: ['semantic', 'relation', 'pragmatics', 'actionability'],
    baseParams: {
      temperature: 0.7,
      topP: 0.9,
      topK: 40,
      maxTokens: 2048,
      presencePenalty: 0.0,
      frequencyPenalty: 0.0,
      stopSequences: [],
    },
    adaptiveParams: true,
    tags: ['default', 'general'],
  },

  precise: {
    id: 'precise',
    name: 'Precise',
    description: 'High accuracy, low creativity',
    systemPromptTemplate: 'You are a precise and accurate AI assistant. Provide factual, well-sourced responses with minimal speculation.',
    contextWindowStrategy: 'relevant',
    memoryDepth: 15,
    dimensionFocus: ['epistemic', 'entity', 'causality', 'alignment'],
    baseParams: {
      temperature: 0.3,
      topP: 0.85,
      topK: 20,
      maxTokens: 2048,
      presencePenalty: 0.1,
      frequencyPenalty: 0.1,
      stopSequences: [],
    },
    adaptiveParams: false,
    preferredPhase: 'commit',
    tags: ['factual', 'deterministic'],
  },

  creative: {
    id: 'creative',
    name: 'Creative',
    description: 'High creativity and exploration',
    systemPromptTemplate: 'You are a creative and imaginative AI assistant. Explore novel ideas, think divergently, and embrace unconventional approaches.',
    contextWindowStrategy: 'hierarchical',
    memoryDepth: 8,
    dimensionFocus: ['semantic', 'aesthetic', 'computational', 'meta'],
    baseParams: {
      temperature: 1.2,
      topP: 0.95,
      topK: 60,
      maxTokens: 3072,
      presencePenalty: 0.3,
      frequencyPenalty: 0.3,
      stopSequences: [],
    },
    adaptiveParams: true,
    preferredPhase: 'capture',
    tags: ['creative', 'exploratory'],
  },

  analytical: {
    id: 'analytical',
    name: 'Analytical',
    description: 'Deep reasoning and structured thinking',
    systemPromptTemplate: 'You are an analytical AI assistant. Break down complex problems, use rigorous logic, and provide well-structured reasoning.',
    contextWindowStrategy: 'relevant',
    memoryDepth: 20,
    dimensionFocus: ['causality', 'relation', 'rhetorical', 'epistemic', 'computational'],
    baseParams: {
      temperature: 0.5,
      topP: 0.9,
      topK: 30,
      maxTokens: 4096,
      presencePenalty: 0.0,
      frequencyPenalty: 0.0,
      stopSequences: [],
    },
    adaptiveParams: true,
    preferredPhase: 'bridge',
    tags: ['analytical', 'reasoning'],
  },

  action: {
    id: 'action',
    name: 'Action-Oriented',
    description: 'Focused on concrete next steps',
    systemPromptTemplate: 'You are an action-oriented AI assistant. Provide clear, executable steps and concrete recommendations.',
    contextWindowStrategy: 'recent',
    memoryDepth: 5,
    dimensionFocus: ['actionability', 'pragmatics', 'structural'],
    baseParams: {
      temperature: 0.6,
      topP: 0.88,
      topK: 35,
      maxTokens: 1536,
      presencePenalty: 0.1,
      frequencyPenalty: 0.2,
      stopSequences: [],
    },
    adaptiveParams: false,
    preferredPhase: 'commit',
    tags: ['actionable', 'practical'],
  },

  exploration: {
    id: 'exploration',
    name: 'Exploratory',
    description: 'Open-ended investigation',
    systemPromptTemplate: 'You are an exploratory AI assistant. Ask probing questions, consider multiple perspectives, and map the solution space.',
    contextWindowStrategy: 'hierarchical',
    memoryDepth: 12,
    dimensionFocus: ['semantic', 'relation', 'meta', 'rhetorical'],
    baseParams: {
      temperature: 0.9,
      topP: 0.92,
      topK: 50,
      maxTokens: 2560,
      presencePenalty: 0.2,
      frequencyPenalty: 0.1,
      stopSequences: [],
    },
    adaptiveParams: true,
    preferredPhase: 'capture',
    tags: ['exploratory', 'investigative'],
  },
};

// ============================================================================
// PREFLECTION ENGINE
// ============================================================================

export class PreflectionEngine {
  private profiles: Map<string, PreflectionProfile>;
  private currentProfile: PreflectionProfile;

  constructor(customProfiles?: PreflectionProfile[]) {
    this.profiles = new Map();

    // Load default profiles
    for (const [key, profile] of Object.entries(DEFAULT_PROFILES)) {
      this.profiles.set(key, profile);
    }

    // Add custom profiles
    if (customProfiles) {
      for (const profile of customProfiles) {
        this.profiles.set(profile.id, profile);
      }
    }

    this.currentProfile = DEFAULT_PROFILES.balanced!;
  }

  // ========================================================================
  // QUERY ANALYSIS
  // ========================================================================

  analyzeQuery(query: string): QueryAnalysis {
    const lowerQuery = query.toLowerCase();

    // Detect query type
    const queryType = this.detectQueryType(lowerQuery);

    // Compute complexity (based on length, sentence count, specialized terms)
    const wordCount = query.split(/\s+/).length;
    const sentenceCount = query.split(/[.!?]+/).length;
    const complexity = Math.min(1, (wordCount / 50 + sentenceCount / 5) / 2);

    // Compute specificity (presence of specific entities, numbers, etc.)
    const hasNumbers = /\d+/.test(query);
    const hasQuotes = /["']/.test(query);
    const hasSpecificTerms = /\b(specific|exactly|precisely|particular)\b/.test(lowerQuery);
    const specificity = (hasNumbers ? 0.3 : 0) + (hasQuotes ? 0.3 : 0) + (hasSpecificTerms ? 0.4 : 0);

    // Compute creativity required
    const creativityRequired = this.computeCreativityRequired(queryType, lowerQuery);

    // Compute urgency
    const urgencyKeywords = ['urgent', 'asap', 'immediately', 'now', 'quickly'];
    const urgency = urgencyKeywords.some(kw => lowerQuery.includes(kw)) ? 0.9 : 0.3;

    // Compute risk level
    const riskKeywords = ['delete', 'remove', 'destroy', 'irreversible', 'permanent'];
    const riskLevel = riskKeywords.some(kw => lowerQuery.includes(kw)) ? 0.8 : 0.2;

    // Extract keywords (simplified - just take important-looking words)
    const keywords = query
      .split(/\s+/)
      .filter(word => word.length > 4 && !/^(this|that|what|when|where|which|their)$/i.test(word))
      .slice(0, 10);

    // Extract entities (simplified - look for capitalized words)
    const entities = query
      .split(/\s+/)
      .filter(word => /^[A-Z]/.test(word) && word.length > 1)
      .slice(0, 5);

    // Compute spin vector
    const spinVector = computeSpinVector(query);

    // Determine intent
    const intent = this.determineIntent(queryType, lowerQuery);

    return {
      queryType,
      complexity,
      specificity,
      creativityRequired,
      urgency,
      riskLevel,
      spinVector,
      keywords,
      entities,
      intent,
    };
  }

  private detectQueryType(lowerQuery: string): QueryType {
    // Factual indicators
    if (/^(what is|define|who is|when did|where is)/.test(lowerQuery)) {
      return 'factual';
    }

    // Analytical indicators
    if (/\b(analyze|compare|evaluate|assess|examine)\b/.test(lowerQuery)) {
      return 'analytical';
    }

    // Creative indicators
    if (/\b(create|design|imagine|brainstorm|innovate)\b/.test(lowerQuery)) {
      return 'creative';
    }

    // Exploratory indicators
    if (/\b(explore|investigate|research|discover|find out)\b/.test(lowerQuery)) {
      return 'exploratory';
    }

    // Procedural indicators
    if (/\b(how to|steps|process|procedure|guide|tutorial)\b/.test(lowerQuery)) {
      return 'procedural';
    }

    // Troubleshooting indicators
    if (/\b(fix|debug|error|problem|issue|broken|not working)\b/.test(lowerQuery)) {
      return 'troubleshooting';
    }

    // Planning indicators
    if (/\b(plan|strategy|roadmap|approach|organize)\b/.test(lowerQuery)) {
      return 'planning';
    }

    // Critique indicators
    if (/\b(review|critique|feedback|improve|refine)\b/.test(lowerQuery)) {
      return 'critique';
    }

    // Synthesis indicators
    if (/\b(combine|integrate|synthesize|merge|unify)\b/.test(lowerQuery)) {
      return 'synthesis';
    }

    // Default to conversational
    return 'conversational';
  }

  private computeCreativityRequired(queryType: QueryType, lowerQuery: string): number {
    const baseCreativity: Record<QueryType, number> = {
      factual: 0.2,
      analytical: 0.4,
      creative: 0.95,
      exploratory: 0.7,
      procedural: 0.3,
      troubleshooting: 0.5,
      conversational: 0.6,
      planning: 0.65,
      critique: 0.5,
      synthesis: 0.75,
    };

    let creativity = baseCreativity[queryType];

    // Adjust based on specific keywords
    if (/\b(novel|unique|original|innovative)\b/.test(lowerQuery)) {
      creativity = Math.min(1, creativity + 0.2);
    }

    if (/\b(standard|typical|common|usual)\b/.test(lowerQuery)) {
      creativity = Math.max(0, creativity - 0.2);
    }

    return creativity;
  }

  private determineIntent(queryType: QueryType, lowerQuery: string): string {
    const intents: Record<QueryType, string> = {
      factual: 'Seeking factual information',
      analytical: 'Requesting deep analysis',
      creative: 'Needs creative ideation',
      exploratory: 'Open-ended exploration',
      procedural: 'Wants step-by-step guidance',
      troubleshooting: 'Solving a problem',
      conversational: 'Casual conversation',
      planning: 'Strategic planning',
      critique: 'Seeking evaluation',
      synthesis: 'Combining multiple ideas',
    };

    return intents[queryType];
  }

  // ========================================================================
  // PROFILE SELECTION
  // ========================================================================

  selectProfile(analysis: QueryAnalysis): PreflectionProfile {
    // Match query type to profile
    const profileMap: Record<QueryType, string> = {
      factual: 'precise',
      analytical: 'analytical',
      creative: 'creative',
      exploratory: 'exploration',
      procedural: 'action',
      troubleshooting: 'analytical',
      conversational: 'balanced',
      planning: 'action',
      critique: 'analytical',
      synthesis: 'creative',
    };

    const suggestedProfileId = profileMap[analysis.queryType];
    const profile = this.profiles.get(suggestedProfileId) || DEFAULT_PROFILES.balanced!;

    this.currentProfile = profile;
    return profile;
  }

  // ========================================================================
  // ADAPTIVE PARAMETER TUNING
  // ========================================================================

  tuneParameters(profile: PreflectionProfile, analysis: QueryAnalysis): InferenceParams {
    if (!profile.adaptiveParams) {
      return { ...profile.baseParams };
    }

    const params = { ...profile.baseParams };

    // Adjust temperature based on creativity required
    params.temperature = Math.max(
      0.1,
      Math.min(2.0, profile.baseParams.temperature + (analysis.creativityRequired - 0.5) * 0.6)
    );

    // Adjust topP based on specificity
    params.topP = Math.max(
      0.5,
      Math.min(1.0, profile.baseParams.topP - analysis.specificity * 0.1)
    );

    // Adjust maxTokens based on complexity
    params.maxTokens = Math.round(
      profile.baseParams.maxTokens * (1 + analysis.complexity * 0.5)
    );

    // Adjust penalties based on risk
    if (analysis.riskLevel > 0.7) {
      params.presencePenalty = Math.min(2.0, params.presencePenalty + 0.3);
      params.frequencyPenalty = Math.min(2.0, params.frequencyPenalty + 0.3);
    }

    return params;
  }

  // ========================================================================
  // PROMPT ENGINEERING
  // ========================================================================

  generateSystemPrompt(
    profile: PreflectionProfile,
    analysis: QueryAnalysis,
    context?: PromptContext
  ): string {
    let prompt = profile.systemPromptTemplate;

    // Add dimension focus
    if (profile.dimensionFocus.length > 0) {
      prompt += `\n\nFocus on these aspects: ${profile.dimensionFocus.join(', ')}.`;
    }

    // Add query-specific guidance
    if (analysis.complexity > 0.7) {
      prompt += '\n\nThis is a complex query. Break it down into manageable parts.';
    }

    if (analysis.specificity > 0.7) {
      prompt += '\n\nProvide precise, specific information. Avoid generalizations.';
    }

    if (analysis.creativityRequired > 0.7) {
      prompt += '\n\nThink creatively and explore unconventional approaches.';
    }

    if (analysis.urgency > 0.7) {
      prompt += '\n\nThis is time-sensitive. Provide a concise, actionable response.';
    }

    if (analysis.riskLevel > 0.7) {
      prompt += '\n\n⚠️ This query involves potentially risky operations. Exercise caution and clearly explain implications.';
    }

    // Add context if provided
    if (context?.recentMemories && context.recentMemories.length > 0) {
      prompt += `\n\nRecent context: ${context.recentMemories.slice(0, 3).join('; ')}`;
    }

    if (context?.userPreferences) {
      prompt += `\n\nUser preferences: ${context.userPreferences}`;
    }

    return prompt;
  }

  generateUserPrompt(
    query: string,
    analysis: QueryAnalysis,
    context?: PromptContext
  ): string {
    let prompt = query;

    // Add context enrichment
    if (context?.relevantFacts && context.relevantFacts.length > 0) {
      prompt = `Context: ${context.relevantFacts.join(', ')}\n\nQuery: ${query}`;
    }

    // Add constraints if needed
    if (analysis.riskLevel > 0.7) {
      prompt += '\n\n[Safety check required before execution]';
    }

    return prompt;
  }

  // ========================================================================
  // PREFLECTION ORCHESTRATION
  // ========================================================================

  preflect(query: string, context?: PromptContext): PreflectionResult {
    // 1. Analyze the query
    const analysis = this.analyzeQuery(query);

    // 2. Select optimal profile
    const profile = this.selectProfile(analysis);

    // 3. Tune inference parameters
    const inferenceParams = this.tuneParameters(profile, analysis);

    // 4. Generate prompts
    const systemPrompt = this.generateSystemPrompt(profile, analysis, context);
    const userPrompt = this.generateUserPrompt(query, analysis, context);

    // 5. Determine VBC phase
    const vbcPhase = profile.preferredPhase || this.inferVBCPhase(analysis);

    return {
      analysis,
      profile,
      inferenceParams,
      systemPrompt,
      userPrompt,
      vbcPhase,
      dimensionFocus: profile.dimensionFocus,
      memoryDepth: profile.memoryDepth,
      contextWindowStrategy: profile.contextWindowStrategy,
    };
  }

  private inferVBCPhase(analysis: QueryAnalysis): TickPhase {
    if (analysis.creativityRequired > 0.7) return 'capture';
    if (analysis.specificity > 0.8) return 'commit';
    if (analysis.queryType === 'analytical') return 'bridge';
    if (analysis.queryType === 'critique') return 'clean';
    return 'capture';
  }

  // ========================================================================
  // PROFILE MANAGEMENT
  // ========================================================================

  addProfile(profile: PreflectionProfile): void {
    this.profiles.set(profile.id, profile);
  }

  getProfile(id: string): PreflectionProfile | undefined {
    return this.profiles.get(id);
  }

  listProfiles(): PreflectionProfile[] {
    return Array.from(this.profiles.values());
  }

  setCurrentProfile(id: string): void {
    const profile = this.profiles.get(id);
    if (profile) {
      this.currentProfile = profile;
    }
  }

  getCurrentProfile(): PreflectionProfile {
    return this.currentProfile;
  }
}

// ============================================================================
// RESULT TYPES
// ============================================================================

export interface PreflectionResult {
  analysis: QueryAnalysis;
  profile: PreflectionProfile;
  inferenceParams: InferenceParams;
  systemPrompt: string;
  userPrompt: string;
  vbcPhase: TickPhase;
  dimensionFocus: string[];
  memoryDepth: number;
  contextWindowStrategy: 'full' | 'recent' | 'relevant' | 'hierarchical';
}

export interface PromptContext {
  recentMemories?: string[];
  relevantFacts?: string[];
  userPreferences?: string;
  sessionHistory?: string[];
}
