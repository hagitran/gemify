"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { addPlace } from "./actions";
import PlaceCard from "../components/PlaceCard";
import { createClient } from '@supabase/supabase-js';
import { authClient } from "../lib/auth-client";
import confetti from "canvas-confetti";
import Image from "next/image";
import { useCityRoot } from "../CityRootContext";
import { useRouter } from "next/navigation";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface PlaceData {
    id: string;
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
    ambiance: string[]; // now an array
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

type AddPlaceResult = PlaceData[] | { error: unknown };

const MAX_RECENT_QUERIES = 5;

interface SessionUser {
    id: string;
    name: string;
    email: string;
    preferredCity?: string;
    // ...other fields as needed
}

const AMBIANCE_OPTIONS = [
    { value: "cozy", label: "Cozy" },
    { value: "lively", label: "Lively" },
    { value: "work-friendly", label: "Work-Friendly" },
    { value: "trendy", label: "Trendy" },
    { value: "traditional", label: "Traditional" },
    { value: "romantic", label: "Romantic" },
];

export default function AddPlacePage() {
    const { city: preferredCity, setCity: setPreferredCity } = useCityRoot();
    const { data: session } = authClient.useSession();
    const router = useRouter();
    const [placeData, setPlaceData] = useState<PlaceData>({
        id: "",
        name: "",
        city: "",
        type: "",
        address: "",
        image_path: "",
        price: 0,
        notes: "",
        added_by: "anon",
        description: "",
        ambiance: [], // now an array
    });
    const [result, setResult] = useState<AddPlaceResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<NominatimFeature[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedPlace, setSelectedPlace] = useState<NominatimFeature | null>(null);
    const [imageUploading, setImageUploading] = useState(false);
    const [recentQueries, setRecentQueries] = useState<string[]>([]);
    const [inputFocused, setInputFocused] = useState(false);
    const [ambianceDropdownOpen, setAmbianceDropdownOpen] = useState(false);
    const ambianceDropdownRef = useRef<HTMLDivElement>(null);

    // Add to recent queries
    const addRecentQuery = useCallback((query: string) => {
        setRecentQueries(prev => {
            const filtered = prev.filter(q => q !== query);
            return [query, ...filtered].slice(0, MAX_RECENT_QUERIES);
        });
    }, []);

    // Fetch city from IP-based geolocation API on mount
    useEffect(() => {
        fetch('/api/geo')
            .then(res => res.json())
            .then(data => {
                if (data.city) setPreferredCity(data.city);
            });
    }, []);

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setResult(null);
        setLoading(true);
        const res: AddPlaceResult = await addPlace({
            ...placeData,
            added_by: session?.user?.id || "anon",
            ambiance: placeData.ambiance,
        });
        setLoading(false);
        if (res && !Array.isArray(res) && 'error' in res && res.error) {
            setError(typeof res.error === "string" ? res.error : (res.error as Error).message || String(res.error));
        } else if (res && Array.isArray(res) && res[0]?.id) {
            // Trigger confetti before redirect
            confetti({
                particleCount: 120,
                spread: 80,
                origin: { y: 0.7 },
            });
            setTimeout(() => {
                router.push(`/places/${res[0].id}`);
            }, 800); // allow confetti to show for a moment
        } else {
            setResult(res);
            setPlaceData({
                id: "",
                name: "",
                city: preferredCity,
                type: "",
                address: "",
                image_path: "",
                price: 0,
                notes: "",
                description: "",
                added_by: "anon",
                ambiance: [],
            });
            setSearchQuery("");
            setSelectedPlace(null);
            setSearchResults([]);
            // Invalidate city cache in Home page
            const cityValue = preferredCity
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

    const searchPlaces = useCallback(async (query: string) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        addRecentQuery(query);

        const limit = 5;
        const cityCoords: Record<string, { lat: number; lon: number }> = {
            hcmc: { lat: 10.7769, lon: 106.7009 },
            sf: { lat: 37.7749, lon: -122.4194 },
        };

        let cityKey = preferredCity || 'sf';
        const user = session?.user as SessionUser | undefined;
        if (user?.preferredCity) {
            cityKey = user.preferredCity;
        }
        const coords = cityCoords[cityKey] || cityCoords['sf'];

        const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=geojson&q=${encodeURIComponent(query)}&limit=${limit}&lat=${coords.lat}&lon=${coords.lon}`;
        console.log(nominatimUrl, 'so')

        try {
            const res = await fetch(nominatimUrl);
            if (!res.ok) throw new Error('Failed to fetch places');
            const data: { features: NominatimFeature[] } = await res.json();
            const nominatimResults: NominatimFeature[] = (data.features || []).map((f) => ({
                ...f,
                properties: {
                    ...f.properties,
                    label: f.properties.display_name,
                    name: f.properties.display_name?.split(",")[0] || f.properties.display_name,
                    source: "nominatim" as const
                }
            }));
            setSearchResults(nominatimResults);
        } catch (error) {
            console.log(error)
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    }, [session, addRecentQuery, preferredCity]);

    function handlePlaceSelect(place: NominatimFeature) {
        const [long, lat] = place.geometry.coordinates;
        setSelectedPlace(place);
        setPlaceData(prev => ({
            ...prev,
            name: place.properties.name || prev.name,
            address: (place.properties as NominatimProperties).display_name || prev.address,
            city: ((place.properties as NominatimProperties).display_name?.split(",").slice(-4, -3)[0]?.trim() || prev.city),
            displayName: place.properties.label || prev.displayName,
            osmId: String((place.properties as NominatimProperties).osm_id),
            type: (place.properties as NominatimProperties).type || (place.properties as NominatimProperties).category || prev.type,
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

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (ambianceDropdownRef.current && !ambianceDropdownRef.current.contains(event.target as Node)) {
                setAmbianceDropdownOpen(false);
            }
        }
        if (ambianceDropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [ambianceDropdownOpen]);

    function toggleAmbianceOption(option: string) {
        setPlaceData(prev => {
            const selected = prev.ambiance.includes(option)
                ? prev.ambiance.filter(a => a !== option)
                : [...prev.ambiance, option];
            return { ...prev, ambiance: selected };
        });
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
    }, [searchQuery, searchPlaces]);

    useEffect(() => {
        if (result && !('error' in result)) {
            confetti({
                particleCount: 120,
                spread: 80,
                origin: { y: 0.7 },
            });
        }
    }, [result]);

    return (
        <div className="flex flex-1 w-full h-full flex-col">
            <div className="flex flex-col md:flex-row w-full h-full flex-1 mx-auto">
                {/* Preview Side */}
                <div className="flex flex-col items-center justify-center w-full md:flex-1 bg-zinc-50 min-h-full p-4 md:p-0">
                    <h1 className="text-xl font-medium mb-4">Preview</h1>
                    <div className="flex items-center justify-center min-h-[300px] min-w-[220px] md:min-h-[400px] md:min-w-[320px]">
                        <PlaceCard data={placeData} />
                    </div>
                </div>
                {/* Form Side */}
                <div className="w-full md:flex-1 flex-col bg-white h-full p-4 md:py-2">
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
                    <div className="flex flex-row items-center justify-between">
                        <h1 className="flex text-2xl font-medium py-6">Share a gem</h1>
                        <div className="flex flex-col min-h-0">
                            {/* <span className="text-md font-medium text-zinc-700">Where abouts?</span> */}
                            <select
                                className="rounded-md bg-white focus:border-emerald-500 py-2 focus:outline-none text-zinc-700 text-sm"
                                value={preferredCity}
                                onChange={(e) => setPreferredCity(e.target.value)}
                            >
                                <option value="sf">San Francisco</option>
                                <option value="hcmc">Ho Chi Minh City</option>
                            </select>
                        </div>                    </div>
                    <form onSubmit={handleAdd} className="flex flex-col gap-6 w-full">
                        {/* Geocode search */}
                        <div className="flex flex-col w-full relative">
                            <label htmlFor="geocode-search" className="block text-sm font-medium text-gray-700">
                                Search
                            </label>
                            <input
                                id="geocode-search"
                                type="text"
                                placeholder="Search for a place&apos;s name and we&apos;ll autofill the details."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="p-2 border border-zinc-300 w-full rounded-lg focus:outline-none focus:ring-2 text-md underline underline-offset-2 decoration-emerald-600"
                                autoComplete="off"
                                onFocus={() => setInputFocused(true)}
                                onBlur={() => setTimeout(() => setInputFocused(false), 100)}
                            />
                            {/* Recent queries dropdown */}
                            {recentQueries.length > 0 && !searchQuery && (
                                <div className="absolute mt-12 bg-white border border-zinc-200 rounded-lg max-h-48 overflow-y-auto z-10 shadow-lg">
                                    {recentQueries.map((q) => (
                                        <button
                                            key={q}
                                            onClick={() => setSearchQuery(q)}
                                            className="w-full text-left p-4 cursor-pointer hover:bg-zinc-50 border-b border-zinc-100 last:border-b-0 transition-colors duration-150"
                                        >
                                            <span className="font-semibold text-zinc-900">{q}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {(isSearching && !selectedPlace) && (
                                <div className="absolute top-full left-0 right-0 z-10 bg-white border border-zinc-200 rounded-xl mt-2 p-4 text-center text-zinc-500 shadow-lg">
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2"></div>
                                        Searching...
                                    </div>
                                </div>
                            )}
                            {(searchResults.length > 0 && inputFocused) && (
                                <div className="absolute top-full left-0 right-0 bg-white border border-zinc-200 rounded-xl mt-2 p-2 text-center max-h-56 z-10 overflow-y-auto text-zinc-500 shadow-lg">
                                    {/* <div className="absolute mt-12 bg-white border border-zinc-200 rounded-lg max-h-48 overflow-y-auto z-10 shadow-lg"> */}
                                    {searchResults.map((place, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handlePlaceSelect(place)}
                                            className="w-full text-left p-4 cursor-pointer hover:bg-zinc-50 border-b border-zinc-100 last:border-b-0 transition-colors duration-150"
                                        >
                                            <div className="font-semibold text-zinc-900">{place.properties.name}</div>
                                            <div className="text-sm text-zinc-500 mt-1">{place.properties.label}</div>
                                            <div className="text-xs text-emerald-500 mt-1">Nominatim</div>
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
                                        <Image
                                            src={placeData.image_path}
                                            fill
                                            alt="Preview"
                                            className="w-64 h-64 object-cover rounded-2xl"
                                        />
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-zinc-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-4m0 0V8m0 4h4m-4 0H8m12 4v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4" />
                                            </svg>
                                            <span className="text-zinc-500 text-sm font-medium">Add image</span>
                                            <span className="text-zinc-500 text-xs">Only JPG and PNG</span>

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
                                        required
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label htmlFor="place-type" className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <select
                                        id="place-type"
                                        value={placeData.type}
                                        onChange={(e) => setPlaceData(prev => ({ ...prev, type: e.target.value }))}
                                        className="p-2 border border-zinc-300 w-full rounded-lg focus:outline-none focus:ring-2 text-md"
                                        required
                                    >
                                        <option value="">Is it a cafe, restaurant or experience?</option>
                                        <option value="food">Food</option>
                                        <option value="cafe">Cafe</option>
                                        <option value="experience">Experience</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div className="flex flex-col">
                                    <label htmlFor="place-ambiance" className="block text-sm font-medium text-gray-700 mb-1">Ambiance</label>
                                    <div className="relative" ref={ambianceDropdownRef}>
                                        <button
                                            type="button"
                                            className="p-2 border border-zinc-300 w-full rounded-lg focus:outline-none focus:ring-2 text-md bg-white flex justify-between items-center"
                                            onClick={() => setAmbianceDropdownOpen(open => !open)}
                                            id="place-ambiance"
                                        >
                                            {placeData.ambiance.length > 0
                                                ? placeData.ambiance.map(val => AMBIANCE_OPTIONS.find(o => o.value === val)?.label).join(", ")
                                                : "Select ambiance..."}
                                            <svg className={`w-4 h-4 ml-2 transition-transform ${ambianceDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                        </button>
                                        {ambianceDropdownOpen && (
                                            <div className="absolute z-10 mt-1 w-full bg-white border border-zinc-200 rounded shadow-lg max-h-60 overflow-y-auto">
                                                {AMBIANCE_OPTIONS.map(option => (
                                                    <label key={option.value} className="flex items-center px-4 py-2 cursor-pointer hover:bg-zinc-50">
                                                        <input
                                                            type="checkbox"
                                                            checked={placeData.ambiance.includes(option.value)}
                                                            onChange={() => toggleAmbianceOption(option.value)}
                                                            className="mr-2 accent-emerald-600"
                                                        />
                                                        {option.label}
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </div>
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
                                        required
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
                                        <label htmlFor="place-notes" className="block text-sm font-medium text-gray-700 mb-1">{(placeData.type == 'experience') ? "What would you do here?" : "What's your go to here?"}</label>
                                        <textarea
                                            id="place-notes"
                                            placeholder="What would you do here? "
                                            value={placeData.notes}
                                            onChange={(e) => setPlaceData(prev => ({ ...prev, notes: e.target.value }))}
                                            rows={2}
                                            className="p-2 border border-zinc-300 w-full rounded-lg focus:outline-none focus:ring-2 text-md resize-none"
                                            required
                                        />
                                    </div>
                                </div>

                            </div>
                        </div>
                        <button type="submit" className="bg-emerald-600 cursor-pointer text-white px-4 py-2 rounded hover:bg-emerald-700 transition-colors font-medium mt-4" disabled={loading || imageUploading}>
                            {loading ? "Adding..." : imageUploading ? "Uploading image..." : "Add Place"}
                        </button>
                        {error && (
                            <span className="text-red-600 block mt-2">{error}</span>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
} 