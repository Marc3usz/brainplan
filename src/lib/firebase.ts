// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth"; 


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCUMfB8hE_tqhlvPKtixuou_6xF8LiGN0A",
  authDomain: "sigma-2667d.firebaseapp.com",
  projectId: "sigma-2667d",
  storageBucket: "sigma-2667d.firebasestorage.app",
  messagingSenderId: "854020552381",
  appId: "1:854020552381:web:88065216cbf4a6697e29d4",
  measurementId: "G-JV0LFPF5GC"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Add required scopes for Google Calendar API
googleProvider.addScope('https://www.googleapis.com/auth/calendar');
googleProvider.addScope('https://www.googleapis.com/auth/calendar.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/calendar.events');

// Force consent selection every time to ensure we get refresh tokens
googleProvider.setCustomParameters({
  prompt: 'consent select_account',
  access_type: 'offline',
});

export { app, auth, googleProvider };