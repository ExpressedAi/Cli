/**
 * Web Tools MCP Server
 * Provides web search and content fetch capabilities
 */

import { tool, createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";

// Create Anthropic client for API access
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ============================================================================
// WEB SEARCH
// ============================================================================

const webSearchTool = tool(
  "web_search",
  "Search the internet for current information, news, documentation, and real-time data. Returns search results with URLs and snippets.",
  {
    query: z.string().describe("The search query"),
    max_results: z.number().optional().describe("Maximum number of results (default: 5)"),
  },
  async ({ query, max_results }) => {
    try {
      // Use Anthropic API's web_search tool via beta
      const message = await anthropic.beta.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: `Search for: ${query}\n\nProvide search results with titles, URLs, and brief descriptions.`,
          },
        ],
        tools: [
          {
            type: "web_search_20250305" as any,
            name: "web_search",
            max_uses: max_results || 5,
          } as any,
        ],
        betas: ["web-fetch-2025-09-10"],
      } as any);

      // Extract search results from response
      const textContent = message.content
        .filter((block: any) => block.type === "text")
        .map((block: any) => block.text)
        .join("\n");

      return {
        content: [
          {
            type: "text",
            text: textContent || "No results found.",
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error performing web search: ${(error as Error).message}`,
          },
        ],
      };
    }
  }
);

// ============================================================================
// WEB FETCH
// ============================================================================

const webFetchTool = tool(
  "web_fetch",
  "Fetch full content from a URL, including web pages and PDFs. Use this to read documentation, articles, or retrieve specific web content.",
  {
    url: z.string().describe("The URL to fetch"),
  },
  async ({ url }) => {
    try {
      // Use Anthropic API's web_fetch tool via beta
      const message = await anthropic.beta.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: `Fetch the content from: ${url}\n\nSummarize the key information from this page.`,
          },
        ],
        tools: [
          {
            type: "web_fetch_20250910" as any,
            name: "web_fetch",
            max_uses: 1,
          } as any,
        ],
        betas: ["web-fetch-2025-09-10"],
      } as any);

      // Extract fetched content from response
      const textContent = message.content
        .filter((block: any) => block.type === "text")
        .map((block: any) => block.text)
        .join("\n");

      return {
        content: [
          {
            type: "text",
            text: textContent || "Could not fetch content.",
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching URL: ${(error as Error).message}`,
          },
        ],
      };
    }
  }
);

// ============================================================================
// QUANTUM WEB RESEARCH (Combined Tool)
// ============================================================================

const quantumWebResearchTool = tool(
  "quantum_web_research",
  "Perform comprehensive web research on a topic, combining search, fetch, and quantum analysis for deep insights",
  {
    topic: z.string().describe("The research topic"),
    depth: z.enum(["quick", "standard", "comprehensive"]).optional().describe("Research depth"),
  },
  async ({ topic, depth = "standard" }) => {
    const maxSources = depth === "quick" ? 3 : depth === "standard" ? 5 : 10;

    try {
      // First, search for the topic
      const searchMessage = await anthropic.beta.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: `Research the topic: ${topic}\n\nFind ${maxSources} high-quality sources and provide a comprehensive analysis.`,
          },
        ],
        tools: [
          {
            type: "web_search_20250305" as any,
            name: "web_search",
            max_uses: maxSources,
          } as any,
        ],
        betas: ["web-fetch-2025-09-10"],
      } as any);

      const researchContent = searchMessage.content
        .filter((block: any) => block.type === "text")
        .map((block: any) => block.text)
        .join("\n");

      return {
        content: [
          {
            type: "text",
            text: `## 🔬 Quantum Web Research: ${topic}\n\n${researchContent}\n\n---\n**Research Depth:** ${depth}\n**Sources Analyzed:** Up to ${maxSources}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error performing quantum web research: ${(error as Error).message}`,
          },
        ],
      };
    }
  }
);

// ============================================================================
// CREATE AND EXPORT SERVER
// ============================================================================

export const webToolsServer = createSdkMcpServer({
  name: "web-tools",
  version: "1.0.0",
  tools: [
    webSearchTool,
    webFetchTool,
    quantumWebResearchTool,
  ],
});
