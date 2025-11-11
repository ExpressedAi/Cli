/**
 * DevMaster CLI - Main Entry Point
 * AAA-grade development assistant powered by Claude SDK
 */

import { query } from "@anthropic-ai/claude-agent-sdk";
import { createCLI } from "./cli.js";
import { UI } from "./utils/ui.js";
import { StreamHandler, formatStats } from "./utils/streaming.js";
import { PermissionManager } from "./utils/permissions.js";
import { getAgentDefinitions } from "./agents/index.js";
import { defaultHooks } from "./hooks/index.js";

// Import MCP servers
import { filesystemServer } from "./servers/filesystem.js";
import { gitServer } from "./servers/git.js";
import { codeAnalysisServer } from "./servers/codeAnalysis.js";
import { devWorkflowServer } from "./servers/devWorkflow.js";

async function main() {
  try {
    // Parse CLI arguments
    const cli = createCLI();
    const config = cli.parse(process.argv.slice(2));

    // Validate configuration
    cli.validateConfig();

    // Show banner
    cli.showBanner();

    // Get prompt from config
    const prompt = (config as any).prompt || "Hello! How can I help you today?";

    // Setup permission manager based on mode
    let permissionMode = config.permissionMode || "default";
    let canUseTool;

    if (config.mode === "analyze" || config.mode === "review") {
      // Auto-approve read operations in analyze/review modes
      const pm = PermissionManager.createAutoApproveMode();
      canUseTool = pm.createCanUseTool();
    } else if (config.mode === "plan") {
      permissionMode = "plan";
    }

    // Create stream handler
    const streamHandler = new StreamHandler();

    // Start session
    if (config.verbose) {
      UI.info("Initializing DevMaster session...");
      UI.info(`Mode: ${config.mode}`);
      UI.info(`Model: ${config.model || "default"}`);
      UI.info(`Permission mode: ${permissionMode}`);
    }

    // Create query with full configuration
    const stream = query({
      prompt,
      options: {
        // System prompt with mode-specific instructions
        systemPrompt: {
          type: "preset",
          preset: "claude_code",
          append: getModeSpecificPrompt(config.mode),
        },

        // Model configuration
        model: config.model,
        fallbackModel: "haiku",

        // Permission configuration
        permissionMode: permissionMode as any,
        canUseTool,

        // Session configuration
        resume: config.sessionId,
        forkSession: config.fork,
        maxTurns: config.maxTurns,

        // MCP Servers - all our custom servers
        mcpServers: {
          filesystem: filesystemServer,
          git: gitServer,
          "code-analysis": codeAnalysisServer,
          "dev-workflow": devWorkflowServer,
        },

        // Specialized agents
        agents: getAgentDefinitions(),

        // Hooks for monitoring and automation
        hooks: defaultHooks,

        // Settings
        settingSources: ["project"], // Load project-level settings

        // Streaming
        includePartialMessages: true,

        // Working directory
        cwd: process.cwd(),
      },
    });

    // Handle stream based on output format
    if (config.output === "json") {
      await handleJsonOutput(stream);
    } else if (config.output === "markdown") {
      await handleMarkdownOutput(stream);
    } else {
      await handleTextOutput(stream, streamHandler, config.verbose || false);
    }
  } catch (error) {
    UI.error(`Fatal error: ${(error as Error).message}`);
    if (process.env.VERBOSE === "true") {
      console.error(error);
    }
    process.exit(1);
  }
}

// Mode-specific system prompt additions
function getModeSpecificPrompt(mode: string): string {
  const prompts: Record<string, string> = {
    chat: `
You are DevMaster, an expert development assistant with access to powerful tools and specialized agents.
Be helpful, thorough, and proactive in using the available tools and agents.
`,
    analyze: `
You are in ANALYSIS mode. Your task is to deeply analyze the codebase:
- Examine code structure and architecture
- Identify quality issues and technical debt
- Suggest improvements and optimizations
- Use code analysis tools extensively
- Provide actionable insights
`,
    review: `
You are in REVIEW mode. Perform comprehensive code review:
- Check code quality and best practices
- Identify security vulnerabilities
- Evaluate performance implications
- Suggest improvements with examples
- Be constructive and educational
- Use the reviewer agent for deep analysis
`,
    refactor: `
You are in REFACTOR mode. Focus on improving code structure:
- Identify code smells and anti-patterns
- Suggest specific refactorings
- Reduce complexity where possible
- Improve naming and clarity
- Use the refactor agent for systematic improvements
`,
    plan: `
You are in PLANNING mode. Help design and plan implementations:
- Break down complex tasks
- Design system architecture
- Identify dependencies and risks
- Create actionable roadmaps
- Use the architect and planner agents
`,
    test: `
You are in TESTING mode. Focus on quality assurance:
- Generate comprehensive test cases
- Identify gaps in test coverage
- Suggest testing strategies
- Use the tester agent for test generation
- Ensure edge cases are covered
`,
    debug: `
You are in DEBUG mode. Help identify and fix issues:
- Analyze error messages and stack traces
- Trace execution flow
- Identify root causes
- Suggest and implement fixes
- Use the debug agent for investigation
`,
  };

  return prompts[mode] || prompts.chat || "";
}

// Handle text output (default)
async function handleTextOutput(
  stream: AsyncGenerator<any, void>,
  streamHandler: StreamHandler,
  verbose: boolean
) {
  const stats = await streamHandler.handleStream(stream, {
    verbose,
    onResult: (result) => {
      // Show final statistics
      if (result.subtype === "success") {
        UI.divider();
        UI.success("Session completed successfully!");
        const statsObj = {
          turns: result.num_turns,
          totalCost: result.total_cost_usd,
          duration: result.duration_ms,
          inputTokens: result.usage.input_tokens,
          outputTokens: result.usage.output_tokens,
        };
        console.log(`\n${formatStats(statsObj)}\n`);

        if (result.permission_denials && result.permission_denials.length > 0) {
          UI.warning(`Permission denials: ${result.permission_denials.length}`);
        }
      } else {
        UI.warning(`Session ended: ${result.subtype}`);
      }
    },
  });
}

// Handle JSON output
async function handleJsonOutput(stream: AsyncGenerator<any, void>) {
  const messages: any[] = [];

  for await (const message of stream) {
    messages.push(message);
  }

  console.log(JSON.stringify(messages, null, 2));
}

// Handle Markdown output
async function handleMarkdownOutput(stream: AsyncGenerator<any, void>) {
  console.log("# DevMaster Session\n");

  for await (const message of stream) {
    switch (message.type) {
      case "assistant":
        const textContent = message.message.content
          ?.filter((c: any) => c.type === "text")
          .map((c: any) => c.text)
          .join("\n");

        if (textContent) {
          console.log(`## Assistant\n\n${textContent}\n`);
        }

        const toolUses = message.message.content?.filter(
          (c: any) => c.type === "tool_use"
        );

        if (toolUses && toolUses.length > 0) {
          console.log("### Tools Used\n");
          toolUses.forEach((tool: any) => {
            console.log(`- **${tool.name}**`);
          });
          console.log();
        }
        break;

      case "result":
        console.log("## Session Summary\n");
        console.log(`- Turns: ${message.num_turns}`);
        console.log(`- Cost: $${message.total_cost_usd.toFixed(4)}`);
        console.log(`- Duration: ${(message.duration_ms / 1000).toFixed(2)}s`);
        console.log();
        break;
    }
  }
}

// Run the CLI
main().catch((error) => {
  UI.error(`Unexpected error: ${error.message}`);
  process.exit(1);
});
