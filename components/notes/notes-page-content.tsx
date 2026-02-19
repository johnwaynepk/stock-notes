"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlobalNotesTimeline } from "@/components/notes/global-notes-timeline";
import { RecentlyDeletedNotes } from "@/components/notes/recently-deleted-notes";

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface NotesPageContentProps {
  initialNotes: any[];
  deletedNotes: any[];
  tags: Tag[];
  deletedCount: number;
}

export function NotesPageContent({
  initialNotes,
  deletedNotes,
  tags,
  deletedCount,
}: NotesPageContentProps) {
  return (
    <Tabs defaultValue="notes" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="notes">Notes</TabsTrigger>
        <TabsTrigger value="deleted" className="gap-1.5">
          Recently Deleted
          {deletedCount > 0 && (
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium tabular-nums">
              {deletedCount}
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="notes">
        <GlobalNotesTimeline initialNotes={initialNotes} tags={tags} />
      </TabsContent>

      <TabsContent value="deleted">
        <RecentlyDeletedNotes initialNotes={deletedNotes} />
      </TabsContent>
    </Tabs>
  );
}
