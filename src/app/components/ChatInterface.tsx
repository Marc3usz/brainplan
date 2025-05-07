"use client";

import { useState, useEffect, useRef, ChangeEvent, useMemo } from "react";
import { useChat } from "@/hooks/useChat";
import { Message } from "./Message";
import { createWorker } from 'tesseract.js';
import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { User } from "firebase/auth";

// Define SpeechRecognition interfaces
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}

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
    
    // Only process text files or PDFs
    if (!selectedFile.type.includes('text/') && !selectedFile.name.endsWith('.txt') && !selectedFile.type.includes('application/pdf')) {
      alert('Please select a text file (.txt) or PDF file (.pdf)');
      return;
    }

    setIsProcessingFile(true);
    
    try {
      let content = '';
      
      if (selectedFile.type.includes('application/pdf')) {
        content = await extractTextFromPDF(selectedFile);
      } else {
        // Read the file content
        content = await readFileAsText(selectedFile);
      }
      
      // Generate unique ID for the attachment
      const id = selectedFile.name.replace(/\.\w+$/, '').replace(/\s+/g, '_').toLowerCase();
      
      // Add file as attachment
      addAttachment({
        id,
        name: selectedFile.name,
        content,
        type: selectedFile.type
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

  // Helper function to extract text from PDF files with OCR support
  const extractTextFromPDF = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          if (!e.target?.result) {
            reject(new Error('Failed to read PDF'));
            return;
          }
          
          // Import pdfjs-dist dynamically
          const pdfjsLib = await import('pdfjs-dist');
          
          // Configure PDF.js worker
          const workerSrc = '/pdf.worker.min.js';
          pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
          
          // Load the PDF document
          const loadingTask = pdfjsLib.getDocument({
            data: new Uint8Array(e.target.result as ArrayBuffer)
          });
          
          const pdf = await loadingTask.promise;
          
          // PDF metadata
          const metadata = await pdf.getMetadata().catch(() => ({}));
          const title = metadata?.info?.Title || file.name;
          const totalPages = pdf.numPages;
          let fullText = `[PDF: ${title} (${totalPages} pages)]\n\n`;
          
          // Process each page with both text extraction and OCR
          for (let i = 1; i <= Math.min(totalPages, 20); i++) { // Limit to first 20 pages
            try {
              const page = await pdf.getPage(i);
              
              // First try standard text extraction
              const textContent = await page.getTextContent();
              
              // Process text with improved layout recognition
              let lastY = null;
              let pageText = '';
              
              for (const item of textContent.items) {
                const textItem = item as pdfjsLib.TextItem;
                
                // Add newlines when position changes significantly
                if (lastY !== null && Math.abs(textItem.transform[5] - lastY) > 5) {
                  pageText += '\n';
                }
                
                pageText += textItem.str + ' ';
                lastY = textItem.transform[5];
              }
              
              // Clean up text
              pageText = pageText.replace(/\s+/g, ' ').trim();
              
              // Check if extracted text is too limited (less than 10 chars per page on average)
              const contentfulText = pageText.replace(/\s+/g, '').trim();
              
              // If text extraction yielded minimal results, try OCR on page image
              if (contentfulText.length < 50) {
                try {
                  // Get page viewport
                  const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better OCR
                  
                  // Create canvas for rendering
                  const canvas = document.createElement('canvas');
                  canvas.width = viewport.width;
                  canvas.height = viewport.height;
                  
                  const canvasContext = canvas.getContext('2d');
                  if (!canvasContext) {
                    throw new Error('Failed to get canvas context');
                  }
                  
                  // Render PDF page to canvas
                  await page.render({
                    canvasContext,
                    viewport,
                  }).promise;
                  
                  // Convert canvas to image data URL
                  const imageData = canvas.toDataURL('image/png');
                  
                  // Initialize Tesseract worker for OCR
                  const worker = await createWorker(selectedLanguage || 'eng');
                  
                  // Perform OCR
                  const { data } = await worker.recognize(imageData);
                  
                  // If OCR found more text than regular extraction, use it
                  if (data.text.replace(/\s+/g, '').length > contentfulText.length) {
                    pageText = data.text;
                    fullText += `--- Page ${i} (OCR) ---\n${pageText}\n\n`;
                  } else {
                    fullText += `--- Page ${i} ---\n${pageText}\n\n`;
                  }
                  
                  // Terminate worker
                  await worker.terminate();
                } catch (ocrError) {
                  console.error(`OCR error on page ${i}:`, ocrError);
                  fullText += `--- Page ${i} ---\n${pageText}\n\n`;
                }
              } else {
                fullText += `--- Page ${i} ---\n${pageText}\n\n`;
              }
            } catch (pageError) {
              console.error(`Error extracting text from page ${i}:`, pageError);
              fullText += `--- Page ${i} --- [Error: Could not extract text]\n\n`;
            }
          }
          
          // Add note if we didn't process all pages
          if (totalPages > 20) {
            fullText += `[Note: Only showing first 20 of ${totalPages} pages]\n\n`;
          }
          
          // Check if the extracted text is too limited overall
          const contentfulText = fullText.replace(/\[.*?\]|\n|Page \d+|---/g, '').trim();
          if (contentfulText.length < 100) {
            // Try to get more info about the document
            const outline = await pdf.getOutline().catch(() => []);
            let outlineText = '';
            
            if (outline && outline.length > 0) {
              outlineText = '\nDocument structure:\n' + 
                outline.map(item => `- ${item.title}`).join('\n');
            }
            
            fullText = `This PDF appears to contain limited machine-readable text. OCR has been attempted where possible.\n\n` +
              `File: ${title}\nPages: ${totalPages}${outlineText}\n\n` +
              `Extracted text:\n${contentfulText || "[No readable text found]"}`;
          }
          
          resolve(fullText);
        } catch (error) {
          console.error('Error extracting text from PDF:', error);
          reject(new Error(`Failed to extract text from PDF: ${error.message}`));
        }
      };
      
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  };

  const [message, setMessage] = useState("");
  const { messages, sendMessage, isLoading, attachments, addAttachment, removeAttachment, clearAttachments } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [userName, setUserName] = useState<string>("");
  const [showWelcome, setShowWelcome] = useState<boolean>(true);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechRecognition, setSpeechRecognition] = useState<SpeechRecognition | null>(null);

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

  // Handle voice input
  const handleVoiceInput = () => {
    if (isListening) {
      // Stop listening
      if (speechRecognition) {
        speechRecognition.stop();
      }
      setIsListening(false);
      return;
    }

    // Start listening
    try {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognitionAPI) {
        alert('Speech recognition is not supported in this browser.');
        return;
      }

      const recognition = new SpeechRecognitionAPI();
      recognition.lang = 'pl-PL';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        setMessage((prev) => prev + ' ' + transcript);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
      setSpeechRecognition(recognition);
      setIsListening(true);
    } catch (error) {
      console.error('Speech recognition error:', error);
      alert('Could not initialize speech recognition.');
    }
  };

  // Handle copying message to clipboard
  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
      .then(() => {
        alert('Message copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
      });
  };

  // Handle liking a message
  const handleLikeMessage = (index: number) => {
    console.log(`Message #${index} liked`);
    // Here you would implement the actual feedback mechanism
    alert('Thanks for your feedback!');
  };

  // Handle disliking a message
  const handleDislikeMessage = (index: number) => {
    console.log(`Message #${index} disliked`);
    // Here you would implement the actual feedback mechanism
    alert('Thanks for your feedback. We\'ll try to improve.');
  };

  // Handle regenerating a response
  const handleRegenerateMessage = (index: number) => {
    const userMessageIndex = index - 1;
    if (userMessageIndex >= 0 && messages[userMessageIndex]?.role === 'user') {
      const originalMessage = messages[userMessageIndex].content;
      sendMessage(originalMessage);
    } else {
      alert('Cannot regenerate this message.');
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-none p-1 sm:p-4 text-gray-100 relative">
      {/* Improved background with gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-indigo-900/20 to-purple-900/30 pointer-events-none z-0" />
      <div className="flex-1 overflow-y-auto mb-1 sm:mb-4 space-y-2 sm:space-y-4 relative z-10 max-w-4xl mx-auto w-full scrollbar-hide px-1 sm:px-0">
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
            <div key={index} className="relative group">
              <Message 
                role={msg.role} 
                content={msg.content} 
                attachments={attachments} 
              />
              {msg.role === "assistant" && (
                <div className="absolute -bottom-2 right-4 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button 
                    onClick={() => handleCopyMessage(msg.content)}
                    className="p-1.5 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors duration-200 shadow-md border border-gray-700"
                    title="Copy message"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                  </button>
                  <button 
                    onClick={() => handleLikeMessage(index)}
                    className="p-1.5 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors duration-200 shadow-md border border-gray-700"
                    title="Thumbs up"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                    </svg>
                  </button>
                  <button 
                    onClick={() => handleDislikeMessage(index)}
                    className="p-1.5 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors duration-200 shadow-md border border-gray-700"
                    title="Thumbs down"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm10-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path>
                    </svg>
                  </button>
                  <button 
                    onClick={() => handleRegenerateMessage(index)}
                    className="p-1.5 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors duration-200 shadow-md border border-gray-700"
                    title="Regenerate response"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                      <path d="M23 4v6h-6"></path>
                      <path d="M1 20v-6h6"></path>
                      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"></path>
                      <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"></path>
                    </svg>
                  </button>
                </div>
              )}
            </div>
          ))}
        {isLoading && <Message role="assistant" content="" isLoading={true} />}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex flex-col gap-2 relative z-10">
        
{/* Display current file attachments with persistence indicator */}
{attachments.length > 0 && (
  <div className="bg-gray-800/80 rounded-lg p-1.5 sm:p-2 mb-1 sm:mb-2">
    <div className="flex flex-wrap sm:flex-nowrap items-center justify-between mb-1 sm:mb-2 gap-1">
      <h4 className="text-xs sm:text-sm text-gray-300 flex items-center flex-wrap">
        <span>Attached Files</span> 
        <span 
          className="inline-flex items-center ml-1 sm:ml-2 px-1 sm:px-1.5 py-0.5 rounded text-xs font-medium bg-blue-900/60 text-blue-200" 
          title="Files remain available throughout your entire conversation">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-2.5 sm:w-3 h-2.5 sm:h-3 mr-0.5 sm:mr-1">
            <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          persistent
        </span>
      </h4>
      <button
        onClick={clearAttachments}
        className="text-2xs sm:text-xs text-gray-400 hover:text-red-400 transition-colors flex items-center"
        title="Remove all attachments"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-0.5 sm:mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <span className="hidden sm:inline">Clear all</span>
      </button>
    </div>
    <div className="flex flex-wrap gap-1 sm:gap-2">
      {attachments.map(attachment => (
        <div 
          key={attachment.id} 
          className="flex items-center bg-gray-700/70 text-gray-200 text-2xs sm:text-xs rounded-full px-2 sm:px-3 py-1 sm:py-1.5 gap-1 sm:gap-2 group relative"
          title={`Reference with #${attachment.id} in your message`}
        >
          <span className="truncate max-w-[80px] sm:max-w-[150px]">{attachment.name}</span>
          <span className="text-gray-400 text-2xs sm:text-xs">(#{attachment.id})</span>
          <button
            onClick={() => removeAttachment(attachment.id)}
            className="text-gray-400 hover:text-red-400"
            aria-label="Remove attachment"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  </div>
)}

{showCamera && (
  <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-black/95 p-1 sm:p-2 sm:relative sm:bg-transparent">
    {/* Przycisk powrotu (X) tylko na mobile */}
    <button
      onClick={handleStopCamera}
      className="absolute top-2 right-2 z-50 bg-black/70 text-white rounded-full p-2 shadow-lg focus:outline-none focus:ring-2 focus:ring-white/80 sm:hidden"
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
<form
  onSubmit={handleSubmit}
  className="flex items-center space-x-1 sm:space-x-3 bg-gray-900/80 backdrop-blur p-1.5 sm:p-3 rounded-xl border border-gray-700/80 max-w-3xl mx-auto w-full"
>
  {/* Input */}
  <FormattedInput
    value={message}
    onChange={(e) => setMessage(e.target.value)}
    placeholder="Type your message..."
    className="flex-1"
    attachments={attachments}
  />
  
  <div className="flex items-center space-x-1 sm:space-x-3">
    {/* Przycisk do nagrywania głosu */}
    <button
      type="button"
      onClick={handleVoiceInput}
      disabled={isListening}
      className={`p-2 sm:p-2.5 rounded-full ${isListening ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'} transition-colors duration-200 focus:outline-none`}
      title="Record voice"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 sm:w-5 sm:h-5">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
        <line x1="12" y1="19" x2="12" y2="23"></line>
        <line x1="8" y1="23" x2="16" y2="23"></line>
      </svg>
    </button>
    
    {/* Przycisk do robienia zdjęć */}
    <button
      type="button"
      onClick={handleCameraClick}
      className="p-2 sm:p-2.5 rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors duration-200 focus:outline-none"
      title="Take photo"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 sm:w-5 sm:h-5">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
        <circle cx="12" cy="13" r="4"></circle>
      </svg>
    </button>
    
    {/* Przycisk Send */}
    <button
      type="submit"
      disabled={isLoading}
      className="p-2 sm:p-2.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 sm:w-5 sm:h-5">
        <line x1="22" y1="2" x2="11" y2="13"></line>
        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
      </svg>
    </button>

    {/* Przycisk do dodawania pliku */}
    <label
      htmlFor="file-input"
      className="p-2 sm:p-2.5 rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600 cursor-pointer transition-colors duration-200 focus:outline-none inline-flex items-center justify-center"
      title="Attach file"
    >
      <input
        id="file-input"
        type="file"
        onChange={handleFileChange}
        className="hidden"
      />
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 sm:w-5 sm:h-5">
        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.48-8.48l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
      </svg>
    </label>
  </div>
</form>
      </div>
    </div>
  );
}

// Custom input component with formatting for file references
const FormattedInput = ({ 
  value, 
  onChange, 
  placeholder, 
  className,
  attachments = [] 
}: { 
  value: string; 
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; 
  placeholder: string; 
  className: string;
  attachments?: { id: string; name: string; content: string; type: string; }[];
}) => {
  // Create a formatted display version with highlighted file references
  const formattedDisplay = useMemo(() => {
    if (!value) return '';
    
    // Replace #file_id patterns with styled spans, but only for existing attachments
    return value.replace(
      /#([a-zA-Z0-9_-]+)/g, 
      (match, id) => {
        // Check if the attachment exists
        const attachmentExists = attachments.some(attachment => attachment.id === id);
        
        if (attachmentExists) {
          return `<span class="inline-flex items-center px-1.5 py-0.5 mx-0.5 bg-blue-800/70 text-blue-100 border border-blue-600/70 rounded font-medium shadow-sm">${match}</span>`;
        } else {
          return match; // Keep as plain text if attachment doesn't exist
        }
      }
    );
  }, [value, attachments]);

  return (
    <div className={`relative flex-1 ${className}`}>
      {/* Hidden actual input field (this is what gets submitted) */}
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-text"
        aria-label="Message input"
      />
      
      {/* Visible styled display */}
      <div 
        className="flex-1 p-2 sm:p-3 text-sm sm:text-base bg-gray-800 border border-gray-700 rounded-full text-gray-100 placeholder-gray-500 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent overflow-hidden whitespace-nowrap overflow-ellipsis"
      >
        {formattedDisplay ? (
          <div 
            dangerouslySetInnerHTML={{ __html: formattedDisplay }} 
            className="overflow-hidden whitespace-nowrap overflow-ellipsis"
          />
        ) : (
          <span className="text-gray-500">{placeholder}</span>
        )}
      </div>
    </div>
  );
};

// Add TypeScript types for the Google API
declare global {
  interface Window {
    gapi: any;
    SpeechRecognition: {
      new(): SpeechRecognition;
      prototype: SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new(): SpeechRecognition;
      prototype: SpeechRecognition;
    };
  }
}
