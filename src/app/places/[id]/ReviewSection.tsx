"use client";
import ReviewForm from "./ReviewForm";
import { useRef, useState, useEffect, useCallback } from "react";
import { authClient } from "../../lib/auth-client";
import supabase from "@/supabaseClient";
import ReviewCard from "../../components/ReviewCard";
import AddToListButton from "../../components/AddToListButton";
import ReviewActions from "../../components/ReviewActions";
import { Note, NotesSectionProps } from "../types";

export default function ReviewSection({ notes, handleAddNote, handleDeleteNote, place }: NotesSectionProps) {
    const [userReview, setUserReview] = useState<{ id: number } | null>(null);
    const [optimisticNotes, setOptimisticNotes] = useState<Note[]>(notes);

    const { data: session } = authClient.useSession();

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
        const image_path = formData.get("image_path") as string;
        const price = formData.get("price") as string | null;
        const ambiance = formData.get("ambiance") as string | null;
        if (!noteText) return;
        const user_id = session?.user?.id || "anon";
        const user = session?.user ? { name: session.user.name } : undefined;
        const tempNote: Note = {
            id: Date.now(),
            note: noteText,
            user_id,
            user,
            image_path,
            price: Number(price || 0),
            ambiance: ambiance || undefined,
            created_at: new Date().toISOString(),
        };
        setOptimisticNotes(prev => [...prev, tempNote]);
        try {
            handleAddNote(formData);
            console.log(formData, 'weoi')
        } catch {
            setOptimisticNotes(prev => prev.filter(n => n.id !== tempNote.id));
        } finally {
            setTimeout(() => setOptimisticNotes(prev => prev.filter(n => n.id !== tempNote.id)), 2000); // fallback to reset after 1s
        }
    };

    // Optimistic delete note handler
    const handleDiscardNote = async (noteId: number) => {
        const filteredNotes = optimisticNotes.filter(n => n.id !== noteId);
        setOptimisticNotes(filteredNotes);
        try {
            // Call server to delete note
            await handleDeleteNote(noteId);
        } catch {
            // If deletion fails, restore the note
            setOptimisticNotes(prev => {
                const noteToRestore = optimisticNotes.find(n => n.id === noteId);
                return noteToRestore ? [...prev, noteToRestore] : prev;
            });
        } finally {
            setTimeout(() => setOptimisticNotes(prev => prev.filter(n => n.id !== noteId)), 5000);
        }
    };



    const noteInputRef = useRef<HTMLTextAreaElement>(null);
    return (
        <div className="flex flex-col gap-y-4 sm:gap-y-4">
            <div className="flex justify-end w-full gap-8">
                <AddToListButton placeId={place.id} />
                <ReviewActions
                    place={place}
                    userReview={userReview}
                    onUserReviewChange={fetchUserReview}
                />
            </div>

            <h2 className="text-xl font-semibold py-6">Reviews</h2>
            {(() => {
                const notesWithContent = optimisticNotes.filter(note => note.note);
                return notesWithContent.length > 0 ? (
                    <ul className="flex flex-col gap-y-2 sm:gap-y-6">
                        {notesWithContent.map((note) => (
                            <ReviewCard
                                key={note.id}
                                note={note}
                                onDelete={handleDiscardNote}
                            />
                        ))}
                    </ul>
                ) : (
                    <div className="text-zinc-400 pb-4">No reviews yet.</div>
                );
            })()}
            <ReviewForm onSubmit={optimisticAddNote} textareaRef={noteInputRef} place={place} />
        </div>
    );
}

