
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  signOut,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCoyB1N-TgHXQMvGh8kvT7HmUR54n4IviQ',
  authDomain: 'fagama-polla-2026.firebaseapp.com',
  projectId: 'fagama-polla-2026',
  storageBucket: 'fagama-polla-2026.firebasestorage.app',
  messagingSenderId: '135874538457',
  appId: '1:135874538457:web:5b36b0f05402495352c7c8',
  measurementId: 'G-5JV2C33827',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

/** Current Firebase user uid, or null if not signed in. */
export function getCurrentUid() {
  return auth.currentUser?.uid ?? null;
}

export async function ensureAnonymousAuth() {
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }
  return auth.currentUser;
}

export function waitForAuthUser() {
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        unsub();
        resolve(user);
      }
    });
  });
}

export function subscribeToAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Resets the current anonymous Firebase session,
 * then immediately creates a new anonymous session.
 * Used to quickly change player session on the same device.
 */
export async function resetAnonymousSession() {
  try {
    if (auth.currentUser) {
      await signOut(auth);
    }
  } catch (error) {
    console.error('Error closing anonymous session:', error);
  }

  await signInAnonymously(auth);
}
