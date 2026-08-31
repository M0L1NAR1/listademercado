"use client";

import { useState, useRef, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ProductAutocomplete } from "@/components/lista/ProductAutocomplete";
import { CATEGORIAS, UNIDADES } from "@/lib/categories";
import { useProductSearch } from "@/hooks/useProductSearch";
import type { ProductSuggestion } from "@/lib/product-types";
import type { ItemTemplate } from "@/lib/types";

type AddItemFormProps = {
  onAdd: (item: {
    nome: string;
    quantidade: number;
    unidade: string;
    categoria: string;
    preco_estimado: number | null;
  }) => void;
  suggestions?: ItemTemplate[];
};

export function AddItemForm({ onAdd, suggestions = [] }: AddItemFormProps) {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [quantidade, setQuantidade] = useState("1");
  const [unidade, setUnidade] = useState("un");
  const [categoria, setCategoria] = useState("outros");
  const [preco, setPreco] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [pickerOpen, setPickerOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);

  const { suggestions: autocomplete, showSuggestions, loadingRemote } =
    useProductSearch(nome, suggestions);

  const showPicker =
    pickerOpen && showSuggestions && autocomplete.length > 0;

  useEffect(() => {
    setHighlightIndex(-1);
  }, [nome]);

  function resetForm() {
    setNome("");
    setQuantidade("1");
    setUnidade("un");
    setCategoria("outros");
    setPreco("");
    setHighlightIndex(-1);
    setPickerOpen(false);
  }

  function submitItem() {
    if (!nome.trim()) return;

    onAdd({
      nome: nome.trim(),
      quantidade: parseFloat(quantidade) || 1,
      unidade,
      categoria,
      preco_estimado: preco ? parseFloat(preco.replace(",", ".")) : null,
    });

    resetForm();
    setOpen(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    submitItem();
  }

  function selectSuggestion(item: ProductSuggestion) {
    setNome(item.nome);
    setCategoria(item.categoria);
    setUnidade(item.unidade);
    setHighlightIndex(-1);
    setPickerOpen(false);
    inputRef.current?.focus();
  }

  function quickAdd(suggestion: ItemTemplate) {
    onAdd({
      nome: suggestion.nome,
      quantidade: 1,
      unidade: "un",
      categoria: suggestion.categoria,
      preco_estimado: suggestion.preco_medio,
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showPicker || autocomplete.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) =>
        i < autocomplete.length - 1 ? i + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) =>
        i > 0 ? i - 1 : autocomplete.length - 1
      );
    } else if (e.key === "Enter" && highlightIndex >= 0) {
      e.preventDefault();
      selectSuggestion(autocomplete[highlightIndex]);
    } else if (e.key === "Escape") {
      setHighlightIndex(-1);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-[calc(50%-195px)] z-30 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-[var(--shadow-float)] transition-transform active:scale-95"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Adicionar item">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div ref={anchorRef} className="relative">
            <Input
              label="Nome do item"
              placeholder="Ex: Leite integral"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              onFocus={() => setPickerOpen(true)}
              onBlur={() => {
                window.setTimeout(() => setPickerOpen(false), 150);
              }}
              onKeyDown={handleKeyDown}
              ref={inputRef}
              autoFocus
              autoComplete="off"
            />
            <ProductAutocomplete
              anchorRef={anchorRef}
              suggestions={autocomplete}
              visible={showPicker}
              loading={loadingRemote}
              onSelect={selectSuggestion}
              highlightIndex={highlightIndex}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Quantidade"
              type="number"
              min="0.5"
              step="0.5"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-muted">
                Unidade
              </label>
              <select
                value={unidade}
                onChange={(e) => setUnidade(e.target.value)}
                className="h-12 rounded-[var(--radius-btn)] border border-border bg-surface px-3 text-base"
              >
                {UNIDADES.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Input
            label="Preço estimado (opcional)"
            placeholder="R$ 0,00"
            inputMode="decimal"
            value={preco}
            onChange={(e) => setPreco(e.target.value)}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-muted">
              Categoria
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIAS.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoria(cat.id)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    categoria === cat.id
                      ? "bg-brand-600 text-white"
                      : "bg-surface-3 text-text-muted"
                  }`}
                >
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>
          </div>

          {suggestions.length > 0 && !nome.trim() && (
            <div>
              <p className="mb-2 text-sm font-medium text-text-muted">
                Comprados antes
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestions.slice(0, 8).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => quickAdd(s)}
                    className="rounded-full bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                  >
                    + {s.nome}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button type="submit" fullWidth size="lg">
            Adicionar à lista
          </Button>
        </form>
      </Modal>
    </>
  );
}
