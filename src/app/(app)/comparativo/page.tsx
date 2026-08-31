"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { createClient } from "@/lib/supabase/client";
import { getHousehold } from "@/lib/household";
import { buildMonthlyComparison } from "@/lib/comparisons";
import { formatCurrency, cn } from "@/lib/utils";
import type { ShoppingList, ListItem, MonthlyComparison } from "@/lib/types";

type ListWithItems = ShoppingList & { list_items: ListItem[] };

export default function ComparativoPage() {
  const [comparison, setComparison] = useState<MonthlyComparison | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const household = await getHousehold();
      if (!household) {
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const { data } = await supabase
        .from("shopping_lists")
        .select("*, list_items(*)")
        .eq("household_id", household.id)
        .in("status", ["completed", "active"]);

      const lists = (data ?? []) as ListWithItems[];
      setComparison(buildMonthlyComparison(lists));
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  if (!comparison) return null;

  const isUp = comparison.diferenca > 0;
  const isDown = comparison.diferenca < 0;
  const maxTotal = Math.max(comparison.totalAtual, comparison.totalAnterior, 1);

  return (
    <>
      <Header
        title="Comparativo"
        subtitle={`${comparison.mesAtual} vs ${comparison.mesAnterior}`}
      />

      <div className="flex flex-col gap-4 px-5 pb-4">
        <div className="rounded-[var(--radius-card)] bg-surface p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted">Gasto este mês</p>
              <p className="text-3xl font-bold text-text">
                {formatCurrency(comparison.totalAtual)}
              </p>
            </div>
            <div
              className={cn(
                "flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-bold",
                isUp && "bg-danger/10 text-danger",
                isDown &&
                  "bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300",
                !isUp && !isDown && "bg-surface-3 text-text-muted"
              )}
            >
              {isUp && <TrendingUp size={16} />}
              {isDown && <TrendingDown size={16} />}
              {!isUp && !isDown && <Minus size={16} />}
              {comparison.percentual !== 0
                ? `${comparison.percentual > 0 ? "+" : ""}${comparison.percentual.toFixed(0)}%`
                : "Igual"}
            </div>
          </div>

          <div className="mt-4 flex items-end gap-3">
            <div className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t-lg bg-brand-600 transition-all"
                style={{
                  height: `${(comparison.totalAtual / maxTotal) * 80}px`,
                  minHeight: comparison.totalAtual > 0 ? "8px" : "4px",
                }}
              />
              <span className="text-[10px] font-medium text-text-muted">Atual</span>
            </div>
            <div className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t-lg bg-surface-3 transition-all"
                style={{
                  height: `${(comparison.totalAnterior / maxTotal) * 80}px`,
                  minHeight: comparison.totalAnterior > 0 ? "8px" : "4px",
                }}
              />
              <span className="text-[10px] font-medium text-text-muted">
                Anterior
              </span>
            </div>
          </div>

          <p className="mt-3 text-center text-sm text-text-muted">
            Mês passado: {formatCurrency(comparison.totalAnterior)}
            {comparison.diferenca !== 0 && (
              <span
                className={cn(
                  "ml-1 font-semibold",
                  isUp ? "text-danger" : "text-brand-600"
                )}
              >
                ({isUp ? "+" : ""}
                {formatCurrency(comparison.diferenca)})
              </span>
            )}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[var(--radius-card)] bg-surface p-4 shadow-[var(--shadow-card)]">
            <p className="text-2xl font-bold text-text">{comparison.itensAtual}</p>
            <p className="text-xs text-text-muted">itens este mês</p>
          </div>
          <div className="rounded-[var(--radius-card)] bg-surface p-4 shadow-[var(--shadow-card)]">
            <p className="text-2xl font-bold text-text-muted">
              {comparison.itensAnterior}
            </p>
            <p className="text-xs text-text-muted">itens mês passado</p>
          </div>
        </div>

        {comparison.soNoMesAnterior.length > 0 && (
          <section className="rounded-[var(--radius-card)] border border-warning/30 bg-warning/5 p-4">
            <div className="mb-3 flex items-center gap-2">
              <AlertCircle size={18} className="text-warning" />
              <h3 className="font-bold text-text">
                Comprou mês passado, não este
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {comparison.soNoMesAnterior.map((nome) => (
                <span
                  key={nome}
                  className="rounded-full bg-surface px-3 py-1 text-sm font-medium text-text"
                >
                  {nome}
                </span>
              ))}
            </div>
          </section>
        )}

        {comparison.soNoMesAtual.length > 0 && (
          <section className="rounded-[var(--radius-card)] border border-brand-200 bg-brand-50 p-4 dark:border-brand-800 dark:bg-brand-900/20">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles size={18} className="text-brand-600" />
              <h3 className="font-bold text-text">Novos este mês</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {comparison.soNoMesAtual.map((nome) => (
                <span
                  key={nome}
                  className="rounded-full bg-brand-100 px-3 py-1 text-sm font-medium text-brand-800 dark:bg-brand-900/40 dark:text-brand-200"
                >
                  {nome}
                </span>
              ))}
            </div>
          </section>
        )}

        {comparison.variacaoPrecos.length > 0 && (
          <section>
            <h3 className="mb-3 font-bold text-text">Variação de preços</h3>
            <div className="flex flex-col gap-2">
              {comparison.variacaoPrecos.slice(0, 10).map((item) => (
                <div
                  key={item.nome}
                  className="flex items-center justify-between rounded-xl bg-surface p-3 shadow-[var(--shadow-card)]"
                >
                  <span className="font-medium text-text">{item.nome}</span>
                  <div className="text-right">
                    <p className="text-sm font-bold text-text">
                      {formatCurrency(item.precoAtual)}
                    </p>
                    <p
                      className={cn(
                        "text-xs font-semibold",
                        item.diferenca > 0
                          ? "text-danger"
                          : item.diferenca < 0
                            ? "text-brand-600"
                            : "text-text-muted"
                      )}
                    >
                      {item.diferenca > 0 ? "+" : ""}
                      {formatCurrency(item.diferenca)}
                      {item.percentual !== 0 &&
                        ` (${item.percentual > 0 ? "+" : ""}${item.percentual.toFixed(0)}%)`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {comparison.totalAtual === 0 && comparison.totalAnterior === 0 && (
          <div className="flex flex-col items-center py-12 text-center">
            <p className="text-5xl">📊</p>
            <p className="mt-4 text-lg font-semibold text-text">Sem dados ainda</p>
            <p className="mt-1 text-sm text-text-muted">
              Finalize compras e registre os valores para ver comparativos
            </p>
          </div>
        )}
      </div>
    </>
  );
}
