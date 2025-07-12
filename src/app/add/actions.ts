"use server";

import supabase from "@/supabaseClient";

export async function addPlace(city: string, name: string) {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${name}&format=json`
  );
  const osmData = await response.json();

  // Check if we got a valid place
  if (!osmData || !osmData[0] || !osmData[0].osm_id) {
    return { error: "No valid place found" };
  }

  const placeData = osmData[0];
  console.log(osmData[0]);

  const { data, error } = await supabase
    .from("places")
    .insert([
      {
        name: placeData.name,
        display_name: placeData.display_name,
        type: "classic",
        city: city,
        specific_type: placeData.type ?? null,
        osm_id: String(placeData.osm_id),
        lat: parseFloat(placeData.lat),
        long: parseFloat(placeData.lon),
      },
    ])
    .select();

  if (error) return { error };
  return data;
}
