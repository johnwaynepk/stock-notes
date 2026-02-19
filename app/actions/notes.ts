"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function createNote(userStockId: string, content: string) {
  const user = await requireAuth();

  try {
    const userStock = await prisma.userStock.findFirst({
      where: { id: userStockId, userId: user.id, deletedAt: null },
    });

    if (!userStock) {
      return { success: false, error: "Stock not found" };
    }

    const note = await prisma.note.create({
      data: { userStockId, content },
    });

    revalidatePath("/dashboard");
    revalidatePath("/notes");
    return { success: true, note };
  } catch {
    return { success: false, error: "Failed to create note" };
  }
}

export async function updateNote(noteId: string, content: string) {
  const user = await requireAuth();

  try {
    const note = await prisma.note.findFirst({
      where: { id: noteId, deletedAt: null, userStock: { userId: user.id } },
    });

    if (!note) {
      return { success: false, error: "Note not found" };
    }

    const updated = await prisma.note.update({
      where: { id: noteId },
      data: { content },
    });

    revalidatePath("/dashboard");
    revalidatePath("/notes");
    return { success: true, note: updated };
  } catch {
    return { success: false, error: "Failed to update note" };
  }
}

/** Soft-deletes a note (sets deletedAt = now). Appears in Recently Deleted for 90 days. */
export async function deleteNote(noteId: string) {
  const user = await requireAuth();

  try {
    const note = await prisma.note.findFirst({
      where: { id: noteId, deletedAt: null, userStock: { userId: user.id } },
    });

    if (!note) {
      return { success: false, error: "Note not found" };
    }

    await prisma.note.update({
      where: { id: noteId },
      data: { deletedAt: new Date() },
    });

    revalidatePath("/dashboard");
    revalidatePath("/notes");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete note" };
  }
}

/** Permanently deletes a soft-deleted note. Only valid for notes already in Recently Deleted. */
export async function hardDeleteNote(noteId: string) {
  const user = await requireAuth();

  try {
    const note = await prisma.note.findFirst({
      where: { id: noteId, userStock: { userId: user.id } },
    });

    if (!note) {
      return { success: false, error: "Note not found" };
    }

    await prisma.note.delete({ where: { id: noteId } });

    revalidatePath("/notes");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete note" };
  }
}

/**
 * Restores a soft-deleted note.
 * If the note's stock was also soft-deleted, restores the stock as Archived
 * so there's no orphaned note.
 */
export async function restoreNote(noteId: string) {
  const user = await requireAuth();

  try {
    const note = await prisma.note.findFirst({
      where: { id: noteId, userStock: { userId: user.id } },
      include: { userStock: { select: { id: true, deletedAt: true } } },
    });

    if (!note) {
      return { success: false, error: "Note not found" };
    }

    const stockWasDeleted = note.userStock.deletedAt !== null;

    if (stockWasDeleted) {
      // Restore stock as Archived + restore note atomically
      await prisma.$transaction([
        prisma.userStock.update({
          where: { id: note.userStockId },
          data: { deletedAt: null, archivedAt: new Date() },
        }),
        prisma.note.update({
          where: { id: noteId },
          data: { deletedAt: null },
        }),
      ]);
    } else {
      await prisma.note.update({
        where: { id: noteId },
        data: { deletedAt: null },
      });
    }

    revalidatePath("/dashboard");
    revalidatePath("/notes");
    revalidatePath("/archive");
    return { success: true, stockRestored: stockWasDeleted };
  } catch {
    return { success: false, error: "Failed to restore note" };
  }
}

export async function getNotes(userStockId: string) {
  const user = await requireAuth();

  try {
    const userStock = await prisma.userStock.findFirst({
      where: { id: userStockId, userId: user.id, deletedAt: null },
    });

    if (!userStock) {
      return { success: false, error: "Stock not found", notes: [] };
    }

    const notes = await prisma.note.findMany({
      where: { userStockId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, notes };
  } catch {
    return { success: false, error: "Failed to get notes", notes: [] };
  }
}

/** Active notes across the user's non-deleted stocks (includes archived stocks). */
export async function getAllNotes(filters?: { tagId?: string; keyword?: string }) {
  const user = await requireAuth();

  try {
    const notes = await prisma.note.findMany({
      where: {
        deletedAt: null,
        userStock: {
          userId: user.id,
          deletedAt: null,
          // No archivedAt filter — notes from archived stocks remain accessible
          ...(filters?.tagId
            ? { tags: { some: { tagId: filters.tagId } } }
            : {}),
        },
        ...(filters?.keyword
          ? { content: { contains: filters.keyword, mode: "insensitive" as const } }
          : {}),
      },
      include: {
        userStock: {
          include: {
            stock: true,
            tags: { include: { tag: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, notes };
  } catch {
    return { success: false, error: "Failed to get notes", notes: [] };
  }
}

/** Soft-deleted notes within the 90-day retention window, sorted newest-deleted first. */
export async function getDeletedNotes() {
  const user = await requireAuth();
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  try {
    const notes = await prisma.note.findMany({
      where: {
        deletedAt: { not: null, gte: ninetyDaysAgo },
        userStock: { userId: user.id },
      },
      include: {
        userStock: {
          select: {
            id: true,
            deletedAt: true,
            stock: { select: { symbol: true, exchange: true, name: true } },
          },
        },
      },
      orderBy: { deletedAt: "desc" },
    });

    // Serialize dates so Next.js can pass them to client components
    const serialized = notes.map((n) => ({
      ...n,
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt.toISOString(),
      deletedAt: n.deletedAt!.toISOString(),
      userStock: {
        ...n.userStock,
        deletedAt: n.userStock.deletedAt?.toISOString() ?? null,
      },
    }));

    return { success: true, notes: serialized };
  } catch {
    return { success: false, error: "Failed to get deleted notes", notes: [] };
  }
}

/**
 * Hard-deletes all notes where deletedAt < now - 90 days, and
 * hard-deletes stocks where deletedAt < now - 90 days with no remaining notes.
 * Designed to be called by a daily cron job.
 */
export async function runNoteCleanup() {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  // Hard-delete expired notes
  const deletedNotes = await prisma.note.deleteMany({
    where: { deletedAt: { not: null, lt: ninetyDaysAgo } },
  });

  // Hard-delete stocks that have been soft-deleted for 90+ days and have no notes left
  const expiredStocks = await prisma.userStock.findMany({
    where: { deletedAt: { not: null, lt: ninetyDaysAgo } },
    select: { id: true, _count: { select: { notes: true } } },
  });

  const emptyStockIds = expiredStocks
    .filter((s) => s._count.notes === 0)
    .map((s) => s.id);

  const deletedStocks = await prisma.userStock.deleteMany({
    where: { id: { in: emptyStockIds } },
  });

  return {
    notesDeleted: deletedNotes.count,
    stocksDeleted: deletedStocks.count,
  };
}
