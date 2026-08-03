#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import OpenAI from "openai";
import { z } from "zod";

const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const DEFAULT_SYSTEM =
  process.env.CHATGPT_SYSTEM_PROMPT ||
  "You are ChatGPT. Answer clearly and helpfully. Prefer concise, actionable replies.";

function getApiKey() {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "Missing OPENAI_API_KEY. Set it in env or in .cursor/mcp/chatgpt/.env then reload MCP.",
    );
  }
  return key;
}

function createClient() {
  return new OpenAI({ apiKey: getApiKey() });
}

function buildMessages({ prompt, system, history }) {
  const messages = [];
  messages.push({ role: "system", content: system || DEFAULT_SYSTEM });
  if (Array.isArray(history)) {
    for (const item of history) {
      messages.push({ role: item.role, content: item.content });
    }
  }
  messages.push({ role: "user", content: prompt });
  return messages;
}

async function askOpenAI({ prompt, system, model, history }) {
  const client = createClient();
  const response = await client.chat.completions.create({
    model: model || DEFAULT_MODEL,
    messages: buildMessages({ prompt, system, history }),
  });
  const text = response.choices[0]?.message?.content?.trim();
  if (!text) {
    throw new Error("ChatGPT returned an empty response.");
  }
  return {
    text,
    model: response.model,
    usage: response.usage ?? null,
  };
}

function okText(text) {
  return { content: [{ type: "text", text }] };
}

function errText(error) {
  const message = error instanceof Error ? error.message : String(error);
  return { content: [{ type: "text", text: `Error: ${message}` }], isError: true };
}

function formatReply(result) {
  const usage = result.usage
    ? `\n\n---\nmodel: ${result.model}\nprompt_tokens: ${result.usage.prompt_tokens}\ncompletion_tokens: ${result.usage.completion_tokens}`
    : `\n\n---\nmodel: ${result.model}`;
  return `${result.text}${usage}`;
}

const historyItemSchema = z.object({
  role: z.enum(["user", "assistant"]).describe("Message role"),
  content: z.string().min(1).describe("Message content"),
});

function createServer() {
  const server = new McpServer({
    name: "chatgpt",
    version: "1.0.0",
  });

  server.registerTool(
    "ask_chatgpt",
    {
      title: "Ask ChatGPT",
      description:
        "Send a prompt to OpenAI ChatGPT and return the reply. Use for a second opinion, alternate phrasing, or ChatGPT-specific answers.",
      inputSchema: {
        prompt: z.string().min(1).describe("Question or instruction for ChatGPT"),
        system: z
          .string()
          .optional()
          .describe("Optional system prompt override"),
        model: z
          .string()
          .optional()
          .describe(`OpenAI model id (default: ${DEFAULT_MODEL})`),
      },
    },
    async ({ prompt, system, model }) => {
      try {
        const result = await askOpenAI({ prompt, system, model });
        return okText(formatReply(result));
      } catch (error) {
        return errText(error);
      }
    },
  );

  server.registerTool(
    "chat_with_chatgpt",
    {
      title: "Chat with ChatGPT",
      description:
        "Multi-turn ChatGPT conversation. Pass prior turns in history, plus the next user prompt.",
      inputSchema: {
        prompt: z.string().min(1).describe("Next user message"),
        history: z
          .array(historyItemSchema)
          .optional()
          .describe("Prior user/assistant turns (excluding system)"),
        system: z
          .string()
          .optional()
          .describe("Optional system prompt override"),
        model: z
          .string()
          .optional()
          .describe(`OpenAI model id (default: ${DEFAULT_MODEL})`),
      },
    },
    async ({ prompt, history, system, model }) => {
      try {
        const result = await askOpenAI({ prompt, system, model, history });
        return okText(formatReply(result));
      } catch (error) {
        return errText(error);
      }
    },
  );

  return server;
}

async function main() {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`chatgpt MCP ready (model=${DEFAULT_MODEL})`);
}

main().catch((error) => {
  console.error("Fatal chatgpt MCP error:", error);
  process.exit(1);
});
