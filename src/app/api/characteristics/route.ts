import { NextResponse } from "next/server";
import computeUserPreferenceVector from "@/app/lib/computeUserPreferenceVector";
import supabase from "@/supabaseClient";

export async function POST(req: Request) {
  const { user_id } = await req.json();
  if (!user_id) {
    return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
  }

  const now = new Date();

  // 1. Check last update timestamp
  const { data: prefRow, error: prefError } = await supabase
    .from("user_preferences")
    .select("updated_at")
    .eq("user_id", user_id)
    .maybeSingle();

  if (prefError) {
    console.error("Error checking preferences:", prefError);
    return NextResponse.json({ error: "DB read error" }, { status: 500 });
  }

  const lastUpdated = prefRow?.updated_at
    ? new Date(prefRow.updated_at)
    : new Date(0);
  const ageMs = now.getTime() - lastUpdated.getTime();

  if (ageMs < 60_000) {
    return NextResponse.json({
      status: "skipped",
      reason: "updated <1min ago",
    });
  }

  // 2. Get latest 50 interactions + place metadata
  const { data: interactions, error: interactionError } = await supabase
    .from("user_interactions")
    .select(
      `
      action,
      count,
      places:place_id (
        price,
        ambiance
      )
    `
    )
    .eq("user_id", user_id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (interactionError) {
    console.error("Error fetching interactions:", interactionError);
    return NextResponse.json({ error: "DB join error" }, { status: 500 });
  }

  if (!interactions || interactions.length === 0) {
    return NextResponse.json({ status: "skipped", reason: "no interactions" });
  }

  // Normalize structure
  const cleanedInteractions = interactions
    .filter((i) => i.places)
    .map((i) => {
      if (Array.isArray(i.places)) {
        throw new Error("Expected i.places to be an object, but got array");
      }
      const place = i.places as { price: number; ambiance: string[] };
      return {
        action: i.action,
        count: i.count,
        price: place.price,
        ambiance: place.ambiance,
      };
    });

  const vector = computeUserPreferenceVector(cleanedInteractions);

  // 3. Upsert user_preferences
  const { error: upsertError } = await supabase.from("user_preferences").upsert(
    {
      user_id,
      ...vector,
      updated_at: now.toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (upsertError) {
    console.error("Error upserting preferences:", upsertError);
    return NextResponse.json({ error: "DB write error" }, { status: 500 });
  }

  return NextResponse.json({ status: "updated", vector });
}
