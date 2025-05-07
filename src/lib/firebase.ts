// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

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

// Configure Google provider
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export { app, auth, googleProvider }; 