"use server";

import supabase from "@/supabaseClient";

export async function addPlace(place: {
  name: string;
  city: string;
  type: string;
  address: string;
  description?: string;
  image_path: string;
  price: number;
  notes: string;
  added_by: string;
  lat?: number;
  long?: number;
  displayName?: string;
  osmId?: string;
  ambiance?: string[];
}) {
  // Compose the insert object
  console.log(place, "place data");
  const insertObj: Record<string, unknown> = {
    name: place.name,
    city: ["sf", "san francisco"].includes(
      (place.city || "").trim().toLowerCase()
    )
      ? "sf"
      : "hcmc",
    type: place.type || "classic",
    display_name: place.displayName || place.address,
    osm_id: place.osmId || null,
    lat: place.lat ?? null,
    long: place.long ?? null,
    image_path: place.image_path || null,
    price: place.price ?? 0,
    added_by: place.added_by || "anon",
    ambiance: place.ambiance || null,
    // description is not in DB, but you may want to add it if you add a column
  };
  const { data, error } = await supabase
    .from("places")
    .insert([insertObj])
    .select();
  if (error) {
    if (error.code === "23505") {
      return { error: "A place with this name and city already exists." };
    }
    return { error };
  }
  const newPlace = Array.isArray(data) ? data[0] : data;
  if (place.added_by && newPlace && newPlace.id && place.notes) {
    const { error: reviewError } = await supabase.from("user_reviews").insert([
      {
        user_id: place.added_by,
        place_id: newPlace.id,
        note: place.notes,
        image_path: place.image_path || null,
        ambiance: Array.isArray(place.ambiance)
          ? place.ambiance.join(",")
          : place.ambiance || null,
        price: place.price ?? null,
        tried: true,
        recommended_item: null,
        // view_count, last_viewed_at: let DB defaults handle these
      },
    ]);
    if (reviewError) return { error: reviewError };
  }
  return data;
}
