import { notFound } from "next/navigation";
import Image from "next/image";
import supabase from "@/supabaseClient";
import Link from "next/link";

export const revalidate = 60; // ISR: revalidate every 60 seconds

export async function generateStaticParams() {
    // Fetch all place IDs for static generation
    const { data, error } = await supabase.from("places").select("id");
    if (error || !data) return [];
    return data.map((place: { id: number }) => ({ id: place.id.toString() }));
}
type Params = Promise<{ id: string }>;
// Add a minimal Place type for this file
interface Place {
    id: number;
    name: string;
    image_path?: string;
    city?: string;
    type?: string;
    price?: number;
    display_name?: string;
}
export default async function ItineraryPage({ params }: { params: Params }) {
    const { id } = await params;
    const idNum = Number(id);
    if (isNaN(idNum)) return notFound();

    // Fetch itinerary
    const { data: itinerary, error: itineraryError } = await supabase
        .from("itineraries")
        .select("id, name, description, created_by, created_at")
        .eq("id", idNum)
        .single();
    if (itineraryError || !itinerary) return notFound();

    // Fetch all places in this itinerary
    const { data: itineraryPlaces, error: placesError } = await supabase
        .from("itinerary_places")
        .select("place_id")
        .eq("itinerary_id", idNum);
    if (placesError) return notFound();
    const placeIds: number[] = (itineraryPlaces || []).map((ip: any) => ip.place_id);

    let places: Place[] = [];
    if (placeIds.length > 0) {
        const { data: placesData } = await supabase
            .from("places")
            .select("id, name, image_path, city, type, price, display_name")
            .in("id", placeIds);
        places = (placesData as Place[]) || [];
    }

    return (
        <div className="w-full flex flex-col items-center overflow-x-hidden px-0 gap-4 sm:gap-0">
            <div className="w-full max-w-2xl mx-auto p-6 flex flex-col gap-4">
                <h1 className="text-3xl font-bold mb-2">{itinerary.name}</h1>
                {itinerary.description && (
                    <div className="text-zinc-600 mb-4">{itinerary.description}</div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
                    {places.length === 0 ? (
                        <div className="col-span-full text-zinc-400 text-center">No places in this itinerary yet.</div>
                    ) : (
                        places.map((place: Place) => (
                            <Link key={place.id} href={`/places/${place.id}`} className="block bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden">
                                <div className="relative w-full h-48 bg-zinc-100">
                                    {place.image_path ? (
                                        <Image
                                            src={place.image_path}
                                            alt={place.name || place.display_name || 'Preview'}
                                            fill
                                            className="object-cover w-full h-full"
                                            sizes="(max-width: 768px) 100vw, 768px"
                                            unoptimized={false}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-zinc-400 text-3xl bg-zinc-200">
                                            No Image
                                        </div>
                                    )}
                                </div>
                                <div className="p-4 flex flex-col gap-2">
                                    <div className="text-lg font-semibold text-zinc-900">{place.name}</div>
                                    {place.city && <div className="text-sm text-zinc-500">{place.city}</div>}
                                    {place.type && <div className="text-xs text-zinc-400">{place.type}</div>}
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
