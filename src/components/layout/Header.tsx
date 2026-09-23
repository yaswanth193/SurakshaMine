"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
  FileText,
  ShieldAlert,
  Newspaper,
  Building2,
  ExternalLink,
  Calendar,
  Scale,
  Menu,
  BarChart3,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { isRouteAllowed, getRoleDisplayName } from "@/lib/permissions";
import { useSession } from "@/hooks/useSession";
import { useActivities, useMarkActivityRead } from "@/hooks/useActivities";
import { useMiningNews } from "@/hooks/useMiningNews";
import { MiningNewsModal } from "@/components/layout/MiningNewsModal";
import type { MiningNewsItem } from "@/app/api/news/route";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/compliance", label: "Compliance", icon: FileCheck },
  { href: "/inspections", label: "Inspections", icon: ClipboardList },
  { href: "/incidents", label: "Incidents", icon: AlertTriangle },
  { href: "/gis", label: "GIS Map", icon: Layers },
  { href: "/regulations", label: "Regulations", icon: Scale },
  { href: "/analysis", label: "Analysis", icon: BarChart3 },
  { href: "/employees", label: "Employees", icon: Users },
  { href: "/ai-insights", label: "AI Insights", icon: BrainCircuit },
];

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { session, signOut } = useSession();
  const isMineManager = session?.role === "MINE_MANAGER";

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Tab state inside notifications dropdown
  const [notificationTab, setNotificationTab] = useState<"news" | "alerts">("news");
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
  const [activeNewsItem, setActiveNewsItem] = useState<MiningNewsItem | null>(null);

  // Live unread-activity count — scoped for MINE_MANAGER
  const { data: activities = [] } = useActivities(isMineManager && session?.mineId ? session.mineId : undefined, 50);
  const markActivityRead = useMarkActivityRead();
  const activityUnreadCount = activities.filter((a) => !a.read).length;

  // National Indian Mining News & DGMS Circulars
  const {
    news: miningNews = [],
    unreadCount: newsUnreadCount,
    isRead: isNewsRead,
    markRead: markNewsRead,
    markAllRead: markAllNewsRead,
  } = useMiningNews();

  const totalNotificationCount = activityUnreadCount + newsUnreadCount;

  useEffect(() => {
    setMounted(true);
  }, []);

  const allowedNavItems = mounted && session
    ? navItems.filter((item) => isRouteAllowed(session.role, item.href))
    : [];

  const handleNavigation = (href: string) => {
    setMobileMenuOpen(false);
    router.push(href);
  };

  const handleLogout = async () => {
    await signOut();
    toast.success("Logged out");
    router.push("/login");
    router.refresh();
  };

  const handleClearActivities = () => {
    activities.filter((a) => !a.read).forEach((a) => markActivityRead.mutate(a.id));
    toast.success("All mine alerts cleared!");
  };

  const timeAgo = (iso: string) => {
    const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const renderCategoryIcon = (category: string) => {
    switch (category) {
      case "DGMS Circular":
        return <FileText className="h-3 w-3 text-amber-600 dark:text-amber-400" />;
      case "Safety Directive":
        return <ShieldAlert className="h-3 w-3 text-red-600 dark:text-red-400" />;
      case "Ministry of Coal":
        return <Building2 className="h-3 w-3 text-blue-600 dark:text-blue-400" />;
      default:
        return <Newspaper className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />;
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-gray-950/95 border-gray-200 dark:border-gray-800">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 w-full">
          {/* Left Brand & Desktop Navigation (clean linear flow, no overlap) */}
          <div className="flex items-center gap-2.5 lg:gap-4 flex-1 min-w-0">
            {/* Mobile Hamburger Trigger for phones & tablets (< lg) */}
            <div className="flex items-center lg:hidden shrink-0">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-700 dark:text-gray-200">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle navigation menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[85vw] max-w-xs p-0 flex flex-col bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800">
                  {/* Drawer Header */}
                  <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex items-center justify-between">
                    <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-600 to-yellow-500 text-white">
                        <span className="text-base font-bold">⛏</span>
                      </div>
                      <span className="font-bold text-base tracking-tight">
                        Suraksha<span className="text-yellow-600">Mine</span>
                      </span>
                    </Link>
                  </div>

                  {/* Drawer User Card */}
                  {mounted && session && (
                    <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border border-yellow-600/30 shrink-0">
                          <AvatarFallback className="bg-yellow-600 text-xs font-bold text-white">
                            {session.name.split(" ").map(n => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="overflow-hidden">
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {session.name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium bg-yellow-50 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-800">
                              {getRoleDisplayName(session.role)}
                            </Badge>
                          </div>
                          {session.mineName && (
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                              {session.mineName}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mobile Navigation Links */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-1">
                    <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      Portal Navigation
                    </p>
                    {allowedNavItems.map((item) => {
                      const isActive = pathname === item.href;
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.href}
                          onClick={() => handleNavigation(item.href)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                            isActive
                              ? "bg-yellow-50 text-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-400 font-semibold"
                              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-900"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className={`h-4 w-4 ${isActive ? "text-yellow-600 dark:text-yellow-400" : "text-gray-400"}`} />
                            <span>{item.label}</span>
                          </div>
                          {isActive && (
                            <span className="h-1.5 w-1.5 rounded-full bg-yellow-600 dark:bg-yellow-400" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Drawer Footer */}
                  <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 space-y-1">
                    <button
                      onClick={() => handleNavigation("/profile")}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-gray-800"
                    >
                      <User className="h-3.5 w-3.5 text-gray-500" />
                      <span>My Profile</span>
                    </button>
                    <button
                      onClick={() => handleNavigation("/settings")}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-gray-800"
                    >
                      <Settings className="h-3.5 w-3.5 text-gray-500" />
                      <span>Settings</span>
                    </button>
                    <div className="pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Brand Logo & Name */}
            <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-600 to-yellow-500 text-white shadow-xs">
                <span className="text-lg font-bold">⛏</span>
              </div>
              <span className="font-bold text-lg tracking-tight whitespace-nowrap">
                Suraksha<span className="text-yellow-600">Mine</span>
              </span>
            </Link>

            {/* Desktop Navigation - all feature names shown directly in header */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 min-w-0">
              {allowedNavItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Button
                    key={item.href}
                    variant="ghost"
                    size="sm"
                    className={`h-8 px-2 xl:px-2.5 text-xs xl:text-sm font-medium gap-1.5 shrink-0 whitespace-nowrap transition-colors ${
                      isActive
                        ? "bg-yellow-50 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400 font-semibold shadow-2xs"
                        : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100/80 dark:hover:bg-gray-800/60"
                    }`}
                    onClick={() => handleNavigation(item.href)}
                  >
                    <Icon className="h-3.5 w-3.5 xl:h-4 xl:w-4 shrink-0" />
                    <span>{item.label}</span>
                  </Button>
                );
              })}
            </nav>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 ml-auto pl-2">

            {/* Notification Bell Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {totalNotificationCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white animate-pulse">
                      {totalNotificationCount > 9 ? "9+" : totalNotificationCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[92vw] max-w-sm sm:w-96 p-0" align="end">
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-1.5 font-semibold text-xs text-gray-900 dark:text-gray-100">
                    <Bell className="h-3.5 w-3.5 text-yellow-600" />
                    Notifications & Circulars
                  </div>
                  {notificationTab === "news" ? (
                    newsUnreadCount > 0 && (
                      <button
                        type="button"
                        className="text-xs font-medium text-yellow-700 hover:underline dark:text-yellow-500"
                        onClick={() => {
                          markAllNewsRead();
                          toast.success("All circulars marked as read");
                        }}
                      >
                        Mark all read
                      </button>
                    )
                  ) : (
                    activityUnreadCount > 0 && (
                      <button
                        type="button"
                        className="text-xs font-medium text-yellow-700 hover:underline dark:text-yellow-500"
                        onClick={handleClearActivities}
                      >
                        Clear all
                      </button>
                    )
                  )}
                </div>

                {/* Tab Switcher */}
                <div className="grid grid-cols-2 p-1 bg-gray-50/80 dark:bg-gray-900/60 border-b border-gray-100 dark:border-gray-800 gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setNotificationTab("news")}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md font-medium transition-all ${
                      notificationTab === "news"
                        ? "bg-white dark:bg-gray-800 text-yellow-800 dark:text-yellow-400 shadow-xs"
                        : "text-gray-500 hover:text-gray-900 dark:text-gray-400"
                    }`}
                  >
                    <span>🇮🇳 DGMS & News</span>
                    {newsUnreadCount > 0 && (
                      <span className="flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-yellow-600 text-[10px] font-bold text-white">
                        {newsUnreadCount}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotificationTab("alerts")}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md font-medium transition-all ${
                      notificationTab === "alerts"
                        ? "bg-white dark:bg-gray-800 text-yellow-800 dark:text-yellow-400 shadow-xs"
                        : "text-gray-500 hover:text-gray-900 dark:text-gray-400"
                    }`}
                  >
                    <span>⚡ Mine Alerts</span>
                    {activityUnreadCount > 0 && (
                      <span className="flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                        {activityUnreadCount}
                      </span>
                    )}
                  </button>
                </div>

                {/* Tab 1: DGMS Circulars & Live News */}
                {notificationTab === "news" && (
                  <div>
                    {miningNews.length === 0 ? (
                      <div className="px-4 py-8 text-center text-xs text-gray-500">
                        Loading latest Indian mining circulars & news...
                      </div>
                    ) : (
                      <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800/60">
                        {miningNews.slice(0, 6).map((item) => {
                          const read = isNewsRead(item.id);
                          return (
                            <div
                              key={item.id}
                              onClick={() => {
                                markNewsRead(item.id);
                                setActiveNewsItem(item);
                                setIsNewsModalOpen(true);
                              }}
                              className={`p-2.5 transition-colors cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/60 flex flex-col gap-1 ${
                                read ? "opacity-75" : "bg-yellow-50/20 dark:bg-yellow-950/10"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1.5">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  {renderCategoryIcon(item.category)}
                                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 truncate">
                                    {item.category}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="text-[10px] text-gray-400">{item.date}</span>
                                  {!read && (
                                    <span className="h-1.5 w-1.5 rounded-full bg-yellow-600" />
                                  )}
                                </div>
                              </div>

                              <p className={`text-xs leading-snug line-clamp-2 ${
                                read ? "text-gray-700 dark:text-gray-300" : "font-medium text-gray-900 dark:text-gray-100"
                              }`}>
                                {item.title}
                              </p>

                              <div className="flex items-center justify-between text-[10px] text-gray-400 mt-0.5">
                                <span className="truncate max-w-[200px]">{item.source}</span>
                                <span className="inline-flex items-center gap-0.5 font-semibold text-yellow-700 dark:text-yellow-400">
                                  Read In-App →
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="p-2 border-t border-gray-100 dark:border-gray-800 text-center bg-gray-50/50 dark:bg-gray-900/50">
                      <button
                        type="button"
                        onClick={() => setIsNewsModalOpen(true)}
                        className="text-xs font-semibold text-yellow-700 hover:text-yellow-800 dark:text-yellow-400 hover:underline inline-flex items-center gap-1"
                      >
                        Open Indian Mining News & Circulars Hub ({miningNews.length}) →
                      </button>
                    </div>
                  </div>
                )}

                {/* Tab 2: Mine Alerts */}
                {notificationTab === "alerts" && (
                  <div>
                    {activities.length === 0 ? (
                      <div className="px-4 py-8 text-center text-xs text-gray-500">
                        No active mine alerts
                      </div>
                    ) : (
                      <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800/60">
                        {activities.slice(0, 8).map((activity) => (
                          <div
                            key={activity.id}
                            className="p-2.5 flex flex-col items-start gap-0.5 hover:bg-gray-50 dark:hover:bg-gray-900/60 cursor-pointer"
                            onClick={() => !activity.read && markActivityRead.mutate(activity.id)}
                          >
                            <div className="flex w-full items-start gap-2">
                              {!activity.read && (
                                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-600" />
                              )}
                              <p className={`text-xs leading-snug ${activity.read ? "text-gray-500" : "font-medium text-gray-900 dark:text-gray-100"}`}>
                                {activity.message}
                              </p>
                            </div>
                            <span className="pl-3.5 text-[10px] text-gray-400">
                              {activity.mine_name ?? "All Mines"} · {timeAgo(activity.created_at)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {mounted && theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            {/* User Account Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 gap-2 px-2 shrink-0">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-yellow-600 text-sm font-bold text-white">
                      {mounted && session ? session.name.split(" ").map(n => n[0]).join("") : "..."}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden xl:block text-left">
                    <p className="text-sm font-medium leading-none truncate max-w-[120px]">{mounted && session ? session.name : "User"}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{mounted && session ? getRoleDisplayName(session.role) : "Portal User"}</p>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-gray-400 shrink-0" />
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

      {/* Full National Mining News & Circulars Hub Modal */}
      <MiningNewsModal
        open={isNewsModalOpen}
        onOpenChange={setIsNewsModalOpen}
        news={miningNews}
        isRead={isNewsRead}
        markRead={markNewsRead}
        markAllRead={markAllNewsRead}
        activeItem={activeNewsItem}
        onActiveItemChange={setActiveNewsItem}
      />
    </>
  );
}
