"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { createClient } from "@/lib/supabase/client";
import { getHousehold } from "@/lib/household";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ShoppingList, ListItem } from "@/lib/types";

type ListWithItems = ShoppingList & { list_items: ListItem[] };

export default function HistoricoPage() {
  const [lists, setLists] = useState<ListWithItems[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const household = await getHousehold();
      if (!household) {
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const { data } = await supabase
        .from("shopping_lists")
        .select("*, list_items(*)")
        .eq("household_id", household.id)
        .eq("status", "completed")
        .order("completed_at", { ascending: false });

      setLists((data ?? []) as ListWithItems[]);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <Header title="Histórico" subtitle="Compras anteriores" />

      <div className="flex flex-col gap-3 px-5 pb-4">
        {lists.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <p className="text-5xl">📋</p>
            <p className="mt-4 text-lg font-semibold text-text">
              Nenhuma compra finalizada
            </p>
            <p className="mt-1 text-sm text-text-muted">
              Finalize uma lista para ver o histórico
            </p>
          </div>
        ) : (
          lists.map((lista) => {
            const comprados = lista.list_items.filter((i) => i.comprado);
            return (
              <div
                key={lista.id}
                className="animate-slide-up rounded-[var(--radius-card)] border border-border bg-surface p-4 shadow-[var(--shadow-card)]"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-text">{lista.titulo}</p>
                    <p className="text-sm text-text-muted">
                      {lista.completed_at
                        ? formatDate(lista.completed_at)
                        : formatDate(lista.created_at)}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-brand-600">
                    {formatCurrency(Number(lista.total_gasto))}
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {comprados.slice(0, 6).map((item) => (
                    <span
                      key={item.id}
                      className="rounded-full bg-surface-3 px-2.5 py-1 text-xs font-medium text-text-muted"
                    >
                      {item.nome}
                    </span>
                  ))}
                  {comprados.length > 6 && (
                    <span className="rounded-full bg-surface-3 px-2.5 py-1 text-xs font-medium text-text-muted">
                      +{comprados.length - 6}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
