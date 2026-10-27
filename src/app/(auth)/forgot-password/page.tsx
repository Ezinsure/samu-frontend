"use client";

import Link from "next/link";
import { toast } from "sonner";
import { useState } from "react";
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
import { requestPasswordReset } from "@/lib/auth/account";

const BackToSignIn = () => (
  <p className="mt-5 text-center text-sm text-foreground-secondary">
    <Link
      href="/login"
      className="cursor-pointer font-medium text-primary-600 hover:underline"
    >
      Back to sign in
    </Link>
  </p>
);

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    const result = await requestPasswordReset(email);
    setSubmitting(false);

    if (!result.ok) {
      toast.error("Could not send the reset link", { description: result.error });
      return;
    }
    setSent(true);
  }

  // The API gives the same answer for unknown emails, so the copy stays neutral.
  if (sent) {
    return (
      <Card className="border-border shadow-[var(--samu-shadow-card)]">
        <CardHeader>
          <CardTitle className="text-2xl">Check your email</CardTitle>
          <CardDescription>
            If an account exists for <strong>{email.trim()}</strong>, we sent a
            link to reset your password. It expires in about an hour and can be
            used once.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => setSent(false)}
          >
            Use a different email
          </Button>
          <BackToSignIn />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border shadow-[var(--samu-shadow-card)]">
      <CardHeader>
        <CardTitle className="text-2xl">Forgot password</CardTitle>
        <CardDescription>
          Enter the email for your account and we will send you a link to choose
          a new password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@solektra.rw"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Sending…" : "Send reset link"}
          </Button>
        </form>
        <BackToSignIn />
      </CardContent>
    </Card>
  );
}
