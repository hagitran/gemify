"use client";
import { useEffect, useState } from "react";
import supabase from "@/supabaseClient";
import Link from "next/link";
import { SelectList } from "@/db/schema";

export default function ListsPage() {
    const [lists, setLists] = useState<SelectList[]>([]);
    const [trendingLists, setTrendingLists] = useState<SelectList[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase
            .from("lists")
            .select("id, name, description, created_by, created_at, karma, verified")
            .order('created_at', { ascending: false })
            .then(({ data }) => {
                const mapped = (data || []).map((l: any) => ({
                    id: l.id,
                    name: l.name,
                    description: l.description ?? null,
                    createdAt: l.created_at ? new Date(l.created_at) : new Date(0),
                    karma: l.karma ?? null,
                    verified: typeof l.verified === 'boolean' ? l.verified : null,
                    createdBy: l.created_by ?? null,
                }));
                setLists(mapped);
                setTrendingLists([...mapped].sort((a, b) => (b.karma || 0) - (a.karma || 0)));
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="p-8 text-center">Loading lists...</div>;

    return (
        <div className="max-w-2xl mx-auto p-6">
            <div className="flex flex-row gap-8">
                <div className="flex-1">
                    <h1 className="text-3xl font-bold mb-6">New Lists</h1>
                    {lists.length === 0 ? (
                        <div className="text-zinc-400">No lists found.</div>
                    ) : (
                        <ul className="space-y-4">
                            {lists.map(list => (
                                <li key={list.id} className="border rounded p-4 bg-white">
                                    <Link href={`/lists/${list.id}`} className="font-semibold hover:underline text-lg">
                                        {list.name}
                                    </Link>
                                    {list.description && <div className="text-zinc-500 mt-1">{list.description}</div>}
                                    <div className="text-xs text-zinc-400 mt-2">Created by: {list.createdBy || "Unknown"}</div>
                                    <div className="text-xs text-zinc-400">Created at: {list.createdAt ? list.createdAt.toLocaleString() : ""}</div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold mb-6">Trending Lists</h1>
                    {trendingLists.length === 0 ? (
                        <div className="text-zinc-400">No lists found.</div>
                    ) : (
                        <ul className="space-y-4">
                            {trendingLists.map(list => (
                                <li key={list.id} className="border rounded p-4 bg-white">
                                    <Link href={`/lists/${list.id}`} className="font-semibold hover:underline text-lg">
                                        {list.name}
                                    </Link>
                                    {list.description && <div className="text-zinc-500 mt-1">{list.description}</div>}
                                    <div className="text-xs text-zinc-400 mt-2">Created by: {list.createdBy || "Unknown"}</div>
                                    <div className="text-xs text-zinc-400">Created at: {list.createdAt ? list.createdAt.toLocaleString() : ""}</div>
                                    <div className="text-xs text-emerald-600">Karma: {list.karma ?? 0}</div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}