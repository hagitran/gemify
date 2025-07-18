"use client";
import { useEffect, useState } from "react";
import supabase from "@/supabaseClient";
import Link from "next/link";

export default function ListsPage() {
    const [lists, setLists] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase
            .from("lists")
            .select("id, name, description, created_by, created_at")
            .order("created_at", { ascending: false })
            .then(({ data }) => {
                setLists(data || []);
                setLoading(false);
            });
    }, []);

    if (loading) return <div>Loading...</div>;

    return (
        <div className="max-w-2xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4">All Lists</h1>
            {lists.length === 0 ? (
                <div className="text-zinc-400">No lists found.</div>
            ) : (
                <ul className="space-y-4">
                    {lists.map(list => (
                        <li key={list.id} className="border rounded p-4 bg-white">
                            <Link href={`/gemlists/${list.id}`} className="font-semibold hover:underline">
                                {list.name}
                            </Link>
                            {list.description && <div className="text-zinc-500">{list.description}</div>}
                            <div className="text-xs text-zinc-400 mt-1">Created by: {list.created_by || "Unknown"}</div>
                            <div className="text-xs text-zinc-400">Created at: {new Date(list.created_at).toLocaleString()}</div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
} 