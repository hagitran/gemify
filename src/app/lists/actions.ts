import supabase from "@/supabaseClient";

export async function updateListName(id: number | string, name: string) {
  const { data, error } = await supabase
    .from("lists")
    .update({ name })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getListWithUser(id: number | string) {
  const { data, error } = await supabase
    .from("lists")
    .select("id, name, description, user:created_by(name), created_at")
    .eq("id", id)
    .single();

  console.log(id, data, "wefoih");
  if (error) throw error;
  return data;
}
