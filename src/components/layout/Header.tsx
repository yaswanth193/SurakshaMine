"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  FileCheck,
  ClipboardList,
  AlertTriangle,
  Layers,
  Search,
  Bell,
  Sun,
  Moon,
  User,
  Settings,
  HelpCircle,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { isRouteAllowed, getRoleDisplayName, type UserSession } from "@/lib/permissions";
import { useEffect } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/compliance", label: "Compliance", icon: FileCheck },
  { href: "/inspections", label: "Inspections", icon: ClipboardList },
  { href: "/incidents", label: "Incidents", icon: AlertTriangle },
  { href: "/gis", label: "GIS Map", icon: Layers },
];

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notificationCount, setNotificationCount] = useState(4);
  const [session, setSession] = useState<UserSession | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("coalgov360_session");
    if (saved) {
      try {
        setSession(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const allowedNavItems = navItems.filter(item => {
    if (!session) return false;
    return isRouteAllowed(session.role, item.href);
  });

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  const handleLogout = () => {
    toast.success("Logging out...");
    localStorage.removeItem("coalgov360_session");
    setTimeout(() => {
      router.push("/login");
    }, 500);
  };

  const handleClearNotifications = () => {
    setNotificationCount(0);
    toast.success("All notifications cleared!");
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-gray-950/95 border-gray-200 dark:border-gray-800">
      <div className="flex h-16 items-center px-4 md:px-6 gap-4">
        {/* Brand */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-600 to-yellow-500 text-white">
            <span className="text-lg font-bold">⛏</span>
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight">Coal<span className="text-yellow-600">Gov</span>360</span>
            <span className="ml-2 hidden text-xs text-gray-500 md:inline-block">· SIH 2026</span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="hidden flex-1 items-center gap-1 md:flex">
          {allowedNavItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Button
                key={item.href}
                variant="ghost"
                size="sm"
                className={`gap-2 ${isActive ? "bg-yellow-50 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400" : "text-gray-600 hover:text-gray-900 dark:text-gray-400"}`}
                onClick={() => handleNavigation(item.href)}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Button>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="ml-auto flex items-center gap-2">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search..."
              className="h-9 w-48 pl-9 text-sm bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
            />
          </div>

          <Button variant="ghost" size="icon" className="relative" onClick={handleClearNotifications}>
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white animate-pulse">
                {notificationCount}
              </span>
            )}
          </Button>

          <Button variant="ghost" size="icon" onClick={() => setIsDarkMode(!isDarkMode)}>
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 gap-2 px-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-yellow-600 text-sm font-bold text-white">
                    {session ? session.name.split(" ").map(n => n[0]).join("") : "AK"}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden text-left md:block">
                  <p className="text-sm font-medium leading-none">{session ? session.name : "Admin Kumar"}</p>
                  <p className="text-xs text-gray-500">{session ? getRoleDisplayName(session.role) : "Administrator"}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/profile")}>
                <User className="mr-2 h-4 w-4" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/settings")}>
                <Settings className="mr-2 h-4 w-4" /> Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/help")}>
                <HelpCircle className="mr-2 h-4 w-4" /> Help
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}