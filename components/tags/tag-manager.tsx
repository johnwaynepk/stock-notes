"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createTag, updateTag, deleteTag } from "@/app/actions/tags";
import { useToast } from "@/components/ui/use-toast";

const TAG_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];

interface TagManagerProps {
  tags: Array<{
    id: string;
    name: string;
    color: string;
    userStockTags: Array<{ id: string }>;
  }>;
}

export function TagManager({ tags }: TagManagerProps) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(TAG_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const handleCreate = () => {
    if (!newName.trim()) return;

    startTransition(async () => {
      const result = await createTag({ name: newName.trim(), color: newColor });
      if (result.success) {
        setNewName("");
        setCreating(false);
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  };

  const handleUpdate = (tagId: string) => {
    if (!editName.trim()) return;

    startTransition(async () => {
      const result = await updateTag(tagId, {
        name: editName.trim(),
        color: editColor,
      });
      if (result.success) {
        setEditingId(null);
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  };

  const handleDelete = (tagId: string) => {
    startTransition(async () => {
      const result = await deleteTag(tagId);
      if (result.success) {
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  };

  const startEdit = (tag: { id: string; name: string; color: string }) => {
    setEditingId(tag.id);
    setEditName(tag.name);
    setEditColor(tag.color);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Tags</CardTitle>
        {!creating && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCreating(true)}
            className="h-8 gap-1"
          >
            <Plus className="h-4 w-4" />
            New Tag
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {/* Create form */}
        {creating && (
          <div className="mb-4 space-y-3 rounded-lg border p-3">
            <Input
              placeholder="Tag name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="h-8 text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") setCreating(false);
              }}
            />
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {TAG_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewColor(color)}
                    className="h-5 w-5 rounded-full transition-transform"
                    style={{
                      backgroundColor: color,
                      transform: newColor === color ? "scale(1.2)" : "scale(1)",
                      outline:
                        newColor === color
                          ? `2px solid ${color}`
                          : "none",
                      outlineOffset: "2px",
                    }}
                  />
                ))}
              </div>
              <div className="ml-auto flex gap-1">
                <Button
                  size="sm"
                  onClick={handleCreate}
                  disabled={!newName.trim() || isPending}
                  className="h-7 px-2 text-xs"
                >
                  {isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    "Create"
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setCreating(false)}
                  className="h-7 px-2 text-xs"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Tag list */}
        {tags.length === 0 && !creating ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No tags created yet
          </p>
        ) : (
          <div className="space-y-1">
            {tags.map((tag) => (
              <div key={tag.id}>
                {editingId === tag.id ? (
                  <div className="space-y-2 rounded-lg border p-3">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-8 text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleUpdate(tag.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                    />
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        {TAG_COLORS.map((color) => (
                          <button
                            key={color}
                            onClick={() => setEditColor(color)}
                            className="h-5 w-5 rounded-full transition-transform"
                            style={{
                              backgroundColor: color,
                              transform:
                                editColor === color
                                  ? "scale(1.2)"
                                  : "scale(1)",
                              outline:
                                editColor === color
                                  ? `2px solid ${color}`
                                  : "none",
                              outlineOffset: "2px",
                            }}
                          />
                        ))}
                      </div>
                      <div className="ml-auto flex gap-1">
                        <Button
                          size="sm"
                          onClick={() => handleUpdate(tag.id)}
                          disabled={!editName.trim() || isPending}
                          className="h-7 px-2 text-xs"
                        >
                          {isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingId(null)}
                          className="h-7 px-2 text-xs"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-muted/50">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="text-sm font-medium">{tag.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {tag.userStockTags.length} stock
                        {tag.userStockTags.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="flex gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => startEdit(tag)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(tag.id)}
                        disabled={isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
