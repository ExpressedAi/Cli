import { query, tool, createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import path from "node:path";
import fs from "node:fs/promises";

/**
 * Minimal MCP tool that gives Claude awareness of directories it can work with.
 * Claude can then ask to call this tool while helping you scaffold repos.
 */
const listDirectoriesTool = tool(
  "list_directories",
  "List the folders inside a path so Claude can plan where to add files.",
  {
    path: z.string().default("."),
  },
  async ({ path: relativePath }) => {
    const targetPath = path.resolve(process.cwd(), relativePath);
    const entries = await fs.readdir(targetPath, { withFileTypes: true });
    const formatted = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => `📁 ${entry.name}`)
      .join("\n");

    return {
      content: [
        {
          type: "text",
          text:
            formatted.length > 0
              ? `Directories under ${targetPath}:\n${formatted}`
              : `No directories found under ${targetPath}.`,
        },
      ],
    };
  },
);

const localFsServer = createSdkMcpServer({
  name: "local-fs",
  version: "0.1.0",
  tools: [listDirectoriesTool],
});

async function run() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error(
      "ANTHROPIC_API_KEY is not set. Export it before running the agent CLI.",
    );
    process.exit(1);
  }

  const [, , ...cliArgs] = process.argv;
  const prompt = cliArgs.join(" ").trim() || "Help me plan my GitHub repo structure.";

  const stream = query({
    prompt,
    options: {
      systemPrompt: {
        type: "preset",
        preset: "claude_code",
        append:
          "\nYou are initializing a GitHub project workspace. Suggest sensible file trees and call tools when needed.",
      },
      includePartialMessages: true,
      mcpServers: {
        local: localFsServer,
      },
      settingSources: ["project"],
    },
  });

  for await (const message of stream) {
    switch (message.type) {
      case "assistant":
        console.log(`Claude: ${message.message.content?.map((part) => ("text" in part ? part.text : "")).join("")}`);
        break;
      case "stream_event":
        if (message.event.type === "content_block_delta" && message.event.delta.type === "text_delta") {
          process.stdout.write(message.event.delta.text);
        }
        break;
      case "result":
        console.log("\n---\nSession complete");
        console.log(`Turns: ${message.num_turns}`);
        if ("result" in message) {
          console.log(`Result summary: ${message.result}`);
        }
        break;
      case "system":
        if (message.subtype === "init") {
          console.log(`Initialized session ${message.session_id} using model ${message.model}`);
        }
        break;
      default:
        // Surface other message types for debugging while keeping output short.
        console.log(`Received event: ${message.type}`);
    }
  }
}

run().catch((err) => {
  console.error("Agent CLI run failed:", err);
  process.exit(1);
});
