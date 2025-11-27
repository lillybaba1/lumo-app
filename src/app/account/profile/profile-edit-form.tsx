'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useEffect } from 'react';
import { updateProfile } from './actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type ProfileEditFormProps = {
  user: {
    name: string;
    email: string;
    phone_number: string;
  };
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Saving...
        </>
      ) : (
        <>
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </>
      )}
    </Button>
  );
}

const initialState = { success: false, message: '' };

export default function ProfileEditForm({ user }: ProfileEditFormProps) {
  const { toast } = useToast();
  const [state, formAction] = useFormState(updateProfile, initialState);

  useEffect(() => {
    if (state.message) {
      toast({
        title: state.success ? 'Success' : 'Error',
        description: state.message,
        variant: state.success ? 'default' : 'destructive',
      });
    }
  }, [state, toast]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name *</Label>
        <Input
          id="name"
          name="name"
          type="text"
          defaultValue={user.name}
          required
          placeholder="Enter your full name"
        />
        {state.errors?.name && (
          <p className="text-sm text-destructive">{state.errors.name[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={user.email}
          disabled
          className="bg-muted cursor-not-allowed"
        />
        <p className="text-xs text-muted-foreground">
          Email cannot be changed. Contact support if you need to update your email address.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone_number">Phone Number</Label>
        <Input
          id="phone_number"
          name="phone_number"
          type="tel"
          defaultValue={user.phone_number}
          placeholder="+220 123 4567"
        />
        {state.errors?.phone_number && (
          <p className="text-sm text-destructive">{state.errors.phone_number[0]}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Optional. Include country code for international numbers.
        </p>
      </div>

      <div className="flex justify-end pt-4">
        <SubmitButton />
      </div>
    </form>
  );
}
