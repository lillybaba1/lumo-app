import { getActiveTheme } from './actions';
import ThemeSelector from './theme-selector';
import HeroSettingsForm from './hero-settings-form';
import CategorySectionForm from './category-section-form';
import { getSettings } from '@/services/settingsService';

export default async function AppearancePage() {
  const activeThemeId = await getActiveTheme();
  const settings = await getSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-headline font-bold">Site Appearance</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Customize the look and feel of your store
        </p>
      </div>

      <ThemeSelector activeThemeId={activeThemeId} />

      <HeroSettingsForm />

      <CategorySectionForm settings={settings} />
    </div>
  );
}
