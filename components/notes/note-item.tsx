"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import { Pencil, Trash2, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateNote, deleteNote } from "@/app/actions/notes";
import { useToast } from "@/components/ui/use-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface NoteItemProps {
  note: {
    id: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
  };
}

export function NoteItem({ note }: NoteItemProps) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const handleUpdate = () => {
    if (!editContent.trim()) return;

    startTransition(async () => {
      const result = await updateNote(note.id, editContent.trim());
      if (result.success) {
        setEditing(false);
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

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteNote(note.id);
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

  const createdDate = new Date(note.createdAt);
  const updatedDate = new Date(note.updatedAt);
  const absoluteDate = format(createdDate, "MMM d, yyyy, h:mm a");
  const timeAgo = formatDistanceToNow(createdDate, { addSuffix: true });
  const isEdited = updatedDate.getTime() !== createdDate.getTime();

  return (
    <div className="group rounded-lg border bg-card p-3">
      {editing ? (
        <div className="space-y-2">
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="min-h-[60px] resize-none text-sm"
          />
          <div className="flex gap-1">
            <Button
              size="sm"
              onClick={handleUpdate}
              disabled={!editContent.trim() || isPending}
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
              onClick={() => {
                setEditing(false);
                setEditContent(note.content);
              }}
              className="h-7 px-2 text-xs"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="prose prose-sm prose-invert max-w-none text-sm prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-headings:my-2 prose-pre:bg-muted prose-pre:text-foreground prose-code:text-foreground prose-a:text-blue-400">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {note.content}
            </ReactMarkdown>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span
                className="text-xs text-muted-foreground"
                title={timeAgo}
              >
                {absoluteDate}
              </span>
              {isEdited && (
                <span className="text-xs text-muted-foreground/50">· edited</span>
              )}
            </div>
            <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setEditing(true)}
              >
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive hover:text-destructive"
                onClick={handleDelete}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
