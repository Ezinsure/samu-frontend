"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { registerAccount } from "@/lib/auth/session";
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

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    const result = await registerAccount({ name, email, phone, password });
    setSubmitting(false);

    if (!result.ok) {
      toast.error("Could not create account", { description: result.error });
      return;
    }

    setSubmitted(true);
    toast.success("Account request received");
  }

  if (submitted) {
    return (
      <Card className="border-border shadow-[var(--samu-shadow-card)]">
        <CardHeader>
          <CardTitle className="text-2xl">Request received</CardTitle>
          <CardDescription>
            Your account is pending activation. An administrator must approve
            it before you can sign in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/login">Back to sign in</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border shadow-[var(--samu-shadow-card)]">
      <CardHeader>
        <CardTitle className="text-2xl">Create account</CardTitle>
        <CardDescription>
          New accounts are created as agents and need administrator approval
          before first sign-in.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              minLength={2}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+2507…"
              minLength={7}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
            <p className="text-xs text-foreground-secondary">
              At least 8 characters.
            </p>
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Submitting…" : "Create account"}
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-foreground-secondary">
          Already have an account?{" "}
          <Link
            href="/login"
            className="cursor-pointer font-medium text-primary-600 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
