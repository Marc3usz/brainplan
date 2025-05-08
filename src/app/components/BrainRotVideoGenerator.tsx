"use client";

import { useState } from "react";

export function BrainRotVideoGenerator() {
  const [text, setText] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [useSummarization, setUseSummarization] = useState(true);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!text.trim()) return;
    
    setIsLoading(true);
    setError("");
    
    try {
      // Call the API endpoint that handles video generation on the server
      const response = await fetch("/api/generate-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text, summarize: useSummarization }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.status}`);
      }
      
      const data = await response.json();
      setVideoUrl(data.videoUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error generating video:", err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      <div className="p-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">BrainRot Video Generator</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Enter your text below and transform it into an engaging brainrot video with Minecraft gameplay, voice narration, and subtitles.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="text-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Your Text Content
                </label>
                <textarea
                  id="text-input"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter your educational content here..."
                  className="w-full h-64 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  id="summarize-checkbox"
                  type="checkbox"
                  checked={useSummarization}
                  onChange={(e) => setUseSummarization(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="summarize-checkbox" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Automatically summarize text (recommended for better videos)
                </label>
              </div>
              
              <button
                type="submit"
                disabled={isLoading || !text.trim()}
                className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating Video...
                  </div>
                ) : (
                  "Generate Video"
                )}
              </button>
              
              {error && (
                <div className="text-red-500 text-sm mt-2">
                  {error}
                </div>
              )}
            </form>
          </div>
          
          {/* Video Output Section */}
          <div className="flex flex-col">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              {videoUrl ? "Your Generated Video" : "Video Preview"}
            </h2>
            
            <div className="flex-1 bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
              {videoUrl ? (
                <video
                  src={videoUrl}
                  controls
                  className="w-full h-auto"
                  poster="/video-placeholder.png"
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="text-center p-8 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <p>Your video will appear here after generation</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}