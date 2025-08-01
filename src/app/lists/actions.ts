import supabase from "@/supabaseClient";
import { List, Place } from "./types";

interface RawListData {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  karma: number | null;
  verified: boolean | null;
  place_count: number | null;
  created_by: { name: string } | { name: string }[];
}

export async function updateListName(
  id: number | string,
  name: string,
  userId: string
) {
  // Check if user is a member of the list
  const { data: memberCheck, error: memberError } = await supabase
    .from("list_members")
    .select("id")
    .eq("list_id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (memberError) throw memberError;
  if (!memberCheck) {
    throw new Error("Unauthorized: User is not a member of this list");
  }

  const { data, error } = await supabase
    .from("lists")
    .update({ name })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getListWithUser(id: number | string): Promise<List> {
  const { data, error } = await supabase
    .from("lists")
    .select(
      "id, name, description, created_by:user(name), created_at, karma, verified, place_count"
    )
    .eq("id", id)
    .single();

  if (error) throw error;

  const listData = data as RawListData;

  // Update view count (karma)
  await supabase
    .from("lists")
    .update({ karma: (listData.karma ?? 0) + 1 })
    .eq("id", id);

  return {
    id: listData.id,
    name: listData.name,
    description: listData.description,
    created_at: listData.created_at,
    karma: (listData.karma ?? 0) + 1, // Return updated count
    verified: listData.verified ?? null,
    place_count: listData.place_count ?? 0,
    createdBy: Array.isArray(listData.created_by)
      ? listData.created_by[0]?.name
      : listData.created_by?.name,
  };
}

export async function getAllLists(): Promise<List[]> {
  const { data, error } = await supabase
    .from("lists")
    .select(
      "id, name, description, created_by:user(name), created_at, karma, verified, place_count"
    )
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((list: RawListData) => ({
    id: list.id,
    name: list.name,
    description: list.description ?? null,
    created_at: list.created_at,
    karma: list.karma ?? 0,
    verified: typeof list.verified === "boolean" ? list.verified : null,
    createdBy: Array.isArray(list.created_by)
      ? list.created_by[0]?.name
      : list.created_by?.name,
    place_count: list.place_count ?? 0,
  }));
}

export async function getListPlaces(listId: number): Promise<Place[]> {
  const { data, error } = await supabase
    .from("list_places")
    .select("place:place_id(*)")
    .eq("list_id", listId)
    .limit(3);

  if (error) throw error;

  return (data || [])
    .map((lp) => lp.place)
    .filter(Boolean) as unknown as Place[];
}

export async function incrementListPlaceCount(listId: number) {
  // First get current count
  const { data: list } = await supabase
    .from("lists")
    .select("place_count")
    .eq("id", listId)
    .single();

  if (list) {
    const { error } = await supabase
      .from("lists")
      .update({ place_count: (list.place_count || 0) + 1 })
      .eq("id", listId);

    if (error) throw error;
  }
}

export async function decrementListPlaceCount(listId: number) {
  // First get current count
  const { data: list } = await supabase
    .from("lists")
    .select("place_count")
    .eq("id", listId)
    .single();

  if (list) {
    const { error } = await supabase
      .from("lists")
      .update({ place_count: Math.max((list.place_count || 0) - 1, 0) })
      .eq("id", listId);

    if (error) throw error;
  }
}

export async function getPlaceReviews(placeId: number) {
  const { data, error } = await supabase
    .from("user_reviews")
    .select(
      `
      id,
      note,
      user_id,
      image_path,
      price,
      ambiance,
      created_at,
      user:user_id(name)
    `
    )
    .eq("place_id", placeId)
    .not("note", "is", null)
    .neq("note", "")
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) throw error;
  return data || [];
}
