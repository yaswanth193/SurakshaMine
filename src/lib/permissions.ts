export type UserRole = "ADMIN" | "CORPORATE_MANAGEMENT" | "MINE_MANAGER" | "INSPECTOR" | "REGULATORY_AUTHORITY";

export interface UserSession {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  mineId?: string;
  mineName?: string;
  loginTimestamp: number;
}

// Centrally maps roles to allowed path prefixes
export const rolePermissions: Record<UserRole, string[]> = {
  ADMIN: [
    "/dashboard",
    "/compliance",
    "/inspections",
    "/incidents",
    "/gis",
    "/reports",
    "/users",
    "/settings",
    "/profile",
    "/ai-insights"
    
  ],
  CORPORATE_MANAGEMENT: [
    "/dashboard",
    "/compliance",
    "/inspections",
    "/incidents",
    "/gis",
    "/reports",
    "/profile",
    "/settings",
    "/ai-insights"
  ],
  MINE_MANAGER: [
    "/dashboard",
    "/compliance",
    "/inspections",
    "/incidents",
    "/gis",
    "/reports",
    "/profile",
    "/settings",
    "/ai-insights",
    "/employees"
  ],
  INSPECTOR: [
    "/inspections",
    "/incidents",
    "/gis",
    "/profile",
    "/settings",
    "/ai-insights"
  ],
  REGULATORY_AUTHORITY: [
    "/dashboard",
    "/compliance",
    "/inspections",
    "/incidents",
    "/gis",
    "/reports",
    "/profile",
    "/settings",
    "/ai-insights"
  ]
};

export function isRouteAllowed(role: UserRole, path: string): boolean {
  const normalizedPath = path.split("?")[0];
  if (normalizedPath === "/" || normalizedPath === "/login") {
    return true;
  }
  const allowed = rolePermissions[role] || [];
  return allowed.some(route => {
    if (route === normalizedPath) return true;
    if (normalizedPath.startsWith(route + "/")) return true;
    return false;
  });
}

export function getRoleDisplayName(role: UserRole): string {
  const displayNames: Record<UserRole, string> = {
    ADMIN: "Admin",
    CORPORATE_MANAGEMENT: "Corporate Management",
    MINE_MANAGER: "Mine Manager",
    INSPECTOR: "Inspector",
    REGULATORY_AUTHORITY: "Regulatory Authority"
  };
  return displayNames[role] || role;
}
