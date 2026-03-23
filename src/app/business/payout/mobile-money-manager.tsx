'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Loader2, Plus, Trash2, Smartphone, CheckCircle, AlertCircle
} from 'lucide-react';

type MobileMoneyAccount = {
  provider: 'QMoney' | 'Afrimoney' | 'Wave';
  number: string;
  accountName: string;
};

interface Props {
  businessAccountId: string;
  currentAccounts: MobileMoneyAccount[];
}

const PROVIDERS = [
  { value: 'Wave', label: 'Wave', color: 'text-blue-600 bg-blue-100' },
  { value: 'QMoney', label: 'QMoney', color: 'text-green-600 bg-green-100' },
  { value: 'Afrimoney', label: 'Afrimoney', color: 'text-orange-600 bg-orange-100' },
] as const;

export default function MobileMoneyManager({ businessAccountId, currentAccounts }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [accounts, setAccounts] = useState<MobileMoneyAccount[]>(currentAccounts || []);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // New account form state
  const [newProvider, setNewProvider] = useState<string>('');
  const [newNumber, setNewNumber] = useState('');
  const [newAccountName, setNewAccountName] = useState('');

  const handleAddAccount = () => {
    if (!newProvider || !newNumber.trim() || !newAccountName.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all fields.',
        variant: 'destructive',
      });
      return;
    }

    // Check for duplicate provider+number
    const exists = accounts.some(a => a.provider === newProvider && a.number === newNumber.trim());
    if (exists) {
      toast({
        title: 'Duplicate Account',
        description: 'This mobile money account already exists.',
        variant: 'destructive',
      });
      return;
    }

    const updated = [...accounts, {
      provider: newProvider as MobileMoneyAccount['provider'],
      number: newNumber.trim(),
      accountName: newAccountName.trim(),
    }];
    
    setAccounts(updated);
    setNewProvider('');
    setNewNumber('');
    setNewAccountName('');
    setShowAddForm(false);
  };

  const handleRemoveAccount = (index: number) => {
    setAccounts(accounts.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/business/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobileMoneyAccounts: accounts,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save mobile money accounts');
      }

      toast({
        title: 'Payment Methods Saved',
        description: 'Your mobile money accounts have been updated. Customers will see these at checkout.',
      });
      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const hasChanges = JSON.stringify(accounts) !== JSON.stringify(currentAccounts || []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          Mobile Money Accounts
        </CardTitle>
        <CardDescription>
          Add your mobile money numbers so customers can pay you directly at checkout. 
          These will be shown to buyers when they select &quot;Mobile Money Transfer&quot; as payment.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing Accounts */}
        {accounts.length > 0 ? (
          <div className="space-y-3">
            {accounts.map((account, index) => {
              const providerInfo = PROVIDERS.find(p => p.value === account.provider);
              return (
                <div key={index} className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                  <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ${providerInfo?.color || 'text-gray-600 bg-gray-100'}`}>
                    {account.provider}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm font-medium">{account.number}</p>
                    <p className="text-xs text-muted-foreground truncate">{account.accountName}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleRemoveAccount(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 border-2 border-dashed rounded-lg">
            <Smartphone className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium">No mobile money accounts added</p>
            <p className="text-xs text-muted-foreground mt-1">
              Add at least one account so customers can pay via mobile money
            </p>
          </div>
        )}

        {/* Add Account Form */}
        {showAddForm ? (
          <div className="p-4 border rounded-lg bg-muted/20 space-y-3">
            <h4 className="text-sm font-medium">Add Mobile Money Account</h4>
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Provider *</Label>
                <Select value={newProvider} onValueChange={setNewProvider}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVIDERS.map(p => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Phone Number *</Label>
                <Input
                  value={newNumber}
                  onChange={(e) => setNewNumber(e.target.value)}
                  placeholder="+220 XXXXXXX"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Account Name *</Label>
                <Input
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  placeholder="Name on account"
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={handleAddAccount}>
                <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                Add
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => {
                setShowAddForm(false);
                setNewProvider('');
                setNewNumber('');
                setNewAccountName('');
              }}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Mobile Money Account
          </Button>
        )}

        {/* Info */}
        {accounts.length > 0 && (
          <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-green-700 dark:text-green-300">
              Customers who choose &quot;Mobile Money Transfer&quot; at checkout will see your {accounts.length === 1 ? 'account' : 'accounts'} and can send payment directly.
            </p>
          </div>
        )}

        {accounts.length === 0 && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Without mobile money accounts, customers won&apos;t be able to pay you via mobile money. They can still use Wave/Card (PayDunya) or Cash on Delivery.
            </p>
          </div>
        )}

        {/* Save Button */}
        {hasChanges && (
          <Button onClick={handleSave} disabled={isLoading} className="w-full">
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Save Mobile Money Accounts
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
