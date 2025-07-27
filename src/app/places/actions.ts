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

export async function getUserReviewsForPlace(placeId: number) {
  const { data, error } = await supabase
    .from("user_reviews")
    .select(
      "id, note, user_id, image_path, user:user_id(name), tried, recommended_item, price, ambiance, place_id, created_at"
    )
    .eq("place_id", placeId);
  console.log(error, "popopop");
  if (error) throw error;
  return data;
}

export async function addReview({
  place_id,
  user_id,
  note,
  image_path,
  tried = false,
  recommended_item = null,
  price = null,
  ambiance = null,
}: {
  place_id: number;
  user_id: string;
  note: string;
  image_path?: string;
  tried?: boolean;
  recommended_item?: string | null;
  price?: number | null;
  ambiance?: string | null;
}) {
  const { data, error } = await supabase
    .from("user_reviews")
    .insert([
      {
        place_id,
        user_id,
        note,
        image_path,
        tried,
        recommended_item,
        price,
        ambiance,
      },
    ])
    .select(
      "id, note, user_id, image_path, tried, recommended_item, price, ambiance, place_id, created_at"
    );
  console.log("weriofh", error);
  if (error) return { error };
  return data;
}

export async function addUserReview({
  user_id,
  place_id,
}: {
  user_id: string;
  place_id: number;
}) {
  const { data, error } = await supabase.from("user_reviews").insert([
    {
      user_id,
      place_id,
      tried: false,
      recommended_item: null,
      price: null,
      ambiance: null,
    },
  ]);
  if (error) return { error };
  return data;
}

export async function deleteReview(reviewId: number) {
  const { error } = await supabase
    .from("user_reviews")
    .delete()
    .eq("id", reviewId);
  if (error) throw error;
  return true;
}

export async function recordPlaceView({
  user_id,
  place_id,
}: {
  user_id: string;
  place_id: number;
}) {
  // Try to fetch existing review
  const { data, error } = await supabase
    .from("user_reviews")
    .select("id, view_count")
    .eq("user_id", user_id)
    .eq("place_id", place_id)
    .maybeSingle();

  if (!error && data) {
    // Row exists, increment view_count and update last_viewed_at
    const currentViewCount = data.view_count || 0;
    const { error: updateError } = await supabase
      .from("user_reviews")
      .update({
        view_count: currentViewCount + 1,
        last_viewed_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (updateError) return { error: updateError };
    return { success: true };
  }

  // If no row exists, insert a new one
  const { error: insertError } = await supabase.from("user_reviews").insert([
    {
      user_id,
      place_id,
      view_count: 1,
      last_viewed_at: new Date().toISOString(),
    },
  ]);
  if (insertError) return { error: insertError };
  return { success: true };
}

export async function addPlaceTolist({
  list_id,
  place_id,
}: {
  list_id: number;
  place_id: number;
}) {
  // Check if already exists
  const { data: existing, error: checkError } = await supabase
    .from("list_places")
    .select("id")
    .eq("list_id", list_id)
    .eq("place_id", place_id)
    .maybeSingle();
  if (checkError) return { error: checkError };
  if (existing) return { error: "Place already in list." };
  // Insert
  const { error } = await supabase
    .from("list_places")
    .insert([{ list_id, place_id }]);
  if (error) return { error };
  return { success: true };
}
