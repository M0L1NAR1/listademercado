export type Profile = {
  id: string;
  nome: string;
  created_at: string;
};

export type Household = {
  id: string;
  nome: string;
  codigo_convite: string;
  created_by: string;
  created_at: string;
};

export type HouseholdMember = {
  id: string;
  household_id: string;
  user_id: string;
  role: "admin" | "member";
  joined_at: string;
  profiles?: Profile;
};

export type ShoppingList = {
  id: string;
  household_id: string;
  titulo: string;
  status: "active" | "completed" | "archived";
  total_gasto: number;
  notas: string | null;
  created_by: string | null;
  created_at: string;
  completed_at: string | null;
};

export type ListItem = {
  id: string;
  list_id: string;
  nome: string;
  quantidade: number;
  unidade: string;
  categoria: string;
  preco_estimado: number | null;
  preco_pago: number | null;
  comprado: boolean;
  comprado_por: string | null;
  comprado_em: string | null;
  ordem: number;
  created_at: string;
};

export type ItemTemplate = {
  id: string;
  household_id: string;
  nome: string;
  categoria: string;
  preco_medio: number | null;
  vezes_comprado: number;
  ultima_compra: string | null;
};

export type MonthlyComparison = {
  mesAtual: string;
  mesAnterior: string;
  totalAtual: number;
  totalAnterior: number;
  diferenca: number;
  percentual: number;
  itensAtual: number;
  itensAnterior: number;
  compradosAtual: string[];
  compradosAnterior: string[];
  soNoMesAnterior: string[];
  soNoMesAtual: string[];
  emAmbos: string[];
  variacaoPrecos: {
    nome: string;
    precoAtual: number;
    precoAnterior: number;
    diferenca: number;
    percentual: number;
  }[];
};
