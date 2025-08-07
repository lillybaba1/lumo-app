
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface Theme {
    primaryColor: string;
    accentColor: string;
    backgroundColor: string;
    backgroundImage: string;
    foregroundImage: string;
}

const themeDocRef = doc(db, 'settings', 'theme');

const defaultTheme = {
  primaryColor: "#D0BFFF",
  accentColor: "#FFB3C6",
  backgroundColor: "#E8E2FF",
  backgroundImage: "",
  foregroundImage: "",
};


export async function getTheme(): Promise<Theme> {
    try {
        const docSnap = await getDoc(themeDocRef);
        if (docSnap.exists()) {
            return docSnap.data() as Theme;
        }
        // If the document doesn't exist, create it with default data.
        await setDoc(themeDocRef, defaultTheme);
        return defaultTheme;
    } catch (error) {
        console.warn('Failed to connect to Firestore. Falling back to default theme.', error);
        // Fallback for when Firestore is not available (e.g., offline, not set up)
        return defaultTheme;
    }
}

export async function saveTheme(theme: Theme): Promise<void> {
    try {
        await setDoc(themeDocRef, theme);
    } catch (error) {
         console.error('Failed to save theme to Firestore.', error);
         throw new Error('Failed to save theme. Ensure Firestore is set up correctly.');
    }
}
