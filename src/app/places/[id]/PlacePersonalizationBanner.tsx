"use client";
import { useEffect, useState } from "react";
import { authClient } from "@/app/lib/auth-client";
import supabase from "@/supabaseClient";
import { PlacePersonalizationBannerProps } from "../types";
import Link from "next/link";

interface ExtendedProps extends PlacePersonalizationBannerProps {
    type?: 'default' | 'list';
}

const AMBIANCE_LABELS: Record<string, string> = {
    cozy: "cozy",
    lively: "lively",
    workFriendly: "work-friendly",
    trendy: "trendy",
    traditional: "traditional",
    romantic: "romantic",
};

function placeToPreferences(place: { price?: number; ambiance?: string[] }) {
    const preferences: Record<string, number> = {
        cozy: 0,
        lively: 0,
        workFriendly: 0,
        trendy: 0,
        traditional: 0,
        romantic: 0,
        price: (place.price ?? 0) / 4, // Normalize price to 0-1 range
    };

    for (const amb of place.ambiance ?? []) {
        const key = amb.toLowerCase().replace('-', '') as keyof typeof preferences;
        if (key in preferences) {
            preferences[key] = 1; // Set to 1 if the place has this ambiance
        }
    }

    return preferences;
}

export default function PlacePersonalizationBanner({ place, type = 'default' }: ExtendedProps) {
    const { data: session } = authClient.useSession();
    const [userPref, setUserPref] = useState<Record<string, number> | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPrefs = async () => {
            if (!session?.user?.id) return;
            setLoading(true);
            const { data } = await supabase
                .from("user_preferences")
                .select("*")
                .eq("user_id", session.user.id)
                .maybeSingle();
            setUserPref(data);
            setLoading(false);
        };
        fetchPrefs();
    }, [session?.user?.id]);

    // Compute preferences for this place
    const placePrefs = placeToPreferences(place);

    // Find the strongest ambiance trait for this place
    const placeAmbianceEntries = Object.entries(placePrefs).filter(([key]) => key !== 'price');
    const strongestAmbiance = placeAmbianceEntries.length
        ? placeAmbianceEntries.reduce((a, b) => (a[1] > b[1] ? a : b))
        : null;

    // Find user's strongest and weakest preferences
    let userStrongest: [string, number] | null = null;
    let userWeakest: [string, number] | null = null;
    if (userPref) {
        const userEntries = Object.entries(userPref).filter(([key]) =>
            key !== 'price' &&
            key !== 'created_at' &&
            key !== 'updated_at' &&
            key !== 'user_id'
        );
        if (userEntries.length > 0) {
            userStrongest = userEntries.reduce((a, b) => (a[1] > b[1] ? a : b));
            userWeakest = userEntries.reduce((a, b) => (a[1] < b[1] ? a : b));
        }
    }

    let message = "";
    if (loading) {
        message = "Personalizing...";
    } else if (userPref && strongestAmbiance && userStrongest && userWeakest) {
        const ambianceName = AMBIANCE_LABELS[strongestAmbiance[0]];

        if (strongestAmbiance[0] === userStrongest[0]) {
            message = `You love ${ambianceName} places, and this is one. Definitely try it!`;
        } else if (strongestAmbiance[0] === userWeakest[0]) {
            message = `This place is more ${ambianceName} than your usual picks, but it's still worth a try!`;
        } else {
            const userFavAmbiance = AMBIANCE_LABELS[userStrongest[0]];
            message = `This place is quite ${ambianceName}, while you tend to prefer ${userFavAmbiance} places. Still, try it out?`;
        }
    } else if (strongestAmbiance) {
        const ambianceName = AMBIANCE_LABELS[strongestAmbiance[0]];
        message = `This place is quite ${ambianceName}. Want to give it a spin?`;
    } else {
        message = `Want to give this place a spin?`;
    }

    return (
        <div className={`flex underline decoration-emerald-600 px-4 text-center max-w-xl flex-col ${type === 'list' ? 'text-md py-4 border border-zinc-200 rounded-xl' : 'text-xl sm:text-lg mb-4'}`}>
            {message === "Personalizing..." ?
                <Link href="/login">Sign up to see what we'd recommend.</Link>
                : message
            }
        </div>
    );
}
