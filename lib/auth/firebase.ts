import { getConfig } from "@/lib/config";
import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
    getAuth,
    signInWithEmailAndPassword,
    signOut,
    type Auth,
} from "firebase/auth";

let cachedApp: FirebaseApp | undefined;
let cachedAuth: Auth | undefined;

export function isFirebaseConfigured(): boolean {
  const firebase = getConfig().firebase;
  return !!firebase?.apiKey && !!firebase?.appId && !!firebase?.projectId;
}

function getFirebaseApp(): FirebaseApp {
  const firebase = getConfig().firebase;
  if (!firebase?.apiKey || !firebase?.appId || !firebase?.projectId) {
    throw new Error(
      "Firebase is not configured. Set EXPO_PUBLIC_FIREBASE_API_KEY, EXPO_PUBLIC_FIREBASE_PROJECT_ID, and EXPO_PUBLIC_FIREBASE_APP_ID.",
    );
  }

  if (cachedApp) return cachedApp;
  cachedApp = getApps().length ? getApp() : initializeApp(firebase);
  return cachedApp;
}

function getFirebaseAuth(): Auth {
  if (cachedAuth) return cachedAuth;

  const app = getFirebaseApp();
  cachedAuth = getAuth(app);
  return cachedAuth;
}

export async function signInWithFirebasePassword(params: {
  email: string;
  password: string;
}) {
  const auth = getFirebaseAuth();
  return signInWithEmailAndPassword(auth, params.email, params.password);
}

export async function signOutFirebase(): Promise<void> {
  if (!isFirebaseConfigured()) return;

  const auth = getFirebaseAuth();
  if (!auth.currentUser) return;

  await signOut(auth);
}
