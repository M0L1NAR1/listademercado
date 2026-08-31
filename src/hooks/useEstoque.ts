"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getHousehold, getActiveList } from "@/lib/household";
import type { StockItem, Household } from "@/lib/types";

export function useEstoque() {
  const [household, setHousehold] = useState<Household | null>(null);
  const [items, setItems] = useState<StockItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    const h = await getHousehold();
    if (!h) {
      setLoading(false);
      return;
    }
    setHousehold(h);

    const supabase = createClient();
    const { data } = await supabase
      .from("stock_items")
      .select("*")
      .eq("household_id", h.id)
      .order("nome");

    setItems((data ?? []) as StockItem[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!household) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`stock-${household.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "stock_items",
          filter: `household_id=eq.${household.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setItems((prev) =>
              [...prev, payload.new as StockItem].sort((a, b) =>
                a.nome.localeCompare(b.nome)
              )
            );
          } else if (payload.eventType === "UPDATE") {
            setItems((prev) =>
              prev
                .map((i) =>
                  i.id === (payload.new as StockItem).id
                    ? (payload.new as StockItem)
                    : i
                )
                .sort((a, b) => a.nome.localeCompare(b.nome))
            );
          } else if (payload.eventType === "DELETE") {
            const deletedId = (payload.old as StockItem).id;
            setItems((prev) => prev.filter((i) => i.id !== deletedId));
            setSelected((prev) => {
              const next = new Set(prev);
              next.delete(deletedId);
              return next;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [household]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAcabou() {
    setSelected(new Set(items.filter((i) => Number(i.quantidade) <= 0).map((i) => i.id)));
  }

  function clearSelection() {
    setSelected(new Set());
  }

  async function updateQty(id: string, qty: number) {
    const supabase = createClient();

    if (qty <= 0) {
      await supabase
        .from("stock_items")
        .update({
          quantidade: 0,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      return;
    }

    await supabase
      .from("stock_items")
      .update({
        quantidade: qty,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
  }

  async function markAcabou(id: string) {
    await updateQty(id, 0);
  }

  async function deleteItem(id: string) {
    const supabase = createClient();
    await supabase.from("stock_items").delete().eq("id", id);
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  async function sendToList() {
    if (!household || selected.size === 0) return;

    setSending(true);
    try {
      const supabase = createClient();
      const activeList = await getActiveList(household.id);
      if (!activeList) return;

      const toSend = items.filter((i) => selected.has(i.id));
      const { data: existingItems } = await supabase
        .from("list_items")
        .select("nome")
        .eq("list_id", activeList.id);

      const existingNames = new Set(
        (existingItems ?? []).map((i) => i.nome.toLowerCase())
      );

      const newItems = toSend
        .filter((i) => !existingNames.has(i.nome.toLowerCase()))
        .map((item, index) => ({
          list_id: activeList.id,
          nome: item.nome,
          quantidade: 1,
          unidade: item.unidade,
          categoria: item.categoria,
          ordem: index,
        }));

      if (newItems.length > 0) {
        await supabase.from("list_items").insert(newItems);
      }

      clearSelection();
    } finally {
      setSending(false);
    }
  }

  const acabou = items.filter((i) => Number(i.quantidade) <= 0);
  const emEstoque = items.filter((i) => Number(i.quantidade) > 0);

  return {
    household,
    items,
    emEstoque,
    acabou,
    selected,
    loading,
    sending,
    toggleSelect,
    selectAcabou,
    clearSelection,
    updateQty,
    markAcabou,
    deleteItem,
    sendToList,
    reload: load,
  };
}
