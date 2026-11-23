import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const isConfigValid = !!firebaseConfig.apiKey;
const app = (!getApps().length && isConfigValid) ? initializeApp(firebaseConfig) : (getApps().length ? getApp() : null);
const db = app ? getFirestore(app) : null;
const auth = app ? getAuth(app) : null;
const storage = app ? getStorage(app) : null;

// Local QA only: when NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST is set at build time (never in
// production), sign-in goes to the Firebase Auth emulator instead of Google.
const authEmulatorHost = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST;
if (auth && authEmulatorHost && typeof window !== 'undefined' && !auth.emulatorConfig) {
    connectAuthEmulator(auth, `http://${authEmulatorHost}`, { disableWarnings: true });
}

export { app, db, auth, storage };
