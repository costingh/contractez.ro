"use client";

import { Bot, Briefcase, CreditCard, Handshake, LayoutDashboard, LogOut, Settings, Shield, UserRound, UserRoundPlus } from "lucide-react";
import Link from "next/link";
import { logoutAction } from "@/app/(auth)/actions";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { initials } from "@/lib/format";

type Props = {
  user: { name: string; email: string; isProvider: boolean; isClient: boolean; role: string; avatarPath: string | null };
};

const icon = "text-muted-foreground";

export function UserMenu({ user }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="ml-0.5 rounded-full" aria-label="Contul meu">
          <Avatar className="size-8">
            {user.avatarPath && <AvatarImage src={`/api/files/${user.avatarPath}`} alt="" />}
            <AvatarFallback className="text-xs">{initials(user.name)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="px-2 py-2 font-normal">
          <div className="text-sm font-semibold text-foreground">{user.name}</div>
          <div className="truncate text-xs text-muted-foreground">{user.email}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/panou">
            <LayoutDashboard className={icon} /> Panou
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/profil">
            <UserRound className={icon} /> Profilul meu
          </Link>
        </DropdownMenuItem>
        {user.isProvider && (
          <>
            <DropdownMenuItem asChild>
              <Link href="/abonament">
                <CreditCard className={icon} /> Abonament
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/auto-bid">
                <Bot className={icon} /> Auto Bid
              </Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuItem asChild>
          <Link href="/colaborari">
            <Handshake className={icon} /> Colaborări
          </Link>
        </DropdownMenuItem>
        {(!user.isProvider || !user.isClient) && (
          <DropdownMenuItem asChild>
            <Link href={user.isProvider ? "/onboarding?rol=client" : "/onboarding?rol=prestator"}>
              {user.isProvider ? <UserRoundPlus className={icon} /> : <Briefcase className={icon} />}
              {user.isProvider ? "Activează rolul de client" : "Devino prestator"}
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link href="/setari">
            <Settings className={icon} /> Setări
          </Link>
        </DropdownMenuItem>
        {user.role === "admin" && (
          <DropdownMenuItem asChild>
            <Link href="/admin">
              <Shield className={icon} /> Administrare
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <div className="flex items-center justify-between gap-3 px-2 py-1.5">
          <span className="text-sm text-muted-foreground">Temă</span>
          <ThemeToggle />
        </div>
        <DropdownMenuSeparator />
        <form action={logoutAction}>
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full">
              <LogOut className={icon} /> Ieși din cont
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
