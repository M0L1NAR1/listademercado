export const CATEGORIAS = [
  { id: "frutas", label: "Frutas", emoji: "🍎" },
  { id: "verduras", label: "Verduras", emoji: "🥬" },
  { id: "carnes", label: "Carnes", emoji: "🥩" },
  { id: "laticinios", label: "Laticínios", emoji: "🧀" },
  { id: "padaria", label: "Padaria", emoji: "🍞" },
  { id: "bebidas", label: "Bebidas", emoji: "🥤" },
  { id: "limpeza", label: "Limpeza", emoji: "🧹" },
  { id: "higiene", label: "Higiene", emoji: "🧴" },
  { id: "mercearia", label: "Mercearia", emoji: "🥫" },
  { id: "outros", label: "Outros", emoji: "📦" },
] as const;

export function getCategoria(id: string) {
  return CATEGORIAS.find((c) => c.id === id) ?? CATEGORIAS[CATEGORIAS.length - 1];
}

export const UNIDADES = ["un", "kg", "g", "L", "ml", "pct", "cx"] as const;
