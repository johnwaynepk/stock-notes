"use client";

import { NoteEditor } from "@/components/notes/note-editor";
import { NoteItem } from "@/components/notes/note-item";
import { motion, AnimatePresence } from "framer-motion";
import { StickyNote } from "lucide-react";

interface NoteTimelineProps {
  userStockId: string;
  initialNotes: Array<{
    id: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
}

export function NoteTimeline({ userStockId, initialNotes }: NoteTimelineProps) {
  return (
    <div className="space-y-4">
      <NoteEditor userStockId={userStockId} />

      {initialNotes.length === 0 ? (
        <div className="py-8 text-center">
          <StickyNote className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-2 text-sm text-muted-foreground">
            No notes yet. Add your first note above.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {initialNotes.map((note) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <NoteItem note={note} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
