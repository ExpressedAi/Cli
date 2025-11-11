/**
 * Git MCP Server
 * Smart git operations including commits, PR analysis, and workflow automation
 */

import { tool, createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { execSync } from "node:child_process";
import { GitStatus, CommitSuggestion } from "../types/index.js";

// Execute git command helper
function gitExec(command: string, cwd: string = process.cwd()): string {
  try {
    return execSync(`git ${command}`, {
      cwd,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
  } catch (error: any) {
    throw new Error(`Git command failed: ${error.message}`);
  }
}

// Git status tool
const gitStatusTool = tool(
  "git_status",
  "Get comprehensive git repository status including branch, changes, and remote info",
  {
    verbose: z.boolean().default(false),
  },
  async ({ verbose }) => {
    try {
      const branch = gitExec("rev-parse --abbrev-ref HEAD");
      const statusOutput = gitExec("status --porcelain");

      // Parse status
      const lines = statusOutput.split("\n").filter((l) => l.trim());
      const staged: string[] = [];
      const unstaged: string[] = [];
      const untracked: string[] = [];

      lines.forEach((line) => {
        const status = line.substring(0, 2);
        const file = line.substring(3);

        if (status[0] !== " " && status[0] !== "?") {
          staged.push(file);
        }
        if (status[1] !== " " && status[1] !== "?") {
          unstaged.push(file);
        }
        if (status[0] === "?" && status[1] === "?") {
          untracked.push(file);
        }
      });

      // Get remote info
      let ahead = 0;
      let behind = 0;
      try {
        const revList = gitExec(`rev-list --left-right --count origin/${branch}...HEAD`);
        const [behindStr, aheadStr] = revList.split("\t");
        behind = parseInt(behindStr || "0");
        ahead = parseInt(aheadStr || "0");
      } catch {
        // No remote tracking branch
      }

      const output = [
        `Branch: ${branch}`,
        `Ahead: ${ahead} | Behind: ${behind}`,
        `\nStaged (${staged.length}):`,
        ...staged.map((f) => `  ✓ ${f}`),
        `\nUnstaged (${unstaged.length}):`,
        ...unstaged.map((f) => `  ✎ ${f}`),
        `\nUntracked (${untracked.length}):`,
        ...untracked.map((f) => `  ? ${f}`),
      ];

      if (verbose) {
        try {
          const lastCommit = gitExec("log -1 --oneline");
          output.push(`\nLast commit: ${lastCommit}`);
        } catch {
          // No commits yet
        }
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

// Smart commit suggestion tool
const suggestCommitTool = tool(
  "suggest_commit",
  "Analyze staged changes and suggest a conventional commit message",
  {
    analyzeCode: z.boolean().default(true),
  },
  async ({ analyzeCode }) => {
    try {
      // Get staged diff
      const diff = gitExec("diff --cached");

      if (!diff) {
        return {
          content: [
            {
              type: "text",
              text: "No staged changes to commit",
            },
          ],
        };
      }

      // Analyze changes
      const lines = diff.split("\n");
      const additions = lines.filter((l) => l.startsWith("+") && !l.startsWith("+++")).length;
      const deletions = lines.filter((l) => l.startsWith("-") && !l.startsWith("---")).length;

      // Get affected files
      const files = gitExec("diff --cached --name-only").split("\n");

      // Determine commit type
      let type: CommitSuggestion["type"] = "chore";
      let scope = "";

      if (files.some((f) => f.includes("test"))) {
        type = "test";
        scope = "tests";
      } else if (files.some((f) => f.match(/\.(md|txt)$/))) {
        type = "docs";
        scope = "documentation";
      } else if (additions > deletions * 2) {
        type = "feat";
      } else if (deletions > additions * 2) {
        type = "refactor";
      } else {
        type = "fix";
      }

      // Generate message
      const filesAffected = files.length;
      const mainFile = files[0]?.split("/").pop() || "files";

      const suggestion: CommitSuggestion = {
        type,
        scope: scope || undefined,
        message: `${type}${scope ? `(${scope})` : ""}: update ${mainFile}${filesAffected > 1 ? ` and ${filesAffected - 1} more` : ""}`,
        description: `Modified ${filesAffected} file(s): +${additions} -${deletions} lines`,
      };

      const output = [
        "Suggested commit message:",
        `\n${suggestion.message}`,
        `\n${suggestion.description}`,
        `\nFiles affected:`,
        ...files.map((f) => `  - ${f}`),
        `\nTo commit: git commit -m "${suggestion.message}"`,
      ];

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

// Branch management tool
const branchManagementTool = tool(
  "branch_management",
  "List, create, delete, or switch git branches",
  {
    action: z.enum(["list", "create", "delete", "switch", "compare"]),
    branchName: z.string().optional(),
    baseBranch: z.string().optional(),
  },
  async ({ action, branchName, baseBranch }) => {
    try {
      let output = "";

      switch (action) {
        case "list": {
          const branches = gitExec("branch -a").split("\n");
          const formatted = branches.map((b) => {
            const isCurrent = b.startsWith("*");
            const name = b.replace("*", "").trim();
            return isCurrent ? `→ ${name} (current)` : `  ${name}`;
          });
          output = `Branches:\n${formatted.join("\n")}`;
          break;
        }

        case "create": {
          if (!branchName) {
            throw new Error("Branch name required for create action");
          }
          const base = baseBranch || "HEAD";
          gitExec(`checkout -b ${branchName} ${base}`);
          output = `Created and switched to branch: ${branchName}`;
          break;
        }

        case "switch": {
          if (!branchName) {
            throw new Error("Branch name required for switch action");
          }
          gitExec(`checkout ${branchName}`);
          output = `Switched to branch: ${branchName}`;
          break;
        }

        case "delete": {
          if (!branchName) {
            throw new Error("Branch name required for delete action");
          }
          gitExec(`branch -d ${branchName}`);
          output = `Deleted branch: ${branchName}`;
          break;
        }

        case "compare": {
          if (!branchName) {
            throw new Error("Branch name required for compare action");
          }
          const base = baseBranch || "main";
          const comparison = gitExec(`diff --stat ${base}...${branchName}`);
          output = `Comparing ${base}...${branchName}:\n\n${comparison}`;
          break;
        }
      }

      return {
        content: [
          {
            type: "text",
            text: output,
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

// Commit history analysis
const analyzeHistoryTool = tool(
  "analyze_history",
  "Analyze commit history for patterns, contributors, and statistics",
  {
    limit: z.number().default(50),
    since: z.string().optional(),
    author: z.string().optional(),
  },
  async ({ limit, since, author }) => {
    try {
      let command = `log --pretty=format:"%h|%an|%ae|%ar|%s" -${limit}`;
      if (since) {
        command += ` --since="${since}"`;
      }
      if (author) {
        command += ` --author="${author}"`;
      }

      const log = gitExec(command);
      const commits = log.split("\n").map((line) => {
        const [hash, name, email, date, message] = line.split("|");
        return { hash, name, email, date, message };
      });

      // Statistics
      const authors = new Map<string, number>();
      const commitTypes = new Map<string, number>();

      commits.forEach((commit) => {
        authors.set(commit.name!, (authors.get(commit.name!) || 0) + 1);

        const type = commit.message!.split(":")[0]!.split("(")[0]!.trim();
        commitTypes.set(type, (commitTypes.get(type) || 0) + 1);
      });

      const output = [
        `Analyzed ${commits.length} commits`,
        `\nTop Contributors:`,
        ...Array.from(authors.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, count]) => `  ${name}: ${count} commits`),
        `\nCommit Types:`,
        ...Array.from(commitTypes.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([type, count]) => `  ${type}: ${count}`),
        `\nRecent Commits:`,
        ...commits.slice(0, 10).map((c) => `  ${c.hash} - ${c.message} (${c.date})`),
      ];

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

// Conflict detection and assistance
const conflictHelperTool = tool(
  "conflict_helper",
  "Detect and analyze merge conflicts, suggest resolutions",
  {},
  async () => {
    try {
      // Check for conflicts
      const status = gitExec("status --porcelain");
      const conflicts = status
        .split("\n")
        .filter((line) => line.startsWith("UU") || line.startsWith("AA"))
        .map((line) => line.substring(3));

      if (conflicts.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No merge conflicts detected",
            },
          ],
        };
      }

      const output = [
        `Found ${conflicts.length} conflicted files:`,
        ...conflicts.map((file) => `  ⚠ ${file}`),
        `\nTo resolve:`,
        `1. Edit conflicted files`,
        `2. Remove conflict markers (<<<<<<<, =======, >>>>>>>)`,
        `3. Stage resolved files: git add <file>`,
        `4. Continue: git commit or git rebase --continue`,
      ];

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

// Create and export the Git MCP server
export const gitServer = createSdkMcpServer({
  name: "git",
  version: "1.0.0",
  tools: [
    gitStatusTool,
    suggestCommitTool,
    branchManagementTool,
    analyzeHistoryTool,
    conflictHelperTool,
  ],
});
