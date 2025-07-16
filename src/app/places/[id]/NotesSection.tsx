"use client";
import NoteForm from "./NoteForm";
import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { authClient } from "../../lib/auth-client";
import { addUserReview } from "../actions";
import supabase from "@/supabaseClient";

interface Note {
    id: number;
    note: string;
    user_id: string;
    user?: { name: string };
}

interface NotesSectionProps {
    notes: Note[];
    handleAddNote: (formData: FormData) => void;
    handleDeleteNote: (noteId: number) => void;
    place: { id: number; address?: string; display_name?: string };
}

export default function NotesSection({ notes, handleAddNote, handleDeleteNote, place }: NotesSectionProps) {
    const [showAddress, setShowAddress] = useState(false);
    const [copied, setCopied] = useState(false);
    const [userReview, setUserReview] = useState<{ id: number } | null>(null);
    const [discarding, setDiscarding] = useState(false);
    const [optimisticNotes, setOptimisticNotes] = useState<Note[]>(notes);

    const { data: session } = authClient.useSession();
    const addExperienceBtnRef = useRef<HTMLButtonElement>(null);
    const imageUploadRef = useRef<HTMLLabelElement>(null);
    const addressDivRef = useRef<HTMLDivElement>(null);

    const fetchUserReview = useCallback(async () => {
        if (session?.user?.id && place?.id) {
            const { data, error } = await supabase
                .from("user_reviews")
                .select("id")
                .eq("user_id", session.user.id)
                .eq("place_id", place.id)
                .maybeSingle();
            if (data && !error) setUserReview(data);
            else setUserReview(null);
        }
    }, [session?.user?.id, place?.id]);

    useEffect(() => {
        fetchUserReview();
    }, [fetchUserReview]);

    // Update optimisticNotes when notes prop changes (e.g. after server update)
    useEffect(() => {
        setOptimisticNotes(notes);
    }, [notes]);

    // Optimistic add note handler
    const optimisticAddNote = (formData: FormData) => {
        const noteText = formData.get("note") as string;
        if (!noteText) return;
        const user_id = session?.user?.id || "anon";
        const user = session?.user ? { name: session.user.name } : undefined;
        const tempNote: Note = { id: Date.now(), note: noteText, user_id, user };
        setOptimisticNotes(prev => [...prev, tempNote]);
        try {
            handleAddNote(formData);
        } catch {
            setOptimisticNotes(prev => prev.filter(n => n.id !== tempNote.id));
        } finally {
            setTimeout(() => setOptimisticNotes(prev => prev.filter(n => n.id !== tempNote.id)), 2000); // fallback to reset after 1s
        }
    };

    // Optimistic delete note handler
    const handleDiscardNote = async (noteId: number) => {
        const filteredNotes = optimisticNotes.filter(n => n.id !== noteId);
        console.log(filteredNotes.length)
        console.log(optimisticNotes.length)
        setOptimisticNotes(filteredNotes);
        try {
            // Call server to delete note
            await handleDeleteNote(noteId);
        } catch (e) {
            // If deletion fails, restore the note
            console.log(e, 'oi')
            setOptimisticNotes(prev => {
                const noteToRestore = optimisticNotes.find(n => n.id === noteId);
                return noteToRestore ? [...prev, noteToRestore] : prev;
            });
        } finally {
            setTimeout(() => setOptimisticNotes(prev => prev.filter(n => n.id !== noteId)), 5000);
        }
    };

    async function handleDiscardReview() {
        if (!userReview) return;
        setDiscarding(true);
        const { error } = await supabase
            .from("user_reviews")
            .delete()
            .eq("id", userReview.id);
        console.log(error)
        setDiscarding(false);
        await fetchUserReview(); // Refetch after discard
        // Optionally show a toast or error
    }

    const handleAddExperience = () => {
        addExperienceBtnRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        imageUploadRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        noteInputRef.current?.focus();
    };
    const handleTryNow = async () => {
        setShowAddress((prev) => !prev);
        if (!showAddress) {
            const address = place.display_name || place.address || "";
            if (address) {
                await navigator.clipboard.writeText(address);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
            }
            // Add user review record
            if (session?.user?.id && place?.id) {
                await addUserReview({
                    user_id: session.user.id,
                    place_id: place.id,
                });
                await fetchUserReview(); // Refetch after add
            }
        }
    };
    const noteInputRef = useRef<HTMLTextAreaElement>(null);

    return (
        <div className="flex flex-col gap-y-4 sm:gap-y-2">
            <div className="flex justify-end w-full gap-4">
                <button
                    ref={addExperienceBtnRef}
                    type="button"
                    className="text-md text-zinc-700 hover:text-emerald-600 transition-colors text-right cursor-pointer"
                    onClick={handleAddExperience}
                >
                    Comment
                    <div className="text-sm text-zinc-400">Have thoughts?</div>
                </button>
                {userReview ? (
                    <div className="flex gap-4 items-center">
                        <Link
                            href={`/profiles/${session?.user?.name || session?.user?.id}`}
                            className="px-4 py-2 text-md text-zinc-700 hover:text-emerald-600 transition-colors text-right cursor-pointer flex flex-col"
                        >
                            Review Now
                            <div className="text-sm text-zinc-400">Been here yet?</div>
                        </Link>
                        <button
                            className="px-3 py-2 text-md text-red-600 border border-red-200 rounded hover:bg-red-50 transition-colors text-right cursor-pointer disabled:opacity-50 flex items-center gap-2"
                            onClick={handleDiscardReview}
                            disabled={discarding}
                        >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            {discarding ? 'Discarding...' : 'Discard'}
                        </button>
                    </div>
                ) : (
                    <div
                        className="px-4 py-2 text-md text-zinc-700 hover:text-emerald-600 transition-colors text-right cursor-pointer"
                        onClick={handleTryNow}
                    >
                        Try now
                        <div className="text-sm text-zinc-400">View address</div>
                    </div>
                )}
            </div>
            {showAddress && (
                <div ref={addressDivRef} className="flex flex-col p-3 bg-zinc-100 rounded text-zinc-700 text-sm flex items-center gap-4 relative">
                    <span>{(place?.display_name || place?.address) ?? "No address available."}</span>
                    {copied && (
                        <span className="absolute top-2 right-2 flex items-center gap-1 bg-black/80 text-white font-medium px-3 py-1 rounded shadow-lg text-xs z-10">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            Copied!
                        </span>
                    )}
                    <div className="text-zinc-400 block bottom-2 right-4 text-xs py-1 px-3">Map coming soon</div>
                </div>
            )}
            <h2 className="text-xl font-semibold">Notes</h2>
            {optimisticNotes.length > 0 ? (
                <ul className="flex flex-col gap-y-2 sm:gap-y-2">
                    {optimisticNotes.map((note) => {
                        const isOwnNote = session?.user?.id && note.user_id === session.user.id;
                        const username = note.user?.name || note.user_id;
                        const isAnon = username === 'anon';
                        return (
                            <li key={note.id} className="bg-zinc-100 rounded p-3 group relative items-center">
                                <div className="text-zinc-700 flex-1">{note.note}</div>
                                {isAnon ? (
                                    <span className="text-xs text-zinc-500 mt-1">By anon</span>
                                ) : (
                                    <Link href={`/${note.user?.name}`} className="text-xs text-zinc-500 hover:text-black cursor-pointer duration-200 mt-1">By {username}</Link>
                                )}
                                {isOwnNote && (
                                    <button
                                        className="absolute cursor-pointer top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-100 text-red-600 rounded px-2 py-1 text-xs font-medium hover:bg-red-200"
                                        onClick={() => handleDiscardNote(note.id)}
                                        title="Delete note"
                                    >
                                        Discard
                                    </button>
                                )}
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <div className="text-zinc-400">No notes yet.</div>
            )}
            <NoteForm onSubmit={optimisticAddNote} textareaRef={noteInputRef} imageUploadRef={imageUploadRef} />
        </div>
    );
} 