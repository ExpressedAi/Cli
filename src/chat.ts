/**
 * Interactive Chat Mode
 * Conversational interface with Quantum Cognitive OS
 */

import * as readline from 'readline';
import { query } from "@anthropic-ai/claude-agent-sdk";
import { UI } from "./utils/ui.js";
import { StreamHandler } from "./utils/streaming.js";
import { DevMasterConfig } from "./types/index.js";
import { quantumServer } from "./servers/quantum.js";
import { filesystemServer } from "./servers/filesystem.js";
import { gitServer } from "./servers/git.js";
import { codeAnalysisServer } from "./servers/codeAnalysis.js";
import { devWorkflowServer } from "./servers/devWorkflow.js";
import { getAgentDefinitions } from "./agents/index.js";
import { defaultHooks } from "./hooks/index.js";

export class InteractiveChat {
  private rl: readline.Interface;
  private sessionId?: string;
  private config: DevMasterConfig;
  private conversationHistory: Array<{ role: string; content: string }> = [];

  constructor(config: DevMasterConfig) {
    this.config = config;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: UI.color('You> ', 'cyan'),
    });
  }

  async start(): Promise<void> {
    // Show welcome banner
    if (this.config.mode === 'chat') {
      UI.quantumBanner();
    } else {
      UI.header("DevMaster Interactive Mode");
    }

    console.log(`${UI.dim('Type your message and press Enter. Type')} ${UI.color('/exit', 'yellow')} ${UI.dim('or')} ${UI.color('/quit', 'yellow')} ${UI.dim('to exit.')}`);
    console.log(`${UI.dim('Type')} ${UI.color('/menu', 'yellow')} ${UI.dim('to see all quantum commands.')}`);
    console.log(`${UI.dim('Type')} ${UI.color('/help', 'yellow')} ${UI.dim('for help.')}\n`);

    // Set up readline handlers
    this.rl.on('line', async (input: string) => {
      const trimmed = input.trim();

      // Handle special commands
      if (trimmed === '/exit' || trimmed === '/quit') {
        await this.exit();
        return;
      }

      if (trimmed === '/clear') {
        UI.clear();
        this.rl.prompt();
        return;
      }

      if (trimmed === '/help') {
        this.showHelp();
        this.rl.prompt();
        return;
      }

      if (trimmed === '') {
        this.rl.prompt();
        return;
      }

      // Process user input
      await this.processInput(trimmed);
    });

    this.rl.on('close', () => {
      console.log(`\n${UI.dim('Goodbye!')}`);
      process.exit(0);
    });

    // Start prompting
    this.rl.prompt();
  }

  private async processInput(input: string): Promise<void> {
    // Add to conversation history
    this.conversationHistory.push({
      role: 'user',
      content: input,
    });

    // Disable prompt during processing
    this.rl.pause();

    try {
      // Create stream handler
      const streamHandler = new StreamHandler();

      // Build system prompt
      const systemPrompt = this.buildSystemPrompt();

      // Create query
      const stream = query({
        prompt: input,
        options: {
          systemPrompt: {
            type: "preset",
            preset: "claude_code",
            append: systemPrompt,
          },

          model: this.config.model,
          fallbackModel: "haiku",

          permissionMode: this.config.permissionMode as any,

          resume: this.sessionId,
          maxTurns: this.config.maxTurns || 10,

          // All MCP servers including quantum!
          mcpServers: {
            quantum: quantumServer,
            filesystem: filesystemServer,
            git: gitServer,
            "code-analysis": codeAnalysisServer,
            "dev-workflow": devWorkflowServer,
          },

          agents: getAgentDefinitions(),

          hooks: defaultHooks,

          settingSources: ["project"],

          includePartialMessages: true,

          cwd: process.cwd(),
        },
      });

      // Handle stream
      console.log(); // Newline before assistant response

      let assistantResponse = '';

      await streamHandler.handleStream(stream, {
        verbose: this.config.verbose || false,
        onAssistantMessage: (content) => {
          assistantResponse += content;
        },
        onResult: (result) => {
          // Store session ID for continuation
          if (result.session_id) {
            this.sessionId = result.session_id;
          }

          // Show quick stats if verbose
          if (this.config.verbose) {
            console.log();
            UI.dim(`[Tokens: ${result.usage.input_tokens}in/${result.usage.output_tokens}out, Cost: $${result.total_cost_usd.toFixed(4)}, Time: ${(result.duration_ms / 1000).toFixed(1)}s]`);
          }
        },
      });

      // Add assistant response to history
      if (assistantResponse) {
        this.conversationHistory.push({
          role: 'assistant',
          content: assistantResponse,
        });
      }

    } catch (error) {
      UI.error(`Error: ${(error as Error).message}`);
      if (this.config.verbose) {
        console.error(error);
      }
    }

    // Re-enable prompt
    console.log(); // Newline before next prompt
    this.rl.resume();
    this.rl.prompt();
  }

  private buildSystemPrompt(): string {
    const basePrompt = `
You are DevMaster, an advanced AI development assistant powered by the Quantum Cognitive OS.

## Your Capabilities

You have access to powerful quantum features via MCP tools:
- **quantum_process**: Process requests through the full Quantum Cognitive OS
- **activate_neurons**: Activate specialized cognitive agents (15 neurons available)
- **navigate_memory**: Navigate knowledge using wormhole network
- **ppq_introspect**: Deep introspection with 14 analytical lenses
- **quantum_stats**: Get quantum system statistics
- **apply_momentum**: Apply recursive improvement pattern
- **analyze_query**: Preflection analysis for optimal processing
- **store_memory**: Store information in Superarray memory
- **get_learned_patterns**: Retrieve learned COPL patterns

## Quantum Slash Commands

Users can invoke special modes:
- **/quantum**: Use quantum_process for enhanced reasoning
- **/introspect**: Run PPQ introspection
- **/neurons**: Activate specific neurons
- **/stats**: Show quantum statistics
- **/momentum**: Apply Momentum Recursion
- **/wormhole**: Navigate memory

When you see these commands, use the corresponding quantum tools!

## How to Use Quantum Features

For complex tasks:
1. Use quantum_process with appropriate options
2. For security tasks, activate Red/Blue Team neurons
3. For optimization, use Benchmarker + Simulator neurons
4. For architecture, use Strategist + Orchestrator neurons

Show users the quantum insights when appropriate.

## Your Personality

- Helpful and thorough
- Proactive with tools
- Transparent about quantum processing
- Educational and explanatory
`;

    // Add mode-specific guidance
    const modePrompts: Record<string, string> = {
      chat: `\n## Mode: Interactive Chat\nBe conversational and helpful. Use quantum features when they add value.`,
      analyze: `\n## Mode: Analysis\nUse quantum_process and code analysis tools for deep insights.`,
      review: `\n## Mode: Review\nActivate Auditor and Red Teamer neurons. Use PPQ introspection for quality.`,
      refactor: `\n## Mode: Refactor\nUse quantum_process with Forge neuron. Focus on code improvement.`,
      plan: `\n## Mode: Planning\nActivate Strategist and Orchestrator neurons. Use wormhole navigation for patterns.`,
      test: `\n## Mode: Testing\nUse quantum_process with comprehensive test generation.`,
      debug: `\n## Mode: Debug\nActivate Simulator neuron. Use Momentum Recursion for systematic debugging.`,
    };

    return basePrompt + (modePrompts[this.config.mode] || '');
  }

  private showHelp(): void {
    console.log(`
${UI.bold('INTERACTIVE COMMANDS:')}
  ${UI.color('/exit', 'yellow')}, ${UI.color('/quit', 'yellow')}    Exit the chat
  ${UI.color('/clear', 'yellow')}             Clear the screen
  ${UI.color('/help', 'yellow')}              Show this help message
  ${UI.color('/menu', 'yellow')}              Show all quantum commands

${UI.bold('QUANTUM SLASH COMMANDS:')}
  ${UI.color('/quantum', 'cyan')}             Activate Quantum Cognitive OS
  ${UI.color('/introspect', 'cyan')}          Deep PPQ introspection
  ${UI.color('/neurons', 'cyan')}             Show/activate neurons
  ${UI.color('/stats', 'cyan')}               Quantum system statistics
  ${UI.color('/momentum', 'cyan')}            Apply Momentum Recursion
  ${UI.color('/wormhole', 'cyan')}            Navigate memory
  ${UI.color('/architect', 'cyan')}           System design mode
  ${UI.color('/security', 'cyan')}            Security analysis
  ${UI.color('/optimize', 'cyan')}            Performance optimization
  ${UI.color('/refactor', 'cyan')}            Code improvement
  ${UI.color('/debug', 'cyan')}               Advanced debugging
  ${UI.color('/test', 'cyan')}                Test generation
  ${UI.color('/review', 'cyan')}              Code review

${UI.dim('Just type naturally and press Enter to chat!')}
`);
  }

  private async exit(): Promise<void> {
    console.log();

    if (this.conversationHistory.length > 0) {
      UI.success(`Conversation had ${Math.floor(this.conversationHistory.length / 2)} exchanges`);
    }

    if (this.sessionId) {
      UI.info(`Session ID: ${UI.dim(this.sessionId)}`);
    }

    console.log(`\n${UI.color('Thank you for using DevMaster!', 'cyan')}`);
    console.log(`${UI.dim('Powered by Quantum Cognitive OS')}\n`);

    this.rl.close();
  }

  async cleanup(): Promise<void> {
    this.rl.close();
  }
}

// Create and export chat instance creator
export async function startInteractiveChat(config: DevMasterConfig): Promise<void> {
  const chat = new InteractiveChat(config);
  await chat.start();
}
