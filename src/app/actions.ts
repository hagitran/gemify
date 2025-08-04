"use server";

import supabase from "../supabaseClient";
import {
  upsertPlace,
  updatePlaceVector,
  deletePlaceVector,
} from "../lib/pinecone/places";
import { InsertPlace, SelectPlace } from "../db/schema";

interface ReviewWithPlaceAndUser {
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

interface TransformedReview {
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
    imagePath: string | null;
  };
  user: {
    name: string | null;
  };
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

export async function addPlace(place: InsertPlace) {
  try {
    const { data, error } = await supabase
      .from("places")
      .insert([place])
      .select()
      .single();

    if (error) return { error };

    // Sync to Pinecone
    try {
      await upsertPlace(data);
    } catch (pineconeError) {
      console.error("Failed to sync place to Pinecone:", pineconeError);
      // Don't fail the entire operation if Pinecone sync fails
    }

    // ... existing review creation code ...
    const newPlace = Array.isArray(data) ? data[0] : data;
    if (place.addedBy && newPlace && newPlace.id && (place as any).notes) {
      const { error: reviewError } = await supabase.from("user_reviews").upsert(
        [
          {
            user_id: place.addedBy,
            place_id: newPlace.id,
            note: (place as any).notes,
            // image_path: place.image_path || null,
            ambiance: Array.isArray(place.ambiance)
              ? place.ambiance.join(",")
              : place.ambiance || null,
            price: place.price ?? null,
            tried: true,
            recommended_item: null,
            // view_count, last_viewed_at: let DB defaults handle these
          },
        ],
        { onConflict: "user_id,place_id" }
      );
      if (reviewError) return { error: reviewError };
    }

    return data;
  } catch (error) {
    console.error("Error adding place:", error);
    return { error };
  }
}

export async function updatePlace(
  placeId: number,
  updates: Partial<InsertPlace>
) {
  try {
    const { data, error } = await supabase
      .from("places")
      .update(updates)
      .eq("id", placeId)
      .select()
      .single();

    if (error) return { error };

    // Sync to Pinecone
    try {
      await updatePlaceVector(data);
    } catch (pineconeError) {
      console.error("Failed to sync place update to Pinecone:", pineconeError);
    }

    return data;
  } catch (error) {
    console.error("Error updating place:", error);
    return { error };
  }
}

export async function deletePlace(placeId: number) {
  try {
    const { error } = await supabase.from("places").delete().eq("id", placeId);

    if (error) return { error };

    // Remove from Pinecone
    try {
      await deletePlaceVector(placeId);
    } catch (pineconeError) {
      console.error("Failed to delete place from Pinecone:", pineconeError);
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting place:", error);
    return { error };
  }
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
    const transformedReviews: TransformedReview[] =
      (reviews as unknown as ReviewWithPlaceAndUser[])?.map((review) => ({
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
          imagePath: review.place?.image_path || null,
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
