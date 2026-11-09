"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { PasswordInput } from "@/components/shared/password-input";
import { useAuth } from "@/lib/auth/auth-context";
import { homePathForRole } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);

    if (!result.ok) {
      toast.error("Sign-in failed", { description: result.error });
      return;
    }

    toast.success(`Welcome, ${result.session.name}`);
    if (result.session.mustChangePassword) {
      toast.message("Update your password", {
        description:
          "Your account has a temporary password. Please change it now.",
      });
      router.replace("/profile?changePassword=1");
      return;
    }
    const destination =
      nextPath && nextPath.startsWith("/")
        ? nextPath
        : homePathForRole(result.session.role);
    router.replace(destination);
  }

  return (
    <Card className="border-border/80 bg-surface/95 shadow-[var(--samu-shadow-dropdown)] backdrop-blur-sm">
      <CardHeader className="space-y-3">
        <div className="lg:hidden">
          <p className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-primary-900">
            SAMU
          </p>
          <p className="mt-1 text-xs tracking-[0.12em] text-foreground-muted uppercase">
            Solektra Agent Monitoring Utility
          </p>
        </div>
        <div>
          <CardTitle className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
            Sign in
          </CardTitle>
          <CardDescription className="mt-2 text-sm leading-relaxed">
            Use the email and password issued by your Solektra administrator.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@solektra.co"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="cursor-pointer text-xs font-medium text-primary-600 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="text-center text-xs text-foreground-muted">
          Need an account? Contact your Solektra administrator.
        </p>
      </CardContent>
    </Card>
  );
}
