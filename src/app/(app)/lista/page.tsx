"use client";

import { CheckCircle2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { ListaProgress } from "@/components/lista/ListaProgress";
import { TotalGasto } from "@/components/lista/TotalGasto";
import { ItemCard } from "@/components/lista/ItemCard";
import { AddItemForm } from "@/components/lista/AddItemForm";
import { useLista } from "@/hooks/useLista";
import {
  getListProgress,
  getTotalGasto,
  getTotalEstimado,
} from "@/lib/comparisons";

export default function ListaPage() {
  const {
    household,
    items,
    suggestions,
    loading,
    addItem,
    toggleItem,
    updatePrice,
    updateQty,
    deleteItem,
    finalizarCompra,
  } = useLista();

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  const progress = getListProgress(items);
  const totalGasto = getTotalGasto(items);
  const totalEstimado = getTotalEstimado(items);
  const pendentes = items.filter((i) => !i.comprado);
  const comprados = items.filter((i) => i.comprado);

  return (
    <>
      <Header title="Lista de Mercado" subtitle={household?.nome ?? "Nossa Casa"} />

      <div className="flex flex-col gap-4 px-5 pb-4">
        <ListaProgress {...progress} />
        <TotalGasto totalGasto={totalGasto} totalEstimado={totalEstimado} />

        {pendentes.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-text-muted">
              A comprar ({pendentes.length})
            </h2>
            <div className="flex flex-col gap-3">
              {pendentes.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onToggle={toggleItem}
                  onUpdatePrice={updatePrice}
                  onUpdateQty={updateQty}
                  onDelete={deleteItem}
                />
              ))}
            </div>
          </section>
        )}

        {comprados.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-text-muted">
              No carrinho ({comprados.length})
            </h2>
            <div className="flex flex-col gap-3">
              {comprados.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onToggle={toggleItem}
                  onUpdatePrice={updatePrice}
                  onUpdateQty={updateQty}
                  onDelete={deleteItem}
                />
              ))}
            </div>
          </section>
        )}

        {items.length === 0 && (
          <div className="flex flex-col items-center py-16 text-center">
            <p className="text-5xl">🛒</p>
            <p className="mt-4 text-lg font-semibold text-text">Lista vazia</p>
            <p className="mt-1 text-sm text-text-muted">
              Toque no + para adicionar itens
            </p>
          </div>
        )}

        {progress.total > 0 && progress.comprados === progress.total && (
          <Button onClick={finalizarCompra} fullWidth size="lg" className="mt-2">
            <CheckCircle2 size={20} className="mr-2" />
            Finalizar compra
          </Button>
        )}
      </div>

      <AddItemForm onAdd={addItem} suggestions={suggestions} />
    </>
  );
}
