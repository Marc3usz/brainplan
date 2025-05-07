import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY 
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : null;

if (!serviceAccount) {
  console.warn('Firebase service account not found. Firebase Admin functionality will be limited.');
}

// Initialize Firebase Admin if not already initialized
let app;

if (!getApps().length && serviceAccount) {
  app = initializeApp({
    credential: cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL || `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
  });
} else if (getApps().length) {
  app = getApps()[0];
}

const auth = app ? getAuth(app) : null;

export { app, auth }; 