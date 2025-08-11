import supabase from "@/supabaseClient";

export async function getUserByName(name: string) {
  const { data, error } = await supabase
    .from("user")
    .select("id, name")
    .eq("name", name)
    .single();
  if (error) console.log(error, "user error");
  return data;
}

export async function getUserReviews(userId: string) {
  const { data, error } = await supabase
    .from("user_reviews")
    .select(
      "id, note, user_id, image_path, tried, recommended_item, price, ambiance, place_id, place:place_id(name, id, image_path)"
    )
    .eq("user_id", userId);
  if (error) throw error;
  return data;
}
