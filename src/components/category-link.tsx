"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

interface Props {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export default function CategoryLink({ href, children, className = '' }: Props) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`flex items-center gap-2 px-2 py-1 rounded-md ${isActive ? 'bg-accent/20 text-accent-foreground' : 'hover:bg-muted'} ${className}`}
      aria-current={isActive ? 'page' : undefined}
    >
      {children}
    </Link>
  );
}
