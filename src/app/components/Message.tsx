import { Message as OllamaMessage } from "ollama";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MessageProps {
  role: OllamaMessage["role"];
  content: string;
  isLoading?: boolean;
}

export function Message({ role, content, isLoading }: MessageProps) {
  const isUser = role === "user";

  let thinking: string | null = null;
  let response: string = content;

  if (!isUser && content.includes("<think>")) {
    const parts = content.split("</think>");
    thinking = parts[0]?.replace("<think>", "").trim() || null;
    response = parts.slice(1).join("</think>").trim();
  }

  return (
    <div
      className={`p-4 rounded-lg ${
        isUser
          ? "bg-blue-600 ml-auto hover:bg-blue-700"
          : "bg-gray-800 hover:bg-gray-750"
      } max-w-[80%] transition-colors duration-200`}
    >
      <p className="text-sm font-semibold mb-1 text-gray-300">
        {isUser ? "You" : "Assistant"}
      </p>
      {isLoading ? (
        <div className="animate-pulse">
          <p className="text-gray-100">Processing...</p>
        </div>
      ) : (
        <div className="text-gray-100 prose prose-invert max-w-none">
          {!isUser && thinking && (
            <div className="mb-3 p-2 bg-gray-800/50 rounded text-xs text-gray-400 border border-gray-700/50">
              <p className="mb-1 text-gray-500">Thinking:</p>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {thinking}
              </ReactMarkdown>
            </div>
          )}
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{response}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}
