"use client";
import { useState } from "react";
import { addPlace } from "./actions";
import Link from "next/link";

export default function AddPlacePage() {
    const [name, setName] = useState("");
    const [city, setCity] = useState("");
    const [type, setType] = useState("");
    const [imagePath, setImagePath] = useState("");
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setResult(null);
        setLoading(true);
        const res = await addPlace(city, name);
        setLoading(false);
        if (res && !Array.isArray(res) && res.error) {
            setError(typeof res.error === "string" ? res.error : res.error.message);
        } else {
            setResult(res);
            setName("");
            setCity("");
            setType("");
            setImagePath("");
        }
    }

    return (
        <div className="flex flex-col items-center justify-center p-8 w-full">
            <div className="w-full max-w-md bg-white rounded-xl shadow p-6">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold text-emerald-700">Add a Place</h1>
                </div>
                <form onSubmit={handleAdd} className="flex flex-col gap-4">
                    <input
                        className="border rounded px-3 py-2"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Place name"
                        required
                    />
                    <input
                        className="border rounded px-3 py-2"
                        value={city}
                        onChange={e => setCity(e.target.value)}
                        placeholder="City"
                        required
                    />
                    <input
                        className="border rounded px-3 py-2"
                        value={type}
                        onChange={e => setType(e.target.value)}
                        placeholder="Type (e.g. foodie, scenic)"
                    />
                    <input
                        className="border rounded px-3 py-2"
                        value={imagePath}
                        onChange={e => setImagePath(e.target.value)}
                        placeholder="Image path (optional)"
                    />
                    <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 transition-colors font-medium" disabled={loading}>
                        {loading ? "Adding..." : "Add Place"}
                    </button>
                    {result && <span className="text-green-600">Added!</span>}
                    {error && <span className="text-red-600">{error}</span>}
                </form>
            </div>
        </div>
    );
} 