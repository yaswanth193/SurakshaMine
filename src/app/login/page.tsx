"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, ShieldCheck, UserCheck, Lock, Mail, User, Building2 } from "lucide-react";
import { useSession } from "@/hooks/useSession";
import type { UserRole } from "@/lib/permissions";

const ROLE_OPTIONS: { role: UserRole; title: string; description: string }[] = [
  {
    role: "ADMIN",
    title: "System Administrator",
    description: "Full access to settings, workforce administration, and global telemetry",
  },
  {
    role: "MINE_MANAGER",
    title: "Mine Manager",
    description: "Colliery shift operations, attendance management, and GIS hazard mapping",
  },
  {
    role: "CORPORATE_MANAGEMENT",
    title: "Corporate Management",
    description: "Enterprise executive oversight, multi-mine analytics, and safety compliance",
  },
  {
    role: "INSPECTOR",
    title: "Safety Inspector",
    description: "Statutory mine audits, field investigation reports, and compliance tracking",
  },
  {
    role: "REGULATORY_AUTHORITY",
    title: "Regulatory Authority",
    description: "DGMS / CMR statutory regulations repository and adherence analysis",
  },
];

const MINE_OPTIONS = [
  { id: "47d2d435-8bae-49ca-b8d2-b6e71b407e9b", name: "Mine A (Jharia Opencast Colliery)" },
  { id: "5b8238d0-bfdb-443a-a0ce-fc384cd491fe", name: "Mine B (Talcher Coalfields)" },
  { id: "84e0c034-2657-4e92-9f2c-920e419d80f4", name: "Mine C (Madhya Pradesh Underground)" },
  { id: "3dc40de3-85d1-48fc-bedd-a43567660ef2", name: "Mine D (Korba Opencast Mine)" },
  { id: "16c8fab9-fe38-42bf-bdb1-d08b7a898320", name: "Mine E (Raniganj Colliery)" },
  { id: "a704ccc4-ad9d-4b42-a0bf-30819956c826", name: "Mine F (Singareni Colliery)" },
];

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <AuthCard />
    </Suspense>
  );
}

function AuthCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, signUp } = useSession();

  // Mode: "signin" | "signup"
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");

  // Sign In state (clean, no demo data)
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signInRole, setSignInRole] = useState<UserRole>("ADMIN");
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // Sign Up state (clean, no demo data)
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpRole, setSignUpRole] = useState<UserRole>("INSPECTOR");
  const [signUpMineId, setSignUpMineId] = useState(MINE_OPTIONS[0].id);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInEmail || !signInPassword) {
      toast.error("Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(signInEmail, signInPassword, signInRole);
    setIsLoading(false);

    if (error) {
      toast.error(error.message || "Failed to sign in. Please check your credentials.");
      return;
    }

    toast.success(`Welcome back! Signed in as ${ROLE_OPTIONS.find((r) => r.role === signInRole)?.title}`);

    const redirectTo = searchParams.get("redirectTo");
    if (redirectTo) {
      router.push(redirectTo);
    } else if (signInRole === "INSPECTOR") {
      router.push("/inspections");
    } else if (signInRole === "REGULATORY_AUTHORITY") {
      router.push("/regulations");
    } else {
      router.push("/dashboard");
    }
    router.refresh();
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpName || !signUpEmail || !signUpPassword) {
      toast.error("Please complete all registration fields.");
      return;
    }
    if (signUpPassword.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);
    const selectedMine = MINE_OPTIONS.find((m) => m.id === signUpMineId);

    const { error } = await signUp(signUpEmail, signUpPassword, {
      name: signUpName,
      role: signUpRole,
      mineId: signUpRole === "MINE_MANAGER" ? signUpMineId : undefined,
      mineName: signUpRole === "MINE_MANAGER" ? selectedMine?.name : undefined,
    });
    setIsLoading(false);

    if (error) {
      toast.error("Registration encountered an issue. Please try again.");
      return;
    }

    toast.success(`Account registered! Signed in as ${ROLE_OPTIONS.find((r) => r.role === signUpRole)?.title}`);

    const redirectTo = searchParams.get("redirectTo");
    if (redirectTo) {
      router.push(redirectTo);
    } else if (signUpRole === "INSPECTOR") {
      router.push("/inspections");
    } else if (signUpRole === "REGULATORY_AUTHORITY") {
      router.push("/regulations");
    } else {
      router.push("/dashboard");
    }
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-amber-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* App Logo & Header */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-3xl">⛏️</span>
            <span className="text-2xl font-bold tracking-tight">
              Suraksha<span className="text-yellow-600">Mine</span>
            </span>
          </Link>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
            National Coal Safety & Regulatory Governance Portal
          </p>
        </div>

        <Card className="border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden rounded-2xl bg-white dark:bg-slate-900">
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-sm">
            <button
              type="button"
              onClick={() => setAuthMode("signin")}
              className={`py-2 text-center font-bold rounded-xl transition-all cursor-pointer ${
                authMode === "signin"
                  ? "bg-white dark:bg-slate-900 text-yellow-700 dark:text-yellow-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setAuthMode("signup")}
              className={`py-2 text-center font-bold rounded-xl transition-all cursor-pointer ${
                authMode === "signup"
                  ? "bg-white dark:bg-slate-900 text-yellow-700 dark:text-yellow-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              Sign Up / Register
            </button>
          </div>

          <CardHeader className="pb-3 text-center">
            <CardTitle className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
              {authMode === "signin" ? "Login to Portal" : "Create Mine Officer Account"}
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              {authMode === "signin"
                ? "Select your operational role and enter your portal credentials."
                : "Register credentials to access any of the 5 national mining roles."}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-0">
            {/* SIGN IN FORM */}
            {authMode === "signin" ? (
              <form onSubmit={handleSignIn} className="space-y-4">
                {/* Role Selection */}
                <div className="space-y-1.5">
                  <Label htmlFor="signin-role" className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
                    Select Your Role (5 Roles Available)
                  </Label>
                  <select
                    id="signin-role"
                    value={signInRole}
                    onChange={(e) => setSignInRole(e.target.value as UserRole)}
                    className="h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 text-sm font-medium outline-none focus-visible:border-yellow-600 focus-visible:ring-[2px] focus-visible:ring-yellow-600/20"
                  >
                    {ROLE_OPTIONS.map((opt) => (
                      <option key={opt.role} value={opt.role}>
                        {opt.title}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                    {ROLE_OPTIONS.find((r) => r.role === signInRole)?.description}
                  </p>
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <Label htmlFor="signin-email" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="Enter your email"
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      className="pl-9 h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-sm"
                      required
                      autoComplete="username"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="signin-password" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      id="signin-password"
                      type={showSignInPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      className="pl-9 pr-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-sm"
                      required
                      autoComplete="current-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-slate-400 hover:text-slate-600"
                      onClick={() => setShowSignInPassword(!showSignInPassword)}
                    >
                      {showSignInPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-10 rounded-xl bg-yellow-600 hover:bg-yellow-700 text-white font-semibold text-sm shadow-sm"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>

                <div className="pt-2 text-center text-xs text-slate-500">
                  <span>Don't have an account yet? </span>
                  <button
                    type="button"
                    onClick={() => setAuthMode("signup")}
                    className="font-bold text-yellow-600 hover:underline cursor-pointer"
                  >
                    Register new account
                  </button>
                </div>
              </form>
            ) : (
              /* SIGN UP FORM */
              <form onSubmit={handleSignUp} className="space-y-3.5">
                {/* Role Selection */}
                <div className="space-y-1">
                  <Label htmlFor="signup-role" className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
                    Select Role to Register (5 Roles Available)
                  </Label>
                  <select
                    id="signup-role"
                    value={signUpRole}
                    onChange={(e) => setSignUpRole(e.target.value as UserRole)}
                    className="h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 text-sm font-medium outline-none focus-visible:border-yellow-600 focus-visible:ring-[2px] focus-visible:ring-yellow-600/20"
                  >
                    {ROLE_OPTIONS.map((opt) => (
                      <option key={opt.role} value={opt.role}>
                        {opt.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Optional Mine Selection for Mine Manager */}
                {signUpRole === "MINE_MANAGER" && (
                  <div className="space-y-1">
                    <Label htmlFor="signup-mine" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Assigned Mine Operation
                    </Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <select
                        id="signup-mine"
                        value={signUpMineId}
                        onChange={(e) => setSignUpMineId(e.target.value)}
                        className="pl-9 h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 text-sm font-medium outline-none focus-visible:border-yellow-600 focus-visible:ring-[2px] focus-visible:ring-yellow-600/20"
                      >
                        {MINE_OPTIONS.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Full Name */}
                <div className="space-y-1">
                  <Label htmlFor="signup-name" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Full Name / Designation
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="e.g. Arun Singh / Rajesh Sharma"
                      value={signUpName}
                      onChange={(e) => setSignUpName(e.target.value)}
                      className="pl-9 h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-sm"
                      required
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div className="space-y-1">
                  <Label htmlFor="signup-email" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="e.g. officer@coalmine.gov.in"
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      className="pl-9 h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-sm"
                      required
                      autoComplete="username"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <Label htmlFor="signup-password" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Password (min 6 characters)
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      id="signup-password"
                      type={showSignUpPassword ? "text" : "password"}
                      placeholder="Choose a secure password"
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      className="pl-9 pr-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-sm"
                      required
                      autoComplete="new-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-slate-400 hover:text-slate-600"
                      onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                    >
                      {showSignUpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-10 rounded-xl bg-yellow-600 hover:bg-yellow-700 text-white font-semibold text-sm shadow-sm"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Create Account & Sign In"
                  )}
                </Button>

                <div className="pt-2 text-center text-xs text-slate-500">
                  <span>Already have an account? </span>
                  <button
                    type="button"
                    onClick={() => setAuthMode("signin")}
                    className="font-bold text-yellow-600 hover:underline cursor-pointer"
                  >
                    Sign In instead
                  </button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Back to Home Link */}
        <div className="mt-4 text-center">
          <Link href="/" className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
            ← Return to SurakshaMine Home
          </Link>
        </div>
      </div>
    </div>
  );
}