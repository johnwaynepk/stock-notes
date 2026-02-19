"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { changePassword } from "@/app/actions/auth";
import { Loader2 } from "lucide-react";

export function ChangePasswordForm() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState({
    current: "",
    next: "",
    confirm: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.next !== formData.confirm) {
      toast({
        variant: "destructive",
        title: "Passwords don't match",
        description: "New password and confirmation must be the same.",
      });
      return;
    }

    startTransition(async () => {
      const result = await changePassword(formData.current, formData.next);
      if (result.success) {
        toast({ title: "Password updated successfully" });
        setFormData({ current: "", next: "", confirm: "" });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="current-password">Current password</Label>
        <Input
          id="current-password"
          type="password"
          value={formData.current}
          onChange={(e) => setFormData({ ...formData, current: e.target.value })}
          required
          disabled={isPending}
          autoComplete="current-password"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="new-password">New password</Label>
        <Input
          id="new-password"
          type="password"
          placeholder="At least 6 characters"
          value={formData.next}
          onChange={(e) => setFormData({ ...formData, next: e.target.value })}
          required
          minLength={6}
          disabled={isPending}
          autoComplete="new-password"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirm new password</Label>
        <Input
          id="confirm-password"
          type="password"
          value={formData.confirm}
          onChange={(e) => setFormData({ ...formData, confirm: e.target.value })}
          required
          minLength={6}
          disabled={isPending}
          autoComplete="new-password"
        />
      </div>
      <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Updating…
          </>
        ) : (
          "Update password"
        )}
      </Button>
    </form>
  );
}
