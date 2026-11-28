"use client";

import { LogOut, Settings } from "lucide-react";
import { useSession } from "next-auth/react";

import { logOut } from "@/actions/auth";
import { Avatar, AvatarFallback } from "@/components/shadcn/avatar/avatar";
import { Button } from "@/components/shadcn/button/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";

export const UserNav = () => {
  const { data: session } = useSession();

  if (!session?.user) return null;

  const { name } = session.user;

  const initials = name.includes(" ")
    ? name
        .split(" ")
        .map((word) => word.charAt(0))
        .join("")
    : name.charAt(0);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon-sm"
          className="border-border-input-primary-fill rounded-full"
          aria-label="Account menu"
        >
          <Avatar className="h-8 w-8">
            {/* Solid white disc + dark initials, matching the platform header. */}
            <AvatarFallback className="bg-white text-xs font-bold text-black uppercase">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate">{name}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href="/profile">
            <Settings />
            Account Settings
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => logOut()}>
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
