"use client";

import { useEffect, useState, useMemo } from "react";
import {
  searchLocalProducts,
  historyToSuggestions,
  mergeSuggestions,
} from "@/lib/product-search";
import type { ProductSuggestion } from "@/lib/product-types";
import type { ItemTemplate } from "@/lib/types";

export function useProductSearch(query: string, history: ItemTemplate[] = []) {
  const [remote, setRemote] = useState<ProductSuggestion[]>([]);
  const [loadingRemote, setLoadingRemote] = useState(false);

  const historySuggestions = useMemo(
    () => historyToSuggestions(history, query),
    [history, query]
  );

  const localSuggestions = useMemo(
    () => searchLocalProducts(query),
    [query]
  );

  useEffect(() => {
    if (query.trim().length < 3) {
      setRemote([]);
      setLoadingRemote(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoadingRemote(true);
      try {
        const res = await fetch(
          `/api/products/search?q=${encodeURIComponent(query.trim())}`,
          { signal: controller.signal }
        );
        if (!res.ok) {
          setRemote([]);
          return;
        }
        const data = (await res.json()) as { products: ProductSuggestion[] };
        setRemote(data.products ?? []);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setRemote([]);
        }
      } finally {
        setLoadingRemote(false);
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const suggestions = useMemo(
    () => mergeSuggestions(historySuggestions, localSuggestions, remote),
    [historySuggestions, localSuggestions, remote]
  );

  const showSuggestions = query.trim().length > 0 && suggestions.length > 0;

  return {
    suggestions,
    showSuggestions,
    loadingRemote,
  };
}
