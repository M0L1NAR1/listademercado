"use client";

import { History, Globe, ShoppingBasket } from "lucide-react";
import { getCategoria } from "@/lib/categories";
import type { ProductSuggestion } from "@/lib/product-types";
import { cn } from "@/lib/utils";

type ProductAutocompleteProps = {
  suggestions: ProductSuggestion[];
  visible: boolean;
  loading?: boolean;
  onSelect: (item: ProductSuggestion) => void;
  highlightIndex?: number;
};

const SOURCE_LABEL = {
  history: { icon: History, label: "Comprado antes" },
  local: { icon: ShoppingBasket, label: "Comum" },
  openfoodfacts: { icon: Globe, label: "Open Food Facts" },
} as const;

export function ProductAutocomplete({
  suggestions,
  visible,
  loading,
  onSelect,
  highlightIndex = -1,
}: ProductAutocompleteProps) {
  if (!visible) return null;

  return (
    <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-y-auto rounded-[var(--radius-btn)] border border-border bg-surface shadow-[var(--shadow-card)]">
      {suggestions.map((item, index) => {
        const cat = getCategoria(item.categoria);
        const meta = SOURCE_LABEL[item.source];
        const Icon = meta.icon;

        return (
          <button
            key={`${item.source}-${item.nome}-${index}`}
            type="button"
            onClick={() => onSelect(item)}
            className={cn(
              "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
              highlightIndex === index
                ? "bg-brand-50 dark:bg-brand-900/30"
                : "hover:bg-surface-3"
            )}
          >
            <span className="text-lg">{cat.emoji}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-text">{item.nome}</p>
              <p className="text-xs text-text-muted">
                {cat.label} · {item.unidade}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1 text-[10px] font-medium text-text-muted">
              <Icon size={12} />
              <span className="hidden sm:inline">{meta.label}</span>
            </div>
          </button>
        );
      })}

      {loading && (
        <p className="border-t border-border px-4 py-2 text-center text-xs text-text-muted">
          Buscando mais produtos...
        </p>
      )}
    </div>
  );
}
