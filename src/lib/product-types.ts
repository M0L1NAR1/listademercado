export type ProdutoComum = {
  nome: string;
  categoria: string;
  unidade: string;
};

export type ProductSuggestion = {
  nome: string;
  categoria: string;
  unidade: string;
  source: "local" | "history" | "openfoodfacts";
};
