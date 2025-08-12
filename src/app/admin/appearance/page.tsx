import { getTheme } from './actions';
import AppearanceForm from './appearance-form';

export default async function AppearancePage() {
  const theme = await getTheme();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-headline font-bold">Appearance</h1>
      </div>
      <AppearanceForm theme={theme} />
    </div>
  );
}
