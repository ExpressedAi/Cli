/**
 * Streaming utilities for handling SDK responses
 */

import {
  SDKMessage,
  SDKAssistantMessage,
  SDKResultMessage,
  SDKSystemMessage,
} from "@anthropic-ai/claude-agent-sdk";
import { UI } from "./ui.js";

export interface StreamStats {
  turns: number;
  totalCost: number;
  duration: number;
  inputTokens: number;
  outputTokens: number;
}

export class StreamHandler {
  private currentText: string = "";
  private stats: Partial<StreamStats> = {};

  async handleStream(
    stream: AsyncGenerator<SDKMessage, void>,
    options: {
      verbose?: boolean;
      onAssistant?: (message: SDKAssistantMessage) => void;
      onResult?: (message: SDKResultMessage) => void;
      onSystem?: (message: SDKSystemMessage) => void;
    } = {}
  ): Promise<StreamStats> {
    for await (const message of stream) {
      await this.handleMessage(message, options);
    }

    return this.stats as StreamStats;
  }

  private async handleMessage(
    message: SDKMessage,
    options: {
      verbose?: boolean;
      onAssistant?: (message: SDKAssistantMessage) => void;
      onResult?: (message: SDKResultMessage) => void;
      onSystem?: (message: SDKSystemMessage) => void;
    }
  ): Promise<void> {
    switch (message.type) {
      case "assistant":
        this.handleAssistantMessage(message, options);
        break;

      case "stream_event":
        this.handleStreamEvent(message);
        break;

      case "result":
        this.handleResultMessage(message, options);
        break;

      case "system":
        this.handleSystemMessage(message, options);
        break;

      case "user":
        if (options.verbose) {
          UI.info(`User message received`);
        }
        break;

      default:
        if (options.verbose) {
          UI.warning(`Unknown message type: ${(message as any).type}`);
        }
    }
  }

  private handleAssistantMessage(
    message: SDKAssistantMessage,
    options: { onAssistant?: (message: SDKAssistantMessage) => void }
  ): void {
    if (this.currentText) {
      console.log(); // New line after streaming
      this.currentText = "";
    }

    options.onAssistant?.(message);
  }

  private handleStreamEvent(message: any): void {
    if (
      message.event.type === "content_block_delta" &&
      message.event.delta.type === "text_delta"
    ) {
      const text = message.event.delta.text;
      process.stdout.write(text);
      this.currentText += text;
    }
  }

  private handleResultMessage(
    message: SDKResultMessage,
    options: { onResult?: (message: SDKResultMessage) => void }
  ): void {
    if (this.currentText) {
      console.log(); // Ensure we're on a new line
      this.currentText = "";
    }

    this.stats = {
      turns: message.num_turns,
      totalCost: message.total_cost_usd,
      duration: message.duration_ms,
      inputTokens: message.usage.input_tokens,
      outputTokens: message.usage.output_tokens,
    };

    options.onResult?.(message);
  }

  private handleSystemMessage(
    message: any,
    options: {
      verbose?: boolean;
      onSystem?: (message: any) => void;
    }
  ): void {
    if (message.subtype === "init") {
      if (options.verbose) {
        UI.info(`Session ${message.session_id} initialized`);
        UI.info(`Model: ${message.model}`);
        if (message.tools) {
          UI.info(`Tools: ${message.tools.length} available`);
        }
        if (message.mcp_servers && message.mcp_servers.length > 0) {
          UI.info(`MCP Servers: ${message.mcp_servers.map((s: any) => s.name).join(", ")}`);
        }
      }
    } else if (message.subtype === "compact_boundary") {
      if (options.verbose && message.compact_metadata) {
        UI.info(`Context compacted (${message.compact_metadata.pre_tokens} tokens)`);
      }
    }

    options.onSystem?.(message);
  }

  reset(): void {
    this.currentText = "";
    this.stats = {};
  }
}

export function formatStats(stats: StreamStats): string {
  const lines = [
    `Turns: ${stats.turns}`,
    `Duration: ${(stats.duration / 1000).toFixed(2)}s`,
    `Tokens: ${stats.inputTokens} in / ${stats.outputTokens} out`,
    `Cost: $${stats.totalCost.toFixed(4)}`,
  ];
  return lines.join(" | ");
}

export async function* streamUserInput(): AsyncGenerator<string, void> {
  const readline = await import("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    while (true) {
      const input = await new Promise<string>((resolve) => {
        rl.question(UI.color("You: ", "cyan"), (answer) => {
          resolve(answer);
        });
      });

      if (input.toLowerCase() === "exit" || input.toLowerCase() === "quit") {
        break;
      }

      yield input;
    }
  } finally {
    rl.close();
  }
}
