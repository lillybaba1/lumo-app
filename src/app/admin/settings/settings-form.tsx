
"use client";

import * as React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Save, Loader2 } from 'lucide-react';
import { saveSettings } from './actions';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Settings = {
  currency: string;
};

const currencies = [
    { code: 'USD', name: 'United States Dollar ($)' },
    { code: 'EUR', name: 'Euro (€)' },
    { code: 'GBP', name: 'British Pound (£)' },
    { code: 'JPY', name: 'Japanese Yen (¥)' },
    { code: 'AUD', name: 'Australian Dollar (A$)' },
    { code: 'CAD', name: 'Canadian Dollar (C$)' },
];

export default function SettingsForm({ settings }: { settings: Settings }) {
  const { toast } = useToast();
  
  const [currency, setCurrency] = useState(settings.currency);
  const [isSaving, setIsSaving] = useState(false);

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setIsSaving(true);
      
      const formData = new FormData();
      formData.append('currency', currency);
      
      const result = await saveSettings(formData);

      toast({
          title: result.success ? "Settings Updated" : "Error",
          description: result.message,
          variant: result.success ? "default" : "destructive",
      });
      setIsSaving(false);
  }

  return (
      <Card>
        <form onSubmit={handleFormSubmit}>
            <CardHeader>
            <CardTitle>Store Settings</CardTitle>
            <CardDescription>
                Manage your store's general settings.
            </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2 max-w-sm">
                    <Label htmlFor="currency">Store Currency</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                        <SelectTrigger id="currency">
                            <SelectValue placeholder="Select a currency" />
                        </SelectTrigger>
                        <SelectContent>
                            {currencies.map(c => (
                                <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
                <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Save className="mr-2 h-4 w-4" />
                    )}
                    {isSaving ? 'Saving...' : 'Save Settings'}
                </Button>
            </CardFooter>
        </form>
      </Card>
  );
}
