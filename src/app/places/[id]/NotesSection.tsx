"use client";
import NoteForm from "./NoteForm";
import { useRef } from "react";
import Link from "next/link";

interface Note {
    id: number;
    note: string;
    user_id: string;
    user?: { name: string };
}

export default function NotesSection({ notes, handleAddNote }: { notes: Note[]; handleAddNote: (formData: FormData) => void; }) {

    const noteInputRef = useRef<HTMLTextAreaElement>(null);

    return (
        <div>
            <div className="flex justify-end w-full gap-2 mb-4">
                <button
                    type="button"
                    className="px-4 py-2 text-sm text-zinc-700 hover:text-emerald-600 transition-colors text-right cursor-pointer"
                    onClick={() => noteInputRef.current?.focus()}
                >
                    Add experience
                    <div className="text-xs text-zinc-400">Been here already?</div>
                </button>
                <div className="px-4 py-2 text-sm text-zinc-700 hover:text-emerald-600 transition-colors text-right cursor-pointer">
                    Try now
                    <div className="text-xs text-zinc-400">View on map</div>
                </div>
            </div>
            <h2 className="text-xl font-semibold mb-2">Notes</h2>
            {notes && notes.length > 0 ? (
                <ul className="space-y-2 mt-4">
                    {notes.map((note) => (
                        <li key={note.id} className="bg-zinc-100 rounded p-3">
                            <div className="text-zinc-700">{note.note}</div>
                            <Link href={`/${note.user?.name}`} className="text-xs text-zinc-500 hover:text-black cursor-pointer duration-200 mt-1">By {note.user?.name || note.user_id}</Link>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="text-zinc-400 mt-4">No notes yet.</div>
            )}
            <NoteForm onSubmit={handleAddNote} textareaRef={noteInputRef} />

        </div>
    );
} 