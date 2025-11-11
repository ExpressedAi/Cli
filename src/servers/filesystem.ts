/**
 * Advanced FileSystem MCP Server
 * Provides powerful file operations beyond basic Read/Write
 */

import { tool, createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import fs from "node:fs/promises";
import path from "node:path";
import { FileAnalysis, Template } from "../types/index.js";

// List directories tool
const listDirectoriesTool = tool(
  "list_directories",
  "List all directories in a given path with metadata",
  {
    path: z.string().default("."),
    recursive: z.boolean().default(false),
    maxDepth: z.number().default(3),
  },
  async ({ path: targetPath, recursive, maxDepth }) => {
    const fullPath = path.resolve(process.cwd(), targetPath);
    const directories: string[] = [];

    async function scan(dir: string, depth: number = 0) {
      if (depth > maxDepth) return;

      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory() && !entry.name.startsWith(".")) {
            const fullEntryPath = path.join(dir, entry.name);
            directories.push(path.relative(fullPath, fullEntryPath));

            if (recursive) {
              await scan(fullEntryPath, depth + 1);
            }
          }
        }
      } catch (error) {
        // Skip directories we can't access
      }
    }

    await scan(fullPath);

    return {
      content: [
        {
          type: "text",
          text: directories.length > 0
            ? `Found ${directories.length} directories:\n${directories.map((d) => `📁 ${d}`).join("\n")}`
            : "No directories found",
        },
      ],
    };
  }
);

// File tree tool
const fileTreeTool = tool(
  "file_tree",
  "Generate a tree view of the file system structure",
  {
    path: z.string().default("."),
    maxDepth: z.number().default(3),
    includeFiles: z.boolean().default(true),
    excludePatterns: z.array(z.string()).default(["node_modules", ".git", "dist", "build"]),
  },
  async ({ path: targetPath, maxDepth, includeFiles, excludePatterns }) => {
    const fullPath = path.resolve(process.cwd(), targetPath);
    const tree: string[] = [];

    async function buildTree(dir: string, prefix: string = "", depth: number = 0) {
      if (depth > maxDepth) return;

      const entries = await fs.readdir(dir, { withFileTypes: true });
      const filtered = entries.filter(
        (entry) => !excludePatterns.some((pattern) => entry.name.includes(pattern))
      );

      for (let i = 0; i < filtered.length; i++) {
        const entry = filtered[i]!;
        const isLast = i === filtered.length - 1;
        const connector = isLast ? "└── " : "├── ";
        const icon = entry.isDirectory() ? "📁" : "📄";

        tree.push(`${prefix}${connector}${icon} ${entry.name}`);

        if (entry.isDirectory()) {
          const newPrefix = prefix + (isLast ? "    " : "│   ");
          await buildTree(path.join(dir, entry.name), newPrefix, depth + 1);
        }
      }
    }

    tree.push(`📁 ${path.basename(fullPath)}/`);
    await buildTree(fullPath);

    return {
      content: [
        {
          type: "text",
          text: tree.join("\n"),
        },
      ],
    };
  }
);

// Search files by content
const searchFilesTool = tool(
  "search_files",
  "Search for files containing specific content or patterns",
  {
    pattern: z.string(),
    path: z.string().default("."),
    filePattern: z.string().optional(),
    caseSensitive: z.boolean().default(false),
    maxResults: z.number().default(50),
  },
  async ({ pattern, path: searchPath, filePattern, caseSensitive, maxResults }) => {
    const fullPath = path.resolve(process.cwd(), searchPath);
    const results: Array<{ file: string; matches: number; lines: string[] }> = [];
    const regex = new RegExp(pattern, caseSensitive ? "g" : "gi");

    async function search(dir: string) {
      if (results.length >= maxResults) return;

      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          if (results.length >= maxResults) break;

          const fullEntryPath = path.join(dir, entry.name);

          if (entry.isDirectory()) {
            if (!entry.name.startsWith(".") && entry.name !== "node_modules") {
              await search(fullEntryPath);
            }
          } else if (entry.isFile()) {
            if (filePattern && !entry.name.match(filePattern)) continue;

            try {
              const content = await fs.readFile(fullEntryPath, "utf-8");
              const lines = content.split("\n");
              const matchingLines: string[] = [];

              lines.forEach((line, index) => {
                if (regex.test(line)) {
                  matchingLines.push(`${index + 1}: ${line.trim()}`);
                }
              });

              if (matchingLines.length > 0) {
                results.push({
                  file: path.relative(fullPath, fullEntryPath),
                  matches: matchingLines.length,
                  lines: matchingLines.slice(0, 5), // First 5 matches
                });
              }
            } catch {
              // Skip files we can't read
            }
          }
        }
      } catch {
        // Skip directories we can't access
      }
    }

    await search(fullPath);

    const output = results.map((r) =>
      `📄 ${r.file} (${r.matches} matches)\n${r.lines.join("\n")}`
    ).join("\n\n");

    return {
      content: [
        {
          type: "text",
          text: results.length > 0
            ? `Found ${results.length} files:\n\n${output}`
            : "No matches found",
        },
      ],
    };
  }
);

// Analyze file tool
const analyzeFileTool = tool(
  "analyze_file",
  "Analyze a file to get metadata, statistics, and basic metrics",
  {
    filePath: z.string(),
  },
  async ({ filePath }) => {
    const fullPath = path.resolve(process.cwd(), filePath);

    try {
      const stats = await fs.stat(fullPath);
      const content = await fs.readFile(fullPath, "utf-8");
      const lines = content.split("\n");

      const analysis: FileAnalysis = {
        path: filePath,
        language: detectLanguage(filePath),
        loc: lines.filter((line) => line.trim().length > 0).length,
        dependencies: extractDependencies(content, detectLanguage(filePath)),
      };

      const output = [
        `File: ${filePath}`,
        `Language: ${analysis.language}`,
        `Size: ${(stats.size / 1024).toFixed(2)} KB`,
        `Lines: ${lines.length} (${analysis.loc} non-empty)`,
        `Last modified: ${stats.mtime.toISOString()}`,
      ];

      if (analysis.dependencies && analysis.dependencies.length > 0) {
        output.push(`\nDependencies (${analysis.dependencies.length}):`);
        output.push(analysis.dependencies.slice(0, 10).map((d) => `  - ${d}`).join("\n"));
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
            text: `Error analyzing file: ${(error as Error).message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Bulk operations tool
const bulkOperationTool = tool(
  "bulk_operation",
  "Perform bulk operations on multiple files (rename, move, delete)",
  {
    operation: z.enum(["rename", "move", "delete"]),
    pattern: z.string(),
    destination: z.string().optional(),
    dryRun: z.boolean().default(true),
  },
  async ({ operation, pattern, destination, dryRun }) => {
    const cwd = process.cwd();
    const files: string[] = [];
    const results: string[] = [];

    // Find matching files
    async function findFiles(dir: string) {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory() && !entry.name.startsWith(".")) {
          await findFiles(fullPath);
        } else if (entry.isFile() && entry.name.match(pattern)) {
          files.push(fullPath);
        }
      }
    }

    await findFiles(cwd);

    // Perform operation
    for (const file of files) {
      try {
        const relativePath = path.relative(cwd, file);

        if (operation === "delete") {
          if (!dryRun) {
            await fs.unlink(file);
          }
          results.push(`${dryRun ? "[DRY RUN] Would delete" : "Deleted"}: ${relativePath}`);
        } else if (operation === "move" && destination) {
          const destPath = path.join(cwd, destination, path.basename(file));
          if (!dryRun) {
            await fs.mkdir(path.dirname(destPath), { recursive: true });
            await fs.rename(file, destPath);
          }
          results.push(
            `${dryRun ? "[DRY RUN] Would move" : "Moved"}: ${relativePath} -> ${path.relative(cwd, destPath)}`
          );
        }
      } catch (error) {
        results.push(`Error processing ${file}: ${(error as Error).message}`);
      }
    }

    return {
      content: [
        {
          type: "text",
          text: results.length > 0
            ? `Processed ${files.length} files:\n${results.join("\n")}`
            : "No files matched the pattern",
        },
      ],
    };
  }
);

// Helper functions
function detectLanguage(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const languageMap: Record<string, string> = {
    ".ts": "TypeScript",
    ".tsx": "TypeScript React",
    ".js": "JavaScript",
    ".jsx": "JavaScript React",
    ".py": "Python",
    ".java": "Java",
    ".cpp": "C++",
    ".c": "C",
    ".go": "Go",
    ".rs": "Rust",
    ".rb": "Ruby",
    ".php": "PHP",
    ".swift": "Swift",
    ".kt": "Kotlin",
    ".cs": "C#",
    ".md": "Markdown",
    ".json": "JSON",
    ".yaml": "YAML",
    ".yml": "YAML",
  };
  return languageMap[ext] || "Unknown";
}

function extractDependencies(content: string, language: string): string[] {
  const deps: string[] = [];

  if (language.includes("JavaScript") || language.includes("TypeScript")) {
    const importRegex = /import\s+.*\s+from\s+['"]([^'"]+)['"]/g;
    const requireRegex = /require\(['"]([^'"]+)['"]\)/g;

    let match;
    while ((match = importRegex.exec(content)) !== null) {
      deps.push(match[1]!);
    }
    while ((match = requireRegex.exec(content)) !== null) {
      deps.push(match[1]!);
    }
  } else if (language === "Python") {
    const importRegex = /(?:from\s+(\S+)\s+)?import\s+(\S+)/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      deps.push(match[1] || match[2]!);
    }
  }

  return [...new Set(deps)];
}

// Create and export the MCP server
export const filesystemServer = createSdkMcpServer({
  name: "filesystem",
  version: "1.0.0",
  tools: [
    listDirectoriesTool,
    fileTreeTool,
    searchFilesTool,
    analyzeFileTool,
    bulkOperationTool,
  ],
});
