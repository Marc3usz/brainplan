// src/app/calendar/googleCalendar.ts

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  updateDoc
} from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase if it hasn't been initialized already
const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(firebaseApp);
const firestore = getFirestore(firebaseApp);

// Google Calendar API configuration
const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const CALENDAR_API_SCOPE = 'https://www.googleapis.com/auth/calendar';

class GoogleCalendarService {
  private currentUser: User | null = null;
  private token: string | null = null;
  private gapiLoaded: boolean = false;

  constructor() {
    // Listen for authentication state changes
    onAuthStateChanged(auth, user => {
      this.currentUser = user;
    });
  }

  // Initialize Google API Client
  initGoogleAuth = async (): Promise<void> => {
    console.log("Initializing Google Auth...");
    
    if (this.gapiLoaded) {
      console.log("Google API already loaded.");
      return Promise.resolve();
    }
    
    return new Promise((resolve, reject) => {
      console.log("Loading Google API script...");
      
      // Load Google API Client Library
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';

      script.onload = () => {
        console.log("Google API script loaded, initializing client and auth2...");
        window.gapi.load('client:auth2', async () => {
          try {
            console.log("gapi loaded, initializing client...");
            await window.gapi.client.init({
              apiKey: GOOGLE_API_KEY,
              clientId: GOOGLE_CLIENT_ID,
              scope: CALENDAR_API_SCOPE,
              discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest']
            });
            
            // Initialize auth2 if it's not already initialized
            if (!window.gapi.auth2.getAuthInstance()) {
              console.log("Initializing auth2...");
              await window.gapi.auth2.init({
                client_id: GOOGLE_CLIENT_ID,
                scope: CALENDAR_API_SCOPE
              });
            }
            
            this.gapiLoaded = true;
            console.log("Google Auth initialized successfully");
            resolve();
          } catch (error: any) {
              console.error("Detailed error from gapi.client.init:", error);
              reject(`Error initializing Google API: ${error?.message || JSON.stringify(error) || error}`);
            }
            
        });
      };
      
      script.onerror = () => {
        console.error("Failed to load Google API script");
        reject('Failed to load Google API script');
      };
      
      document.body.appendChild(script);
    });
  };

  // Authorize user
  authorize = async (): Promise<string> => {
    console.log("Starting authorization process...");
    
    if (!this.currentUser) {
      console.error("No user logged in to Firebase");
      throw new Error('User not logged in to Firebase');
    }

    try {
      // Make sure Google Auth is initialized
      if (!this.gapiLoaded) {
        console.log("Google Auth not initialized, initializing now...");
        await this.initGoogleAuth();
      }
      
      // Check if auth2 is available
      if (!window.gapi.auth2) {
        console.error("Google Auth2 not available");
        throw new Error('Google Auth2 not initialized properly');
      }
      
      const authInstance = window.gapi.auth2.getAuthInstance();
      if (!authInstance) {
        console.error("Could not get auth instance");
        throw new Error('Google Auth Instance could not be obtained');
      }
      
      console.log("Starting Google sign in...");
      const googleUser = await authInstance.signIn();
      const authResponse = googleUser.getAuthResponse();
      this.token = authResponse.access_token;
      
      console.log("Successfully signed in with Google");

      // Save token in database for this user
      if (this.currentUser?.uid) {
        console.log("Saving token to Firestore...");
        await updateDoc(doc(firestore, 'users', this.currentUser.uid), {
          googleCalendarToken: this.token,
          googleCalendarTokenExpiry: new Date(authResponse.expires_at),
        });
        console.log("Token saved to Firestore");
      }

      return this.token;
    } catch (error) {
      console.error('Error during Google authorization:', error);
      throw error;
    }
  };
}

// Create and export the service instance
const googleCalendarService = new GoogleCalendarService();
export default googleCalendarService;