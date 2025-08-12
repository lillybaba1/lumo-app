
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

const defaultTheme: Theme = {
  primaryColor: "#D0BFFF",
  accentColor: "#FFB3C6",
  backgroundColor: "#E8E2FF",
  backgroundImage: "https://placehold.co/1200x800.png",
  foregroundImage: "https://placehold.co/400x400.png",
};


export async function getTheme(): Promise<Theme> {
    try {
        const docSnap = await getDoc(themeDocRef);
        if (docSnap.exists()) {
            return docSnap.data() as Theme;
        }
        return defaultTheme;
    } catch (error) {
        console.warn('Failed to connect to Firestore. Falling back to default theme.', error);
        return defaultTheme;
    }
}

export async function saveTheme(theme: Partial<Theme>): Promise<void> {
    try {
        await setDoc(themeDocRef, theme, { merge: true });
    } catch (error) {
         console.error('Failed to save theme to Firestore.', error);
         throw new Error('Failed to save theme. Ensure Firestore is set up correctly.');
    }
}
