/**
 * Superarray Memory System
 * 100-dimensional context atoms for quantum cognitive processing
 */

// ============================================================================
// SUPERARRAY DIMENSION CATALOG (100 dimensions)
// ============================================================================

// 1) Identity & Provenance (5 dimensions)
export interface IdentityDimensions {
  uid: string;                    // Global unique ID
  source_id: string;              // File/conversation/session ID
  author_id: string;              // Speaker/agent identity
  created_at: Date;               // Original timestamp
  version: number;                // Content versioning counter
}

// 2) Chunking & Scope (5 dimensions)
export interface ChunkingDimensions {
  chunk_id: string;               // Segment ID within source
  parent_uid: string | null;      // Hierarchical parent link
  chunk_span: [number, number];   // Character offsets
  token_span: [number, number];   // Token offsets
  granular_level: 'doc' | 'section' | 'para' | 'sentence' | 'phrase';
}

// 3) Structural Form (5 dimensions)
export interface StructuralDimensions {
  syntax_tree_hash: string;       // Normalized parse signature
  part_of_speech_seq: string[];   // POS sequence
  rhetorical_mode: 'narration' | 'argument' | 'exposition' | 'command' | 'question';
  discourse_unit: 'claim' | 'premise' | 'example' | 'aside' | 'summary';
  narrative_role: 'setup' | 'build' | 'climax' | 'turn' | 'resolution';
}

// 4) Semantic Core (5 dimensions)
export interface SemanticDimensions {
  lemma_bag: string[];            // Normalized lemmas
  topic_tags: string[];           // Open taxonomy topics
  concept_ids: string[];          // KB/ontology IDs (Wikidata, etc.)
  sense_ids: string[];            // Word-sense disambiguations
  semantic_frames: string[];      // FrameNet/prop frames
}

// 5) Embeddings & Vectors (5 dimensions)
export interface EmbeddingDimensions {
  text_embedding: number[];       // Semantic embedding (512D)
  style_embedding: number[];      // Tone/voice vector
  affect_embedding: number[];     // Dimensional emotion (VAD)
  topic_embedding: number[];      // Thematic position
  multimodal_embedding: number[]; // Fused modality vector
}

// 6) Entity Layer (5 dimensions)
export interface EntityDimensions {
  entities: Array<{
    id: string;
    type: string;
    span: [number, number];
    canonical: string;
  }>;
  entity_types: string[];         // PER/ORG/LOC/... present
  entity_coref_groups: string[];  // Coreference cluster IDs
  entity_salience: Record<string, number>;    // Importance weights
  entity_link_conf: Record<string, number>;   // KB link confidence
}

// 7) Relation Layer (5 dimensions)
export interface RelationDimensions {
  relations: Array<{
    src: string;
    dst: string;
    type: string;
    attrs: Record<string, any>;
  }>;
  relation_types: string[];                   // Used relation schemas
  relation_weight: Record<string, number>;    // Strength/importance
  relation_confidence: Record<string, number>; // Extraction confidence
  relation_topology: 'tree' | 'DAG' | 'mesh' | 'multi-graph';
}

// 8) Causality Layer (5 dimensions)
export interface CausalityDimensions {
  causal_links: Array<{
    cause: string;
    effect: string;
    kind: string;
    lag: number;
  }>;
  causal_type: 'direct' | 'indirect' | 'enabling' | 'preventive';
  preconditions: string[];        // Required prior facts
  effects: string[];              // Downstream consequences
  causal_confidence: number;      // Causal plausibility [0,1]
}

// 9) Temporal Layer (5 dimensions)
export interface TemporalDimensions {
  time_refs: Array<{
    text: string;
    normalized: Date;
    granularity: string;
  }>;
  time_start: Date | null;        // Interval start
  time_end: Date | null;          // Interval end
  temporal_granularity: 'sec' | 'min' | 'hour' | 'day' | 'month' | 'year' | 'epoch';
  temporal_recurrence: 'none' | 'daily' | 'weekly' | 'seasonal' | 'cyclic';
}

// 10) Spatial & Geometry (5 dimensions)
export interface SpatialDimensions {
  geo_refs: Array<{
    place_id: string;
    lat: number;
    lng: number;
    span: [number, number];
  }>;
  spatial_frame: 'egocentric' | 'allocentric' | 'map' | 'abstract';
  orientation: number;            // Spin/orientation angle (radians)
  scale_category: 'micro' | 'meso' | 'macro' | 'cosmic';
  region_bounds: any;             // bbox/polygon or abstract bounds
}

// 11) Pragmatics & Intent (5 dimensions)
export interface PragmaticsDimensions {
  speech_act: 'assert' | 'request' | 'commit' | 'express' | 'declare';
  intent_type: 'inform' | 'persuade' | 'explore' | 'plan' | 'debug';
  directive_force: number;        // Strength of requested action [0,1]
  audience_role: 'self' | 'peer' | 'novice' | 'expert' | 'adversary';
  politeness_register: 'formal' | 'neutral' | 'casual' | 'profane';
}

// 12) Sentiment & Affect (5 dimensions)
export interface SentimentDimensions {
  sentiment_polarity: number;     // [-1,1]
  affect_labels: string[];        // joy, anger, fear, hope, wonder
  arousal_valence: {
    arousal: number;
    valence: number;
  };
  mood_state: 'calm' | 'tense' | 'elated' | 'somber' | 'focused';
  affect_shift: number;           // Delta vs. previous segment
}

// 13) Epistemic & Modality (5 dimensions)
export interface EpistemicDimensions {
  certainty: number;              // Confidence in proposition [0,1]
  knowledge_status: 'fact' | 'hypothesis' | 'belief' | 'rumor' | 'fiction';
  evidence_type: 'empirical' | 'logical' | 'expert' | 'anecdote' | 'metaphor';
  hedging_intensity: number;      // [0,1]
  hypotheticality: number;        // Counterfactual degree [0,1]
}

// 14) Rhetorical & Argumentation (5 dimensions)
export interface RhetoricalDimensions {
  claim_presence: boolean;        // Explicit claim?
  premise_strength: number;       // Support strength
  warrant_type: 'causal' | 'analogical' | 'statistical' | 'authority';
  fallacy_flags: string[];        // Detected fallacies
  rhetorical_devices: string[];   // metaphor, anaphora, etc.
}

// 15) Aesthetics & Harmonics (5 dimensions)
export interface AestheticDimensions {
  rhythm_score: number;           // Cadence/periodicity
  symmetry_score: number;         // Structural balance
  contrast_axes: string[];        // Delta oppositions encoded
  resonance_score: number;        // "Ring" with prior motifs
  beauty_score: number;           // Subjective aesthetic intensity
}

// 16) Computation & Info-Theory (5 dimensions)
export interface ComputationalDimensions {
  complexity_class: 'simple' | 'linear' | 'poly' | 'expo' | 'fractal';
  kolmogorov_estimate: number;    // Description length proxy
  entropy_bits: number;           // Info uncertainty
  compressibility: number;        // Redundancy ratio
  novelty_score: number;          // Deviation from corpus baseline
}

// 17) Actionability & Ops (5 dimensions)
export interface ActionabilityDimensions {
  actionability: 'none' | 'low' | 'medium' | 'high' | 'auto';
  suggested_actions: Array<{
    tool: string;
    params: Record<string, any>;
    goal: string;
  }>;
  required_capabilities: string[];  // APIs/skills needed
  dependency_ids: string[];         // Must be true first
  risk_level: 'none' | 'low' | 'medium' | 'high';
}

// 18) Alignment & Ethics (5 dimensions)
export interface AlignmentDimensions {
  harm_likelihood: number;        // Potential for harm
  benefit_likelihood: number;     // Potential for benefit
  stakeholder_map: Array<{
    party: string;
    impact: number;               // +/- magnitude
    magnitude: number;
  }>;
  value_axes: string[];           // autonomy, justice, care, etc.
  compliance_flags: string[];     // Policy/regulatory tags
}

// 19) Meta, Navigation & Wormholes (5 dimensions)
export interface MetaDimensions {
  self_reference: boolean;        // Talks about itself/text
  meta_level: 'object' | 'process' | 'reflection' | 'critique';
  attention_hooks: string[];      // Salient anchors/IDs
  transformation_potential: number; // Likelihood to change state/mind
  wormhole_ports: Array<{
    to_uid: string;
    condition: string;
    reason: string;
  }>;
}

// 20) Kernel Orchestration (Variable Shielding) (5 dimensions)
export interface KernelDimensions {
  kernel_profile: string;         // Named query/behavior profile
  required_dimensions: string[];  // Lenses that must load
  forbidden_dimensions: string[]; // Lenses to ignore
  dynamic_vars: Record<string, any>; // Runtime-bound variables
  shielding_policy: 'strict' | 'smart' | 'open'; // How aggressively to prune
}

// ============================================================================
// COMPLETE MEMORY ATOM (100 dimensions organized in 20 clusters)
// ============================================================================

export interface MemoryAtom {
  // Core 100 dimensions
  identity: IdentityDimensions;
  chunking: ChunkingDimensions;
  structural: StructuralDimensions;
  semantic: SemanticDimensions;
  embedding: EmbeddingDimensions;
  entity: EntityDimensions;
  relation: RelationDimensions;
  causality: CausalityDimensions;
  temporal: TemporalDimensions;
  spatial: SpatialDimensions;
  pragmatics: PragmaticsDimensions;
  sentiment: SentimentDimensions;
  epistemic: EpistemicDimensions;
  rhetorical: RhetoricalDimensions;
  aesthetic: AestheticDimensions;
  computational: ComputationalDimensions;
  actionability: ActionabilityDimensions;
  alignment: AlignmentDimensions;
  meta: MetaDimensions;
  kernel: KernelDimensions;

  // Computed properties
  activation_score?: number;      // How relevant to current query
  spin_alignment?: number;        // Alignment with query spin vector
}

// ============================================================================
// SUPERARRAY MEMORY STORE
// ============================================================================

export class SuperarrayMemory {
  private atoms: Map<string, MemoryAtom> = new Map();
  private dimensionIndex: Map<string, Set<string>> = new Map();

  // Store a memory atom
  store(atom: MemoryAtom): void {
    this.atoms.set(atom.identity.uid, atom);
    this.indexAtom(atom);
  }

  // Retrieve by UID
  get(uid: string): MemoryAtom | undefined {
    return this.atoms.get(uid);
  }

  // Query by dimension activation
  query(activeDimensions: string[], threshold: number = 0.7): MemoryAtom[] {
    const candidates = new Set<string>();

    // Find atoms that match active dimensions
    for (const dim of activeDimensions) {
      const atomIds = this.dimensionIndex.get(dim);
      if (atomIds) {
        atomIds.forEach(id => candidates.add(id));
      }
    }

    // Score and filter
    const results: MemoryAtom[] = [];
    for (const uid of candidates) {
      const atom = this.atoms.get(uid);
      if (atom && (atom.activation_score ?? 0) >= threshold) {
        results.push(atom);
      }
    }

    return results.sort((a, b) =>
      (b.activation_score ?? 0) - (a.activation_score ?? 0)
    );
  }

  // Navigate through wormhole
  wormhole(from: string, condition?: (atom: MemoryAtom) => boolean): MemoryAtom[] {
    const sourceAtom = this.atoms.get(from);
    if (!sourceAtom) return [];

    const destinations: MemoryAtom[] = [];

    for (const port of sourceAtom.meta.wormhole_ports) {
      const destAtom = this.atoms.get(port.to_uid);
      if (destAtom && (!condition || condition(destAtom))) {
        destinations.push(destAtom);
      }
    }

    return destinations;
  }

  // Index atom by dimensions
  private indexAtom(atom: MemoryAtom): void {
    // Index by semantic tags
    for (const tag of atom.semantic.topic_tags) {
      this.addToIndex(tag, atom.identity.uid);
    }

    // Index by entities
    for (const entity of atom.entity.entities) {
      this.addToIndex(`entity:${entity.type}`, atom.identity.uid);
    }

    // Index by intent
    this.addToIndex(`intent:${atom.pragmatics.intent_type}`, atom.identity.uid);

    // Index by causality
    if (atom.causality.causal_links.length > 0) {
      this.addToIndex('has:causality', atom.identity.uid);
    }

    // Index by actionability
    this.addToIndex(`actionability:${atom.actionability.actionability}`, atom.identity.uid);
  }

  private addToIndex(key: string, uid: string): void {
    if (!this.dimensionIndex.has(key)) {
      this.dimensionIndex.set(key, new Set());
    }
    this.dimensionIndex.get(key)!.add(uid);
  }

  // Get all atoms
  all(): MemoryAtom[] {
    return Array.from(this.atoms.values());
  }

  // Clear all memories
  clear(): void {
    this.atoms.clear();
    this.dimensionIndex.clear();
  }

  // Get statistics
  stats(): {
    totalAtoms: number;
    totalDimensions: number;
    avgWormholes: number;
  } {
    const atoms = Array.from(this.atoms.values());
    const totalWormholes = atoms.reduce(
      (sum, atom) => sum + atom.meta.wormhole_ports.length,
      0
    );

    return {
      totalAtoms: atoms.length,
      totalDimensions: this.dimensionIndex.size,
      avgWormholes: atoms.length > 0 ? totalWormholes / atoms.length : 0,
    };
  }
}

// ============================================================================
// SPIN VECTOR (Direction in 100D space)
// ============================================================================

export interface SpinVector {
  // Each dimension cluster gets a weight
  identity: number;
  chunking: number;
  structural: number;
  semantic: number;
  embedding: number;
  entity: number;
  relation: number;
  causality: number;
  temporal: number;
  spatial: number;
  pragmatics: number;
  sentiment: number;
  epistemic: number;
  rhetorical: number;
  aesthetic: number;
  computational: number;
  actionability: number;
  alignment: number;
  meta: number;
  kernel: number;
}

// Compute spin vector from query
export function computeSpinVector(query: string): SpinVector {
  // Simplified computation - in reality would use embeddings
  const lowerQuery = query.toLowerCase();

  return {
    identity: 0.05,
    chunking: 0.05,
    structural: 0.05,
    semantic: lowerQuery.includes('understand') || lowerQuery.includes('explain') ? 0.3 : 0.1,
    embedding: 0.1,
    entity: lowerQuery.includes('who') || lowerQuery.includes('what') ? 0.2 : 0.05,
    relation: lowerQuery.includes('how') || lowerQuery.includes('why') ? 0.2 : 0.05,
    causality: lowerQuery.includes('because') || lowerQuery.includes('cause') ? 0.3 : 0.05,
    temporal: lowerQuery.includes('when') || lowerQuery.includes('time') ? 0.25 : 0.05,
    spatial: lowerQuery.includes('where') || lowerQuery.includes('location') ? 0.25 : 0.05,
    pragmatics: 0.15,
    sentiment: lowerQuery.includes('feel') || lowerQuery.includes('emotion') ? 0.2 : 0.05,
    epistemic: lowerQuery.includes('certain') || lowerQuery.includes('believe') ? 0.2 : 0.05,
    rhetorical: lowerQuery.includes('argue') || lowerQuery.includes('convince') ? 0.2 : 0.05,
    aesthetic: lowerQuery.includes('beautiful') || lowerQuery.includes('elegant') ? 0.15 : 0.05,
    computational: lowerQuery.includes('complex') || lowerQuery.includes('algorithm') ? 0.2 : 0.05,
    actionability: lowerQuery.includes('do') || lowerQuery.includes('action') ? 0.3 : 0.1,
    alignment: lowerQuery.includes('ethic') || lowerQuery.includes('moral') ? 0.25 : 0.05,
    meta: lowerQuery.includes('about') || lowerQuery.includes('itself') ? 0.2 : 0.05,
    kernel: 0.1,
  };
}
