
import { getSettings } from './actions';
import SettingsForm from './settings-form';

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-headline font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure your store settings
        </p>
      </div>
      <SettingsForm settings={settings} />
    </div>
  );
}
