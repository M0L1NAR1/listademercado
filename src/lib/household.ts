import type { Household } from "@/lib/types";

let cachedHousehold: Household | null = null;

export async function getHousehold(): Promise<Household | null> {
  if (cachedHousehold) return cachedHousehold;

  try {
    const res = await fetch("/api/household");
    if (!res.ok) return null;
    const data = (await res.json()) as Household;
    cachedHousehold = data;
    return data;
  } catch {
    return null;
  }
}

export async function getActiveList(householdId: string) {
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();

  const { data: existing } = await supabase
    .from("shopping_lists")
    .select("*")
    .eq("household_id", householdId)
    .eq("status", "active")
    .maybeSingle();

  if (existing) return existing;

  const { data: newList } = await supabase
    .from("shopping_lists")
    .insert({
      household_id: householdId,
      titulo: "Lista de Mercado",
    })
    .select()
    .single();

  return newList;
}
