"use client";
import NoteForm from "./NoteForm";
import { useRef, useState } from "react";
import Link from "next/link";

interface Note {
    id: number;
    note: string;
    user_id: string;
    user?: { name: string };
}

interface NotesSectionProps {
    notes: Note[];
    handleAddNote: (formData: FormData) => void;
    place: { address?: string; display_name?: string };
}

export default function NotesSection({ notes, handleAddNote, place }: NotesSectionProps) {
    const [showAddress, setShowAddress] = useState(false);
    const [copied, setCopied] = useState(false);

    const addExperienceBtnRef = useRef<HTMLButtonElement>(null);
    const imageUploadRef = useRef<HTMLLabelElement>(null);
    const addressDivRef = useRef<HTMLDivElement>(null);

    const handleAddExperience = () => {
        addExperienceBtnRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        imageUploadRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        noteInputRef.current?.focus();
    };
    const handleTryNow = async () => {
        setShowAddress((prev) => !prev);
        if (!showAddress) {
            const address = place.display_name || place.address || "";
            console.log(address, 'address')
            if (address) {
                await navigator.clipboard.writeText(address);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
            }
        }
    };
    console.log(place, 'poj')
    const noteInputRef = useRef<HTMLTextAreaElement>(null);

    return (
        <div>
            <div className="flex justify-end w-full gap-2 mb-4">
                <button
                    ref={addExperienceBtnRef}
                    type="button"
                    className="px-4 py-2 text-sm text-zinc-700 hover:text-emerald-600 transition-colors text-right cursor-pointer"
                    onClick={handleAddExperience}
                >
                    Add experience
                    <div className="text-xs text-zinc-400">Been here already?</div>
                </button>
                <div
                    className="px-4 py-2 text-sm text-zinc-700 hover:text-emerald-600 transition-colors text-right cursor-pointer"
                    onClick={handleTryNow}
                >
                    Try now
                    <div className="text-xs text-zinc-400">View address</div>
                </div>
            </div>
            {showAddress && (
                <div ref={addressDivRef} className="mt-2 p-3 bg-zinc-100 rounded text-zinc-700 text-sm flex items-center gap-4 relative">
                    <span>{(place?.display_name || place?.address) ?? "No address available."}</span>
                    {copied && (
                        <span className="absolute top-2 right-2 flex items-center gap-1 bg-black/80 text-white font-medium px-3 py-1 rounded shadow-lg text-xs z-10">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            Copied!
                        </span>
                    )}
                    <div className="text-zinc-400 absolute bottom-2 right-4 text-xs py-1 px-3">Map coming soon</div>
                </div>
            )}
            <h2 className="text-xl font-semibold mb-2 mt-4">Notes</h2>
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
            <NoteForm onSubmit={handleAddNote} textareaRef={noteInputRef} imageUploadRef={imageUploadRef} />

        </div>
    );
} 