"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  User, 
  Mail, 
  Shield, 
  Building2, 
  Phone, 
  Save, 
  Edit2, 
  X,
  BadgeCheck,
  Calendar,
  Lock
} from "lucide-react";
import { getRoleDisplayName } from "@/lib/permissions";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/lib/supabase/client";

export default function ProfilePage() {
  const { session } = useSession();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [dept, setDept] = useState("Operations & Safety Command");
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (session) {
      // phone/dept aren't in the profiles table schema — kept as
      // lightweight local extras so the demo fields still work.
      // (Add columns to `profiles` in the DB if you want these to
      // persist server-side and be visible to other roles.)
      const savedProfile = localStorage.getItem(`coalgov360_profile_${session.userId}`);
      if (savedProfile) {
        try {
          const parsedProfile = JSON.parse(savedProfile);
          setName(parsedProfile.name || session.name);
          setPhone(parsedProfile.phone || "");
          setDept(parsedProfile.dept || "Operations & Safety Command");
        } catch (e) {
          console.error(e);
        }
      } else {
        setName(session.name);
        setPhone("");
        setDept("Operations & Safety Command");
      }
    }
  }, [session]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Full Name is required.");
      return;
    }
    if (!session) return;

    setIsLoading(true);

    // Persist the display name to the real profiles table.
    const { error } = await supabase.from("profiles").update({ name }).eq("id", session.userId);

    // phone/dept stay local-only for now (see note above)
    localStorage.setItem(`coalgov360_profile_${session.userId}`, JSON.stringify({ name, phone, dept }));

    setIsLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Profile details updated successfully!");
    setIsEditing(false);
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-yellow-600 animate-spin" />
      </div>
    );
  }

  const initials = name.split(" ").map(n => n[0]).join("");
  const formattedDate = session.loginTimestamp 
    ? new Date(session.loginTimestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ", " + new Date(session.loginTimestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    : "N/A";

  const isMinescoped = session.role === "MINE_MANAGER" || session.role === "INSPECTOR";

  return (
    <>
      <Header />
      <main className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">
        {/* Profile Card */}
        <Card className="border border-gray-200 dark:border-gray-800 shadow-md">
          {/* Header Banner */}
          <div className="h-32 bg-gradient-to-r from-yellow-500 to-yellow-600 dark:from-yellow-600 dark:to-yellow-700 rounded-t-2xl relative">
            <div className="absolute -bottom-12 left-6">
              <Avatar className="h-24 w-24 border-4 border-white dark:border-gray-900 shadow-lg">
                <AvatarFallback className="bg-yellow-600 text-2xl font-bold text-white uppercase">
                  {initials || "AK"}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>

          <CardContent className="pt-16 pb-6 px-6">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  {name || "Admin Kumar"}
                  <BadgeCheck className="h-5 w-5 text-yellow-600" />
                </h1>
                <p className="text-sm font-medium text-yellow-600 mt-1 capitalize">
                  {getRoleDisplayName(session.role)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  ID: <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded font-mono text-[10px]">{session.userId}</code>
                </p>
              </div>
              <div>
                {!isEditing ? (
                  <Button 
                    onClick={() => setIsEditing(true)} 
                    className="bg-yellow-600 hover:bg-yellow-700 text-white gap-2"
                  >
                    <Edit2 className="h-4 w-4" /> Edit Profile
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsEditing(false);
                      // Reset to saved state
                      const savedProfile = localStorage.getItem(`coalgov360_profile_${session.userId}`);
                      if (savedProfile) {
                        const parsed = JSON.parse(savedProfile);
                        setName(parsed.name || session.name);
                        setPhone(parsed.phone || "");
                        setDept(parsed.dept || "Operations & Safety Command");
                      } else {
                        setName(session.name);
                        setPhone("");
                        setDept("Operations & Safety Command");
                      }
                    }} 
                    className="gap-2"
                  >
                    <X className="h-4 w-4" /> Cancel
                  </Button>
                )}
              </div>
            </div>

            <hr className="my-6 border-gray-100 dark:border-gray-800" />

            {/* Profile Info Details Grid */}
            <form onSubmit={handleSave}>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Personal Information</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" /> Full Name
                    </Label>
                    <Input
                      id="fullName"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={!isEditing}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" /> Email Address
                    </Label>
                    <Input
                      id="email"
                      value={session.email}
                      disabled={true}
                      className="bg-gray-50 dark:bg-gray-900 cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" /> Phone Number
                    </Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +91 98765 43210"
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Scope & Governance</h3>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-gray-400" /> Security Role
                    </Label>
                    <div className="relative">
                      <Input
                        value={getRoleDisplayName(session.role)}
                        disabled={true}
                        className="bg-gray-50 dark:bg-gray-900 cursor-not-allowed pr-8"
                      />
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department" className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-gray-400" /> Department / Org
                    </Label>
                    <Input
                      id="department"
                      value={dept}
                      onChange={(e) => setDept(e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-gray-400" /> Assigned Location / Mine
                    </Label>
                    <Input
                      value={isMinescoped ? (session.mineName || "Mine A") : "Organization-wide"}
                      disabled={true}
                      className="bg-gray-50 dark:bg-gray-900 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Status and Actions footer */}
              <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-6 border-t border-gray-100 dark:border-gray-800">
                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400 border-none">Active Account</Badge>
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> Last Login: {formattedDate}
                  </span>
                </div>

                {isEditing && (
                  <Button 
                    type="submit" 
                    className="bg-yellow-600 hover:bg-yellow-700 text-white gap-2 w-full sm:w-auto"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>Saving...</>
                    ) : (
                      <>
                        <Save className="h-4 w-4" /> Save Profile
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </>
  );
}

// Loader helper if dynamic import fallback matches
function Loader2({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`lucide lucide-loader-2 ${className}`}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
