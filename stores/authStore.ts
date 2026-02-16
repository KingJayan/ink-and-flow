import { atom, map } from 'nanostores';
import { onAuthStateChanged, User, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { EditorSettings } from '../types';

export const $user = atom<User | null>(null);
export const $authLoading = atom<boolean>(true);

// Default settings
const DEFAULT_SETTINGS: EditorSettings = {
  fontSize: 16,
  lineHeight: 1.6,
  fontFamily: 'serif',
  markdownMode: false,
  enableAiRefinement: true,
  darkMode: false,
  typewriterMode: false,
};

export const $settings = map<EditorSettings>(DEFAULT_SETTINGS);

// Initialize Auth Listener
onAuthStateChanged(auth, async (user) => {
  $user.set(user);

  if (user) {
    // Load settings from Firestore
    try {
      const docRef = doc(db, 'users', user.uid);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists() && snapshot.data().settings) {
        $settings.set({ ...DEFAULT_SETTINGS, ...snapshot.data().settings });
      } else {
        // Init user doc if not exists
        await setDoc(docRef, { settings: $settings.get() }, { merge: true });
      }
    } catch (e) {
      console.error("Error loading settings from Firestore:", e);
    }
  } else {
    // Load from LocalStorage if guest
    const saved = localStorage.getItem('ink-flow-settings');
    if (saved) {
      try {
        $settings.set({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
      } catch (e) { }
    }
  }

  $authLoading.set(false);
});

export const updateSettings = async (newSettings: Partial<EditorSettings>) => {
  const current = $settings.get();
  const updated = { ...current, ...newSettings };
  $settings.set(updated);

  const user = $user.get();
  if (user) {
    // Save to Firestore
    try {
      const docRef = doc(db, 'users', user.uid);
      await setDoc(docRef, { settings: updated }, { merge: true });
    } catch (e) {
      console.error("Error saving settings to Firestore:", e);
    }
  } else {
    // Save to LocalStorage
    localStorage.setItem('ink-flow-settings', JSON.stringify(updated));
  }
};

export const signOut = async () => {
  await firebaseSignOut(auth);
  // Reset settings to default or local storage on logout could be an option,
  // but keeping current loaded settings is a smoother UX until page refresh.
};