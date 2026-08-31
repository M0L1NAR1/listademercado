"use client";

import { Check, Minus, Plus } from "lucide-react";
import { getCategoria } from "@/lib/categories";
import { formatCurrency, cn } from "@/lib/utils";
import type { ListItem } from "@/lib/types";

type ItemCardProps = {
  item: ListItem;
  onToggle: (id: string) => void;
  onUpdatePrice: (id: string, price: number) => void;
  onUpdateQty: (id: string, qty: number) => void;
  onDelete: (id: string) => void;
};

export function ItemCard({
  item,
  onToggle,
  onUpdatePrice,
  onUpdateQty,
  onDelete,
}: ItemCardProps) {
  const cat = getCategoria(item.categoria);

  return (
    <div
      className={cn(
        "animate-slide-up rounded-[var(--radius-card)] border bg-surface p-4 shadow-[var(--shadow-card)] transition-all",
        item.comprado ? "border-brand-200 opacity-75" : "border-border"
      )}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => onToggle(item.id)}
          className={cn(
            "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all",
            item.comprado
              ? "border-brand-600 bg-brand-600 text-white animate-check"
              : "border-border hover:border-brand-400"
          )}
        >
          {item.comprado && <Check size={14} strokeWidth={3} />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-lg">{cat.emoji}</span>
            <p
              className={cn(
                "font-semibold text-text",
                item.comprado && "line-through text-text-muted"
              )}
            >
              {item.nome}
            </p>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg bg-surface-3 px-1">
              <button
                onClick={() =>
                  onUpdateQty(item.id, Math.max(0.5, Number(item.quantidade) - 1))
                }
                className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:bg-surface"
              >
                <Minus size={14} />
              </button>
              <span className="min-w-[3rem] text-center text-sm font-medium">
                {item.quantidade} {item.unidade}
              </span>
              <button
                onClick={() => onUpdateQty(item.id, Number(item.quantidade) + 1)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:bg-surface"
              >
                <Plus size={14} />
              </button>
            </div>

            <input
              type="text"
              inputMode="decimal"
              placeholder="R$ 0,00"
              defaultValue={
                item.preco_pago != null
                  ? formatCurrency(Number(item.preco_pago))
                  : item.preco_estimado != null
                    ? formatCurrency(Number(item.preco_estimado))
                    : ""
              }
              onBlur={(e) => {
                const val = e.target.value
                  .replace(/[^\d,.-]/g, "")
                  .replace(",", ".");
                const num = parseFloat(val);
                if (!isNaN(num) && num >= 0) {
                  onUpdatePrice(item.id, num);
                }
              }}
              className="h-8 w-24 rounded-lg border border-border bg-surface-2 px-2 text-sm font-semibold text-danger outline-none focus:border-brand-500"
            />
          </div>
        </div>

        <button
          onClick={() => onDelete(item.id)}
          className="shrink-0 text-xs text-text-muted/60 hover:text-danger"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
