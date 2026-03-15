'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useEffect, useRef } from 'react';
import { changePassword } from './actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Updating...
        </>
      ) : (
        <>
          <Lock className="mr-2 h-4 w-4" />
          Change Password
        </>
      )}
    </Button>
  );
}

const initialState = { success: false, message: '', errors: null as Record<string, string[]> | null };

export default function ChangePasswordForm() {
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useFormState(changePassword, initialState);

  useEffect(() => {
    if (state.message) {
      toast({
        title: state.success ? 'Success' : 'Error',
        description: state.message,
        variant: state.success ? 'default' : 'destructive',
      });
      if (state.success) {
        formRef.current?.reset();
      }
    }
  }, [state, toast]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="new_password">New Password *</Label>
        <Input
          id="new_password"
          name="new_password"
          type="password"
          required
          minLength={6}
          placeholder="Enter new password (min. 6 characters)"
        />
        {state.errors?.new_password && (
          <p className="text-sm text-destructive">{state.errors.new_password[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm_password">Confirm New Password *</Label>
        <Input
          id="confirm_password"
          name="confirm_password"
          type="password"
          required
          minLength={6}
          placeholder="Re-enter your new password"
        />
        {state.errors?.confirm_password && (
          <p className="text-sm text-destructive">{state.errors.confirm_password[0]}</p>
        )}
      </div>

      <div className="flex justify-end pt-4">
        <SubmitButton />
      </div>
    </form>
  );
}
