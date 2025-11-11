/**
 * Quantum Orchestrator
 * Master integration layer for the Quantum Cognitive OS
 */

import { SuperarrayMemory, MemoryAtom, SpinVector, computeSpinVector } from "./superarray.js";
import { VariableBarrierController, TickPhase, DeltaSet } from "./vbc.js";
import { NeuronNetwork, CognitiveOperation } from "./neurons.js";
import { COPLLearner, COPLGraph } from "./copl.js";
import { PPQEngine, PPQReport, PPQContext } from "./ppq.js";
import { PreflectionEngine, PreflectionResult } from "./preflection.js";
import { OSAEngine } from "./osa.js";
import { MomentumEngine, MomentumPhase, PhaseInput } from "./momentum.js";
import { WormholeNetwork, NavigationStrategy } from "./wormhole.js";

// ============================================================================
// QUANTUM REQUEST
// ============================================================================

export interface QuantumRequest {
  id: string;
  query: string;
  context?: RequestContext;
  options?: RequestOptions;
}

export interface RequestContext {
  sessionId?: string;
  userId?: string;
  previousRequests?: string[];
  environmentVars?: Record<string, any>;
  timeConstraint?: {
    start: Date;
    end: Date;
  };
}

export interface RequestOptions {
  useMomentum?: boolean;          // Enable Momentum Recursion
  useWormholes?: boolean;          // Enable wormhole navigation
  useCOPL?: boolean;               // Enable COPL learning
  useOSA?: boolean;                // Enable OSA script execution
  preflectionProfile?: string;     // Specific Preflection profile
  vbcPhase?: TickPhase;            // Force specific VBC phase
  navigationStrategy?: NavigationStrategy;
  maxMemoryDepth?: number;
  introspectionDepth?: number;     // PPQ recursion depth
}

// ============================================================================
// QUANTUM RESPONSE
// ============================================================================

export interface QuantumResponse {
  id: string;
  requestId: string;
  response: string;
  confidence: number;

  // System insights
  preflection?: PreflectionResult;
  memoryAtoms?: MemoryAtom[];
  neuronsActivated?: string[];
  vbcPhase?: TickPhase;
  coplPatterns?: string[];
  ppqReport?: PPQReport;
  momentumPhases?: MomentumPhase[];
  wormholesPaths?: string[][];
  osaExecutions?: number;

  // Metadata
  processingTime: number;
  tokensUsed?: number;
  timestamp: Date;
}

// ============================================================================
// QUANTUM ORCHESTRATOR
// ============================================================================

export class QuantumOrchestrator {
  private memory: SuperarrayMemory;
  private vbc: VariableBarrierController;
  private neurons: NeuronNetwork;
  private coplLearner: COPLLearner;
  private ppqEngine: PPQEngine;
  private preflectionEngine: PreflectionEngine;
  private osaEngine: OSAEngine;
  private momentumEngine: MomentumEngine;
  private wormholeNetwork: WormholeNetwork;

  private requestHistory: Map<string, QuantumRequest> = new Map();
  private responseHistory: Map<string, QuantumResponse> = new Map();

  constructor() {
    // Initialize all quantum systems
    this.memory = new SuperarrayMemory();
    this.vbc = new VariableBarrierController();
    this.neurons = new NeuronNetwork(this.memory);
    this.coplLearner = new COPLLearner();
    this.ppqEngine = new PPQEngine();
    this.preflectionEngine = new PreflectionEngine();
    this.osaEngine = new OSAEngine();
    this.momentumEngine = new MomentumEngine(
      this.coplLearner,
      this.ppqEngine,
      this.preflectionEngine
    );
    this.wormholeNetwork = new WormholeNetwork(this.memory, true);
  }

  // ========================================================================
  // MAIN ORCHESTRATION
  // ========================================================================

  async process(request: QuantumRequest): Promise<QuantumResponse> {
    const startTime = Date.now();

    // Store request
    this.requestHistory.set(request.id, request);

    // Step 1: Preflection - Analyze query and configure inference
    const preflection = this.preflectionEngine.preflect(request.query, {
      recentMemories: this.getRecentMemories(),
      userPreferences: request.context?.environmentVars?.preferences as string,
    });

    // Step 2: Set VBC phase based on Preflection or request options
    const vbcPhase = request.options?.vbcPhase || preflection.vbcPhase;
    this.vbc.tick(vbcPhase);

    // Step 3: Compute spin vector and set it in VBC
    const spinVector = computeSpinVector(request.query);
    this.vbc.setSpin(spinVector);

    // Step 4: Retrieve relevant memories using wormhole navigation
    let memoryAtoms: MemoryAtom[] = [];
    let wormholePaths: string[][] = [];

    if (request.options?.useWormholes !== false) {
      const navigationResult = this.navigateMemory(
        spinVector,
        request.options?.navigationStrategy || 'guided',
        preflection.memoryDepth
      );

      memoryAtoms = navigationResult.atoms;
      wormholePaths = navigationResult.paths;
    } else {
      // Fallback to direct query
      memoryAtoms = this.memory.query(
        preflection.dimensionFocus,
        0.7
      ).slice(0, preflection.memoryDepth);
    }

    // Step 5: Select and activate neurons
    const neuronsActivated = this.selectAndActivateNeurons(
      preflection,
      memoryAtoms,
      request
    );

    // Step 6: Execute with Momentum Recursion if enabled
    let response: string;
    let momentumPhases: MomentumPhase[] = [];
    let coplPatterns: string[] = [];

    if (request.options?.useMomentum) {
      const momentumResult = await this.executeMomentum(
        request,
        preflection,
        memoryAtoms
      );
      response = this.synthesizeResponseFromMomentum(momentumResult);
      momentumPhases = momentumResult.phases.map(p => p.phase);
    } else {
      response = await this.executeDirectProcessing(
        request,
        preflection,
        memoryAtoms,
        neuronsActivated
      );
    }

    // Step 7: COPL Learning - Record this execution
    if (request.options?.useCOPL !== false) {
      coplPatterns = this.recordCOPLExecution(
        neuronsActivated,
        true, // Assume success for now
        Date.now() - startTime
      );
    }

    // Step 8: PPQ Introspection - Interrogate the response
    const ppqContext: PPQContext = {
      inputQuery: request.query,
      dimensionActivation: this.computeDimensionActivation(preflection, memoryAtoms),
      spinVector,
      coplPatterns,
      vbcBudgetUsed: this.vbc.getCurrentLoads(),
      vbcPhase,
      memoryAtoms: memoryAtoms.map(a => a.identity.uid),
    };

    const ppqReport = await this.ppqEngine.interrogate(
      `response_${request.id}`,
      response,
      ppqContext
    );

    // Step 9: Compute confidence
    const confidence = this.computeOverallConfidence(
      preflection,
      ppqReport,
      memoryAtoms.length
    );

    // Step 10: Build response
    const quantumResponse: QuantumResponse = {
      id: `qr_${Date.now()}`,
      requestId: request.id,
      response,
      confidence,
      preflection,
      memoryAtoms,
      neuronsActivated,
      vbcPhase,
      coplPatterns,
      ppqReport,
      momentumPhases: momentumPhases.length > 0 ? momentumPhases : undefined,
      wormholesPaths: wormholePaths.length > 0 ? wormholePaths : undefined,
      osaExecutions: this.osaEngine.getStats().totalExecutions,
      processingTime: Date.now() - startTime,
      timestamp: new Date(),
    };

    // Store response
    this.responseHistory.set(quantumResponse.id, quantumResponse);

    // Store this interaction as a memory atom
    this.storeInteractionAsMemory(request, quantumResponse);

    return quantumResponse;
  }

  // ========================================================================
  // MEMORY NAVIGATION
  // ========================================================================

  private navigateMemory(
    spinVector: SpinVector,
    strategy: NavigationStrategy,
    maxDepth: number
  ): { atoms: MemoryAtom[]; paths: string[][] } {
    const allAtoms = this.memory.all();

    if (allAtoms.length === 0) {
      return { atoms: [], paths: [] };
    }

    // Find atoms aligned with spin
    const alignedAtoms = allAtoms
      .map(atom => {
        // Compute alignment score
        let alignmentScore = 0;
        let count = 0;

        // Sample spin alignment calculation
        if (spinVector.semantic > 0.5) alignmentScore += 0.2;
        if (spinVector.actionability > 0.5) alignmentScore += 0.2;
        if (spinVector.relation > 0.5) alignmentScore += 0.2;

        return { atom, score: alignmentScore };
      })
      .sort((a, b) => b.score - a.score);

    const startAtom = alignedAtoms[0]?.atom;

    if (!startAtom) {
      return { atoms: [], paths: [] };
    }

    // Navigate using wormholes
    const navResult = this.wormholeNetwork.navigate(
      startAtom.identity.uid,
      strategy,
      {
        spinVector,
        maxDepth,
        maxSteps: maxDepth * 2,
      }
    );

    const paths = [navResult.path.map(a => a.identity.uid)];

    return {
      atoms: navResult.path.slice(0, maxDepth),
      paths,
    };
  }

  // ========================================================================
  // NEURON SELECTION & ACTIVATION
  // ========================================================================

  private selectAndActivateNeurons(
    preflection: PreflectionResult,
    memoryAtoms: MemoryAtom[],
    request: QuantumRequest
  ): string[] {
    const activated: string[] = [];

    // Build neuron context
    const neuronContext = {
      query: request.query,
      relevantMemories: memoryAtoms,
      vbcKernel: this.vbc['kernel'], // Access private field
      phase: this.vbc.getStatus().phase,
      spin: this.vbc.getSpin(),
    };

    // Always activate Orchestrator
    const orchestrator = this.neurons.findByOperation('Harmonize')[0];
    if (orchestrator) {
      orchestrator.activate(neuronContext);
      activated.push(orchestrator.getInfo().id);
    }

    // Select based on query type
    const operations: CognitiveOperation[] = [];

    switch (preflection.analysis.queryType) {
      case 'factual':
        operations.push('Recall', 'Evaluate', 'Integrate');
        break;

      case 'analytical':
        operations.push('Discriminate', 'Evaluate', 'Compare', 'Integrate');
        break;

      case 'creative':
        operations.push('Innovate', 'Propose', 'Manifest');
        break;

      case 'procedural':
        operations.push('Propose', 'Execute', 'Evaluate');
        break;

      case 'troubleshooting':
        operations.push('Interpret', 'Evaluate', 'Resonate', 'Transform');
        break;

      default:
        operations.push('Interpret', 'Evaluate', 'Integrate');
    }

    // Activate neurons
    for (const op of operations) {
      const neurons = this.neurons.findByOperation(op);
      for (const neuron of neurons) {
        neuron.activate(neuronContext);
        activated.push(neuron.getInfo().id);
      }
    }

    return activated;
  }

  // ========================================================================
  // MOMENTUM EXECUTION
  // ========================================================================

  private async executeMomentum(
    request: QuantumRequest,
    preflection: PreflectionResult,
    memoryAtoms: MemoryAtom[]
  ) {
    const phaseInput: PhaseInput = {
      task: request.query,
      components: this.extractComponents(request, memoryAtoms),
      context: {
        preflection,
        memoryAtoms,
      },
    };

    return await this.momentumEngine.execute(phaseInput);
  }

  private extractComponents(request: QuantumRequest, atoms: MemoryAtom[]): string[] {
    const components: string[] = [];

    // Extract from query
    const words = request.query.split(/\s+/).filter(w => w.length > 4);
    components.push(...words.slice(0, 5));

    // Extract from memory atoms
    for (const atom of atoms.slice(0, 3)) {
      components.push(...atom.semantic.topic_tags.slice(0, 2));
    }

    return [...new Set(components)]; // Deduplicate
  }

  private synthesizeResponseFromMomentum(momentumResult: any): string {
    const outputs: string[] = [];

    for (const phase of momentumResult.phases) {
      outputs.push(...phase.outputs);
    }

    return outputs.join('\n');
  }

  // ========================================================================
  // DIRECT PROCESSING
  // ========================================================================

  private async executeDirectProcessing(
    request: QuantumRequest,
    preflection: PreflectionResult,
    memoryAtoms: MemoryAtom[],
    neuronsActivated: string[]
  ): Promise<string> {
    // Synthesize response from activated neurons and memory
    const parts: string[] = [];

    parts.push(`Processing query: "${request.query}"`);
    parts.push(`Query type: ${preflection.analysis.queryType}`);
    parts.push(`Activated ${neuronsActivated.length} neurons`);
    parts.push(`Retrieved ${memoryAtoms.length} memory atoms`);

    // Simulate neuron processing
    for (const neuronId of neuronsActivated.slice(0, 3)) {
      const neuron = this.neurons.get(neuronId);
      if (neuron) {
        const info = neuron.getInfo();
        parts.push(`${info.name}: Processing with operations [${info.operations.join(', ')}]`);
      }
    }

    return parts.join('\n\n');
  }

  // ========================================================================
  // COPL LEARNING
  // ========================================================================

  private recordCOPLExecution(
    components: string[],
    success: boolean,
    duration: number
  ): string[] {
    this.coplLearner.recordTask({
      id: `task_${Date.now()}`,
      components,
      success,
      duration,
      timestamp: new Date(),
    });

    const patterns = this.coplLearner.getGraph().getTopPatterns(5);
    return patterns.map(p => `${p.nodeA}::${p.nodeB}::${p.ratio}`);
  }

  // ========================================================================
  // UTILITIES
  // ========================================================================

  private computeDimensionActivation(
    preflection: PreflectionResult,
    memoryAtoms: MemoryAtom[]
  ): Record<string, number> {
    const activation: Record<string, number> = {};

    // From Preflection
    for (const dim of preflection.dimensionFocus) {
      activation[dim] = 0.8;
    }

    // From memory atoms (simplified)
    for (const atom of memoryAtoms) {
      for (const tag of atom.semantic.topic_tags) {
        activation[tag] = (activation[tag] || 0) + 0.1;
      }
    }

    // Normalize
    const max = Math.max(...Object.values(activation));
    if (max > 0) {
      for (const key in activation) {
        if (activation[key] !== undefined) {
          activation[key] /= max;
        }
      }
    }

    return activation;
  }

  private computeOverallConfidence(
    preflection: PreflectionResult,
    ppqReport: PPQReport,
    memoryCount: number
  ): number {
    // Weighted average of various confidence signals
    const weights = {
      preflection: 0.3,
      ppq: 0.4,
      memory: 0.3,
    };

    const preflectionConfidence = 1 - preflection.analysis.complexity * 0.3;
    const ppqConfidence = ppqReport.overallScore;
    const memoryConfidence = Math.min(1, memoryCount / 10);

    return (
      preflectionConfidence * weights.preflection +
      ppqConfidence * weights.ppq +
      memoryConfidence * weights.memory
    );
  }

  private getRecentMemories(): string[] {
    const atoms = this.memory.all();
    return atoms
      .sort((a, b) => b.identity.created_at.getTime() - a.identity.created_at.getTime())
      .slice(0, 5)
      .map(a => a.semantic.topic_tags.join(', '));
  }

  private storeInteractionAsMemory(
    request: QuantumRequest,
    response: QuantumResponse
  ): void {
    // Create a memory atom for this interaction
    const atom: MemoryAtom = {
      identity: {
        uid: `interaction_${request.id}`,
        source_id: request.context?.sessionId || 'unknown',
        author_id: request.context?.userId || 'user',
        created_at: new Date(),
        version: 1,
      },
      chunking: {
        chunk_id: request.id,
        parent_uid: null,
        chunk_span: [0, request.query.length],
        token_span: [0, request.query.split(/\s+/).length],
        granular_level: 'para',
      },
      structural: {
        syntax_tree_hash: '',
        part_of_speech_seq: [],
        rhetorical_mode: 'question',
        discourse_unit: 'claim',
        narrative_role: 'setup',
      },
      semantic: {
        lemma_bag: request.query.toLowerCase().split(/\s+/),
        topic_tags: response.preflection?.analysis.keywords || [],
        concept_ids: [],
        sense_ids: [],
        semantic_frames: [],
      },
      embedding: {
        text_embedding: [],
        style_embedding: [],
        affect_embedding: [],
        topic_embedding: [],
        multimodal_embedding: [],
      },
      entity: {
        entities: [],
        entity_types: [],
        entity_coref_groups: [],
        entity_salience: {},
        entity_link_conf: {},
      },
      relation: {
        relations: [],
        relation_types: [],
        relation_weight: {},
        relation_confidence: {},
        relation_topology: 'DAG',
      },
      causality: {
        causal_links: [],
        causal_type: 'direct',
        preconditions: [],
        effects: [],
        causal_confidence: response.confidence,
      },
      temporal: {
        time_refs: [],
        time_start: new Date(),
        time_end: null,
        temporal_granularity: 'sec',
        temporal_recurrence: 'none',
      },
      spatial: {
        geo_refs: [],
        spatial_frame: 'abstract',
        orientation: 0,
        scale_category: 'meso',
        region_bounds: null,
      },
      pragmatics: {
        speech_act: 'request',
        intent_type: 'explore',
        directive_force: 0.7,
        audience_role: 'expert',
        politeness_register: 'neutral',
      },
      sentiment: {
        sentiment_polarity: 0,
        affect_labels: [],
        arousal_valence: { arousal: 0.5, valence: 0.5 },
        mood_state: 'focused',
        affect_shift: 0,
      },
      epistemic: {
        certainty: response.confidence,
        knowledge_status: 'hypothesis',
        evidence_type: 'logical',
        hedging_intensity: 1 - response.confidence,
        hypotheticality: 0.3,
      },
      rhetorical: {
        claim_presence: false,
        premise_strength: 0.5,
        warrant_type: 'causal',
        fallacy_flags: [],
        rhetorical_devices: [],
      },
      aesthetic: {
        rhythm_score: 0.5,
        symmetry_score: 0.5,
        contrast_axes: [],
        resonance_score: 0.5,
        beauty_score: 0.5,
      },
      computational: {
        complexity_class: 'linear',
        kolmogorov_estimate: request.query.length,
        entropy_bits: 0,
        compressibility: 0.5,
        novelty_score: 0.5,
      },
      actionability: {
        actionability: 'medium',
        suggested_actions: [],
        required_capabilities: [],
        dependency_ids: [],
        risk_level: 'low',
      },
      alignment: {
        harm_likelihood: 0.1,
        benefit_likelihood: 0.8,
        stakeholder_map: [],
        value_axes: ['autonomy', 'care'],
        compliance_flags: [],
      },
      meta: {
        self_reference: false,
        meta_level: 'object',
        attention_hooks: [],
        transformation_potential: 0.6,
        wormhole_ports: [],
      },
      kernel: {
        kernel_profile: 'default',
        required_dimensions: response.preflection?.dimensionFocus || [],
        forbidden_dimensions: [],
        dynamic_vars: {},
        shielding_policy: 'smart',
      },
      activation_score: 1.0,
      spin_alignment: response.confidence,
    };

    this.memory.store(atom);
  }

  // ========================================================================
  // SYSTEM ACCESS
  // ========================================================================

  getMemory(): SuperarrayMemory {
    return this.memory;
  }

  getVBC(): VariableBarrierController {
    return this.vbc;
  }

  getNeurons(): NeuronNetwork {
    return this.neurons;
  }

  getCOPL(): COPLLearner {
    return this.coplLearner;
  }

  getPPQ(): PPQEngine {
    return this.ppqEngine;
  }

  getPreflection(): PreflectionEngine {
    return this.preflectionEngine;
  }

  getOSA(): OSAEngine {
    return this.osaEngine;
  }

  getMomentum(): MomentumEngine {
    return this.momentumEngine;
  }

  getWormholes(): WormholeNetwork {
    return this.wormholeNetwork;
  }

  // ========================================================================
  // STATISTICS
  // ========================================================================

  getStats(): OrchestratorStats {
    return {
      totalRequests: this.requestHistory.size,
      totalResponses: this.responseHistory.size,
      memoryStats: this.memory.stats(),
      vbcStatus: this.vbc.getStatus(),
      coplStats: this.coplLearner.getGraph().getStats(),
      ppqTrainingData: this.ppqEngine.getTrainingData().length,
      wormholeStats: this.wormholeNetwork.getWormholeStats(),
      osaStats: this.osaEngine.getStats(),
    };
  }
}

// ============================================================================
// TYPES
// ============================================================================

export interface OrchestratorStats {
  totalRequests: number;
  totalResponses: number;
  memoryStats: any;
  vbcStatus: any;
  coplStats: any;
  ppqTrainingData: number;
  wormholeStats: any;
  osaStats: any;
}
