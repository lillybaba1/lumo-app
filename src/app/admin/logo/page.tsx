import { getLogoSettings } from './actions';
import LogoForm from './logo-form';

export default async function LogoAdminPage() {
  const settings = await getLogoSettings();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-headline font-bold">Logo & Branding</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Customize your store logo and favicon with image cropping
          </p>
        </div>
      </div>
      <LogoForm initialSettings={settings} />
    </div>
  );
}
