"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/auth-context";
import { homePathForRole } from "@/lib/auth/session";
import { getDemoAccounts } from "@/lib/api";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type DemoPick = {
  id: string;
  label: string;
  email: string;
  password: string;
  role: string;
  name: string;
};

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [picks, setPicks] = useState<DemoPick[]>([]);

  useEffect(() => {
    void getDemoAccounts().then(setPicks);
  }, []);

  function applyDemoAccount(userId: string) {
    const account = picks.find((item) => item.id === userId);
    if (!account) return;
    setIdentifier(account.email);
    setPassword(account.password);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    const result = login(identifier, password);
    setSubmitting(false);

    if (!result.ok) {
      toast.error("Sign-in failed", { description: result.error });
      return;
    }

    toast.success(`Welcome, ${result.session.name}`);
    const destination =
      nextPath && nextPath.startsWith("/")
        ? nextPath
        : homePathForRole(result.session.role);
    router.replace(destination);
  }

  return (
    <Card className="border-border shadow-[var(--samu-shadow-card)]">
      <CardHeader>
        <div className="mb-2 flex items-center gap-2 lg:hidden">
          <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-primary-900 text-sm font-bold text-foreground-on-navy">
            S
          </span>
          <span className="font-bold text-foreground">SAMU</span>
        </div>
        <CardTitle className="text-2xl">Sign in</CardTitle>
        <CardDescription>
          Use a seeded demo account. Register is shown for flow mirroring only.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label>Demo account</Label>
          <Select onValueChange={applyDemoAccount}>
            <SelectTrigger>
              <SelectValue placeholder="Quick-pick a role" />
            </SelectTrigger>
            <SelectContent>
              {picks.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.label} · {account.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="identifier">Email or phone</Label>
            <Input
              id="identifier"
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="admin@solektra.rw"
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
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute right-1.5 top-1.5"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="text-center text-sm text-foreground-secondary">
          New here?{" "}
          <Link
            href="/register"
            className="cursor-pointer font-medium text-primary-600 hover:underline"
          >
            Create an account
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
