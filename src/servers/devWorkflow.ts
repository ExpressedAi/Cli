/**
 * Dev Workflow MCP Server
 * Testing, debugging, and project management tools
 */

import { tool, createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import fs from "node:fs/promises";
import path from "node:path";
import { TestSuggestion, TestCase } from "../types/index.js";

// Generate tests tool
const generateTestsTool = tool(
  "generate_tests",
  "Generate test cases and test file scaffolding for a given source file",
  {
    sourceFile: z.string(),
    testType: z.enum(["unit", "integration", "e2e"]).default("unit"),
    framework: z.string().default("jest"),
  },
  async ({ sourceFile, testType, framework }) => {
    try {
      const fullPath = path.resolve(process.cwd(), sourceFile);
      const content = await fs.readFile(fullPath, "utf-8");

      // Extract functions/classes to test
      const functions = extractFunctions(content);
      const classes = extractClasses(content);

      const testCases: TestCase[] = [];

      // Generate test cases for functions
      functions.forEach((fn) => {
        testCases.push({
          name: `should ${fn.name} correctly`,
          description: `Test ${fn.name} with valid inputs`,
          code: generateTestCode(fn.name, "function", framework),
        });

        testCases.push({
          name: `should handle ${fn.name} edge cases`,
          description: `Test ${fn.name} with edge cases and errors`,
          code: generateTestCode(fn.name, "function", framework, true),
        });
      });

      // Generate test cases for classes
      classes.forEach((cls) => {
        testCases.push({
          name: `should create ${cls.name} instance`,
          description: `Test ${cls.name} instantiation`,
          code: generateTestCode(cls.name, "class", framework),
        });
      });

      const testFileName = sourceFile
        .replace(/\.(ts|js)$/, `.${testType}.${framework === "jest" ? "test" : "spec"}.$1`);

      const output = [
        `Test Generation for: ${sourceFile}`,
        `Type: ${testType}`,
        `Framework: ${framework}`,
        `\nSuggested test file: ${testFileName}`,
        `\nGenerated ${testCases.length} test cases:`,
      ];

      testCases.forEach((tc, i) => {
        output.push(`\n${i + 1}. ${tc.name}`);
        output.push(`   ${tc.description}`);
      });

      output.push(`\nTest Template:\n${generateTestFileTemplate(sourceFile, testCases, framework)}`);

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

// Debug analyzer tool
const analyzeDebugTool = tool(
  "analyze_debug",
  "Analyze code for common debugging scenarios and suggest debugging strategies",
  {
    filePath: z.string(),
    errorMessage: z.string().optional(),
  },
  async ({ filePath, errorMessage }) => {
    try {
      const fullPath = path.resolve(process.cwd(), filePath);
      const content = await fs.readFile(fullPath, "utf-8");
      const lines = content.split("\n");

      const suggestions: string[] = [];

      // Analyze based on error message
      if (errorMessage) {
        if (errorMessage.includes("undefined")) {
          suggestions.push("Check for null/undefined values - add null checks or optional chaining");
        }
        if (errorMessage.includes("TypeError")) {
          suggestions.push("Verify type assumptions - add type guards or runtime type checking");
        }
        if (errorMessage.includes("async")) {
          suggestions.push("Review async/await usage - ensure promises are properly handled");
        }
      }

      // General debugging suggestions
      const hasConsoleLog = content.includes("console.log");
      const hasDebugger = content.includes("debugger");
      const hasErrorHandling = content.includes("try") && content.includes("catch");

      const output = [
        `Debug Analysis: ${filePath}`,
        errorMessage ? `\nError: ${errorMessage}` : "",
        `\nCurrent Debugging:`,
        `  Console logs: ${hasConsoleLog ? "✓" : "✗"}`,
        `  Debugger statements: ${hasDebugger ? "✓" : "✗"}`,
        `  Error handling: ${hasErrorHandling ? "✓" : "✗"}`,
      ];

      if (suggestions.length > 0) {
        output.push("\nSuggestions:");
        suggestions.forEach((s, i) => output.push(`  ${i + 1}. ${s}`));
      }

      output.push("\nDebugging Strategies:");
      output.push("  1. Add console.log at key decision points");
      output.push("  2. Use debugger; statements to pause execution");
      output.push("  3. Add try-catch blocks around suspicious code");
      output.push("  4. Check function inputs and outputs");
      output.push("  5. Verify async operations complete properly");

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

// Project scaffolding tool
const scaffoldProjectTool = tool(
  "scaffold_project",
  "Generate project structure and boilerplate files",
  {
    projectType: z.enum(["node-cli", "express-api", "react-app", "typescript-lib", "generic"]),
    projectName: z.string(),
    features: z.array(z.string()).default([]),
  },
  async ({ projectType, projectName, features }) => {
    const structure: Record<string, string[]> = {
      "node-cli": [
        "src/index.ts",
        "src/cli.ts",
        "src/utils/",
        "tests/",
        "package.json",
        "tsconfig.json",
        "README.md",
      ],
      "express-api": [
        "src/index.ts",
        "src/routes/",
        "src/controllers/",
        "src/models/",
        "src/middleware/",
        "tests/",
        "package.json",
        "tsconfig.json",
      ],
      "react-app": [
        "src/App.tsx",
        "src/components/",
        "src/hooks/",
        "src/utils/",
        "public/",
        "package.json",
        "tsconfig.json",
      ],
      "typescript-lib": [
        "src/index.ts",
        "src/lib/",
        "tests/",
        "package.json",
        "tsconfig.json",
        "README.md",
      ],
      "generic": [
        "src/",
        "tests/",
        "package.json",
        "README.md",
      ],
    };

    const files = structure[projectType] || structure.generic || [];

    const output = [
      `Project Scaffold: ${projectName}`,
      `Type: ${projectType}`,
      features.length > 0 ? `Features: ${features.join(", ")}` : "",
      `\nRecommended structure:`,
      ...files.map((f) => `  ${f.endsWith("/") ? "📁" : "📄"} ${f}`),
      `\nNext steps:`,
      `  1. Create project directory: mkdir ${projectName}`,
      `  2. Initialize: cd ${projectName} && npm init -y`,
      `  3. Install dependencies based on project type`,
      `  4. Create the file structure above`,
    ];

    return {
      content: [
        {
          type: "text",
          text: output.join("\n"),
        },
      ],
    };
  }
);

// Performance profiler tool
const profilePerformanceTool = tool(
  "profile_performance",
  "Analyze code for performance bottlenecks and suggest optimizations",
  {
    filePath: z.string(),
  },
  async ({ filePath }) => {
    try {
      const fullPath = path.resolve(process.cwd(), filePath);
      const content = await fs.readFile(fullPath, "utf-8");

      const issues: Array<{ severity: string; issue: string; suggestion: string }> = [];

      // Check for common performance issues
      if (content.match(/for\s*\([^)]*\)\s*{\s*for\s*\(/)) {
        issues.push({
          severity: "HIGH",
          issue: "Nested loops detected - O(n²) complexity",
          suggestion: "Consider using hash maps or optimized algorithms",
        });
      }

      const synchronousIO = content.match(/fs\.readFileSync|fs\.writeFileSync/g);
      if (synchronousIO) {
        issues.push({
          severity: "HIGH",
          issue: `${synchronousIO.length} synchronous file operations`,
          suggestion: "Use async file operations (fs.promises) to prevent blocking",
        });
      }

      if (content.includes("JSON.parse") && content.includes("JSON.stringify")) {
        issues.push({
          severity: "MEDIUM",
          issue: "Frequent JSON serialization detected",
          suggestion: "Consider caching parsed objects or using more efficient formats",
        });
      }

      if (content.match(/\.map\([^)]+\)\.filter\(/)) {
        issues.push({
          severity: "LOW",
          issue: "Chained map/filter operations",
          suggestion: "Combine into single operation to reduce iterations",
        });
      }

      const output = [
        `Performance Profile: ${filePath}`,
        `\nIssues Found: ${issues.length}`,
      ];

      if (issues.length > 0) {
        issues.forEach((issue, i) => {
          const icon = issue.severity === "HIGH" ? "🔴" :
                       issue.severity === "MEDIUM" ? "🟡" : "🟢";
          output.push(`\n${i + 1}. ${icon} [${issue.severity}]`);
          output.push(`   Issue: ${issue.issue}`);
          output.push(`   Suggestion: ${issue.suggestion}`);
        });
      } else {
        output.push("\n✓ No obvious performance issues detected!");
      }

      output.push("\nGeneral Optimization Tips:");
      output.push("  • Use memoization for expensive computations");
      output.push("  • Implement lazy loading where possible");
      output.push("  • Consider worker threads for CPU-intensive tasks");
      output.push("  • Profile with actual performance tools (Chrome DevTools, clinic.js)");

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
function extractFunctions(code: string): Array<{ name: string; params: string }> {
  const functions: Array<{ name: string; params: string }> = [];
  const functionRegex = /(?:function|const|let|var)\s+(\w+)\s*=?\s*(?:function)?\s*\(([^)]*)\)/g;

  let match;
  while ((match = functionRegex.exec(code)) !== null) {
    functions.push({
      name: match[1]!,
      params: match[2]!,
    });
  }

  return functions;
}

function extractClasses(code: string): Array<{ name: string }> {
  const classes: Array<{ name: string }> = [];
  const classRegex = /class\s+(\w+)/g;

  let match;
  while ((match = classRegex.exec(code)) !== null) {
    classes.push({ name: match[1]! });
  }

  return classes;
}

function generateTestCode(name: string, type: "function" | "class", framework: string, edgeCase: boolean = false): string {
  if (framework === "jest") {
    if (type === "function") {
      return edgeCase
        ? `expect(() => ${name}(null)).toThrow();\nexpect(${name}(undefined)).toBeDefined();`
        : `const result = ${name}();\nexpect(result).toBeDefined();`;
    } else {
      return `const instance = new ${name}();\nexpect(instance).toBeInstanceOf(${name});`;
    }
  }
  return `// Test code for ${name}`;
}

function generateTestFileTemplate(sourceFile: string, testCases: TestCase[], framework: string): string {
  const importName = path.basename(sourceFile, path.extname(sourceFile));

  const template = [
    `import { ${importName} } from './${importName}';`,
    ``,
    `describe('${importName}', () => {`,
  ];

  testCases.forEach((tc) => {
    template.push(`  test('${tc.name}', () => {`);
    template.push(`    ${tc.code.split("\n").join("\n    ")}`);
    template.push(`  });`);
    template.push(``);
  });

  template.push(`});`);

  return template.join("\n");
}

// Create and export the Dev Workflow MCP server
export const devWorkflowServer = createSdkMcpServer({
  name: "dev-workflow",
  version: "1.0.0",
  tools: [
    generateTestsTool,
    analyzeDebugTool,
    scaffoldProjectTool,
    profilePerformanceTool,
  ],
});
