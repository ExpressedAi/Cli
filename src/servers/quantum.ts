/**
 * Quantum MCP Server
 * Exposes Quantum Cognitive OS features as MCP tools
 */

import { tool, createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { QuantumOrchestrator } from "../quantum/index.js";

// Create singleton orchestrator instance
const orchestrator = new QuantumOrchestrator();

// ============================================================================
// QUANTUM REQUEST PROCESSING
// ============================================================================

const quantumProcessTool = tool(
  "quantum_process",
  "Process a request through the Quantum Cognitive OS with all advanced features (Superarray, VBC, Neurons, COPL, PPQ, Preflection, Wormholes, Momentum)",
  {
    query: z.string().describe("The query to process through quantum systems"),
    use_momentum: z.boolean().optional().describe("Enable Momentum Recursion (Clarifier→Architect→Worker→Auditor)"),
    use_wormholes: z.boolean().optional().describe("Enable wormhole memory navigation"),
    navigation_strategy: z.enum(['guided', 'breadth_first', 'depth_first', 'best_first', 'surprise', 'temporal', 'causal', 'random_walk']).optional().describe("Wormhole navigation strategy"),
  },
  async ({ query, use_momentum, use_wormholes, navigation_strategy }) => {
    const response = await orchestrator.process({
      id: `qr_${Date.now()}`,
      query,
      context: {
        sessionId: `quantum_${Date.now()}`,
        userId: "cli-user",
      },
      options: {
        useMomentum: use_momentum ?? false,
        useWormholes: use_wormholes ?? true,
        useCOPL: true,
        navigationStrategy: navigation_strategy || 'guided',
      },
    });

    const insights = [
      `✨ **Quantum Processing Complete**`,
      ``,
      `**Preflection Analysis:**`,
      `- Query Type: ${response.preflection?.analysis.queryType}`,
      `- Complexity: ${(response.preflection?.analysis.complexity || 0).toFixed(2)}`,
      `- Creativity Required: ${(response.preflection?.analysis.creativityRequired || 0).toFixed(2)}`,
      `- Intent: ${response.preflection?.analysis.intent}`,
      ``,
      `**Neurons Activated:** ${response.neuronsActivated?.length || 0}`,
      response.neuronsActivated && response.neuronsActivated.length > 0 ? `${response.neuronsActivated.join(', ')}` : '',
      ``,
      `**Memory:** Retrieved ${response.memoryAtoms?.length || 0} atoms`,
      `**VBC Phase:** ${response.vbcPhase}`,
      `**COPL Patterns:** ${response.coplPatterns?.length || 0} used`,
      `**PPQ Score:** ${(response.ppqReport?.overallScore || 0).toFixed(2)}`,
      `**Confidence:** ${(response.confidence).toFixed(2)}`,
      `**Processing Time:** ${response.processingTime}ms`,
    ].filter(line => line !== '').join('\n');

    return {
      content: [
        {
          type: "text",
          text: `${response.response}\n\n---\n\n${insights}`,
        },
      ],
    };
  }
);

// ============================================================================
// PPQ INTROSPECTION
// ============================================================================

const ppqIntrospectTool = tool(
  "ppq_introspect",
  "Run Post-Processing Query introspection with 14 analytical lenses (sentiment, bias, provenance, reasoning, etc.)",
  {
    text: z.string().describe("Text to introspect"),
  },
  async ({ text }) => {
    const ppq = orchestrator.getPPQ();
    const report = await ppq.interrogate(`ppq_${Date.now()}`, text, {});

    const topLenses = report.results
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map(r => `- **${r.lens}**: ${r.score.toFixed(2)} - ${r.findings[0] || 'No findings'}`)
      .join('\n');

    const allFlags = report.results
      .flatMap(r => r.flags)
      .filter(f => f.length > 0);

    const flagsText = allFlags.length > 0
      ? `\n\n**⚠️ Flags:**\n${allFlags.map(f => `- ${f}`).join('\n')}`
      : '';

    return {
      content: [
        {
          type: "text",
          text: `**PPQ Introspection Report**\n\n**Overall Score:** ${report.overallScore.toFixed(2)}\n\n**Top Lenses:**\n${topLenses}${flagsText}`,
        },
      ],
    };
  }
);

// ============================================================================
// SYSTEM STATISTICS
// ============================================================================

const quantumStatsTool = tool(
  "quantum_stats",
  "Get comprehensive Quantum Cognitive OS statistics (memory, neurons, VBC, COPL, PPQ, wormholes)",
  {},
  async () => {
    const stats = orchestrator.getStats();

    const lines = [
      `**Quantum System Statistics**`,
      ``,
      `**Session:**`,
      `- Total Requests: ${stats.totalRequests}`,
      `- Total Responses: ${stats.totalResponses}`,
      ``,
      `**Memory:**`,
      `- Total Atoms: ${stats.memoryStats?.totalAtoms || 0}`,
      `- Total Queries: ${stats.memoryStats?.totalQueries || 0}`,
      ``,
      `**VBC:**`,
      `- Current Phase: ${stats.vbcStatus?.phase || 'unknown'}`,
      ``,
      `**COPL Learning:**`,
      `- Total Patterns: ${stats.coplStats?.totalEdges || 0}`,
      `- Avg Score: ${(stats.coplStats?.avgScore || 0).toFixed(2)}`,
      ``,
      `**PPQ Introspection:**`,
      `- Training Data Points: ${stats.ppqTrainingData}`,
      ``,
      `**Wormholes:**`,
      `- Total: ${stats.wormholeStats?.totalWormholes || 0}`,
      `- Traversals: ${stats.wormholeStats?.totalTraversals || 0}`,
    ];

    return {
      content: [
        {
          type: "text",
          text: lines.join('\n'),
        },
      ],
    };
  }
);

// ============================================================================
// ANALYZE QUERY (PREFLECTION)
// ============================================================================

const analyzeQueryTool = tool(
  "analyze_query",
  "Analyze a query using Preflection engine to determine optimal processing strategy and inference parameters",
  {
    query: z.string().describe("Query to analyze"),
  },
  async ({ query }) => {
    const preflection = orchestrator.getPreflection();
    const result = preflection.preflect(query);

    const lines = [
      `**Preflection Analysis**`,
      ``,
      `**Query Analysis:**`,
      `- Type: ${result.analysis.queryType}`,
      `- Complexity: ${result.analysis.complexity.toFixed(2)}`,
      `- Specificity: ${result.analysis.specificity.toFixed(2)}`,
      `- Creativity Required: ${result.analysis.creativityRequired.toFixed(2)}`,
      `- Risk Level: ${result.analysis.riskLevel.toFixed(2)}`,
      `- Intent: ${result.analysis.intent}`,
      `- Keywords: ${result.analysis.keywords.join(', ')}`,
      ``,
      `**Selected Profile:**`,
      `- Name: ${result.profile.name}`,
      `- Description: ${result.profile.description}`,
      ``,
      `**Inference Parameters:**`,
      `- Temperature: ${result.inferenceParams.temperature}`,
      `- Top-P: ${result.inferenceParams.topP}`,
      `- Max Tokens: ${result.inferenceParams.maxTokens}`,
      ``,
      `**VBC Phase:** ${result.vbcPhase}`,
      `**Dimension Focus:** ${result.dimensionFocus.join(', ')}`,
    ];

    return {
      content: [
        {
          type: "text",
          text: lines.join('\n'),
        },
      ],
    };
  }
);

// ============================================================================
// ACTIVATE NEURONS
// ============================================================================

const activateNeuronsTool = tool(
  "activate_neurons",
  "Activate specific neurons for specialized cognitive operations (15 neurons available: Orchestrator, Strategist, Muse, Archivist, etc.)",
  {
    operations: z.array(z.string()).describe("Cognitive operations to perform (e.g., 'Innovate', 'Evaluate', 'Harmonize')"),
    query: z.string().describe("The context or query for neuron activation"),
  },
  async ({ operations, query }) => {
    const neurons = orchestrator.getNeurons();
    const activated: string[] = [];

    for (const operation of operations) {
      const matchingNeurons = neurons.findByOperation(operation as any);
      for (const neuron of matchingNeurons) {
        const info = neuron.getInfo();
        if (!activated.includes(info.name)) {
          activated.push(info.name);
        }
      }
    }

    return {
      content: [
        {
          type: "text",
          text: `**Neurons Activated:** ${activated.length}\n\n${activated.map(n => `- ${n}`).join('\n')}\n\n**Operations:** ${operations.join(', ')}\n\n**Context:** ${query}`,
        },
      ],
    };
  }
);

// ============================================================================
// CREATE AND EXPORT SERVER
// ============================================================================

export const quantumServer = createSdkMcpServer({
  name: "quantum",
  version: "1.0.0",
  tools: [
    quantumProcessTool,
    ppqIntrospectTool,
    quantumStatsTool,
    analyzeQueryTool,
    activateNeuronsTool,
  ],
});
