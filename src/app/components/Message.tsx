import { Message as OllamaMessage } from "ollama";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useMemo } from "react";

interface FileAttachment {
  id: string;
  name: string;
  content: string;
  type: string;
}

interface MessageProps {
  role: OllamaMessage["role"];
  content: string;
  isLoading?: boolean;
  attachments?: FileAttachment[]; // Add attachments prop
}

export function Message({ role, content, isLoading, attachments = [] }: MessageProps) {
  const isUser = role === "user";

  let thinking: string | null = null;
  let response: string = content;

  if (!isUser && content.includes("<think>")) {
    const parts = content.split("</think>");
    thinking = parts[0]?.replace("<think>", "").trim() || null;
    response = parts.slice(1).join("</think>").trim();
  }
  
  // Format file references in messages, but only for existing attachments
  const formattedContent = useMemo(() => {
    if (!attachments || attachments.length === 0) {
      return response; // No formatting if no attachments
    }
    
    // Match patterns like #file_id or #some_document
    const regex = /#([a-zA-Z0-9_-]+)/g;
    return response.replace(regex, (match) => {
      // Extract the ID without the # symbol
      const id = match.substring(1);
      
      // Check if this ID exists in the attachments array
      const attachmentExists = attachments.some(attachment => attachment.id === id);
      
      if (attachmentExists) {
        // Apply special formatting for valid references
        return `<span class="inline-block px-1.5 py-0.5 mx-0.5 bg-blue-800/40 text-blue-200 border border-blue-700/50 rounded font-medium">${match}</span>`;
      } else {
        // Return the original text for invalid references
        return match;
      }
    });
  }, [response, attachments]);

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-1.5 sm:mb-3`}>
      <div
        className={`p-2 sm:p-3 md:p-4 ${
          isUser
            ? "bg-gray-800 rounded-l-xl sm:rounded-l-2xl rounded-br-xl sm:rounded-br-2xl border border-gray-700"
            : "bg-gray-900 rounded-r-xl sm:rounded-r-2xl rounded-bl-xl sm:rounded-bl-2xl border border-gray-800"
        } max-w-[85%] sm:max-w-[75%] md:max-w-[65%] text-xs sm:text-sm md:text-base shadow-md`}
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
            {/* Use dangerouslySetInnerHTML for the formatted content with file references */}
            {formattedContent.includes('<span class="inline-block') ? (
              <div dangerouslySetInnerHTML={{ __html: formattedContent }} />
            ) : (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{response}</ReactMarkdown>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
