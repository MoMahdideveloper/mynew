"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

interface NavLinkProps {
  href: string;
  label: string;
  icon?: ReactNode;
}

export function NavLink({ href, label, icon }: NavLinkProps) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm font-medium ${active ? "bg-accent-muted text-accent" : "text-ink-subtle hover:text-ink"}`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}
