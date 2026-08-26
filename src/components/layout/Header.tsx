"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
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
  Users,
  Settings,
  HelpCircle,
  LogOut,
  ChevronDown,
  BrainCircuit,
} from "lucide-react";
import { toast } from "sonner";
import { isRouteAllowed, getRoleDisplayName } from "@/lib/permissions";
import { useSession } from "@/hooks/useSession";
import { useActivities, useMarkActivityRead } from "@/hooks/useActivities";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/compliance", label: "Compliance", icon: FileCheck },
  { href: "/inspections", label: "Inspections", icon: ClipboardList },
  { href: "/incidents", label: "Incidents", icon: AlertTriangle },
  { href: "/gis", label: "GIS Map", icon: Layers },
  {href:"/employees",label:"Employees",icon: Users},
  { href: "/ai-insights", label: "AI Insights", icon: BrainCircuit },
];

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { session, signOut } = useSession();

  // Real, live unread-activity count — kept in sync via Postgres
  // Realtime inside useActivities, instead of a hardcoded badge.
  const { data: activities = [] } = useActivities(undefined, 50);
  const markRead = useMarkActivityRead();
  const notificationCount = activities.filter((a) => !a.read).length;

  useEffect(() => {
    setMounted(true);
  }, []);

  const allowedNavItems = navItems.filter(item => {
    if (!session) return false;
    return isRouteAllowed(session.role, item.href);
  });

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  const handleLogout = async () => {
    await signOut();
    toast.success("Logged out");
    router.push("/login");
    router.refresh();
  };

  const handleClearNotifications = () => {
    activities.filter((a) => !a.read).forEach((a) => markRead.mutate(a.id));
    toast.success("All notifications cleared!");
  };

  const timeAgo = (iso: string) => {
    const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
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
            <span className="font-bold text-lg tracking-tight">Suraksha<span className="text-yellow-600">Mine</span></span>
            
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white animate-pulse">
                    {notificationCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="end">
              <div className="flex items-center justify-between px-2 py-1.5">
                <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
                {notificationCount > 0 && (
                  <button
                    className="text-xs font-medium text-yellow-700 hover:underline dark:text-yellow-500"
                    onClick={handleClearNotifications}
                  >
                    Clear all
                  </button>
                )}
              </div>
              <DropdownMenuSeparator />
              {activities.length === 0 ? (
                <div className="px-2 py-6 text-center text-sm text-gray-500">No notifications yet</div>
              ) : (
                <div className="max-h-80 overflow-y-auto">
                  {activities.slice(0, 8).map((activity) => (
                    <DropdownMenuItem
                      key={activity.id}
                      className="flex flex-col items-start gap-0.5 whitespace-normal py-2"
                      onClick={() => !activity.read && markRead.mutate(activity.id)}
                    >
                      <div className="flex w-full items-start gap-2">
                        {!activity.read && (
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-600" />
                        )}
                        <p className={`text-sm ${activity.read ? "text-gray-500" : "font-medium"}`}>
                          {activity.message}
                        </p>
                      </div>
                      <span className="pl-3.5 text-xs text-gray-400">
                        {activity.mine_name ?? "All Mines"} · {timeAgo(activity.created_at)}
                      </span>
                    </DropdownMenuItem>
                  ))}
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {mounted && theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
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