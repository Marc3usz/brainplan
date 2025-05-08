"use client";

import { useState, useEffect, useRef } from "react";
import { useChat } from "@/hooks/useChat";
import { Message } from "./Message";

export function ChatInterface() {
  const [message, setMessage] = useState("");
  const { messages, sendMessage, isLoading } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);

  // Get Google API credentials from environment variables
  const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessage(message);
      setMessage("");
    }
  };

  const handleShareCalendar = async () => {
    setIsSharing(true);
    try {
      // Check if the Google API client is loaded
      if (!window.gapi) {
        await loadGoogleApi();
      }
      
      // Initialize the Google API client
      await window.gapi.client.init({
        apiKey: googleApiKey,
        clientId: googleClientId,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
        scope: 'https://www.googleapis.com/auth/calendar.readonly',
      });

      // Sign in the user
      const authInstance = window.gapi.auth2.getAuthInstance();
      await authInstance.signIn();
      
      // Fetch calendar data
      const response = await window.gapi.client.calendar.events.list({
        'calendarId': 'primary',
        'timeMin': (new Date()).toISOString(),
        'showDeleted': false,
        'singleEvents': true,
        'maxResults': 10,
        'orderBy': 'startTime'
      });
      
      console.log('Google Calendar data:', response.result);
      alert('Calendar data has been logged to the console.');
    } catch (error) {
      console.error('Error sharing calendar:', error);
      alert('Failed to access Google Calendar. Check console for details.');
    } finally {
      setIsSharing(false);
    }
  };

  const loadGoogleApi = () => {
    return new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        window.gapi.load('client:auth2', () => {
          resolve();
        });
      };
      script.onerror = (error) => reject(error);
      document.body.appendChild(script);
    });
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4 bg-gray-900 text-gray-100">
      <div className="flex-1 overflow-y-auto mb-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800">
        {messages
          .filter((msg) => msg.role !== "tool")
          .map((msg, index) => (
            <Message key={index} role={msg.role} content={msg.content} />
          ))}
        {isLoading && <Message role="assistant" content="" isLoading={true} />}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={handleShareCalendar}
          disabled={isSharing}
          className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900"
        >
          {isSharing ? (
            <>
              <svg className="inline-block animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Connecting to Google Calendar...
            </>
          ) : (
            "Share Google Calendar"
          )}
        </button>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-3 bg-gray-800 border border-gray-700 rounded-md text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

// Add TypeScript types for the Google API
declare global {
  interface Window {
    gapi: any;
  }
}
