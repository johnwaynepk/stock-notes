"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format, differenceInDays } from "date-fns";
import { Trash2, ArchiveRestore, Loader2, Clock, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { restoreNote, hardDeleteNote, getDeletedNotes } from "@/app/actions/notes";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface DeletedNote {
  id: string;
  content: string;
  createdAt: string;
  deletedAt: string;
  userStock: {
    id: string;
    deletedAt: string | null;
    stock: {
      symbol: string;
      exchange: string;
      name: string;
    };
  };
}

interface RecentlyDeletedNotesProps {
  initialNotes: DeletedNote[];
}

export function RecentlyDeletedNotes({ initialNotes }: RecentlyDeletedNotesProps) {
  const [notes, setNotes] = useState<DeletedNote[]>(initialNotes);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const refresh = () => {
    startTransition(async () => {
      const result = await getDeletedNotes();
      if (result.success) {
        setNotes(result.notes as DeletedNote[]);
      }
    });
  };

  const handleRestore = (noteId: string) => {
    startTransition(async () => {
      const result = await restoreNote(noteId);
      if (result.success) {
        toast({
          title: "Note restored",
          description: result.stockRestored
            ? "The stock was also restored as Archived."
            : undefined,
        });
        refresh();
        router.refresh();
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    });
  };

  const handleHardDelete = (noteId: string) => {
    startTransition(async () => {
      const result = await hardDeleteNote(noteId);
      if (result.success) {
        toast({ title: "Note permanently deleted" });
        refresh();
        router.refresh();
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    });
  };

  if (notes.length === 0) {
    return (
      <div className="py-16 text-center">
        <StickyNote className="mx-auto h-8 w-8 text-muted-foreground/50" />
        <p className="mt-3 text-sm text-muted-foreground">No recently deleted notes.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-3">
      <AnimatePresence mode="popLayout">
        {notes.map((note) => {
          const deletedAt = new Date(note.deletedAt);
          const daysUsed = differenceInDays(new Date(), deletedAt);
          const daysLeft = 90 - daysUsed;
          const snippet =
            note.content.length > 120
              ? note.content.slice(0, 120).replace(/[#*`_>]/g, "") + "…"
              : note.content.replace(/[#*`_>]/g, "");
          const stockDeleted = note.userStock.deletedAt !== null;

          return (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.15 }}
              className="group rounded-lg border bg-card p-4 opacity-80 hover:opacity-100 transition-opacity"
            >
              {/* Stock header */}
              <div className="mb-2 flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                  {note.userStock.stock.symbol}
                  <span className="text-muted-foreground">
                    {note.userStock.stock.exchange}
                  </span>
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {note.userStock.stock.name}
                </span>
                {stockDeleted && (
                  <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">
                    stock deleted
                  </span>
                )}
              </div>

              {/* Note snippet */}
              <p className="text-sm text-muted-foreground line-clamp-3">{snippet}</p>

              {/* Footer */}
              <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>
                    Deleted {format(deletedAt, "MMM d, yyyy")} ·{" "}
                    <span className={daysLeft <= 7 ? "text-destructive font-medium" : ""}>
                      {daysLeft} day{daysLeft !== 1 ? "s" : ""} remaining
                    </span>
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRestore(note.id)}
                    disabled={isPending}
                    className="h-7 gap-1 px-2 text-xs"
                  >
                    {isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <ArchiveRestore className="h-3 w-3" />
                    )}
                    Restore
                    {stockDeleted ? " (+ stock)" : ""}
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={isPending}
                        className="h-7 gap-1 px-2 text-xs text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete Now
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Permanently delete this note?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will immediately and permanently delete this note. This
                          action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleHardDelete(note.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete Forever
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
