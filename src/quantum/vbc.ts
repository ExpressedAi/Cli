/**
 * Variable Barrier Controller (VBC)
 * Budgeted, phase-locked semantic control for 100D memory space
 */

import { SpinVector } from "./superarray.js";

// ============================================================================
// VBC KERNEL CONFIGURATION
// ============================================================================

export interface VBCAxis {
  name: string;
  dimensions: string[];      // Which Superarray dimensions this axis controls
  budget: number;            // Max activation per tick [0,1]
  load: number;              // Current utilization [0,1]
  decay: number;             // Load decay rate (0 < ρ < 1)
}

export interface VBCKernel {
  // Axes configuration
  axes: Map<string, VBCAxis>;

  // Global constraints
  maxConcurrentAxes: number;  // Max number of axes that can be active
  totalBudget: number;        // Total "movement" budget [0,1]

  // Current state
  currentPhase: TickPhase;
  currentSpin: SpinVector | null;

  // Tick counter
  tickCount: number;
}

// ============================================================================
// TICK PHASES (Standing Wave Breath)
// ============================================================================

export type TickPhase = 'capture' | 'clean' | 'bridge' | 'commit';

export interface TickConfig {
  phase: TickPhase;
  capMultipliers: Record<string, number>;  // Per-axis multipliers for this phase
  admissiblePerformers: string[];          // Which micro-performers can fire
}

export const TICK_PHASES: Record<TickPhase, TickConfig> = {
  capture: {
    phase: 'capture',
    capMultipliers: {
      semantic: 1.5,      // Explore semantics
      entity: 1.3,        // Capture entities
      temporal: 1.2,      // Understand time
      spatial: 1.2,       // Understand space
      pragmatics: 1.1,
    },
    admissiblePerformers: ['Prototype', 'Explore', 'Scan', 'Observe'],
  },

  clean: {
    phase: 'clean',
    capMultipliers: {
      structural: 1.4,    // Clean structure
      computational: 1.3, // Optimize complexity
      aesthetic: 1.2,     // Improve elegance
      epistemic: 1.1,
    },
    admissiblePerformers: ['Refine', 'Edit', 'Denoise', 'Benchmark'],
  },

  bridge: {
    phase: 'bridge',
    capMultipliers: {
      relation: 1.5,      // Build connections
      causality: 1.4,     // Establish causality
      alignment: 1.3,     // Align values
      epistemic: 1.2,     // Evidence gathering
    },
    admissiblePerformers: ['Align', 'Calibrate', 'Normalize', 'Attune'],
  },

  commit: {
    phase: 'commit',
    capMultipliers: {
      actionability: 1.6, // High actionability
      alignment: 1.4,     // Strong alignment check
      epistemic: 1.3,     // High certainty required
      pragmatics: 1.2,
    },
    admissiblePerformers: ['Commit', 'Validate', 'Explain', 'Choose'],
  },
};

// ============================================================================
// DELTA (Proposed Change Vector)
// ============================================================================

export interface Delta {
  axis: string;
  magnitude: number;        // How much change [0,1]
  direction: 'increase' | 'decrease';
  reason: string;
}

export interface DeltaSet {
  deltas: Delta[];
  requestedBy: string;      // Which micro-performer requested this
  timestamp: Date;
}

// ============================================================================
// VBC KERNEL CLASS
// ============================================================================

export class VariableBarrierController {
  private kernel: VBCKernel;

  constructor(config?: Partial<VBCKernel>) {
    this.kernel = {
      axes: this.initializeAxes(),
      maxConcurrentAxes: config?.maxConcurrentAxes ?? 4,
      totalBudget: config?.totalBudget ?? 0.7,
      currentPhase: 'capture',
      currentSpin: null,
      tickCount: 0,
    };
  }

  // Initialize default axes mapping to Superarray dimensions
  private initializeAxes(): Map<string, VBCAxis> {
    const axes = new Map<string, VBCAxis>();

    axes.set('semantics', {
      name: 'semantics',
      dimensions: ['semantic', 'embedding', 'computational'],
      budget: 0.3,
      load: 0,
      decay: 0.85,
    });

    axes.set('relations', {
      name: 'relations',
      dimensions: ['relation', 'causality', 'entity'],
      budget: 0.3,
      load: 0,
      decay: 0.85,
    });

    axes.set('evidence', {
      name: 'evidence',
      dimensions: ['epistemic', 'rhetorical', 'alignment'],
      budget: 0.25,
      load: 0,
      decay: 0.9,
    });

    axes.set('context', {
      name: 'context',
      dimensions: ['temporal', 'spatial', 'chunking'],
      budget: 0.2,
      load: 0,
      decay: 0.9,
    });

    axes.set('action', {
      name: 'action',
      dimensions: ['actionability', 'pragmatics', 'structural'],
      budget: 0.25,
      load: 0,
      decay: 0.85,
    });

    axes.set('affect', {
      name: 'affect',
      dimensions: ['sentiment', 'aesthetic'],
      budget: 0.15,
      load: 0,
      decay: 0.95,
    });

    return axes;
  }

  // ========================================================================
  // TICK EXECUTION
  // ========================================================================

  tick(phase?: TickPhase): TickResult {
    if (phase) {
      this.kernel.currentPhase = phase;
    }

    // Apply decay to all loads
    for (const axis of this.kernel.axes.values()) {
      axis.load *= axis.decay;
    }

    this.kernel.tickCount++;

    return {
      phase: this.kernel.currentPhase,
      tickCount: this.kernel.tickCount,
      loads: this.getCurrentLoads(),
      admissiblePerformers: TICK_PHASES[this.kernel.currentPhase].admissiblePerformers,
    };
  }

  // ========================================================================
  // GATE: Admit/Throttle/Defer Deltas
  // ========================================================================

  gate(proposedDeltas: DeltaSet): GateResult {
    const phaseConfig = TICK_PHASES[this.kernel.currentPhase];
    const admittedDeltas: Delta[] = [];
    const throttledDeltas: Delta[] = [];
    const deferredDeltas: Delta[] = [];

    let totalMovement = 0;
    const activeAxes = new Set<string>();

    for (const delta of proposedDeltas.deltas) {
      const axis = this.kernel.axes.get(delta.axis);
      if (!axis) {
        continue; // Unknown axis
      }

      // Apply phase multiplier
      const effectiveBudget = axis.budget * (phaseConfig.capMultipliers[delta.axis] ?? 1.0);
      const availableBudget = effectiveBudget - axis.load;

      // Check if we can admit this delta
      if (delta.magnitude <= availableBudget) {
        // Check global constraints
        if (activeAxes.size >= this.kernel.maxConcurrentAxes && !activeAxes.has(delta.axis)) {
          // Too many concurrent axes
          deferredDeltas.push(delta);
        } else if (totalMovement + delta.magnitude <= this.kernel.totalBudget) {
          // Admit the delta
          admittedDeltas.push(delta);
          axis.load += delta.magnitude;
          totalMovement += delta.magnitude;
          activeAxes.add(delta.axis);
        } else {
          // Would exceed total budget
          throttledDeltas.push(delta);
        }
      } else {
        // Would exceed axis budget
        throttledDeltas.push(delta);
      }
    }

    return {
      admitted: admittedDeltas,
      throttled: throttledDeltas,
      deferred: deferredDeltas,
      totalMovement,
      activeAxes: Array.from(activeAxes),
    };
  }

  // ========================================================================
  // SPIN CONTROL
  // ========================================================================

  setSpin(spin: SpinVector): void {
    this.kernel.currentSpin = spin;
  }

  getSpin(): SpinVector | null {
    return this.kernel.currentSpin;
  }

  // Compute which axes align with current spin
  getSpinAlignedAxes(): string[] {
    if (!this.kernel.currentSpin) return [];

    const aligned: Array<{axis: string, alignment: number}> = [];

    for (const [axisName, axis] of this.kernel.axes) {
      // Compute alignment score based on spin weights of controlled dimensions
      let alignmentScore = 0;
      for (const dim of axis.dimensions) {
        alignmentScore += (this.kernel.currentSpin as any)[dim] ?? 0;
      }

      aligned.push({
        axis: axisName,
        alignment: alignmentScore / axis.dimensions.length,
      });
    }

    // Sort by alignment and return top axes
    return aligned
      .sort((a, b) => b.alignment - a.alignment)
      .map(a => a.axis);
  }

  // ========================================================================
  // STATE INSPECTION
  // ========================================================================

  getCurrentLoads(): Record<string, number> {
    const loads: Record<string, number> = {};
    for (const [name, axis] of this.kernel.axes) {
      loads[name] = axis.load;
    }
    return loads;
  }

  getStatus(): VBCStatus {
    return {
      phase: this.kernel.currentPhase,
      tickCount: this.kernel.tickCount,
      loads: this.getCurrentLoads(),
      spin: this.kernel.currentSpin,
      spinAlignedAxes: this.getSpinAlignedAxes(),
      totalBudget: this.kernel.totalBudget,
      maxConcurrentAxes: this.kernel.maxConcurrentAxes,
    };
  }

  // ========================================================================
  // BUDGET ADJUSTMENT (for learning)
  // ========================================================================

  adjustBudget(axis: string, newBudget: number): void {
    const axisObj = this.kernel.axes.get(axis);
    if (axisObj) {
      axisObj.budget = Math.max(0, Math.min(1, newBudget));
    }
  }

  adjustDecay(axis: string, newDecay: number): void {
    const axisObj = this.kernel.axes.get(axis);
    if (axisObj) {
      axisObj.decay = Math.max(0, Math.min(1, newDecay));
    }
  }
}

// ============================================================================
// RESULT TYPES
// ============================================================================

export interface TickResult {
  phase: TickPhase;
  tickCount: number;
  loads: Record<string, number>;
  admissiblePerformers: string[];
}

export interface GateResult {
  admitted: Delta[];
  throttled: Delta[];
  deferred: Delta[];
  totalMovement: number;
  activeAxes: string[];
}

export interface VBCStatus {
  phase: TickPhase;
  tickCount: number;
  loads: Record<string, number>;
  spin: SpinVector | null;
  spinAlignedAxes: string[];
  totalBudget: number;
  maxConcurrentAxes: number;
}

// ============================================================================
// MICRO-PERFORMER PROFILE
// ============================================================================

export interface MicroPerformerProfile {
  id: string;
  name: string;
  axisProfile: Record<string, number>;  // Expected pressure on each axis
  cost: number;                         // Token cost estimate
  description: string;
}

// Example micro-performers
export const MICRO_PERFORMERS: MicroPerformerProfile[] = [
  {
    id: 'prototype',
    name: 'Prototype',
    axisProfile: {
      semantics: 0.12,
      relations: 0.05,
      context: 0.05,
      action: 0.02,
    },
    cost: 500,
    description: 'Generate initial hypotheses and explore semantic space',
  },
  {
    id: 'denoise',
    name: 'Denoise',
    axisProfile: {
      semantics: 0.05,
      evidence: 0.08,
      affect: 0.03,
    },
    cost: 300,
    description: 'Clean and refine existing content',
  },
  {
    id: 'benchmark',
    name: 'Benchmark',
    axisProfile: {
      evidence: 0.22,
      relations: 0.08,
      context: 0.05,
    },
    cost: 600,
    description: 'Validate claims against evidence',
  },
  {
    id: 'validate',
    name: 'Validate',
    axisProfile: {
      evidence: 0.15,
      action: 0.10,
      affect: 0.02,
    },
    cost: 400,
    description: 'Final validation before commit',
  },
  {
    id: 'align',
    name: 'Align',
    axisProfile: {
      relations: 0.15,
      evidence: 0.10,
      context: 0.08,
    },
    cost: 500,
    description: 'Align components and resolve conflicts',
  },
];
