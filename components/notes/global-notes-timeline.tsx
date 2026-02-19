"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Search, StickyNote, Pencil, Trash2, Check, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { getAllNotes, updateNote, deleteNote } from "@/app/actions/notes";
import { useToast } from "@/components/ui/use-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface Note {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  userStock: {
    id: string;
    stock: {
      symbol: string;
      exchange: string;
      name: string;
    };
    tags: Array<{
      tag: {
        id: string;
        name: string;
        color: string;
      };
    }>;
  };
}

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface GlobalNotesTimelineProps {
  initialNotes: Note[];
  tags: Tag[];
}

export function GlobalNotesTimeline({
  initialNotes,
  tags,
}: GlobalNotesTimelineProps) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");
  const [searching, setSearching] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const handleFilter = (tagId: string | null, search: string) => {
    setSearching(true);
    startTransition(async () => {
      const result = await getAllNotes({
        tagId: tagId || undefined,
        keyword: search || undefined,
      });
      if (result.success && result.notes) {
        setNotes(result.notes as Note[]);
      }
      setSearching(false);
    });
  };

  const handleTagFilter = (tagId: string | null) => {
    setActiveTag(tagId);
    handleFilter(tagId, keyword);
  };

  const handleSearch = (value: string) => {
    setKeyword(value);
    // Debounce
    const timer = setTimeout(() => handleFilter(activeTag, value), 300);
    return () => clearTimeout(timer);
  };

  const handleUpdate = (noteId: string) => {
    if (!editContent.trim()) return;

    startTransition(async () => {
      const result = await updateNote(noteId, editContent.trim());
      if (result.success) {
        setEditingId(null);
        handleFilter(activeTag, keyword);
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

  const handleDelete = (noteId: string) => {
    startTransition(async () => {
      const result = await deleteNote(noteId);
      if (result.success) {
        handleFilter(activeTag, keyword);
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

  return (
    <div className="max-w-3xl space-y-4">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search notes..."
          value={keyword}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tag filters */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => handleTagFilter(null)}
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
              !activeTag
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            All
          </button>
          {tags.map((tag) => (
            <button
              key={tag.id}
              onClick={() =>
                handleTagFilter(activeTag === tag.id ? null : tag.id)
              }
              className="rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors"
              style={{
                backgroundColor:
                  activeTag === tag.id ? tag.color : tag.color + "20",
                color: activeTag === tag.id ? "#fff" : tag.color,
              }}
            >
              {tag.name}
            </button>
          ))}
        </div>
      )}

      {/* Notes list */}
      {searching ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : notes.length === 0 ? (
        <div className="py-12 text-center">
          <StickyNote className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-3 text-sm text-muted-foreground">
            {keyword || activeTag
              ? "No notes match your filters."
              : "No notes yet. Add notes from a stock's detail page."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {notes.map((note) => {
              const timeAgo = formatDistanceToNow(new Date(note.createdAt), {
                addSuffix: true,
              });

              return (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.15 }}
                  className="group rounded-lg border bg-card p-4"
                >
                  {/* Stock header */}
                  <div className="mb-2 flex items-center gap-2">
                    <Link
                      href={`/dashboard?stock=${note.userStock.id}`}
                      className="flex items-center gap-1.5 rounded-md bg-muted px-2 py-0.5 text-xs font-medium transition-colors hover:bg-muted/80"
                    >
                      {note.userStock.stock.symbol}
                      <span className="text-muted-foreground">
                        {note.userStock.stock.exchange}
                      </span>
                    </Link>
                    {note.userStock.tags.map(({ tag }) => (
                      <span
                        key={tag.id}
                        className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{
                          backgroundColor: tag.color + "20",
                          color: tag.color,
                        }}
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>

                  {/* Note content */}
                  {editingId === note.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="min-h-[60px] resize-none text-sm"
                        autoFocus
                      />
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          onClick={() => handleUpdate(note.id)}
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
                          onClick={() => setEditingId(null)}
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
                        <span className="text-xs text-muted-foreground">
                          {timeAgo}
                        </span>
                        <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => {
                              setEditingId(note.id);
                              setEditContent(note.content);
                            }}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(note.id)}
                            disabled={isPending}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
