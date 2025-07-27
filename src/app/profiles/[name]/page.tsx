import { notFound } from "next/navigation";
import { getUserByName, getUserReviews } from "../actions";
import supabase from "@/supabaseClient";
import OngoingReviewSectionClient from "./OngoingReviewSectionClient";
import ReviewCard from "../../components/ReviewCard";
import { OngoingReview } from "../../components/OngoingReviewList";

export const revalidate = 60;

interface User {
    id: string;
    name: string;
    email: string;
}

interface UserReview {
    id: number;
    user_id: string;
    place_id: number;
    note?: string | null;
    image_path?: string | null;
    tried: boolean | null;
    recommended_item?: string | null;
    price: number;
    ambiance?: string | null;
    user?: { name: string };
    place?: {
        id: number;
        name: string;
        image_path: string | null;
    };
}

interface RawUserReview {
    id: number;
    note: string | null;
    user_id: string | null;
    image_path: string | null;
    tried: boolean | null;
    recommended_item: string | null;
    price: number;
    ambiance: string | null;
    place_id: number;
    place?: {
        id: number;
        name: string;
        image_path: string | null;
    } | {
        id: number;
        name: string;
        image_path: string | null;
    }[];
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

    // const notes: UserNote[] = await getUserNotes(user.id); // Remove if fully migrated
    const reviews: UserReview[] = (await getUserReviews(user.id)).map((r: RawUserReview) => ({
        id: r.id,
        user_id: r.user_id || '',
        place_id: r.place_id,
        note: r.note,
        image_path: r.image_path,
        tried: r.tried,
        recommended_item: r.recommended_item,
        price: r.price,
        ambiance: r.ambiance,
        place: Array.isArray(r.place) ? r.place[0] : r.place,
        user: { name: user.name }
    }));

    const ongoingReviews = reviews.filter(r => r.tried === false && r.place).map(r => ({
        id: r.id,
        place: {
            id: r.place!.id,
            name: r.place!.name,
            city: "",
            type: "",
            image_path: r.place!.image_path || "",
            price: 0,
            added_by: "",
            ambiance: undefined
        }
    })) as OngoingReview[];

    return (
        <div className="w-full max-w-2xl mx-auto p-4 flex flex-col gap-8">
            <div className="flex flex-col items-center gap-2">
                <div className="w-24 h-24 rounded-full bg-zinc-200 flex items-center justify-center text-4xl font-bold text-zinc-500">
                    {user.name?.[0]?.toUpperCase()}
                </div>
                <h1 className="text-3xl font-bold">{user.name}</h1>
                <div className="text-zinc-500">{user.email}</div>
            </div>
            {/* Assume you have access to session and profileName */}
            {/* const { data: session } = authClient.useSession(); */}
            {/* const profileName = ...; */}

            {/* Only render the OngoingReviewList section if the user is the profile owner (user is viewing their own profile). */}
            {/* This part of the code was not provided in the edit_specification, so it's commented out. */}
            {/* {session?.user?.name === profileName && ( */}
            <OngoingReviewSectionClient profileName={user.name} ongoingReviews={ongoingReviews} />
            {/* )} */}
            <div>
                <h2 className="text-xl font-semibold mb-2 py-4">Reviews</h2>
                {(() => {
                    const reviewsWithContent = reviews.filter(review => review.note);
                    return reviewsWithContent.length > 0 ? (
                        <ul className="flex flex-col gap-4">
                            {reviewsWithContent.map((review) => (
                                <li key={review.id}>
                                    <ReviewCard
                                        note={{
                                            id: review.id,
                                            note: review.note!,
                                            user_id: review.user_id,
                                            image_path: review.image_path || "",
                                            user: review.user,
                                            price: review.price,
                                            ambiance: review.ambiance || undefined
                                        }}
                                    />
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-zinc-400">No reviews yet.</div>
                    );
                })()}
            </div>

        </div>
    );
}
