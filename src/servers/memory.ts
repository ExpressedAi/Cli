/**
 * Memory Tool MCP Server
 * Provides persistent memory across sessions
 * Implements the Memory Tool API for storing/retrieving quantum insights
 */

import { tool, createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import * as fs from "fs/promises";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Memory directory - stored in project root
const MEMORY_DIR = path.join(__dirname, "../../.memories");

// Ensure memory directory exists
async function ensureMemoryDir() {
  try {
    await fs.access(MEMORY_DIR);
  } catch {
    await fs.mkdir(MEMORY_DIR, { recursive: true });
  }
}

// ============================================================================
// MEMORY VIEW
// ============================================================================

const viewMemoryTool = tool(
  "view_memory",
  "View contents of memory directory or specific memory file. Use this to check what quantum insights have been stored.",
  {
    path: z.string().optional().describe("Path to view (relative to /memories). If omitted, shows directory listing"),
    view_range: z.tuple([z.number(), z.number()]).optional().describe("Line range to view [start, end]"),
  },
  async ({ path: memPath, view_range }) => {
    await ensureMemoryDir();

    try {
      // If no path, list directory
      if (!memPath || memPath === "/" || memPath === "/memories") {
        const files = await fs.readdir(MEMORY_DIR);
        if (files.length === 0) {
          return {
            content: [{ type: "text", text: "Directory: /memories\n(empty)" }],
          };
        }
        const fileList = files.map(f => `- ${f}`).join("\n");
        return {
          content: [{ type: "text", text: `Directory: /memories\n${fileList}` }],
        };
      }

      // Read specific file
      const fullPath = path.join(MEMORY_DIR, memPath.replace(/^\/memories\//, ""));
      const content = await fs.readFile(fullPath, "utf-8");
      const lines = content.split("\n");

      if (view_range) {
        const [start, end] = view_range;
        const selectedLines = lines.slice(start - 1, end);
        return {
          content: [{ type: "text", text: selectedLines.join("\n") }],
        };
      }

      return {
        content: [{ type: "text", text: content }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error viewing memory: ${(error as Error).message}` }],
      };
    }
  }
);

// ============================================================================
// MEMORY CREATE
// ============================================================================

const createMemoryTool = tool(
  "create_memory",
  "Create or overwrite a memory file. Use this to store quantum insights, learned patterns, or important discoveries.",
  {
    path: z.string().describe("Path to create (relative to /memories)"),
    content: z.string().describe("Content to write"),
  },
  async ({ path: memPath, content }) => {
    await ensureMemoryDir();

    try {
      const fullPath = path.join(MEMORY_DIR, memPath.replace(/^\/memories\//, ""));

      // Ensure parent directory exists
      await fs.mkdir(path.dirname(fullPath), { recursive: true });

      await fs.writeFile(fullPath, content, "utf-8");

      return {
        content: [{ type: "text", text: `Memory created: ${memPath}` }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error creating memory: ${(error as Error).message}` }],
      };
    }
  }
);

// ============================================================================
// MEMORY UPDATE (STRING REPLACE)
// ============================================================================

const updateMemoryTool = tool(
  "update_memory",
  "Update a memory file by replacing text. Use this to refine stored insights or update learned patterns.",
  {
    path: z.string().describe("Path to update (relative to /memories)"),
    old_text: z.string().describe("Text to replace"),
    new_text: z.string().describe("New text"),
  },
  async ({ path: memPath, old_text, new_text }) => {
    await ensureMemoryDir();

    try {
      const fullPath = path.join(MEMORY_DIR, memPath.replace(/^\/memories\//, ""));
      let content = await fs.readFile(fullPath, "utf-8");

      if (!content.includes(old_text)) {
        return {
          content: [{ type: "text", text: `Error: Text not found in ${memPath}` }],
        };
      }

      content = content.replace(old_text, new_text);
      await fs.writeFile(fullPath, content, "utf-8");

      return {
        content: [{ type: "text", text: `Memory updated: ${memPath}` }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error updating memory: ${(error as Error).message}` }],
      };
    }
  }
);

// ============================================================================
// MEMORY DELETE
// ============================================================================

const deleteMemoryTool = tool(
  "delete_memory",
  "Delete a memory file or directory. Use this to clean up outdated or irrelevant memories.",
  {
    path: z.string().describe("Path to delete (relative to /memories)"),
  },
  async ({ path: memPath }) => {
    await ensureMemoryDir();

    try {
      const fullPath = path.join(MEMORY_DIR, memPath.replace(/^\/memories\//, ""));

      const stats = await fs.stat(fullPath);
      if (stats.isDirectory()) {
        await fs.rm(fullPath, { recursive: true });
      } else {
        await fs.unlink(fullPath);
      }

      return {
        content: [{ type: "text", text: `Memory deleted: ${memPath}` }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error deleting memory: ${(error as Error).message}` }],
      };
    }
  }
);

// ============================================================================
// QUANTUM MEMORY STORE
// ============================================================================

const storeQuantumInsightTool = tool(
  "store_quantum_insight",
  "Store a quantum insight with automatic categorization and timestamping. Higher-level wrapper for quantum-specific memories.",
  {
    category: z.enum(["pattern", "insight", "learning", "strategy", "neuron_activation", "wormhole_path", "ppq_finding"]).describe("Category of insight"),
    title: z.string().describe("Brief title"),
    content: z.string().describe("Full insight content"),
    metadata: z.object({
      confidence: z.number().optional(),
      neurons_used: z.array(z.string()).optional(),
      vbc_phase: z.string().optional(),
    }).optional().describe("Optional metadata"),
  },
  async ({ category, title, content, metadata }) => {
    await ensureMemoryDir();

    try {
      const timestamp = new Date().toISOString();
      const filename = `${category}/${timestamp}_${title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.md`;
      const fullPath = path.join(MEMORY_DIR, filename);

      // Ensure category directory exists
      await fs.mkdir(path.dirname(fullPath), { recursive: true });

      // Format memory entry
      const entry = `# ${title}\n\n**Category:** ${category}\n**Timestamp:** ${timestamp}\n\n${content}\n\n${metadata ? `## Metadata\n\`\`\`json\n${JSON.stringify(metadata, null, 2)}\n\`\`\`\n` : ""}`;

      await fs.writeFile(fullPath, entry, "utf-8");

      return {
        content: [{ type: "text", text: `Quantum insight stored: /memories/${filename}` }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error storing quantum insight: ${(error as Error).message}` }],
      };
    }
  }
);

// ============================================================================
// SEARCH MEMORIES
// ============================================================================

const searchMemoriesTool = tool(
  "search_memories",
  "Search through stored memories for specific keywords or patterns. Use this to retrieve relevant past insights.",
  {
    query: z.string().describe("Search query"),
    category: z.enum(["pattern", "insight", "learning", "strategy", "neuron_activation", "wormhole_path", "ppq_finding", "all"]).optional().describe("Filter by category"),
  },
  async ({ query, category = "all" }) => {
    await ensureMemoryDir();

    try {
      const results: string[] = [];

      async function searchDir(dir: string) {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          if (entry.isDirectory()) {
            if (category === "all" || entry.name === category) {
              await searchDir(fullPath);
            }
          } else if (entry.isFile() && entry.name.endsWith(".md")) {
            const content = await fs.readFile(fullPath, "utf-8");
            if (content.toLowerCase().includes(query.toLowerCase())) {
              const relativePath = path.relative(MEMORY_DIR, fullPath);
              results.push(`- /memories/${relativePath}`);
            }
          }
        }
      }

      await searchDir(MEMORY_DIR);

      if (results.length === 0) {
        return {
          content: [{ type: "text", text: `No memories found matching: "${query}"` }],
        };
      }

      return {
        content: [{ type: "text", text: `Found ${results.length} matching memories:\n\n${results.join("\n")}` }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error searching memories: ${(error as Error).message}` }],
      };
    }
  }
);

// ============================================================================
// CREATE AND EXPORT SERVER
// ============================================================================

export const memoryServer = createSdkMcpServer({
  name: "memory",
  version: "1.0.0",
  tools: [
    viewMemoryTool,
    createMemoryTool,
    updateMemoryTool,
    deleteMemoryTool,
    storeQuantumInsightTool,
    searchMemoriesTool,
  ],
});
