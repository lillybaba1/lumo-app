"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Building } from "lucide-react";
import { BusinessAccount } from "@/lib/types";

export default function BusinessProfilePage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [businessAccount, setBusinessAccount] = useState<BusinessAccount | null>(null);

  useEffect(() => {
    loadBusinessAccount();
  }, []);

  const loadBusinessAccount = async () => {
    try {
      const response = await fetch('/api/business/profile');
      if (!response.ok) throw new Error('Failed to load profile');
      const data = await response.json();
      setBusinessAccount(data);
    } catch (error) {
      console.error('Error loading business account:', error);
      toast({
        title: "Error",
        description: "Failed to load business profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!businessAccount) return;

    setSaving(true);
    try {
      const response = await fetch('/api/business/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(businessAccount)
      });

      if (!response.ok) throw new Error('Failed to save profile');

      toast({
        title: "Profile Updated",
        description: "Your business profile has been saved successfully"
      });
    } catch (error) {
      console.error('Error saving business account:', error);
      toast({
        title: "Error",
        description: "Failed to save business profile",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!businessAccount) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Unable to load business profile
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-headline font-bold">Business Profile</h1>
          <p className="text-muted-foreground mt-1">
            Manage your business information
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Business Information
            </CardTitle>
            <CardDescription>
              Basic information about your business
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  value={businessAccount.businessName}
                  onChange={(e) => setBusinessAccount({
                    ...businessAccount,
                    businessName: e.target.value
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPersonName">Contact Person *</Label>
                <Input
                  id="contactPersonName"
                  value={businessAccount.contactPersonName}
                  onChange={(e) => setBusinessAccount({
                    ...businessAccount,
                    contactPersonName: e.target.value
                  })}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email *</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={businessAccount.contactEmail}
                  onChange={(e) => setBusinessAccount({
                    ...businessAccount,
                    contactEmail: e.target.value
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessPhone">Business Phone</Label>
                <Input
                  id="businessPhone"
                  type="tel"
                  value={businessAccount.businessPhone || ''}
                  onChange={(e) => setBusinessAccount({
                    ...businessAccount,
                    businessPhone: e.target.value
                  })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessAddress">Business Address *</Label>
              <Textarea
                id="businessAddress"
                value={businessAccount.businessAddress}
                onChange={(e) => setBusinessAccount({
                  ...businessAccount,
                  businessAddress: e.target.value
                })}
                rows={3}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="taxId">Tax ID / Registration Number</Label>
                <Input
                  id="taxId"
                  value={businessAccount.taxId || ''}
                  onChange={(e) => setBusinessAccount({
                    ...businessAccount,
                    taxId: e.target.value
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={businessAccount.website || ''}
                  onChange={(e) => setBusinessAccount({
                    ...businessAccount,
                    website: e.target.value
                  })}
                  placeholder="https://example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Business Description</Label>
              <Textarea
                id="description"
                value={businessAccount.description || ''}
                onChange={(e) => setBusinessAccount({
                  ...businessAccount,
                  description: e.target.value
                })}
                rows={4}
                placeholder="Tell customers about your business..."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Policies</CardTitle>
            <CardDescription>
              Define your shipping and return policies
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shippingPolicies">Shipping Policy</Label>
              <Textarea
                id="shippingPolicies"
                value={businessAccount.shippingPolicies || ''}
                onChange={(e) => setBusinessAccount({
                  ...businessAccount,
                  shippingPolicies: e.target.value
                })}
                rows={4}
                placeholder="Describe your shipping methods, delivery times, and costs..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="returnPolicy">Return Policy</Label>
              <Textarea
                id="returnPolicy"
                value={businessAccount.returnPolicy || ''}
                onChange={(e) => setBusinessAccount({
                  ...businessAccount,
                  returnPolicy: e.target.value
                })}
                rows={4}
                placeholder="Describe your return and refund policy..."
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
