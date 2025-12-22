import { Suspense } from 'react';
import SignupForm from "./signup-form";
import { Loader2 } from 'lucide-react';

function SignupFormFallback() {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Loading...</p>
            </div>
        </div>
    );
}

export default function SignupPage() {
    return (
        <Suspense fallback={<SignupFormFallback />}>
            <SignupForm />
        </Suspense>
    );
}
