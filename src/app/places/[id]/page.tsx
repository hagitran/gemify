import { getPlaceById, getUserNotesForPlace } from "./actions";
import { notFound } from "next/navigation";
import Image from "next/image";
import supabase from "@/supabaseClient";
import Link from "next/link";

interface PlacePageProps {
    params: { id: string };
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


export default async function PlacePage({ params }: PlacePageProps) {
    const { id } = await params;
    const idNum = Number(id);
    if (isNaN(idNum)) return notFound();

    let place = null;
    let notes = [];
    try {
        // Use force-cache to statically generate data at build time
        const { data: placeData } = await supabase
            .from("places")
            .select("*, user:added_by(name)")
            .eq("id", idNum)
            .single();
        place = placeData;
        console.log(placeData, 'plsd')
        const { data: notesData } = await supabase
            .from("user_notes")
            .select("*, user:user_id(name)")
            .eq("place_id", idNum);
        notes = notesData || [];
    } catch (e) {
        return notFound();
    }
    if (!place) return notFound();

    const badge = getMatchBadge(place.match_score);
    const price = place.price ? '$'.repeat(place.price) : '';
    const type = place.type ? place.type.charAt(0).toUpperCase() + place.type.slice(1) : '';

    console.log(notes, 'notes')

    return (
        <div className="w-full flex flex-col items-center">
            {/* Hero Section */}
            <div className="relative w-full max-w-2xl h-[256px] bg-zinc-100 rounded-b-2xl overflow-hidden mb-6">
                {place.image_path ? (
                    <Image
                        src={place.image_path}
                        alt={place.name || place.displayName || 'Preview'}
                        fill
                        className="object-cover w-full h-full"
                        priority
                        sizes="(max-width: 768px) 100vw, 768px"
                        unoptimized={false}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-400 text-4xl bg-zinc-200">
                        No Image
                    </div>
                )}
                {/* Overlay for name and tags */}
                <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/70 to-transparent p-6 flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold text-white drop-shadow">{place.name}</h1>
                        {badge && (
                            <span className={`ml-2 px-3 py-1 rounded-full text-xs font-semibold text-white ${badge.color}`}>{badge.label}</span>
                        )}
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                        {type && <span className="bg-white/80 text-zinc-800 text-xs font-medium rounded px-2 py-1">{type}</span>}
                        {price && <span className="bg-white/80 text-zinc-800 text-xs font-medium rounded px-2 py-1">{price}</span>}
                    </div>
                </div>
            </div>

            <div className="flex underline decoration-emerald-600">
                You’ve [user preference] — this place is [contrast], but [hook]. Want to give it a spin?
            </div>

            {/* Details Section */}
            <div className="w-full max-w-2xl p-8">
                <div className="flex flex-col">
                    <div className="mb-8">This gem was added by <Link href={`/profiles/${place.user.name}`} className="underline underline-offset-2 decoration-emerald-600">{place.user.name}</Link></div>
                </div>
                <div className="flex justify-end w-full">
                    <div className="px-4 py-2 text-sm text-zinc-700 hover:text-emerald-600 transition-colors text-right cursor-pointer">
                        Add experience
                        <div className="text-xs text-zinc-400">Been here already?</div>
                    </div>
                    <div className="px-4 py-2 text-sm text-zinc-700 hover:text-emerald-600 transition-colors text-right cursor-pointer">
                        Try now
                        <div className="text-xs text-zinc-400">View on map</div>
                    </div>
                </div>
                <h2 className="text-xl font-semibold mb-2">Notes</h2>
                {notes && notes.length > 0 ? (
                    <ul className="space-y-2">
                        {notes.map((note: any) => (
                            <li key={note.id} className="bg-zinc-100 rounded p-3">
                                <div className="text-zinc-700">{note.note}</div>
                                <div className="text-xs text-zinc-500 mt-1">By {note.user?.name || note.user_id}</div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-zinc-400">No notes yet.</div>
                )}
            </div>
        </div>
    );
}
