"use client";

import { useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { StockCard } from "@/components/estoque/StockCard";
import { useEstoque } from "@/hooks/useEstoque";

export default function EstoquePage() {
  const router = useRouter();
  const {
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
  } = useEstoque();

  async function handleSendToList() {
    await sendToList();
    router.push("/lista");
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
      <Header title="Estoque" subtitle={household?.nome ?? "Nossa Casa"} />

      <div className="flex flex-col gap-4 px-5 pb-28">
        {items.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <p className="text-5xl">📦</p>
            <p className="mt-4 text-lg font-semibold text-text">Estoque vazio</p>
            <p className="mt-1 text-sm text-text-muted">
              Itens marcados como comprados na lista aparecem aqui
            </p>
          </div>
        ) : (
          <>
            {acabou.length > 0 && (
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-bold uppercase tracking-wide text-danger">
                    Acabou ({acabou.length})
                  </h2>
                  <button
                    type="button"
                    onClick={selectAcabou}
                    className="text-xs font-semibold text-brand-600"
                  >
                    Selecionar todos
                  </button>
                </div>
                <div className="flex flex-col gap-3">
                  {acabou.map((item) => (
                    <StockCard
                      key={item.id}
                      item={item}
                      selectable
                      selected={selected.has(item.id)}
                      onToggleSelect={toggleSelect}
                      onUpdateQty={updateQty}
                      onMarkAcabou={markAcabou}
                      onDelete={deleteItem}
                    />
                  ))}
                </div>
              </section>
            )}

            {emEstoque.length > 0 && (
              <section>
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-text-muted">
                  Em casa ({emEstoque.length})
                </h2>
                <div className="flex flex-col gap-3">
                  {emEstoque.map((item) => (
                    <StockCard
                      key={item.id}
                      item={item}
                      selectable
                      selected={selected.has(item.id)}
                      onToggleSelect={toggleSelect}
                      onUpdateQty={updateQty}
                      onMarkAcabou={markAcabou}
                      onDelete={deleteItem}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {selected.size > 0 && (
        <div className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-1/2 z-30 w-full max-w-[430px] -translate-x-1/2 px-5">
          <div className="flex gap-2 rounded-[var(--radius-card)] border border-border bg-surface p-3 shadow-[var(--shadow-float)]">
            <Button
              variant="ghost"
              onClick={clearSelection}
              className="shrink-0"
            >
              Limpar
            </Button>
            <Button
              fullWidth
              size="lg"
              onClick={handleSendToList}
              disabled={sending}
            >
              <ShoppingCart size={18} className="mr-2" />
              {sending
                ? "Enviando..."
                : `Enviar ${selected.size} para lista`}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
