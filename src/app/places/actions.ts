import supabase from "@/supabaseClient";
import { AddReviewParams, AddUserReviewParams } from "./types";
import { incrementListPlaceCount } from "../lists/actions";

export interface AddPlaceToListParams {
  list_id: number;
  place_id: number;
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
}: AddReviewParams) {
  const { data, error } = await supabase
    .from("user_reviews")
    .upsert(
      [
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
      ],
      {
        onConflict: "user_id,place_id",
      }
    )
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
}: AddUserReviewParams) {
  const { data, error } = await supabase.from("user_reviews").upsert(
    [
      {
        user_id,
        place_id,
        tried: false,
        recommended_item: null,
        price: null,
        ambiance: null,
      },
    ],
    {
      onConflict: "user_id,place_id",
    }
  );
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

export async function addPlaceTolist({
  list_id,
  place_id,
}: AddPlaceToListParams) {
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

  // Update the place count
  try {
    await incrementListPlaceCount(list_id);
  } catch (countError) {
    console.error("Failed to update place count:", countError);
  }

  // Trigger a refresh event
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("listUpdated"));
  }

  return { success: true };
}
