/**
 * Code Analysis MCP Server
 * Provides code quality metrics, complexity analysis, and refactoring suggestions
 */

import { tool, createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import fs from "node:fs/promises";
import path from "node:path";
import { QualityMetrics, Issue, DependencyGraph, DependencyNode } from "../types/index.js";

// Code complexity analysis tool
const analyzeComplexityTool = tool(
  "analyze_complexity",
  "Analyze code complexity using cyclomatic complexity and other metrics",
  {
    filePath: z.string(),
  },
  async ({ filePath }) => {
    try {
      const fullPath = path.resolve(process.cwd(), filePath);
      const content = await fs.readFile(fullPath, "utf-8");
      const lines = content.split("\n");

      // Calculate complexity
      const complexity = calculateComplexity(content);
      const issues = detectIssues(content, lines);

      const metrics: QualityMetrics = {
        maintainability: calculateMaintainability(complexity, lines.length),
        complexity,
        issues,
      };

      const output = [
        `Code Complexity Analysis: ${filePath}`,
        `\nCyclomatic Complexity: ${complexity}`,
        `Maintainability Index: ${metrics.maintainability.toFixed(2)}/100`,
        `\nComplexity Assessment:`,
        complexity <= 10 ? "  ✓ Simple - Easy to maintain" :
        complexity <= 20 ? "  ⚠ Moderate - Consider refactoring" :
        "  ✗ Complex - Refactoring recommended",
        `\nIssues Found: ${issues.length}`,
      ];

      if (issues.length > 0) {
        output.push("\nTop Issues:");
        issues.slice(0, 5).forEach((issue) => {
          const icon = issue.severity === "error" ? "✗" :
                       issue.severity === "warning" ? "⚠" : "ℹ";
          output.push(`  ${icon} Line ${issue.line}: ${issue.message}`);
        });
      }

      return {
        content: [
          {
            type: "text",
            text: output.join("\n"),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${(error as Error).message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Detect code smells tool
const detectCodeSmellsTool = tool(
  "detect_code_smells",
  "Detect common code smells and anti-patterns",
  {
    filePath: z.string(),
  },
  async ({ filePath }) => {
    try {
      const fullPath = path.resolve(process.cwd(), filePath);
      const content = await fs.readFile(fullPath, "utf-8");
      const lines = content.split("\n");

      const smells: Array<{ type: string; line: number; description: string }> = [];

      lines.forEach((line, index) => {
        const lineNum = index + 1;

        // Long line
        if (line.length > 120) {
          smells.push({
            type: "Long Line",
            line: lineNum,
            description: `Line exceeds 120 characters (${line.length})`,
          });
        }

        // Deep nesting
        const indent = line.match(/^\s*/)?.[0].length || 0;
        if (indent > 16) {
          smells.push({
            type: "Deep Nesting",
            line: lineNum,
            description: "Excessive nesting depth detected",
          });
        }

        // Magic numbers
        if (line.match(/[^a-zA-Z_]\d{2,}[^a-zA-Z_]/) && !line.includes("//")) {
          smells.push({
            type: "Magic Number",
            line: lineNum,
            description: "Consider extracting to named constant",
          });
        }

        // TODO comments
        if (line.includes("TODO") || line.includes("FIXME")) {
          smells.push({
            type: "TODO Comment",
            line: lineNum,
            description: "Unresolved TODO or FIXME",
          });
        }

        // Console.log (for JS/TS)
        if (line.includes("console.log") && !line.trim().startsWith("//")) {
          smells.push({
            type: "Debug Statement",
            line: lineNum,
            description: "Remove debug console.log before production",
          });
        }

        // Empty catch blocks
        if (line.trim() === "catch" && lines[index + 1]?.trim() === "}") {
          smells.push({
            type: "Empty Catch",
            line: lineNum,
            description: "Empty catch block swallows errors",
          });
        }
      });

      // Check function length
      const functionMatches = content.match(/function\s+\w+|=>\s*{|\bclass\s+\w+/g);
      if (functionMatches) {
        const avgLinesPerFunction = lines.length / functionMatches.length;
        if (avgLinesPerFunction > 50) {
          smells.push({
            type: "Long Functions",
            line: 0,
            description: `Average function length: ${avgLinesPerFunction.toFixed(0)} lines (consider breaking down)`,
          });
        }
      }

      const output = [
        `Code Smell Detection: ${filePath}`,
        `\nTotal Smells Found: ${smells.length}`,
      ];

      if (smells.length > 0) {
        const grouped = groupBy(smells, "type");
        output.push("\nBy Type:");
        Object.entries(grouped).forEach(([type, items]) => {
          output.push(`  ${type}: ${items.length}`);
        });

        output.push("\nDetails:");
        smells.slice(0, 15).forEach((smell) => {
          output.push(
            smell.line > 0
              ? `  Line ${smell.line}: ${smell.description}`
              : `  ${smell.description}`
          );
        });
      } else {
        output.push("\n✓ No code smells detected!");
      }

      return {
        content: [
          {
            type: "text",
            text: output.join("\n"),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${(error as Error).message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Dependency analysis tool
const analyzeDependenciesTool = tool(
  "analyze_dependencies",
  "Analyze project dependencies and detect circular dependencies",
  {
    rootPath: z.string().default("."),
    maxDepth: z.number().default(3),
  },
  async ({ rootPath, maxDepth }) => {
    try {
      const fullPath = path.resolve(process.cwd(), rootPath);
      const graph: DependencyGraph = { nodes: [] };
      const visited = new Set<string>();

      async function analyzeFile(filePath: string, depth: number = 0) {
        if (depth > maxDepth || visited.has(filePath)) return;
        visited.add(filePath);

        try {
          const content = await fs.readFile(filePath, "utf-8");
          const imports = extractImports(content);

          const node: DependencyNode = {
            id: filePath,
            label: path.basename(filePath),
            type: "file",
            dependencies: imports,
          };

          graph.nodes.push(node);

          // Recursively analyze imports
          for (const imp of imports) {
            if (imp.startsWith(".")) {
              const resolvedPath = path.resolve(path.dirname(filePath), imp);
              await analyzeFile(resolvedPath, depth + 1);
            }
          }
        } catch {
          // Skip files we can't read
        }
      }

      // Find entry points
      const entries = await fs.readdir(fullPath);
      for (const entry of entries) {
        if (entry.match(/\.(ts|js|tsx|jsx)$/) && !entry.includes(".test.")) {
          await analyzeFile(path.join(fullPath, entry));
        }
      }

      // Detect circular dependencies
      const circular = detectCircularDeps(graph);

      const output = [
        "Dependency Analysis",
        `\nTotal Files: ${graph.nodes.length}`,
        `Total Dependencies: ${graph.nodes.reduce((sum, n) => sum + n.dependencies.length, 0)}`,
      ];

      if (circular.length > 0) {
        output.push(`\n⚠ Circular Dependencies Found: ${circular.length}`);
        circular.slice(0, 5).forEach((cycle) => {
          output.push(`  ${cycle.join(" → ")}`);
        });
      } else {
        output.push("\n✓ No circular dependencies detected");
      }

      // Most dependent files
      const sorted = [...graph.nodes].sort(
        (a, b) => b.dependencies.length - a.dependencies.length
      );
      output.push("\nMost Dependencies:");
      sorted.slice(0, 5).forEach((node) => {
        output.push(`  ${node.label}: ${node.dependencies.length} imports`);
      });

      return {
        content: [
          {
            type: "text",
            text: output.join("\n"),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${(error as Error).message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Refactoring suggestions tool
const suggestRefactoringsTool = tool(
  "suggest_refactorings",
  "Suggest potential refactorings to improve code quality",
  {
    filePath: z.string(),
  },
  async ({ filePath }) => {
    try {
      const fullPath = path.resolve(process.cwd(), filePath);
      const content = await fs.readFile(fullPath, "utf-8");
      const lines = content.split("\n");

      const suggestions: Array<{ priority: string; suggestion: string }> = [];

      // Analyze and suggest
      const complexity = calculateComplexity(content);
      if (complexity > 20) {
        suggestions.push({
          priority: "HIGH",
          suggestion: "Break down complex functions using Extract Method pattern",
        });
      }

      // Check for duplicated code
      const duplicates = findDuplicateBlocks(lines);
      if (duplicates > 5) {
        suggestions.push({
          priority: "MEDIUM",
          suggestion: `Found ${duplicates} potential code duplications - consider Extract Function`,
        });
      }

      // Long parameter lists
      const longParams = content.match(/\([^)]{100,}\)/g);
      if (longParams && longParams.length > 0) {
        suggestions.push({
          priority: "MEDIUM",
          suggestion: "Replace long parameter lists with parameter objects",
        });
      }

      // Nested conditionals
      const nestedIfs = content.match(/if\s*\([^)]+\)\s*{\s*if\s*\(/g);
      if (nestedIfs && nestedIfs.length > 3) {
        suggestions.push({
          priority: "MEDIUM",
          suggestion: "Replace nested conditionals with guard clauses or polymorphism",
        });
      }

      // Large classes/modules
      if (lines.length > 500) {
        suggestions.push({
          priority: "HIGH",
          suggestion: "File exceeds 500 lines - consider splitting into smaller modules",
        });
      }

      const output = [
        `Refactoring Suggestions: ${filePath}`,
        `\nTotal Suggestions: ${suggestions.length}`,
      ];

      if (suggestions.length > 0) {
        suggestions.forEach((s, i) => {
          const icon = s.priority === "HIGH" ? "🔴" : s.priority === "MEDIUM" ? "🟡" : "🟢";
          output.push(`\n${i + 1}. ${icon} [${s.priority}] ${s.suggestion}`);
        });
      } else {
        output.push("\n✓ Code looks good! No immediate refactorings needed.");
      }

      return {
        content: [
          {
            type: "text",
            text: output.join("\n"),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${(error as Error).message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Helper functions
function calculateComplexity(code: string): number {
  let complexity = 1; // Base complexity

  // Count decision points
  const patterns = [
    /\bif\b/g,
    /\belse\s+if\b/g,
    /\bfor\b/g,
    /\bwhile\b/g,
    /\bcase\b/g,
    /\bcatch\b/g,
    /&&/g,
    /\|\|/g,
    /\?/g, // Ternary operator
  ];

  patterns.forEach((pattern) => {
    const matches = code.match(pattern);
    if (matches) {
      complexity += matches.length;
    }
  });

  return complexity;
}

function calculateMaintainability(complexity: number, loc: number): number {
  // Simplified maintainability index
  const complexityFactor = Math.max(0, 100 - complexity * 2);
  const locFactor = Math.max(0, 100 - loc / 10);
  return (complexityFactor + locFactor) / 2;
}

function detectIssues(code: string, lines: string[]): Issue[] {
  const issues: Issue[] = [];

  lines.forEach((line, index) => {
    // Very long lines
    if (line.length > 150) {
      issues.push({
        severity: "warning",
        message: "Line exceeds recommended length",
        line: index + 1,
        rule: "max-line-length",
      });
    }

    // Unused variables (simple detection)
    const varMatch = line.match(/(?:const|let|var)\s+(\w+)\s*=/);
    if (varMatch && !code.includes(varMatch[1] + ".") && !code.includes(varMatch[1] + ")")) {
      issues.push({
        severity: "info",
        message: `Potentially unused variable: ${varMatch[1]}`,
        line: index + 1,
        rule: "no-unused-vars",
      });
    }
  });

  return issues;
}

function extractImports(code: string): string[] {
  const imports: string[] = [];
  const importRegex = /import\s+.*\s+from\s+['"]([^'"]+)['"]/g;
  const requireRegex = /require\(['"]([^'"]+)['"]\)/g;

  let match;
  while ((match = importRegex.exec(code)) !== null) {
    imports.push(match[1]!);
  }
  while ((match = requireRegex.exec(code)) !== null) {
    imports.push(match[1]!);
  }

  return imports;
}

function detectCircularDeps(graph: DependencyGraph): string[][] {
  const circular: string[][] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function dfs(nodeId: string, path: string[]) {
    if (recursionStack.has(nodeId)) {
      const cycleStart = path.indexOf(nodeId);
      circular.push([...path.slice(cycleStart), nodeId]);
      return;
    }

    if (visited.has(nodeId)) return;

    visited.add(nodeId);
    recursionStack.add(nodeId);
    path.push(nodeId);

    const node = graph.nodes.find((n) => n.id === nodeId);
    if (node) {
      node.dependencies.forEach((dep) => dfs(dep, [...path]));
    }

    recursionStack.delete(nodeId);
  }

  graph.nodes.forEach((node) => {
    if (!visited.has(node.id)) {
      dfs(node.id, []);
    }
  });

  return circular;
}

function findDuplicateBlocks(lines: string[]): number {
  const blocks = new Map<string, number>();
  const blockSize = 3;

  for (let i = 0; i <= lines.length - blockSize; i++) {
    const block = lines.slice(i, i + blockSize).join("\n").trim();
    if (block.length > 20) {
      blocks.set(block, (blocks.get(block) || 0) + 1);
    }
  }

  return Array.from(blocks.values()).filter((count) => count > 1).length;
}

function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((acc, item) => {
    const group = String(item[key]);
    if (!acc[group]) acc[group] = [];
    acc[group]!.push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

// Create and export the Code Analysis MCP server
export const codeAnalysisServer = createSdkMcpServer({
  name: "code-analysis",
  version: "1.0.0",
  tools: [
    analyzeComplexityTool,
    detectCodeSmellsTool,
    analyzeDependenciesTool,
    suggestRefactoringsTool,
  ],
});
