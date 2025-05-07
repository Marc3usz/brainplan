import { getTools } from "@/ollama/toolsLoader";
import { Ollama, Message } from "ollama";

const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "deepseek-r1:14b";
const TOOLS_RECURSION_LIMIT = 10;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const SYSTEM_PROMPT = `
  You are a helpful AI assistant.
  
  Ask yourself "What tools can I use?".

  Use markdown formatting for better readability.

  IMPORTANT: Do not simulate tool call, use them directly.
  Do not send full tool response, make it short and concise.

  If asked about current weather, use the getWeather tool, use the getLocation tool for longitude and latitude.
  
  IMPORTANT: Whenever a user message contains a URL/link, you MUST call the scraperLink tool with the URL to process it. This is critical.
  Always look for URLs in user messages and process them using the scraperLink tool.

  IMPORTANT: For user notes functionality, use the following tools:
  - Use getAllNotes to retrieve all notes from the user's index (no parameters needed)
  - Use addNoteToIndex to add a new note title to the index (just provide the noteTitle)
  - Use getNotesIndexFields to get all fields or a specific field from the index
  - Use addNotesIndexField to add a custom field and value to the index
  - Use meaningful titles for indexes, like "business plan for health tracking app", avoid file names as they can change. Make sure the index title helps you recall basic information about the note.
  - You may use notes to store information between sessions, like habits, goals, and other relevant data. This is important for the user to keep track of their progress and for you to provide better assistance.
` as const;

// Initialize Ollama client
const ollamaClient = new Ollama({
  host: OLLAMA_HOST,
});

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Function to check if Ollama server is available
async function checkOllamaConnection(): Promise<boolean> {
  try {
    await ollamaClient.list();
    return true;
  } catch (error) {
    console.warn(`Ollama connection check failed: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

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
      console.error(`Error executing tool ${call.function.name}:`, error);
      results[call.function.name] = {
        error: error instanceof Error ? error.message : String(error),
        toolName: call.function.name,
        arguments: call.function.arguments
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

    // Try with retries
    let lastError: Error | null = null;
    let response;
    
    // Check connection before attempting
    const isConnected = await checkOllamaConnection();
    if (!isConnected) {
      return {
        messages: [
          {
            role: "assistant",
            content: `I'm unable to connect to the Ollama server at ${OLLAMA_HOST}. Please make sure the Ollama service is running and accessible.`,
          },
        ],
      };
    }
    
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`Retry attempt ${attempt} after error: ${lastError?.message}`);
          await delay(RETRY_DELAY * attempt); // Exponential backoff
        }
        
        response = await ollamaClient.chat({
          model: OLLAMA_MODEL,
          messages,
          stream: false,
          tools: getTools(),
        });
        
        // Success, break out of retry loop
        break;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`Attempt ${attempt + 1} failed:`, lastError);
        
        // If we've exhausted all retries, throw the last error
        if (attempt === MAX_RETRIES - 1) {
          throw lastError;
        }
      }
    }

    if (!response) {
      throw new Error("Failed to get response from Ollama after retries");
    }

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
    // Return a more helpful error message
    return {
      messages: [
        {
          role: "assistant",
          content: 
            `I'm having trouble connecting to the AI model. Error: ${error instanceof Error ? error.message : String(error)}. ` +
            `Please ensure the Ollama server is running at ${OLLAMA_HOST} with the model "${OLLAMA_MODEL}" loaded.`,
        },
      ],
    };
  }
}
