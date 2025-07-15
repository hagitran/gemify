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
  if (error) throw error;
  return data;
}

export async function addNote({
  place_id,
  user_id,
  note,
}: {
  place_id: number;
  user_id: string;
  note: string;
}) {
  const { data, error } = await supabase
    .from("user_notes")
    .insert([{ place_id, user_id, note }])
    .select();
  if (error) return { error };
  return data;
}
