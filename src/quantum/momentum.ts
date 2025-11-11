/**
 * Momentum Recursion System
 * Clarifier → Architect → Worker → Auditor recursive pattern at hook layer
 */

import { NeuronAgent, CognitiveOperation } from "./neurons.js";
import { COPLLearner, TaskExecution } from "./copl.js";
import { PPQEngine, PPQContext } from "./ppq.js";
import { PreflectionEngine } from "./preflection.js";

// ============================================================================
// MOMENTUM PHASES
// ============================================================================

export type MomentumPhase = 'clarify' | 'architect' | 'work' | 'audit';

export interface PhaseConfig {
  phase: MomentumPhase;
  operations: CognitiveOperation[];
  minConfidence: number;        // Minimum confidence to proceed
  maxIterations: number;        // Max times to repeat this phase
  timeoutMs: number;            // Phase timeout
  successCriteria: string[];    // What constitutes success
}

export const MOMENTUM_PHASES: Record<MomentumPhase, PhaseConfig> = {
  clarify: {
    phase: 'clarify',
    operations: ['Interpret', 'Evaluate', 'Discriminate', 'Compare'],
    minConfidence: 0.7,
    maxIterations: 3,
    timeoutMs: 30000,
    successCriteria: [
      'Requirements are clear',
      'Ambiguities resolved',
      'Success criteria defined',
    ],
  },

  architect: {
    phase: 'architect',
    operations: ['Propose', 'Compare', 'Harmonize', 'Align'],
    minConfidence: 0.75,
    maxIterations: 3,
    timeoutMs: 45000,
    successCriteria: [
      'Approach selected',
      'Dependencies identified',
      'Risk assessment complete',
    ],
  },

  work: {
    phase: 'work',
    operations: ['Execute', 'Manifest', 'Integrate', 'Transform'],
    minConfidence: 0.8,
    maxIterations: 5,
    timeoutMs: 120000,
    successCriteria: [
      'Implementation complete',
      'Tests passing',
      'No critical errors',
    ],
  },

  audit: {
    phase: 'audit',
    operations: ['Evaluate', 'Benchmark', 'Compare', 'Refute'],
    minConfidence: 0.85,
    maxIterations: 2,
    timeoutMs: 30000,
    successCriteria: [
      'Quality verified',
      'Requirements met',
      'No regressions',
    ],
  },
};

// ============================================================================
// MOMENTUM STATE
// ============================================================================

export interface MomentumState {
  currentPhase: MomentumPhase;
  iteration: number;
  confidence: number;
  completedPhases: MomentumPhase[];
  phaseResults: Map<MomentumPhase, PhaseResult>;
  startTime: Date;
  lastTransition: Date;
  recursionDepth: number;
  maxRecursionDepth: number;
}

export interface PhaseResult {
  phase: MomentumPhase;
  success: boolean;
  confidence: number;
  iterations: number;
  duration: number;
  outputs: string[];
  artifacts: Map<string, any>;
  issues: string[];
  recommendations: string[];
}

// ============================================================================
// MOMENTUM TRANSITION
// ============================================================================

export interface MomentumTransition {
  from: MomentumPhase;
  to: MomentumPhase;
  reason: string;
  confidence: number;
  timestamp: Date;
  shouldRecurse: boolean;
  recurseTo?: MomentumPhase;
}

// ============================================================================
// MOMENTUM ENGINE
// ============================================================================

export class MomentumEngine {
  private state: MomentumState;
  private transitions: MomentumTransition[] = [];
  private coplLearner: COPLLearner;
  private ppqEngine: PPQEngine;
  private preflectionEngine: PreflectionEngine;

  constructor(
    coplLearner: COPLLearner,
    ppqEngine: PPQEngine,
    preflectionEngine: PreflectionEngine,
    maxRecursionDepth: number = 5
  ) {
    this.coplLearner = coplLearner;
    this.ppqEngine = ppqEngine;
    this.preflectionEngine = preflectionEngine;

    this.state = {
      currentPhase: 'clarify',
      iteration: 0,
      confidence: 0,
      completedPhases: [],
      phaseResults: new Map(),
      startTime: new Date(),
      lastTransition: new Date(),
      recursionDepth: 0,
      maxRecursionDepth,
    };
  }

  // ========================================================================
  // PHASE EXECUTION
  // ========================================================================

  async executePhase(
    phase: MomentumPhase,
    input: PhaseInput
  ): Promise<PhaseResult> {
    const config = MOMENTUM_PHASES[phase];
    const startTime = Date.now();

    const outputs: string[] = [];
    const artifacts = new Map<string, any>();
    const issues: string[] = [];
    const recommendations: string[] = [];

    let iterations = 0;
    let confidence = 0;
    let success = false;

    // Execute phase iterations
    while (iterations < config.maxIterations && confidence < config.minConfidence) {
      iterations++;

      try {
        // Execute phase-specific logic
        const iterationResult = await this.executePhaseIteration(
          phase,
          config,
          input,
          iterations
        );

        outputs.push(...iterationResult.outputs);
        issues.push(...iterationResult.issues);
        recommendations.push(...iterationResult.recommendations);

        // Merge artifacts
        for (const [key, value] of iterationResult.artifacts) {
          artifacts.set(key, value);
        }

        confidence = iterationResult.confidence;

        // Check success criteria
        if (this.checkSuccessCriteria(config.successCriteria, iterationResult)) {
          success = true;
          break;
        }

      } catch (error: any) {
        issues.push(`Iteration ${iterations} failed: ${error.message}`);
        break;
      }

      // Check timeout
      if (Date.now() - startTime > config.timeoutMs) {
        issues.push('Phase timeout exceeded');
        break;
      }
    }

    const duration = Date.now() - startTime;

    const result: PhaseResult = {
      phase,
      success,
      confidence,
      iterations,
      duration,
      outputs,
      artifacts,
      issues,
      recommendations,
    };

    // Store result
    this.state.phaseResults.set(phase, result);

    // Record task execution for COPL learning
    this.recordCOPLTask(phase, result);

    return result;
  }

  private async executePhaseIteration(
    phase: MomentumPhase,
    config: PhaseConfig,
    input: PhaseInput,
    iteration: number
  ): Promise<IterationResult> {
    const outputs: string[] = [];
    const issues: string[] = [];
    const recommendations: string[] = [];
    const artifacts = new Map<string, any>();

    // Execute based on phase
    switch (phase) {
      case 'clarify':
        return await this.executeClarifyPhase(input, iteration);

      case 'architect':
        return await this.executeArchitectPhase(input, iteration);

      case 'work':
        return await this.executeWorkPhase(input, iteration);

      case 'audit':
        return await this.executeAuditPhase(input, iteration);

      default:
        return {
          outputs: ['Unknown phase'],
          issues: [`Unknown phase: ${phase}`],
          recommendations: [],
          artifacts,
          confidence: 0,
        };
    }
  }

  // ========================================================================
  // PHASE-SPECIFIC IMPLEMENTATIONS
  // ========================================================================

  private async executeClarifyPhase(
    input: PhaseInput,
    iteration: number
  ): Promise<IterationResult> {
    const outputs: string[] = [];
    const issues: string[] = [];
    const recommendations: string[] = [];
    const artifacts = new Map<string, any>();

    outputs.push(`[Clarify ${iteration}] Analyzing input requirements...`);

    // Use Preflection to analyze the query
    const preflectionResult = this.preflectionEngine.preflect(input.task);
    artifacts.set('preflection', preflectionResult);

    outputs.push(`Query type: ${preflectionResult.analysis.queryType}`);
    outputs.push(`Complexity: ${preflectionResult.analysis.complexity.toFixed(2)}`);
    outputs.push(`Intent: ${preflectionResult.analysis.intent}`);

    // Check for ambiguities
    if (preflectionResult.analysis.specificity < 0.5) {
      issues.push('Query lacks specificity - may need clarification');
      recommendations.push('Ask user for more details');
    }

    // Check for risks
    if (preflectionResult.analysis.riskLevel > 0.7) {
      issues.push('High-risk operation detected');
      recommendations.push('Require explicit confirmation');
    }

    // Compute confidence based on clarity
    const confidence = Math.min(
      1.0,
      preflectionResult.analysis.specificity * 0.7 +
      (1 - preflectionResult.analysis.complexity) * 0.3
    );

    return { outputs, issues, recommendations, artifacts, confidence };
  }

  private async executeArchitectPhase(
    input: PhaseInput,
    iteration: number
  ): Promise<IterationResult> {
    const outputs: string[] = [];
    const issues: string[] = [];
    const recommendations: string[] = [];
    const artifacts = new Map<string, any>();

    outputs.push(`[Architect ${iteration}] Designing approach...`);

    // Get COPL recommendations
    const components = input.components || [];
    const coplRecommendations = this.coplLearner.recommend(components);

    if (coplRecommendations.length > 0) {
      outputs.push(`COPL suggested ${coplRecommendations.length} patterns:`);
      for (const rec of coplRecommendations.slice(0, 3)) {
        outputs.push(`  - ${rec.suggestedComponent} (${rec.confidence.toFixed(2)}): ${rec.reason}`);
      }
      artifacts.set('copl_recommendations', coplRecommendations);
    }

    // Propose architecture
    recommendations.push('Use modular design with clear interfaces');
    recommendations.push('Implement error handling at each layer');
    recommendations.push('Add logging for observability');

    // Confidence based on COPL patterns available
    const confidence = coplRecommendations.length > 0 && coplRecommendations[0]
      ? Math.min(1.0, coplRecommendations[0].confidence + 0.2)
      : 0.6;

    return { outputs, issues, recommendations, artifacts, confidence };
  }

  private async executeWorkPhase(
    input: PhaseInput,
    iteration: number
  ): Promise<IterationResult> {
    const outputs: string[] = [];
    const issues: string[] = [];
    const recommendations: string[] = [];
    const artifacts = new Map<string, any>();

    outputs.push(`[Work ${iteration}] Executing implementation...`);

    // Simulate work execution
    outputs.push('Creating necessary components...');
    outputs.push('Integrating systems...');
    outputs.push('Running tests...');

    // Check for errors (simplified)
    if (input.task.toLowerCase().includes('error')) {
      issues.push('Test failures detected');
      recommendations.push('Debug failing tests');
    }

    // Confidence based on iteration (improves over iterations)
    const confidence = Math.min(1.0, 0.5 + iteration * 0.2);

    artifacts.set('implementation_status', 'in_progress');

    return { outputs, issues, recommendations, artifacts, confidence };
  }

  private async executeAuditPhase(
    input: PhaseInput,
    iteration: number
  ): Promise<IterationResult> {
    const outputs: string[] = [];
    const issues: string[] = [];
    const recommendations: string[] = [];
    const artifacts = new Map<string, any>();

    outputs.push(`[Audit ${iteration}] Validating results...`);

    // Get previous phase results
    const workResult = this.state.phaseResults.get('work');
    const architectResult = this.state.phaseResults.get('architect');

    // Check if work phase succeeded
    if (workResult && !workResult.success) {
      issues.push('Work phase did not complete successfully');
      recommendations.push('Return to Work phase to address issues');
    }

    // Use PPQ for introspection
    if (input.response) {
      const ppqResult = await this.ppqEngine.interrogate(
        `audit_${iteration}`,
        input.response,
        {
          inputQuery: input.task,
        }
      );

      outputs.push(`PPQ overall score: ${ppqResult.overallScore.toFixed(2)}`);

      // Check for issues in PPQ results
      for (const result of ppqResult.results) {
        if (result.flags.length > 0) {
          issues.push(...result.flags);
        }
      }

      artifacts.set('ppq_report', ppqResult);
    }

    // Confidence based on issues found
    const confidence = issues.length === 0 ? 0.95 : Math.max(0.5, 0.95 - issues.length * 0.1);

    return { outputs, issues, recommendations, artifacts, confidence };
  }

  // ========================================================================
  // MOMENTUM FLOW CONTROL
  // ========================================================================

  determineNextPhase(currentPhase: MomentumPhase, result: PhaseResult): MomentumTransition {
    const transition: MomentumTransition = {
      from: currentPhase,
      to: currentPhase, // default to same phase
      reason: '',
      confidence: result.confidence,
      timestamp: new Date(),
      shouldRecurse: false,
    };

    // Normal flow: clarify → architect → work → audit → done
    if (result.success && result.confidence >= MOMENTUM_PHASES[currentPhase].minConfidence) {
      switch (currentPhase) {
        case 'clarify':
          transition.to = 'architect';
          transition.reason = 'Clarification complete, proceeding to architecture';
          break;

        case 'architect':
          transition.to = 'work';
          transition.reason = 'Architecture defined, proceeding to implementation';
          break;

        case 'work':
          transition.to = 'audit';
          transition.reason = 'Implementation complete, proceeding to audit';
          break;

        case 'audit':
          // Success - done!
          transition.to = 'audit';
          transition.reason = 'Audit passed, task complete';
          break;
      }
    } else {
      // Failure or low confidence - handle recursion
      if (result.issues.length > 0) {
        // Determine where to recurse
        transition.shouldRecurse = true;

        if (currentPhase === 'audit') {
          // Audit found issues - go back to work
          transition.recurseTo = 'work';
          transition.reason = `Audit found ${result.issues.length} issues, recursing to Work phase`;
        } else if (currentPhase === 'work') {
          // Work failed - may need to revisit architecture
          if (result.iterations >= MOMENTUM_PHASES.work.maxIterations) {
            transition.recurseTo = 'architect';
            transition.reason = 'Work phase exhausted iterations, recursing to Architect';
          } else {
            transition.recurseTo = 'work';
            transition.reason = 'Retrying work phase';
          }
        } else if (currentPhase === 'architect') {
          transition.recurseTo = 'clarify';
          transition.reason = 'Architecture unclear, recursing to Clarify';
        } else {
          transition.recurseTo = 'clarify';
          transition.reason = 'Starting over from Clarify phase';
        }
      }
    }

    this.transitions.push(transition);
    return transition;
  }

  async executeRecursion(transition: MomentumTransition, input: PhaseInput): Promise<boolean> {
    if (!transition.shouldRecurse || !transition.recurseTo) {
      return false;
    }

    // Check recursion depth
    if (this.state.recursionDepth >= this.state.maxRecursionDepth) {
      console.warn('Maximum recursion depth reached');
      return false;
    }

    this.state.recursionDepth++;
    this.state.currentPhase = transition.recurseTo;
    this.state.iteration = 0;
    this.state.lastTransition = new Date();

    // Execute the recursive phase
    const result = await this.executePhase(transition.recurseTo, input);

    // Continue momentum flow
    if (result.success) {
      const nextTransition = this.determineNextPhase(transition.recurseTo, result);
      if (nextTransition.shouldRecurse) {
        return await this.executeRecursion(nextTransition, input);
      }
    }

    return result.success;
  }

  // ========================================================================
  // UTILITIES
  // ========================================================================

  private checkSuccessCriteria(criteria: string[], result: IterationResult): boolean {
    // Simplified - just check if we have high confidence and no critical issues
    return result.confidence >= 0.7 && result.issues.length === 0;
  }

  private recordCOPLTask(phase: MomentumPhase, result: PhaseResult): void {
    const components = ['momentum', phase];

    // Add components from artifacts if available
    const coplRecs = result.artifacts.get('copl_recommendations');
    if (coplRecs && Array.isArray(coplRecs)) {
      for (const rec of coplRecs) {
        components.push(rec.suggestedComponent);
      }
    }

    const taskExecution: TaskExecution = {
      id: `${phase}_${Date.now()}`,
      components,
      success: result.success,
      duration: result.duration,
      timestamp: new Date(),
    };

    this.coplLearner.recordTask(taskExecution);
  }

  getState(): MomentumState {
    return { ...this.state };
  }

  getTransitions(): MomentumTransition[] {
    return [...this.transitions];
  }

  reset(): void {
    this.state = {
      currentPhase: 'clarify',
      iteration: 0,
      confidence: 0,
      completedPhases: [],
      phaseResults: new Map(),
      startTime: new Date(),
      lastTransition: new Date(),
      recursionDepth: 0,
      maxRecursionDepth: this.state.maxRecursionDepth,
    };
    this.transitions = [];
  }

  // ========================================================================
  // FULL MOMENTUM EXECUTION
  // ========================================================================

  async execute(input: PhaseInput): Promise<MomentumResult> {
    this.reset();

    const phases: MomentumPhase[] = ['clarify', 'architect', 'work', 'audit'];
    const phaseResults: PhaseResult[] = [];

    for (const phase of phases) {
      this.state.currentPhase = phase;
      const result = await this.executePhase(phase, input);
      phaseResults.push(result);

      const transition = this.determineNextPhase(phase, result);

      if (transition.shouldRecurse) {
        const recursionSuccess = await this.executeRecursion(transition, input);
        if (!recursionSuccess) {
          break;
        }
      }

      if (!result.success && !transition.shouldRecurse) {
        // Failed and can't recurse
        break;
      }
    }

    const overallSuccess = phaseResults.every(r => r.success);
    const totalDuration = phaseResults.reduce((sum, r) => sum + r.duration, 0);

    return {
      success: overallSuccess,
      phases: phaseResults,
      transitions: this.transitions,
      totalDuration,
      recursionDepth: this.state.recursionDepth,
    };
  }
}

// ============================================================================
// TYPES
// ============================================================================

export interface PhaseInput {
  task: string;
  components?: string[];
  response?: string;
  context?: any;
}

export interface IterationResult {
  outputs: string[];
  issues: string[];
  recommendations: string[];
  artifacts: Map<string, any>;
  confidence: number;
}

export interface MomentumResult {
  success: boolean;
  phases: PhaseResult[];
  transitions: MomentumTransition[];
  totalDuration: number;
  recursionDepth: number;
}
