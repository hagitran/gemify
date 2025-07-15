import { notFound } from "next/navigation";
import { getUserByName, getUserNotes } from "../actions";
import Link from "next/link";
import supabase from "@/supabaseClient";

export const revalidate = 60;

interface User {
    id: string;
    name: string;
    email: string;
}

interface UserNote {
    id: number;
    note: string;
    user_id: string;
    place?: { id: string; name: string; image_path?: string };
}

export async function generateStaticParams() {
    // Fetch all user names for static generation
    const { data, error } = await supabase.from("user").select("name");
    if (error || !data) return [];
    return data.map((user: { name: string }) => ({ name: user.name }));
}

type Params = Promise<{ name: string }>;

export default async function UserProfilePage({ params }: { params: Params }) {
    const { name } = await params;
    const user: User | null = await getUserByName(name);
    if (!user) return notFound();

    const notes: UserNote[] = await getUserNotes(user.id);

    return (
        <div className="w-full max-w-2xl mx-auto p-4 flex flex-col gap-8">
            <div className="flex flex-col items-center gap-2">
                <div className="w-24 h-24 rounded-full bg-zinc-200 flex items-center justify-center text-4xl font-bold text-zinc-500">
                    {user.name?.[0]?.toUpperCase()}
                </div>
                <h1 className="text-3xl font-bold">{user.name}</h1>
                <div className="text-zinc-500">{user.email}</div>
            </div>
            <div>
                <h2 className="text-xl font-semibold mb-2">Notes</h2>
                {notes && notes.length > 0 ? (
                    <ul className="flex flex-col gap-2">
                        {notes.map((note) => (
                            <li key={note.id} className="bg-zinc-100 rounded p-3">
                                <div className="text-zinc-700">{note.note}</div>
                                {note.place && (
                                    <Link href={`/places/${note.place.id}`} className="text-xs text-zinc-500 hover:text-black cursor-pointer duration-200 mt-1 flex items-center gap-2">
                                        {note.place.name}
                                    </Link>
                                )}
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
