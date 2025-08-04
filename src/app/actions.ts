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

interface RawList {
  id: number;
  name: string;
  created_at: string;
  karma: number | null;
  created_by: string;
  place_count: number | null;
  user: {
    name: string | null;
  } | null;
  list_places:
    | {
        place: {
          image_path: string | null;
        } | null;
      }[]
    | null;
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
      .limit(20); // Get more reviews to randomize from

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

    // Randomize the reviews
    const shuffledReviews = transformedReviews
      .sort(() => Math.random() - 0.5)
      .slice(0, 4);

    return { reviews: shuffledReviews };
  } catch (error) {
    console.error("Error in getRecentReviews:", error);
    return { error };
  }
}

export async function getRecommendedLists() {
  try {
    const { data: lists, error } = await supabase
      .from("lists")
      .select(
        `
        id,
        name,
        created_at,
        karma,
        created_by,
        place_count,
        user:created_by(
          name
        ),
        list_places!inner(
          place:place_id(
            image_path
          )
        )
      `
      )
      .order("created_at", { ascending: false })
      .limit(20); // Get more lists to randomize from

    if (error) {
      console.error("Error fetching recommended lists:", error);
      return { lists: [] };
    }

    if (!lists || lists.length === 0) {
      return { lists: [] };
    }

    // Transform the data to match the component interface
    const transformedLists =
      (lists as unknown as RawList[])?.map((list: RawList) => {
        // Get the first place's image as cover image
        const firstPlace = list.list_places?.[0]?.place;
        const coverImage = firstPlace?.image_path || null;

        return {
          id: list.id,
          name: list.name,
          created_at: list.created_at,
          karma: list.karma || 0,
          user: {
            name: Array.isArray(list.user)
              ? list.user[0]?.name
              : list.user?.name || null,
          },
          cover_image: coverImage,
          place_count: list.place_count || 0,
        };
      }) || [];

    // Randomize the lists
    const shuffledLists = transformedLists
      .sort(() => Math.random() - 0.5)
      .slice(0, 4);

    return { lists: shuffledLists };
  } catch (error) {
    console.error("Error in getRecommendedLists:", error);
    return { error };
  }
}
