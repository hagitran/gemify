"use client";
import { useEffect, useState } from "react";
import { addPlace } from "./actions";
import PlaceCard from "../components/PlaceCard";
import { createClient } from '@supabase/supabase-js';

// interface GeocodeResult {
//     features: Array<{
//         properties: {
//             name: string;
//             label: string;
//             source?: string; // Add source for Photon/Nominatim
//         };
//         geometry: {
//             coordinates: [number, number];
//         };
//     }>;
// }

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface PlaceData {
    name: string;
    city: string;
    type: string;
    address: string;
    image_path: string;
    price: number;
    lat?: number;
    long?: number;
    displayName?: string;
    osmId?: string;
    notes: string;
    added_by: string;
    description: string;
}

// Add Nominatim types
interface NominatimProperties {
    addresstype: string;
    category: string;
    display_name: string;
    importance: number;
    label: string;
    name: string;
    osm_id: number;
    osm_type: string;
    place_id: number;
    place_rank: number;
    source: 'nominatim';
    type: string;
    [key: string]: unknown;
}

interface NominatimGeometry {
    type: 'Point';
    coordinates: [number, number];
}

interface NominatimFeature {
    bbox: [number, number, number, number];
    geometry: NominatimGeometry;
    properties: NominatimProperties;
    type: 'Feature';
}

// Photon type (minimal, for union)
interface PhotonProperties {
    name: string;
    label: string;
    source: 'photon';
    [key: string]: unknown;
}
interface PhotonGeometry {
    type: 'Point';
    coordinates: [number, number];
}
interface PhotonFeature {
    geometry: PhotonGeometry;
    properties: PhotonProperties;
    type: 'Feature';
}

type GeocodeFeature = NominatimFeature | PhotonFeature;

// Add type for addPlace result

type AddPlaceResult = PlaceData[] | { error: unknown };

export default function AddPlacePage() {
    const [placeData, setPlaceData] = useState<PlaceData>({
        name: "",
        city: "",
        type: "",
        address: "",
        image_path: "",
        price: 0,
        notes: "",
        added_by: "anon",
        description: "",
    });

    const [result, setResult] = useState<AddPlaceResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<GeocodeFeature[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedPlace, setSelectedPlace] = useState<GeocodeFeature | null>(null);
    const [imageUploading, setImageUploading] = useState(false);

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setResult(null);
        setLoading(true);
        const res: AddPlaceResult = await addPlace(placeData);
        setLoading(false);
        if (res && !Array.isArray(res) && 'error' in res && res.error) {
            setError(typeof res.error === "string" ? res.error : (res.error as Error).message || String(res.error));
        } else {
            setResult(res);
            setPlaceData({
                name: "",
                city: "",
                type: "",
                address: "",
                image_path: "",
                price: 0,
                notes: "",
                description: "",
                added_by: "anon",
            });
            // Invalidate city cache in Home page
            const cityValue = placeData.city === "San Francisco" ? "sf" : "hcmc";
            window.dispatchEvent(new CustomEvent('invalidateCityCache', { detail: { city: cityValue } }));
        }
    }

    async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setImageUploading(true);
        setError(null);

        try {
            const filePath = `uploads/${Date.now()}_${file.name}`;
            const { error } = await supabase.storage.from('images').upload(filePath, file);

            if (error) {
                setError(error.message);
            } else {
                // Get public URL
                const { data: urlData } = supabase.storage.from('images').getPublicUrl(filePath);
                setPlaceData(prev => ({
                    ...prev,
                    image_path: urlData?.publicUrl || ''
                }));
            }
        } catch (error) {
            console.log(error)
            setError('Failed to upload image. Please try again.');
        } finally {
            setImageUploading(false);
        }
    }

    async function searchPlaces(query: string) {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const lat = 10.8035553;
            const lon = 106.6976776;
            const limit = 5;
            // Photon API
            const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lat=${lat}&lon=${lon}&limit=${limit}`;
            // Nominatim API
            const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=geojson&q=${encodeURIComponent(query)}&limit=${limit}`;

            // Fetch both in parallel
            const [photonRes, nominatimRes] = await Promise.all([
                fetch(photonUrl),
                fetch(nominatimUrl)
            ]);

            if (!photonRes.ok && !nominatimRes.ok) {
                throw new Error('Failed to fetch places');
            }

            const photonData: { features: PhotonFeature[] } = photonRes.ok ? await photonRes.json() : { features: [] };
            const nominatimData: { features: NominatimFeature[] } = nominatimRes.ok ? await nominatimRes.json() : { features: [] };

            // Normalize Nominatim results to match Photon structure
            const nominatimFeatures: NominatimFeature[] = (nominatimData.features || []).map((f) => ({
                ...f,
                properties: {
                    ...f.properties,
                    label: f.properties.display_name,
                    name: f.properties.display_name?.split(",")[0] || f.properties.display_name,
                    source: "nominatim"
                }
            }));

            const photonFeatures: PhotonFeature[] = (photonData.features || []).map((f) => ({
                ...f,
                properties: {
                    ...f.properties,
                    source: "photon"
                }
            }));

            setSearchResults([...nominatimFeatures, ...photonFeatures]);
        } catch (error) {
            console.error('Error searching places:', error);
            setError('Failed to search places');
        } finally {
            setIsSearching(false);
        }
    }

    function handlePlaceSelect(place: GeocodeFeature) {
        const isNominatim = place.properties.source === "nominatim";
        const [long, lat] = place.geometry.coordinates;
        setSelectedPlace(place);
        setPlaceData(prev => ({
            ...prev,
            name: place.properties.name || prev.name,
            address: isNominatim
                ? (place.properties as NominatimProperties).display_name || prev.address
                : (place.properties as PhotonProperties).street ? String((place.properties as PhotonProperties).street) : prev.address,
            city: isNominatim
                ? ((place.properties as NominatimProperties).display_name?.split(",").slice(-4, -3)[0]?.trim() || prev.city)
                : (place.properties as PhotonProperties).locality ? String((place.properties as PhotonProperties).locality) : prev.city,
            displayName: place.properties.label || prev.displayName,
            osmId: isNominatim
                ? ((place.properties as NominatimProperties).osm_id !== undefined ? String((place.properties as NominatimProperties).osm_id) : prev.osmId)
                : ((place.properties as PhotonProperties).id !== undefined ? String((place.properties as PhotonProperties).id) : prev.osmId),
            type: isNominatim
                ? (place.properties as NominatimProperties).type || (place.properties as NominatimProperties).category || prev.type
                : prev.type,
            lat: lat ?? prev.lat,
            long: long ?? prev.long,
        }));
        setSearchQuery(place.properties.label || '');
        setSearchResults([]);
    }

    // Add a handler for price selection
    function handlePriceSelect(price: number) {
        setPlaceData(prev => ({ ...prev, price }));
    }

    // Debounced search effect
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }
        const handler = setTimeout(() => {
            searchPlaces(searchQuery);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    return (
        <div className="flex flex-1 w-full h-full flex-col">
            <div className="flex flex-row w-full h-full flex-1 mx-auto">
                {/* Preview Side */}
                <div className="flex flex-col items-center justify-center flex-1 bg-zinc-50 h-full">
                    <h1 className="text-xl font-medium mb-4">Preview</h1>
                    <div className="flex items-center justify-center min-h-[400px] min-w-[320px]">
                        <PlaceCard data={placeData} />
                    </div>
                </div>
                {/* Form Side */}
                <div className="flex-1 flex-col bg-white h-full p-8">
                    {/* Tab Bar (only on form side) */}
                    <div className="flex flex-row w-full mb-2 border-b border-zinc-200">
                        <button
                            className="px-6 py-2 text-md font-medium border-b-2 border-emerald-500 text-emerald-700 focus:outline-none"
                            disabled
                        >
                            Form
                        </button>
                        <button
                            className="px-6 py-2 text-md font-medium text-zinc-400 border-b-2 border-transparent cursor-not-allowed ml-2"
                            disabled
                        >
                            Conversational <span className="ml-2 text-xs text-zinc-400">(Coming soon)</span>
                        </button>
                    </div>
                    <h1 className="text-2xl font-medium py-6">Share a gem</h1>
                    <form onSubmit={handleAdd} className="flex flex-col gap-12 w-full">
                        {/* Geocode search */}
                        <div className="flex flex-col w-full relative">
                            <label htmlFor="geocode-search" className="block text-sm font-medium text-gray-700">
                                Search
                            </label>
                            <input
                                id="geocode-search"
                                type="text"
                                placeholder="Search for a place and we'll fill the rest!"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="p-2 border border-zinc-300 w-full rounded-lg focus:outline-none focus:ring-2 text-md"
                            />
                            {isSearching && (
                                <div className="absolute top-full left-0 right-0 bg-white border border-zinc-200 rounded-xl mt-2 p-4 text-center text-zinc-500 shadow-lg">
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2"></div>
                                        Searching...
                                    </div>
                                </div>
                            )}
                            {(searchResults.length > 0 && !selectedPlace) && (
                                <div className="absolute mt-12 bg-white border border-zinc-200 rounded-lg max-h-48 overflow-y-auto z-10 shadow-lg">
                                    {searchResults.map((place, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handlePlaceSelect(place)}
                                            className="w-full text-left p-4 cursor-pointer hover:bg-zinc-50 border-b border-zinc-100 last:border-b-0 transition-colors duration-150"
                                        >
                                            <div className="font-semibold text-zinc-900">{place.properties.name}</div>
                                            <div className="text-sm text-zinc-500 mt-1">{place.properties.label}</div>
                                            <div className="text-xs text-emerald-500 mt-1">{place.properties.source === "photon" ? "Photon" : "Nominatim"}</div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        {/* Image upload */}
                        <div className="flex flex-row gap-8">
                            <div className="flex flex-col">
                                <label htmlFor="image-upload" className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                                <label htmlFor="image-upload" className={`flex flex-col items-center justify-center bg-zinc-100 h-64 w-64 rounded-2xl border-2 border-dashed border-zinc-300 transition-colors relative ${imageUploading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-emerald-400'}`}>
                                    {imageUploading ? (
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-zinc-300 border-t-zinc-700"></div>
                                            <span className="text-zinc-700 text-sm font-medium">Uploading...</span>
                                        </div>
                                    ) : placeData.image_path ? (
                                        <img
                                            src={placeData.image_path}
                                            alt="Preview"
                                            className="w-64 h-64 object-cover rounded-2xl"
                                        />
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-zinc-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-4m0 0V8m0 4h4m-4 0H8m12 4v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4" />
                                            </svg>
                                            <span className="text-zinc-500 text-sm font-medium">Add image</span>
                                        </>
                                    )}
                                    <input
                                        id="image-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleImageUpload}
                                        disabled={imageUploading}
                                    />
                                </label>
                            </div>

                            <div className="flex flex-col gap-4 w-full">
                                <div className="flex flex-col">
                                    <label htmlFor="place-name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                    <input
                                        id="place-name"
                                        type="text"
                                        placeholder="Name"
                                        value={placeData.name}
                                        onChange={(e) => setPlaceData(prev => ({ ...prev, name: e.target.value }))}
                                        className="p-2 border border-zinc-300 w-full rounded-lg focus:outline-none focus:ring-2 text-md"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label htmlFor="place-type" className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <select
                                        id="place-type"
                                        value={placeData.type}
                                        onChange={(e) => setPlaceData(prev => ({ ...prev, type: e.target.value }))}
                                        className="p-2 border border-zinc-300 w-full rounded-lg focus:outline-none focus:ring-2 text-md"
                                    >
                                        <option value="">Select a type</option>
                                        <option value="food">Food</option>
                                        <option value="cafe">Cafe</option>
                                        <option value="experience">Experience</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div className="flex flex-col">
                                    <label htmlFor="place-address" className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                    <input
                                        id="place-address"
                                        type="text"
                                        placeholder="Address"
                                        value={placeData.address}
                                        onChange={(e) => setPlaceData(prev => ({ ...prev, address: e.target.value }))}
                                        className="p-2 border border-zinc-300 w-full rounded-lg focus:outline-none focus:ring-2 text-md"
                                    />
                                </div>
                                <div className="flex flex-row gap-8">
                                    {/* Price input as 3 clickable dollar signs */}
                                    <div className="flex flex-col">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                                        <div className="flex items-center gap-2">
                                            {[1, 2, 3].map((dollar) => (
                                                <button
                                                    type="button"
                                                    key={dollar}
                                                    onClick={() => handlePriceSelect(dollar)}
                                                    className={`text-2xl transition-colors ${placeData.price >= dollar ? 'text-emerald-500' : 'text-zinc-300'}`}
                                                    aria-label={`Set price to ${dollar}`}
                                                >
                                                    $
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex flex-col w-full">
                                        <label htmlFor="place-notes" className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                        <textarea
                                            id="place-notes"
                                            placeholder="What would you do here? "
                                            value={placeData.notes}
                                            onChange={(e) => setPlaceData(prev => ({ ...prev, notes: e.target.value }))}
                                            rows={2}
                                            className="p-2 border border-zinc-300 w-full rounded-lg focus:outline-none focus:ring-2 text-md resize-none"
                                        />
                                    </div>
                                </div>

                            </div>
                        </div>
                        <button type="submit" className="bg-emerald-600 cursor-pointer text-white px-4 py-2 rounded hover:bg-emerald-700 transition-colors font-medium mt-4" disabled={loading || imageUploading}>
                            {loading ? "Adding..." : imageUploading ? "Uploading image..." : "Add Place"}
                        </button>
                        {result && <span className="text-green-600">Added!</span>}
                        {error && <span className="text-red-600">{error}</span>}
                    </form>
                </div>
            </div>
        </div>
    );
} 