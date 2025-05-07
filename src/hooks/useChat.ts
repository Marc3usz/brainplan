import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { auth } from "@/lib/firebase";

interface Message {
  role: "user" | "assistant" | "tool";
  content: string;
}

interface FileAttachment {
  id: string;
  name: string;
  content: string;
  type: string;
}

interface ErrorResponse {
  error: string;
  details?: string;
  solution?: string;
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const { data: session } = useSession();

  // Get Firebase auth token when component mounts
  useEffect(() => {
    const getFirebaseToken = async () => {
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const token = await currentUser.getIdToken(true);
          setAuthToken(token);
        }
      } catch (error) {
        console.error("Error getting Firebase token:", error);
      }
    };

    getFirebaseToken();
    
    // Set up token refresh
    const intervalId = setInterval(() => {
      getFirebaseToken();
    }, 30 * 60 * 1000); // Refresh every 30 minutes
    
    return () => clearInterval(intervalId);
  }, []);

  const addAttachment = (attachment: FileAttachment) => {
    setAttachments(prev => [...prev, attachment]);
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(attachment => attachment.id !== id));
  };

  const clearAttachments = () => {
    setAttachments([]);
  };

  const sendMessage = async (content: string) => {
    setIsLoading(true);

    // Process the message content to inject file attachments
    let enhancedContent = content;
    
    // Check if message contains attachment references like #1, #file1, etc.
    const attachmentReferences = content.match(/#(\w+)/g);
    const referencedAttachments: FileAttachment[] = [];
    
    if (attachmentReferences && attachmentReferences.length > 0) {
      // Process specific attachment references
      attachmentReferences.forEach(ref => {
        const attachmentId = ref.substring(1); // Remove the # symbol
        const attachment = attachments.find(att => att.id === attachmentId);
        if (attachment) {
          referencedAttachments.push(attachment);
        }
      });
    }
    
    // If there are no specific references but there are attachments, include all attachments
    if (referencedAttachments.length === 0 && attachments.length > 0) {
      referencedAttachments.push(...attachments);
    }
    
    // Add attachment contents to the enhanced message
    if (referencedAttachments.length > 0) {
      enhancedContent = `${content}\n\n`;
      
      referencedAttachments.forEach(attachment => {
        enhancedContent += `<attachment id="${attachment.id}">\n${attachment.content}\n</attachment>\n\n`;
      });
    }

    // Add user message to chat (using the original content to display to the user)
    const userMessage: Message = { role: "user", content };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    try {
      // Prepare headers
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      
      // Add Firebase token if available
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: enhancedContent, // Send the enhanced content with attachments
          history: messages,
        }),
      });

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json().catch(() => ({}));
        
        // Format a helpful error message
        let errorMessage = "Sorry, there was an error processing your message.";
        
        if (errorData.error) {
          errorMessage = `Error: ${errorData.error}`;
          
          // Add details if available
          if (errorData.details) {
            errorMessage += `\n\nDetails: ${errorData.details}`;
          }
          
          // Add solution if available
          if (errorData.solution) {
            errorMessage += `\n\nSolution: ${errorData.solution}`;
          }
          
          // Specific help for Ollama connection issues
          if (errorData.error.includes("Ollama") || 
              (errorData.details && errorData.details.includes("EOF"))) {
            errorMessage += "\n\nTroubleshooting steps:\n" +
              "1. Make sure the Ollama application is running on your computer\n" +
              "2. Check that your model is correctly installed in Ollama\n" +
              "3. Ensure no firewall is blocking the connection\n" +
              "4. Try restarting the Ollama application";
          }
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Add assistant response to chat
      if (data.response) {
        // Check if response is an array or a single message
        if (Array.isArray(data.response.messages)) {
          // Handle array of messages
          const newMessages = data.response.messages.map((msg: Message) => ({
            role: msg.role,
            content: msg.content,
          }));
          setMessages((prev) => [...prev, ...newMessages]);
        } else {
          // Handle single response string or object
          const assistantMessage: Message = {
            role: "assistant",
            content: typeof data.response === 'string' 
              ? data.response 
              : data.response.content || JSON.stringify(data.response),
          };
          setMessages((prev) => [...prev, assistantMessage]);
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // Add error message to chat
      const errorMessage: Message = {
        role: "assistant",
        content: error instanceof Error ? error.message : 
          "Sorry, there was an unexpected error processing your message.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    sendMessage,
    isLoading,
    attachments,
    addAttachment,
    removeAttachment,
    clearAttachments,
  };
}
