
"use client";

import { useToast } from '@/hooks/use-toast';
import { LogOut } from 'lucide-react';

export default function LogoutButton() {
    const { toast } = useToast();

    const handleLogout = async () => {
        const res = await fetch('/api/auth/logout', { method: 'POST' });
        if (res.ok) {
            toast({
                title: "Logged Out",
                description: "You have been successfully logged out."
            });
            // Hard redirect to ensure server state is refreshed
            window.location.assign('/');
        } else {
            toast({
                title: "Logout Failed",
                description: "Something went wrong. Please try again.",
                variant: "destructive"
            });
        }
    };

    return (
        <button onClick={handleLogout} className="flex items-center w-full">
            <LogOut className="mr-2 h-4 w-4"/>
            Logout
        </button>
    );
}
