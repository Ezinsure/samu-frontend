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

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    toast.message("Contact your administrator", {
      description:
        "Password resets are managed by Head Office in the demo. Use a seeded account to continue.",
    });
  }

  return (
    <Card className="border-border shadow-[var(--samu-shadow-card)]">
      <CardHeader>
        <CardTitle className="text-2xl">Forgot password</CardTitle>
        <CardDescription>
          Enter your email or phone. In this demo, resets are not automated.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="identifier">Email or phone</Label>
            <Input
              id="identifier"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Request reset
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-foreground-secondary">
          <Link
            href="/login"
            className="cursor-pointer font-medium text-primary-600 hover:underline"
          >
            Back to sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
