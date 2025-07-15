import supabase from "@/supabaseClient";

export async function getPlaceById(id: number) {
  const { data, error } = await supabase
    .from("places")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function getUserNotesForPlace(placeId: number) {
  // Join user_notes with user to get user name
  const { data, error } = await supabase
    .from("user_notes")
    .select("*, user:user_id(name)")
    .eq("place_id", placeId);

  console.log(data, "data");
  if (error) throw error;
  return data;
}
