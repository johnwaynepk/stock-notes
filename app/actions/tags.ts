"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function getUserTags() {
  const user = await requireAuth();

  const tags = await prisma.tag.findMany({
    where: {
      userId: user.id,
    },
    include: {
      userStockTags: {
        include: {
          userStock: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return tags;
}

export async function createTag(data: { name: string; color: string }) {
  const user = await requireAuth();

  try {
    const tag = await prisma.tag.create({
      data: {
        userId: user.id,
        name: data.name,
        color: data.color,
      },
    });

    revalidatePath("/dashboard");
    return { success: true, tag };
  } catch (error) {
    return { success: false, error: "Failed to create tag" };
  }
}

export async function updateTag(tagId: string, data: { name?: string; color?: string }) {
  const user = await requireAuth();

  try {
    const tag = await prisma.tag.findFirst({
      where: {
        id: tagId,
        userId: user.id,
      },
    });

    if (!tag) {
      return { success: false, error: "Tag not found" };
    }

    const updated = await prisma.tag.update({
      where: { id: tagId },
      data,
    });

    revalidatePath("/dashboard");
    return { success: true, tag: updated };
  } catch (error) {
    return { success: false, error: "Failed to update tag" };
  }
}

export async function deleteTag(tagId: string) {
  const user = await requireAuth();

  try {
    const tag = await prisma.tag.findFirst({
      where: {
        id: tagId,
        userId: user.id,
      },
    });

    if (!tag) {
      return { success: false, error: "Tag not found" };
    }

    await prisma.tag.delete({
      where: { id: tagId },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete tag" };
  }
}

export async function addTagToStock(userStockId: string, tagId: string) {
  const user = await requireAuth();

  try {
    // Verify ownership
    const userStock = await prisma.userStock.findFirst({
      where: {
        id: userStockId,
        userId: user.id,
      },
    });

    const tag = await prisma.tag.findFirst({
      where: {
        id: tagId,
        userId: user.id,
      },
    });

    if (!userStock || !tag) {
      return { success: false, error: "Stock or tag not found" };
    }

    // Check if already tagged
    const existing = await prisma.userStockTag.findUnique({
      where: {
        userStockId_tagId: {
          userStockId,
          tagId,
        },
      },
    });

    if (existing) {
      return { success: true };
    }

    await prisma.userStockTag.create({
      data: {
        userStockId,
        tagId,
      },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to add tag" };
  }
}

export async function removeTagFromStock(userStockId: string, tagId: string) {
  const user = await requireAuth();

  try {
    // Verify ownership
    const userStock = await prisma.userStock.findFirst({
      where: {
        id: userStockId,
        userId: user.id,
      },
    });

    if (!userStock) {
      return { success: false, error: "Stock not found" };
    }

    await prisma.userStockTag.deleteMany({
      where: {
        userStockId,
        tagId,
      },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to remove tag" };
  }
}
