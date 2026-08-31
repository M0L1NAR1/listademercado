"use client";

import { useCallback, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { createClient } from "@/lib/supabase/client";
import { getHousehold } from "@/lib/household";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ShoppingList, ListItem } from "@/lib/types";

type ListWithItems = ShoppingList & { list_items: ListItem[] };

export default function HistoricoPage() {
  const [lists, setLists] = useState<ListWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteListTarget, setDeleteListTarget] = useState<ListWithItems | null>(
    null
  );
  const [deletingList, setDeletingList] = useState(false);

  const load = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function deleteItem(listId: string, itemId: string) {
    const supabase = createClient();
    await supabase.from("list_items").delete().eq("id", itemId);

    setLists((prev) =>
      prev
        .map((lista) => {
          if (lista.id !== listId) return lista;
          const list_items = lista.list_items.filter((i) => i.id !== itemId);
          const total_gasto = list_items
            .filter((i) => i.comprado && i.preco_pago != null)
            .reduce((sum, i) => sum + Number(i.preco_pago), 0);
          return { ...lista, list_items, total_gasto };
        })
        .filter((lista) => lista.list_items.length > 0)
    );
  }

  async function confirmDeleteList() {
    if (!deleteListTarget) return;

    setDeletingList(true);
    try {
      const supabase = createClient();
      await supabase.from("shopping_lists").delete().eq("id", deleteListTarget.id);
      setLists((prev) => prev.filter((l) => l.id !== deleteListTarget.id));
      setDeleteListTarget(null);
    } finally {
      setDeletingList(false);
    }
  }

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
            const outros = lista.list_items.filter((i) => !i.comprado);
            const itens = [...comprados, ...outros];

            return (
              <div
                key={lista.id}
                className="animate-slide-up rounded-[var(--radius-card)] border border-border bg-surface p-4 shadow-[var(--shadow-card)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-text">{lista.titulo}</p>
                    <p className="text-sm text-text-muted">
                      {lista.completed_at
                        ? formatDate(lista.completed_at)
                        : formatDate(lista.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <p className="text-lg font-bold text-brand-600">
                      {formatCurrency(Number(lista.total_gasto))}
                    </p>
                    <button
                      type="button"
                      onClick={() => setDeleteListTarget(lista)}
                      aria-label="Apagar compra"
                      className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex flex-col gap-2">
                  {itens.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-2 rounded-xl bg-surface-3 px-3 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-text">
                          {item.nome}
                        </p>
                        <p className="text-xs text-text-muted">
                          {item.quantidade} {item.unidade}
                          {item.preco_pago != null &&
                            ` · ${formatCurrency(Number(item.preco_pago))}`}
                        </p>
                      </div>
                      <DeleteButton
                        itemName={item.nome}
                        onConfirm={() => deleteItem(lista.id, item.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      <ConfirmDialog
        open={!!deleteListTarget}
        onClose={() => setDeleteListTarget(null)}
        onConfirm={confirmDeleteList}
        title="Apagar compra"
        message={
          deleteListTarget
            ? `Deseja apagar a compra de ${deleteListTarget.completed_at ? formatDate(deleteListTarget.completed_at) : formatDate(deleteListTarget.created_at)} e todos os ${deleteListTarget.list_items.length} itens?`
            : ""
        }
        confirmLabel="Apagar compra"
        loading={deletingList}
      />
    </>
  );
}
