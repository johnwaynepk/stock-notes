import { getAllNotes, getDeletedNotes } from "@/app/actions/notes";
import { getUserTags } from "@/app/actions/tags";
import { NotesPageContent } from "@/components/notes/notes-page-content";

export default async function NotesPage() {
  const [notesResult, deletedResult, tags] = await Promise.all([
    getAllNotes(),
    getDeletedNotes(),
    getUserTags(),
  ]);

  const activeNotes = notesResult.notes || [];
  const deletedNotes = deletedResult.notes || [];

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Notes</h1>
        <p className="text-sm text-muted-foreground">
          All notes across your stocks
        </p>
      </div>

      <NotesPageContent
        initialNotes={activeNotes}
        deletedNotes={deletedNotes}
        tags={tags}
        deletedCount={deletedNotes.length}
      />
    </div>
  );
}
