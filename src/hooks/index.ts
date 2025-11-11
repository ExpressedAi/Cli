/**
 * Comprehensive Hook System
 * Provides monitoring, validation, and automation
 */

import {
  HookCallback,
  HookCallbackMatcher,
  HookJSONOutput,
} from "@anthropic-ai/claude-agent-sdk";
import { UI } from "../utils/ui.js";
import { HookMetadata } from "../types/index.js";
import fs from "node:fs/promises";
import path from "node:path";

// Session start hook - runs when a session begins
export const sessionStartHook: HookCallback = async (input, toolUseID, options) => {
  if (input.hook_event_name !== "SessionStart") {
    return { continue: true };
  }

  UI.header("🚀 DevMaster Session Started");
  UI.info(`Session ID: ${input.session_id}`);
  UI.info(`Source: ${input.source}`);
  UI.info(`Working Directory: ${input.cwd}`);
  UI.divider();

  return {
    continue: true,
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext: "DevMaster CLI initialized with full MCP servers and agents.",
    },
  };
};

// Session end hook - runs when a session ends
export const sessionEndHook: HookCallback = async (input, toolUseID, options) => {
  if (input.hook_event_name !== "SessionEnd") {
    return { continue: true };
  }

  UI.divider();
  UI.info(`Session ended: ${input.reason}`);
  UI.success("Thank you for using DevMaster CLI!");

  return { continue: true };
};

// Pre-tool-use validation hook
export const preToolUseHook: HookCallback = async (input, toolUseID, options) => {
  if (input.hook_event_name !== "PreToolUse") {
    return { continue: true };
  }

  const startTime = Date.now();

  // Log tool usage (verbose mode)
  if (process.env.VERBOSE === "true") {
    UI.info(`Tool: ${input.tool_name}`);
  }

  // Validate dangerous operations
  if (input.tool_name === "Bash") {
    const command = (input.tool_input as any).command;

    // Block dangerous commands
    const dangerousPatterns = [
      /rm\s+-rf\s+\/(?!home\/|tmp\/)/,  // Prevent rm -rf on system dirs
      /dd\s+if=/,                        // Prevent dd operations
      />\s*\/dev\/sd/,                   // Prevent writing to raw devices
      /mkfs/,                            // Prevent formatting
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(command)) {
        return {
          continue: false,
          decision: "block",
          systemMessage: `Blocked dangerous command: ${command}`,
          hookSpecificOutput: {
            hookEventName: "PreToolUse",
            permissionDecision: "deny",
            permissionDecisionReason: "Command matches dangerous pattern",
          },
        };
      }
    }
  }

  // Validate file writes to system directories
  if (input.tool_name === "Write" || input.tool_name === "Edit") {
    const filePath = (input.tool_input as any).file_path || (input.tool_input as any).filePath;

    if (filePath && (filePath.startsWith("/etc/") || filePath.startsWith("/sys/"))) {
      return {
        continue: false,
        decision: "block",
        systemMessage: "Blocked write to system directory",
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "deny",
          permissionDecisionReason: "Cannot write to system directories",
        },
      };
    }
  }

  return {
    continue: true,
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "allow",
    },
  };
};

// Post-tool-use monitoring hook
export const postToolUseHook: HookCallback = async (input, toolUseID, options) => {
  if (input.hook_event_name !== "PostToolUse") {
    return { continue: true };
  }

  const metadata: HookMetadata = {
    toolName: input.tool_name,
    success: !(input.tool_response as any)?.isError,
    error: (input.tool_response as any)?.error,
  };

  // Log errors
  if (!metadata.success) {
    UI.error(`Tool ${input.tool_name} failed: ${metadata.error}`);
  }

  // Track file modifications for auto-backup
  if (["Write", "Edit"].includes(input.tool_name)) {
    const filePath = (input.tool_input as any).file_path || (input.tool_input as any).filePath;
    if (filePath && process.env.AUTO_BACKUP === "true") {
      await createBackup(filePath);
    }
  }

  return { continue: true };
};

// Notification hook - handles system notifications
export const notificationHook: HookCallback = async (input, toolUseID, options) => {
  if (input.hook_event_name !== "Notification") {
    return { continue: true };
  }

  if (input.title) {
    UI.info(`${input.title}: ${input.message}`);
  } else {
    UI.info(input.message);
  }

  return { continue: true };
};

// Stop hook - runs when execution is interrupted
export const stopHook: HookCallback = async (input, toolUseID, options) => {
  if (input.hook_event_name !== "Stop") {
    return { continue: true };
  }

  UI.warning("Execution interrupted");

  return { continue: true };
};

// Pre-compact hook - runs before context compaction
export const preCompactHook: HookCallback = async (input, toolUseID, options) => {
  if (input.hook_event_name !== "PreCompact") {
    return { continue: true };
  }

  UI.info(`Compacting context (trigger: ${input.trigger})`);
  UI.info("Preserving important context...");

  return { continue: true };
};

// Helper function to create file backups
async function createBackup(filePath: string): Promise<void> {
  try {
    const backupDir = path.join(process.cwd(), ".devmaster", "backups");
    await fs.mkdir(backupDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/:/g, "-");
    const backupName = `${path.basename(filePath)}.${timestamp}.backup`;
    const backupPath = path.join(backupDir, backupName);

    const content = await fs.readFile(filePath, "utf-8");
    await fs.writeFile(backupPath, content);

    if (process.env.VERBOSE === "true") {
      UI.success(`Backup created: ${backupPath}`);
    }
  } catch (error) {
    // Silently fail backup creation
  }
}

// Performance monitoring hook
export const performanceMonitorHook: HookCallback = async (input, toolUseID, options) => {
  // Monitor slow operations
  if (input.hook_event_name === "PostToolUse") {
    const duration = (input as any).duration_ms;
    if (duration && duration > 5000) {
      UI.warning(`Slow operation detected: ${input.tool_name} took ${(duration / 1000).toFixed(2)}s`);
    }
  }

  return { continue: true };
};

// Export hook configurations
export const defaultHooks: Partial<Record<string, HookCallbackMatcher[]>> = {
  SessionStart: [
    {
      hooks: [sessionStartHook],
    },
  ],
  SessionEnd: [
    {
      hooks: [sessionEndHook],
    },
  ],
  PreToolUse: [
    {
      hooks: [preToolUseHook],
    },
  ],
  PostToolUse: [
    {
      hooks: [postToolUseHook, performanceMonitorHook],
    },
  ],
  Notification: [
    {
      hooks: [notificationHook],
    },
  ],
  Stop: [
    {
      hooks: [stopHook],
    },
  ],
  PreCompact: [
    {
      hooks: [preCompactHook],
    },
  ],
};

// Hooks are already exported above with 'export const'
