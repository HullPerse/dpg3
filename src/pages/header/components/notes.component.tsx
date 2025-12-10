import {
  type UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Edit, Plus, Save, Trash, X } from "lucide-react";
import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Button } from "@/components/ui/button.component";
import Input from "@/components/ui/input.component";
import { ModalError, ModalLoading } from "@/components/ui/modal.state";
import { timeAgo } from "@/lib/utils";

interface Note {
  id: number;
  text: string;
  createdAt: Date;
}

const getNotesFromStorage = (): Note[] => {
  const raw = localStorage.getItem("notes");
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as {
      id: number;
      text: string;
      createdAt: string;
    }[];

    return parsed.map((note) => ({
      ...note,
      createdAt: new Date(note.createdAt),
    }));
  } catch {
    return [];
  }
};

const saveNotesToStorage = (notes: Note[]) => {
  localStorage.setItem("notes", JSON.stringify(notes));
};

export default function UserNotes() {
  const queryClient = useQueryClient();
  const [inputText, setInputText] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");

  const {
    data: notes = [],
    isLoading,
    isError,
  }: UseQueryResult<Note[], Error> = useQuery({
    queryKey: ["notes"],
    queryFn: getNotesFromStorage,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 0,
  });

  const addNoteMutation = useMutation({
    mutationFn: async (text: string): Promise<Note[]> => {
      const newNote: Note = {
        id: Date.now(),
        text: text.trim(),
        createdAt: new Date(),
      };
      const updatedNotes = [...notes, newNote];
      saveNotesToStorage(updatedNotes);
      return updatedNotes;
    },
    onMutate: async (text) => {
      await queryClient.cancelQueries({ queryKey: ["notes"] });

      const previousNotes = queryClient.getQueryData<Note[]>(["notes"]) || [];

      const newNote = {
        id: Date.now(),
        text: text.trim(),
        createdAt: new Date(),
      };

      const updatedNotes = [...previousNotes, newNote];
      queryClient.setQueryData(["notes"], updatedNotes);

      return { previousNotes };
    },
    onError: (err, _, context) => {
      console.error("Error adding note:", err);
      queryClient.setQueryData(["notes"], context?.previousNotes ?? []);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (id: number): Promise<Note[]> => {
      const updatedNotes = notes.filter((note) => note.id !== id);
      saveNotesToStorage(updatedNotes);
      return updatedNotes;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["notes"] });

      const previousNotes = queryClient.getQueryData<Note[]>(["notes"]) || [];

      const updatedNotes = previousNotes.filter((note) => note.id !== id);
      queryClient.setQueryData(["notes"], updatedNotes);

      return { previousNotes };
    },
    onError: (err, _, context) => {
      console.error("Error deleting note:", err);
      queryClient.setQueryData(["notes"], context?.previousNotes ?? []);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  const editNoteMutation = useMutation({
    mutationFn: async ({
      id,
      text,
    }: {
      id: number;
      text: string;
    }): Promise<Note[]> => {
      const updatedNotes = notes.map((note) =>
        note.id === id ? { ...note, text: text.trim() } : note,
      );
      saveNotesToStorage(updatedNotes);
      return updatedNotes;
    },
    onMutate: async ({ id, text }) => {
      await queryClient.cancelQueries({ queryKey: ["notes"] });

      const previousNotes = queryClient.getQueryData<Note[]>(["notes"]) || [];

      const updatedNotes = previousNotes.map((note) =>
        note.id === id ? { ...note, text: text.trim() } : note,
      );
      queryClient.setQueryData(["notes"], updatedNotes);

      return { previousNotes };
    },
    onError: (err, _, context) => {
      console.error("Error editing note:", err);
      queryClient.setQueryData(["notes"], context?.previousNotes ?? []);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === "notes" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue) as {
            id: number;
            text: string;
            createdAt: string;
          }[];
          const normalized = parsed.map((n) => ({
            ...n,
            createdAt: new Date(n.createdAt),
          }));
          queryClient.setQueryData(["notes"], normalized);
        } catch (err) {
          console.error("Failed to sync notes from storage event", err);
        }
      }
    };

    globalThis.addEventListener("storage", handler);
    return () => globalThis.removeEventListener("storage", handler);
  }, [queryClient]);

  const handleAddNote = useCallback(() => {
    const text = inputText.trim();
    if (!text) return;

    addNoteMutation.mutate(text);
    setInputText("");
  }, [inputText, addNoteMutation]);

  const handleDeleteNote = useCallback(
    (id: number) => {
      deleteNoteMutation.mutate(id);
    },
    [deleteNoteMutation],
  );

  const handleStartEdit = useCallback((note: Note) => {
    setEditingNoteId(note.id);
    setEditingText(note.text);
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (editingNoteId === null || !editingText.trim()) return;

    editNoteMutation.mutate({
      id: editingNoteId,
      text: editingText,
    });
    setEditingNoteId(null);
    setEditingText("");
  }, [editingNoteId, editingText, editNoteMutation]);

  const handleCancelEdit = useCallback(() => {
    setEditingNoteId(null);
    setEditingText("");
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleAddNote();
      }
    },
    [handleAddNote],
  );

  const handleEditKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSaveEdit();
      } else if (e.key === "Escape") {
        handleCancelEdit();
      }
    },
    [handleSaveEdit, handleCancelEdit],
  );

  const reversedNotes = useMemo(() => {
    return [...notes].reverse();
  }, [notes]);

  if (isError) return <ModalError />;
  if (isLoading) return <ModalLoading />;

  return (
    <main className="flex flex-col w-full h-full items-center gap-6 p-4">
      <section className="flex flex-row gap-2 w-full max-w-2xl">
        <Input
          autoFocus
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Заметка..."
          className="flex-1"
          type="text"
        />
        <Button
          size="icon"
          className="text-primary shrink-0"
          onClick={handleAddNote}
          disabled={!inputText.trim() || addNoteMutation.isPending}
        >
          <Plus className="w-5 h-5" />
        </Button>
      </section>

      <section className="flex flex-col w-full max-w-2xl gap-3">
        {reversedNotes.length === 0 ? (
          <p className="text-center text-muted-foreground py-12 text-lg">
            Заметок пока нет
          </p>
        ) : (
          reversedNotes.map((note) => (
            <div
              key={note.id}
              className="relative p-5 rounded border border-primary"
            >
              {editingNoteId === note.id ? (
                <div className="flex flex-col gap-3">
                  <Input
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    onKeyDown={handleEditKeyDown}
                    placeholder="Редактировать заметку..."
                    className="flex-1"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      size="icon"
                      onClick={handleCancelEdit}
                      disabled={editNoteMutation.isPending}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      onClick={handleSaveEdit}
                      disabled={
                        !editingText.trim() || editNoteMutation.isPending
                      }
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-lg pr-20 wrap-break-word">{note.text}</p>
                  <span className="absolute right-1 bottom-1 text-xs text-muted-foreground">
                    {timeAgo(note.createdAt)}
                  </span>

                  <div className="absolute right-1 top-1 flex gap-1">
                    <Button
                      size="icon"
                      className="hover:bg-blue-500/10 text-muted-foreground hover:text-blue-600"
                      onClick={() => handleStartEdit(note)}
                      disabled={deleteNoteMutation.isPending}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      className="hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteNote(note.id)}
                      disabled={deleteNoteMutation.isPending}
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </section>
    </main>
  );
}
