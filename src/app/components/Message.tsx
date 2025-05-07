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
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-2 sm:mb-3`}>
      <div
        className={`p-3 sm:p-4 ${
          isUser
            ? "bg-gray-800 rounded-l-2xl rounded-br-2xl border border-gray-700"
            : "bg-gray-900 rounded-r-2xl rounded-bl-2xl border border-gray-800"
        } max-w-[70%] sm:max-w-[60%] md:max-w-[55%] text-sm sm:text-base shadow-md`}
      >
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
    </div>
  );
}
