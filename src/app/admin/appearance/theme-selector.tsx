"use client";

import { useState, useTransition } from 'react';
import { themes } from '@/lib/themes';
import { updateTheme } from './actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface ThemeSelectorProps {
  activeThemeId: string;
}

export default function ThemeSelector({ activeThemeId: initialActiveThemeId }: ThemeSelectorProps) {
  const [activeThemeId, setActiveThemeId] = useState(initialActiveThemeId);
  const [previewThemeId, setPreviewThemeId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const handleSelectTheme = (themeId: string) => {
    setPreviewThemeId(themeId);
  };

  const handleApplyTheme = async () => {
    if (!previewThemeId) return;

    startTransition(async () => {
      const result = await updateTheme(previewThemeId);

      if (result.success) {
        setActiveThemeId(previewThemeId);
        setPreviewThemeId(null);
        toast({
          title: 'Theme Applied',
          description: 'The theme has been updated successfully.',
        });
        router.refresh();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update theme',
          variant: 'destructive',
        });
      }
    });
  };

  const handleCancelPreview = () => {
    setPreviewThemeId(null);
  };

  const displayedThemeId = previewThemeId || activeThemeId;

  return (
    <div className="space-y-6">
      {/* Preview Banner */}
      {previewThemeId && (
        <Card className="border-blue-500 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold">Previewing theme</p>
              <p className="text-sm text-muted-foreground">
                This is how your site will look with the selected theme.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancelPreview} disabled={isPending}>
                Cancel
              </Button>
              <Button onClick={handleApplyTheme} disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save & Apply
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Theme Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {themes.map((theme) => {
          const isActive = theme.id === activeThemeId;
          const isSelected = theme.id === displayedThemeId;

          return (
            <Card
              key={theme.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                isSelected ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => handleSelectTheme(theme.id)}
            >
              <CardContent className="p-0">
                {/* Theme Preview */}
                <div
                  className="h-32 rounded-t-lg relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${theme.backgroundColor} 0%, ${theme.backgroundColor} 50%, ${theme.accentColor} 100%)`,
                  }}
                >
                  {/* Sample UI Elements */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-white/30"></div>
                      <div className="w-2 h-2 rounded-full bg-white/30"></div>
                      <div className="w-2 h-2 rounded-full bg-white/30"></div>
                    </div>
                    <div
                      className="px-2 py-0.5 rounded text-xs font-medium"
                      style={{
                        backgroundColor: theme.accentColor,
                        color: theme.category === 'dark' ? '#fff' : '#000',
                      }}
                    >
                      {theme.category}
                    </div>
                  </div>

                  <div className="absolute bottom-3 left-3">
                    <div
                      className="w-16 h-2 rounded"
                      style={{ backgroundColor: theme.accentColor }}
                    ></div>
                    <div className="w-20 h-1 rounded mt-1.5 bg-white/20"></div>
                  </div>

                  {/* Active/Selected Badge */}
                  {(isActive || isSelected) && (
                    <div className="absolute top-3 right-3">
                      <div className="bg-green-500 text-white rounded-full p-1">
                        <Check className="h-3 w-3" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Theme Info */}
                <div className="p-4">
                  <h3 className="font-semibold mb-1">{theme.name}</h3>
                  <p className="text-sm text-muted-foreground">{theme.description}</p>
                  {isActive && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-2 font-medium">
                      Currently Active
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
