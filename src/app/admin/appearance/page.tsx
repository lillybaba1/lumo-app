
import { getTheme } from './actions';
import AppearanceForm from './appearance-form';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

type Theme = {
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  backgroundImage: string;
  foregroundImage: string;
};

export default async function AppearancePage() {
  const theme = await getTheme();

  if (!theme) {
    return (
       <div>
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-headline font-bold">Appearance</h1>
        </div>
        <Card>
            <CardHeader>
                <CardTitle><Skeleton className="h-8 w-48" /></CardTitle>
                <CardDescription><Skeleton className="h-4 w-72" /></CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
                 <div className="flex justify-end gap-2">
                    <Skeleton className="h-10 w-32" />
                </div>
            </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-headline font-bold">Appearance</h1>
      </div>
      <AppearanceForm theme={theme} />
    </div>
  );
}
