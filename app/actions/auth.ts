"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { z } from "zod";
import { sendPasswordResetEmail } from "@/lib/email";

const signupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function signup(data: { name: string; email: string; password: string }) {
  try {
    const validated = signupSchema.parse(data);

    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (existingUser) {
      return { success: false, error: "Email already in use" };
    }

    const passwordHash = await bcrypt.hash(validated.password, 10);

    await prisma.user.create({
      data: {
        name: validated.name,
        email: validated.email,
        passwordHash,
      },
    });

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: "Failed to create account" };
  }
}

/**
 * Initiates a password reset.
 * Always returns { success: true } to avoid leaking which emails are registered.
 * If SMTP is configured, sends an email and returns { emailSent: true }.
 * Otherwise returns { resetUrl } so the caller can display it on-screen (dev mode).
 */
export async function requestPasswordReset(email: string) {
  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Return success to prevent email enumeration
      return { success: true, emailSent: false, resetUrl: null };
    }

    // Invalidate any existing tokens for this user
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

    // Generate a secure random token (1 hour expiry)
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt },
    });

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    const emailSent = await sendPasswordResetEmail(email, resetUrl).catch(() => false);

    return {
      success: true,
      emailSent,
      // Only expose the URL when email isn't sent (dev/no-SMTP mode)
      resetUrl: emailSent ? null : resetUrl,
    };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

/**
 * Validates a reset token and sets a new password.
 */
export async function resetPassword(token: string, newPassword: string) {
  if (!token) return { success: false, error: "Invalid reset link" };
  if (newPassword.length < 6) {
    return { success: false, error: "Password must be at least 6 characters" };
  }

  try {
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return { success: false, error: "Invalid or expired reset link" };
    }
    if (resetToken.usedAt) {
      return { success: false, error: "This reset link has already been used" };
    }
    if (resetToken.expiresAt < new Date()) {
      return { success: false, error: "This reset link has expired. Please request a new one." };
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { token },
        data: { usedAt: new Date() },
      }),
    ]);

    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

/**
 * Changes the password for the currently logged-in user.
 * Requires the current password for verification.
 */
export async function changePassword(currentPassword: string, newPassword: string) {
  if (newPassword.length < 6) {
    return { success: false, error: "New password must be at least 6 characters" };
  }

  try {
    const user = await requireAuth();
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });

    if (!dbUser) return { success: false, error: "User not found" };

    const isValid = await bcrypt.compare(currentPassword, dbUser.passwordHash);
    if (!isValid) {
      return { success: false, error: "Current password is incorrect" };
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
