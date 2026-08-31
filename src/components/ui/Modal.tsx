"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
};

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-10 w-full max-w-[430px] animate-slide-up overflow-visible rounded-t-[1.5rem] bg-surface p-6 shadow-2xl",
          "pb-[calc(1.5rem+env(safe-area-inset-bottom))]",
          className
        )}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-text">{title}</h2>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-3 text-text-muted"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
