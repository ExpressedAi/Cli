/**
 * COPL (Cross-Ontological Phase-Locking) System
 * Reinforcement learning using phase-locking patterns and LOW framework
 */

// ============================================================================
// COPL TENSOR (Phase-Lock State)
// ============================================================================

export interface COPLEdge {
  nodeA: string;              // First component
  nodeB: string;              // Second component
  ratio: string;              // p:q (e.g., "1:1", "2:1", "3:2")

  // Core quantities
  frequencyDetune: number;    // How far from sync
  phaseError: number;         // Phase alignment error (degrees)
  coherence: number;          // How locked they are [0,1]
  pull: number;               // Coupling strength
  eligibility: number;        // Net capture capacity

  // SHR state
  shrState: 'snap' | 'hold' | 'release';

  // Performance tracking
  successCount: number;       // How many times this lock succeeded
  failureCount: number;       // How many times it failed
  score: number;              // TrueSkill-like rating
}

// Low-order ratios (preferred patterns)
export const LOW_ORDER_RATIOS = [
  '1:1',  // Synchronous
  '2:1',  // Doubling
  '1:2',  // Halving
  '3:2',  // Perfect fifth
  '4:3',  // Perfect fourth
  '2:3',  // Inverse perfect fifth
];

// ============================================================================
// SHR (Snap-Hold-Release) State Machine
// ============================================================================

export type SHRState = 'snap' | 'hold' | 'release';

export interface SHRTransition {
  from: SHRState;
  to: SHRState;
  reason: string;
  timestamp: Date;
}

export function computeSHRState(edge: COPLEdge): SHRState {
  const PHI_SNAP = 25;    // degrees
  const PHI_TOL = 10;     // degrees
  const COHERENCE_MIN = 0.6;

  // Snap: Moving away from lock or high phase error
  if (Math.abs(edge.phaseError) > PHI_SNAP) {
    return 'snap';
  }

  // Hold: Low phase error and high coherence
  if (Math.abs(edge.phaseError) <= PHI_TOL && edge.coherence >= COHERENCE_MIN) {
    return 'hold';
  }

  // Release: Lock is decaying
  if (edge.coherence < COHERENCE_MIN && edge.pull < 0.3) {
    return 'release';
  }

  // Default to snap (uncertain state)
  return 'snap';
}

// ============================================================================
// COPL GRAPH
// ============================================================================

export class COPLGraph {
  private edges: Map<string, COPLEdge> = new Map();
  private nodes: Set<string> = new Set();

  // Track history
  private transitions: SHRTransition[] = [];

  // Add a node (neuron, agent, component)
  addNode(id: string): void {
    this.nodes.add(id);
  }

  // Create or update an edge
  setEdge(nodeA: string, nodeB: string, ratio: string, metrics: Partial<COPLEdge>): void {
    const edgeKey = this.getEdgeKey(nodeA, nodeB, ratio);

    const existing = this.edges.get(edgeKey);
    const edge: COPLEdge = {
      nodeA,
      nodeB,
      ratio,
      frequencyDetune: metrics.frequencyDetune ?? 0,
      phaseError: metrics.phaseError ?? 0,
      coherence: metrics.coherence ?? 0.5,
      pull: metrics.pull ?? 0.5,
      eligibility: metrics.eligibility ?? 0,
      shrState: 'snap',
      successCount: existing?.successCount ?? 0,
      failureCount: existing?.failureCount ?? 0,
      score: existing?.score ?? 1000, // Starting TrueSkill rating
    };

    // Compute SHR state
    edge.shrState = computeSHRState(edge);

    // Track transitions
    if (existing && existing.shrState !== edge.shrState) {
      this.transitions.push({
        from: existing.shrState,
        to: edge.shrState,
        reason: `Phase error: ${edge.phaseError.toFixed(1)}°, Coherence: ${edge.coherence.toFixed(2)}`,
        timestamp: new Date(),
      });
    }

    this.edges.set(edgeKey, edge);
    this.nodes.add(nodeA);
    this.nodes.add(nodeB);
  }

  // Get edge
  getEdge(nodeA: string, nodeB: string, ratio: string): COPLEdge | undefined {
    return this.edges.get(this.getEdgeKey(nodeA, nodeB, ratio));
  }

  // Get all edges for a node
  getNodeEdges(nodeId: string): COPLEdge[] {
    return Array.from(this.edges.values()).filter(
      e => e.nodeA === nodeId || e.nodeB === nodeId
    );
  }

  // Get all held locks (successful patterns)
  getHeldLocks(): COPLEdge[] {
    return Array.from(this.edges.values()).filter(
      e => e.shrState === 'hold'
    );
  }

  // Get N-lock score for a set of edges
  getNLockScore(edgeKeys: string[]): number {
    let product = 1;
    let count = 0;
    let allHeld = true;

    for (const key of edgeKeys) {
      const edge = this.edges.get(key);
      if (!edge) continue;

      if (edge.shrState !== 'hold') {
        allHeld = false;
        break;
      }

      // Simplified pull/damping ratio
      const ratio = edge.pull / (1 - edge.coherence + 0.1);
      product *= ratio;
      count++;
    }

    if (!allHeld || count === 0) return 0;

    // Geometric mean
    return Math.pow(product, 1 / count);
  }

  // Record success or failure
  recordOutcome(nodeA: string, nodeB: string, ratio: string, success: boolean): void {
    const edge = this.getEdge(nodeA, nodeB, ratio);
    if (!edge) return;

    if (success) {
      edge.successCount++;
      // Increase score (TrueSkill-like)
      edge.score += 25 * (1 - edge.score / 2000);

      // Strengthen the lock
      edge.coherence = Math.min(1, edge.coherence + 0.1);
      edge.pull = Math.min(1, edge.pull + 0.05);
      edge.phaseError *= 0.7; // Reduce error
    } else {
      edge.failureCount++;
      // Decrease score
      edge.score -= 25 * (edge.score / 2000);

      // Weaken the lock
      edge.coherence = Math.max(0, edge.coherence - 0.15);
      edge.pull = Math.max(0, edge.pull - 0.1);
      edge.phaseError += 10; // Increase error
    }

    // Recompute SHR state
    const oldState = edge.shrState;
    edge.shrState = computeSHRState(edge);

    if (oldState !== edge.shrState) {
      this.transitions.push({
        from: oldState,
        to: edge.shrState,
        reason: success ? 'Success reinforcement' : 'Failure degradation',
        timestamp: new Date(),
      });
    }

    // Update the edge
    const edgeKey = this.getEdgeKey(nodeA, nodeB, ratio);
    this.edges.set(edgeKey, edge);
  }

  // LOW Framework: Prefer low-order ratios
  getLowOrderEdges(): COPLEdge[] {
    return Array.from(this.edges.values()).filter(
      e => LOW_ORDER_RATIOS.includes(e.ratio)
    );
  }

  // Get statistics
  getStats(): COPLStats {
    const edges = Array.from(this.edges.values());
    const held = edges.filter(e => e.shrState === 'hold');
    const snapping = edges.filter(e => e.shrState === 'snap');
    const releasing = edges.filter(e => e.shrState === 'release');
    const lowOrder = edges.filter(e => LOW_ORDER_RATIOS.includes(e.ratio));

    const totalSuccess = edges.reduce((sum, e) => sum + e.successCount, 0);
    const totalFailure = edges.reduce((sum, e) => sum + e.failureCount, 0);

    return {
      totalNodes: this.nodes.size,
      totalEdges: edges.length,
      heldLocks: held.length,
      snappingLocks: snapping.length,
      releasingLocks: releasing.length,
      lowOrderLocks: lowOrder.length,
      successRate: totalSuccess + totalFailure > 0
        ? totalSuccess / (totalSuccess + totalFailure)
        : 0,
      avgCoherence: edges.length > 0
        ? edges.reduce((sum, e) => sum + e.coherence, 0) / edges.length
        : 0,
      transitions: this.transitions.length,
    };
  }

  // Get top performing patterns
  getTopPatterns(n: number = 10): COPLPattern[] {
    return Array.from(this.edges.values())
      .filter(e => e.successCount > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, n)
      .map(e => ({
        nodeA: e.nodeA,
        nodeB: e.nodeB,
        ratio: e.ratio,
        score: e.score,
        successRate: e.successCount / (e.successCount + e.failureCount),
        coherence: e.coherence,
        shrState: e.shrState,
      }));
  }

  // Prune weak edges (release state)
  pruneWeakEdges(): number {
    const toRemove: string[] = [];

    for (const [key, edge] of this.edges) {
      if (edge.shrState === 'release' && edge.coherence < 0.2) {
        toRemove.push(key);
      }
    }

    for (const key of toRemove) {
      this.edges.delete(key);
    }

    return toRemove.length;
  }

  private getEdgeKey(nodeA: string, nodeB: string, ratio: string): string {
    // Normalize direction (A-B same as B-A)
    const [a, b] = [nodeA, nodeB].sort();
    return `${a}::${b}::${ratio}`;
  }
}

// ============================================================================
// TYPES
// ============================================================================

export interface COPLStats {
  totalNodes: number;
  totalEdges: number;
  heldLocks: number;
  snappingLocks: number;
  releasingLocks: number;
  lowOrderLocks: number;
  successRate: number;
  avgCoherence: number;
  transitions: number;
}

export interface COPLPattern {
  nodeA: string;
  nodeB: string;
  ratio: string;
  score: number;
  successRate: number;
  coherence: number;
  shrState: SHRState;
}

// ============================================================================
// COPL LEARNER
// ============================================================================

export class COPLLearner {
  private graph: COPLGraph;

  constructor() {
    this.graph = new COPLGraph();
  }

  // Record a task execution
  recordTask(task: TaskExecution): void {
    // Add nodes for all components used
    for (const component of task.components) {
      this.graph.addNode(component);
    }

    // Create edges between components that worked together
    for (let i = 0; i < task.components.length - 1; i++) {
      for (let j = i + 1; j < task.components.length; j++) {
        const nodeA = task.components[i]!;
        const nodeB = task.components[j]!;

        // Try low-order ratios
        for (const ratio of LOW_ORDER_RATIOS) {
          // Compute phase metrics (simplified)
          const phaseError = this.computePhaseError(nodeA, nodeB, task);
          const coherence = task.success ? 0.8 : 0.3;
          const pull = 0.5;

          this.graph.setEdge(nodeA, nodeB, ratio, {
            frequencyDetune: 0,
            phaseError,
            coherence,
            pull,
            eligibility: pull > 0.3 ? 0.5 : 0,
          });

          // Record outcome
          this.graph.recordOutcome(nodeA, nodeB, ratio, task.success);
        }
      }
    }
  }

  // Get recommendations for a task
  recommend(components: string[]): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Find well-performing patterns involving these components
    for (const component of components) {
      const edges = this.graph.getNodeEdges(component);
      const held = edges.filter(e => e.shrState === 'hold');

      for (const edge of held) {
        const partner = edge.nodeA === component ? edge.nodeB : edge.nodeA;
        recommendations.push({
          suggestedComponent: partner,
          ratio: edge.ratio,
          confidence: edge.coherence,
          reason: `Held lock ${edge.ratio} with ${component}, score: ${edge.score.toFixed(0)}`,
        });
      }
    }

    // Sort by confidence
    return recommendations.sort((a, b) => b.confidence - a.confidence);
  }

  // Get the graph
  getGraph(): COPLGraph {
    return this.graph;
  }

  // Compute phase error between two components (simplified)
  private computePhaseError(nodeA: string, nodeB: string, task: TaskExecution): number {
    // In reality, would analyze timing, dependencies, etc.
    // Simplified: random perturbation based on success
    return task.success
      ? Math.random() * 10   // Low error on success
      : Math.random() * 30 + 20; // High error on failure
  }
}

// ============================================================================
// TASK EXECUTION RECORD
// ============================================================================

export interface TaskExecution {
  id: string;
  components: string[];     // Which neurons/agents were used
  success: boolean;
  duration: number;
  metrics?: Record<string, number>;
  timestamp: Date;
}

export interface Recommendation {
  suggestedComponent: string;
  ratio: string;
  confidence: number;
  reason: string;
}
