"use server";

import supabase from "../supabaseClient";

export async function getRouteData(city: string, root: string | null) {
  let query = supabase.from("places").select("*").eq("city", city);
  if (root) {
    query = query.eq("type", root.toLowerCase());
  }
  const { data, error } = await query;
  if (error) throw error;
  return data;
}
