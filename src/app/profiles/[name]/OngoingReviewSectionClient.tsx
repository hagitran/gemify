"use client";
import { authClient } from "../../lib/auth-client";
import OngoingReviewList from "../../components/OngoingReviewList";

export default function OngoingReviewSectionClient({ profileName, ongoingReviews }: { profileName: string, ongoingReviews: any[] }) {
    const { data: session } = authClient.useSession();
    if (!session?.user?.name || session.user.name !== profileName) return null;
    return (
        <div>
            <h2 className="text-xl font-semibold mb-2">Ongoing finds</h2>
            <OngoingReviewList initialReviews={ongoingReviews} />
        </div>
    );
} 