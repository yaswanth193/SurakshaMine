import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Shield, 
  Users, 
  FileCheck, 
  MapPin, 
  Bell, 
  Zap,
  ArrowRight,
  CheckCircle,
  Building2,
  AlertTriangle
  , type LucideIcon
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur dark:bg-gray-950/95">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⛏️</span>
            <span className="text-xl font-bold">Suraksha<span className="text-yellow-600">Mine</span></span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link href="/login">
              <Button className="bg-yellow-600 hover:bg-yellow-700 text-white">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8">
            <div className="flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-yellow-50 px-3 py-1 text-sm text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-yellow-500"></span>
                </span>
                SIH 2026 · Smart Governance
              </div>
              <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Smart Governance for
                <span className="block text-yellow-600">Indian Coal Mines</span>
              </h1>
              <p className="mt-6 text-lg text-gray-600 dark:text-gray-400">
                AI-powered compliance monitoring, real-time inspections, and 
                predictive analytics for Coal India 370+ mines.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/login">
                  <Button size="lg" className="bg-yellow-600 hover:bg-yellow-700 text-white">
                    Get Started <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                
              </div>
              <div className="mt-8 flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Real-time monitoring</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>AI-powered insights</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Government approved</span>
                </div>
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="relative rounded-2xl bg-gradient-to-br from-yellow-100 to-yellow-200 p-8 dark:from-yellow-950/30 dark:to-yellow-900/30">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">18 Mines</span>
                      </div>
                      <p className="text-2xl font-bold">Active</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <FileCheck className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">74%</span>
                      </div>
                      <p className="text-2xl font-bold">Compliance</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <span className="text-sm font-medium">23</span>
                      </div>
                      <p className="text-2xl font-bold">Violations</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium">1,247</span>
                      </div>
                      <p className="text-2xl font-bold">Workers</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">Key Features</h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
              Everything you need for modern mine governance
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={FileCheck}
              title="Compliance Tracking"
              description="Real-time compliance monitoring with automated reminders and document management."
            />
            <FeatureCard
              icon={MapPin}
              title="GIS Mapping"
              description="Interactive maps with mine locations, risk heatmaps, and satellite imagery."
            />
            <FeatureCard
              icon={Zap}
              title="AI Analytics"
              description="Predictive risk scoring, anomaly detection, and intelligent insights."
            />
            <FeatureCard
              icon={Bell}
              title="Real-time Alerts"
              description="Instant notifications for violations, inspections, and critical events."
            />
            <FeatureCard
              icon={Shield}
              title="Blockchain Audit"
              description="Tamper-proof audit trail for all compliance and inspection records."
            />
            <FeatureCard
              icon={Users}
              title="Multi-role Access"
              description="Role-based dashboards for officers, managers, and regulators."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <span className="text-xl">⛏️</span>
              <span className="font-bold">Coal<span className="text-yellow-600">Gov</span>360</span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              © 2026 Team SurakshaMine · SIH 2026
            </div>
            <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
              <Link href="#" className="hover:text-yellow-600">Privacy</Link>
              <Link href="#" className="hover:text-yellow-600">Terms</Link>
              <Link href="#" className="hover:text-yellow-600">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-50 dark:bg-yellow-950/30">
          <Icon className="h-6 w-6 text-yellow-600" />
        </div>
        <CardTitle className="mt-4">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}