# DevMaster CLI 🚀

> AAA-grade Development Assistant powered by Claude Agent SDK

An advanced CLI tool that leverages the full power of the Claude Agent SDK, featuring multiple MCP servers, specialized AI agents, comprehensive hooks, and intelligent permission management.

## ✨ Features

### 🎯 Multiple Operation Modes
- **Chat**: Interactive conversation mode
- **Analyze**: Deep codebase analysis and insights
- **Review**: Comprehensive code review with feedback
- **Refactor**: Smart code improvement suggestions
- **Plan**: Project planning and architecture design
- **Test**: Intelligent test generation and coverage analysis
- **Debug**: Advanced debugging and error resolution

### 🛠️ Four Powerful MCP Servers

#### 1. FileSystem Server
Advanced file operations beyond basic Read/Write:
- Directory traversal with metadata
- File tree visualization
- Content-based search
- File analysis and statistics
- Bulk operations (rename, move, delete)

#### 2. Git Server
Smart git operations and workflow automation:
- Enhanced status with remote tracking
- Intelligent commit message suggestions
- Branch management (create, switch, compare, delete)
- Commit history analysis and statistics
- Merge conflict detection and resolution assistance

#### 3. Code Analysis Server
Professional code quality metrics:
- Cyclomatic complexity analysis
- Code smell detection
- Dependency graph with circular dependency detection
- Refactoring suggestions with priorities
- Maintainability index calculation

#### 4. Dev Workflow Server
Complete development lifecycle support:
- Automated test generation (unit, integration, e2e)
- Debug strategy suggestions
- Project scaffolding templates
- Performance profiling and optimization hints

### 🤖 Eight Specialized AI Agents

Each agent is an expert in their domain:

- **Architect 🏗️**: System design and architecture planning
- **Reviewer 🔍**: Comprehensive code review specialist
- **Refactor ♻️**: Code improvement and cleanup expert
- **Tester 🧪**: Test generation and QA specialist
- **Debug 🐛**: Bug investigation and resolution expert
- **Planner 📋**: Task breakdown and project planning
- **Docs 📚**: Documentation generation specialist
- **Optimizer ⚡**: Performance optimization expert

### 🪝 Comprehensive Hook System

Real-time monitoring and automation:
- **SessionStart/End**: Session lifecycle management
- **PreToolUse**: Safety validation and permission checks
- **PostToolUse**: Result monitoring and auto-backup
- **Notification**: Custom alerts and messages
- **Performance**: Slow operation detection
- **PreCompact**: Context management

### 🔒 Intelligent Permission Management

Flexible security modes:
- Default: Interactive approval
- Auto-approve: For read operations
- Dev mode: Smart approvals for common operations
- Safe mode: Block dangerous operations
- Custom rules: Define your own patterns

## 🚀 Quick Start

### Installation

```bash
# Clone and install
git clone <repository-url>
cd Cli
npm install

# Set your API key
export ANTHROPIC_API_KEY=your_api_key_here
```

### Basic Usage

```bash
# Interactive chat
npm start

# Analyze codebase
npm run analyze

# Review code
npm run review

# Generate tests
npm run test "Generate tests for src/utils/parser.ts"

# Debug issues
npm run debug "Why is the API returning 500?"

# Plan feature
npm run plan "Design user authentication system"
```

## 📖 Documentation

### Command Line Options

```
devmaster [OPTIONS] [PROMPT]

Options:
  --mode, -m <mode>       Operation mode (chat|analyze|review|refactor|plan|test|debug)
  --model <model>         AI model (sonnet|opus|haiku)
  --permission-mode, -p   Permission mode (default|acceptEdits|bypassPermissions|plan)
  --verbose, -v           Enable verbose logging
  --output, -o <format>   Output format (text|json|markdown)
  --session, -s <id>      Resume existing session
  --fork, -f              Fork session instead of continuing
  --max-turns <n>         Maximum conversation turns
  --help, -h              Show help message
  --version               Show version
```

### Advanced Examples

#### Automated Code Review
```bash
npm run review -- -p acceptEdits "Review all changes in src/"
```

#### Deep Analysis with Report
```bash
npm run analyze -- --output markdown > analysis.md
```

#### Refactor with Auto-approval
```bash
npm start -- --mode refactor -p acceptEdits "Simplify authentication logic"
```

#### Debug with Verbose Logging
```bash
npm run debug -- -v "Memory leak in WebSocket handler"
```

#### Architecture Planning
```bash
npm run plan -- "Design microservices architecture for e-commerce"
```

## 🏗️ Architecture

### Project Structure

```
src/
├── index.ts              # Main entry point
├── cli.ts                # CLI interface and argument parsing
├── servers/              # MCP Server implementations
│   ├── filesystem.ts     # Advanced file operations
│   ├── git.ts           # Git workflow automation
│   ├── codeAnalysis.ts  # Code quality metrics
│   └── devWorkflow.ts   # Testing and debugging
├── agents/              # Specialized AI agents
│   └── index.ts         # Agent definitions
├── hooks/               # Event hooks
│   └── index.ts         # Hook implementations
├── utils/               # Utility modules
│   ├── ui.ts           # Terminal UI
│   ├── streaming.ts    # Stream handling
│   └── permissions.ts  # Permission management
└── types/              # TypeScript types
    └── index.ts        # Shared type definitions
```

### Key Technologies

- **Claude Agent SDK**: Core AI capabilities
- **TypeScript**: Type-safe development
- **Zod**: Schema validation
- **MCP Protocol**: Tool and server integration
- **Node.js**: Runtime environment

## 🎨 Features in Detail

### MCP Server Tools

#### FileSystem Tools
```typescript
list_directories({ path, recursive, maxDepth })
file_tree({ path, maxDepth, includeFiles, excludePatterns })
search_files({ pattern, path, filePattern, caseSensitive })
analyze_file({ filePath })
bulk_operation({ operation, pattern, destination, dryRun })
```

#### Git Tools
```typescript
git_status({ verbose })
suggest_commit({ analyzeCode })
branch_management({ action, branchName, baseBranch })
analyze_history({ limit, since, author })
conflict_helper()
```

#### Code Analysis Tools
```typescript
analyze_complexity({ filePath })
detect_code_smells({ filePath })
analyze_dependencies({ rootPath, maxDepth })
suggest_refactorings({ filePath })
```

#### Dev Workflow Tools
```typescript
generate_tests({ sourceFile, testType, framework })
analyze_debug({ filePath, errorMessage })
scaffold_project({ projectType, projectName, features })
profile_performance({ filePath })
```

### Specialized Agents

Agents automatically invoke when their expertise is needed:

```bash
# Explicit agent invocation
npm start "Use the architect agent to design a caching layer"

# Implicit invocation
npm run review  # Automatically uses reviewer agent
npm run test    # Automatically uses tester agent
npm run debug   # Automatically uses debug agent
```

## 🔧 Configuration

### Environment Variables

```bash
ANTHROPIC_API_KEY    # Required: Your Claude API key
VERBOSE              # Optional: Enable verbose logging
AUTO_BACKUP          # Optional: Auto-backup modified files
```

### Project Settings

Create `.claude/settings.json` for project-specific configuration:

```json
{
  "defaultMode": "chat",
  "defaultModel": "sonnet",
  "permissionMode": "default"
}
```

## 🎯 Use Cases

### 1. Code Quality Improvement
```bash
npm run analyze  # Identify issues
npm run review   # Get detailed feedback
npm run refactor # Apply improvements
npm run test     # Generate comprehensive tests
```

### 2. Feature Development
```bash
npm run plan "Add payment processing"
npm start -- "Implement payment processing with the architect agent"
npm run test "Generate tests for payment module"
npm run review "Review payment implementation"
```

### 3. Debugging Workflow
```bash
npm run debug "API returns 500 on POST /users"
# Agent analyzes, suggests fixes
npm run test "Generate tests to prevent regression"
```

### 4. Documentation
```bash
npm start "Use docs agent to create comprehensive README"
npm start "Generate API documentation for src/api/"
```

## 🚦 Safety Features

### Dangerous Operation Blocking
- System directory writes blocked
- Destructive commands require approval
- Sensitive file modifications flagged

### Permission Modes
- **Default**: Asks for approval
- **Safe Mode**: Extra validation
- **Dev Mode**: Common operations auto-approved
- **Bypass**: For automation (use carefully)

### Auto-backup
Enable automatic backups of modified files:
```bash
export AUTO_BACKUP=true
```

Backups stored in `.devmaster/backups/`

## 📊 Output Formats

### Text (Default)
Beautiful terminal output with colors and formatting

### JSON
Machine-readable output for integration:
```bash
npm start -- --output json > output.json
```

### Markdown
Documentation-friendly reports:
```bash
npm run analyze -- --output markdown > analysis.md
```

## 🤝 Contributing

This is a demonstration project showcasing Claude Agent SDK capabilities. Feel free to:

1. Fork and extend with new MCP servers
2. Add more specialized agents
3. Create custom hooks
4. Improve existing tools

## 📝 License

MIT

## 🙏 Acknowledgments

Built with:
- [Claude Agent SDK](https://github.com/anthropics/claude-agent-sdk)
- [Anthropic Claude](https://www.anthropic.com)
- TypeScript, Node.js, and the amazing open-source community

## 📚 More Information

- [Usage Examples](./examples/basic-usage.md)
- [Claude Agent SDK Documentation](https://docs.anthropic.com/agent-sdk)
- [MCP Protocol](https://modelcontextprotocol.io)

---

**DevMaster CLI** - Bringing AAA-grade AI assistance to your development workflow! 🎉
