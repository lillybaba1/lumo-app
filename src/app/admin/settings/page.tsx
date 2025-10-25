
import { getSettings } from './actions';
import SettingsForm from './settings-form';

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-headline font-bold">Store Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure all aspects of your e-commerce store
        </p>
      </div>
      <SettingsForm settings={settings} />
    </div>
  );
}
