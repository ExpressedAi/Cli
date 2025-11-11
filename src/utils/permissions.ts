/**
 * Permission management utilities
 */

import {
  CanUseTool,
  PermissionResult,
  PermissionUpdate,
} from "@anthropic-ai/claude-agent-sdk";
import { UI } from "./ui.js";

export interface PermissionRule {
  toolName: string;
  pattern?: RegExp;
  allow: boolean;
  reason?: string;
}

export class PermissionManager {
  private rules: PermissionRule[] = [];
  private deniedTools: Set<string> = new Set();
  private autoApprovePatterns: Map<string, RegExp[]> = new Map();

  constructor(private interactive: boolean = true) {}

  addRule(rule: PermissionRule): void {
    this.rules.push(rule);
  }

  addAutoApprovePattern(toolName: string, pattern: RegExp): void {
    if (!this.autoApprovePatterns.has(toolName)) {
      this.autoApprovePatterns.set(toolName, []);
    }
    this.autoApprovePatterns.get(toolName)!.push(pattern);
  }

  createCanUseTool(): CanUseTool {
    return async (toolName, input, options) => {
      // Check explicit rules first
      for (const rule of this.rules) {
        if (rule.toolName === toolName || rule.toolName === "*") {
          if (rule.pattern) {
            const inputStr = JSON.stringify(input);
            if (rule.pattern.test(inputStr)) {
              return this.createPermissionResult(rule.allow, rule.reason);
            }
          } else {
            return this.createPermissionResult(rule.allow, rule.reason);
          }
        }
      }

      // Check denied tools
      if (this.deniedTools.has(toolName)) {
        return {
          behavior: "deny",
          message: `Tool ${toolName} has been denied by user`,
        };
      }

      // Check auto-approve patterns
      const patterns = this.autoApprovePatterns.get(toolName);
      if (patterns) {
        const inputStr = JSON.stringify(input);
        for (const pattern of patterns) {
          if (pattern.test(inputStr)) {
            return {
              behavior: "allow",
              updatedInput: input,
            };
          }
        }
      }

      // Interactive prompt if enabled
      if (this.interactive) {
        return await this.promptUser(toolName, input, options);
      }

      // Default allow
      return {
        behavior: "allow",
        updatedInput: input,
      };
    };
  }

  private createPermissionResult(
    allow: boolean,
    reason?: string
  ): PermissionResult {
    if (allow) {
      return {
        behavior: "allow",
        updatedInput: {},
      };
    } else {
      return {
        behavior: "deny",
        message: reason || "Access denied by permission rule",
      };
    }
  }

  private async promptUser(
    toolName: string,
    input: any,
    options: { signal: AbortSignal; suggestions?: PermissionUpdate[] }
  ): Promise<PermissionResult> {
    console.log(`\n${UI.color("Permission Request:", "yellow")}`);
    console.log(`Tool: ${UI.bold(toolName)}`);
    console.log(`Input: ${JSON.stringify(input, null, 2)}`);

    if (options.suggestions && options.suggestions.length > 0) {
      console.log(`\nSuggested permissions:`);
      options.suggestions.forEach((s, i) => {
        console.log(`  ${i + 1}. ${s.type}`);
      });
    }

    const readline = await import("readline");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      rl.question(
        `\nAllow this tool? [y/n/always/never]: `,
        (answer) => {
          rl.close();
          const response = answer.toLowerCase().trim();

          switch (response) {
            case "y":
            case "yes":
              resolve({
                behavior: "allow",
                updatedInput: input,
              });
              break;

            case "always":
              this.addRule({ toolName, allow: true });
              UI.success(`Always allowing ${toolName}`);
              resolve({
                behavior: "allow",
                updatedInput: input,
              });
              break;

            case "never":
              this.deniedTools.add(toolName);
              UI.warning(`Never allowing ${toolName} in this session`);
              resolve({
                behavior: "deny",
                message: `User denied ${toolName}`,
              });
              break;

            case "n":
            case "no":
            default:
              resolve({
                behavior: "deny",
                message: `User denied ${toolName}`,
              });
              break;
          }
        }
      );
    });
  }

  // Preset permission configurations
  static createSafeMode(): PermissionManager {
    const pm = new PermissionManager(true);

    // Deny dangerous operations
    pm.addRule({
      toolName: "Bash",
      pattern: /rm\s+-rf/,
      allow: false,
      reason: "Dangerous deletion command blocked",
    });

    pm.addRule({
      toolName: "Write",
      pattern: /\/etc\/|\/sys\/|\/proc\//,
      allow: false,
      reason: "System file write blocked",
    });

    return pm;
  }

  static createAutoApproveMode(): PermissionManager {
    const pm = new PermissionManager(false);

    // Auto-approve safe read operations
    pm.addAutoApprovePattern("Read", /.*/);
    pm.addAutoApprovePattern("Glob", /.*/);
    pm.addAutoApprovePattern("Grep", /.*/);

    return pm;
  }

  static createDevMode(): PermissionManager {
    const pm = new PermissionManager(true);

    // Auto-approve common dev operations
    pm.addAutoApprovePattern("Read", /.*/);
    pm.addAutoApprovePattern("Glob", /.*/);
    pm.addAutoApprovePattern("Grep", /.*/);
    pm.addAutoApprovePattern("Bash", /git\s+/);
    pm.addAutoApprovePattern("Bash", /npm\s+(install|test|run)/);

    return pm;
  }
}
