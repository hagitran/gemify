import { notFound } from "next/navigation";
import Image from "next/image";
import supabase from "@/supabaseClient";
import Link from "next/link";
import { addNote } from "../actions";
import NotesSection from "./NotesSection";
import { revalidatePath } from "next/cache";
import { deleteNote } from "../actions";

interface Note {
    id: number;
    note: string;
    user_id: string;
    user?: { name: string };
}

interface Place {
    id: number;
    name: string;
    city: string;
    type: string;
    address: string;
    image_path: string;
    price: number;
    lat?: number;
    long?: number;
    display_name?: string;
    osmId?: string;
    notes: string;
    added_by: string;
    description: string;
    user: { name: string };
    match_score?: number;
    created_at?: string;
}

function getMatchBadge(score?: number) {
    if (typeof score !== 'number') return null;
    if (score >= 0.9) return { label: "Great Fit", color: "bg-emerald-600" };
    if (score >= 0.7) return { label: "Worth the Trip", color: "bg-blue-500" };
    if (score >= 0.5) return { label: "Hidden Gem", color: "bg-purple-500" };
    return null;
}

export const revalidate = 60; // ISR: revalidate every 60 seconds

export async function generateStaticParams() {
    // Fetch all place IDs for static generation
    const { data, error } = await supabase.from("places").select("id");
    if (error || !data) return [];
    return data.map((place: { id: number }) => ({ id: place.id.toString() }));
}
type Params = Promise<{ id: string }>;
export default async function PlacePage({ params }: { params: Params }) {
    const { id } = await params;
    const idNum = Number(id);
    if (isNaN(idNum)) return notFound();

    let place: Place | null = null;
    let notes: Note[] = [];
    try {

        const { data: placeData } = await supabase
            .from("places")
            .select("*, user:added_by(name)")
            .eq("id", idNum)
            .single();
        place = placeData;
        const { data: notesData } = await supabase
            .from("user_notes")
            .select("*, user:user_id(name)")
            .eq("place_id", idNum);
        notes = notesData || [];
    } catch (e) {
        console.log(e)
        return notFound();
    }
    if (!place) return notFound();

    const badge = getMatchBadge(place.match_score);
    const price = place.price ? '$'.repeat(place.price) : '';
    const type = place.type ? place.type.charAt(0).toUpperCase() + place.type.slice(1) : '';

    // Server action for note submission
    async function handleAddNote(formData: FormData) {
        "use server";
        const noteText = formData.get("note") as string;
        const user_id = formData.get("user_id") as string || "anon";
        await addNote({ place_id: place!.id, user_id, note: noteText });
        revalidatePath(`/places/${place!.id}`);
    }

    async function handleDeleteNote(noteId: number) {
        "use server";
        await deleteNote(noteId);
        revalidatePath(`/places/${place?.id}`);
    }

    return (
        <div className="w-full flex flex-col items-center overflow-x-hidden px-0 gap-4 sm:gap-0">
            {/* Hero Section */}
            <div className="relative w-full max-w-full sm:max-w-2xl h-72 sm:h-80 bg-zinc-100 rounded-b-lg sm:rounded-b-2xl overflow-hidden mb-4 sm:mb-8">
                {place.image_path ? (
                    <Image
                        src={place.image_path}
                        alt={place.name || place.display_name || 'Preview'}
                        fill
                        className="object-cover w-full h-full"
                        priority
                        sizes="(max-width: 768px) 100vw, 768px"
                        unoptimized={false}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-400 text-3xl sm:text-4xl bg-zinc-200">
                        No Image
                    </div>
                )}
                {/* Overlay for name and tags */}
                <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/70 to-transparent p-4 sm:p-6 flex flex-col gap-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                        <h1 className="text-3xl sm:text-3xl font-bold text-white drop-shadow">{place.name}</h1>
                        {badge && (
                            <span className={`ml-0 sm:ml-2 px-4 py-2 rounded-full text-base font-semibold text-white ${badge.color}`}>{badge.label}</span>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-1">
                        {type && <span className="bg-white/80 text-zinc-800 text-base font-medium rounded px-3 py-2">{type}</span>}
                        {price && <span className="bg-white/80 text-zinc-800 text-base font-medium rounded px-3 py-2">{price}</span>}
                    </div>
                </div>
            </div>

            <div className="flex underline decoration-emerald-600 text-xl sm:text-lg px-4 text-center max-w-xl mb-4">
                You’ve [user preference] — this place is [contrast], but [hook]. Want to give it a spin?
            </div>

            {/* Details Section */}
            <div className="flex flex-col w-full max-w-full sm:max-w-2xl p-4 sm:p-8 gap-8 sm:gap-0">
                <div className="flex flex-col">
                    <div className="mb-6 sm:mb-8 text-lg sm:text-md">
                        This gem was added by {" "}
                        <Link href={`/profiles/${place.user.name}`} className="underline underline-offset-2 decoration-zinc-600">{place.user.name}</Link>
                        {" "} on {" "}
                        <span>
                            {place.created_at ? new Date(place.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : ''}.
                        </span>
                    </div>
                </div>
                <NotesSection
                    notes={notes}
                    place={place}
                    handleAddNote={handleAddNote}
                    handleDeleteNote={handleDeleteNote}
                />
            </div>
        </div>
    );
}
