
import { getSettings } from './actions';
import SettingsForm from './settings-form';

const defaultSettings = {
  currency: "USD",
};


export default async function SettingsPage() {
  const settings = await getSettings() ?? defaultSettings;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-headline font-bold">Settings</h1>
      </div>
      <SettingsForm settings={settings} />
    </div>
  );
}
