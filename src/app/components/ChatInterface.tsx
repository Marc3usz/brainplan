"use client";

import { useState, useEffect, useRef, ChangeEvent } from "react";
import { useChat } from "@/hooks/useChat";
import { Message } from "./Message";
import { createWorker } from 'tesseract.js';
import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { User } from "firebase/auth";

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
  const [file, setFile] = useState<File | null>(null);

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

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    if (!selectedFile) return;
    
    // Only process text files
    if (!selectedFile.type.includes('text/') && !selectedFile.name.endsWith('.txt')) {
      alert('Please select a text file (.txt)');
      return;
    }

    setIsProcessingFile(true);
    
    try {
      // Read the file content
      const content = await readFileAsText(selectedFile);
      
      // Generate unique ID for the attachment
      const id = selectedFile.name.replace(/\.\w+$/, '').replace(/\s+/g, '_').toLowerCase();
      
      // Add file as attachment
      addAttachment({
        id,
        name: selectedFile.name,
        content,
        type: 'text/plain'
      });
      
      // Notify user
      alert(`File "${selectedFile.name}" attached. You can reference it with #${id} in your message.`);
      
    } catch (error) {
      console.error('Error reading file:', error);
      alert('Failed to read file. Please try again.');
    } finally {
      setIsProcessingFile(false);
      // Clear the file input
      event.target.value = '';
    }
  };

  // Helper function to read file contents
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  };

  const [message, setMessage] = useState("");
  const { messages, sendMessage, isLoading, attachments, addAttachment, removeAttachment } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [userName, setUserName] = useState<string>("");
  const [showWelcome, setShowWelcome] = useState<boolean>(true);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  // Get Google API credentials from environment variables
  const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    // If not authenticated and not loading, redirect to login
    if (!loading && !isAuthenticated) {
      router.push("/login");
    } else if (!loading && isAuthenticated) {
      // Get user's name when authenticated
      const user = auth.currentUser;
      if (user) {
        getUserName(user);
      }
    }
  }, [isAuthenticated, loading, router]);
  
  // Function to get user's name from Firebase
  const getUserName = (user: User) => {
    const displayName = user.displayName;
    const email = user.email;
    if (displayName) {
      // Use first name if available
      setUserName(displayName.split(' ')[0]);
    } else if (email) {
      // Use email username if no display name
      setUserName(email.split('@')[0]);
    } else {
      setUserName("użytkowniku");
    }
  };

  // Handle example prompt click
  const handlePromptClick = (promptText: string) => {
    setMessage(promptText);
    setShowWelcome(false);
    // Focus on input field after selecting a prompt
    setTimeout(() => {
      const inputElement = document.querySelector('input[type="text"]') as HTMLInputElement;
      if (inputElement) {
        inputElement.focus();
      }
    }, 100);
  };

  // Hide welcome section on first message
  useEffect(() => {
    if (messages.length > 0) {
      setShowWelcome(false);
    }
  }, [messages]);
  
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
    <div className="flex flex-col h-full w-full max-w-none p-2 sm:p-4 text-gray-100 relative">
      {/* Improved background with gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-indigo-900/20 to-purple-900/30 pointer-events-none z-0" />
      <div className="flex-1 overflow-y-auto mb-2 sm:mb-4 space-y-3 sm:space-y-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800 relative z-10">
        {/* Welcome section with user name and example prompts */}
        {showWelcome && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center p-2 sm:p-6 rounded-lg">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-px rounded-xl w-full max-w-2xl">
              <div className="bg-gray-900/90 backdrop-blur-sm rounded-xl p-4 md:p-8 space-y-4 md:space-y-6">
                <h2 className="text-xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-300">
                  Witaj, w czym mogę Ci pomóc {userName}?
                </h2>
                <p className="text-gray-300 mb-2 sm:mb-4 text-sm sm:text-base">Wybierz jeden z przykładowych promptów lub napisz własne zapytanie:</p>
                
                <div className="overflow-y-auto max-h-[50vh] px-1 pb-1 -mx-1 snap-y">
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 snap-mandatory">
                    <button 
                      onClick={() => handlePromptClick("Zaplanuj moją najbliższą podróż do Włoch.")} 
                      className="bg-blue-800/40 hover:bg-blue-700/50 text-left p-2.5 sm:p-3 rounded-lg border border-blue-700/50 transition-all duration-200 hover:shadow-md hover:border-blue-500/60 snap-start flex flex-col active:scale-[0.98]"
                    >
                      <span className="block font-medium mb-0.5 sm:mb-1 text-sm sm:text-base">Zaplanuj moją podróż</span>
                      <span className="text-xs sm:text-sm text-gray-300">Zaplanuj moją najbliższą podróż do Włoch.</span>
                    </button>
                    
                    <button 
                      onClick={() => handlePromptClick("Napisz mi tygodniowy plan treningowy na siłownię.")} 
                      className="bg-blue-800/40 hover:bg-blue-700/50 text-left p-2.5 sm:p-3 rounded-lg border border-blue-700/50 transition-all duration-200 hover:shadow-md hover:border-blue-500/60 snap-start flex flex-col active:scale-[0.98]"
                    >
                      <span className="block font-medium mb-0.5 sm:mb-1 text-sm sm:text-base">Plan treningowy</span>
                      <span className="text-xs sm:text-sm text-gray-300">Napisz mi tygodniowy plan treningowy na siłownię.</span>
                    </button>
                    
                    <button 
                      onClick={() => handlePromptClick("Podaj mi przepis na szybki i zdrowy obiad.")} 
                      className="bg-blue-800/40 hover:bg-blue-700/50 text-left p-2.5 sm:p-3 rounded-lg border border-blue-700/50 transition-all duration-200 hover:shadow-md hover:border-blue-500/60 snap-start flex flex-col active:scale-[0.98]"
                    >
                      <span className="block font-medium mb-0.5 sm:mb-1 text-sm sm:text-base">Przepis kulinarny</span>
                      <span className="text-xs sm:text-sm text-gray-300">Podaj mi przepis na szybki i zdrowy obiad.</span>
                    </button>
                    
                    <button 
                      onClick={() => handlePromptClick("Jak mogę zorganizować swój czas, aby być bardziej produktywnym?")} 
                      className="bg-blue-800/40 hover:bg-blue-700/50 text-left p-2.5 sm:p-3 rounded-lg border border-blue-700/50 transition-all duration-200 hover:shadow-md hover:border-blue-500/60 snap-start flex flex-col active:scale-[0.98]"
                    >
                      <span className="block font-medium mb-0.5 sm:mb-1 text-sm sm:text-base">Porada produktywności</span>
                      <span className="text-xs sm:text-sm text-gray-300">Jak mogę zorganizować swój czas, aby być bardziej produktywnym?</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {messages
          .filter((msg) => msg.role !== "tool")
          .map((msg, index) => (
            <Message key={index} role={msg.role} content={msg.content} />
          ))}
        {isLoading && <Message role="assistant" content="" isLoading={true} />}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex flex-col gap-2 relative z-10">
        
{/* Display current file attachments */}
{attachments.length > 0 && (
  <div className="bg-gray-800/80 rounded-lg p-2 mb-2">
    <h4 className="text-sm text-gray-300 mb-2">Attached Files:</h4>
    <div className="flex flex-wrap gap-2">
      {attachments.map(attachment => (
        <div 
          key={attachment.id} 
          className="flex items-center bg-gray-700/70 text-gray-200 text-xs rounded-full px-3 py-1.5 gap-2"
        >
          <span className="truncate max-w-[150px]">{attachment.name}</span>
          <span className="text-gray-400">(#{attachment.id})</span>
          <button
            onClick={() => removeAttachment(attachment.id)}
            className="text-gray-400 hover:text-red-400"
            aria-label="Remove attachment"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  </div>
)}

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
    placeholder="Wpisz swoją wiadomość..."
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
  {/* Przycisk do dodawania pliku */}
  <label
    htmlFor="file-input"
    className="px-3 sm:px-6 py-2 sm:py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900 cursor-pointer"
    style={{ minWidth: 48 }}
  >
    <input
      id="file-input"
      type="file"
      onChange={handleFileChange}
      className="hidden"
    />
    Attach
  </label>
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
