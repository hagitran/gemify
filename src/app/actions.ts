"use server";

import supabase from "../supabaseClient";

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
