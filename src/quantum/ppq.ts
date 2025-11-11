/**
 * PPQ (Post-Processing Query) Introspection Engine
 * Glass Engine Protocol for interrogating AI responses and generating training data
 */

import { MemoryAtom, SpinVector } from "./superarray.js";
import { COPLEdge } from "./copl.js";

// ============================================================================
// PPQ LENSES (Analytical Perspectives)
// ============================================================================

export type PPQLensType =
  | 'sentiment'           // Emotional tone analysis
  | 'bias'                // Bias and assumption detection
  | 'provenance'          // Source and reasoning chain
  | 'reasoning'           // Logical structure reveal
  | 'strategic'           // Strategic intent analysis
  | 'subtext'             // Hidden implications
  | 'alignment'           // Value alignment check
  | 'uncertainty'         // Confidence and hedging
  | 'dimension_trace'     // Which Superarray dimensions activated
  | 'copl_pattern'        // Which phase-lock patterns used
  | 'vbc_budget'          // Resource allocation analysis
  | 'coherence'           // Internal consistency check
  | 'novelty'             // Originality vs. prior patterns
  | 'actionability';      // Concrete next steps

export interface PPQLens {
  type: PPQLensType;
  name: string;
  description: string;
  weight: number;         // Importance [0,1]
  enabled: boolean;
}

// Default lens configurations
export const DEFAULT_LENSES: PPQLens[] = [
  {
    type: 'sentiment',
    name: 'Sentiment Analysis',
    description: 'Analyze emotional tone and affect trajectory',
    weight: 0.6,
    enabled: true,
  },
  {
    type: 'bias',
    name: 'Bias Monitor',
    description: 'Detect assumptions, framing effects, and blind spots',
    weight: 0.8,
    enabled: true,
  },
  {
    type: 'provenance',
    name: 'Source Provenance',
    description: 'Trace reasoning chain and knowledge sources',
    weight: 0.9,
    enabled: true,
  },
  {
    type: 'reasoning',
    name: 'Reveal Reasoning',
    description: 'Expose logical structure and inference steps',
    weight: 1.0,
    enabled: true,
  },
  {
    type: 'strategic',
    name: 'Strategic Intent',
    description: 'Identify high-level goals and sub-goals',
    weight: 0.7,
    enabled: true,
  },
  {
    type: 'subtext',
    name: 'Subtext Scanner',
    description: 'Surface hidden implications and unstated assumptions',
    weight: 0.75,
    enabled: true,
  },
  {
    type: 'alignment',
    name: 'Value Alignment',
    description: 'Check alignment with user values and ethical constraints',
    weight: 0.85,
    enabled: true,
  },
  {
    type: 'uncertainty',
    name: 'Uncertainty Quantification',
    description: 'Measure confidence, hedging, and epistemic status',
    weight: 0.8,
    enabled: true,
  },
  {
    type: 'dimension_trace',
    name: 'Dimension Trace',
    description: 'Which Superarray dimensions were activated',
    weight: 0.9,
    enabled: true,
  },
  {
    type: 'copl_pattern',
    name: 'COPL Pattern Analysis',
    description: 'Which phase-lock patterns were used',
    weight: 0.7,
    enabled: true,
  },
  {
    type: 'vbc_budget',
    name: 'VBC Budget Analysis',
    description: 'How semantic resources were allocated',
    weight: 0.6,
    enabled: true,
  },
  {
    type: 'coherence',
    name: 'Coherence Check',
    description: 'Internal consistency and contradiction detection',
    weight: 0.85,
    enabled: true,
  },
  {
    type: 'novelty',
    name: 'Novelty Assessment',
    description: 'Originality vs. pattern reuse',
    weight: 0.5,
    enabled: true,
  },
  {
    type: 'actionability',
    name: 'Actionability Extraction',
    description: 'Concrete next steps and action items',
    weight: 0.9,
    enabled: true,
  },
];

// ============================================================================
// PPQ RESULT
// ============================================================================

export interface PPQResult {
  lens: PPQLensType;
  score: number;                    // Quantitative score [0,1]
  findings: string[];               // Key insights
  flags: string[];                  // Warnings or concerns
  metadata: Record<string, any>;    // Lens-specific data
  confidence: number;               // How confident in this analysis [0,1]
}

export interface PPQReport {
  responseId: string;
  timestamp: Date;
  responseText: string;
  results: PPQResult[];
  overallScore: number;             // Weighted average
  trainingData?: TrainingDataPoint; // Generated training data
  dimensionActivation?: Record<string, number>; // Superarray trace
  coplPatterns?: string[];          // Which patterns fired
  vbcBudgetUsed?: Record<string, number>; // Budget allocation
}

// ============================================================================
// TRAINING DATA GENERATION
// ============================================================================

export interface TrainingDataPoint {
  id: string;
  inputQuery: string;
  outputResponse: string;
  contextSnapshot: {
    activeDimensions: string[];
    spinVector: SpinVector | null;
    coplEdges: COPLEdge[];
    vbcPhase: string;
    memoryAtoms: string[];          // UIDs of relevant atoms
  };
  introspection: {
    whyTheseMemories: string;       // Explanation
    whyThisResponse: string;        // Reasoning
    alternativesConsidered: string[];
    dimensionJustification: Record<string, string>;
  };
  qualityMetrics: {
    coherence: number;
    novelty: number;
    actionability: number;
    alignment: number;
  };
  outcomeLabel?: 'success' | 'failure' | 'partial';
  timestamp: Date;
}

// ============================================================================
// PPQ ENGINE
// ============================================================================

export class PPQEngine {
  private lenses: Map<PPQLensType, PPQLens>;
  private trainingData: TrainingDataPoint[] = [];

  constructor(customLenses?: PPQLens[]) {
    this.lenses = new Map();
    const lensesToUse = customLenses || DEFAULT_LENSES;
    for (const lens of lensesToUse) {
      this.lenses.set(lens.type, lens);
    }
  }

  // ========================================================================
  // INTERROGATE RESPONSE
  // ========================================================================

  async interrogate(
    responseId: string,
    responseText: string,
    context?: PPQContext
  ): Promise<PPQReport> {
    const results: PPQResult[] = [];

    // Run each enabled lens
    for (const lens of this.lenses.values()) {
      if (!lens.enabled) continue;

      const result = await this.applyLens(lens, responseText, context);
      results.push(result);
    }

    // Compute overall score
    const overallScore = this.computeOverallScore(results);

    // Generate training data if context provided
    let trainingData: TrainingDataPoint | undefined;
    if (context?.inputQuery) {
      trainingData = this.generateTrainingData(
        responseId,
        context.inputQuery,
        responseText,
        results,
        context
      );
      this.trainingData.push(trainingData);
    }

    return {
      responseId,
      timestamp: new Date(),
      responseText,
      results,
      overallScore,
      trainingData,
      dimensionActivation: context?.dimensionActivation,
      coplPatterns: context?.coplPatterns,
      vbcBudgetUsed: context?.vbcBudgetUsed,
    };
  }

  // ========================================================================
  // APPLY INDIVIDUAL LENS
  // ========================================================================

  private async applyLens(
    lens: PPQLens,
    text: string,
    context?: PPQContext
  ): Promise<PPQResult> {
    switch (lens.type) {
      case 'sentiment':
        return this.analyzeSentiment(text);

      case 'bias':
        return this.detectBias(text);

      case 'provenance':
        return this.traceProvenance(text, context);

      case 'reasoning':
        return this.revealReasoning(text);

      case 'strategic':
        return this.analyzeStrategy(text);

      case 'subtext':
        return this.scanSubtext(text);

      case 'alignment':
        return this.checkAlignment(text);

      case 'uncertainty':
        return this.quantifyUncertainty(text);

      case 'dimension_trace':
        return this.traceDimensions(context);

      case 'copl_pattern':
        return this.analyzeCOPLPatterns(context);

      case 'vbc_budget':
        return this.analyzeVBCBudget(context);

      case 'coherence':
        return this.checkCoherence(text);

      case 'novelty':
        return this.assessNovelty(text, context);

      case 'actionability':
        return this.extractActionability(text);

      default:
        return {
          lens: lens.type,
          score: 0.5,
          findings: ['Lens not implemented'],
          flags: [],
          metadata: {},
          confidence: 0,
        };
    }
  }

  // ========================================================================
  // LENS IMPLEMENTATIONS
  // ========================================================================

  private analyzeSentiment(text: string): PPQResult {
    // Simplified sentiment analysis
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic'];
    const negativeWords = ['bad', 'terrible', 'awful', 'poor', 'horrible', 'disappointing'];

    const lowerText = text.toLowerCase();
    let positiveCount = 0;
    let negativeCount = 0;

    for (const word of positiveWords) {
      positiveCount += (lowerText.match(new RegExp(word, 'g')) || []).length;
    }
    for (const word of negativeWords) {
      negativeCount += (lowerText.match(new RegExp(word, 'g')) || []).length;
    }

    const total = positiveCount + negativeCount;
    const score = total > 0 ? (positiveCount - negativeCount) / total * 0.5 + 0.5 : 0.5;

    return {
      lens: 'sentiment',
      score,
      findings: [
        `Positive indicators: ${positiveCount}`,
        `Negative indicators: ${negativeCount}`,
        score > 0.6 ? 'Generally positive tone' : score < 0.4 ? 'Generally negative tone' : 'Neutral tone',
      ],
      flags: score < 0.3 ? ['Very negative sentiment detected'] : [],
      metadata: { positiveCount, negativeCount },
      confidence: 0.7,
    };
  }

  private detectBias(text: string): PPQResult {
    const biasIndicators = [
      'obviously', 'clearly', 'everyone knows', 'it\'s obvious',
      'always', 'never', 'all', 'none', 'must', 'should',
    ];

    const lowerText = text.toLowerCase();
    const detectedBiases: string[] = [];

    for (const indicator of biasIndicators) {
      if (lowerText.includes(indicator)) {
        detectedBiases.push(indicator);
      }
    }

    const score = Math.max(0, 1 - detectedBiases.length * 0.1);

    return {
      lens: 'bias',
      score,
      findings: detectedBiases.length > 0
        ? [`Found ${detectedBiases.length} potential bias indicators`]
        : ['No strong bias indicators detected'],
      flags: detectedBiases.length > 5 ? ['High bias indicator count'] : [],
      metadata: { indicators: detectedBiases },
      confidence: 0.6,
    };
  }

  private traceProvenance(text: string, context?: PPQContext): PPQResult {
    const findings: string[] = [];
    const metadata: Record<string, any> = {};

    if (context?.memoryAtoms && context.memoryAtoms.length > 0) {
      findings.push(`Drew from ${context.memoryAtoms.length} memory atoms`);
      metadata.atomCount = context.memoryAtoms.length;
    }

    if (context?.coplPatterns && context.coplPatterns.length > 0) {
      findings.push(`Used ${context.coplPatterns.length} learned patterns`);
      metadata.patternCount = context.coplPatterns.length;
    }

    const score = findings.length > 0 ? 0.8 : 0.5;

    return {
      lens: 'provenance',
      score,
      findings,
      flags: [],
      metadata,
      confidence: context ? 0.9 : 0.4,
    };
  }

  private revealReasoning(text: string): PPQResult {
    const reasoningMarkers = [
      'because', 'therefore', 'thus', 'since', 'as a result',
      'consequently', 'hence', 'so', 'this means', 'which implies',
    ];

    const lowerText = text.toLowerCase();
    let reasoningCount = 0;

    for (const marker of reasoningMarkers) {
      reasoningCount += (lowerText.match(new RegExp(marker, 'g')) || []).length;
    }

    const score = Math.min(1, reasoningCount * 0.15);

    return {
      lens: 'reasoning',
      score,
      findings: [
        `Found ${reasoningCount} reasoning markers`,
        score > 0.7 ? 'Strong logical structure' : score > 0.4 ? 'Moderate reasoning' : 'Weak reasoning structure',
      ],
      flags: score < 0.3 ? ['Insufficient reasoning explanation'] : [],
      metadata: { reasoningCount },
      confidence: 0.75,
    };
  }

  private analyzeStrategy(text: string): PPQResult {
    const strategicKeywords = [
      'goal', 'plan', 'strategy', 'objective', 'approach', 'method',
      'step', 'phase', 'stage', 'first', 'next', 'then', 'finally',
    ];

    const lowerText = text.toLowerCase();
    let strategicCount = 0;

    for (const keyword of strategicKeywords) {
      strategicCount += (lowerText.match(new RegExp(`\\b${keyword}\\b`, 'g')) || []).length;
    }

    const score = Math.min(1, strategicCount * 0.1);

    return {
      lens: 'strategic',
      score,
      findings: [
        `Found ${strategicCount} strategic indicators`,
        score > 0.7 ? 'Clear strategic intent' : 'Limited strategic framing',
      ],
      flags: [],
      metadata: { strategicCount },
      confidence: 0.7,
    };
  }

  private scanSubtext(text: string): PPQResult {
    // Look for hedging, qualifiers, and implicit assumptions
    const hedgingWords = ['might', 'could', 'perhaps', 'possibly', 'maybe', 'seems'];
    const lowerText = text.toLowerCase();
    let hedgeCount = 0;

    for (const word of hedgingWords) {
      hedgeCount += (lowerText.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length;
    }

    const score = 0.5 + (hedgeCount * 0.05); // More hedging = more subtext awareness

    return {
      lens: 'subtext',
      score: Math.min(1, score),
      findings: [
        `Found ${hedgeCount} hedging/qualifier words`,
        hedgeCount > 5 ? 'High awareness of uncertainty' : 'Direct communication style',
      ],
      flags: [],
      metadata: { hedgeCount },
      confidence: 0.6,
    };
  }

  private checkAlignment(text: string): PPQResult {
    const harmKeywords = ['dangerous', 'harmful', 'risky', 'unethical', 'illegal'];
    const benefitKeywords = ['helpful', 'beneficial', 'safe', 'ethical', 'legal'];

    const lowerText = text.toLowerCase();
    let harmCount = 0;
    let benefitCount = 0;

    for (const word of harmKeywords) {
      harmCount += (lowerText.match(new RegExp(word, 'g')) || []).length;
    }
    for (const word of benefitKeywords) {
      benefitCount += (lowerText.match(new RegExp(word, 'g')) || []).length;
    }

    const score = harmCount > 0 ? Math.max(0, 0.8 - harmCount * 0.2) : 0.9;

    return {
      lens: 'alignment',
      score,
      findings: [
        benefitCount > 0 ? `${benefitCount} positive alignment indicators` : 'No explicit benefit indicators',
        harmCount > 0 ? `Warning: ${harmCount} potential harm indicators` : 'No harm indicators',
      ],
      flags: harmCount > 2 ? ['Multiple harm indicators detected'] : [],
      metadata: { harmCount, benefitCount },
      confidence: 0.8,
    };
  }

  private quantifyUncertainty(text: string): PPQResult {
    const uncertaintyMarkers = [
      'uncertain', 'unclear', 'unknown', 'unsure', 'don\'t know',
      'not sure', 'approximately', 'roughly', 'about', 'around',
    ];

    const lowerText = text.toLowerCase();
    let uncertaintyCount = 0;

    for (const marker of uncertaintyMarkers) {
      uncertaintyCount += (lowerText.match(new RegExp(marker, 'g')) || []).length;
    }

    const score = 1 - Math.min(0.7, uncertaintyCount * 0.1);

    return {
      lens: 'uncertainty',
      score,
      findings: [
        `Found ${uncertaintyCount} uncertainty markers`,
        score > 0.8 ? 'High confidence' : score > 0.5 ? 'Moderate confidence' : 'Low confidence',
      ],
      flags: score < 0.4 ? ['Very high uncertainty'] : [],
      metadata: { uncertaintyCount },
      confidence: 0.75,
    };
  }

  private traceDimensions(context?: PPQContext): PPQResult {
    if (!context?.dimensionActivation) {
      return {
        lens: 'dimension_trace',
        score: 0.5,
        findings: ['No dimension activation data available'],
        flags: [],
        metadata: {},
        confidence: 0,
      };
    }

    const activeDims = Object.entries(context.dimensionActivation)
      .filter(([_, value]) => value > 0.5)
      .sort((a, b) => b[1] - a[1]);

    return {
      lens: 'dimension_trace',
      score: 0.9,
      findings: [
        `${activeDims.length} dimensions highly activated`,
        `Top dimension: ${activeDims[0]?.[0] || 'none'} (${(activeDims[0]?.[1] || 0).toFixed(2)})`,
      ],
      flags: [],
      metadata: { activeDimensions: activeDims },
      confidence: 1.0,
    };
  }

  private analyzeCOPLPatterns(context?: PPQContext): PPQResult {
    if (!context?.coplPatterns || context.coplPatterns.length === 0) {
      return {
        lens: 'copl_pattern',
        score: 0.5,
        findings: ['No COPL pattern data available'],
        flags: [],
        metadata: {},
        confidence: 0,
      };
    }

    return {
      lens: 'copl_pattern',
      score: 0.85,
      findings: [
        `Used ${context.coplPatterns.length} learned phase-lock patterns`,
        `Patterns: ${context.coplPatterns.join(', ')}`,
      ],
      flags: [],
      metadata: { patterns: context.coplPatterns },
      confidence: 0.95,
    };
  }

  private analyzeVBCBudget(context?: PPQContext): PPQResult {
    if (!context?.vbcBudgetUsed) {
      return {
        lens: 'vbc_budget',
        score: 0.5,
        findings: ['No VBC budget data available'],
        flags: [],
        metadata: {},
        confidence: 0,
      };
    }

    const budgetEntries = Object.entries(context.vbcBudgetUsed)
      .sort((a, b) => b[1] - a[1]);

    const totalBudget = budgetEntries.reduce((sum, [_, val]) => sum + val, 0);

    return {
      lens: 'vbc_budget',
      score: totalBudget > 0 ? 0.8 : 0.5,
      findings: [
        `Total budget used: ${totalBudget.toFixed(2)}`,
        `Top axis: ${budgetEntries[0]?.[0] || 'none'} (${(budgetEntries[0]?.[1] || 0).toFixed(2)})`,
      ],
      flags: totalBudget > 1.0 ? ['Budget exceeded'] : [],
      metadata: { budgetAllocation: budgetEntries },
      confidence: 0.9,
    };
  }

  private checkCoherence(text: string): PPQResult {
    // Simplified coherence check - look for contradictions
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const contradictionMarkers = ['however', 'but', 'although', 'despite', 'contrary'];

    let contradictionCount = 0;
    const lowerText = text.toLowerCase();

    for (const marker of contradictionMarkers) {
      contradictionCount += (lowerText.match(new RegExp(marker, 'g')) || []).length;
    }

    // Moderate contradictions are good (nuance), too many are bad
    const score = contradictionCount <= 3
      ? 0.9
      : Math.max(0.5, 0.9 - (contradictionCount - 3) * 0.1);

    return {
      lens: 'coherence',
      score,
      findings: [
        `Found ${contradictionCount} contrast markers`,
        `${sentences.length} sentences analyzed`,
        score > 0.8 ? 'High coherence' : 'Some inconsistencies detected',
      ],
      flags: score < 0.6 ? ['Potential coherence issues'] : [],
      metadata: { contradictionCount, sentenceCount: sentences.length },
      confidence: 0.7,
    };
  }

  private assessNovelty(text: string, context?: PPQContext): PPQResult {
    // Simplified novelty - check if response uses learned patterns
    const usesPatterns = context?.coplPatterns && context.coplPatterns.length > 0;
    const patternDependency = usesPatterns ? context.coplPatterns!.length * 0.1 : 0;

    // More patterns = less novel (but more reliable)
    const score = Math.max(0.3, 1 - patternDependency);

    return {
      lens: 'novelty',
      score,
      findings: [
        usesPatterns
          ? `Leveraged ${context.coplPatterns!.length} existing patterns`
          : 'Novel approach (no pattern reuse)',
        score > 0.7 ? 'High novelty' : 'Pattern-based response',
      ],
      flags: [],
      metadata: { patternCount: context?.coplPatterns?.length || 0 },
      confidence: 0.6,
    };
  }

  private extractActionability(text: string): PPQResult {
    const actionVerbs = [
      'create', 'build', 'implement', 'run', 'execute', 'test',
      'deploy', 'install', 'configure', 'setup', 'start', 'stop',
    ];

    const lowerText = text.toLowerCase();
    let actionCount = 0;

    for (const verb of actionVerbs) {
      actionCount += (lowerText.match(new RegExp(`\\b${verb}\\b`, 'g')) || []).length;
    }

    const score = Math.min(1, actionCount * 0.15);

    return {
      lens: 'actionability',
      score,
      findings: [
        `Found ${actionCount} action verbs`,
        score > 0.7 ? 'Highly actionable' : score > 0.4 ? 'Moderately actionable' : 'Primarily informational',
      ],
      flags: score < 0.3 ? ['Low actionability - consider adding concrete steps'] : [],
      metadata: { actionCount },
      confidence: 0.8,
    };
  }

  // ========================================================================
  // TRAINING DATA GENERATION
  // ========================================================================

  private generateTrainingData(
    id: string,
    inputQuery: string,
    outputResponse: string,
    results: PPQResult[],
    context: PPQContext
  ): TrainingDataPoint {
    // Extract quality metrics from results
    const coherence = results.find(r => r.lens === 'coherence')?.score || 0.5;
    const novelty = results.find(r => r.lens === 'novelty')?.score || 0.5;
    const actionability = results.find(r => r.lens === 'actionability')?.score || 0.5;
    const alignment = results.find(r => r.lens === 'alignment')?.score || 0.5;

    return {
      id,
      inputQuery,
      outputResponse,
      contextSnapshot: {
        activeDimensions: context.dimensionActivation
          ? Object.entries(context.dimensionActivation)
              .filter(([_, v]) => v > 0.5)
              .map(([k, _]) => k)
          : [],
        spinVector: context.spinVector || null,
        coplEdges: context.coplEdges || [],
        vbcPhase: context.vbcPhase || 'unknown',
        memoryAtoms: context.memoryAtoms || [],
      },
      introspection: {
        whyTheseMemories: this.explainMemorySelection(context),
        whyThisResponse: this.explainResponseReasoning(results),
        alternativesConsidered: this.extractAlternatives(outputResponse),
        dimensionJustification: this.justifyDimensions(context),
      },
      qualityMetrics: {
        coherence,
        novelty,
        actionability,
        alignment,
      },
      timestamp: new Date(),
    };
  }

  private explainMemorySelection(context: PPQContext): string {
    if (!context.memoryAtoms || context.memoryAtoms.length === 0) {
      return 'No memory atoms were consulted for this response.';
    }

    return `Selected ${context.memoryAtoms.length} memory atoms based on spin vector alignment and dimension activation.`;
  }

  private explainResponseReasoning(results: PPQResult[]): string {
    const reasoning = results.find(r => r.lens === 'reasoning');
    if (!reasoning) return 'Reasoning structure not analyzed.';

    return `Response constructed with ${reasoning.metadata.reasoningCount || 0} logical connectors, achieving ${(reasoning.score * 100).toFixed(0)}% reasoning clarity.`;
  }

  private extractAlternatives(response: string): string[] {
    // Look for phrases indicating alternatives
    const alternativeMarkers = ['alternatively', 'another option', 'you could also', 'instead'];
    const alternatives: string[] = [];

    for (const marker of alternativeMarkers) {
      if (response.toLowerCase().includes(marker)) {
        alternatives.push(`Alternative mentioned via: ${marker}`);
      }
    }

    return alternatives.length > 0 ? alternatives : ['No explicit alternatives presented'];
  }

  private justifyDimensions(context: PPQContext): Record<string, string> {
    if (!context.dimensionActivation) return {};

    const justifications: Record<string, string> = {};
    const activeDims = Object.entries(context.dimensionActivation)
      .filter(([_, v]) => v > 0.5)
      .sort((a, b) => b[1] - a[1]);

    for (const [dim, value] of activeDims.slice(0, 5)) {
      justifications[dim] = `Activated at ${(value * 100).toFixed(0)}% due to query requirements`;
    }

    return justifications;
  }

  // ========================================================================
  // RECURSIVE INTERROGATION
  // ========================================================================

  async recursiveInterrogate(
    report: PPQReport,
    depth: number = 1,
    maxDepth: number = 3
  ): Promise<PPQReport[]> {
    const reports: PPQReport[] = [report];

    if (depth >= maxDepth) return reports;

    // Interrogate the interrogation - meta-analysis
    const metaText = this.reportToText(report);
    const metaReport = await this.interrogate(
      `${report.responseId}_meta_${depth}`,
      metaText,
      {
        inputQuery: `Meta-analysis of: ${report.responseId}`,
      }
    );

    reports.push(metaReport);

    // Recurse
    if (depth + 1 < maxDepth) {
      const deeperReports = await this.recursiveInterrogate(metaReport, depth + 1, maxDepth);
      reports.push(...deeperReports);
    }

    return reports;
  }

  private reportToText(report: PPQReport): string {
    let text = `PPQ Report for ${report.responseId}\n\n`;
    text += `Overall Score: ${report.overallScore.toFixed(2)}\n\n`;

    for (const result of report.results) {
      text += `${result.lens}: ${result.score.toFixed(2)}\n`;
      text += `  Findings: ${result.findings.join(', ')}\n`;
      if (result.flags.length > 0) {
        text += `  Flags: ${result.flags.join(', ')}\n`;
      }
    }

    return text;
  }

  // ========================================================================
  // UTILITIES
  // ========================================================================

  private computeOverallScore(results: PPQResult[]): number {
    if (results.length === 0) return 0;

    let weightedSum = 0;
    let totalWeight = 0;

    for (const result of results) {
      const lens = this.lenses.get(result.lens);
      const weight = lens?.weight || 1.0;

      weightedSum += result.score * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  configureLens(lensType: PPQLensType, enabled: boolean, weight?: number): void {
    const lens = this.lenses.get(lensType);
    if (lens) {
      lens.enabled = enabled;
      if (weight !== undefined) {
        lens.weight = Math.max(0, Math.min(1, weight));
      }
    }
  }

  getTrainingData(): TrainingDataPoint[] {
    return [...this.trainingData];
  }

  clearTrainingData(): void {
    this.trainingData = [];
  }

  exportTrainingData(): string {
    return JSON.stringify(this.trainingData, null, 2);
  }
}

// ============================================================================
// PPQ CONTEXT (Optional context for deeper analysis)
// ============================================================================

export interface PPQContext {
  inputQuery?: string;
  dimensionActivation?: Record<string, number>;
  spinVector?: SpinVector | null;
  coplPatterns?: string[];
  coplEdges?: COPLEdge[];
  vbcBudgetUsed?: Record<string, number>;
  vbcPhase?: string;
  memoryAtoms?: string[];
}
