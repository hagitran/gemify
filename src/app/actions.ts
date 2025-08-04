"use server";

import supabase from "../supabaseClient";

interface RawReview {
  id: number;
  note: string;
  price: number | null;
  ambiance: string | null;
  created_at: string;
  place: {
    id: number;
    name: string;
    type: string | null;
    city: string | null;
    image_path: string | null;
  } | null;
  user: {
    name: string | null;
  } | null;
}

export async function getRouteData(
  city: string,
  root: string,
  sortBy: "view_count" | "created_at" = "view_count"
) {
  let query = supabase
    .from("places")
    .select("*")
    .eq("city", city)
    .order(sortBy, { ascending: false });
  if (root && root !== "All") query = query.eq("type", root.toLowerCase());
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getRecentReviews() {
  try {
    const { data: reviews, error } = await supabase
      .from("user_reviews")
      .select(
        `
        id,
        note,
        price,
        ambiance,
        created_at,
        place:place_id(
          id,
          name,
          type,
          city,
          image_path
        ),
        user:user_id(
          name
        )
      `
      )
      .not("note", "is", null)
      .neq("note", "")
      .order("created_at", { ascending: false })
      .limit(4);

    if (error) {
      console.error("Error fetching recent reviews:", error);
      return { error };
    }

    // Transform the data to match the component interface
    const transformedReviews =
      (reviews as unknown as RawReview[])?.map((review: RawReview) => ({
        id: review.id,
        note: review.note,
        price: review.price,
        ambiance: review.ambiance,
        created_at: review.created_at,
        place: {
          id: review.place?.id || 0,
          name: review.place?.name || "",
          type: review.place?.type || null,
          city: review.place?.city || null,
          image_path: review.place?.image_path || null,
        },
        user: {
          name: review.user?.name || null,
        },
      })) || [];

    return { reviews: transformedReviews };
  } catch (error) {
    console.error("Error in getRecentReviews:", error);
    return { error };
  }
}
