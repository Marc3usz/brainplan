import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { auth } from "@/lib/firebase";

interface Message {
  role: "user" | "assistant" | "tool";
  content: string;
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
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

  const sendMessage = async (content: string) => {
    setIsLoading(true);

    // Add user message to chat
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
          message: content,
          history: messages,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
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
        content: "Sorry, there was an error processing your message.",
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
  };
}
