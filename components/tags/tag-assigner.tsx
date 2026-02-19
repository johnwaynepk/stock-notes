"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Tag, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { addTagToStock, removeTagFromStock } from "@/app/actions/tags";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface TagAssignerProps {
  userStockId: string;
  allTags: Array<{
    id: string;
    name: string;
    color: string;
  }>;
  assignedTagIds: string[];
}

export function TagAssigner({
  userStockId,
  allTags,
  assignedTagIds,
}: TagAssignerProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const toggleTag = (tagId: string) => {
    const isAssigned = assignedTagIds.includes(tagId);

    startTransition(async () => {
      const result = isAssigned
        ? await removeTagFromStock(userStockId, tagId)
        : await addTagToStock(userStockId, tagId);

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

  const assignedTags = allTags.filter((t) => assignedTagIds.includes(t.id));

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {assignedTags.map((tag) => (
        <span
          key={tag.id}
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
          style={{
            backgroundColor: tag.color + "20",
            color: tag.color,
          }}
        >
          {tag.name}
          <button
            onClick={() => toggleTag(tag.id)}
            disabled={isPending}
            className="ml-0.5 rounded-full opacity-60 hover:opacity-100 disabled:cursor-not-allowed"
            aria-label={`Remove ${tag.name}`}
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </span>
      ))}

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 gap-1 px-2 text-xs">
            <Tag className="h-3 w-3" />
            {assignedTags.length === 0 ? "Add tags" : <Plus className="h-3 w-3" />}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2" align="start">
          <p className="mb-2 px-2 text-xs font-medium text-muted-foreground">
            Tags
          </p>
          {allTags.length === 0 ? (
            <p className="px-2 py-3 text-center text-xs text-muted-foreground">
              No tags yet. Create tags in Settings.
            </p>
          ) : (
            <div className="space-y-0.5">
              {allTags.map((tag) => {
                const isAssigned = assignedTagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    disabled={isPending}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent",
                      isPending && "opacity-50"
                    )}
                  >
                    <div
                      className={cn(
                        "h-3 w-3 rounded-sm border",
                        isAssigned && "border-transparent"
                      )}
                      style={{
                        backgroundColor: isAssigned ? tag.color : "transparent",
                        borderColor: isAssigned ? tag.color : undefined,
                      }}
                    />
                    <span
                      style={{ color: tag.color }}
                      className="text-sm font-medium"
                    >
                      {tag.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
