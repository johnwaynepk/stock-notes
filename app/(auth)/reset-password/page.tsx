"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
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
import { useToast } from "@/components/ui/use-toast";
import { resetPassword } from "@/app/actions/auth";
import { TrendingUp, CheckCircle, AlertCircle } from "lucide-react";

export default function ResetPasswordPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [formData, setFormData] = useState({ password: "", confirm: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [tokenError, setTokenError] = useState("");

  if (!token) {
    return (
      <Card>
        <CardContent className="pt-6 text-center space-y-3">
          <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
          <p className="font-medium">Invalid reset link</p>
          <p className="text-sm text-muted-foreground">
            The link is missing a token. Please request a new reset link.
          </p>
          <Button asChild className="w-full mt-2">
            <Link href="/forgot-password">Request new link</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirm) {
      toast({
        variant: "destructive",
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await resetPassword(token, formData.password);

      if (result.success) {
        setDone(true);
      } else {
        setTokenError(result.error ?? "Something went wrong.");
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-center mb-4">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-primary-foreground" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-center">
          {done ? "Password reset" : "Choose a new password"}
        </CardTitle>
        <CardDescription className="text-center">
          {done
            ? "Your password has been updated successfully."
            : "Enter a new password for your account."}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {done ? (
          <div className="space-y-4 text-center">
            <CheckCircle className="mx-auto h-10 w-10 text-green-500" />
            <Button asChild className="w-full">
              <Link href="/login">Sign in with new password</Link>
            </Button>
          </div>
        ) : tokenError ? (
          <div className="space-y-4 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
            <p className="text-sm text-destructive">{tokenError}</p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/forgot-password">Request a new link</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 6 characters"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
                minLength={6}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm new password</Label>
              <Input
                id="confirm"
                type="password"
                placeholder="Same as above"
                value={formData.confirm}
                onChange={(e) =>
                  setFormData({ ...formData, confirm: e.target.value })
                }
                required
                minLength={6}
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Updating…" : "Reset password"}
            </Button>
          </form>
        )}

        {!done && !tokenError && (
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <Link href="/login" className="hover:text-foreground hover:underline">
              Cancel — back to sign in
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
