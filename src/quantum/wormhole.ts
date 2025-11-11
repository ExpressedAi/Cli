/**
 * Wormhole Navigation System
 * Non-linear traversal through Superarray memory graph
 */

import { MemoryAtom, SuperarrayMemory, SpinVector } from "./superarray.js";

// ============================================================================
// WORMHOLE TYPES
// ============================================================================

export type WormholeType =
  | 'semantic'        // Semantic similarity jump
  | 'temporal'        // Time-based leap
  | 'causal'          // Cause-effect chain
  | 'entity'          // Entity-based connection
  | 'pattern'         // Pattern recognition jump
  | 'contrast'        // Opposite/contrast jump
  | 'analogy'         // Analogical leap
  | 'hierarchical'    // Parent-child navigation
  | 'surprise'        // Unexpected connection
  | 'resonance';      // Harmonic resonance

export interface Wormhole {
  from: string;                 // Source atom UID
  to: string;                   // Destination atom UID
  type: WormholeType;
  strength: number;             // [0,1] - how strong the connection
  bidirectional: boolean;
  condition?: WormholeCondition;
  metadata: WormholeMetadata;
  created: Date;
  traversalCount: number;       // How many times traversed
  lastTraversed?: Date;
}

export interface WormholeCondition {
  type: 'spin_alignment' | 'dimension_active' | 'temporal' | 'custom';
  params: Record<string, any>;
  evaluate: (context: NavigationContext) => boolean;
}

export interface WormholeMetadata {
  reason: string;               // Why this wormhole exists
  confidence: number;           // How confident in this connection
  tags: string[];
  customData?: Record<string, any>;
}

// ============================================================================
// NAVIGATION CONTEXT
// ============================================================================

export interface NavigationContext {
  currentAtom: MemoryAtom;
  spinVector?: SpinVector;
  activeDimensions?: string[];
  timeConstraint?: {
    start: Date;
    end: Date;
  };
  visitedAtoms: Set<string>;
  maxDepth: number;
  currentDepth: number;
}

// ============================================================================
// NAVIGATION STRATEGY
// ============================================================================

export type NavigationStrategy =
  | 'breadth_first'     // Explore broadly
  | 'depth_first'       // Go deep quickly
  | 'best_first'        // Follow strongest connections
  | 'random_walk'       // Stochastic exploration
  | 'guided'            // Use spin vector to guide
  | 'surprise'          // Seek unexpected connections
  | 'temporal'          // Follow time sequence
  | 'causal';           // Follow cause-effect

export interface NavigationResult {
  path: MemoryAtom[];
  wormholes: Wormhole[];
  totalStrength: number;
  insights: string[];
  surprises: Surprise[];
}

export interface Surprise {
  atom: MemoryAtom;
  reason: string;
  unexpectedness: number;      // [0,1]
  wormhole: Wormhole;
}

// ============================================================================
// WORMHOLE NETWORK
// ============================================================================

export class WormholeNetwork {
  private wormholes: Map<string, Wormhole[]> = new Map(); // from UID -> wormholes
  private memory: SuperarrayMemory;
  private autoDiscovery: boolean;

  constructor(memory: SuperarrayMemory, autoDiscovery: boolean = true) {
    this.memory = memory;
    this.autoDiscovery = autoDiscovery;

    if (autoDiscovery) {
      this.discoverWormholes();
    }
  }

  // ========================================================================
  // WORMHOLE CREATION
  // ========================================================================

  createWormhole(wormhole: Omit<Wormhole, 'created' | 'traversalCount'>): void {
    const fullWormhole: Wormhole = {
      ...wormhole,
      created: new Date(),
      traversalCount: 0,
    };

    // Add to forward direction
    if (!this.wormholes.has(wormhole.from)) {
      this.wormholes.set(wormhole.from, []);
    }
    this.wormholes.get(wormhole.from)!.push(fullWormhole);

    // Add to reverse direction if bidirectional
    if (wormhole.bidirectional) {
      const reverseWormhole: Wormhole = {
        ...fullWormhole,
        from: wormhole.to,
        to: wormhole.from,
      };

      if (!this.wormholes.has(wormhole.to)) {
        this.wormholes.set(wormhole.to, []);
      }
      this.wormholes.get(wormhole.to)!.push(reverseWormhole);
    }
  }

  // ========================================================================
  // AUTOMATIC WORMHOLE DISCOVERY
  // ========================================================================

  discoverWormholes(): void {
    const atoms = this.memory.all();

    for (let i = 0; i < atoms.length; i++) {
      for (let j = i + 1; j < atoms.length; j++) {
        const atomA = atoms[i]!;
        const atomB = atoms[j]!;

        // Discover semantic wormholes
        this.discoverSemanticWormhole(atomA, atomB);

        // Discover temporal wormholes
        this.discoverTemporalWormhole(atomA, atomB);

        // Discover causal wormholes
        this.discoverCausalWormhole(atomA, atomB);

        // Discover entity wormholes
        this.discoverEntityWormhole(atomA, atomB);

        // Discover hierarchical wormholes
        this.discoverHierarchicalWormhole(atomA, atomB);
      }
    }
  }

  private discoverSemanticWormhole(atomA: MemoryAtom, atomB: MemoryAtom): void {
    // Check for semantic overlap
    const tagsA = new Set(atomA.semantic.topic_tags);
    const tagsB = new Set(atomB.semantic.topic_tags);

    const intersection = [...tagsA].filter(tag => tagsB.has(tag));

    if (intersection.length >= 2) {
      const strength = intersection.length / Math.max(tagsA.size, tagsB.size);

      this.createWormhole({
        from: atomA.identity.uid,
        to: atomB.identity.uid,
        type: 'semantic',
        strength,
        bidirectional: true,
        metadata: {
          reason: `Shared topics: ${intersection.join(', ')}`,
          confidence: strength,
          tags: intersection,
        },
      });
    }
  }

  private discoverTemporalWormhole(atomA: MemoryAtom, atomB: MemoryAtom): void {
    // Check for temporal proximity or sequence
    const timeA = atomA.temporal.time_start;
    const timeB = atomB.temporal.time_start;

    if (timeA && timeB) {
      const diffMs = Math.abs(timeA.getTime() - timeB.getTime());
      const hoursDiff = diffMs / (1000 * 60 * 60);

      if (hoursDiff < 24) {
        const strength = Math.max(0, 1 - hoursDiff / 24);

        this.createWormhole({
          from: atomA.identity.uid,
          to: atomB.identity.uid,
          type: 'temporal',
          strength,
          bidirectional: false,
          metadata: {
            reason: `Temporal proximity: ${hoursDiff.toFixed(1)} hours apart`,
            confidence: strength,
            tags: ['time-sequence'],
          },
        });
      }
    }
  }

  private discoverCausalWormhole(atomA: MemoryAtom, atomB: MemoryAtom): void {
    // Check if atomA's effects match atomB's preconditions
    const effectsA = atomA.causality.effects;
    const preconditionsB = atomB.causality.preconditions;

    const matches = effectsA.filter(effect =>
      preconditionsB.some(pre => pre.includes(effect) || effect.includes(pre))
    );

    if (matches.length > 0) {
      const strength = atomA.causality.causal_confidence * 0.8;

      this.createWormhole({
        from: atomA.identity.uid,
        to: atomB.identity.uid,
        type: 'causal',
        strength,
        bidirectional: false,
        metadata: {
          reason: `Causal chain: ${matches.join(', ')}`,
          confidence: strength,
          tags: ['cause-effect'],
        },
      });
    }
  }

  private discoverEntityWormhole(atomA: MemoryAtom, atomB: MemoryAtom): void {
    // Check for shared entities
    const entitiesA = new Set(atomA.entity.entities.map(e => e.canonical));
    const entitiesB = new Set(atomB.entity.entities.map(e => e.canonical));

    const sharedEntities = [...entitiesA].filter(e => entitiesB.has(e));

    if (sharedEntities.length > 0) {
      const strength = sharedEntities.length / Math.max(entitiesA.size, entitiesB.size);

      this.createWormhole({
        from: atomA.identity.uid,
        to: atomB.identity.uid,
        type: 'entity',
        strength,
        bidirectional: true,
        metadata: {
          reason: `Shared entities: ${sharedEntities.join(', ')}`,
          confidence: strength,
          tags: sharedEntities,
        },
      });
    }
  }

  private discoverHierarchicalWormhole(atomA: MemoryAtom, atomB: MemoryAtom): void {
    // Check parent-child relationship
    if (atomB.chunking.parent_uid === atomA.identity.uid) {
      this.createWormhole({
        from: atomA.identity.uid,
        to: atomB.identity.uid,
        type: 'hierarchical',
        strength: 1.0,
        bidirectional: false,
        metadata: {
          reason: 'Parent-child hierarchy',
          confidence: 1.0,
          tags: ['hierarchy', 'parent-child'],
        },
      });
    }
  }

  // ========================================================================
  // NAVIGATION
  // ========================================================================

  navigate(
    startUid: string,
    strategy: NavigationStrategy,
    options: NavigationOptions = {}
  ): NavigationResult {
    const startAtom = this.memory.get(startUid);
    if (!startAtom) {
      return {
        path: [],
        wormholes: [],
        totalStrength: 0,
        insights: ['Start atom not found'],
        surprises: [],
      };
    }

    const context: NavigationContext = {
      currentAtom: startAtom,
      spinVector: options.spinVector,
      activeDimensions: options.activeDimensions,
      timeConstraint: options.timeConstraint,
      visitedAtoms: new Set([startUid]),
      maxDepth: options.maxDepth || 10,
      currentDepth: 0,
    };

    switch (strategy) {
      case 'breadth_first':
        return this.breadthFirstNavigation(context, options);

      case 'depth_first':
        return this.depthFirstNavigation(context, options);

      case 'best_first':
        return this.bestFirstNavigation(context, options);

      case 'random_walk':
        return this.randomWalkNavigation(context, options);

      case 'guided':
        return this.guidedNavigation(context, options);

      case 'surprise':
        return this.surpriseNavigation(context, options);

      case 'temporal':
        return this.temporalNavigation(context, options);

      case 'causal':
        return this.causalNavigation(context, options);

      default:
        return this.bestFirstNavigation(context, options);
    }
  }

  private breadthFirstNavigation(
    context: NavigationContext,
    options: NavigationOptions
  ): NavigationResult {
    const path: MemoryAtom[] = [context.currentAtom];
    const wormholesUsed: Wormhole[] = [];
    const insights: string[] = [];
    const surprises: Surprise[] = [];

    const queue: Array<{ uid: string; depth: number }> = [
      { uid: context.currentAtom.identity.uid, depth: 0 },
    ];

    while (queue.length > 0 && path.length < (options.maxSteps || 20)) {
      const current = queue.shift()!;

      if (current.depth >= context.maxDepth) continue;

      const wormholes = this.getWormholes(current.uid);

      for (const wormhole of wormholes) {
        if (!context.visitedAtoms.has(wormhole.to)) {
          const destAtom = this.memory.get(wormhole.to);
          if (destAtom) {
            path.push(destAtom);
            wormholesUsed.push(wormhole);
            context.visitedAtoms.add(wormhole.to);
            queue.push({ uid: wormhole.to, depth: current.depth + 1 });

            // Track traversal
            wormhole.traversalCount++;
            wormhole.lastTraversed = new Date();
          }
        }
      }
    }

    const totalStrength = wormholesUsed.reduce((sum, w) => sum + w.strength, 0);
    insights.push(`Explored ${path.length} atoms breadth-first`);

    return { path, wormholes: wormholesUsed, totalStrength, insights, surprises };
  }

  private depthFirstNavigation(
    context: NavigationContext,
    options: NavigationOptions
  ): NavigationResult {
    const path: MemoryAtom[] = [];
    const wormholesUsed: Wormhole[] = [];
    const insights: string[] = [];
    const surprises: Surprise[] = [];

    const dfs = (uid: string, depth: number) => {
      if (depth >= context.maxDepth || path.length >= (options.maxSteps || 20)) {
        return;
      }

      const atom = this.memory.get(uid);
      if (!atom || context.visitedAtoms.has(uid)) return;

      path.push(atom);
      context.visitedAtoms.add(uid);

      const wormholes = this.getWormholes(uid).sort((a, b) => b.strength - a.strength);

      for (const wormhole of wormholes) {
        if (!context.visitedAtoms.has(wormhole.to)) {
          wormholesUsed.push(wormhole);
          wormhole.traversalCount++;
          wormhole.lastTraversed = new Date();
          dfs(wormhole.to, depth + 1);
        }
      }
    };

    dfs(context.currentAtom.identity.uid, 0);

    const totalStrength = wormholesUsed.reduce((sum, w) => sum + w.strength, 0);
    insights.push(`Explored ${path.length} atoms depth-first`);

    return { path, wormholes: wormholesUsed, totalStrength, insights, surprises };
  }

  private bestFirstNavigation(
    context: NavigationContext,
    options: NavigationOptions
  ): NavigationResult {
    const path: MemoryAtom[] = [context.currentAtom];
    const wormholesUsed: Wormhole[] = [];
    const insights: string[] = [];
    const surprises: Surprise[] = [];

    let currentUid = context.currentAtom.identity.uid;

    while (path.length < (options.maxSteps || 20) && context.currentDepth < context.maxDepth) {
      const wormholes = this.getWormholes(currentUid)
        .filter(w => !context.visitedAtoms.has(w.to))
        .sort((a, b) => b.strength - a.strength);

      if (wormholes.length === 0) break;

      const bestWormhole = wormholes[0]!;
      const destAtom = this.memory.get(bestWormhole.to);

      if (!destAtom) break;

      path.push(destAtom);
      wormholesUsed.push(bestWormhole);
      context.visitedAtoms.add(bestWormhole.to);
      currentUid = bestWormhole.to;
      context.currentDepth++;

      bestWormhole.traversalCount++;
      bestWormhole.lastTraversed = new Date();
    }

    const totalStrength = wormholesUsed.reduce((sum, w) => sum + w.strength, 0);
    insights.push(`Followed ${path.length} strongest connections`);

    return { path, wormholes: wormholesUsed, totalStrength, insights, surprises };
  }

  private randomWalkNavigation(
    context: NavigationContext,
    options: NavigationOptions
  ): NavigationResult {
    const path: MemoryAtom[] = [context.currentAtom];
    const wormholesUsed: Wormhole[] = [];
    const insights: string[] = [];
    const surprises: Surprise[] = [];

    let currentUid = context.currentAtom.identity.uid;

    while (path.length < (options.maxSteps || 20)) {
      const wormholes = this.getWormholes(currentUid).filter(
        w => !context.visitedAtoms.has(w.to)
      );

      if (wormholes.length === 0) break;

      const randomWormhole = wormholes[Math.floor(Math.random() * wormholes.length)]!;
      const destAtom = this.memory.get(randomWormhole.to);

      if (!destAtom) break;

      path.push(destAtom);
      wormholesUsed.push(randomWormhole);
      context.visitedAtoms.add(randomWormhole.to);
      currentUid = randomWormhole.to;

      randomWormhole.traversalCount++;
      randomWormhole.lastTraversed = new Date();
    }

    const totalStrength = wormholesUsed.reduce((sum, w) => sum + w.strength, 0);
    insights.push(`Random walk through ${path.length} atoms`);

    return { path, wormholes: wormholesUsed, totalStrength, insights, surprises };
  }

  private guidedNavigation(
    context: NavigationContext,
    options: NavigationOptions
  ): NavigationResult {
    const path: MemoryAtom[] = [context.currentAtom];
    const wormholesUsed: Wormhole[] = [];
    const insights: string[] = [];
    const surprises: Surprise[] = [];

    if (!context.spinVector) {
      insights.push('No spin vector provided, falling back to best-first');
      return this.bestFirstNavigation(context, options);
    }

    let currentUid = context.currentAtom.identity.uid;

    while (path.length < (options.maxSteps || 20)) {
      const wormholes = this.getWormholes(currentUid)
        .filter(w => !context.visitedAtoms.has(w.to));

      if (wormholes.length === 0) break;

      // Score each wormhole based on spin alignment
      const scoredWormholes = wormholes.map(w => {
        const destAtom = this.memory.get(w.to);
        if (!destAtom) return { wormhole: w, score: 0 };

        const spinAlignment = destAtom.spin_alignment || 0.5;
        const score = w.strength * 0.5 + spinAlignment * 0.5;

        return { wormhole: w, score };
      });

      scoredWormholes.sort((a, b) => b.score - a.score);

      const best = scoredWormholes[0]!;
      const destAtom = this.memory.get(best.wormhole.to);

      if (!destAtom) break;

      path.push(destAtom);
      wormholesUsed.push(best.wormhole);
      context.visitedAtoms.add(best.wormhole.to);
      currentUid = best.wormhole.to;

      best.wormhole.traversalCount++;
      best.wormhole.lastTraversed = new Date();
    }

    const totalStrength = wormholesUsed.reduce((sum, w) => sum + w.strength, 0);
    insights.push(`Guided navigation through ${path.length} atoms using spin vector`);

    return { path, wormholes: wormholesUsed, totalStrength, insights, surprises };
  }

  private surpriseNavigation(
    context: NavigationContext,
    options: NavigationOptions
  ): NavigationResult {
    const path: MemoryAtom[] = [context.currentAtom];
    const wormholesUsed: Wormhole[] = [];
    const insights: string[] = [];
    const surprises: Surprise[] = [];

    let currentUid = context.currentAtom.identity.uid;

    while (path.length < (options.maxSteps || 20)) {
      const wormholes = this.getWormholes(currentUid)
        .filter(w => !context.visitedAtoms.has(w.to));

      if (wormholes.length === 0) break;

      // Prefer unexpected wormholes (low traversal count, unusual types)
      const scoredWormholes = wormholes.map(w => {
        const unexpectedness = 1 - Math.min(1, w.traversalCount / 10);
        const typeBonus = ['contrast', 'surprise', 'analogy'].includes(w.type) ? 0.3 : 0;
        const score = (1 - w.strength) * 0.4 + unexpectedness * 0.4 + typeBonus;

        return { wormhole: w, score, unexpectedness };
      });

      scoredWormholes.sort((a, b) => b.score - a.score);

      const surprising = scoredWormholes[0]!;
      const destAtom = this.memory.get(surprising.wormhole.to);

      if (!destAtom) break;

      path.push(destAtom);
      wormholesUsed.push(surprising.wormhole);
      context.visitedAtoms.add(surprising.wormhole.to);
      currentUid = surprising.wormhole.to;

      surprising.wormhole.traversalCount++;
      surprising.wormhole.lastTraversed = new Date();

      surprises.push({
        atom: destAtom,
        reason: surprising.wormhole.metadata.reason,
        unexpectedness: surprising.unexpectedness,
        wormhole: surprising.wormhole,
      });
    }

    const totalStrength = wormholesUsed.reduce((sum, w) => sum + w.strength, 0);
    insights.push(`Found ${surprises.length} surprising connections`);

    return { path, wormholes: wormholesUsed, totalStrength, insights, surprises };
  }

  private temporalNavigation(
    context: NavigationContext,
    options: NavigationOptions
  ): NavigationResult {
    return this.typeFilteredNavigation(context, options, 'temporal');
  }

  private causalNavigation(
    context: NavigationContext,
    options: NavigationOptions
  ): NavigationResult {
    return this.typeFilteredNavigation(context, options, 'causal');
  }

  private typeFilteredNavigation(
    context: NavigationContext,
    options: NavigationOptions,
    type: WormholeType
  ): NavigationResult {
    const path: MemoryAtom[] = [context.currentAtom];
    const wormholesUsed: Wormhole[] = [];
    const insights: string[] = [];
    const surprises: Surprise[] = [];

    let currentUid = context.currentAtom.identity.uid;

    while (path.length < (options.maxSteps || 20)) {
      const wormholes = this.getWormholes(currentUid)
        .filter(w => w.type === type && !context.visitedAtoms.has(w.to))
        .sort((a, b) => b.strength - a.strength);

      if (wormholes.length === 0) break;

      const wormhole = wormholes[0]!;
      const destAtom = this.memory.get(wormhole.to);

      if (!destAtom) break;

      path.push(destAtom);
      wormholesUsed.push(wormhole);
      context.visitedAtoms.add(wormhole.to);
      currentUid = wormhole.to;

      wormhole.traversalCount++;
      wormhole.lastTraversed = new Date();
    }

    const totalStrength = wormholesUsed.reduce((sum, w) => sum + w.strength, 0);
    insights.push(`Followed ${type} chain through ${path.length} atoms`);

    return { path, wormholes: wormholesUsed, totalStrength, insights, surprises };
  }

  // ========================================================================
  // UTILITIES
  // ========================================================================

  getWormholes(fromUid: string, type?: WormholeType): Wormhole[] {
    const wormholes = this.wormholes.get(fromUid) || [];

    if (type) {
      return wormholes.filter(w => w.type === type);
    }

    return wormholes;
  }

  getWormholeStats(): WormholeStats {
    let total = 0;
    const typeCount: Record<WormholeType, number> = {} as any;
    let totalTraversals = 0;

    for (const wormholeList of this.wormholes.values()) {
      total += wormholeList.length;

      for (const wormhole of wormholeList) {
        typeCount[wormhole.type] = (typeCount[wormhole.type] || 0) + 1;
        totalTraversals += wormhole.traversalCount;
      }
    }

    return {
      totalWormholes: total,
      typeDistribution: typeCount,
      totalTraversals,
      avgTraversalsPerWormhole: total > 0 ? totalTraversals / total : 0,
    };
  }

  pruneWeakWormholes(minStrength: number = 0.3): number {
    let pruned = 0;

    for (const [uid, wormholeList] of this.wormholes) {
      const filtered = wormholeList.filter(w => w.strength >= minStrength);
      pruned += wormholeList.length - filtered.length;
      this.wormholes.set(uid, filtered);
    }

    return pruned;
  }
}

// ============================================================================
// TYPES
// ============================================================================

export interface NavigationOptions {
  spinVector?: SpinVector;
  activeDimensions?: string[];
  timeConstraint?: {
    start: Date;
    end: Date;
  };
  maxDepth?: number;
  maxSteps?: number;
}

export interface WormholeStats {
  totalWormholes: number;
  typeDistribution: Record<WormholeType, number>;
  totalTraversals: number;
  avgTraversalsPerWormhole: number;
}
