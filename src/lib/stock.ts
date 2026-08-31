import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeItemName } from "@/lib/utils";

type StockInput = {
  nome: string;
  quantidade: number;
  unidade: string;
  categoria: string;
};

export async function addToStock(
  supabase: SupabaseClient,
  householdId: string,
  item: StockInput
) {
  const { data: existing } = await supabase
    .from("stock_items")
    .select("id, quantidade")
    .eq("household_id", householdId)
    .eq("nome_lower", normalizeItemName(item.nome))
    .maybeSingle();

  if (existing) {
    await supabase
      .from("stock_items")
      .update({
        quantidade: Number(existing.quantidade) + item.quantidade,
        unidade: item.unidade,
        categoria: item.categoria,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    return;
  }

  await supabase.from("stock_items").insert({
    household_id: householdId,
    nome: item.nome,
    quantidade: item.quantidade,
    unidade: item.unidade,
    categoria: item.categoria,
  });
}

export async function removeFromStock(
  supabase: SupabaseClient,
  householdId: string,
  item: StockInput
) {
  const { data: existing } = await supabase
    .from("stock_items")
    .select("id, quantidade")
    .eq("household_id", householdId)
    .eq("nome_lower", normalizeItemName(item.nome))
    .maybeSingle();

  if (!existing) return;

  const nextQty = Number(existing.quantidade) - item.quantidade;

  if (nextQty <= 0) {
    await supabase.from("stock_items").delete().eq("id", existing.id);
    return;
  }

  await supabase
    .from("stock_items")
    .update({
      quantidade: nextQty,
      updated_at: new Date().toISOString(),
    })
    .eq("id", existing.id);
}
