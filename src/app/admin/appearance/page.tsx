import { getActiveTheme } from './actions';
import ThemeSelector from './theme-selector';
import HeroSettingsForm from './hero-settings-form';
import CategorySectionForm from './category-section-form';
import { getSettings } from '@/services/settingsService';

export default async function AppearancePage() {
  const activeThemeId = await getActiveTheme();
  const settings = await getSettings();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Site Appearance</h1>
        <p className="text-muted-foreground">
          Choose a theme to customize the look and feel of your store. Changes will be visible to all visitors.
        </p>
      </div>

      <ThemeSelector activeThemeId={activeThemeId} />

      <HeroSettingsForm />

      <CategorySectionForm settings={settings} />
    </div>
  );
}
