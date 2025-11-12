/**
 * Quantum CLI Integration
 * Bridges the Quantum Cognitive OS with the DevMaster CLI
 */

import { QuantumOrchestrator, QuantumRequest, QuantumResponse } from "./quantum/index.js";
import { UI } from "./utils/ui.js";

export class QuantumCLI {
  private orchestrator: QuantumOrchestrator;
  private sessionId: string;

  constructor() {
    this.orchestrator = new QuantumOrchestrator();
    this.sessionId = `quantum_${Date.now()}`;
  }

  /**
   * Process a request through the Quantum Cognitive OS
   */
  async processQuantumRequest(
    query: string,
    options?: {
      useMomentum?: boolean;
      useWormholes?: boolean;
      useCOPL?: boolean;
      useOSA?: boolean;
      profile?: string;
      vbcPhase?: any;
      navigationStrategy?: any;
      introspectionDepth?: number;
    }
  ): Promise<QuantumResponse> {
    const request: QuantumRequest = {
      id: `qr_${Date.now()}`,
      query,
      context: {
        sessionId: this.sessionId,
        userId: "cli-user",
        environmentVars: {
          cwd: process.cwd(),
        },
      },
      options: {
        useMomentum: options?.useMomentum ?? false,
        useWormholes: options?.useWormholes ?? true,
        useCOPL: options?.useCOPL ?? true,
        useOSA: options?.useOSA ?? false,
        preflectionProfile: options?.profile,
        vbcPhase: options?.vbcPhase,
        navigationStrategy: options?.navigationStrategy || 'guided',
        introspectionDepth: options?.introspectionDepth || 1,
      },
    };

    return await this.orchestrator.process(request);
  }

  /**
   * Display quantum response with beautiful formatting
   */
  displayQuantumResponse(response: QuantumResponse, showInsights: boolean = true): void {
    // Main response
    UI.header("Quantum Response");
    console.log(response.response);
    console.log();

    if (!showInsights) return;

    // Quantum insights section
    UI.header("Quantum Insights");

    // Preflection analysis
    if (response.preflection) {
      const analysis = response.preflection.analysis;
      UI.section("Preflection Analysis");
      console.log(`  Query Type: ${UI.color(analysis.queryType, 'cyan')}`);
      console.log(`  Complexity: ${this.formatScore(analysis.complexity)}`);
      console.log(`  Creativity Required: ${this.formatScore(analysis.creativityRequired)}`);
      console.log(`  Specificity: ${this.formatScore(analysis.specificity)}`);
      console.log(`  Intent: ${UI.dim(analysis.intent)}`);
      console.log();
    }

    // Neurons activated
    if (response.neuronsActivated && response.neuronsActivated.length > 0) {
      UI.section("Neurons Activated");
      console.log(`  ${response.neuronsActivated.join(', ')}`);
      console.log();
    }

    // Memory atoms
    if (response.memoryAtoms && response.memoryAtoms.length > 0) {
      UI.section("Memory Retrieval");
      console.log(`  Retrieved ${UI.color(response.memoryAtoms.length.toString(), 'green')} memory atoms`);
      console.log();
    }

    // VBC phase
    if (response.vbcPhase) {
      UI.section("VBC Phase");
      console.log(`  Current Phase: ${UI.color(response.vbcPhase, 'yellow')}`);
      console.log();
    }

    // COPL patterns
    if (response.coplPatterns && response.coplPatterns.length > 0) {
      UI.section("COPL Patterns Used");
      response.coplPatterns.forEach(pattern => {
        console.log(`  • ${pattern}`);
      });
      console.log();
    }

    // PPQ report
    if (response.ppqReport) {
      UI.section("PPQ Introspection");
      console.log(`  Overall Score: ${this.formatScore(response.ppqReport.overallScore)}`);

      const topFindings = response.ppqReport.results
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      console.log(`  Top Lens Scores:`);
      topFindings.forEach(result => {
        console.log(`    ${result.lens}: ${this.formatScore(result.score)}`);
      });

      const allFlags = response.ppqReport.results
        .flatMap(r => r.flags)
        .filter(f => f.length > 0);

      if (allFlags.length > 0) {
        console.log(`  ${UI.color('⚠️  Flags:', 'yellow')}`);
        allFlags.forEach(flag => {
          console.log(`    • ${flag}`);
        });
      }
      console.log();
    }

    // Momentum phases
    if (response.momentumPhases && response.momentumPhases.length > 0) {
      UI.section("Momentum Phases");
      console.log(`  Executed: ${response.momentumPhases.join(' → ')}`);
      console.log();
    }

    // Wormhole paths
    if (response.wormholesPaths && response.wormholesPaths.length > 0) {
      UI.section("Wormhole Navigation");
      console.log(`  Paths explored: ${response.wormholesPaths.length}`);
      console.log();
    }

    // Performance metrics
    UI.section("Performance");
    console.log(`  Processing Time: ${UI.color(response.processingTime + 'ms', 'cyan')}`);
    console.log(`  Confidence: ${this.formatScore(response.confidence)}`);
    console.log();

    UI.divider();
  }

  /**
   * Display quantum system statistics
   */
  displaySystemStats(): void {
    const stats = this.orchestrator.getStats();

    UI.header("Quantum System Statistics");

    // Requests
    UI.section("Session");
    console.log(`  Total Requests: ${stats.totalRequests}`);
    console.log(`  Total Responses: ${stats.totalResponses}`);
    console.log();

    // Memory stats
    if (stats.memoryStats) {
      UI.section("Superarray Memory");
      console.log(`  Total Atoms: ${stats.memoryStats.totalAtoms || 0}`);
      console.log(`  Total Queries: ${stats.memoryStats.totalQueries || 0}`);
      console.log();
    }

    // VBC status
    if (stats.vbcStatus) {
      UI.section("Variable Barrier Controller");
      console.log(`  Current Phase: ${stats.vbcStatus.phase}`);
      console.log(`  Budget Status:`);
      const loads = stats.vbcStatus.loads || {};
      Object.entries(loads).forEach(([axis, load]) => {
        const percentage = ((load as number) * 100).toFixed(0);
        console.log(`    ${axis}: ${this.formatScore(load as number)} (${percentage}%)`);
      });
      console.log();
    }

    // COPL stats
    if (stats.coplStats) {
      UI.section("COPL Learning");
      console.log(`  Total Edges: ${stats.coplStats.totalEdges || 0}`);
      console.log(`  Avg Score: ${this.formatScore(stats.coplStats.avgScore || 0)}`);
      console.log();
    }

    // PPQ training data
    UI.section("PPQ Introspection");
    console.log(`  Training Data Points: ${stats.ppqTrainingData}`);
    console.log();

    // Wormhole stats
    if (stats.wormholeStats) {
      UI.section("Wormhole Network");
      console.log(`  Total Wormholes: ${stats.wormholeStats.totalWormholes}`);
      console.log(`  Total Traversals: ${stats.wormholeStats.totalTraversals}`);
      console.log(`  Avg Traversals/Wormhole: ${stats.wormholeStats.avgTraversalsPerWormhole.toFixed(2)}`);

      if (stats.wormholeStats.typeDistribution) {
        console.log(`  Type Distribution:`);
        Object.entries(stats.wormholeStats.typeDistribution).forEach(([type, count]) => {
          console.log(`    ${type}: ${count}`);
        });
      }
      console.log();
    }

    // OSA stats
    if (stats.osaStats) {
      UI.section("OSA Integration");
      console.log(`  Total Executions: ${stats.osaStats.totalExecutions}`);
      console.log(`  Successful: ${stats.osaStats.successful}`);
      console.log(`  Failed: ${stats.osaStats.failed}`);
      console.log(`  Success Rate: ${(stats.osaStats.successRate * 100).toFixed(1)}%`);
      console.log();
    }

    UI.divider();
  }

  /**
   * Format a score (0-1) with color coding
   */
  private formatScore(score: number): string {
    const percentage = (score * 100).toFixed(0);
    let color: 'green' | 'yellow' | 'red' = 'green';

    if (score < 0.5) color = 'red';
    else if (score < 0.75) color = 'yellow';

    return UI.color(`${score.toFixed(2)} (${percentage}%)`, color);
  }

  /**
   * Get the underlying orchestrator for advanced operations
   */
  getOrchestrator(): QuantumOrchestrator {
    return this.orchestrator;
  }

  /**
   * Export quantum system state for persistence
   */
  exportState(): any {
    return {
      sessionId: this.sessionId,
      stats: this.orchestrator.getStats(),
      trainingData: this.orchestrator.getPPQ().getTrainingData(),
    };
  }

  /**
   * Show available quantum modes and features
   */
  showQuantumHelp(): void {
    UI.header("Quantum Cognitive OS - Available Features");

    console.log(`
${UI.bold("QUANTUM MODES:")}
  --quantum-mode <mode>    Activate quantum processing
    full                   Use all quantum systems (default)
    momentum               Enable Momentum Recursion
    introspect             Deep PPQ introspection
    wormhole               Wormhole navigation focus
    learn                  Emphasize COPL learning

${UI.bold("QUANTUM OPTIONS:")}
  --use-momentum           Apply Momentum Recursion pattern
  --use-wormholes          Enable wormhole navigation (default: true)
  --use-copl               Enable COPL learning (default: true)
  --use-osa                Enable Mac OSA scripts
  --preflection-profile    Choose profile (balanced|precise|creative|analytical|action|exploration)
  --vbc-phase              Force VBC phase (capture|clean|bridge|commit)
  --navigation-strategy    Wormhole strategy (guided|breadth|depth|best|surprise|temporal|causal|random)
  --introspection-depth    PPQ recursion depth (1-3)

${UI.bold("QUANTUM COMMANDS:")}
  /quantum                 Activate Quantum Cognitive OS
  /introspect              Deep introspection of last response
  /wormhole                Navigate memory with wormholes
  /momentum                Apply Momentum Recursion
  /neurons                 Show/activate specific neurons
  /stats                   Show quantum system statistics
  /menu                    Show all available commands

${UI.bold("SPECIALIZED COMMANDS:")}
  /architect               Quantum-powered system design
  /security                Red Team + Blue Team analysis
  /optimize                Performance optimization
  /refactor                Code improvement
  /debug                   Advanced debugging
  /test                    Test generation
  /review                  Code review

${UI.bold("EXAMPLES:")}
  ${UI.dim("# Full quantum processing with momentum")}
  devmaster --quantum-mode full --use-momentum "Design a caching system"

  ${UI.dim("# Introspect with creative profile")}
  devmaster --quantum-mode introspect --preflection-profile creative

  ${UI.dim("# Wormhole navigation with surprise strategy")}
  devmaster --quantum-mode wormhole --navigation-strategy surprise

  ${UI.dim("# Use quantum command directly")}
  /quantum Design a distributed task queue

${UI.dim("The Quantum Cognitive OS integrates 10 advanced AI systems for unprecedented")}
${UI.dim("context engineering, memory navigation, and recursive improvement.")}
`);
  }
}
