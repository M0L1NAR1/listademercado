"use client";

import { useEffect, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { History, Globe, ShoppingBasket } from "lucide-react";
import { getCategoria } from "@/lib/categories";
import type { ProductSuggestion } from "@/lib/product-types";
import { cn } from "@/lib/utils";

type ProductAutocompleteProps = {
  anchorRef: RefObject<HTMLElement | null>;
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
  anchorRef,
  suggestions,
  visible,
  loading,
  onSelect,
  highlightIndex = -1,
}: ProductAutocompleteProps) {
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!visible || !anchorRef.current) {
      setPosition(null);
      return;
    }

    const updatePosition = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [visible, anchorRef, suggestions.length]);

  if (!mounted || !visible || !position) return null;

  return createPortal(
    <div
      className="fixed z-[9999] max-h-56 overflow-y-auto rounded-[var(--radius-btn)] border border-border bg-surface shadow-[var(--shadow-card)]"
      style={{
        top: position.top,
        left: position.left,
        width: position.width,
      }}
    >
      {suggestions.map((item, index) => {
        const cat = getCategoria(item.categoria);
        const meta = SOURCE_LABEL[item.source];
        const Icon = meta.icon;

        return (
          <button
            key={`${item.source}-${item.nome}-${index}`}
            type="button"
            onPointerDown={(e) => e.preventDefault()}
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
    </div>,
    document.body
  );
}
