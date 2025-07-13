"use server";

import supabase from "../supabaseClient";

export async function getRouteData(city: string, root: string) {
  const { data, error } = await supabase.from("places").select("*");
  if (error) throw error;
  return data;
}
