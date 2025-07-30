import { notFound } from "next/navigation";
import Image from "next/image";
import supabase from "@/supabaseClient";
import Link from "next/link";
import { addReview, deleteReview } from "../actions";
import ReviewSection from "./ReviewSection";
import { revalidatePath } from "next/cache";
import DeletePlaceButton from "./DeletePlaceButton";
import ViewInteractionLogger from "./ViewInteractionLogger";
import PlacePersonalizationBanner from "./PlacePersonalizationBanner";
import { Place, RawNote, Note, MatchBadge } from "../types";

function getMatchBadge(score?: number): MatchBadge | null {
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
export default async function PlacePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const idNum = Number(id);
    if (isNaN(idNum)) return notFound();



    let place: Place | null = null;
    let notes: Note[] = [];
    let viewCount = 0;
    // let triedCount = 0;
    try {

        const { data: placeData } = await supabase
            .from("places")
            .select("*, user:added_by(name)")
            .eq("id", idNum)
            .single();
        place = placeData;
        // Update view count
        if (place) {
            await supabase.from("places").update({ view_count: (place.view_count || 0) + 1 }).eq("id", idNum);
        }
        const { data: notesData } = await supabase
            .from("user_reviews")
            .select("id, note, user_id, image_path, user:user_id(name), tried, recommended_item, price, ambiance, place_id, created_at")
            .eq("place_id", idNum)
        notes = (notesData || []).map((n: RawNote) => ({
            id: n.id,
            note: n.note,
            user_id: n.user_id,
            image_path: n.image_path,
            user: Array.isArray(n.user) ? n.user[0] : n.user,
            tried: n.tried,
            recommended_item: n.recommended_item,
            price: n.price,
            ambiance: n.ambiance,
            place_id: n.place_id,
            created_at: n.created_at
        })) as Note[];
        // Fetch viewCount from place (already loaded above)
        viewCount = place?.view_count || 0;
    } catch (e) {
        console.log(e)
        return notFound();
    }
    if (!place) return notFound();

    // Record the view (server action)


    const badge = getMatchBadge(place.match_score);
    const price = place.price ? '$'.repeat(place.price) : '';
    const type = place.type ? place.type.charAt(0).toUpperCase() + place.type.slice(1) : '';

    // Server action for note submission
    async function handleAddNote(formData: FormData) {
        "use server";
        const noteText = formData.get("note") as string;
        const user_id = formData.get("user_id") as string || "anon";
        const image_path = formData.get("image_path") as string;
        const ambiance = formData.get("ambiance") as string | null;
        const price = formData.get("price") as string | null;
        const tried = formData.get("tried") === "true";
        const recommended_item = formData.get("recommended_item") as string | null;

        console.log(formData, 'formdata!!')
        console.log({ noteText, user_id, image_path, ambiance, price, tried, recommended_item, place_id: place!.id });
        await addReview({
            place_id: place!.id,
            user_id,
            note: noteText,
            image_path,
            ambiance: ambiance,
            // || (place!.ambiance ? (Array.isArray(place!.ambiance) ? place!.ambiance.join(",") : place!.ambiance) : null),
            price: Number(price),
            // ? Number(price) : (place!.price ?? null),
            tried,
            recommended_item,
        });
        revalidatePath(`/places/${place!.id}`);
    }

    async function handleDeleteNote(noteId: number) {
        "use server";
        await deleteReview(noteId);
        revalidatePath(`/places/${place?.id}`);
    }

    // Always use the original upload version for the place detail page
    let imageUrl = place.image_path;
    if (imageUrl && imageUrl.includes('/thumbnails/')) {
        imageUrl = imageUrl.replace('/thumbnails/', '/uploads/');
    }

    return (
        <>
            <ViewInteractionLogger placeId={idNum} />
            <div className="w-full flex flex-col items-center overflow-x-hidden px-0 gap-4 sm:gap-0">
                {/* Hero Section */}
                <div className="relative w-full max-w-full sm:max-w-2xl h-72 sm:h-80 bg-zinc-100 rounded-b-lg sm:rounded-b-2xl overflow-hidden mb-4 sm:mb-8">
                    {imageUrl ? (
                        <Image
                            src={imageUrl}
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

                    <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/70 to-transparent p-4 sm:p-6 flex flex-col gap-3">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                            <div className="flex gap-3">
                                <h1 className="text-3xl sm:text-3xl font-bold text-white drop-shadow">{place.name}</h1>
                                <DeletePlaceButton placeId={place.id} addedBy={place.added_by} />
                            </div>
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

                <PlacePersonalizationBanner place={place} />

                {/* Details Section */}
                <div className="flex flex-col w-full max-w-full sm:max-w-2xl p-4 sm:p-8 gap-8 sm:gap-0">
                    <div className="flex flex-col">
                        <div className="mb-6 sm:mb-8 text-lg sm:text-md flex flex-row justify-between">
                            <div>
                                This gem was added by {" "}
                                <Link href={`/profiles/${place.user.name}`} className="underline underline-offset-2 decoration-zinc-600">{place.user.name}</Link>
                                {" "} on {" "}
                                <span>
                                    {place.created_at ? new Date(place.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : ''}.
                                </span>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <div className="text-zinc-500 text-base">
                                    {viewCount + 1} {(viewCount + 1) === 1 ? 'view' : 'views'}
                                </div>
                                {/* <div className="text-zinc-500 text-base">
                                {triedCount > 0 ? (
                                    <>{triedCount} {triedCount === 1 ? 'person has' : 'people have'} tried</>
                                ) : (
                                    <span className="italic">Be the first to try!</span>
                                )}
                            </div> */}
                            </div>
                        </div>

                    </div>
                    <ReviewSection
                        notes={notes}
                        place={place}
                        handleAddNote={handleAddNote}
                        handleDeleteNote={handleDeleteNote}
                    />
                </div>
            </div>
        </>
    );
}
