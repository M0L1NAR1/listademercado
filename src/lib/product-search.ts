import produtosComuns from "@/data/produtos-comuns.json";
import type { ProductSuggestion, ProdutoComum } from "@/lib/product-types";
import type { ItemTemplate } from "@/lib/types";

const LOCAL_PRODUCTS = produtosComuns as ProdutoComum[];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function scoreMatch(query: string, name: string): number {
  const q = normalize(query);
  const n = normalize(name);
  if (!q) return 0;
  if (n === q) return 100;
  if (n.startsWith(q)) return 80;
  if (n.split(/\s+/).some((w) => w.startsWith(q))) return 60;
  if (n.includes(q)) return 40;
  return 0;
}

export function searchLocalProducts(
  query: string,
  limit = 8
): ProductSuggestion[] {
  if (!query.trim()) return [];

  type Scored = ProductSuggestion & { score: number };

  return (LOCAL_PRODUCTS.map((p) => ({
    nome: p.nome,
    categoria: p.categoria,
    unidade: p.unidade,
    source: "local" as const,
    score: scoreMatch(query, p.nome),
  })) as Scored[])
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ score: _, ...p }) => p);
}

export function historyToSuggestions(
  templates: ItemTemplate[],
  query: string,
  limit = 5
): ProductSuggestion[] {
  const q = normalize(query);
  return templates
    .filter((t) => !q || normalize(t.nome).includes(q))
    .slice(0, limit)
    .map((t) => ({
      nome: t.nome,
      categoria: t.categoria,
      unidade: "un",
      source: "history" as const,
    }));
}

const OFF_TAG_RULES: { pattern: RegExp; categoria: string; unidade?: string }[] =
  [
    { pattern: /fruit|fruta|banana|apple|maçã/i, categoria: "frutas", unidade: "kg" },
    { pattern: /vegetable|verdura|legume|tomato|onion/i, categoria: "verduras", unidade: "kg" },
    { pattern: /meat|carne|chicken|frango|beef|pork|fish|peixe/i, categoria: "carnes", unidade: "kg" },
    { pattern: /dairy|milk|leite|cheese|queijo|yogurt|iogurte/i, categoria: "laticinios", unidade: "un" },
    { pattern: /bread|pão|padaria|bakery/i, categoria: "padaria", unidade: "un" },
    { pattern: /beverage|bebida|drink|soda|juice|suco|water|água/i, categoria: "bebidas", unidade: "L" },
    { pattern: /clean|limpeza|detergent|sabão/i, categoria: "limpeza", unidade: "un" },
    { pattern: /hygiene|higiene|shampoo|soap|sabonete/i, categoria: "higiene", unidade: "un" },
  ];

export function mapOffProduct(
  name: string,
  tags: string[] = []
): Omit<ProductSuggestion, "source"> {
  const joined = tags.join(" ");
  let categoria = "mercearia";
  let unidade = "un";

  for (const rule of OFF_TAG_RULES) {
    if (rule.pattern.test(joined) || rule.pattern.test(name)) {
      categoria = rule.categoria;
      unidade = rule.unidade ?? "un";
      break;
    }
  }

  return {
    nome: formatProductName(name),
    categoria,
    unidade,
  };
}

export function formatProductName(name: string): string {
  const cleaned = name
    .replace(/\s+/g, " ")
    .replace(/,?\s*\d+\s*(g|kg|ml|l|lt|un|pct|pacote|pack).*$/i, "")
    .trim();

  if (!cleaned) return name.trim();

  const lower = cleaned.toLowerCase();
  return lower.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function dedupeSuggestions(
  items: ProductSuggestion[],
  limit = 12
): ProductSuggestion[] {
  const seen = new Set<string>();
  const result: ProductSuggestion[] = [];

  for (const item of items) {
    const key = normalize(item.nome);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
    if (result.length >= limit) break;
  }

  return result;
}

export function mergeSuggestions(
  history: ProductSuggestion[],
  local: ProductSuggestion[],
  remote: ProductSuggestion[]
): ProductSuggestion[] {
  return dedupeSuggestions([...history, ...local, ...remote]);
}
