"use client";
import ReviewForm from "./ReviewForm";
import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { authClient } from "../../lib/auth-client";
import { addUserReview } from "../actions";
import supabase from "@/supabaseClient";
import { addPlaceTolist } from "../actions";
import { useRouter } from "next/navigation";
import MultiSelectDropdown from "../../components/MultiSelectDropdown";
import Image from "next/image";

interface Note {
    id: number;
    note: string;
    user_id: string;
    image_path: string;
    user?: { name: string };
    price?: number;
    ambiance?: string;
}

interface NotesSectionProps {
    notes: Note[];
    handleAddNote: (formData: FormData) => void;
    handleDeleteNote: (noteId: number) => void;
    place: { id: number; address?: string; display_name?: string };
}

export default function ReviewSection({ notes, handleAddNote, handleDeleteNote, place }: NotesSectionProps) {
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
            price: price ? Number(price) : undefined,
            ambiance: ambiance || undefined,
        };
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
            <div className="flex justify-end w-full gap-8">
                <AddTolistButton placeId={place.id} />

                {userReview ? (
                    <div className="flex gap-8 items-center">
                        <button
                            type="button"
                            className="px-4 py-2 text-md text-zinc-700 hover:text-emerald-600 transition-colors text-right cursor-pointer flex flex-col bg-transparent border-none outline-none"
                            onClick={() => {
                                noteInputRef.current?.focus();
                                noteInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }}
                        >
                            Review Now
                            <div className="text-sm text-emerald-600">Ongoing</div>
                        </button>
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
                        className="py-2 text-md text-zinc-700 hover:text-emerald-600 transition-colors text-right cursor-pointer"
                        onClick={handleTryNow}
                    >
                        Try now
                        <div className="text-sm text-zinc-400">View address</div>
                    </div>
                )}
            </div>
            {showAddress && (
                <div ref={addressDivRef} className="flex flex-col p-3 bg-zinc-100 rounded text-zinc-700 text-sm items-center gap-4 relative">
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
            <h2 className="text-xl font-semibold">Reviews</h2>
            {optimisticNotes.length > 0 ? (
                <ul className="flex flex-col gap-y-2 sm:gap-y-4">
                    {optimisticNotes.map((note) => {
                        const isOwnNote = session?.user?.id && note.user_id === session.user.id;
                        const username = note.user?.name || note.user_id;
                        const isAnon = username === 'anon';
                        // Price label helper
                        const priceLabels: Record<number, string> = { 1: 'a good deal', 2: 'fairly priced', 3: 'pricey' };
                        const priceTag = note.price ? priceLabels[note.price] || String(note.price) : null;
                        // Ambiance tags helper
                        const ambianceTags = note.ambiance ? note.ambiance.split(/,| and /).map((a: string) => a.trim()).filter(Boolean) : [];
                        console.log(note.ambiance, 'ambiance')
                        if (note.image_path) {
                            // Row layout: image left, tags/text right
                            return (
                                <div key={note.id} className="flex flex-row gap-4 items-start rounded group relative mb-2">
                                    <div className="relative w-32 h-32 flex-shrink-0">
                                        <Image
                                            src={note.image_path}
                                            alt="Preview"
                                            fill
                                            className="object-cover rounded-lg bg-zinc-200"
                                        />
                                    </div>
                                    <div className="flex flex-col flex-1 min-w-0 relative gap-2">
                                        <div className="flex flex-row gap-2 flex-wrap">
                                            {priceTag && <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100">{priceTag}</span>}
                                            {ambianceTags.map((tag: string, i: number) => (
                                                <span key={i} className="px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">{tag}</span>
                                            ))}
                                        </div>
                                        <div className="text-zinc-700 flex-1 break-words">{note.note}</div>
                                        <div className="flex flex-row gap-2 items-center">
                                            {isAnon ? (
                                                <span className="text-xs text-zinc-500">By anon</span>
                                            ) : (
                                                <Link href={`/profiles/${note.user?.name}`} className="text-xs text-zinc-500 hover:text-black cursor-pointer duration-200 mt-1">By {username}</Link>
                                            )}
                                        </div>
                                        <button
                                            className="flex w-max cursor-pointer duration-200 bg-zinc-100 text-zinc-700 border border-zinc-300 rounded px-2 py-1 text-xs font-medium hover:bg-emerald-50 hover:text-emerald-700 z-10 mr-2 shadow"
                                            onClick={() => {/* bump logic here */ }}
                                            title="Bump review"
                                        >
                                            Bump
                                        </button>

                                        {isOwnNote && (
                                            <>
                                                <button
                                                    className="absolute cursor-pointer right-0 opacity-0 group-hover:opacity-100 transition-opacity text-black underline hover:text-red-600 rounded px-2 py-1 text-sm font-medium z-10"
                                                    onClick={() => handleDiscardNote(note.id)}
                                                    title="Delete note"
                                                >
                                                    Discard
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        } else {
                            // No image: render as before
                            return (
                                <div key={note.id}>
                                    <li className="bg-zinc-100 rounded p-3 group relative items-center mb-2">
                                        <div className="flex flex-row gap-2 mb-1">
                                            {priceTag && <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100">{priceTag}</span>}
                                            {ambianceTags.map((tag: string, i: number) => (
                                                <span key={i} className="px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">{tag}</span>
                                            ))}
                                        </div>
                                        <div className="text-zinc-700 flex-1">{note.note}</div>
                                        {isAnon ? (
                                            <span className="text-xs text-zinc-500 mt-1">By anon</span>
                                        ) : (
                                            <Link href={`/profiles/${note.user?.name}`} className="text-xs text-zinc-500 hover:text-black cursor-pointer duration-200 mt-1">By {username}</Link>
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
                                </div>
                            );
                        }
                    })}
                </ul>
            ) : (
                <div className="text-zinc-400">No reviews yet.</div>
            )}
            <ReviewForm onSubmit={optimisticAddNote} textareaRef={noteInputRef} imageUploadRef={imageUploadRef} place={place} />
        </div>
    );
}

function AddTolistButton({ placeId }: { placeId: number }) {
    "use client";
    const { data: session } = authClient.useSession();
    const [lists, setlists] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
    const router = useRouter();
    const [dropdownKey, setDropdownKey] = useState(0); // for force close

    useEffect(() => {
        if (!session?.user?.id) return;
        supabase
            .from("lists")
            .select("id, name")
            .eq("created_by", session.user.id)
            .then(({ data }) => {
                setlists(data || []);
                setLoading(false);
            });
    }, [session?.user?.id]);

    // Add a special option for creating a new list
    const NEW_list_VALUE = "__new__";
    const listOptions = [
        { value: NEW_list_VALUE, label: "Create a new list" },
        ...lists.map((it: any) => ({ value: it.id, label: it.name })),
    ];

    const handleAddTolists = async () => {
        setAdding(true);
        setError(null);
        setSuccess(null);
        let anyError = false;
        let newlistId: number | null = null;
        let selected = selectedIds;
        // If 'New list' is selected, create it first
        if (selected.some(id => String(id) === NEW_list_VALUE)) {
            const { data, error } = await supabase
                .from("lists")
                .insert([{ name: "New list", created_by: session?.user.id }])
                .select();
            if (error || !data || !data[0]) {
                setError("Failed to create list");
                setAdding(false);
                return;
            }
            newlistId = data[0].id;
            // Replace NEW_list_VALUE with the new id, filter to numbers only
            selected = selected.filter(id => typeof id === 'number');
            if (newlistId !== null) selected = [...selected, newlistId];
            setSelectedIds(selected);
        } else {
            // Always filter to numbers only
            selected = selected.filter((id): id is number => typeof id === 'number');
        }
        // Only add to lists with numeric IDs
        const numericSelected = selected.filter((id): id is number => typeof id === 'number');
        for (const listId of numericSelected) {
            const res = await addPlaceTolist({ list_id: listId, place_id: placeId });
            if (res && res.error) {
                setError(`Some failed: ${res.error}`);
                anyError = true;
            }
        }
        if (!anyError) {
            setSuccess("Added to selected lists! Redirecting...");
            router.push(`/lists/${newlistId || numericSelected[0]}`);
        }
        setAdding(false);
        setTimeout(() => { setSuccess(null); setError(null); }, 2000);

        // Link the place to the new list
        if (newlistId && placeId) {
            const { error: linkError } = await supabase
                .from("list_places")
                .insert([{ list_id: newlistId, place_id: placeId }]);
            if (linkError) {
                setError("Failed to link place to new list");
                setAdding(false);
                return;
            }
        }
    };

    // Only allow one 'New list' at a time
    const handleDropdownChange = (selected: (string | number)[]) => {
        if (selected.some(id => String(id) === NEW_list_VALUE)) {
            setSelectedIds([NEW_list_VALUE]);
        } else {
            setSelectedIds(selected.filter((id): id is number => typeof id === 'number'));
        }
    };

    const handleCreatelist = async () => {
        setAdding(true);
        setError(null);
        setSuccess(null);
        const { data, error } = await supabase
            .from("lists")
            .insert([{ name: "New list", created_by: session?.user.id }])
            .select();
        setAdding(false);
        if (error || !data || !data[0]) {
            setError("Failed to create list");
            return;
        }
        router.push(`/lists/${data[0].id}`);
    };

    if (!session?.user?.id) return null;
    if (loading) return <div>Loading...</div>;
    if (lists.length === 0) {
        return (
            <button onClick={handleCreatelist} className="text-md text-zinc-700 hover:text-emerald-600 transition-colors text-right cursor-pointer" disabled={adding}>
                Create new list
                <div className="text-sm text-zinc-400">Start planning</div>
            </button>
        );
    }
    return (
        <div className="w-62">
            <MultiSelectDropdown
                options={listOptions}
                selected={selectedIds}
                onChange={handleDropdownChange}
                placeholder="Add to list..."
                onConfirm={handleAddTolists}
                onCancel={() => setDropdownKey(k => k + 1)}
                confirmLabel={adding ? "Adding..." : "Add"}
                cancelLabel="Cancel"
                confirmDisabled={adding || selectedIds.length === 0}
                key={dropdownKey}
                variant="detailed"
            />
            {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
            {success && <div className="text-emerald-600 text-xs mt-1">{success}</div>}
        </div>
    );
} 