"use client";

import { Check, Minus, Plus } from "lucide-react";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { getCategoria } from "@/lib/categories";
import { cn } from "@/lib/utils";
import type { StockItem } from "@/lib/types";

type StockCardProps = {
  item: StockItem;
  selected?: boolean;
  selectable?: boolean;
  onToggleSelect?: (id: string) => void;
  onUpdateQty: (id: string, qty: number) => void;
  onMarkAcabou: (id: string) => void;
  onDelete: (id: string) => void;
};

export function StockCard({
  item,
  selected = false,
  selectable = false,
  onToggleSelect,
  onUpdateQty,
  onMarkAcabou,
  onDelete,
}: StockCardProps) {
  const cat = getCategoria(item.categoria);
  const qty = Number(item.quantidade);
  const acabou = qty <= 0;

  return (
    <div
      className={cn(
        "animate-slide-up rounded-[var(--radius-card)] border bg-surface p-4 shadow-[var(--shadow-card)] transition-all",
        selected ? "border-brand-500 ring-2 ring-brand-500/20" : "border-border",
        acabou && "opacity-80"
      )}
    >
      <div className="flex items-start gap-3">
        {selectable && (
          <button
            type="button"
            onClick={() => onToggleSelect?.(item.id)}
            className={cn(
              "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all",
              selected
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-border hover:border-brand-400"
            )}
          >
            {selected && <Check size={14} strokeWidth={3} />}
          </button>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-lg">{cat.emoji}</span>
            <p className="font-semibold text-text">{item.nome}</p>
            {acabou && (
              <span className="rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-bold uppercase text-danger">
                Acabou
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {!acabou && (
              <div className="flex items-center gap-1 rounded-lg bg-surface-3 px-1">
                <button
                  type="button"
                  onClick={() => onUpdateQty(item.id, Math.max(0, qty - 1))}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:bg-surface"
                >
                  <Minus size={14} />
                </button>
                <span className="min-w-[3rem] text-center text-sm font-medium">
                  {qty} {item.unidade}
                </span>
                <button
                  type="button"
                  onClick={() => onUpdateQty(item.id, qty + 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:bg-surface"
                >
                  <Plus size={14} />
                </button>
              </div>
            )}

            {!acabou && (
              <button
                type="button"
                onClick={() => onMarkAcabou(item.id)}
                className="rounded-full bg-danger/10 px-3 py-1 text-xs font-semibold text-danger"
              >
                Acabou
              </button>
            )}
          </div>
        </div>

        <DeleteButton
          itemName={item.nome}
          onConfirm={() => onDelete(item.id)}
        />
      </div>
    </div>
  );
}
