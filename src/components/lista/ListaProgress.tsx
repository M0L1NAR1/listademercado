type ListaProgressProps = {
  total: number;
  comprados: number;
  percentual: number;
};

export function ListaProgress({ total, comprados, percentual }: ListaProgressProps) {
  return (
    <div className="rounded-[var(--radius-card)] bg-surface p-4 shadow-[var(--shadow-card)]">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-text-muted">Progresso</span>
        <span className="font-bold text-brand-600">
          {comprados}/{total} itens
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-surface-3">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all duration-500"
          style={{ width: `${percentual}%` }}
        />
      </div>
      <p className="mt-1.5 text-right text-xs font-semibold text-text-muted">
        {percentual}% concluído
      </p>
    </div>
  );
}
