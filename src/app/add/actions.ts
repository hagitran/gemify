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
  ambiance?: string;
}) {
  // Compose the insert object
  const insertObj: Record<string, unknown> = {
    name: place.name,
    city: place.city === "San Francisco" ? "sf" : "hcmc",
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
  // Insert into user_notes if user and notes are present
  if (place.added_by && newPlace && newPlace.id && place.notes) {
    const { error: notesError } = await supabase.from("user_notes").insert([
      {
        user_id: place.added_by,
        place_id: newPlace.id,
        note: place.notes,
      },
    ]);
    if (notesError) return { error: notesError };
  }
  return data;
}
