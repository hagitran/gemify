"use server";

import supabase from "@/supabaseClient";

export async function addPlace(place: {
  name: string;
  city: string;
  type: string;
  address: string;
  description: string;
  imagePath: string;
  price: number;
  notes: string;
  lat?: number;
  long?: number;
  displayName?: string;
  osmId?: string;
}) {
  // Compose the insert object
  const insertObj: any = {
    name: place.name,
    city: place.city,
    type: place.type || "classic",
    display_name: place.displayName || null,
    osm_id: place.osmId || null,
    lat: place.lat ?? null,
    long: place.long ?? null,
    image_path: place.imagePath || null,
    price: place.price ?? 0,
    notes: place.notes || null,
    // description is not in DB, but you may want to add it if you add a column
  };
  const { data, error } = await supabase
    .from("places")
    .insert([insertObj])
    .select();
  if (error) return { error };
  return data;
}
