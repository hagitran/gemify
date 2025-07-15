import supabase from "@/supabaseClient";

export async function getUserByName(name: string) {
  const { data, error } = await supabase
    .from("user")
    .select("*")
    .eq("name", name)
    .single();
  if (error) throw error;
  return data;
}

export async function getUserNotes(userId: string) {
  const { data, error } = await supabase
    .from("user_notes")
    .select("*, place:place_id(name, id, image_path)")
    .eq("user_id", userId);
  if (error) throw error;
  return data;
}
