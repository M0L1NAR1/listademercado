import { formatCurrency } from "@/lib/utils";

type TotalGastoProps = {
  totalGasto: number;
  totalEstimado: number;
};

export function TotalGasto({ totalGasto, totalEstimado }: TotalGastoProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-[var(--radius-card)] bg-brand-600 p-4 text-white shadow-[var(--shadow-float)]">
        <p className="text-xs font-medium opacity-80">Gasto até agora</p>
        <p className="mt-1 text-2xl font-bold">{formatCurrency(totalGasto)}</p>
      </div>
      <div className="rounded-[var(--radius-card)] bg-surface p-4 shadow-[var(--shadow-card)]">
        <p className="text-xs font-medium text-text-muted">Estimativa total</p>
        <p className="mt-1 text-2xl font-bold text-text">
          {formatCurrency(totalEstimado)}
        </p>
      </div>
    </div>
  );
}
