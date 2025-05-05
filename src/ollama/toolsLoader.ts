import { Tool } from "ollama";
import ollamaTools from "./tools";

// Extend the Ollama Tool type to include execute function
export interface ToolFunction extends Tool {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute: (...args: any[]) => Promise<any>;
}

export function getTools() {
  return ollamaTools.filter((item) => "execute" in item) as ToolFunction[];
}

export { ollamaTools };
