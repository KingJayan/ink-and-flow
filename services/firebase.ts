import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";

// ------------------------------------------------------------------
// MANUAL CONFIGURATION
// Paste your Firebase Config object below to connect your backend.
// ------------------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyBMSeuWz648qXYL4cTybeoqVNGrWP9nUOU",
  authDomain: "ink-flow-123.firebaseapp.com",
  projectId: "ink-flow-123",
  storageBucket: "ink-flow-123.firebasestorage.app",
  messagingSenderId: "560477878104",
  appId: "1:560477878104:web:a0edd3dde68325e028172d",
  measurementId: "G-VJQYE3DGP1"
};

// Initialize app (prevent double init in strict mode)
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize analytics safely (can fail in some envs or if config is invalid)
let analytics;
try {
  analytics = getAnalytics(app);
} catch (e) {
  console.warn("Firebase Analytics failed to initialize", e);
}

export { analytics };