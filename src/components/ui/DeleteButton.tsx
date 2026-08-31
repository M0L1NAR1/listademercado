"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { cn } from "@/lib/utils";

type DeleteButtonProps = {
  onConfirm: () => void | Promise<void>;
  itemName?: string;
  label?: string;
  className?: string;
  iconOnly?: boolean;
};

export function DeleteButton({
  onConfirm,
  itemName,
  label = "Apagar",
  className,
  iconOnly = true,
}: DeleteButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      await onConfirm();
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={label}
        className={cn(
          "flex shrink-0 items-center justify-center text-text-muted transition-colors hover:text-danger",
          iconOnly ? "h-8 w-8 rounded-full hover:bg-danger/10" : "gap-1.5 text-xs font-semibold",
          className
        )}
      >
        <Trash2 size={iconOnly ? 16 : 14} />
        {!iconOnly && label}
      </button>

      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleConfirm}
        title="Apagar item"
        message={
          itemName
            ? `Deseja apagar "${itemName}"? Essa ação não pode ser desfeita.`
            : "Deseja apagar este item? Essa ação não pode ser desfeita."
        }
        loading={loading}
      />
    </>
  );
}
