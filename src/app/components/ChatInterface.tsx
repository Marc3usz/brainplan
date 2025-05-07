"use client";

import { useState, useEffect, useRef } from "react";
import { useChat } from "@/hooks/useChat";
import { Message } from "./Message";
import { createWorker } from 'tesseract.js';
import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

// Typy języków do rozpoznawania tekstu
type LanguageOption = {
  code: string;
  name: string;
};

// Dostępne języki do rozpoznawania tekstu
const languageOptions: LanguageOption[] = [
  { code: 'pol+eng', name: 'Polski + Angielski' },
  { code: 'eng', name: 'Angielski' },
  { code: 'pol', name: 'Polski' },
  { code: 'deu', name: 'Niemiecki' },
  { code: 'fra', name: 'Francuski' },
  { code: 'spa', name: 'Hiszpański' },
  { code: 'ita', name: 'Włoski' },
  { code: 'rus', name: 'Rosyjski' },
  { code: 'ukr', name: 'Ukraiński' },
  { code: 'jpn', name: 'Japoński' },
  { code: 'chi_sim', name: 'Chiński uproszczony' },
];

export function ChatInterface() {
  const [showCamera, setShowCamera] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [isShutter, setIsShutter] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [recognizedText, setRecognizedText] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('pol+eng');

  const handleCameraClick = async () => {
    setPhoto(null);
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      alert('Nie udało się uzyskać dostępu do kamery.');
      setShowCamera(false);
    }
  };

  const handleStopCamera = () => {
    setShowCamera(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const handleTakePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        setPhoto(canvas.toDataURL('image/png'));
        setIsShutter(true);
        setTimeout(() => setIsShutter(false), 300);
      }
    }
  };
  
  // Funkcja do rozpoznawania tekstu z obrazu
  const recognizeText = async (imageData: string) => {
    try {
      setIsProcessingImage(true);
      
      // Inicjalizacja i konfiguracja Tesseract z wybranym językiem
      const worker = await createWorker(selectedLanguage);
      
      // Rozpoznawanie tekstu
      const { data } = await worker.recognize(imageData);
      const text = data.text;
      
      // Zamknięcie workera
      await worker.terminate();
      
      return text;
    } catch (error) {
      console.error('Błąd rozpoznawania tekstu:', error);
      throw error;
    } finally {
      setIsProcessingImage(false);
    }
  };
  
  // Obsługa akceptacji zdjęcia z rozpoznawaniem tekstu
  const handleAcceptPhoto = async () => {
    if (photo) {
      try {
        const text = await recognizeText(photo);
        setRecognizedText(text);
        
        // Wstawienie rozpoznanego tekstu do pola wprowadzania zamiast wysyłania
        if (text.trim()) {
          setMessage(text); // Wstawia tekst do inputa
          // Opcjonalnie: focus na polu wprowadzania
          setTimeout(() => {
            const inputElement = document.querySelector('input[type="text"]') as HTMLInputElement;
            if (inputElement) {
              inputElement.focus();
            }
          }, 100);
        } else {
          alert('Nie udało się rozpoznać tekstu na zdjęciu.');
        }
        
        // Zamknięcie aparatu i czyszczenie zdjęcia
        setShowCamera(false);
        setPhoto(null);
      } catch (error) {
        alert('Wystąpił błąd podczas rozpoznawania tekstu.');
        console.error(error);
      }
    }
  };


  const [message, setMessage] = useState("");
  const { messages, sendMessage, isLoading } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  // Get Google API credentials from environment variables
  const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    // If not authenticated and not loading, redirect to login
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, loading, router]);

  // Refresh Firebase token periodically
  useEffect(() => {
    const refreshToken = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          await user.getIdToken(true);
          console.log("Firebase token refreshed");
        } catch (error) {
          console.error("Error refreshing token:", error);
        }
      }
    };

    // Refresh token every 50 minutes (tokens last 60 min)
    const intervalId = setInterval(refreshToken, 50 * 60 * 1000);
    
    // Initial token refresh
    refreshToken();
    
    return () => clearInterval(intervalId);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      // Check if the message contains a URL
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const urls = message.match(urlRegex);
      
      if (urls && urls.length > 0) {
        // Notify user that the link is being processed
        const userMessage = { role: "user" as const, content: message };
        const botNotification = { 
          role: "assistant" as const, 
          content: `I detected a link in your message. Running the scraper for: ${urls[0]}` 
        };
        
        // Log the link detection
        console.log(`Link detected: ${urls[0]} - This will be processed by the scraper backend tool.`);
      }
      
      // Always send the message to the chatbot
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
    <div className="flex flex-col h-full w-full max-w-full lg:max-w-6xl mx-auto p-2 sm:p-4 text-gray-100">
      <div className="flex-1 overflow-y-auto mb-2 sm:mb-4 space-y-3 sm:space-y-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800">
        {messages
          .filter((msg) => msg.role !== "tool")
          .map((msg, index) => (
            <Message key={index} role={msg.role} content={msg.content} />
          ))}
        {isLoading && <Message role="assistant" content="" isLoading={true} />}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex flex-col gap-2">
        
{showCamera && (
  <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-black/80 p-2 sm:relative sm:bg-transparent sm:p-0">
    {/* Przycisk powrotu (X) tylko na mobile */}
    <button
      onClick={handleStopCamera}
      className="absolute top-4 left-4 z-50 bg-black/70 text-white rounded-full p-2 shadow-lg focus:outline-none focus:ring-2 focus:ring-white/80 sm:hidden"
      aria-label="Zamknij aparat"
      type="button"
    >
      {/* Ikona X */}
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
    {/* Podgląd aparatu, responsywny, max-w-xs na mobile */}
    <div className="relative w-full max-w-xs sm:max-w-md flex flex-col items-center aspect-video">
      <div className={`absolute inset-0 rounded-2xl bg-black/40 backdrop-blur-lg z-10 pointer-events-none transition-all duration-200 ${isShutter ? 'animate-pulse bg-white/60' : ''}`} />
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="relative z-20 rounded-2xl border-2 border-red-400 shadow-xl w-full aspect-video object-cover"
      />
      {/* Przycisk do robienia zdjęcia na dole, duży, biały, nie zasłania obrazu */}
      <button
        onClick={handleTakePhoto}
        className="absolute z-30 left-1/2 bottom-2 -translate-x-1/2 bg-white w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full shadow-2xl border-2 border-gray-300 hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/70"
        title="Zrób zdjęcie"
        type="button"
      >
        {/* iPhone-like shutter (biały okrąg) */}
        <span className="block w-6 h-6 sm:w-8 sm:h-8 bg-white rounded-full border-2 border-gray-400" />
      </button>
      <canvas ref={canvasRef} className="hidden" />
    </div>
    {/* Miniaturka zdjęcia pod podglądem, responsywna */}
    {photo && (
      <div className="mt-4 flex flex-col items-center w-full">
        <span className="mb-2 text-gray-300 text-sm">Twoje zdjęcie:</span>
        <img src={photo} alt="Zrobione zdjęcie" className="rounded-xl border-2 border-white/30 shadow-lg w-32 h-auto object-cover sm:w-48" />
        
        {/* Wybór języka */}
        <div className="mt-3 w-full max-w-xs">
          <label htmlFor="language-select" className="block text-sm font-medium text-gray-300 mb-1">Język rozpoznawania:</label>
          <select
            id="language-select"
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {languageOptions.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Przyciski akceptacji i odrzucenia */}
        <div className="mt-4 flex gap-3">
          <button
            onClick={handleAcceptPhoto}
            disabled={isProcessingImage}
            className="px-6 py-3 bg-green-600 text-white font-semibold rounded-full shadow-lg hover:bg-green-700 transition-colors duration-200 text-lg flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 disabled:bg-gray-600 disabled:cursor-not-allowed"
            type="button"
          >
            {isProcessingImage ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Rozpoznawanie tekstu...
              </>
            ) : (
              <>
                <svg xmlns='http://www.w3.org/2000/svg' className='w-6 h-6' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                  <path strokeLinecap='round' strokeLinejoin='round' d='M5 13l4 4L19 7' />
                </svg>
                Wstaw tekst do chatu
              </>
            )}
          </button>
          <button
            onClick={() => { setPhoto(null); }}
            className="px-6 py-3 bg-red-600 text-white font-semibold rounded-full shadow-lg hover:bg-red-700 transition-colors duration-200 text-lg flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
            type="button"
          >
            <svg xmlns='http://www.w3.org/2000/svg' className='w-6 h-6' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
              <path strokeLinecap='round' strokeLinejoin='round' d='M6 18L18 6M6 6l12 12' />
            </svg>
            Odrzuć
          </button>
        </div>
      </div>
    )}
  </div>
)}

        {/* RESPONSYWNY FORMULARZ z przyciskiem toggle aparatu */}
<form onSubmit={handleSubmit} className="flex gap-1 sm:gap-2 w-full">
  <input
    type="text"
    value={message}
    onChange={(e) => setMessage(e.target.value)}
    placeholder="Type your message..."
    className="flex-1 p-2 sm:p-3 text-sm sm:text-base bg-gray-800 border border-gray-700 rounded-md text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  />
  {/* Przycisk toggle aparat - stylistyka jak Send, tylko czerwony */}
  <button
    type="button"
    aria-label={showCamera ? 'Wyłącz aparat' : 'Włącz aparat'}
    onClick={() => {
      if (showCamera) handleStopCamera(); else handleCameraClick();
    }}
    className={`px-3 sm:px-6 py-2 sm:py-3 rounded-md font-semibold shadow-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900 flex items-center justify-center ${showCamera ? 'bg-gray-700 text-white hover:bg-red-800' : 'bg-red-600 text-white hover:bg-red-700'} disabled:bg-gray-600 disabled:cursor-not-allowed`}
    style={{ minWidth: 48 }}
  >
    {/* Ikona aparatu */}
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 19.5v-11.25A2.25 2.25 0 014.5 6h2.086a1.5 1.5 0 001.06-.44l1.414-1.414a1.5 1.5 0 011.06-.44h2.76a1.5 1.5 0 011.06.44l1.414 1.414a1.5 1.5 0 001.06.44H19.5a2.25 2.25 0 012.25 2.25V19.5a2.25 2.25 0 01-2.25 2.25H4.5A2.25 2.25 0 012.25 19.5z" />
      <circle cx="12" cy="13" r="3.25" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  </button>
  {/* Przycisk Send */}
  <button
    type="submit"
    disabled={isLoading}
    className="px-3 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
    style={{ minWidth: 48 }}
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
