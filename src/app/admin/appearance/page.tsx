
import { getTheme } from './actions';
import AppearanceForm from './appearance-form';

const defaultTheme = {
  primaryColor: "#D0BFFF",
  accentColor: "#FFB3C6",
  backgroundColor: "#E8E2FF",
  backgroundImage: "https://placehold.co/1200x800.png",
  foregroundImage: "https://placehold.co/400x400.png",
};


export default async function AppearancePage() {
  const theme = await getTheme() ?? defaultTheme;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-headline font-bold">Appearance</h1>
      </div>
      <AppearanceForm theme={theme} />
    </div>
  );
}
