
import { getCurrentUser } from '@/hooks/use-auth';
import { Button } from './ui/button';
import { User, LogOut } from 'lucide-react';
import Link from 'next/link';
import LogoutButton from './logout-button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"


export default async function AuthMenu() {
    const user = await getCurrentUser();

    if (!user) {
        return (
            <Button variant="ghost" asChild>
              <Link href="/login">
                <User className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Login</span>
              </Link>
            </Button>
        )
    }

    const userInitials = user.name ? user.name.split(' ').map(n => n[0]).join('') : user.email?.charAt(0).toUpperCase();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                   <Avatar className="h-8 w-8">
                     <AvatarImage src={user.picture} alt={user.name || user.email || 'user'} />
                     <AvatarFallback>{userInitials}</AvatarFallback>
                   </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                    <div className="font-normal text-sm text-muted-foreground">{user.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                 {user.role === 'admin' && (
                    <DropdownMenuItem asChild>
                        <Link href="/admin/dashboard">
                            <User className="mr-2 h-4 w-4"/>
                            Admin
                        </Link>
                    </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                    <LogoutButton />
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
