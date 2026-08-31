"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getHousehold, getActiveList } from "@/lib/household";
import { addToStock, removeFromStock } from "@/lib/stock";
import type { Household, ListItem, ItemTemplate, ShoppingList } from "@/lib/types";

export function useLista() {
  const [household, setHousehold] = useState<Household | null>(null);
  const [lista, setLista] = useState<ShoppingList | null>(null);
  const [items, setItems] = useState<ListItem[]>([]);
  const [suggestions, setSuggestions] = useState<ItemTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const h = await getHousehold();
    if (!h) {
      setLoading(false);
      return;
    }
    setHousehold(h);

    const activeList = await getActiveList(h.id);
    if (!activeList) {
      setLoading(false);
      return;
    }
    setLista(activeList as ShoppingList);

    const supabase = createClient();
    const { data: listItems } = await supabase
      .from("list_items")
      .select("*")
      .eq("list_id", activeList.id)
      .order("ordem")
      .order("created_at");

    setItems((listItems ?? []) as ListItem[]);

    const { data: templates } = await supabase
      .from("item_templates")
      .select("*")
      .eq("household_id", h.id)
      .order("vezes_comprado", { ascending: false })
      .limit(12);

    setSuggestions((templates ?? []) as ItemTemplate[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!lista) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`list-${lista.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "list_items",
          filter: `list_id=eq.${lista.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setItems((prev) => [...prev, payload.new as ListItem]);
          } else if (payload.eventType === "UPDATE") {
            setItems((prev) =>
              prev.map((i) =>
                i.id === (payload.new as ListItem).id
                  ? (payload.new as ListItem)
                  : i
              )
            );
          } else if (payload.eventType === "DELETE") {
            setItems((prev) =>
              prev.filter((i) => i.id !== (payload.old as ListItem).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [lista]);

  async function addItem(item: {
    nome: string;
    quantidade: number;
    unidade: string;
    categoria: string;
    preco_estimado: number | null;
  }) {
    if (!lista) return;
    const supabase = createClient();
    await supabase.from("list_items").insert({
      list_id: lista.id,
      ...item,
      ordem: items.length,
    });
  }

  async function toggleItem(id: string) {
    const item = items.find((i) => i.id === id);
    if (!item || !household) return;

    const supabase = createClient();
    const nextComprado = !item.comprado;

    await supabase
      .from("list_items")
      .update({
        comprado: nextComprado,
        comprado_em: nextComprado ? new Date().toISOString() : null,
      })
      .eq("id", id);

    const stockItem = {
      nome: item.nome,
      quantidade: Number(item.quantidade),
      unidade: item.unidade,
      categoria: item.categoria,
    };

    if (nextComprado) {
      await addToStock(supabase, household.id, stockItem);
    } else {
      await removeFromStock(supabase, household.id, stockItem);
    }
  }

  async function updatePrice(id: string, price: number) {
    const supabase = createClient();
    await supabase
      .from("list_items")
      .update({ preco_pago: price })
      .eq("id", id);
  }

  async function updateQty(id: string, qty: number) {
    const supabase = createClient();
    await supabase
      .from("list_items")
      .update({ quantidade: qty })
      .eq("id", id);
  }

  async function deleteItem(id: string) {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    const supabase = createClient();

    if (item.comprado && household) {
      await removeFromStock(supabase, household.id, {
        nome: item.nome,
        quantidade: Number(item.quantidade),
        unidade: item.unidade,
        categoria: item.categoria,
      });
    }

    await supabase.from("list_items").delete().eq("id", id);
  }

  async function finalizarCompra() {
    if (!lista) return;
    const supabase = createClient();
    await supabase
      .from("shopping_lists")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", lista.id);

    await supabase.from("shopping_lists").insert({
      household_id: lista.household_id,
      titulo: "Lista de Mercado",
    });

    await load();
  }

  return {
    household,
    lista,
    items,
    suggestions,
    loading,
    addItem,
    toggleItem,
    updatePrice,
    updateQty,
    deleteItem,
    finalizarCompra,
    reload: load,
  };
}
