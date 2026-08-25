export interface DemoUser {
  userId: string;
  name: string;
  email: string;
  role: "ADMIN" | "CORPORATE_MANAGEMENT" | "MINE_MANAGER" | "INSPECTOR" | "REGULATORY_AUTHORITY";
  mineId?: string;
  mineName?: string;
  password?: string;
}

export const demoUsers: DemoUser[] = [
  {
    userId: "U1",
    name: "Admin Kumar",
    email: "admin@coalgov.in",
    role: "ADMIN",
    password: "password"
  },
  {
    userId: "U2",
    name: "Priya Sharma",
    email: "corporate@coalgov.in",
    role: "CORPORATE_MANAGEMENT",
    password: "password"
  },
  {
    userId: "U3",
    name: "Rajesh Verma",
    email: "manager@coalgov.in",
    role: "MINE_MANAGER",
    mineId: "M1",
    mineName: "Mine A",
    password: "password"
  },
  {
    userId: "U4",
    name: "Arun Singh",
    email: "inspector@coalgov.in",
    role: "INSPECTOR",
    password: "password"
  },
  {
    userId: "U5",
    name: "Meera Patel",
    email: "authority@coalgov.in",
    role: "REGULATORY_AUTHORITY",
    password: "password"
  }
];
