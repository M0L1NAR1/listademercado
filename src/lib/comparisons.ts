import {
  startOfMonth,
  endOfMonth,
  subMonths,
  isWithinInterval,
  parseISO,
} from "date-fns";
import type { ListItem, ShoppingList, MonthlyComparison } from "./types";
import { normalizeItemName } from "./utils";

type ListWithItems = ShoppingList & { list_items: ListItem[] };

export function buildMonthlyComparison(
  lists: ListWithItems[],
  referenceDate = new Date()
): MonthlyComparison {
  const mesAtualInicio = startOfMonth(referenceDate);
  const mesAtualFim = endOfMonth(referenceDate);
  const mesAnteriorRef = subMonths(referenceDate, 1);
  const mesAnteriorInicio = startOfMonth(mesAnteriorRef);
  const mesAnteriorFim = endOfMonth(mesAnteriorRef);

  const listasMesAtual = lists.filter((l) => {
    const date = l.completed_at ? parseISO(l.completed_at) : parseISO(l.created_at);
    return isWithinInterval(date, { start: mesAtualInicio, end: mesAtualFim });
  });

  const listasMesAnterior = lists.filter((l) => {
    const date = l.completed_at ? parseISO(l.completed_at) : parseISO(l.created_at);
    return isWithinInterval(date, { start: mesAnteriorInicio, end: mesAnteriorFim });
  });

  const itensAtualMap = new Map<string, { nome: string; preco: number }>();
  const itensAnteriorMap = new Map<string, { nome: string; preco: number }>();

  for (const lista of listasMesAtual) {
    for (const item of lista.list_items.filter((i) => i.comprado)) {
      const key = normalizeItemName(item.nome);
      const preco = item.preco_pago ?? item.preco_estimado ?? 0;
      const existing = itensAtualMap.get(key);
      if (!existing || preco > 0) {
        itensAtualMap.set(key, { nome: item.nome, preco });
      }
    }
  }

  for (const lista of listasMesAnterior) {
    for (const item of lista.list_items.filter((i) => i.comprado)) {
      const key = normalizeItemName(item.nome);
      const preco = item.preco_pago ?? item.preco_estimado ?? 0;
      const existing = itensAnteriorMap.get(key);
      if (!existing || preco > 0) {
        itensAnteriorMap.set(key, { nome: item.nome, preco });
      }
    }
  }

  const compradosAtual = [...itensAtualMap.values()].map((i) => i.nome);
  const compradosAnterior = [...itensAnteriorMap.values()].map((i) => i.nome);

  const soNoMesAnterior = compradosAnterior.filter(
    (nome) => !itensAtualMap.has(normalizeItemName(nome))
  );
  const soNoMesAtual = compradosAtual.filter(
    (nome) => !itensAnteriorMap.has(normalizeItemName(nome))
  );
  const emAmbos = compradosAtual.filter((nome) =>
    itensAnteriorMap.has(normalizeItemName(nome))
  );

  const variacaoPrecos = emAmbos
    .map((nome) => {
      const key = normalizeItemName(nome);
      const atual = itensAtualMap.get(key)!;
      const anterior = itensAnteriorMap.get(key)!;
      const diferenca = atual.preco - anterior.preco;
      const percentual =
        anterior.preco > 0 ? (diferenca / anterior.preco) * 100 : 0;
      return {
        nome: atual.nome,
        precoAtual: atual.preco,
        precoAnterior: anterior.preco,
        diferenca,
        percentual,
      };
    })
    .filter((v) => v.precoAtual > 0 || v.precoAnterior > 0)
    .sort((a, b) => Math.abs(b.diferenca) - Math.abs(a.diferenca));

  const totalAtual = listasMesAtual.reduce((sum, l) => sum + Number(l.total_gasto), 0);
  const totalAnterior = listasMesAnterior.reduce(
    (sum, l) => sum + Number(l.total_gasto),
    0
  );
  const diferenca = totalAtual - totalAnterior;
  const percentual = totalAnterior > 0 ? (diferenca / totalAnterior) * 100 : 0;

  return {
    mesAtual: formatMonth(mesAtualInicio),
    mesAnterior: formatMonth(mesAnteriorInicio),
    totalAtual,
    totalAnterior,
    diferenca,
    percentual,
    itensAtual: compradosAtual.length,
    itensAnterior: compradosAnterior.length,
    compradosAtual,
    compradosAnterior,
    soNoMesAnterior,
    soNoMesAtual,
    emAmbos,
    variacaoPrecos,
  };
}

function formatMonth(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(date);
}

export function getListProgress(items: ListItem[]) {
  const total = items.length;
  const comprados = items.filter((i) => i.comprado).length;
  const percentual = total > 0 ? Math.round((comprados / total) * 100) : 0;
  return { total, comprados, percentual };
}

export function getTotalGasto(items: ListItem[]): number {
  return items
    .filter((i) => i.comprado && i.preco_pago != null)
    .reduce((sum, i) => sum + Number(i.preco_pago), 0);
}

export function getTotalEstimado(items: ListItem[]): number {
  return items.reduce((sum, i) => {
    const preco = i.preco_pago ?? i.preco_estimado ?? 0;
    return sum + Number(preco) * Number(i.quantidade);
  }, 0);
}
