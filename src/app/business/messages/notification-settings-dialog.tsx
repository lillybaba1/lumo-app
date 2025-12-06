'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Settings, Save } from 'lucide-react';
import { getNotificationSettings, updateNotificationSettings } from './actions';
import { useToast } from '@/hooks/use-toast';

interface NotificationSettings {
  email_notifications: boolean;
  push_notifications: boolean;
  auto_reply_enabled: boolean;
  auto_reply_message: string;
  business_hours_only: boolean;
  business_hours_start: string;
  business_hours_end: string;
}

export function NotificationSettingsDialog() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    email_notifications: true,
    push_notifications: true,
    auto_reply_enabled: false,
    auto_reply_message: '',
    business_hours_only: false,
    business_hours_start: '09:00',
    business_hours_end: '17:00',
  });

  useEffect(() => {
    if (open) {
      loadSettings();
    }
  }, [open]);

  async function loadSettings() {
    setLoading(true);
    const result = await getNotificationSettings();
    if (result.success && result.data) {
      setSettings(result.data);
    }
    setLoading(false);
  }

  async function handleSave() {
    setLoading(true);
    const result = await updateNotificationSettings(settings);
    if (result.success) {
      toast({ title: 'Settings saved' });
      setOpen(false);
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Notification Settings">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Notification Settings</DialogTitle>
          <DialogDescription>
            Configure how you receive message notifications.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Notification Preferences */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Notifications</h4>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-notif">Email Notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Receive email when you get new messages
                </p>
              </div>
              <Switch
                id="email-notif"
                checked={settings.email_notifications}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, email_notifications: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="push-notif">Push Notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Browser push notifications for new messages
                </p>
              </div>
              <Switch
                id="push-notif"
                checked={settings.push_notifications}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, push_notifications: checked })
                }
              />
            </div>
          </div>

          {/* Auto Reply */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Auto Reply</h4>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-reply">Enable Auto Reply</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically reply to new messages
                </p>
              </div>
              <Switch
                id="auto-reply"
                checked={settings.auto_reply_enabled}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, auto_reply_enabled: checked })
                }
              />
            </div>

            {settings.auto_reply_enabled && (
              <div className="space-y-2">
                <Label htmlFor="auto-message">Auto Reply Message</Label>
                <Textarea
                  id="auto-message"
                  placeholder="Thanks for your message! We'll get back to you within 24 hours."
                  rows={3}
                  value={settings.auto_reply_message}
                  onChange={(e) =>
                    setSettings({ ...settings, auto_reply_message: e.target.value })
                  }
                />
              </div>
            )}
          </div>

          {/* Business Hours */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Business Hours</h4>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="biz-hours">Business Hours Only</Label>
                <p className="text-xs text-muted-foreground">
                  Only send auto-reply outside business hours
                </p>
              </div>
              <Switch
                id="biz-hours"
                checked={settings.business_hours_only}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, business_hours_only: checked })
                }
              />
            </div>

            {settings.business_hours_only && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-time">Start Time</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={settings.business_hours_start}
                    onChange={(e) =>
                      setSettings({ ...settings, business_hours_start: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-time">End Time</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={settings.business_hours_end}
                    onChange={(e) =>
                      setSettings({ ...settings, business_hours_end: e.target.value })
                    }
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
