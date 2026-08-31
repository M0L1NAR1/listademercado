"use client";

import { useEffect, useState } from "react";
import { Home, Leaf } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { getHousehold } from "@/lib/household";
import type { Household } from "@/lib/types";

export default function PerfilPage() {
  const [household, setHousehold] = useState<Household | null>(null);

  useEffect(() => {
    getHousehold().then(setHousehold);
  }, []);

  return (
    <>
      <Header title="Sobre" subtitle="Lista de Mercado" />

      <div className="flex flex-col gap-4 px-5 pb-4">
        <div className="flex flex-col items-center rounded-[var(--radius-card)] bg-surface p-6 shadow-[var(--shadow-card)]">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/40">
            <Leaf size={32} className="text-brand-600" />
          </div>
          <p className="text-lg font-bold text-text">Lista de Mercado</p>
          <p className="mt-1 text-center text-sm text-text-muted">
            App privado para organizar as compras do mês
          </p>
        </div>

        {household && (
          <div className="rounded-[var(--radius-card)] bg-surface p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 dark:bg-brand-900/40">
                <Home size={24} className="text-brand-600" />
              </div>
              <div>
                <p className="font-bold text-text">{household.nome}</p>
                <p className="text-sm text-text-muted">Lista compartilhada</p>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-[var(--radius-card)] bg-brand-50 p-4 dark:bg-brand-900/20">
          <h3 className="mb-2 font-bold text-text">Dicas de uso</h3>
          <ul className="flex flex-col gap-2 text-sm text-text-muted">
            <li>• Registre o preço pago em cada item durante a compra</li>
            <li>• Finalize a lista ao terminar para salvar no histórico</li>
            <li>• Use o comparativo para ver gastos mês a mês</li>
            <li>• Itens frequentes aparecem como sugestão rápida</li>
            <li>• Adicione o app na tela inicial do celular para acesso rápido</li>
          </ul>
        </div>
      </div>
    </>
  );
}
