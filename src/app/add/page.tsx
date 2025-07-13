"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { addPlace } from "./actions";
import Link from "next/link";
import PlaceCard from "../components/PlaceCard";
import { createClient } from '@supabase/supabase-js';

interface GeocodeResult {
    features: Array<{
        properties: {
            name: string;
            label: string;
        };
        geometry: {
            coordinates: [number, number];
        };
    }>;
}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface PlaceData {
    name: string;
    city: string;
    type: string;
    description: string;
    imagePath: string;
    coordinates?: [number, number];
}

export default function AddPlacePage() {
    const [placeData, setPlaceData] = useState<PlaceData>({
        name: "",
        city: "",
        type: "",
        description: "",
        imagePath: ""
    });
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<GeocodeResult['features']>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedPlace, setSelectedPlace] = useState<GeocodeResult['features'][0] | null>(null);
    const [imageUploading, setImageUploading] = useState(false);

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setResult(null);
        setLoading(true);
        const res = await addPlace(placeData.city, placeData.name);
        setLoading(false);
        if (res && !Array.isArray(res) && res.error) {
            setError(typeof res.error === "string" ? res.error : res.error.message);
        } else {
            setResult(res);
            setPlaceData({
                name: "",
                city: "",
                type: "",
                description: "",
                imagePath: ""
            });
        }
    }

    async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setImageUploading(true);
        setError(null);

        try {
            setSelectedFile(file);
            const filePath = `uploads/${Date.now()}_${file.name}`;
            const { data, error } = await supabase.storage.from('images').upload(filePath, file);

            if (error) {
                setError(error.message);
                setSelectedFile(null);
            } else {
                // Get public URL
                const { data: urlData } = supabase.storage.from('images').getPublicUrl(filePath);
                setPlaceData(prev => ({
                    ...prev,
                    imagePath: urlData?.publicUrl || ''
                }));
            }
        } catch (error) {
            setError('Failed to upload image. Please try again.');
            setSelectedFile(null);
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
            const api_key = process.env.NEXT_PUBLIC_GEOCODE_API_KEY;
            const response = await fetch(
                `https://api.geocode.earth/v1/autocomplete?api_key=${api_key}&focus.point.lat=10.8035553&focus.point.lon=106.6976776&text=${encodeURIComponent(query)}`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch places');
            }

            const data: GeocodeResult = await response.json();
            setSearchResults(data.features || []);
        } catch (error) {
            console.error('Error searching places:', error);
            setError('Failed to search places');
        } finally {
            setIsSearching(false);
        }
    }

    function handlePlaceSelect(place: GeocodeResult['features'][0]) {
        setSelectedPlace(place);
        setPlaceData(prev => ({
            ...prev,
            city: place.properties.name
        }));
        setSearchQuery(place.properties.label);
        setSearchResults([]);
    }

    return (
        <div className="flex flex-col items-center justify-center p-8 w-full">
            <div className="w-full max-w-2xl bg-white rounded-xl p-6 flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1">
                    <h1 className="text-2xl font-medium mb-4">Share a gem</h1>

                    <div className="flex-1 flex justify-center">
                        <h1 className="text-xl font-medium mb-4">Preview</h1>

                        <PlaceCard data empty={true} />
                    </div>

                    <form onSubmit={handleAdd} className="flex flex-col gap-4">
                        <div className="flex flex-row gap-8 w-full">
                            <label htmlFor="image-upload" className={`flex flex-col items-center justify-center bg-zinc-100 h-48 min-w-48 rounded-2xl border-2 border-dashed border-zinc-300 transition-colors relative ${imageUploading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-emerald-400'}`}>
                                {imageUploading ? (
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-zinc-300 border-t-zinc-700 mb-2"></div>
                                        <span className="text-zinc-700 text-sm font-medium">Uploading...</span>
                                    </div>
                                ) : placeData.imagePath ? (
                                    <img
                                        src={placeData.imagePath}
                                        alt="Preview"
                                        className="w-48 h-48 object-cover rounded-2xl"
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

                            <div className="flex flex-col w-full relative">
                                <input
                                    type="text"
                                    placeholder="Search for your gem..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        searchPlaces(e.target.value);
                                    }}
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
                                {searchResults.length > 0 && (
                                    <div className="mt-2 bg-white border border-zinc-200 rounded-lg max-h-48 overflow-y-auto z-10 shadow-lg">
                                        {searchResults.map((place, index) => (
                                            <button
                                                key={index}
                                                onClick={() => handlePlaceSelect(place)}
                                                className="w-full text-left p-4 cursor-pointer hover:bg-zinc-50 border-b border-zinc-100 last:border-b-0 transition-colors duration-150"
                                            >
                                                <div className="font-semibold text-zinc-900">{place.properties.name}</div>
                                                <div className="text-sm text-zinc-500 mt-1">{place.properties.label}</div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <input
                                type="text"
                                placeholder="Name"
                                value={placeData.name}
                                onChange={(e) => {
                                    setPlaceData(prev => ({
                                        ...prev,
                                        name: e.target.value
                                    }));
                                }}
                                className="p-2 border border-zinc-300 w-full rounded-lg focus:outline-none focus:ring-2 text-md"
                            />
                            <input
                                type="text"
                                placeholder="Type (e.g., Restaurant, Cafe, Park)"
                                value={placeData.type}
                                onChange={(e) => {
                                    setPlaceData(prev => ({
                                        ...prev,
                                        type: e.target.value
                                    }));
                                }}
                                className="p-2 border border-zinc-300 w-full rounded-lg focus:outline-none focus:ring-2 text-md"
                            />
                            <textarea
                                placeholder="Description"
                                value={placeData.description}
                                onChange={(e) => {
                                    setPlaceData(prev => ({
                                        ...prev,
                                        description: e.target.value
                                    }));
                                }}
                                rows={3}
                                className="p-2 border border-zinc-300 w-full rounded-lg focus:outline-none focus:ring-2 text-md resize-none"
                            />
                        </div>
                        <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 transition-colors font-medium" disabled={loading || imageUploading}>
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