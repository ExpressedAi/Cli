# DevMaster CLI - Basic Usage Examples

## Installation

```bash
npm install
npm run build
```

Set your API key:
```bash
export ANTHROPIC_API_KEY=your_api_key_here
```

## Quick Start

### Chat Mode (Interactive)
```bash
npm run chat
# or
npm start
```

### Analysis Mode
```bash
npm run analyze
# Analyzes the entire codebase
```

### Code Review
```bash
npm run review "Review the authentication module"
```

### Generate Tests
```bash
npm run test "Generate tests for src/utils/parser.ts"
```

### Debug Issues
```bash
npm run debug "The login function returns undefined"
```

### Planning
```bash
npm run plan "Plan implementation of real-time notifications"
```

## Advanced Usage

### With Custom Model
```bash
npm start -- --mode analyze --model opus
```

### Auto-approve Edits
```bash
npm start -- --mode refactor -p acceptEdits "Refactor the API layer"
```

### Verbose Mode
```bash
npm start -- -v --mode debug "Investigate memory leak"
```

### Resume Session
```bash
npm start -- --session abc123
```

### JSON Output
```bash
npm start -- --output json --mode analyze > analysis.json
```

### Markdown Report
```bash
npm start -- --output markdown --mode review > review.md
```

## Using Specialized Agents

Agents are automatically invoked based on context, but you can request them:

```bash
# Request architect agent
npm start "Use the architect agent to design a microservices architecture"

# Request reviewer agent
npm start "Have the reviewer agent check src/api/"

# Request tester agent
npm start "Use the tester agent to create comprehensive tests"
```

## MCP Server Tools

All tools are available automatically:

### FileSystem Server
- `list_directories` - List directory structure
- `file_tree` - Generate tree view
- `search_files` - Search by content
- `analyze_file` - Get file metrics
- `bulk_operation` - Bulk file operations

### Git Server
- `git_status` - Enhanced git status
- `suggest_commit` - Smart commit messages
- `branch_management` - Branch operations
- `analyze_history` - Commit analysis
- `conflict_helper` - Merge conflict assistance

### Code Analysis Server
- `analyze_complexity` - Cyclomatic complexity
- `detect_code_smells` - Find anti-patterns
- `analyze_dependencies` - Dependency graph
- `suggest_refactorings` - Improvement suggestions

### Dev Workflow Server
- `generate_tests` - Test generation
- `analyze_debug` - Debug assistance
- `scaffold_project` - Project scaffolding
- `profile_performance` - Performance analysis

## Tips

1. **Be specific**: The more context you provide, the better the assistance
2. **Use modes**: Different modes optimize for different tasks
3. **Enable verbose**: Use `-v` to see what's happening
4. **Try agents**: Specialized agents provide expert-level assistance
5. **Permission modes**: Use `acceptEdits` or `bypassPermissions` for automation

## Common Workflows

### Complete Code Review
```bash
npm run review -p acceptEdits "Review all changes since last commit"
```

### Refactor with Tests
```bash
npm run refactor "Simplify the authentication logic and generate tests"
```

### Comprehensive Analysis
```bash
npm run analyze -v > codebase-analysis.txt
```

### Debug and Fix
```bash
npm run debug "Users are getting 500 errors on /api/users endpoint"
```

### Plan and Architect
```bash
npm run plan "Design a caching layer for the API"
```
