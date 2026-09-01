"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BellRing, ShieldCheck, TriangleAlert, Loader2 } from "lucide-react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

type Status = "idle" | "working" | "enrolled" | "unsupported" | "denied" | "error";

function SubscribeInner() {
  const params = useSearchParams();
  const employeeId = params.get("employeeId") ?? "";
  const employeeName = params.get("employeeName") ?? "";
  const mineId = params.get("mineId") ?? "";

  // Feature-detected once, in the initializer rather than an effect,
  // so there's no extra render pass. Runs "idle" on the server (no
  // `navigator`/`window`) and resolves to the real value on the
  // client's first render — this is a client-only page rendered
  // behind a link, not part of any static/SSR content a user would
  // see pre-hydration, so there's no visible mismatch flash.
  const [status, setStatus] = useState<Status>(() => {
    if (typeof window === "undefined") return "idle";
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      return "unsupported";
    }
    return "idle";
  });
  const [errorMsg, setErrorMsg] = useState("");

  const missingParams = !employeeId || !mineId;

  const handleEnable = async () => {
    setStatus("working");
    setErrorMsg("");
    try {
      if (Notification.permission === "denied") {
        setStatus("denied");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        throw new Error("Alerts aren't configured on this deployment yet.");
      }

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }

      await axios.post("/api/push/subscribe", {
        employeeId,
        employeeName,
        mineId,
        subscription: subscription.toJSON(),
      });

      setStatus("enrolled");
    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong enabling alerts.");
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border border-gray-200 dark:border-gray-800 shadow-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-950/30">
            <BellRing className="h-7 w-7 text-yellow-600" />
          </div>
          <CardTitle>Enable Safety Alerts</CardTitle>
          <CardDescription>
            {employeeName ? `For ${employeeName}` : "SurakshaMine incident alerts"} — get notified
            instantly on this phone if your mine manager reports an incident while you&apos;re on
            shift.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {missingParams ? (
            <p className="text-sm text-red-600 text-center">
              This link is missing information. Ask your mine manager to resend the enrolment link
              from the Employees page.
            </p>
          ) : status === "unsupported" ? (
            <p className="text-sm text-amber-600 text-center">
              This browser doesn&apos;t support push notifications. On iPhone, add this page to
              your Home Screen first (Share → Add to Home Screen), then open it from there and try
              again.
            </p>
          ) : status === "enrolled" ? (
            <div className="text-center space-y-2">
              <ShieldCheck className="mx-auto h-8 w-8 text-green-600" />
              <p className="text-sm font-medium text-green-700 dark:text-green-400">
                Alerts enabled on this device
              </p>
              <p className="text-xs text-muted-foreground">
                Keep notifications allowed for this site to keep receiving alerts.
              </p>
            </div>
          ) : (
            <>
              {status === "denied" && (
                <p className="text-sm text-red-600 text-center flex items-center justify-center gap-1.5">
                  <TriangleAlert className="h-4 w-4" /> Notification permission was denied. Enable
                  it in your browser&apos;s site settings, then reload this page.
                </p>
              )}
              {status === "error" && (
                <p className="text-sm text-red-600 text-center">{errorMsg}</p>
              )}
              <Button
                onClick={handleEnable}
                disabled={status === "working"}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white gap-2"
              >
                {status === "working" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Enabling...
                  </>
                ) : (
                  <>
                    <BellRing className="h-4 w-4" /> Enable Alerts on This Phone
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                You&apos;ll get a notification only when your mine manager sends one — no other
                app data is shared.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function SubscribePage() {
  return (
    <Suspense fallback={null}>
      <SubscribeInner />
    </Suspense>
  );
}
