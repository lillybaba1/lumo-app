
import Link from 'next/link';
import { getCurrentUser } from '@/hooks/use-auth';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { User, LogOut, LayoutDashboard } from 'lucide-react';
import LogoutButton from './logout-button';

export default async function AuthMenu() {
    const user = await getCurrentUser();

    if (!user) {
        return (
            <Button asChild variant="ghost">
                <Link href="/login">Login</Link>
            </Button>
        );
    }
    
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                 <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback>{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {user.role === 'admin' && (
                    <DropdownMenuItem asChild>
                        <Link href="/admin/dashboard">
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            Admin Dashboard
                        </Link>
                    </DropdownMenuItem>
                )}
                <DropdownMenuItem>
                   <LogoutButton />
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
