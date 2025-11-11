/**
 * Shared types and interfaces for Claude DevMaster CLI
 */

import { AgentDefinition, PermissionMode } from "@anthropic-ai/claude-agent-sdk";

// CLI Mode Types
export type CLIMode = "chat" | "analyze" | "review" | "refactor" | "plan" | "test" | "debug";

// Configuration Types
export interface DevMasterConfig {
  mode: CLIMode;
  model?: "sonnet" | "opus" | "haiku";
  permissionMode?: PermissionMode;
  verbose?: boolean;
  output?: "text" | "json" | "markdown";
  sessionId?: string;
  fork?: boolean;
  maxTurns?: number;
}

// Agent Configuration
export interface AgentConfig extends AgentDefinition {
  name: string;
  icon?: string;
}

// Tool Result Types
export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
}

// File Analysis Types
export interface FileAnalysis {
  path: string;
  language: string;
  loc: number;
  complexity?: number;
  issues?: Issue[];
  dependencies?: string[];
}

export interface Issue {
  severity: "error" | "warning" | "info";
  message: string;
  line?: number;
  column?: number;
  rule?: string;
}

// Git Types
export interface GitStatus {
  branch: string;
  ahead: number;
  behind: number;
  staged: string[];
  unstaged: string[];
  untracked: string[];
}

export interface CommitSuggestion {
  type: "feat" | "fix" | "refactor" | "docs" | "test" | "chore";
  scope?: string;
  message: string;
  description?: string;
}

// Code Quality Types
export interface QualityMetrics {
  maintainability: number;
  complexity: number;
  testCoverage?: number;
  duplication?: number;
  issues: Issue[];
}

// Template Types
export interface Template {
  name: string;
  description: string;
  files: TemplateFile[];
  variables?: Record<string, string>;
}

export interface TemplateFile {
  path: string;
  content: string;
}

// Dependency Graph Types
export interface DependencyNode {
  id: string;
  label: string;
  type: "file" | "module" | "package";
  dependencies: string[];
}

export interface DependencyGraph {
  nodes: DependencyNode[];
  circular?: string[][];
}

// Test Generation Types
export interface TestSuggestion {
  testType: "unit" | "integration" | "e2e";
  targetFile: string;
  testFile: string;
  testCases: TestCase[];
}

export interface TestCase {
  name: string;
  description: string;
  code: string;
}

// Session Types
export interface SessionMetadata {
  id: string;
  startTime: Date;
  mode: CLIMode;
  model: string;
  turns: number;
  cost: number;
}

// UI Types
export interface ProgressUpdate {
  current: number;
  total: number;
  message?: string;
}

// Hook Data Types
export interface HookMetadata {
  toolName: string;
  duration?: number;
  success: boolean;
  error?: string;
}

// Export utility type for async generator results
export type StreamResult<T> = AsyncGenerator<T, void, unknown>;
