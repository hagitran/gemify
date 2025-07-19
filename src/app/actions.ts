"use server";

import supabase from "../supabaseClient";

export async function getRouteData(city: string, root: string) {
  console.log(JSON.stringify(city), root);
  let query = supabase
    .from("places")
    .select("*")
    .eq("city", city)
    .order("karma", { ascending: false });
  if (root && root !== "All") {
    query = query.eq("type", root.toLowerCase());
  }
  const { data, error } = await query;
  if (error) throw error;
  return data;
}
