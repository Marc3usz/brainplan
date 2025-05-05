import { getTools } from "@/ollama/toolsLoader";
import { Ollama, Message } from "ollama";

const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen3:14b";
const TOOLS_RECURSION_LIMIT = 10;
const SYSTEM_PROMPT = `
  You are a helpful AI assistant.
  
  Ask yourself "What tools can I use?".

  Use markdown formatting for better readability.

  IMPORTANT: Do not simulate tool call, use them directly.
  Do not send full tool response, make it short and concise.

  If asked about current weather, use the getWeather tool, use the getLocation tool for longitude and latitude.
` as const;

// Initialize Ollama client
const ollamaClient = new Ollama({
  host: OLLAMA_HOST,
});

interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

async function handleToolCalls(
  toolCalls: unknown[]
): Promise<Record<string, unknown>> {
  const tools = getTools();
  const results: Record<string, unknown> = {};

  for (const call of toolCalls as ToolCall[]) {
    const tool = tools.find((t) => t.function.name === call.function.name);
    if (!tool) {
      results[call.function.name] = { error: "Tool not found" };
      continue;
    }

    try {
      const args = call.function.arguments;
      const result = await tool.execute(args);
      results[call.function.name] = result;
    } catch (error) {
      results[call.function.name] = {
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  return results;
}
export async function generateResponse(
  message: string,
  history: Message[] = [],
  recursionCount: number = 0
): Promise<{ messages: Message[] }> {
  if (recursionCount > TOOLS_RECURSION_LIMIT) {
    return {
      messages: [
        {
          role: "assistant",
          content:
            "I'm having trouble processing your request. The tool calls are taking too long.",
        },
      ],
    };
  }

  try {
    const messages: Message[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history,
    ];

    if (recursionCount === 0) {
      messages.push({ role: "user", content: message });
    }

    const response = await ollamaClient.chat({
      model: OLLAMA_MODEL,
      messages,
      stream: false,
      tools: getTools(),
    });

    // if there are no tool calls, return the response content directly
    if (!response.message?.tool_calls) {
      return {
        messages: [
          {
            role: "assistant",
            content:
              response.message?.content ||
              "I'm having trouble processing your request. Please try again.",
          },
        ],
      };
    }

    const toolResults = await handleToolCalls(response.message.tool_calls);

    // Add tool responses to message history
    const toolMessages: Message[] = [];
    for (const result of Object.values(toolResults)) {
      toolMessages.push({
        role: "tool",
        content: JSON.stringify(result),
      });
    }

    const nextResponse = await generateResponse(
      message,
      [...messages, ...toolMessages],
      recursionCount + 1
    );
    return {
      messages: [...toolMessages, ...nextResponse.messages],
    };
  } catch (error) {
    console.error("Error calling Ollama:", error);
    throw error;
  }
}
