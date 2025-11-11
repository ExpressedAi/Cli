/**
 * Advanced CLI Interface
 * Handles command parsing, mode selection, and user interaction
 */

import { DevMasterConfig, CLIMode } from "./types/index.js";
import { UI } from "./utils/ui.js";

export class CLI {
  private config: DevMasterConfig;

  constructor() {
    this.config = {
      mode: "chat",
      verbose: false,
      output: "text",
    };
  }

  parse(args: string[]): DevMasterConfig {
    let prompt = "";
    let i = 0;

    while (i < args.length) {
      const arg = args[i]!;

      switch (arg) {
        case "--mode":
        case "-m":
          this.config.mode = args[++i] as CLIMode;
          break;

        case "--model":
          this.config.model = args[++i] as any;
          break;

        case "--permission-mode":
        case "-p":
          this.config.permissionMode = args[++i] as any;
          break;

        case "--verbose":
        case "-v":
          this.config.verbose = true;
          process.env.VERBOSE = "true";
          break;

        case "--output":
        case "-o":
          this.config.output = args[++i] as any;
          break;

        case "--session":
        case "-s":
          this.config.sessionId = args[++i];
          break;

        case "--fork":
        case "-f":
          this.config.fork = true;
          break;

        case "--max-turns":
          this.config.maxTurns = parseInt(args[++i]!);
          break;

        case "--help":
        case "-h":
          this.showHelp();
          process.exit(0);

        case "--version":
          this.showVersion();
          process.exit(0);

        default:
          // Accumulate prompt
          prompt += (prompt ? " " : "") + arg;
      }

      i++;
    }

    // If no prompt provided, use mode-specific default
    if (!prompt) {
      prompt = this.getDefaultPrompt(this.config.mode);
    }

    return { ...this.config, prompt } as any;
  }

  private getDefaultPrompt(mode: CLIMode): string {
    const prompts: Record<CLIMode, string> = {
      chat: "I'm ready to help! What would you like to work on?",
      analyze: "Analyze the codebase and provide insights about structure, quality, and potential improvements.",
      review: "Review the recent changes and provide comprehensive feedback on code quality, security, and best practices.",
      refactor: "Identify areas for refactoring and suggest improvements to code structure and maintainability.",
      plan: "Help me plan the implementation of a new feature or project.",
      test: "Generate comprehensive tests for the codebase and identify gaps in test coverage.",
      debug: "Help me debug and fix issues in the code.",
    };

    return prompts[mode];
  }

  showHelp(): void {
    UI.header("DevMaster CLI - AAA-grade Development Assistant");

    console.log(`
${UI.bold("USAGE:")}
  devmaster [OPTIONS] [PROMPT]

${UI.bold("MODES:")}
  --mode, -m <mode>       Operation mode
    chat                  Interactive conversation (default)
    analyze               Code analysis and insights
    review                Code review with feedback
    refactor              Refactoring suggestions
    plan                  Project planning and architecture
    test                  Test generation and coverage
    debug                 Debugging and error analysis

${UI.bold("OPTIONS:")}
  --model <model>         AI model to use (sonnet|opus|haiku)
  --permission-mode, -p   Permission mode (default|acceptEdits|bypassPermissions|plan)
  --verbose, -v           Enable verbose logging
  --output, -o <format>   Output format (text|json|markdown)
  --session, -s <id>      Resume existing session
  --fork, -f              Fork session instead of continuing
  --max-turns <n>         Maximum conversation turns
  --help, -h              Show this help message
  --version               Show version information

${UI.bold("MCP SERVERS:")}
  • filesystem            Advanced file operations and analysis
  • git                   Smart git operations and history
  • code-analysis         Code quality and complexity metrics
  • dev-workflow          Testing, debugging, and scaffolding

${UI.bold("SPECIALIZED AGENTS:")}
  • architect 🏗️          System design and architecture
  • reviewer 🔍           Comprehensive code review
  • refactor ♻️          Code improvement and cleanup
  • tester 🧪             Test generation and QA
  • debug 🐛              Bug investigation and fixes
  • planner 📋            Task breakdown and planning
  • docs 📚              Documentation generation
  • optimizer ⚡          Performance optimization

${UI.bold("EXAMPLES:")}
  ${UI.dim("# Interactive chat")}
  devmaster

  ${UI.dim("# Analyze codebase")}
  devmaster --mode analyze

  ${UI.dim("# Review with auto-approve edits")}
  devmaster --mode review -p acceptEdits

  ${UI.dim("# Generate tests for specific file")}
  devmaster --mode test "Generate tests for src/utils/parser.ts"

  ${UI.dim("# Debug with verbose logging")}
  devmaster --mode debug -v "Why is the login failing?"

  ${UI.dim("# Plan new feature")}
  devmaster --mode plan "Plan implementation of user authentication"

${UI.bold("ENVIRONMENT VARIABLES:")}
  ANTHROPIC_API_KEY       API key for Claude (required)
  VERBOSE                 Enable verbose output
  AUTO_BACKUP             Automatically backup modified files

${UI.bold("MORE INFO:")}
  Documentation: https://github.com/your-org/devmaster
  Issues: https://github.com/your-org/devmaster/issues
`);
  }

  showVersion(): void {
    console.log("DevMaster CLI v1.0.0");
    console.log("Powered by Claude Agent SDK");
  }

  showBanner(): void {
    if (this.config.output === "text") {
      const banner = `
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   ${UI.color("DevMaster CLI", "cyan")}  ${UI.dim("v1.0.0")}                              ║
║   ${UI.dim("AAA-grade Development Assistant")}                     ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
`;
      console.log(banner);

      // Show mode-specific info
      const modeInfo: Record<CLIMode, string> = {
        chat: "💬 Interactive mode - Ask me anything!",
        analyze: "🔬 Analysis mode - Deep code insights",
        review: "🔍 Review mode - Comprehensive feedback",
        refactor: "♻️  Refactor mode - Code improvement",
        plan: "📋 Planning mode - Strategic design",
        test: "🧪 Testing mode - Quality assurance",
        debug: "🐛 Debug mode - Issue resolution",
      };

      UI.info(modeInfo[this.config.mode]);
      UI.divider();
    }
  }

  validateConfig(): void {
    // Validate API key
    if (!process.env.ANTHROPIC_API_KEY) {
      UI.error("ANTHROPIC_API_KEY environment variable is not set");
      UI.info("Please set your API key: export ANTHROPIC_API_KEY=your_key_here");
      process.exit(1);
    }

    // Validate mode
    const validModes: CLIMode[] = ["chat", "analyze", "review", "refactor", "plan", "test", "debug"];
    if (!validModes.includes(this.config.mode)) {
      UI.error(`Invalid mode: ${this.config.mode}`);
      UI.info(`Valid modes: ${validModes.join(", ")}`);
      process.exit(1);
    }

    // Validate model if specified
    if (this.config.model) {
      const validModels = ["sonnet", "opus", "haiku"];
      if (!validModels.includes(this.config.model)) {
        UI.error(`Invalid model: ${this.config.model}`);
        UI.info(`Valid models: ${validModels.join(", ")}`);
        process.exit(1);
      }
    }
  }

  getConfig(): DevMasterConfig {
    return this.config;
  }
}

// Export helper to create CLI instance
export function createCLI(): CLI {
  return new CLI();
}
