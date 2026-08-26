"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useSession } from "@/hooks/useSession";

// Quick-fill buttons still reference the demo accounts documented in
// supabase/create-demo-users.md — create these via Supabase Auth first.
const demoLogins = [
  { role: "ADMIN", email: "admin@coalgov.in" },
  { role: "CORPORATE_MANAGEMENT", email: "corporate@coalgov.in" },
  { role: "MINE_MANAGER", email: "manager@coalgov.in" },
  { role: "INSPECTOR", email: "inspector@coalgov.in" },
  { role: "REGULATORY_AUTHORITY", email: "authority@coalgov.in" },
];

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useSession();
  const [email, setEmail] = useState("admin@coalgov.in");
  const [password, setPassword] = useState("password");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleSelect = (roleVal: string) => {
    const matched = demoLogins.find((u) => u.role === roleVal);
    if (matched) {
      setEmail(matched.email);
      setPassword("password");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { data, error } = await signIn(email, password);
    setIsLoading(false);

    if (error) {
      toast.error("Invalid email or password. Please verify details.");
      return;
    }

    toast.success(`Welcome back!`);

    const { data: profile } = await import("@/lib/supabase/client").then((m) =>
      m.supabase.from("profiles").select("role").eq("id", data.user!.id).single()
    );

    const redirectTo = searchParams.get("redirectTo");
    if (redirectTo) {
      router.push(redirectTo);
    } else if (profile?.role === "INSPECTOR") {
      router.push("/inspections");
    } else {
      router.push("/dashboard");
    }
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-3xl">⛏️</span>
            <span className="text-2xl font-bold">Coal<span className="text-yellow-600">Gov</span>360</span>
          </Link>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Sign in to your account</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-center">Welcome Back</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role-select">Select Demo Role</Label>
                <select
                  id="role-select"
                  onChange={(e) => handleRoleSelect(e.target.value)}
                  className="h-9 w-full rounded-4xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-3 py-1 text-sm outline-none focus-visible:border-yellow-600 focus-visible:ring-[3px] focus-visible:ring-yellow-600/20"
                >
                  <option value="ADMIN">Admin </option>
                  <option value="CORPORATE_MANAGEMENT">Corporate Management </option>
                  <option value="MINE_MANAGER">Mine Manager </option>
                  <option value="INSPECTOR">Inspection</option>
                  <option value="REGULATORY_AUTHORITY">Regulatory Authority </option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@coalgov.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <Link href="#" className="text-yellow-600 hover:underline">
                  Forgot password?
                </Link>
                <Link href="/" className="text-gray-500 hover:underline">
                  Back to Home
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}