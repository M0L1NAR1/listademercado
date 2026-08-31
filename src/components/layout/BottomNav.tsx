"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, Package, BarChart3, History, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/lista", label: "Lista", icon: ShoppingCart },
  { href: "/estoque", label: "Estoque", icon: Package },
  { href: "/historico", label: "Histórico", icon: History },
  { href: "/comparativo", label: "Comparativo", icon: BarChart3 },
  { href: "/perfil", label: "Sobre", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 border-t border-border bg-surface/95 backdrop-blur-lg">
      <div
        className="flex items-center justify-around px-2 pt-2"
        style={{ paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom))" }}
      >
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-1.5 transition-colors",
                active ? "text-brand-600" : "text-text-muted"
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-2xl transition-all",
                  active && "bg-brand-100 dark:bg-brand-900/40"
                )}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 2} />
              </div>
              <span className="text-[10px] font-semibold">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
